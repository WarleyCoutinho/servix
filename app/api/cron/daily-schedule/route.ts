import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendDailyScheduleToGroup } from "@/lib/whatsapp-schedule";
import { toZonedTime } from "date-fns-tz";
import { format, startOfDay } from "date-fns";

const TIMEZONE = "America/Sao_Paulo";
const MIN_HOUR_TO_SEND = "16:50";
const MAX_HOUR_TO_SEND = "16:55";

function verifyBearerToken(
  authHeader: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  if (token.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!verifyBearerToken(authHeader, process.env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Converte para horário de Brasília (servidor roda em UTC)
  const nowUtc = new Date();
  const nowBrt = toZonedTime(nowUtc, TIMEZONE);
  const currentTime = format(nowBrt, "HH:mm");

  // Janela de envio: só executa entre 07:00 e 07:10 BRT
  if (currentTime < MIN_HOUR_TO_SEND || currentTime > MAX_HOUR_TO_SEND) {
    return Response.json({
      sent: 0,
      failed: 0,
      total: 0,
      skipped: true,
      reason: `Fora da janela de envio (${MIN_HOUR_TO_SEND}–${MAX_HOUR_TO_SEND}). Horário atual BRT: ${currentTime}.`,
    });
  }

  // startOfDay em BRT convertido corretamente para UTC para comparar com o banco
  const startOfTodayBrt = startOfDay(nowBrt);
  const startOfTodayUtc = new Date(
    Date.UTC(
      startOfTodayBrt.getFullYear(),
      startOfTodayBrt.getMonth(),
      startOfTodayBrt.getDate(),
      3, // BRT = UTC-3, então meia-noite BRT = 03:00 UTC
      0,
      0,
    ),
  );

  const professionals = await prisma.professional.findMany({
    where: {
      whatsappGroupName: { not: null },
      isActive: true,
      OR: [
        { lastScheduleSentAt: null },
        { lastScheduleSentAt: { lt: startOfTodayUtc } },
      ],
    },
    select: { id: true },
  });

  if (professionals.length === 0) {
    return Response.json({
      sent: 0,
      failed: 0,
      total: 0,
      skipped: true,
      reason: "Todos os profissionais já receberam a agenda hoje.",
    });
  }

  const results = await Promise.allSettled(
    professionals.map(async (p) => {
      await sendDailyScheduleToGroup(p.id, nowUtc);

      await prisma.professional.update({
        where: { id: p.id },
        data: { lastScheduleSentAt: nowUtc },
      });
    }),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return Response.json({
    sent,
    failed,
    total: professionals.length,
    debug: {
      currentTimeBrt: currentTime,
      startOfTodayUtc: startOfTodayUtc.toISOString(),
    },
  });
}
