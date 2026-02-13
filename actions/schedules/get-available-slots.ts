"use server";

import { actionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_INTERVAL_MINUTES,
  generateTimeSlots,
  getDayOfWeekFromDate,
} from "@/lib/schedule-utils";
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

    // date represents midnight in the user's timezone (e.g., 2026-02-13T03:00:00Z for BRT)
    // Use it as the reference for the user's day boundaries
    const userDayStart = new Date(date);
    const userDayEnd = new Date(userDayStart.getTime() + 24 * 60 * 60 * 1000);

    if (userDayEnd < now) {
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

    // Query bookings using user's day boundaries (timezone-safe)
    const bookedBookings = await prisma.booking.findMany({
      where: {
        professionalId,
        date: {
          gte: userDayStart,
          lt: userDayEnd,
        },
        cancelledAt: null,
      },
      select: { date: true },
    });

    // Extract booked times relative to user's day start (timezone-agnostic)
    const bookedTimeStrings = new Set(
      bookedBookings.map((b) => {
        const diffMs = b.date.getTime() - userDayStart.getTime();
        const totalMinutes = Math.round(diffMs / (60 * 1000));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      }),
    );

    // Filter out booked slots
    slots = slots.filter((slot) => !bookedTimeStrings.has(slot));

    // Filter out past slots if booking for today
    const diffFromNow = now.getTime() - userDayStart.getTime();
    const isUserToday = diffFromNow >= 0 && diffFromNow < 24 * 60 * 60 * 1000;

    if (isUserToday) {
      const nowMinutes = Math.floor(diffFromNow / (60 * 1000));
      const nowHours = Math.floor(nowMinutes / 60);
      const nowMins = nowMinutes % 60;
      const currentTime = `${nowHours.toString().padStart(2, "0")}:${nowMins.toString().padStart(2, "0")}`;
      slots = slots.filter((slot) => slot > currentTime);
    }

    return { slots };
  });
