"use server";

import { protectedActionClient } from "@/lib/action-client";
import z from "zod";
import { prisma } from "@/lib/prisma";
import { returnValidationErrors } from "next-safe-action";
import { isPast } from "date-fns";
import { stripe } from "@/lib/stripe";
import {
  getEffectiveFee,
  calculatePlatformFeeAmount,
} from "@/lib/platform-fee";
import { isAccountReadyForPayments } from "@/lib/stripe-connect";
import { startOfDayBrt, endOfDayBrt } from "@/lib/timezone";
import type Stripe from "stripe";

const inputSchema = z.object({
  serviceId: z.uuid(),
  date: z.date(),
  professionalId: z.uuid(),
  clientName: z.string().min(2).max(100).optional(),
});

// Verifica sobreposição entre dois intervalos [aStart, aEnd) e [bStart, bEnd)
function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export const createBookingCheckoutSession = protectedActionClient
  .inputSchema(inputSchema)
  .action(
    async ({
      parsedInput: { serviceId, date, professionalId, clientName },
      ctx: { user },
    }) => {
      const service = await prisma.barbershopService.findUnique({
        where: { id: serviceId },
        include: {
          barbershop: {
            select: {
              id: true,
              name: true,
              ownerId: true,
              createdAt: true,
              platformFeePercentage: true,
              feeOverride: true,
            },
          },
        },
      });

      if (!service) {
        returnValidationErrors(inputSchema, {
          serviceId: { _errors: ["Serviço não encontrado."] },
        });
      }

      if (isPast(date)) {
        returnValidationErrors(inputSchema, {
          date: { _errors: ["Data e hora selecionadas já passaram."] },
        });
      }

      const professional = await prisma.professional.findUnique({
        where: { id: professionalId },
      });

      if (!professional) {
        returnValidationErrors(inputSchema, {
          professionalId: { _errors: ["Profissional não encontrado."] },
        });
      }

      if (professional.barbershopId !== service.barbershopId) {
        returnValidationErrors(inputSchema, {
          professionalId: {
            _errors: ["Profissional não pertence a esta barbearia."],
          },
        });
      }

      if (!professional.isActive) {
        returnValidationErrors(inputSchema, {
          professionalId: {
            _errors: ["Este profissional não está disponível no momento."],
          },
        });
      }

      if (
        !professional.stripeAccountId ||
        !isAccountReadyForPayments(professional.stripeAccountStatus)
      ) {
        returnValidationErrors(inputSchema, {
          professionalId: {
            _errors: [
              "Este profissional ainda não configurou o recebimento de pagamentos. Por favor, escolha outro profissional.",
            ],
          },
        });
      }

      const dayStart = startOfDayBrt(date);
      const dayEnd = endOfDayBrt(date);

      const existingBookings = await prisma.booking.findMany({
        where: {
          professionalId,
          date: { gte: dayStart, lte: dayEnd },
          cancelledAt: null,
        },
        include: {
          service: {
            select: {
              durationMinutes: true,
              continuousSchedule: true,
              maxSimultaneous: true,
            },
          },
        },
      });

      // Verifica conflito usando sobreposição real de intervalos
      const newStart = date.getTime();
      const newEnd = newStart + service.durationMinutes * 60 * 1000;

      for (const existing of existingBookings) {
        const existingStart = existing.date.getTime();
        const existingEnd =
          existingStart + existing.service.durationMinutes * 60 * 1000;

        if (!overlaps(newStart, newEnd, existingStart, existingEnd)) continue;

        // Se o serviço existente é horário corrido, verifica se ainda tem vagas
        if (existing.service.continuousSchedule) {
          const concurrent = existingBookings.filter((b) => {
            const bStart = b.date.getTime();
            const bEnd = bStart + b.service.durationMinutes * 60 * 1000;
            return overlaps(newStart, newEnd, bStart, bEnd);
          }).length;

          if (concurrent < (existing.service.maxSimultaneous ?? 1)) continue;
        }

        returnValidationErrors(inputSchema, {
          date: {
            _errors: ["Este profissional já possui agendamento neste horário."],
          },
        });
      }

      const feeResult = getEffectiveFee(service.barbershop);
      const applicationFeeAmount = calculatePlatformFeeAmount(
        service.priceInCents,
        feeResult.feePercentage,
      );

      const paymentMethods: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] =
        [];

      if (professional.acceptsPix) paymentMethods.push("pix");
      if (professional.acceptsCard) paymentMethods.push("card");

      if (paymentMethods.length === 0) {
        throw new Error(
          "Nenhuma forma de pagamento disponível para este profissional.",
        );
      }

      const isOwner = service.barbershop.ownerId === user.id;
      const resolvedClientName =
        isOwner && clientName ? clientName.trim() : undefined;

      const buildSessionParams = (
        methods: Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
      ): Stripe.Checkout.SessionCreateParams => {
        const metadata: Record<string, string> = {
          serviceId: service.id,
          barbershopId: service.barbershopId,
          userId: user.id,
          date: date.toISOString(),
          professionalId: professional.id,
          priceInCents: service.priceInCents.toString(),
          applicationFeeInCents: applicationFeeAmount.toString(),
        };

        if (resolvedClientName) {
          metadata.clientName = resolvedClientName;
        }

        const params: Stripe.Checkout.SessionCreateParams = {
          payment_method_types: methods,
          mode: "payment",
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings?success=true`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
          metadata,
          line_items: [
            {
              price_data: {
                currency: "brl",
                unit_amount: service.priceInCents,
                product_data: {
                  name: `${service.barbershop.name} - ${service.name}`,
                  description: service.description,
                },
              },
              quantity: 1,
            },
          ],
          payment_intent_data: {},
        };

        if (methods.includes("pix")) {
          params.payment_method_options = {
            pix: { expires_after_seconds: 1800 },
          };
        }

        if (professional.stripeAccountId) {
          params.payment_intent_data = {
            application_fee_amount: applicationFeeAmount,
            transfer_data: {
              destination: professional.stripeAccountId,
            },
          };
        }

        return params;
      };

      let checkoutSession;
      let pixFallback = false;

      try {
        checkoutSession = await stripe.checkout.sessions.create(
          buildSessionParams(paymentMethods),
        );
      } catch (error) {
        console.error("Error creating checkout session:", error);

        const errorMessage =
          error instanceof Error ? error.message.toLowerCase() : "";
        const isPixError =
          errorMessage.includes("pix") ||
          errorMessage.includes("payment_method") ||
          errorMessage.includes("payment method");

        if (isPixError && paymentMethods.includes("pix")) {
          console.warn(
            "PIX unavailable for this account, falling back to card-only",
          );
          pixFallback = true;
          checkoutSession = await stripe.checkout.sessions.create(
            buildSessionParams(["card"]),
          );
        } else {
          throw error;
        }
      }

      console.log(
        `Checkout session created: ${checkoutSession.id}${pixFallback ? " (PIX fallback to card)" : ""}`,
      );

      return {
        id: checkoutSession.id,
        url: checkoutSession.url,
        pixFallback,
      };
    },
  );
