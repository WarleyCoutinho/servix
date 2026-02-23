"use server";

import { adminActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import z from "zod";

const inputSchema = z.object({
  barbershopId: z.uuid(),
});

export const getFeeHistory = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { barbershopId } }) => {
    const history = await prisma.platformFeeHistory.findMany({
      where: { barbershopId },
      orderBy: { changedAt: "desc" },
      take: 20,
    });

    const adminIds = history
      .map((h) => h.changedBy)
      .filter((id): id is string => id !== null);

    const admins = adminIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: adminIds } },
          select: { id: true, name: true },
        })
      : [];

    const adminMap = new Map(admins.map((a) => [a.id, a.name]));

    return history.map((h) => ({
      id: h.id,
      fromFeePercentage: h.fromFeePercentage,
      toFeePercentage: h.toFeePercentage,
      fromFeeOverride: h.fromFeeOverride,
      toFeeOverride: h.toFeeOverride,
      reason: h.reason,
      changedByName: h.changedBy ? adminMap.get(h.changedBy) ?? "Admin" : "Sistema",
      changedAt: h.changedAt,
    }));
  });
