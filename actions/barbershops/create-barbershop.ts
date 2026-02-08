"use server";

import { z } from "zod";
import { subscribedOwnerActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkBarbershopLimit } from "@/lib/plan-limits";

const inputSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  description: z.string().optional(),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
});

export const createBarbershop = subscribedOwnerActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const limitCheck = await checkBarbershopLimit(user.id);
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.message);
    }

    const barbershop = await prisma.barbershop.create({
      data: {
        name: parsedInput.name,
        address: parsedInput.address,
        description: parsedInput.description || "",
        phones: [parsedInput.phone],
        imageUrl: "/banner.png",
        ownerId: user.id,
      },
    });

    revalidatePath("/dashboard/owner/establishments");
    revalidatePath("/dashboard/owner");

    return {
      success: true,
      barbershop,
      message: `Estabelecimento "${barbershop.name}" criado com sucesso!`,
    };
  });
