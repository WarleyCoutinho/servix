"use server";

import { z } from "zod";
import { subscribedOwnerActionClient } from "@/lib/action-client";
import { returnValidationErrors } from "next-safe-action";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const inputSchema = z.object({
  professionalId: z.uuid(),
  displayName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  bio: z.string().optional(),
  email: z.email("Email inválido"),
  acceptsPix: z.boolean().optional(),
  acceptsCard: z.boolean().optional(),
  acceptsPayAfterService: z.boolean().optional(),
  whatsappGroupName: z.string().optional(),
});

export const updateProfessional = subscribedOwnerActionClient
  .inputSchema(inputSchema)
  .action(
    async ({
      parsedInput: { professionalId, displayName, bio, email, acceptsPix, acceptsCard, acceptsPayAfterService, whatsappGroupName },
      ctx: { barbershop },
    }) => {
      const professional = await prisma.professional.findUnique({
        where: { id: professionalId },
        include: { user: true },
      });

      if (!professional) {
        returnValidationErrors(inputSchema, {
          professionalId: { _errors: ["Profissional não encontrado."] },
        });
      }

      if (professional.barbershopId !== barbershop.id) {
        returnValidationErrors(inputSchema, {
          _errors: ["Você não tem permissão para alterar este profissional."],
        });
      }

      if (email !== professional.user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser && existingUser.id !== professional.userId) {
          returnValidationErrors(inputSchema, {
            email: { _errors: ["Este email já está em uso por outro usuário."] },
          });
        }
      }

      if (acceptsPix === false && acceptsCard === false && !acceptsPayAfterService) {
        throw new Error("O profissional deve aceitar pelo menos uma forma de pagamento.");
      }

      const [updatedProfessional] = await prisma.$transaction([
        prisma.professional.update({
          where: { id: professionalId },
          data: {
            displayName,
            bio,
            ...(acceptsPix !== undefined && { acceptsPix }),
            ...(acceptsCard !== undefined && { acceptsCard }),
            ...(acceptsPayAfterService !== undefined && { acceptsPayAfterService }),
            ...(whatsappGroupName !== undefined && { whatsappGroupName: whatsappGroupName || null }),
          },
          include: { user: true },
        }),
        prisma.user.update({
          where: { id: professional.userId },
          data: { email },
        }),
      ]);

      revalidatePath("/dashboard/owner/professionals");
      revalidatePath(`/dashboard/owner/professionals/${professionalId}`);
      return updatedProfessional;
    },
  );
