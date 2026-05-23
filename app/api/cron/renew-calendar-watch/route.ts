// app/api/cron/renew-calendar-watch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { watchCalendar } from "@/lib/calendar-watch";

function validateCron(req: NextRequest): boolean {
  const provided =
    req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const expected = process.env.CRON_SECRET ?? "";
  if (!provided || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function GET(req: NextRequest) {
  if (!validateCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expiringSoon = await prisma.user.findMany({
    where: {
      calendarWatchExpiry: {
        lte: new Date(Date.now() + 24 * 60 * 60 * 1000),
        gte: new Date(),
      },
    },
    select: { id: true },
  });

  const results = await Promise.allSettled(
    expiringSoon.map((u) => watchCalendar(u.id)),
  );

  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({
    renewed: expiringSoon.length - failed,
    failed,
  });
}
