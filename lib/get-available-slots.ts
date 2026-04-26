/**
 * get-available-slots.ts
 *
 * Retorna os slots do dia com status de disponibilidade,
 * respeitando continuousSchedule + maxSimultaneous.
 *
 * USO (server component ou server action):
 *   const slots = await getAvailableSlots({ professionalId, serviceId, date })
 *
 * O array retornado já vem filtrado/marcado para renderizar na UI do cliente:
 *   - available: true  → botão habilitado
 *   - available: false → botão desabilitado (motivo em `reason`)
 */

import { prisma } from "@/lib/prisma";
import { addMinutes } from "date-fns";
import {
  DEFAULT_INTERVAL_MINUTES,
  generateTimeSlots,
  getDayOfWeekFromDate,
} from "@/lib/schedule-utils";
import {
  startOfDayBrt,
  endOfDayBrt,
  formatBrt,
  isTodayBrt,
} from "@/lib/timezone";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

const TIMEZONE = "America/Sao_Paulo";

export interface SlotInfo {
  time: string; // "HH:mm"
  available: boolean;
  reason?: "past" | "booked" | "full" | "lunch";
  /** Para slots corridos: quantas vagas restam */
  remainingSlots?: number;
  /** Para slots corridos: capacidade total */
  maxSlots?: number;
}

interface GetAvailableSlotsParams {
  professionalId: string;
  serviceId: string;
  date: Date;
}

export async function getAvailableSlots({
  professionalId,
  serviceId,
  date,
}: GetAvailableSlotsParams): Promise<SlotInfo[]> {
  // 1. Dados do profissional e serviço
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

  // 2. Gera slots brutos do dia
  let allSlots = generateTimeSlots(
    date,
    schedule.startTime,
    schedule.endTime,
    DEFAULT_INTERVAL_MINUTES,
  );

  // Remove horário de almoço
  if (schedule.hasLunchBreak) {
    allSlots = allSlots.filter(
      (slot) => slot < schedule.lunchStartTime || slot >= schedule.lunchEndTime,
    );
  }

  // 3. Agendamentos já existentes no dia
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

  // 4. Monta mapa: timeKey → contagem de bookings por serviceId
  //    Para serviços normais, também marca os slots de "continuação" como bloqueados
  type BlockedSlot = {
    reason: "booked" | "full";
    remainingSlots?: number;
    maxSlots?: number;
  };
  const blockedMap = new Map<string, BlockedSlot>();

  // Contagem de vagas por (serviceId + timeKey) para serviços corridos
  const continuousCountMap = new Map<string, number>();

  for (const booking of existingBookings) {
    const timeKey = formatBrt(booking.date, "HH:mm");

    if (booking.service.continuousSchedule) {
      // Horário corrido — conta vagas usadas nesse slot
      const key = `${booking.serviceId}::${timeKey}`;
      continuousCountMap.set(key, (continuousCountMap.get(key) ?? 0) + 1);
    } else {
      // Serviço normal — bloqueia o slot inicial + continuações
      const slotsNeeded = Math.ceil(
        booking.service.durationMinutes / DEFAULT_INTERVAL_MINUTES,
      );
      for (let i = 0; i < slotsNeeded; i++) {
        const blockedKey = formatBrt(
          addMinutes(booking.date, i * DEFAULT_INTERVAL_MINUTES),
          "HH:mm",
        );
        blockedMap.set(blockedKey, { reason: "booked" });
      }
    }
  }

  // Resolve slots corridos: se vagas esgotadas → bloqueia
  if (service.continuousSchedule) {
    for (const slot of allSlots) {
      const key = `${serviceId}::${slot}`;
      const used = continuousCountMap.get(key) ?? 0;
      const max = service.maxSimultaneous ?? 1;
      if (used >= max) {
        blockedMap.set(slot, {
          reason: "full",
          remainingSlots: 0,
          maxSlots: max,
        });
      }
    }
  }

  // 5. Horário atual em BRT para marcar slots passados
  const nowBrt = toZonedTime(new Date(), TIMEZONE);
  const currentTime = format(nowBrt, "HH:mm");
  const isToday = isTodayBrt(date);

  // 6. Monta o array final
  const newSlotsNeeded = Math.ceil(
    service.durationMinutes / DEFAULT_INTERVAL_MINUTES,
  );

  const result: SlotInfo[] = [];

  for (const slot of allSlots) {
    // Passado
    if (isToday && slot <= currentTime) {
      result.push({ time: slot, available: false, reason: "past" });
      continue;
    }

    // Verifica se todos os slots necessários para a duração do serviço estão livres
    // (ex: serviço de 60min precisa de 2 slots consecutivos livres)
    let blocked: BlockedSlot | undefined;

    if (!service.continuousSchedule) {
      // Para serviços normais, verifica os N slots consecutivos necessários
      for (let i = 0; i < newSlotsNeeded; i++) {
        const checkSlot = formatBrt(
          addMinutes(
            new Date(`${formatBrt(date, "yyyy-MM-dd")}T${slot}:00`),
            i * DEFAULT_INTERVAL_MINUTES,
          ),
          "HH:mm",
        );
        if (blockedMap.has(checkSlot)) {
          blocked = blockedMap.get(checkSlot);
          break;
        }
      }
    } else {
      // Para serviços corridos, só verifica o slot exato
      blocked = blockedMap.get(slot);
    }

    if (blocked) {
      const max = service.maxSimultaneous ?? 1;
      const key = `${serviceId}::${slot}`;
      const used = continuousCountMap.get(key) ?? 0;
      result.push({
        time: slot,
        available: false,
        reason: blocked.reason,
        remainingSlots: service.continuousSchedule
          ? Math.max(0, max - used)
          : undefined,
        maxSlots: service.continuousSchedule ? max : undefined,
      });
      continue;
    }

    // Slot disponível — para corridos, informa vagas restantes
    if (service.continuousSchedule) {
      const max = service.maxSimultaneous ?? 1;
      const key = `${serviceId}::${slot}`;
      const used = continuousCountMap.get(key) ?? 0;
      result.push({
        time: slot,
        available: true,
        remainingSlots: max - used,
        maxSlots: max,
      });
    } else {
      result.push({ time: slot, available: true });
    }
  }

  return result;
}
