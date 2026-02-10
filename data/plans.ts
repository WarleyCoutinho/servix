import { prisma, safeQuery } from "@/lib/prisma";
import { SubscriptionPlan } from "@/generated/prisma/enums";

export async function getAllPlans() {
  const { data } = await safeQuery(
    () =>
      prisma.planConfig.findMany({
        where: { isActive: true },
        orderBy: { priceInCents: "asc" },
      }),
    []
  );
  return data;
}

export async function getPlanByKey(plan: SubscriptionPlan) {
  const { data } = await safeQuery(
    () =>
      prisma.planConfig.findUnique({
        where: { plan },
      }),
    null
  );
  return data;
}

export async function getPlanByPriceId(stripePriceId: string) {
  const { data } = await safeQuery(
    () =>
      prisma.planConfig.findUnique({
        where: { stripePriceId },
      }),
    null
  );
  return data;
}

export async function getPlanForBarbershop(barbershopId: string) {
  const { data: subscription } = await safeQuery(
    () =>
      prisma.subscription.findUnique({
        where: { barbershopId },
      }),
    null
  );

  if (!subscription) {
    return null;
  }

  const { data: planConfig } = await safeQuery(
    () =>
      prisma.planConfig.findUnique({
        where: { plan: subscription.plan },
      }),
    null
  );
  return planConfig;
}

export type PlanConfig = NonNullable<Awaited<ReturnType<typeof getPlanByKey>>>;
