"use server";

import { adminActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import z from "zod";

const inputSchema = z.object({
  barbershopId: z.uuid(),
  platformFeePercentage: z.number().int().min(0).max(100).nullable(),
});

export const updateBarbershopFee = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { barbershopId, platformFeePercentage } }) => {
    const barbershop = await prisma.barbershop.update({
      where: { id: barbershopId },
      data: { platformFeePercentage },
      select: {
        id: true,
        name: true,
        platformFeePercentage: true,
      },
    });

    return barbershop;
  });
