import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendDailyScheduleToGroup } from "@/lib/whatsapp-schedule";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

const TIMEZONE = "America/Sao_Paulo";
const MIN_HOUR_TO_SEND = "07:00";

function verifyBearerToken(authHeader: string | null, secret: string | undefined): boolean {
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

  const nowBrt = toZonedTime(new Date(), TIMEZONE);
  const currentTime = format(nowBrt, "HH:mm");

  if (currentTime < MIN_HOUR_TO_SEND) {
    return Response.json({
      sent: 0,
      failed: 0,
      total: 0,
      skipped: true,
      reason: `Horário atual (${currentTime}) é antes das ${MIN_HOUR_TO_SEND}. Agenda será enviada a partir das ${MIN_HOUR_TO_SEND}.`,
    });
  }

  const professionals = await prisma.professional.findMany({
    where: {
      whatsappGroupName: { not: null },
      isActive: true,
    },
    select: { id: true },
  });

  const today = new Date();
  const results = await Promise.allSettled(
    professionals.map((p) => sendDailyScheduleToGroup(p.id, today)),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return Response.json({ sent, failed, total: professionals.length });
}
