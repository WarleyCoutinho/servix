"use server";

import { z } from "zod";
import { adminActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { UserRole } from "@/generated/prisma/enums";
import { returnValidationErrors } from "next-safe-action";

const inputSchema = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(UserRole),
});

export const updateUserRole = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { userId, role }, ctx }) => {
    if (userId === ctx.user.id) {
      returnValidationErrors(inputSchema, {
        userId: { _errors: ["Você não pode alterar seu próprio role."] },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedBarbershop: true,
        professional: true,
      },
    });

    if (!user) {
      returnValidationErrors(inputSchema, {
        userId: { _errors: ["Usuário não encontrado."] },
      });
    }

    if (role === UserRole.owner && !user.ownedBarbershop) {
      returnValidationErrors(inputSchema, {
        role: {
          _errors: [
            "Este usuário não possui um estabelecimento. Não pode ser owner.",
          ],
        },
      });
    }

    if (role === UserRole.professional && !user.professional) {
      returnValidationErrors(inputSchema, {
        role: {
          _errors: [
            "Este usuário não possui registro de profissional. Não pode ser professional.",
          ],
        },
      });
    }

    if (role === UserRole.owner_professional) {
      if (!user.ownedBarbershop) {
        returnValidationErrors(inputSchema, {
          role: {
            _errors: [
              "Este usuário não possui um estabelecimento. Não pode ser owner_professional.",
            ],
          },
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/dashboard/admin/users");
    return updatedUser;
  });
