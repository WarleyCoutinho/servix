"use server";

import { z } from "zod";
import { subscribedOwnerActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkServiceLimit } from "@/lib/plan-limits";

const inputSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z
    .string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres"),
  priceInCents: z.number().min(100, "Preço mínimo é R$ 1,00"),
  durationMinutes: z.number().min(5, "Duração mínima é 5 minutos"),
  imageUrl: z.string().min(1, "URL da imagem inválida").optional(),
  // ▼ OPCIONAIS
  continuousSchedule: z.boolean().optional(),
  maxSimultaneous: z.number().int().min(1).optional(),
});

export const createService = subscribedOwnerActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx: { barbershop } }) => {
    const limitCheck = await checkServiceLimit(barbershop.id);
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.message);
    }

    const isContinuous = parsedInput.continuousSchedule === true;

    const service = await prisma.barbershopService.create({
      data: {
        name: parsedInput.name,
        description: parsedInput.description,
        priceInCents: parsedInput.priceInCents,
        durationMinutes: parsedInput.durationMinutes,
        imageUrl:
          parsedInput.imageUrl ||
          "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400",
        barbershopId: barbershop.id,
        continuousSchedule: isContinuous,
        // maxSimultaneous só é relevante em horário corrido;
        // quando desativado gravamos 1 (padrão = sem concorrência)
        maxSimultaneous: isContinuous ? (parsedInput.maxSimultaneous ?? 2) : 1,
      },
    });

    revalidatePath("/dashboard/owner/services");
    return service;
  });
