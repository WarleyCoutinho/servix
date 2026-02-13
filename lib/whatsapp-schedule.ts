import { prisma } from "@/lib/prisma";
import { DAY_OF_WEEK_LABELS } from "@/lib/day-of-week";
import {
  getDayOfWeekFromDate,
  generateTimeSlots,
  DEFAULT_INTERVAL_MINUTES,
} from "@/lib/schedule-utils";
import { sendGroupMessage } from "@/lib/whatsapp";
import { startOfDayBrt, endOfDayBrt, formatBrt } from "@/lib/timezone";

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

  let bookedCount = 0;
  let freeCount = 0;

  const slotLines = allSlots.map((slot) => {
    const booking = bookedTimesMap.get(slot);
    if (booking) {
      bookedCount++;
      return `⏰ ${slot} - ${booking.serviceName} - *${booking.clientName}*`;
    }
    freeCount++;
    return `⏰ ${slot} - 🟢 Disponível`;
  });

  const message = [
    `📋 *Agenda - ${dayLabel}, ${dateFormatted}*`,
    `👤 *${professionalName}*`,
    "",
    ...slotLines,
    "",
    `📊 ${bookedCount} agendamento${bookedCount !== 1 ? "s" : ""} | ${freeCount} horário${freeCount !== 1 ? "s" : ""} livre${freeCount !== 1 ? "s" : ""}`,
  ].join("\n");

  await sendGroupMessage(professionalId, professional.whatsappGroupName, message);
}
