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

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface BookingInfo {
  serviceName: string;
  clients: string[];
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

// Aplica filtro de slots conforme o ScheduleViewType do profissional
//
// DEFAULT    → todos os slots do expediente
// RECENT     → apenas slots a partir de 30min antes do horário atual
// CONTINUOUS → igual ao DEFAULT mas exibe vagas simultâneas (já tratado no buildBookedTimesMap)
function applyViewTypeFilter(
  slots: string[],
  viewType: ScheduleViewType,
  currentTime: string,
): string[] {
  if (viewType === ScheduleViewType.RECENT) {
    // Calcula o horário de corte: currentTime - 30min
    const [h, m] = currentTime.split(":").map(Number);
    const totalMinutes = h * 60 + m - 30;
    const cutH = Math.floor(Math.max(totalMinutes, 0) / 60);
    const cutM = Math.max(totalMinutes, 0) % 60;
    const cutTime = `${String(cutH).padStart(2, "0")}:${String(cutM).padStart(2, "0")}`;
    return slots.filter((slot) => slot >= cutTime);
  }

  // DEFAULT e CONTINUOUS — todos os slots
  return slots;
}

// ─── Monta mapa de horários ocupados ─────────────────────────────────────────
//
// Serviço normal (continuousSchedule=false):
//   45min → slot principal (09:00) + cont. (09:30) — cont. some da visualização
//
// Horário corrido (continuousSchedule=true):
//   Múltiplos clientes no mesmo slot — todos listados, sem cont.

function buildBookedTimesMap(
  bookings: Array<{
    date: Date;
    clientName: string | null;
    service: {
      name: string;
      durationMinutes: number;
      continuousSchedule: boolean;
    };
    user: { name: string };
  }>,
): Map<string, BookingInfo> {
  const map = new Map<string, BookingInfo>();

  for (const booking of bookings) {
    const clientName = booking.clientName ?? booking.user.name;
    const timeKey = formatBrt(booking.date, "HH:mm");

    // Slot principal
    const existing = map.get(timeKey);
    if (existing) {
      existing.clients.push(clientName);
    } else {
      map.set(timeKey, {
        serviceName: booking.service.name,
        clients: [clientName],
        isContinuation: false,
      });
    }

    // Slots de continuação — apenas para serviços normais
    if (!booking.service.continuousSchedule) {
      const slotsNeeded = Math.ceil(
        booking.service.durationMinutes / DISPLAY_INTERVAL_MINUTES,
      );
      for (let i = 1; i < slotsNeeded; i++) {
        const nextSlotDate = addMinutes(
          booking.date,
          i * DISPLAY_INTERVAL_MINUTES,
        );
        const nextTimeKey = formatBrt(nextSlotDate, "HH:mm");
        if (!map.has(nextTimeKey)) {
          map.set(nextTimeKey, {
            serviceName: booking.service.name,
            clients: [clientName],
            isContinuation: true,
          });
        }
      }
    }
  }

  return map;
}

// ─── Monta mensagem formatada ─────────────────────────────────────────────────

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

    // Slots de continuação somem sempre
    if (booking?.isContinuation) continue;
    // Slots passados sem agendamento somem
    if (isPast && !booking) continue;

    let line: string;

    if (isPast && booking) {
      stats.finishedCount++;
      const clientList = booking.clients.join(", ");
      line = `~✔ ${slot}  ${booking.serviceName} · ${clientList}~`;
    } else if (booking) {
      stats.bookedCount++;
      const clientLines = booking.clients
        .map((c) => `┗ *${c}*  _${booking.serviceName}_`)
        .join("\n");
      line = `🔵 *${slot}*\n${clientLines}`;
    } else {
      // CONTINUOUS — mostra quantas vagas têm no slot se for corrido
      // mas como slots livres não têm info de maxSimultaneous aqui,
      // exibimos apenas "disponível" (igual ao DEFAULT)
      stats.freeCount++;
      line = `◦ ${slot}  _disponível_`;
    }

    if (hour < 12) morningSlots.push(line);
    else if (hour < 18) afternoonSlots.push(line);
    else eveningSlots.push(line);
  }

  // Label do tipo de visualização no cabeçalho
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

  if (isFutureDateBrt(date)) return;

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    include: {
      user: { select: { name: true } },
      barbershop: { select: { slug: true } },
      schedules: true,
    },
  });

  if (!professional?.whatsappGroupName) return;

  const dayOfWeek = getDayOfWeekFromDate(date);
  const schedule = professional.schedules.find(
    (s) => s.dayOfWeek === dayOfWeek,
  );

  if (!schedule?.isAvailable) return;

  const currentTime = getCurrentTimeBrt();

  if (isTodayBrt(date) && currentTime >= schedule.endTime) return;

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
        },
      },
      user: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });

  const bookedTimesMap = buildBookedTimesMap(bookings);

  // Gera todos os slots do expediente
  let allSlots = generateDisplaySlots(
    date,
    schedule.startTime,
    schedule.endTime,
  );

  // Remove intervalo de almoço
  if (schedule.hasLunchBreak) {
    allSlots = allSlots.filter(
      (slot) => slot < schedule.lunchStartTime || slot >= schedule.lunchEndTime,
    );
  }

  // Aplica filtro conforme o tipo de visualização configurado
  allSlots = applyViewTypeFilter(allSlots, viewType, currentTime);

  const hasVisibleSlots = allSlots.some(
    (slot) => slot >= currentTime || bookedTimesMap.has(slot),
  );

  if (!hasVisibleSlots) return;

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

  await sendGroupMessage(
    professionalId,
    professional.whatsappGroupName,
    message,
  );
}
