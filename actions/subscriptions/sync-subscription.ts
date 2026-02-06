"use server";

import { ownerActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { syncSubscriptionFromStripe } from "@/lib/stripe-subscriptions";
import { updateUserRoleBasedOnPlan } from "@/lib/role-sync";
import { SubscriptionPlan } from "@/generated/prisma/enums";

export const syncSubscription = ownerActionClient.action(
  async ({ ctx: { user, barbershop } }) => {
    if (!user.stripeCustomerId) {
      throw new Error(
        "Nenhum cliente Stripe encontrado. Faça uma assinatura primeiro.",
      );
    }

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
          barbershopId: barbershop.id,
          plan,
        },
      },
    );

    await syncSubscriptionFromStripe(
      updatedStripeSubscription,
      barbershop.id,
      plan,
    );
    await updateUserRoleBasedOnPlan(barbershop.id, plan);

    const updatedSubscription = await prisma.subscription.findUnique({
      where: { barbershopId: barbershop.id },
    });

    return {
      success: true,
      message: "Assinatura sincronizada com sucesso!",
      subscription: updatedSubscription,
    };
  },
);
