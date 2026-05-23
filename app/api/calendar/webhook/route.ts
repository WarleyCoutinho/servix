// app/api/calendar/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCalendarClient } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  const channelId = req.headers.get("x-goog-channel-id");
  const resourceState = req.headers.get("x-goog-resource-state");

  if (resourceState === "sync") {
    return NextResponse.json({ ok: true });
  }

  if (!channelId?.startsWith("servix-")) {
    return NextResponse.json({ ok: true });
  }

  const userId = channelId.replace("servix-", "");

  try {
    const calendar = await getCalendarClient(userId);

    const { data } = await calendar.events.list({
      calendarId: "primary",
      showDeleted: true,
      updatedMin: new Date(Date.now() - 60_000).toISOString(),
      singleEvents: false,
    });

    const deletedEventIds = (data.items ?? [])
      .filter((e) => e.status === "cancelled")
      .map((e) => e.id!)
      .filter(Boolean);

    if (deletedEventIds.length > 0) {
      await prisma.booking.updateMany({
        where: {
          googleEventId: { in: deletedEventIds },
          cancelledAt: null, // 👈 dentro do where
        },
        data: { cancelledAt: new Date() },
      });
    }
  } catch (err) {
    console.error("Calendar webhook processing failed:", err);
  }

  return NextResponse.json({ ok: true });
}
