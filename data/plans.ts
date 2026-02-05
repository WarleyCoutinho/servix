import { prisma } from "@/lib/prisma";
import { SubscriptionPlan } from "@/generated/prisma/enums";

export async function getAllPlans() {
  return prisma.planConfig.findMany({
    where: { isActive: true },
    orderBy: { priceInCents: "asc" },
  });
}

export async function getPlanByKey(plan: SubscriptionPlan) {
  return prisma.planConfig.findUnique({
    where: { plan },
  });
}

export async function getPlanByPriceId(stripePriceId: string) {
  return prisma.planConfig.findUnique({
    where: { stripePriceId },
  });
}

export async function getPlanForBarbershop(barbershopId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { barbershopId },
  });

  if (!subscription) {
    return null;
  }

  return prisma.planConfig.findUnique({
    where: { plan: subscription.plan },
  });
}

export type PlanConfig = NonNullable<Awaited<ReturnType<typeof getPlanByKey>>>;
