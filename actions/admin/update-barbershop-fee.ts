"use server";

import { adminActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { isValidFeePercentage } from "@/lib/platform-fee";
import z from "zod";

const inputSchema = z.object({
  barbershopId: z.uuid(),
  platformFeePercentage: z.number().int().min(0).max(10).nullable(),
  reason: z.string().optional(),
});

export const updateBarbershopFee = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { barbershopId, platformFeePercentage, reason }, ctx }) => {
    if (!isValidFeePercentage(platformFeePercentage)) {
      throw new Error("Taxa deve estar entre 0% e 10%");
    }

    const currentBarbershop = await prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: {
        id: true,
        name: true,
        platformFeePercentage: true,
        feeOverride: true,
        ownerId: true,
      },
    });

    if (!currentBarbershop) {
      throw new Error("Barbearia não encontrada");
    }

    const updatedBarbershop = await prisma.$transaction(async (tx) => {
      const updated = await tx.barbershop.update({
        where: { id: barbershopId },
        data: {
          platformFeePercentage,
          feeOverride: true,
        },
        select: {
          id: true,
          name: true,
          platformFeePercentage: true,
          feeOverride: true,
          createdAt: true,
        },
      });

      await tx.platformFeeHistory.create({
        data: {
          barbershopId,
          fromFeePercentage: currentBarbershop.platformFeePercentage,
          toFeePercentage: platformFeePercentage,
          fromFeeOverride: currentBarbershop.feeOverride,
          toFeeOverride: true,
          reason,
          changedBy: ctx.user.id,
        },
      });

      if (currentBarbershop.ownerId) {
        await tx.notification.create({
          data: {
            userId: currentBarbershop.ownerId,
            title: "Taxa de plataforma atualizada",
            message: `A taxa da sua barbearia "${currentBarbershop.name}" foi atualizada para ${platformFeePercentage !== null ? `${platformFeePercentage}%` : "automática"}.${reason ? ` Motivo: ${reason}` : ""}`,
          },
        });
      }

      return updated;
    });

    return updatedBarbershop;
  });
