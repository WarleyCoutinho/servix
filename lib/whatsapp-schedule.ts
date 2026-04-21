import { DAY_OF_WEEK_LABELS } from "@/lib/day-of-week";
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
  TIMEZONE,
} from "@/lib/timezone";
import { sendGroupMessage } from "@/lib/whatsapp";
import { addMinutes, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface BookingInfo {
  serviceName: string;
  clientName: string;
}

interface ScheduleStats {
  finishedCount: number;
  bookedCount: number;
  freeCount: number;
}

function getCurrentTimeBrt(): string {
  const nowBrt = toZonedTime(new Date(), TIMEZONE);
  return format(nowBrt, "HH:mm");
}

function buildScheduleMessage(
  dayLabel: string,
  dateFormatted: string,
  professionalName: string,
  allSlots: string[],
  bookedTimesMap: Map<string, BookingInfo>,
  currentTime: string,
  bookingUrl: string,
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
    const isCont = booking?.serviceName.endsWith("(cont.)");

    // Slots passados sem agendamento e slots de continuação são invisíveis
    if ((isPast && !booking) || isCont) continue;

    let line: string;

    if (isPast && booking) {
      stats.finishedCount++;
      line = `~✔ ${slot}  ${booking.serviceName} · ${booking.clientName}~`;
    } else if (booking) {
      stats.bookedCount++;
      line = `🔵 *${slot}*\n┗ *${booking.clientName}*  _${booking.serviceName}_`;
    } else {
      stats.freeCount++;
      line = `◦ ${slot}  _disponível_`;
    }

    if (hour < 12) morningSlots.push(line);
    else if (hour < 18) afternoonSlots.push(line);
    else eveningSlots.push(line);
  }

  // Cabeçalho impactante
  const lines: string[] = [
    `💈 *${professionalName.toUpperCase()}*`,
    `▸ ${dayLabel}, ${dateFormatted}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
  ];

  if (morningSlots.length > 0) {
    lines.push(`☀️ *MANHÃ*`, ``, ...morningSlots, ``);
  }

  if (afternoonSlots.length > 0) {
    lines.push(`🌤 *TARDE*`, ``, ...afternoonSlots, ``);
  }

  if (eveningSlots.length > 0) {
    lines.push(`🌙 *NOITE*`, ``, ...eveningSlots, ``);
  }

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

export async function sendDailyScheduleToGroup(
  professionalId: string,
  bookingDate: Date | string,
): Promise<void> {
  const date = new Date(bookingDate);

  if (isFutureDateBrt(date)) {
    return;
  }

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    include: {
      user: { select: { name: true } },
      barbershop: { select: { slug: true } },
      schedules: true,
    },
  });

  if (!professional?.whatsappGroupName) {
    return;
  }

  const dayOfWeek = getDayOfWeekFromDate(date);
  const schedule = professional.schedules.find(
    (s) => s.dayOfWeek === dayOfWeek,
  );

  if (!schedule?.isAvailable) {
    return;
  }

  const currentTime = getCurrentTimeBrt();

  if (isTodayBrt(date) && currentTime >= schedule.endTime) {
    return;
  }

  const bookings = await prisma.booking.findMany({
    where: {
      professionalId,
      cancelledAt: null,
      date: {
        gte: startOfDayBrt(date),
        lte: endOfDayBrt(date),
      },
    },
    include: {
      service: { select: { name: true, durationMinutes: true } },
      user: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });

  const bookedTimesMap = buildBookedTimesMap(bookings);
  let allSlots = generateTimeSlots(
    date,
    schedule.startTime,
    schedule.endTime,
    DEFAULT_INTERVAL_MINUTES,
  );

  // Respeitar intervalo de almoço configurado
  if (schedule.hasLunchBreak) {
    allSlots = allSlots.filter(
      (slot) => slot < schedule.lunchStartTime || slot >= schedule.lunchEndTime,
    );
  }

  const hasVisibleSlots = allSlots.some(
    (slot) => slot >= currentTime || bookedTimesMap.has(slot),
  );

  if (!hasVisibleSlots) {
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
  );

  await sendGroupMessage(
    professionalId,
    professional.whatsappGroupName,
    message,
  );
}

function buildBookedTimesMap(
  bookings: Array<{
    date: Date;
    service: { name: string; durationMinutes: number };
    user: { name: string };
  }>,
): Map<string, BookingInfo> {
  const map = new Map<string, BookingInfo>();

  for (const booking of bookings) {
    const slotsNeeded = Math.ceil(
      booking.service.durationMinutes / DEFAULT_INTERVAL_MINUTES,
    );
    const timeKey = formatBrt(booking.date, "HH:mm");
    map.set(timeKey, {
      serviceName: booking.service.name,
      clientName: booking.user.name,
    });

    for (let i = 1; i < slotsNeeded; i++) {
      const nextSlotDate = addMinutes(
        booking.date,
        i * DEFAULT_INTERVAL_MINUTES,
      );
      const nextTimeKey = formatBrt(nextSlotDate, "HH:mm");
      map.set(nextTimeKey, {
        serviceName: `${booking.service.name} (cont.)`,
        clientName: booking.user.name,
      });
    }
  }

  return map;
}
