import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendDailyScheduleToGroup } from "@/lib/whatsapp-schedule";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { format, startOfDay } from "date-fns";

const TIMEZONE = "America/Sao_Paulo";
const MIN_HOUR_TO_SEND = "07:00";
const MAX_HOUR_TO_SEND = "07:10";

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

  // ✅ FIX 🔴: usa fromZonedTime em vez de offset hardcoded (UTC-3)
  // Isso respeita horário de verão automaticamente (BRST = UTC-2)
  const startOfTodayBrt = startOfDay(nowBrt);
  const startOfTodayUtc = fromZonedTime(startOfTodayBrt, TIMEZONE);

  const professionals = await prisma.professional.findMany({
    where: {
      isActive: true,
      // ✅ FIX 🟢: filtra também string vazia além de null
      NOT: [{ whatsappGroupName: null }, { whatsappGroupName: "" }],
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
      // ✅ FIX 🟡: marca como enviado ANTES de enviar para evitar race condition
      // em caso de retry simultâneo do cron (Vercel, Railway, etc.)
      await prisma.professional.update({
        where: { id: p.id },
        data: { lastScheduleSentAt: nowUtc },
      });

      // Se o envio falhar, o campo já está marcado — comportamento seguro:
      // evita spam em caso de falha parcial. Ajuste se preferir reverter em erro.
      await sendDailyScheduleToGroup(p.id, nowUtc);
    }),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;

  // ✅ FIX 🟡: loga detalhes dos erros em vez de engolir silenciosamente
  const failedResults = results.filter(
    (r): r is PromiseRejectedResult => r.status === "rejected",
  );

  if (failedResults.length > 0) {
    console.error(
      `[cron/send-schedule] ${failedResults.length} envio(s) falharam:`,
      failedResults.map((r, i) => ({
        index: i,
        professionalId: professionals[i]?.id,
        reason: r.reason instanceof Error ? r.reason.message : r.reason,
      })),
    );
  }

  return Response.json({
    sent,
    failed: failedResults.length,
    total: professionals.length,
    debug: {
      currentTimeBrt: currentTime,
      startOfTodayUtc: startOfTodayUtc.toISOString(),
    },
  });
}
