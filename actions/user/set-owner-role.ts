"use server";

import { z } from "zod";
import { protectedActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DayOfWeek, UserRole } from "@/generated/prisma/enums";
import { DAY_OF_WEEK_ORDER } from "@/lib/day-of-week";
import { slugify } from "@/lib/slugify";

const cpfRegex = /^\d{11}$/;

const inputSchema = z.object({
  barbershopName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  description: z
    .string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres"),
  phone: z.string().min(10, "Telefone inválido"),
  imageUrl: z.string().optional(),
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

    if (
      existingUser.role === UserRole.owner &&
      existingUser.ownedBarbershops.length > 0
    ) {
      throw new Error("Você já possui uma barbearia cadastrada.");
    }

    if (existingUser.role === UserRole.professional) {
      throw new Error(
        "Você já está cadastrado como profissional. Não é possível ser proprietário ao mesmo tempo.",
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

      const baseSlug = slugify(parsedInput.barbershopName);
      const existingSlug = await tx.barbershop.findUnique({
        where: { slug: baseSlug },
      });
      const slug = existingSlug ? `${baseSlug}-${Date.now()}` : baseSlug;

      const barbershop = await tx.barbershop.create({
        data: {
          name: parsedInput.barbershopName,
          slug,
          address: parsedInput.address,
          city: parsedInput.city,
          state: parsedInput.state,
          description: parsedInput.description,
          phones: [parsedInput.phone],
          imageUrl:
            parsedInput.imageUrl ||
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
          ownerId: user.id,
        },
      });

      const professional = await tx.professional.create({
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

      await tx.professionalSchedule.createMany({
        data: DAY_OF_WEEK_ORDER.map((day) => ({
          professionalId: professional.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "18:00",
          isAvailable: day !== DayOfWeek.SATURDAY && day !== DayOfWeek.SUNDAY,
        })),
      });

      return barbershop;
    });

    revalidatePath("/");
    revalidatePath("/dashboard/owner");

    return { success: true, barbershopId: result.id };
  });
