import { prisma } from "@/lib/prisma";
import { DAY_OF_WEEK_LABELS } from "@/lib/day-of-week";
import {
  getDayOfWeekFromDate,
  generateTimeSlots,
  DEFAULT_INTERVAL_MINUTES,
} from "@/lib/schedule-utils";
import { sendGroupMessage } from "@/lib/whatsapp";
import { startOfDayBrt, endOfDayBrt, formatBrt } from "@/lib/timezone";

function buildScheduleMessage(
  dayLabel: string,
  dateFormatted: string,
  professionalName: string,
  allSlots: string[],
  bookedTimesMap: Map<string, { serviceName: string; clientName: string }>,
): string {
  const separator = "━━━━━━━━━━━━━━━━━━━━━━━";

  const morningSlots: string[] = [];
  const afternoonSlots: string[] = [];
  let bookedCount = 0;
  let freeCount = 0;

  for (const slot of allSlots) {
    const hour = Number(slot.split(":")[0]);
    const booking = bookedTimesMap.get(slot);

    let line: string;
    if (booking) {
      bookedCount++;
      line = `  *${slot}* │ ${booking.serviceName}\n           │ _${booking.clientName}_`;
    } else {
      freeCount++;
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
    lines.push("", `  ☀️  *MANHÃ*`, "");
    lines.push(...morningSlots);
  }

  if (afternoonSlots.length > 0) {
    lines.push("", `  🌙  *TARDE*`, "");
    lines.push(...afternoonSlots);
  }

  lines.push(
    "",
    separator,
    `  📊  *${bookedCount}* agendado${bookedCount !== 1 ? "s" : ""}  •  *${freeCount}* livre${freeCount !== 1 ? "s" : ""}`,
    separator,
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

  if (!schedule || !schedule.isAvailable) {
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

  const bookedTimesMap = new Map<
    string,
    { serviceName: string; clientName: string }
  >();
  for (const booking of bookings) {
    const timeKey = formatBrt(booking.date, "HH:mm");
    bookedTimesMap.set(timeKey, {
      serviceName: booking.service.name,
      clientName: booking.user.name,
    });
  }

  const allSlots = generateTimeSlots(
    date,
    schedule.startTime,
    schedule.endTime,
    DEFAULT_INTERVAL_MINUTES,
  );

  const dayLabel = DAY_OF_WEEK_LABELS[dayOfWeek];
  const dateFormatted = formatBrt(date, "dd/MM/yyyy");
  const professionalName =
    professional.displayName ?? professional.user.name ?? "Profissional";

  const message = buildScheduleMessage(
    dayLabel,
    dateFormatted,
    professionalName,
    allSlots,
    bookedTimesMap,
  );

  await sendGroupMessage(professionalId, professional.whatsappGroupName, message);
}
