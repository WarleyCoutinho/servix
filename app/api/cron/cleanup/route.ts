import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

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

  const now = Date.now();
  const sixtyDaysAgo = new Date(now - SIXTY_DAYS_MS);
  const ninetyDaysAgo = new Date(now - NINETY_DAYS_MS);

  const results: Record<string, number> = {};

  const auditLogs = await prisma.supportAuditLog.deleteMany({
    where: { createdAt: { lt: ninetyDaysAgo } },
  });
  results.supportAuditLogs = auditLogs.count;

  const resolvedTicketIds = await prisma.supportTicket.findMany({
    where: {
      status: "RESOLVED",
      closedAt: { lt: ninetyDaysAgo },
    },
    select: { id: true },
  });

  if (resolvedTicketIds.length > 0) {
    const ids = resolvedTicketIds.map((t) => t.id);

    const messages = await prisma.supportMessage.deleteMany({
      where: { ticketId: { in: ids } },
    });
    results.supportMessages = messages.count;

    const ticketAuditLogs = await prisma.supportAuditLog.deleteMany({
      where: { ticketId: { in: ids } },
    });
    results.supportAuditLogs += ticketAuditLogs.count;

    const tickets = await prisma.supportTicket.deleteMany({
      where: { id: { in: ids } },
    });
    results.supportTickets = tickets.count;
  } else {
    results.supportMessages = 0;
    results.supportTickets = 0;
  }

  const uploads = await prisma.upload.deleteMany({
    where: {
      permanente: false,
      createdAt: { lt: sixtyDaysAgo },
    },
  });
  results.uploads = uploads.count;

  const notifications = await prisma.notification.deleteMany({
    where: {
      read: true,
      createdAt: { lt: sixtyDaysAgo },
    },
  });
  results.notifications = notifications.count;

  const sessions = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  results.sessions = sessions.count;

  const stripeEvents = await prisma.stripeEvent.deleteMany({
    where: { processedAt: { lt: ninetyDaysAgo } },
  });
  results.stripeEvents = stripeEvents.count;

  const total = Object.values(results).reduce((sum, n) => sum + n, 0);

  console.log(`[cleanup] Deleted ${total} records:`, results);

  return Response.json({
    success: true,
    deleted: results,
    total,
    timestamp: new Date().toISOString(),
  });
}
