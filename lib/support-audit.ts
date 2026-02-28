import { prisma } from "@/lib/prisma";
import type { SupportAuditAction } from "@/generated/prisma/enums";

export function logSupportAction(
  action: SupportAuditAction,
  ticketId: string,
  userId: string,
  metadata?: Record<string, string | number | boolean>,
) {
  prisma.supportAuditLog
    .create({
      data: {
        action,
        ticketId,
        userId,
        metadata: metadata ?? undefined,
      },
    })
    .catch((err) => console.error("Audit log error:", err));
}
