"use server";

import { z } from "zod";
import { subscribedOwnerActionClient } from "@/lib/action-client";
import { returnValidationErrors } from "next-safe-action";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const inputSchema = z.object({
  id: z.string().uuid("ID inválido"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  priceInCents: z.number().min(100, "Preço mínimo é R$ 1,00"),
  durationMinutes: z.number().min(5, "Duração mínima é 5 minutos"),
  imageUrl: z.string().url("URL da imagem inválida").optional(),
});

export const updateService = subscribedOwnerActionClient
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

    const service = await prisma.barbershopService.update({
      where: { id: parsedInput.id },
      data: {
        name: parsedInput.name,
        description: parsedInput.description,
        priceInCents: parsedInput.priceInCents,
        durationMinutes: parsedInput.durationMinutes,
        imageUrl: parsedInput.imageUrl,
      },
    });

    revalidatePath("/dashboard/owner/services");
    return service;
  });
