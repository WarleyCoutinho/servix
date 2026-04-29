import { DAY_OF_WEEK_LABELS } from "@/lib/day-of-week";
import { prisma } from "@/lib/prisma";
import {
  getDayOfWeekFromDate,
  DISPLAY_INTERVAL_MINUTES,
} from "@/lib/schedule-utils";
import {
  endOfDayBrt,
  formatBrt,
  isTodayBrt,
  startOfDayBrt,
  TIMEZONE,
} from "@/lib/timezone";
import { sendGroupMessage } from "@/lib/whatsapp";
import {
  addMinutes,
  format,
  setHours,
  setMinutes,
  startOfDay,
  isBefore,
} from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { ScheduleViewType } from "@/generated/prisma/enums";

const LOG_PREFIX = "[WhatsApp Schedule]";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ClientEntry {
  clientName: string;
  serviceName: string;
}

interface BookingInfo {
  entries: ClientEntry[];
  isContinuation: boolean;
}

interface ScheduleStats {
  finishedCount: number;
  bookedCount: number;
  freeCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateDisplaySlots(
  date: Date,
  startTime: string,
  endTime: string,
): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const dayStart = startOfDay(toZonedTime(date, TIMEZONE));
  let current = setMinutes(setHours(dayStart, startH), startM);
  const end = setMinutes(setHours(dayStart, endH), endM);

  while (isBefore(current, end)) {
    slots.push(format(current, "HH:mm"));
    current = addMinutes(current, DISPLAY_INTERVAL_MINUTES);
  }

  return slots;
}

function getCurrentTimeBrt(): string {
  const nowBrt = toZonedTime(new Date(), TIMEZONE);
  return format(nowBrt, "HH:mm");
}

function isFutureDateBrt(date: Date): boolean {
  const nowBrt = toZonedTime(new Date(), TIMEZONE);
  const dateBrt = toZonedTime(date, TIMEZONE);
  const nowDateOnly = new Date(
    nowBrt.getFullYear(),
    nowBrt.getMonth(),
    nowBrt.getDate(),
  );
  const targetDateOnly = new Date(
    dateBrt.getFullYear(),
    dateBrt.getMonth(),
    dateBrt.getDate(),
  );
  return targetDateOnly > nowDateOnly;
}

function applyViewTypeFilter(
  slots: string[],
  viewType: ScheduleViewType,
  currentTime: string,
): string[] {
  if (viewType === ScheduleViewType.RECENT) {
    const [h, m] = currentTime.split(":").map(Number);
    const totalMinutes = h * 60 + m - 30;
    const cutH = Math.floor(Math.max(totalMinutes, 0) / 60);
    const cutM = Math.max(totalMinutes, 0) % 60;
    const cutTime = `${String(cutH).padStart(2, "0")}:${String(cutM).padStart(2, "0")}`;
    return slots.filter((slot) => slot >= cutTime);
  }
  return slots;
}

// ─── Mapa de horários ocupados ────────────────────────────────────────────────
//
// Regras:
// - Serviço NORMAL: ocupa apenas o slot principal na visualização.
//   Slots seguintes ficam livres independente da duração.
// - Serviço CORRIDO: slots de continuação só somem (isContinuation=true)
//   quando TODAS as vagas (maxSimultaneous) estiverem ocupadas.
//   Se ainda há vagas, o slot aparece como disponível.

function buildBookedTimesMap(
  bookings: Array<{
    date: Date;
    clientName: string | null;
    service: {
      name: string;
      durationMinutes: number;
      continuousSchedule: boolean;
      maxSimultaneous: number | null;
    };
    user: { name: string };
  }>,
): Map<string, BookingInfo> {
  const map = new Map<string, BookingInfo>();

  // Passo 1: conta ocupação de cada slot para serviços corridos
  // chave: "serviceName::HH:mm" → contagem e máximo
  const continuousOccupancy = new Map<string, { count: number; max: number }>();

  for (const booking of bookings) {
    if (!booking.service.continuousSchedule) continue;

    const max = booking.service.maxSimultaneous ?? 1;
    const slotsNeeded = Math.ceil(
      booking.service.durationMinutes / DISPLAY_INTERVAL_MINUTES,
    );

    for (let i = 0; i < slotsNeeded; i++) {
      const slotDate = addMinutes(booking.date, i * DISPLAY_INTERVAL_MINUTES);
      const key = `${booking.service.name}::${formatBrt(slotDate, "HH:mm")}`;
      const existing = continuousOccupancy.get(key);
      if (existing) {
        existing.count++;
      } else {
        continuousOccupancy.set(key, { count: 1, max });
      }
    }
  }

  // Passo 2: monta o mapa de visualização
  for (const booking of bookings) {
    const clientName = booking.clientName ?? booking.user.name;
    const serviceName = booking.service.name;
    const timeKey = formatBrt(booking.date, "HH:mm");

    // ── Slot principal ──────────────────────────────────────────────────────
    const existing = map.get(timeKey);
    if (existing && !existing.isContinuation) {
      const alreadyExists = existing.entries.some(
        (e) => e.clientName === clientName && e.serviceName === serviceName,
      );
      if (!alreadyExists) {
        existing.entries.push({ clientName, serviceName });
      }
    } else {
      map.set(timeKey, {
        entries: [{ clientName, serviceName }],
        isContinuation: false,
      });
    }

    // ── Slots de continuação — apenas corridos LOTADOS ──────────────────────
    if (booking.service.continuousSchedule) {
      const slotsNeeded = Math.ceil(
        booking.service.durationMinutes / DISPLAY_INTERVAL_MINUTES,
      );
      for (let i = 1; i < slotsNeeded; i++) {
        const nextSlotDate = addMinutes(
          booking.date,
          i * DISPLAY_INTERVAL_MINUTES,
        );
        const nextTimeKey = formatBrt(nextSlotDate, "HH:mm");

        // Só marca como continuação (some da visualização) se lotado
        const key = `${serviceName}::${nextTimeKey}`;
        const occupancy = continuousOccupancy.get(key);
        const isFull = occupancy ? occupancy.count >= occupancy.max : false;

        if (isFull && !map.has(nextTimeKey)) {
          map.set(nextTimeKey, {
            entries: [{ clientName, serviceName }],
            isContinuation: true,
          });
        }
        // Se não lotado: slot permanece livre na visualização
      }
    }
  }

  return map;
}

// ─── Mensagem formatada ───────────────────────────────────────────────────────

function buildScheduleMessage(
  dayLabel: string,
  dateFormatted: string,
  professionalName: string,
  allSlots: string[],
  bookedTimesMap: Map<string, BookingInfo>,
  currentTime: string,
  bookingUrl: string,
  viewType: ScheduleViewType,
): string {
  const morningSlots: string[] = [];
  const afternoonSlots: string[] = [];
  const eveningSlots: string[] = [];
  const stats: ScheduleStats = {
    finishedCount: 0,
    bookedCount: 0,
    freeCount: 0,
  };

  for (const slot of allSlots) {
    const hour = Number(slot.split(":")[0]);
    const booking = bookedTimesMap.get(slot);
    const isPast = slot < currentTime;

    if (booking?.isContinuation) continue;
    if (isPast && !booking) continue;

    let line: string;

    if (isPast && booking) {
      stats.finishedCount++;
      const allClients = booking.entries.map((e) => e.clientName).join(", ");
      const allServices = [
        ...new Set(booking.entries.map((e) => e.serviceName)),
      ].join(" / ");
      line = `~✔ ${slot}  ${allServices} · ${allClients}~`;
    } else if (booking) {
      stats.bookedCount++;
      const clientLines = booking.entries
        .map((e) => `┗ *${e.clientName}*  _${e.serviceName}_`)
        .join("\n");
      line = `🔵 *${slot}*\n${clientLines}`;
    } else {
      stats.freeCount++;
      line = `◦ ${slot}  _disponível_`;
    }

    if (hour < 12) morningSlots.push(line);
    else if (hour < 18) afternoonSlots.push(line);
    else eveningSlots.push(line);
  }

  const viewLabel: Record<ScheduleViewType, string> = {
    [ScheduleViewType.DEFAULT]: "",
    [ScheduleViewType.RECENT]: "  _(a partir de agora)_",
    [ScheduleViewType.CONTINUOUS]: "  _(corrida)_",
  };

  const lines: string[] = [
    `💈 *${professionalName.toUpperCase()}*`,
    `▸ ${dayLabel}, ${dateFormatted}${viewLabel[viewType]}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
  ];

  if (morningSlots.length > 0)
    lines.push(`☀️ *MANHÃ*`, ``, ...morningSlots, ``);
  if (afternoonSlots.length > 0)
    lines.push(`🌤 *TARDE*`, ``, ...afternoonSlots, ``);
  if (eveningSlots.length > 0)
    lines.push(`🌙 *NOITE*`, ``, ...eveningSlots, ``);

  const statsParts: string[] = [];
  if (stats.finishedCount > 0)
    statsParts.push(
      `✔ ${stats.finishedCount} finalizado${stats.finishedCount !== 1 ? "s" : ""}`,
    );
  if (stats.bookedCount > 0)
    statsParts.push(
      `🔵 ${stats.bookedCount} agendado${stats.bookedCount !== 1 ? "s" : ""}`,
    );
  if (stats.freeCount > 0)
    statsParts.push(
      `◦ ${stats.freeCount} livre${stats.freeCount !== 1 ? "s" : ""}`,
    );

  lines.push(
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📊 ${statsParts.join("  ·  ")}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📲 *Agendar:*`,
    `${bookingUrl}`,
  );

  return lines.join("\n");
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function sendDailyScheduleToGroup(
  professionalId: string,
  bookingDate: Date | string,
): Promise<void> {
  const date = new Date(bookingDate);
  const dateStr = formatBrt(date, "dd/MM/yyyy");

  if (isFutureDateBrt(date)) {
    console.log(
      `${LOG_PREFIX} Agendamento futuro (${dateStr}), envio ignorado — profissional: ${professionalId}`,
    );
    return;
  }

  console.log(
    `${LOG_PREFIX} Iniciando envio — profissional: ${professionalId} | data: ${dateStr}`,
  );

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    include: {
      user: { select: { name: true } },
      barbershop: { select: { slug: true } },
      schedules: true,
    },
  });

  if (!professional) {
    console.error(
      `${LOG_PREFIX} Profissional não encontrado: ${professionalId}`,
    );
    return;
  }

  if (!professional.whatsappGroupName) {
    console.log(
      `${LOG_PREFIX} Profissional ${professionalId} sem grupo WhatsApp configurado`,
    );
    return;
  }

  const dayOfWeek = getDayOfWeekFromDate(date);
  const schedule = professional.schedules.find(
    (s) => s.dayOfWeek === dayOfWeek,
  );

  if (!schedule?.isAvailable) {
    console.log(
      `${LOG_PREFIX} Profissional ${professionalId} não trabalha em ${dateStr} (${dayOfWeek})`,
    );
    return;
  }

  const currentTime = getCurrentTimeBrt();

  if (isTodayBrt(date) && currentTime >= schedule.endTime) {
    console.log(
      `${LOG_PREFIX} Expediente encerrado (${currentTime} >= ${schedule.endTime}) — envio ignorado`,
    );
    return;
  }

  const viewType: ScheduleViewType =
    (professional.scheduleViewType as ScheduleViewType) ??
    ScheduleViewType.DEFAULT;

  const bookings = await prisma.booking.findMany({
    where: {
      professionalId,
      cancelledAt: null,
      date: { gte: startOfDayBrt(date), lte: endOfDayBrt(date) },
    },
    select: {
      date: true,
      clientName: true,
      service: {
        select: {
          name: true,
          durationMinutes: true,
          continuousSchedule: true,
          maxSimultaneous: true,
        },
      },
      user: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });

  console.log(
    `${LOG_PREFIX} ${bookings.length} agendamento(s) encontrado(s) para ${dateStr}`,
  );

  const bookedTimesMap = buildBookedTimesMap(bookings);

  let allSlots = generateDisplaySlots(
    date,
    schedule.startTime,
    schedule.endTime,
  );

  if (schedule.hasLunchBreak) {
    allSlots = allSlots.filter(
      (slot) => slot < schedule.lunchStartTime || slot >= schedule.lunchEndTime,
    );
  }

  allSlots = applyViewTypeFilter(allSlots, viewType, currentTime);

  const hasVisibleSlots = allSlots.some(
    (slot) => slot >= currentTime || bookedTimesMap.has(slot),
  );

  if (!hasVisibleSlots) {
    console.log(
      `${LOG_PREFIX} Nenhum slot visível para enviar — envio ignorado`,
    );
    return;
  }

  const dayLabel = DAY_OF_WEEK_LABELS[dayOfWeek];
  const dateFormatted = formatBrt(date, "dd/MM/yyyy");
  const professionalName =
    professional.displayName ?? professional.user.name ?? "Profissional";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const bookingPath = professional.barbershop.slug
    ? `/${professional.barbershop.slug}`
    : `/agendar/${professionalId}`;
  const bookingUrl = `${appUrl}${bookingPath}`;

  const message = buildScheduleMessage(
    dayLabel,
    dateFormatted,
    professionalName,
    allSlots,
    bookedTimesMap,
    currentTime,
    bookingUrl,
    viewType,
  );

  console.log(
    `${LOG_PREFIX} Enviando para grupo "${professional.whatsappGroupName}" — viewType: ${viewType}`,
  );

  const sent = await sendGroupMessage(
    professionalId,
    professional.whatsappGroupName,
    message,
  );

  if (sent) {
    console.log(
      `${LOG_PREFIX} ✅ Agenda enviada com sucesso para "${professional.whatsappGroupName}"`,
    );
  } else {
    console.error(
      `${LOG_PREFIX} ❌ Falha ao enviar para "${professional.whatsappGroupName}" — sessão WhatsApp pode estar desconectada`,
    );
  }
}
