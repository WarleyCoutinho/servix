"use server";

import { z } from "zod";
import { actionClient } from "@/lib/action-client"; // ajuste para seu setup
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const inputSchema = z.object({
  professionalId: z.string().uuid("ID inválido"),
  scheduleViewType: z.enum(["DEFAULT", "RECENT", "CONTINUOUS"]),
});

export const updateScheduleViewType = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { professionalId, scheduleViewType } }) => {
    await prisma.professional.update({
      where: { id: professionalId },
      data: { scheduleViewType },
    });

    revalidatePath("/dashboard");
    return { success: true };
  });
