"use server";

import { z } from "zod";
import { subscribedOwnerActionClient } from "@/lib/action-client";
import { returnValidationErrors } from "next-safe-action";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const cpfRegex = /^\d{11}$/;

const inputSchema = z.object({
  cpf: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => cpfRegex.test(val), {
      message: "CPF inválido. Deve conter 11 dígitos.",
    }),
  displayName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.email("Email inválido"),
  bio: z.string().optional(),
  imageUrl: z.url().optional(),
  acceptsPix: z.boolean().default(false),
  acceptsCard: z.boolean().default(true),
});

export const createProfessional = subscribedOwnerActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx: { barbershop } }) => {
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

    let user = await prisma.user.findUnique({
      where: { email: parsedInput.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: parsedInput.email,
          name: parsedInput.displayName,
          role: "PROFESSIONAL",
        },
      });
    } else {
      if (user.role !== "CLIENT") {
        returnValidationErrors(inputSchema, {
          email: {
            _errors: [
              "Este email já está associado a um usuário que não é cliente.",
            ],
          },
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { role: "PROFESSIONAL" },
      });
    }

    const professional = await prisma.professional.create({
      data: {
        cpf: parsedInput.cpf,
        displayName: parsedInput.displayName,
        bio: parsedInput.bio,
        imageUrl: parsedInput.imageUrl,
        acceptsPix: parsedInput.acceptsPix,
        acceptsCard: parsedInput.acceptsCard,
        userId: user.id,
        barbershopId: barbershop.id,
      },
      include: {
        user: true,
      },
    });

    revalidatePath("/dashboard/owner/professionals");
    return professional;
  });
