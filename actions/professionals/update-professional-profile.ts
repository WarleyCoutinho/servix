"use server";

import { z } from "zod";
import { professionalActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const inputSchema = z.object({
  displayName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  bio: z.string().optional(),
  imageUrl: z.string().min(1, "URL inválida").optional().nullable(),
  acceptsPix: z.boolean().optional(),
  acceptsCard: z.boolean().optional(),
  acceptsPayAfterService: z.boolean().optional(),
  whatsappGroupName: z.string().optional(),
});

export const updateProfessionalProfile = professionalActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx: { professional } }) => {
    const { displayName, bio, imageUrl, acceptsPix, acceptsCard, acceptsPayAfterService, whatsappGroupName } = parsedInput;

    if (acceptsPix === false && acceptsCard === false && acceptsPayAfterService === false) {
      throw new Error(
        "Você deve aceitar pelo menos uma forma de pagamento.",
      );
    }

    const updated = await prisma.professional.update({
      where: { id: professional.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(acceptsPix !== undefined && { acceptsPix }),
        ...(acceptsCard !== undefined && { acceptsCard }),
        ...(acceptsPayAfterService !== undefined && { acceptsPayAfterService }),
        ...(whatsappGroupName !== undefined && { whatsappGroupName: whatsappGroupName || null }),
      },
      include: {
        user: true,
        barbershop: true,
      },
    });

    revalidatePath("/dashboard/professional");
    revalidatePath("/dashboard/professional/settings");
    return updated;
  });
