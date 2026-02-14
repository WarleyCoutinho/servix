import { DAY_OF_WEEK_LABELS } from "@/lib/day-of-week";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_INTERVAL_MINUTES,
  generateTimeSlots,
  getDayOfWeekFromDate,
} from "@/lib/schedule-utils";
import { endOfDayBrt, formatBrt, startOfDayBrt, TIMEZONE } from "@/lib/timezone";
import { sendGroupMessage } from "@/lib/whatsapp";
import { format } from "date-fns";
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
  const separator = "━━━━━━━━━━━━━━━━━━━━━━━";

  const morningSlots: string[] = [];
  const afternoonSlots: string[] = [];
  const stats: ScheduleStats = { finishedCount: 0, bookedCount: 0, freeCount: 0 };

  for (const slot of allSlots) {
    const hour = Number(slot.split(":")[0]);
    const booking = bookedTimesMap.get(slot);
    const isPast = slot < currentTime;

    if (isPast && !booking) {
      continue;
    }

    let line: string;
    if (isPast && booking) {
      stats.finishedCount++;
      line = `  ✓ ${slot}  │ ~${booking.serviceName} - ${booking.clientName}~`;
    } else if (booking) {
      stats.bookedCount++;
      line = `  *${slot}* │ ${booking.serviceName}\n           │ _${booking.clientName}_`;
    } else {
      stats.freeCount++;
      line = `  ${slot}  │ ～`;
    }

    if (hour < 12) {
      morningSlots.push(line);
    } else {
      afternoonSlots.push(line);
    }
  }

  const lines: string[] = [
    separator,
    `  📋  *AGENDA DO DIA*`,
    `  📅  ${dayLabel}, ${dateFormatted}`,
    `  💈  ${professionalName}`,
    separator,
  ];

  if (morningSlots.length > 0) {
    lines.push("", `  ☀️  *MANHÃ*`, "", ...morningSlots);
  }

  if (afternoonSlots.length > 0) {
    lines.push("", `  🌙  *TARDE*`, "", ...afternoonSlots);
  }

  const statsParts: string[] = [];
  if (stats.finishedCount > 0) {
    statsParts.push(`✓ *${stats.finishedCount}* finalizado${stats.finishedCount !== 1 ? "s" : ""}`);
  }
  if (stats.bookedCount > 0) {
    statsParts.push(`*${stats.bookedCount}* agendado${stats.bookedCount !== 1 ? "s" : ""}`);
  }
  if (stats.freeCount > 0) {
    statsParts.push(`*${stats.freeCount}* livre${stats.freeCount !== 1 ? "s" : ""}`);
  }

  lines.push(
    "",
    separator,
    `  📊  ${statsParts.join("  •  ")}`,
    separator,
    "",
    `  📲  *Agende agora:*`,
    `  ${bookingUrl}`,
  );

  return lines.join("\n");
}

export async function sendDailyScheduleToGroup(
  professionalId: string,
  bookingDate: Date | string,
): Promise<void> {
  const date = new Date(bookingDate);

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    include: {
      user: { select: { name: true } },
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
      service: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });

  const bookedTimesMap = buildBookedTimesMap(bookings);
  const allSlots = generateTimeSlots(
    date,
    schedule.startTime,
    schedule.endTime,
    DEFAULT_INTERVAL_MINUTES,
  );

  const currentTime = getCurrentTimeBrt();

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://servixplatform.vercel.app";
  const bookingUrl = `${appUrl}/barbershops/${professional.barbershopId}?ref=${professionalId}`;

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
    service: { name: string };
    user: { name: string };
  }>,
): Map<string, BookingInfo> {
  const map = new Map<string, BookingInfo>();

  for (const booking of bookings) {
    const timeKey = formatBrt(booking.date, "HH:mm");
    map.set(timeKey, {
      serviceName: booking.service.name,
      clientName: booking.user.name,
    });
  }

  return map;
}
