"use server";

import { z } from "zod";
import { adminActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { returnValidationErrors } from "next-safe-action";

const inputSchema = z.object({
  userId: z.string().min(1),
  banned: z.boolean(),
  banReason: z.string().optional(),
});

export const toggleUserBan = adminActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { userId, banned, banReason }, ctx }) => {
    if (userId === ctx.user.id) {
      returnValidationErrors(inputSchema, {
        userId: { _errors: ["Você não pode banir a si mesmo."] },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      returnValidationErrors(inputSchema, {
        userId: { _errors: ["Usuário não encontrado."] },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        banned,
        banReason: banned ? banReason : null,
      },
    });

    revalidatePath("/dashboard/admin/users");
    return updatedUser;
  });
