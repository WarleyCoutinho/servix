/**
 * get-available-slots.ts
 *
 * Retorna os slots do dia com status de disponibilidade,
 * respeitando continuousSchedule + maxSimultaneous.
 * Slots gerados dinamicamente pela duração real do serviço (mínimo 5min).
 */

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

const MIN_SERVICE_DURATION = 5;

export interface SlotInfo {
  time: string;
  available: boolean;
  reason?: "past" | "booked" | "full" | "lunch";
  remainingSlots?: number;
  maxSlots?: number;
}

interface GetAvailableSlotsParams {
  professionalId: string;
  serviceId: string;
  date: Date;
}

// Gera slots com intervalo = duração real do serviço
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

// Converte "HH:mm" em minutos desde meia-noite
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Verifica sobreposição entre dois intervalos [aStart, aEnd) e [bStart, bEnd)
function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export async function getAvailableSlots({
  professionalId,
  serviceId,
  date,
}: GetAvailableSlotsParams): Promise<SlotInfo[]> {
  const [professional, service] = await Promise.all([
    prisma.professional.findUnique({
      where: { id: professionalId },
      include: { schedules: true },
    }),
    prisma.barbershopService.findUnique({
      where: { id: serviceId },
    }),
  ]);

  if (!professional || !service) return [];

  const dayOfWeek = getDayOfWeekFromDate(date);
  const schedule = professional.schedules.find(
    (s) => s.dayOfWeek === dayOfWeek,
  );
  if (!schedule?.isAvailable) return [];

  const serviceDuration = Math.max(
    service.durationMinutes,
    MIN_SERVICE_DURATION,
  );
  const isContinuous = service.continuousSchedule ?? false;
  const maxSimultaneous = service.maxSimultaneous ?? 1;

  // Gera slots com intervalo = duração real do serviço
  let allSlots = generateDynamicSlots(
    date,
    schedule.startTime,
    schedule.endTime,
    serviceDuration,
  );

  // Remove intervalo de almoço usando sobreposição real
  if (schedule.hasLunchBreak) {
    const lunchStart = toMinutes(schedule.lunchStartTime);
    const lunchEnd = toMinutes(schedule.lunchEndTime);
    allSlots = allSlots.filter((slot) => {
      const slotStart = toMinutes(slot);
      const slotEnd = slotStart + serviceDuration;
      return !overlaps(slotStart, slotEnd, lunchStart, lunchEnd);
    });
  }

  // Agendamentos do dia
  const existingBookings = await prisma.booking.findMany({
    where: {
      professionalId,
      cancelledAt: null,
      date: { gte: startOfDayBrt(date), lte: endOfDayBrt(date) },
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
    orderBy: { date: "asc" },
  });

  // Monta mapa de ocupação por slot usando sobreposição real de intervalos
  const slotOccupancy = new Map<string, number>();

  for (const booking of existingBookings) {
    const bookedStart = toMinutes(formatBrt(booking.date, "HH:mm"));
    const bookedDuration = Math.max(
      booking.service.durationMinutes,
      MIN_SERVICE_DURATION,
    );
    const bookedEnd = bookedStart + bookedDuration;

    for (const slot of allSlots) {
      const slotStart = toMinutes(slot);
      const slotEnd = slotStart + serviceDuration;
      if (overlaps(slotStart, slotEnd, bookedStart, bookedEnd)) {
        slotOccupancy.set(slot, (slotOccupancy.get(slot) ?? 0) + 1);
      }
    }
  }

  // Horário atual em BRT
  const nowBrt = toZonedTime(new Date(), TIMEZONE);
  const currentTime = format(nowBrt, "HH:mm");
  const isToday = isTodayBrt(date);

  // Monta resultado final
  const result: SlotInfo[] = [];

  for (const slot of allSlots) {
    // Slot passado
    if (isToday && slot <= currentTime) {
      result.push({ time: slot, available: false, reason: "past" });
      continue;
    }

    const count = slotOccupancy.get(slot) ?? 0;

    if (isContinuous) {
      // Horário corrido — bloqueia quando lotou
      if (count >= maxSimultaneous) {
        result.push({
          time: slot,
          available: false,
          reason: "full",
          remainingSlots: 0,
          maxSlots: maxSimultaneous,
        });
      } else {
        result.push({
          time: slot,
          available: true,
          remainingSlots: maxSimultaneous - count,
          maxSlots: maxSimultaneous,
        });
      }
    } else {
      // Serviço normal — bloqueia com qualquer sobreposição
      if (count > 0) {
        result.push({ time: slot, available: false, reason: "booked" });
      } else {
        result.push({ time: slot, available: true });
      }
    }
  }

  return result;
}
