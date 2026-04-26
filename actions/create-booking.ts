"use server";

import { z } from "zod";
import { protectedActionClient } from "@/lib/action-client";
import { returnValidationErrors } from "next-safe-action";
import { prisma } from "@/lib/prisma";
import { isPast, addMinutes } from "date-fns";
import { DEFAULT_INTERVAL_MINUTES } from "@/lib/schedule-utils";
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
        include: {
          barbershop: { select: { ownerId: true } },
        },
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

          // Busca todos os agendamentos do dia para esse profissional,
          // trazendo os dados do serviço para checar continuousSchedule
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

          // Intervalo do novo agendamento (em ms)
          const newSlotsNeeded = Math.ceil(
            service.durationMinutes / DEFAULT_INTERVAL_MINUTES,
          );
          const newStart = date.getTime();
          const newEnd = addMinutes(
            date,
            newSlotsNeeded * DEFAULT_INTERVAL_MINUTES,
          ).getTime();

          for (const existing of existingBookings) {
            const existingSlotsNeeded = Math.ceil(
              existing.service.durationMinutes / DEFAULT_INTERVAL_MINUTES,
            );
            const existingStart = existing.date.getTime();
            const existingEnd = addMinutes(
              existing.date,
              existingSlotsNeeded * DEFAULT_INTERVAL_MINUTES,
            ).getTime();

            // Sem sobreposição de intervalo → sem conflito, pula
            const overlaps = newStart < existingEnd && newEnd > existingStart;
            if (!overlaps) continue;

            // ── Caso 1: serviço EXISTENTE é corrido ──────────────────
            // O novo booking entra no mesmo slot se ainda há vagas
            if (existing.service.continuousSchedule) {
              const maxSlots = existing.service.maxSimultaneous ?? 1;

              // Conta quantos bookings já existem nesse slot exato
              const bookingsAtSameSlot = existingBookings.filter((b) => {
                return (
                  b.service.continuousSchedule &&
                  b.serviceId === existing.serviceId &&
                  b.date.getTime() === existing.date.getTime()
                );
              });

              if (bookingsAtSameSlot.length >= maxSlots) {
                throw new Error(
                  "Este horário já atingiu o limite de vagas disponíveis.",
                );
              }
              // Ainda há vagas → permite continuar (não lança erro)
              continue;
            }

            // ── Caso 2: serviço NOVO é corrido ───────────────────────
            // Verifica se o novo serviço ainda tem vagas no slot solicitado
            if (service.continuousSchedule) {
              const maxSlots = service.maxSimultaneous ?? 1;

              const bookingsAtNewSlot = existingBookings.filter((b) => {
                return (
                  b.serviceId === serviceId &&
                  b.date.getTime() === date.getTime()
                );
              });

              if (bookingsAtNewSlot.length >= maxSlots) {
                throw new Error(
                  "Este horário já atingiu o limite de vagas disponíveis.",
                );
              }
              // Ainda há vagas → ok
              continue;
            }

            // ── Caso 3: nenhum dos dois é corrido ────────────────────
            // Conflito normal de agenda
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
