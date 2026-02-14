import { prisma } from "@/lib/prisma";
import { sendDailyScheduleToGroup } from "@/lib/whatsapp-schedule";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
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
