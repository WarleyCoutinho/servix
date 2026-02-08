"use server";

import { z } from "zod";
import { ownerActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma/enums";
import { handlePlanDowngrade, updateUserRoleBasedOnPlan } from "@/lib/role-sync";
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
  .action(async ({ parsedInput: { plan }, ctx: { barbershop, user } }) => {
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

    if (!isUpgrade) {
      const downgradeResult = await handlePlanDowngrade(
        subscriptionBarbershopId,
        subscription.plan,
        plan,
      );

      if (downgradeResult.disabledProfessionals > 0 || downgradeResult.disabledServices > 0) {
        console.log(
          `Downgrade: ${downgradeResult.disabledProfessionals} profissionais e ${downgradeResult.disabledServices} serviços desativados`,
        );
      }
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

    await updateUserRoleBasedOnPlan(subscriptionBarbershopId, plan);

    revalidatePath("/dashboard/owner/subscription");
    revalidatePath("/dashboard/owner");

    return {
      success: true,
      message: isUpgrade
        ? `Upgrade para ${newPlanConfig.name} realizado com sucesso!`
        : `Downgrade para ${newPlanConfig.name} realizado com sucesso!`,
      isUpgrade,
    };
  });
