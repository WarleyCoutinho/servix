"use server";

import { actionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_INTERVAL_MINUTES,
  generateTimeSlots,
  getDayOfWeekFromDate,
} from "@/lib/schedule-utils";
import {
  endOfDayBrt,
  formatBrt,
  isTodayBrt,
  startOfDayBrt,
} from "@/lib/timezone";
import { addMinutes } from "date-fns";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

const inputSchema = z.object({
  barbershopId: z.uuid(),
  professionalId: z.uuid(),
  date: z.date(),
  serviceId: z.uuid().optional(),
});

export const getAvailableSlots = actionClient
  .inputSchema(inputSchema)
  .action(
    async ({
      parsedInput: { barbershopId, professionalId, date, serviceId },
    }) => {
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

      // Filtrar slots que caem no intervalo de almoço
      if (professionalSchedule.hasLunchBreak) {
        slots = slots.filter(
          (slot) =>
            slot < professionalSchedule.lunchStartTime ||
            slot >= professionalSchedule.lunchEndTime,
        );
      }

      // Fetch booked bookings WITH service duration
      const bookedBookings = await prisma.booking.findMany({
        where: {
          professionalId,
          date: {
            gte: dayStart,
            lte: dayEnd,
          },
          cancelledAt: null,
        },
        select: {
          date: true,
          service: { select: { durationMinutes: true } },
        },
      });

      // Build a set of ALL occupied time slots (considering duration)
      const occupiedSlots = new Set<string>();
      for (const booking of bookedBookings) {
        const duration = booking.service.durationMinutes;
        const slotsNeeded = Math.ceil(duration / DEFAULT_INTERVAL_MINUTES);
        const startTime = formatBrt(booking.date, "HH:mm");
        occupiedSlots.add(startTime);

        // Mark additional slots that the service occupies
        for (let i = 1; i < slotsNeeded; i++) {
          const nextSlotDate = addMinutes(
            booking.date,
            i * DEFAULT_INTERVAL_MINUTES,
          );
          occupiedSlots.add(formatBrt(nextSlotDate, "HH:mm"));
        }
      }

      // Get the service being booked (if provided) for forward-looking check
      let newServiceDuration = DEFAULT_INTERVAL_MINUTES;
      if (serviceId) {
        const service = await prisma.barbershopService.findUnique({
          where: { id: serviceId },
          select: { durationMinutes: true },
        });
        if (service) {
          newServiceDuration = service.durationMinutes;
        }
      }

      const newServiceSlotsNeeded = Math.ceil(
        newServiceDuration / DEFAULT_INTERVAL_MINUTES,
      );

      // Filter slots: a slot is available only if ALL slots it would occupy are free
      slots = slots.filter((slot) => {
        // Check if this slot itself is occupied
        if (occupiedSlots.has(slot)) return false;

        // For multi-slot services, check if trailing slots are also free
        if (newServiceSlotsNeeded > 1) {
          const slotIndex = slots.indexOf(slot);
          for (let i = 1; i < newServiceSlotsNeeded; i++) {
            const nextSlot = slots[slotIndex + i];
            if (!nextSlot || occupiedSlots.has(nextSlot)) return false;
          }
        }

        return true;
      });

      // Filtrar horários que já passaram se for o dia atual
      if (isTodayBrt(date)) {
        const currentTime = formatBrt(now, "HH:mm");
        slots = slots.filter((slot) => slot > currentTime);
      }

      return { slots };
    },
  );
