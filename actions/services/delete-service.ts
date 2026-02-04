"use server";

import { z } from "zod";
import { subscribedOwnerActionClient } from "@/lib/action-client";
import { returnValidationErrors } from "next-safe-action";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const inputSchema = z.object({
  id: z.string().uuid("ID inválido"),
});

export const deleteService = subscribedOwnerActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx: { barbershop } }) => {
    const existingService = await prisma.barbershopService.findUnique({
      where: { id: parsedInput.id },
    });

    if (!existingService || existingService.barbershopId !== barbershop.id) {
      returnValidationErrors(inputSchema, {
        id: { _errors: ["Serviço não encontrado."] },
      });
    }

    // Soft delete - marca como deletado mas mantém para histórico de bookings
    await prisma.barbershopService.update({
      where: { id: parsedInput.id },
      data: { deletedAt: new Date() },
    });

    revalidatePath("/dashboard/owner/services");
    return { success: true };
  });
