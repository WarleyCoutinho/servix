"use server";

import { z } from "zod";
import { subscribedOwnerActionClient } from "@/lib/action-client";
import { returnValidationErrors } from "next-safe-action";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const inputSchema = z.object({
  professionalId: z.uuid(),
  isActive: z.boolean(),
});

export const toggleProfessionalStatus = subscribedOwnerActionClient
  .inputSchema(inputSchema)
  .action(
    async ({ parsedInput: { professionalId, isActive }, ctx: { barbershop } }) => {
      const professional = await prisma.professional.findUnique({
        where: { id: professionalId },
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

      const updatedProfessional = await prisma.professional.update({
        where: { id: professionalId },
        data: { isActive },
      });

      revalidatePath("/dashboard/owner/professionals");
      return updatedProfessional;
    },
  );
