"use server";

import { z } from "zod";
import { ownerActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma/enums";
import {
  handlePlanDowngrade,
  handlePlanUpgrade,
  updateUserRoleBasedOnPlan,
} from "@/lib/role-sync";
import { revalidatePath } from "next/cache";

const inputSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
});

const PLAN_ORDER: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.BASIC]: 1,
  [SubscriptionPlan.STANDARD]: 2,
  [SubscriptionPlan.PROFESSIONAL]: 3,
  [SubscriptionPlan.ENTERPRISE]: 4,
};

export const changeSubscriptionPlan = ownerActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { plan }, ctx: {  user } }) => {
    const subscription = await prisma.subscription.findFirst({
      where: {
        barbershop: {
          ownerId: user.id,
        },
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        barbershop: true,
      },
    });

    if (!subscription) {
      throw new Error("Você não possui uma assinatura ativa.");
    }

    if (subscription.plan === plan) {
      throw new Error("Você já possui este plano.");
    }

    const newPlanConfig = await prisma.planConfig.findUnique({
      where: { plan },
    });

    if (!newPlanConfig) {
      throw new Error("Plano não encontrado.");
    }

    const isUpgrade = PLAN_ORDER[plan] > PLAN_ORDER[subscription.plan];

    const subscriptionBarbershopId = subscription.barbershopId;
    const fromPlan = subscription.plan;

    let professionalsDisabled = 0;
    let servicesDisabled = 0;
    let barbershopsDisabled = 0;
    let professionalsReactivated = 0;
    let servicesReactivated = 0;
    let barbershopsReactivated = 0;

    if (isUpgrade) {
      const upgradeResult = await handlePlanUpgrade(
        user.id,
        fromPlan,
        plan,
      );
      professionalsReactivated = upgradeResult.reactivatedProfessionals;
      servicesReactivated = upgradeResult.reactivatedServices;
      barbershopsReactivated = upgradeResult.reactivatedBarbershops;
    } else {
      const downgradeResult = await handlePlanDowngrade(
        user.id,
        fromPlan,
        plan,
      );
      professionalsDisabled = downgradeResult.disabledProfessionals;
      servicesDisabled = downgradeResult.disabledServices;
      barbershopsDisabled = downgradeResult.disabledBarbershops;
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );

    const currentItem = stripeSubscription.items.data[0];

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: currentItem.id,
          price: newPlanConfig.stripePriceId,
        },
      ],
      metadata: {
        barbershopId: subscriptionBarbershopId,
        plan: plan,
      },
      proration_behavior: "none",
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan,
        stripePriceId: newPlanConfig.stripePriceId,
      },
    });

    await prisma.planHistory.create({
      data: {
        barbershopId: subscriptionBarbershopId,
        fromPlan,
        toPlan: plan,
        isUpgrade,
        professionalsDisabled,
        servicesDisabled,
        barbershopsDisabled,
        professionalsReactivated,
        servicesReactivated,
        barbershopsReactivated,
      },
    });

    await updateUserRoleBasedOnPlan(subscriptionBarbershopId); // removido segundo argumento

    revalidatePath("/dashboard/owner/subscription");
    revalidatePath("/dashboard/owner/establishments");
    revalidatePath("/dashboard/owner");

    return {
      success: true,
      message: isUpgrade
        ? `Upgrade para ${newPlanConfig.name} realizado com sucesso!`
        : `Downgrade para ${newPlanConfig.name} realizado com sucesso!`,
      isUpgrade,
    };
  });