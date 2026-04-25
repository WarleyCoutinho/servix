"use server";

import { z } from "zod";
import { subscribedOwnerActionClient } from "@/lib/action-client";
import { returnValidationErrors } from "next-safe-action";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkBarbershopLimit } from "@/lib/plan-limits";
import { DayOfWeek } from "@/generated/prisma/enums";
import { DAY_OF_WEEK_ORDER } from "@/lib/day-of-week";
import { slugify } from "@/lib/slugify";

const cpfRegex = /^\d{11}$/;

const inputSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  description: z.string().optional(),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  imageUrl: z.string().optional(),
  cpf: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => cpfRegex.test(val), {
      message: "CPF inválido. Deve conter 11 dígitos.",
    })
    .optional(),
});

export const createBarbershop = subscribedOwnerActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const limitCheck = await checkBarbershopLimit(user.id);
    if (!limitCheck.allowed) {
      throw new Error(limitCheck.message);
    }

    const existingProfessional = await prisma.professional.findUnique({
      where: { userId: user.id },
    });

    const needsCreateProfessional = !existingProfessional;

    if (needsCreateProfessional && !parsedInput.cpf) {
      returnValidationErrors(inputSchema, {
        cpf: {
          _errors: ["CPF é obrigatório para criar seu perfil profissional."],
        },
      });
    }

    if (needsCreateProfessional && parsedInput.cpf) {
      const cpfExists = await prisma.professional.findUnique({
        where: { cpf: parsedInput.cpf },
      });
      if (cpfExists) {
        returnValidationErrors(inputSchema, {
          cpf: {
            _errors: ["Este CPF já está cadastrado por outro profissional."],
          },
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const baseSlug = slugify(parsedInput.name);
      const existingSlug = await tx.barbershop.findUnique({
        where: { slug: baseSlug },
      });
      const slug = existingSlug ? `${baseSlug}-${Date.now()}` : baseSlug;

      const barbershop = await tx.barbershop.create({
        data: {
          name: parsedInput.name,
          slug,
          address: parsedInput.address,
          city: parsedInput.city,
          state: parsedInput.state,
          description: parsedInput.description || "",
          phones: [parsedInput.phone],
          imageUrl:
            parsedInput.imageUrl ||
            "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
          ownerId: user.id,
        },
      });

      if (needsCreateProfessional && parsedInput.cpf) {
        const professional = await tx.professional.create({
          data: {
            cpf: parsedInput.cpf,
            displayName: user.name,
            userId: user.id,
            barbershopId: barbershop.id,
            acceptsPix: false,
            acceptsCard: true,
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
      }

      return barbershop;
    });

    revalidatePath("/dashboard/owner/establishments");
    revalidatePath("/dashboard/owner");

    return {
      success: true,
      barbershop: result,
      message: `Estabelecimento "${result.name}" criado com sucesso!`,
    };
  });
