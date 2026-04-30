"use server";

import { actionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { getDayOfWeekFromDate } from "@/lib/schedule-utils";
import {
  startOfDayBrt,
  endOfDayBrt,
  formatBrt,
  isTodayBrt,
  TIMEZONE,
} from "@/lib/timezone";
import {
  addMinutes,
  format,
  setHours,
  setMinutes,
  startOfDay,
  isBefore,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

const MIN_SERVICE_DURATION = 5;

const inputSchema = z.object({
  barbershopId: z.uuid(),
  professionalId: z.uuid(),
  date: z.date(),
  serviceId: z.uuid().optional(),
});

function generateDynamicSlots(
  date: Date,
  startTime: string,
  endTime: string,
  intervalMinutes: number,
): string[] {
  const interval = Math.max(intervalMinutes, MIN_SERVICE_DURATION);
  const slots: string[] = [];

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const dayStart = startOfDay(toZonedTime(date, TIMEZONE));
  let current = setMinutes(setHours(dayStart, startH), startM);
  const end = setMinutes(setHours(dayStart, endH), endM);

  while (isBefore(current, end)) {
    const slotEnd = addMinutes(current, interval);
    if (isBefore(slotEnd, end) || slotEnd.getTime() === end.getTime()) {
      slots.push(format(current, "HH:mm"));
    }
    current = addMinutes(current, interval);
  }

  return slots;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

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
        include: { schedules: { where: { dayOfWeek } } },
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

      const schedule = professional.schedules[0];

      if (!schedule || !schedule.isAvailable) {
        return { slots: [], message: "Profissional não trabalha neste dia." };
      }

      // ── Serviço sendo agendado ───────────────────────────────────────────────
      let serviceDuration = MIN_SERVICE_DURATION;
      let isContinuous = false;
      let maxSimultaneous = 1;

      if (serviceId) {
        const service = await prisma.barbershopService.findUnique({
          where: { id: serviceId },
          select: {
            durationMinutes: true,
            continuousSchedule: true,
            maxSimultaneous: true,
          },
        });
        if (service) {
          serviceDuration = Math.max(
            service.durationMinutes,
            MIN_SERVICE_DURATION,
          );
          isContinuous = service.continuousSchedule ?? false;
          maxSimultaneous = service.maxSimultaneous ?? 1;
        }
      }

      // ── Gera slots ───────────────────────────────────────────────────────────
      let slots = generateDynamicSlots(
        date,
        schedule.startTime,
        schedule.endTime,
        serviceDuration,
      );

      // Remove sobreposição com almoço
      if (schedule.hasLunchBreak) {
        const lunchStart = toMinutes(schedule.lunchStartTime);
        const lunchEnd = toMinutes(schedule.lunchEndTime);
        slots = slots.filter((slot) => {
          const slotStart = toMinutes(slot);
          const slotEnd = slotStart + serviceDuration;
          return !overlaps(slotStart, slotEnd, lunchStart, lunchEnd);
        });
      }

      // ── Agendamentos do dia ──────────────────────────────────────────────────
      const bookedBookings = await prisma.booking.findMany({
        where: {
          professionalId,
          date: { gte: dayStart, lte: dayEnd },
          cancelledAt: null,
        },
        select: {
          date: true,
          serviceId: true,
          service: {
            select: {
              durationMinutes: true,
              continuousSchedule: true,
              maxSimultaneous: true,
            },
          },
        },
      });

      // ── Monta ocupação separando corridos de normais ──────────────────────────
      //
      // normalOccupancy: slot → contagem de agendamentos NORMAIS sobrepostos
      // continuousOccupancy: (serviceId+slot) → contagem de agendamentos CORRIDOS
      //
      // Regra:
      // - Serviço NORMAL sendo agendado:
      //     bloqueado se normalOccupancy[slot] > 0
      //     (agendamentos corridos existentes NÃO bloqueiam serviços normais)
      // - Serviço CORRIDO sendo agendado:
      //     bloqueado se continuousOccupancy[serviceId+slot] >= maxSimultaneous
      //     (agendamentos normais existentes NÃO bloqueiam corridos)

      const normalOccupancy = new Map<string, number>();
      const continuousOccupancy = new Map<string, number>();

      for (const booking of bookedBookings) {
        const bookedStart = toMinutes(formatBrt(booking.date, "HH:mm"));
        const bookedDuration = Math.max(
          booking.service.durationMinutes,
          MIN_SERVICE_DURATION,
        );
        const bookedEnd = bookedStart + bookedDuration;
        const bookedIsContinuous = booking.service.continuousSchedule ?? false;

        for (const slot of slots) {
          const slotStart = toMinutes(slot);
          const slotEnd = slotStart + serviceDuration;

          if (!overlaps(slotStart, slotEnd, bookedStart, bookedEnd)) continue;

          if (bookedIsContinuous) {
            // Agendamento existente é corrido — só conta para ocupação de corridos
            const key = `${booking.serviceId}::${slot}`;
            continuousOccupancy.set(
              key,
              (continuousOccupancy.get(key) ?? 0) + 1,
            );
          } else {
            // Agendamento existente é normal — bloqueia serviços normais
            normalOccupancy.set(slot, (normalOccupancy.get(slot) ?? 0) + 1);
          }
        }
      }

      /* // ── Filtra slots ─────────────────────────────────────────────────────────
      slots = slots.filter((slot) => {
        if (isContinuous) {
          // Serviço corrido: verifica apenas ocupação de corridos do mesmo serviço
          const key = serviceId ? `${serviceId}::${slot}` : slot;
          const count = continuousOccupancy.get(key) ?? 0;
          return count < maxSimultaneous;
        } else {
          // Serviço normal: verifica apenas ocupação de normais
          const count = normalOccupancy.get(slot) ?? 0;
          return count === 0;
        }
      }); */
      slots = slots.filter((slot) => {
        const continuousKey = serviceId ? `${serviceId}::${slot}` : slot;
        const continuousCount = continuousOccupancy.get(continuousKey) ?? 0;
        const normalCount = normalOccupancy.get(slot) ?? 0;
        const totalOccupied = continuousCount + normalCount;

        if (isContinuous) {
          // Corrido: disponível se total < maxSimultaneous
          return totalOccupied < maxSimultaneous;
        } else {
          // Normal: disponível se não há outro normal E total < maxSimultaneous do corrido
          // Se não há corrido no slot, maxSimultaneous não se aplica — só verifica normalCount
          const hasContinuous = continuousCount > 0;
          if (hasContinuous) {
            // Há corrido — respeita o limite total
            return normalCount === 0 && totalOccupied < maxSimultaneous;
          } else {
            // Sem corrido — regra simples: só 1 normal por slot
            return normalCount === 0;
          }
        }
      });

      // Remove slots passados no dia atual
      if (isTodayBrt(date)) {
        const currentTime = formatBrt(now, "HH:mm");
        slots = slots.filter((slot) => slot > currentTime);
      }

      return { slots };
    },
  );
