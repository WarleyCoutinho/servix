// lib/calendar-watch.ts
import { getCalendarClient } from "./google-calendar";
import { prisma } from "@/lib/prisma";

export async function watchCalendar(userId: string) {
  // Watch exige HTTPS público — não funciona em localhost
  if (process.env.NEXT_PUBLIC_APP_URL?.includes("localhost")) {
    console.log("Calendar watch ignorado em desenvolvimento (requer HTTPS)");
    return;
  }

  const calendar = await getCalendarClient(userId);

  const channelId = `servix-${userId}`;
  const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;

  await calendar.events.watch({
    calendarId: "primary",
    requestBody: {
      id: channelId,
      type: "web_hook",
      address: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/webhook`,
      expiration: String(expiration),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { calendarWatchExpiry: new Date(expiration) },
  });
}

export async function stopCalendarWatch(userId: string, resourceId: string) {
  const calendar = await getCalendarClient(userId);

  await calendar.channels
    .stop({
      requestBody: {
        id: `servix-${userId}`,
        resourceId,
      },
    })
    .catch(() => {});
}
