"use server";

import { z } from "zod";
import { professionalActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DayOfWeek } from "@/generated/prisma/enums";
import { DAY_OF_WEEK_LABELS } from "@/lib/day-of-week";
import { formatBrt } from "@/lib/timezone";
import { DEFAULT_INTERVAL_MINUTES } from "@/lib/schedule-utils";
import { addMinutes } from "date-fns";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const dayScheduleSchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  startTime: z.string().regex(timeRegex, "Formato de hora inválido (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Formato de hora inválido (HH:mm)"),
  isAvailable: z.boolean(),
  hasLunchBreak: z.boolean(),
  lunchStartTime: z
    .string()
    .regex(timeRegex, "Formato de hora inválido (HH:mm)"),
  lunchEndTime: z.string().regex(timeRegex, "Formato de hora inválido (HH:mm)"),
});

const inputSchema = z.object({
  schedules: z.array(dayScheduleSchema).length(7),
});

export const updateProfessionalSchedule = professionalActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { schedules }, ctx: { professional } }) => {
    for (const schedule of schedules) {
      if (!schedule.hasLunchBreak || !schedule.isAvailable) continue;

      const now = new Date();
      const futureBookings = await prisma.booking.findMany({
        where: {
          professionalId: professional.id,
          cancelledAt: null,
          date: { gte: now },
        },
        include: {
          service: { select: { durationMinutes: true } },
          user: { select: { name: true } },
        },
      });

      for (const booking of futureBookings) {
        const bookingDay = formatBrt(booking.date, "EEEE").toUpperCase();
        const dayMap: Record<string, DayOfWeek> = {
          "SEGUNDA-FEIRA": DayOfWeek.MONDAY,
          "TERÇA-FEIRA": DayOfWeek.TUESDAY,
          "QUARTA-FEIRA": DayOfWeek.WEDNESDAY,
          "QUINTA-FEIRA": DayOfWeek.THURSDAY,
          "SEXTA-FEIRA": DayOfWeek.FRIDAY,
          SÁBADO: DayOfWeek.SATURDAY,
          DOMINGO: DayOfWeek.SUNDAY,
          MONDAY: DayOfWeek.MONDAY,
          TUESDAY: DayOfWeek.TUESDAY,
          WEDNESDAY: DayOfWeek.WEDNESDAY,
          THURSDAY: DayOfWeek.THURSDAY,
          FRIDAY: DayOfWeek.FRIDAY,
          SATURDAY: DayOfWeek.SATURDAY,
          SUNDAY: DayOfWeek.SUNDAY,
        };

        const bookingDayOfWeek = dayMap[bookingDay];
        if (bookingDayOfWeek !== schedule.dayOfWeek) continue;

        const bookingTime = formatBrt(booking.date, "HH:mm");
        const slotsNeeded = Math.ceil(
          booking.service.durationMinutes / DEFAULT_INTERVAL_MINUTES,
        );

        for (let i = 0; i < slotsNeeded; i++) {
          const slotDate = addMinutes(
            booking.date,
            i * DEFAULT_INTERVAL_MINUTES,
          );
          const slotTime = formatBrt(slotDate, "HH:mm");

          if (
            slotTime >= schedule.lunchStartTime &&
            slotTime < schedule.lunchEndTime
          ) {
            const bookingDateFormatted = formatBrt(booking.date, "dd/MM/yyyy");
            const dayLabel = DAY_OF_WEEK_LABELS[schedule.dayOfWeek];
            throw new Error(
              `Não é possível alterar o intervalo de almoço de ${dayLabel}. ` +
                `Existe um agendamento confirmado em ${bookingDateFormatted} às ${bookingTime} ` +
                `com o cliente ${booking.user.name} que conflita com o novo horário de almoço.`,
            );
          }
        }
      }
    }

    const operations = schedules.map((schedule) =>
      prisma.professionalSchedule.upsert({
        where: {
          professionalId_dayOfWeek: {
            professionalId: professional.id,
            dayOfWeek: schedule.dayOfWeek,
          },
        },
        create: {
          professionalId: professional.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isAvailable: schedule.isAvailable,
          hasLunchBreak: schedule.hasLunchBreak,
          lunchStartTime: schedule.lunchStartTime,
          lunchEndTime: schedule.lunchEndTime,
        },
        update: {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isAvailable: schedule.isAvailable,
          hasLunchBreak: schedule.hasLunchBreak,
          lunchStartTime: schedule.lunchStartTime,
          lunchEndTime: schedule.lunchEndTime,
        },
      }),
    );

    await prisma.$transaction(operations);

    revalidatePath("/dashboard/professional/schedule");
    return { success: true };
  });
