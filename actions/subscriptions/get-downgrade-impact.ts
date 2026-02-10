"use server";

import { z } from "zod";
import { ownerActionClient } from "@/lib/action-client";
import { SubscriptionPlan } from "@/generated/prisma/enums";
import { getDowngradeImpact } from "@/lib/role-sync";

const inputSchema = z.object({
  toPlan: z.nativeEnum(SubscriptionPlan),
});

export const getDowngradeImpactAction = ownerActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { toPlan }, ctx: { user } }) => {
    const impact = await getDowngradeImpact(user.id, toPlan);

    return {
      professionalsToDisable: impact.professionalsToDisable,
      servicesToDisable: impact.servicesToDisable,
      barbershopsToDisable: impact.barbershopsToDisable,
    };
  });
