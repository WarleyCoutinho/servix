"use server";

import { protectedActionClient } from "@/lib/action-client";
import z from "zod";
import { prisma } from "@/lib/prisma";
import { returnValidationErrors } from "next-safe-action";
import { isPast } from "date-fns";
import { stripe, calculatePlatformFee } from "@/lib/stripe";
import { isAccountReadyForPayments } from "@/lib/stripe-connect";
import type Stripe from "stripe";

const inputSchema = z.object({
  serviceId: z.uuid(),
  date: z.date(),
  professionalId: z.uuid().optional(),
});

export const createBookingCheckoutSession = protectedActionClient
  .inputSchema(inputSchema)
  .action(
    async ({ parsedInput: { serviceId, date, professionalId }, ctx: { user } }) => {
      const service = await prisma.barbershopService.findUnique({
        where: {
          id: serviceId,
        },
        include: {
          barbershop: true,
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

      let professional = null;
      if (professionalId) {
        professional = await prisma.professional.findUnique({
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

        const existingBooking = await prisma.booking.findFirst({
          where: {
            professionalId,
            date,
            cancelledAt: null,
          },
        });

        if (existingBooking) {
          returnValidationErrors(inputSchema, {
            date: {
              _errors: [
                "Este profissional já possui agendamento neste horário.",
              ],
            },
          });
        }
      } else {
        const existingBooking = await prisma.booking.findFirst({
          where: {
            barbershopId: service.barbershopId,
            date,
            cancelledAt: null,
          },
        });

        if (existingBooking) {
          returnValidationErrors(inputSchema, {
            date: { _errors: ["Data e hora selecionadas já estão agendadas."] },
          });
        }
      }

      const applicationFeeAmount = calculatePlatformFee(service.priceInCents);

      const paymentMethods: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] = [];

      if (professional) {
        if (professional.acceptsCard) {
          paymentMethods.push("card");
        }
        if (professional.acceptsPix) {
          paymentMethods.push("pix");
        }
      } else {
        paymentMethods.push("card", "pix");
      }

      if (paymentMethods.length === 0) {
        throw new Error("Nenhuma forma de pagamento disponível para este profissional.");
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: paymentMethods,
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}`,
        metadata: {
          serviceId: service.id,
          barbershopId: service.barbershopId,
          userId: user.id,
          date: date.toISOString(),
          professionalId: professionalId ?? "",
          priceInCents: service.priceInCents.toString(),
          applicationFeeInCents: applicationFeeAmount.toString(),
        },
        line_items: [
          {
            price_data: {
              currency: "brl",
              unit_amount: service.priceInCents,
              product_data: {
                name: `${service.barbershop.name} - ${service.name}`,
                description: service.description,
                images: [service.imageUrl],
              },
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {},
      };

      if (paymentMethods.includes("pix")) {
        sessionParams.payment_method_options = {
          pix: {
            expires_after_seconds: 1800,
          },
        };
      }

      if (
        professional?.stripeAccountId &&
        isAccountReadyForPayments(professional.stripeAccountStatus)
      ) {
        sessionParams.payment_intent_data = {
          application_fee_amount: applicationFeeAmount,
          transfer_data: {
            destination: professional.stripeAccountId,
          },
        };
      }

      const checkoutSession = await stripe.checkout.sessions.create(sessionParams);
      return checkoutSession;
    },
  );
