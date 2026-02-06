"use server";

import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";

const inputSchema = z.object({
  barbershopId: z.uuid(),
});

export const getBarbershopProfessionals = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { barbershopId } }) => {
    const professionals = await prisma.professional.findMany({
      where: {
        barbershopId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        displayName: "asc",
      },
    });

    return professionals;
  });

export type BarbershopProfessional = Awaited<
  ReturnType<typeof getBarbershopProfessionals>
>["data"] extends (infer T)[] | undefined
  ? T
  : never;
