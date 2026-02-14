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
  bookedCount: number;
  freeCount: number;
}

function filterSlotsByCurrentTime(allSlots: string[]): string[] {
  const nowBrt = toZonedTime(new Date(), TIMEZONE);
  const currentTime = format(nowBrt, "HH:mm");
  return allSlots.filter((slot) => slot >= currentTime);
}

function buildScheduleMessage(
  dayLabel: string,
  dateFormatted: string,
  professionalName: string,
  allSlots: string[],
  bookedTimesMap: Map<string, BookingInfo>,
  bookingUrl: string,
): string {
  const separator = "━━━━━━━━━━━━━━━━━━━━━━━";

  const morningSlots: string[] = [];
  const afternoonSlots: string[] = [];
  const stats: ScheduleStats = { bookedCount: 0, freeCount: 0 };

  for (const slot of allSlots) {
    const hour = Number(slot.split(":")[0]);
    const booking = bookedTimesMap.get(slot);

    const line = booking
      ? formatBookedSlot(slot, booking, stats)
      : formatFreeSlot(slot, stats);

    if (hour < 12) {
      morningSlots.push(line);
    } else {
      afternoonSlots.push(line);
    }
  }

  return assembleMessage(
    separator,
    dayLabel,
    dateFormatted,
    professionalName,
    morningSlots,
    afternoonSlots,
    stats,
    bookingUrl,
  );
}

function formatBookedSlot(
  slot: string,
  booking: BookingInfo,
  stats: ScheduleStats,
): string {
  stats.bookedCount++;
  return `  *${slot}* │ ${booking.serviceName}\n           │ _${booking.clientName}_`;
}

function formatFreeSlot(slot: string, stats: ScheduleStats): string {
  stats.freeCount++;
  return `  ${slot}  │ ～`;
}

function assembleMessage(
  separator: string,
  dayLabel: string,
  dateFormatted: string,
  professionalName: string,
  morningSlots: string[],
  afternoonSlots: string[],
  stats: ScheduleStats,
  bookingUrl: string,
): string {
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

  const bookedLabel = stats.bookedCount !== 1 ? "agendados" : "agendado";
  const freeLabel = stats.freeCount !== 1 ? "livres" : "livre";

  lines.push(
    "",
    separator,
    `  📊  *${stats.bookedCount}* ${bookedLabel}  •  *${stats.freeCount}* ${freeLabel}`,
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

  const visibleSlots = filterSlotsByCurrentTime(allSlots);

  if (visibleSlots.length === 0) {
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
    visibleSlots,
    bookedTimesMap,
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
