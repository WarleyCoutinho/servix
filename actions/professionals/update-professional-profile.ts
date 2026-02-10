"use server";

import { z } from "zod";
import { professionalActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const inputSchema = z.object({
  displayName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  bio: z.string().optional(),
  imageUrl: z.string().url("URL inválida").optional().nullable(),
  acceptsPix: z.boolean().optional(),
  acceptsCard: z.boolean().optional(),
});

export const updateProfessionalProfile = professionalActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx: { professional } }) => {
    const { displayName, bio, imageUrl, acceptsPix, acceptsCard } = parsedInput;

    if (acceptsPix === false && acceptsCard === false) {
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
      },
      include: {
        user: true,
        barbershop: true,
      },
    });

    revalidatePath("/dashboard/professional");
    return updated;
  });
