"use server";

import { actionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_INTERVAL_MINUTES,
  generateTimeSlots,
  getDayOfWeekFromDate,
} from "@/lib/schedule-utils";
import { TIMEZONE, startOfDayBrt, endOfDayBrt, formatBrt } from "@/lib/timezone";
import { startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

const inputSchema = z.object({
  barbershopId: z.uuid(),
  professionalId: z.uuid(),
  date: z.date(),
});

export const getAvailableSlots = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { barbershopId, professionalId, date } }) => {
    const now = new Date();

    const dayStart = startOfDayBrt(date);
    const dayEnd = endOfDayBrt(date);

    if (dayEnd < now) {
      return { slots: [], message: "Data passada." };
    }

    const dayOfWeek = getDayOfWeekFromDate(date);

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

    if (professional.barbershopId !== barbershopId) {
      returnValidationErrors(inputSchema, {
        professionalId: {
          _errors: ["Profissional não pertence a esta barbearia."],
        },
      });
    }

    const professionalSchedule = professional.schedules[0];

    if (!professionalSchedule || !professionalSchedule.isAvailable) {
      return {
        slots: [],
        message: "Profissional não trabalha neste dia.",
      };
    }

    let slots = generateTimeSlots(
      date,
      professionalSchedule.startTime,
      professionalSchedule.endTime,
      DEFAULT_INTERVAL_MINUTES,
    );

    const bookedBookings = await prisma.booking.findMany({
      where: {
        professionalId,
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
        cancelledAt: null,
      },
      select: { date: true },
    });

    const bookedTimeStrings = new Set(
      bookedBookings.map((b) => formatBrt(b.date, "HH:mm")),
    );

    slots = slots.filter((slot) => !bookedTimeStrings.has(slot));

    const nowBrt = toZonedTime(now, TIMEZONE);
    const dateBrt = toZonedTime(date, TIMEZONE);
    const isToday =
      startOfDay(nowBrt).getTime() === startOfDay(dateBrt).getTime();

    if (isToday) {
      const currentTime = formatBrt(now, "HH:mm");
      slots = slots.filter((slot) => slot > currentTime);
    }

    return { slots };
  });
