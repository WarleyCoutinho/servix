"use server";

import { z } from "zod";
import { subscribedOwnerActionClient } from "@/lib/action-client";
import { returnValidationErrors } from "next-safe-action";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkProfessionalLimit, getUserPlanInfo } from "@/lib/plan-limits";

const cpfRegex = /^\d{11}$/;

const inputSchema = z.object({
  cpf: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => cpfRegex.test(val), {
      message: "CPF inválido. Deve conter 11 dígitos.",
    }),
  displayName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
});

export const createProfessional = subscribedOwnerActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx: { barbershop, user } }) => {
    const planInfo = await getUserPlanInfo(user.id, barbershop.id);
    if (planInfo?.isBasicPlan) {
      throw new Error(
        "O plano Básico não permite adicionar profissionais. Faça upgrade para o plano Standard ou superior.",
      );
    }

    const limitCheck = await checkProfessionalLimit(barbershop.id);
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.message);
    }

    const existingProfessional = await prisma.professional.findUnique({
      where: { cpf: parsedInput.cpf },
    });

    if (existingProfessional) {
      if (existingProfessional.barbershopId === barbershop.id) {
        returnValidationErrors(inputSchema, {
          cpf: { _errors: ["Este profissional já está cadastrado na sua barbearia."] },
        });
      }

      returnValidationErrors(inputSchema, {
        cpf: {
          _errors: [
            "Este CPF já está cadastrado em outra barbearia. O profissional precisa ser removido da barbearia atual antes de ser adicionado à sua.",
          ],
        },
      });
    }

    let targetUser = await prisma.user.findUnique({
      where: { email: parsedInput.email },
    });

    if (!targetUser) {
      targetUser = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: parsedInput.email,
          name: parsedInput.displayName,
          role: "professional",
        },
      });
    } else {
      if (targetUser.role !== "client") {
        returnValidationErrors(inputSchema, {
          email: {
            _errors: [
              "Este email já está associado a um usuário que não é cliente.",
            ],
          },
        });
      }

      await prisma.user.update({
        where: { id: targetUser.id },
        data: { role: "professional" },
      });
    }

    const professional = await prisma.professional.create({
      data: {
        cpf: parsedInput.cpf,
        displayName: parsedInput.displayName,
        userId: targetUser.id,
        barbershopId: barbershop.id,
        acceptsPix: false,
        acceptsCard: false,
      },
      include: {
        user: true,
      },
    });

    revalidatePath("/dashboard/owner/professionals");
    return professional;
  });
