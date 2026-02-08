import { prisma } from "./prisma";
import { SubscriptionStatus } from "@/generated/prisma/enums";

export async function getOwnerSubscription(userId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      barbershop: {
        ownerId: userId,
      },
      status: SubscriptionStatus.ACTIVE,
    },
    include: {
      barbershop: true,
    },
  });

  return subscription;
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getOwnerSubscription(userId);
  return subscription !== null;
}
