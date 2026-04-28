"use server";

import { z } from "zod";
import { protectedActionClient } from "@/lib/action-client";
import { returnValidationErrors } from "next-safe-action";
import { prisma } from "@/lib/prisma";
import { isPast } from "date-fns";
import { startOfDayBrt, endOfDayBrt } from "@/lib/timezone";
import { sendDailyScheduleToGroup } from "@/lib/whatsapp-schedule";
import { PaymentStatus } from "@/generated/prisma/enums";

const inputSchema = z.object({
  serviceId: z.uuid(),
  professionalId: z.uuid(),
  date: z.date(),
  payAfterService: z.boolean().optional(),
  clientName: z.string().min(2).max(100).optional(),
});

function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export const createBooking = protectedActionClient
  .inputSchema(inputSchema)
  .action(
    async ({
      parsedInput: {
        serviceId,
        professionalId,
        date,
        payAfterService,
        clientName,
      },
      ctx: { user },
    }) => {
      if (isPast(date)) {
        returnValidationErrors(inputSchema, {
          _errors: ["Data e hora selecionadas já passaram."],
        });
      }

      const service = await prisma.barbershopService.findUnique({
        where: { id: serviceId },
      });
      if (!service) {
        returnValidationErrors(inputSchema, {
          _errors: [
            "Serviço não encontrado. Por favor, selecione outro serviço.",
          ],
        });
      }

      const professional = await prisma.professional.findUnique({
        where: { id: professionalId },
        include: { barbershop: { select: { ownerId: true } } },
      });
      if (!professional || !professional.isActive) {
        returnValidationErrors(inputSchema, {
          _errors: ["Profissional não encontrado ou indisponível."],
        });
      }
      if (professional.barbershopId !== service.barbershopId) {
        returnValidationErrors(inputSchema, {
          _errors: ["Profissional não pertence a esta barbearia."],
        });
      }
      if (payAfterService && !professional.acceptsPayAfterService) {
        returnValidationErrors(inputSchema, {
          _errors: ["Este profissional não aceita pagamento após o serviço."],
        });
      }

      const isOwner = professional.barbershop.ownerId === user.id;
      const resolvedClientName =
        isOwner && clientName ? clientName.trim() : null;

      const booking = await prisma.$transaction(
        async (tx) => {
          const dayStart = startOfDayBrt(date);
          const dayEnd = endOfDayBrt(date);

          const existingBookings = await tx.booking.findMany({
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

          const newStart = date.getTime();
          const newEnd = newStart + service.durationMinutes * 60 * 1000;

          for (const existing of existingBookings) {
            const existingStart = existing.date.getTime();
            const existingEnd =
              existingStart + existing.service.durationMinutes * 60 * 1000;

            if (!overlaps(newStart, newEnd, existingStart, existingEnd))
              continue;

            // Serviço existente é corrido — verifica vagas
            if (existing.service.continuousSchedule) {
              const maxSlots = existing.service.maxSimultaneous ?? 1;
              const bookingsAtSameSlot = existingBookings.filter(
                (b) =>
                  b.service.continuousSchedule &&
                  b.serviceId === existing.serviceId &&
                  b.date.getTime() === existing.date.getTime(),
              );
              if (bookingsAtSameSlot.length >= maxSlots) {
                throw new Error(
                  "Este horário já atingiu o limite de vagas disponíveis.",
                );
              }
              continue;
            }

            // Serviço novo é corrido — verifica vagas
            if (service.continuousSchedule) {
              const maxSlots = service.maxSimultaneous ?? 1;
              const bookingsAtNewSlot = existingBookings.filter(
                (b) =>
                  b.serviceId === serviceId &&
                  b.date.getTime() === date.getTime(),
              );
              if (bookingsAtNewSlot.length >= maxSlots) {
                throw new Error(
                  "Este horário já atingiu o limite de vagas disponíveis.",
                );
              }
              continue;
            }

            // Nenhum dos dois é corrido — conflito normal
            throw new Error(
              "Este profissional já possui agendamento neste horário.",
            );
          }

          const newBooking = await tx.booking.create({
            data: {
              serviceId,
              professionalId,
              date: date.toISOString(),
              userId: user.id,
              barbershopId: service.barbershopId,
              clientName: resolvedClientName,
            },
          });

          if (payAfterService) {
            await tx.payment.create({
              data: {
                bookingId: newBooking.id,
                professionalId,
                amountInCents: service.priceInCents,
                applicationFeeInCents: 0,
                status: PaymentStatus.PENDING,
                paymentMethod: "pay_after_service",
              },
            });
          }

          return newBooking;
        },
        { isolationLevel: "Serializable" },
      );

      sendDailyScheduleToGroup(professionalId, date).catch((err) =>
        console.error("[WhatsApp] Erro ao enviar agenda:", err),
      );

      return booking;
    },
  );
