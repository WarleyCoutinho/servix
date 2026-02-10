"use server";

import { z } from "zod";
import { protectedActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserRole } from "@/generated/prisma/enums";

const cpfRegex = /^\d{11}$/;

const inputSchema = z.object({
  barbershopName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  phone: z.string().min(10, "Telefone inválido"),
  ownerCpf: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => cpfRegex.test(val), {
      message: "CPF inválido. Deve conter 11 dígitos.",
    }),
});

export const setOwnerRole = protectedActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { ownedBarbershops: true },
    });

    if (!existingUser) {
      throw new Error("Usuário não encontrado.");
    }

    if (existingUser.role === UserRole.owner && existingUser.ownedBarbershops.length > 0) {
      throw new Error("Você já possui uma barbearia cadastrada.");
    }

    if (existingUser.role === UserRole.professional) {
      throw new Error(
        "Você já está cadastrado como profissional. Não é possível ser proprietário ao mesmo tempo."
      );
    }

    const existingCpf = await prisma.professional.findUnique({
      where: { cpf: parsedInput.ownerCpf },
    });

    if (existingCpf) {
      throw new Error("Este CPF já está cadastrado no sistema.");
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { role: UserRole.owner },
      });

      const barbershop = await tx.barbershop.create({
        data: {
          name: parsedInput.barbershopName,
          address: parsedInput.address,
          description: parsedInput.description,
          phones: [parsedInput.phone],
          imageUrl: "/banner.png",
          ownerId: user.id,
        },
      });

      await tx.professional.create({
        data: {
          userId: user.id,
          barbershopId: barbershop.id,
          cpf: parsedInput.ownerCpf,
          displayName: existingUser.name,
          isActive: true,
          acceptsCard: true,
          acceptsPix: false,
        },
      });

      return barbershop;
    });

    revalidatePath("/");
    revalidatePath("/dashboard/owner");

    return { success: true, barbershopId: result.id };
  });
