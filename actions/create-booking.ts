"use server";

import { z } from "zod";
import { protectedActionClient } from "@/lib/action-client";
import { returnValidationErrors } from "next-safe-action";
import { prisma } from "@/lib/prisma";
import { isPast, addMinutes } from "date-fns";
import { DEFAULT_INTERVAL_MINUTES } from "@/lib/schedule-utils";
import { startOfDayBrt, endOfDayBrt } from "@/lib/timezone";

const inputSchema = z.object({
  serviceId: z.uuid(),
  professionalId: z.uuid(),
  date: z.date(),
});

export const createBooking = protectedActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { serviceId, professionalId, date }, ctx: { user } }) => {
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
        _errors: ["Serviço não encontrado. Por favor, selecione outro serviço."],
      });
    }

    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
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

    const booking = await prisma.$transaction(async (tx) => {
      const dayStart = startOfDayBrt(date);
      const dayEnd = endOfDayBrt(date);

      const existingBookings = await tx.booking.findMany({
        where: {
          professionalId,
          date: { gte: dayStart, lte: dayEnd },
          cancelledAt: null,
        },
        include: { service: { select: { durationMinutes: true } } },
      });

      const newDuration = service.durationMinutes;
      const newSlotsNeeded = Math.ceil(newDuration / DEFAULT_INTERVAL_MINUTES);
      const newStart = date.getTime();
      const newEnd = addMinutes(date, newSlotsNeeded * DEFAULT_INTERVAL_MINUTES).getTime();

      for (const existing of existingBookings) {
        const existingDuration = existing.service.durationMinutes;
        const existingSlotsNeeded = Math.ceil(existingDuration / DEFAULT_INTERVAL_MINUTES);
        const existingStart = existing.date.getTime();
        const existingEnd = addMinutes(existing.date, existingSlotsNeeded * DEFAULT_INTERVAL_MINUTES).getTime();

        if (newStart < existingEnd && newEnd > existingStart) {
          throw new Error("Este profissional já possui agendamento neste horário.");
        }
      }

      return tx.booking.create({
        data: {
          serviceId,
          professionalId,
          date: date.toISOString(),
          userId: user.id,
          barbershopId: service.barbershopId,
        },
      });
    }, { isolationLevel: "Serializable" });

    return booking;
  });
