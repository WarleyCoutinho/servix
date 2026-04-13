"use server";

import { ownerActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { syncSubscriptionFromStripe } from "@/lib/stripe-subscriptions";
import { updateUserRoleBasedOnPlan } from "@/lib/role-sync";
import { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma/enums";

export const syncSubscription = ownerActionClient.action(
  async ({ ctx: { user, ownedBarbershops } }) => {
    if (!user.stripeCustomerId) {
      throw new Error(
        "Nenhum cliente Stripe encontrado. Faça uma assinatura primeiro.",
      );
    }

    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        barbershop: {
          ownerId: user.id,
        },
      },
    });

    const targetBarbershopId = existingSubscription?.barbershopId || ownedBarbershops[0].id;

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      const allSubscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        limit: 1,
      });

      if (allSubscriptions.data.length === 0) {
        throw new Error("Nenhuma assinatura encontrada no Stripe.");
      }

      const latestSubscription = allSubscriptions.data[0];
      throw new Error(
        `Assinatura encontrada com status: ${latestSubscription.status}. Entre em contato com o suporte.`,
      );
    }

    const stripeSubscription = subscriptions.data[0];
    const plan =
      (stripeSubscription.metadata?.plan as SubscriptionPlan) ||
      SubscriptionPlan.BASIC;

    const updatedStripeSubscription = await stripe.subscriptions.update(
      stripeSubscription.id,
      {
        metadata: {
          ...stripeSubscription.metadata,
          barbershopId: targetBarbershopId,
          plan,
        },
      },
    );

    await syncSubscriptionFromStripe(
      updatedStripeSubscription,
      targetBarbershopId,
      plan,
    );
    await updateUserRoleBasedOnPlan(targetBarbershopId);

    const updatedSubscription = await prisma.subscription.findFirst({
      where: {
        barbershop: {
          ownerId: user.id,
        },
        status: SubscriptionStatus.ACTIVE,
      },
    });

    return {
      success: true,
      message: "Assinatura sincronizada com sucesso!",
      subscription: updatedSubscription,
    };
  },
);
