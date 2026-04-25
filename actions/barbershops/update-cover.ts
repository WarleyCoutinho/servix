"use server";

import { subscribedOwnerActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const inputSchema = z.object({
  barbershopId: z.string().min(1),
  imageUrl: z.string().min(1),
});

export const updateBarbershopCover = subscribedOwnerActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const barbershop = await prisma.barbershop.findUnique({
      where: { id: parsedInput.barbershopId },
      select: { ownerId: true },
    });

    if (!barbershop || barbershop.ownerId !== user.id) {
      throw new Error("Sem permissão");
    }

    await prisma.barbershop.update({
      where: { id: parsedInput.barbershopId },
      data: { imageUrl: parsedInput.imageUrl },
    });

    revalidatePath(`/barbershop/${parsedInput.barbershopId}`);

    return { success: true };
  });
