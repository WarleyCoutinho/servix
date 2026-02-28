"use server";

import { supportActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import z from "zod";

const inputSchema = z.object({
  professionalId: z.string().uuid(),
});

export const getManualActivationLogs = supportActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { professionalId } }) => {
    const logs = await prisma.manualActivationLog.findMany({
      where: { professionalId },
      orderBy: { performedAt: "desc" },
      take: 20,
    });

    const performerIds = [
      ...new Set(logs.map((l) => l.performedById)),
    ];

    const performers =
      performerIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: performerIds } },
            select: { id: true, name: true },
          })
        : [];

    const performerMap = new Map(performers.map((p) => [p.id, p.name]));

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      reason: log.reason,
      stripeStatusAtMoment: log.stripeStatusAtMoment,
      performedByName: performerMap.get(log.performedById) ?? "Sistema",
      performedByRole: log.performedByRole,
      performedAt: log.performedAt,
    }));
  });
