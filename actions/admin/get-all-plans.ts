"use server";

import { adminActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";

export const getAllPlansAdmin = adminActionClient.action(async () => {
  const plans = await prisma.planConfig.findMany({
    orderBy: { priceInCents: "asc" },
  });

  return plans;
});
