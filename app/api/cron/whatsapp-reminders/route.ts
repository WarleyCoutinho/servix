// app/api/cron/whatsapp-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppReminder } from "@/lib/whatsapp-reminder";
import { timingSafeEqual } from "crypto";

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

  const now = new Date();

  // Janelas de tempo — busca bookings que estão a 60min ou 30min do início
  // Tolerância de ±7 min pra cobrir variação do cron
  const windows = [
    { minutes: 60, label: "1h" },
    { minutes: 30, label: "30min" },
  ];

  let sent = 0;

  for (const { minutes } of windows) {
    const windowStart = new Date(now.getTime() + (minutes - 7) * 60_000);
    const windowEnd = new Date(now.getTime() + (minutes + 7) * 60_000);

    const bookings = await prisma.booking.findMany({
      where: {
        date: { gte: windowStart, lte: windowEnd },
        cancelledAt: null,
        clientPhone: { not: null }, // só quem tem telefone
      },
      include: {
        service: { select: { name: true } },
      },
    });

    for (const booking of bookings) {
      if (!booking.clientPhone) continue;

      // Evita mandar duplicado — verifica se já enviou esse lembrete
      const reminderKey = `reminder:${booking.id}:${minutes}`;
      const alreadySent = await prisma.notification.findFirst({
        where: {
          userId: booking.userId,
          title: reminderKey,
        },
      });

      if (alreadySent) continue;

      await sendWhatsAppReminder(
        booking.clientPhone,
        booking.clientName ?? "",
        booking.service.name,
        booking.date,
        minutes,
      );

      // Marca como enviado usando a tabela Notification como flag
      await prisma.notification.create({
        data: {
          userId: booking.userId,
          title: reminderKey,
          message: `Lembrete WhatsApp ${minutes}min enviado`,
          read: true, // já marca como lido — é só uma flag interna
        },
      });

      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent, checkedAt: now.toISOString() });
}
