"use server";

import { z } from "zod";
import { adminActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { SubscriptionPlan } from "@/generated/prisma/enums";

const inputSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(5, "Descrição deve ter pelo menos 5 caracteres"),
  priceInCents: z.number().min(0, "Preço não pode ser negativo"),
  stripePriceId: z.string().min(1, "Price ID do Stripe é obrigatório"),
  maxBarbershops: z.number().min(1, "Mínimo de 1 estabelecimento"),
  maxProfessionals: z.number().min(1, "Mínimo de 1 profissional"),
  maxServices: z.number().min(1).nullable(),
  features: z.array(z.string()),
  isActive: z.boolean(),
});

export const updatePlan = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput }) => {
    const updatedPlan = await prisma.planConfig.update({
      where: { plan: parsedInput.plan },
      data: {
        name: parsedInput.name,
        description: parsedInput.description,
        priceInCents: parsedInput.priceInCents,
        stripePriceId: parsedInput.stripePriceId,
        maxBarbershops: parsedInput.maxBarbershops,
        maxProfessionals: parsedInput.maxProfessionals,
        maxServices: parsedInput.maxServices,
        features: parsedInput.features,
        isActive: parsedInput.isActive,
      },
    });

    return {
      id: updatedPlan.id,
      plan: updatedPlan.plan,
      name: updatedPlan.name,
      description: updatedPlan.description,
      priceInCents: updatedPlan.priceInCents,
      stripePriceId: updatedPlan.stripePriceId,
      maxBarbershops: updatedPlan.maxBarbershops,
      maxProfessionals: updatedPlan.maxProfessionals,
      maxServices: updatedPlan.maxServices,
      features: updatedPlan.features,
      isActive: updatedPlan.isActive,
    };
  });
