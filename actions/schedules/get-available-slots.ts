"use server";

import { actionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_INTERVAL_MINUTES,
  DEFAULT_OPERATING_HOURS,
  filterAvailableSlots,
  generateTimeSlots,
  getDayOfWeekFromDate,
  getIntersectingSlots,
} from "@/lib/schedule-utils";
import { endOfDay, format, isPast, isToday, startOfDay } from "date-fns";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

const inputSchema = z.object({
  barbershopId: z.uuid(),
  professionalId: z.uuid().optional(),
  date: z.date(),
});

export const getAvailableSlots = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { barbershopId, professionalId, date } }) => {
    const dayOfWeek = getDayOfWeekFromDate(date);

    const barbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
      include: {
        operatingHours: {
          where: { dayOfWeek },
        },
      },
    });

    if (!barbershop) {
      returnValidationErrors(inputSchema, {
        barbershopId: { _errors: ["Barbearia não encontrada."] },
      });
    }

    const operatingHours = barbershop.operatingHours[0];

    if (operatingHours?.isClosed) {
      return { slots: [], message: "Barbearia fechada neste dia." };
    }

    const openTime =
      operatingHours?.openTime ?? DEFAULT_OPERATING_HOURS.openTime;
    const closeTime =
      operatingHours?.closeTime ?? DEFAULT_OPERATING_HOURS.closeTime;

    let barbershopSlots = generateTimeSlots(
      date,
      openTime,
      closeTime,
      DEFAULT_INTERVAL_MINUTES,
    );

    if (professionalId) {
      const professional = await prisma.professional.findUnique({
        where: { id: professionalId },
        include: {
          schedules: {
            where: { dayOfWeek },
          },
        },
      });

      if (!professional) {
        returnValidationErrors(inputSchema, {
          professionalId: { _errors: ["Profissional não encontrado."] },
        });
      }

      if (!professional.isActive) {
        return { slots: [], message: "Profissional não disponível." };
      }

      const professionalSchedule = professional.schedules[0];

      if (professionalSchedule && !professionalSchedule.isAvailable) {
        return {
          slots: [],
          message: "Profissional não trabalha neste dia.",
        };
      }

      if (professionalSchedule) {
        const professionalSlots = generateTimeSlots(
          date,
          professionalSchedule.startTime,
          professionalSchedule.endTime,
          DEFAULT_INTERVAL_MINUTES,
        );
        barbershopSlots = getIntersectingSlots(
          barbershopSlots,
          professionalSlots,
        );
      }

      const bookedBookings = await prisma.booking.findMany({
        where: {
          professionalId,
          date: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
          cancelledAt: null,
        },
        select: { date: true },
      });

      const bookedSlots = bookedBookings.map((b) => b.date);
      barbershopSlots = filterAvailableSlots(
        barbershopSlots,
        bookedSlots,
        date,
      );
    } else {
      const bookedBookings = await prisma.booking.findMany({
        where: {
          barbershopId,
          date: {
            gte: startOfDay(date),
            lte: endOfDay(date),
          },
          cancelledAt: null,
        },
        select: { date: true },
      });

      const bookedSlots = bookedBookings.map((b) => b.date);
      barbershopSlots = filterAvailableSlots(
        barbershopSlots,
        bookedSlots,
        date,
      );
    }

    if (isToday(date)) {
      const now = new Date();
      const currentTime = format(now, "HH:mm");
      barbershopSlots = barbershopSlots.filter((slot) => slot > currentTime);
    }

    if (isPast(date) && !isToday(date)) {
      return { slots: [], message: "Data passada." };
    }

    return { slots: barbershopSlots };
  });
