"use server";

import { z } from "zod";
import { ownerActionClient } from "@/lib/action-client";
import {
  getOrCreateCustomer,
  createSubscriptionCheckoutSession,
  syncSubscriptionFromStripe,
} from "@/lib/stripe-subscriptions";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma/enums";

const inputSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
});

export const createSubscriptionCheckout = ownerActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { plan }, ctx: { user, barbershop } }) => {
    const existingSubscription = await prisma.subscription.findUnique({
      where: { barbershopId: barbershop.id },
    });

    if (
      existingSubscription &&
      existingSubscription.status === SubscriptionStatus.ACTIVE
    ) {
      if (existingSubscription.plan === plan) {
        throw new Error("Você já possui este plano ativo.");
      }
      throw new Error(
        "Você já possui uma assinatura ativa. Use o portal do cliente para alterar seu plano.",
      );
    }

    const customer = await getOrCreateCustomer(user.id, user.email, user.name);

    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      limit: 10,
    });

    if (stripeSubscriptions.data.length > 0) {
      const activeSubscription = stripeSubscriptions.data[0];

      await syncSubscriptionFromStripe(
        activeSubscription,
        barbershop.id,
        activeSubscription.metadata?.plan as SubscriptionPlan | undefined,
      );

      const currentPlan = activeSubscription.metadata?.plan;
      if (currentPlan === plan) {
        throw new Error(
          "Você já possui este plano ativo. Sua assinatura foi sincronizada.",
        );
      }

      throw new Error(
        "Você já possui uma assinatura ativa no Stripe. Use o portal do cliente para alterar seu plano.",
      );
    }

    const planConfig = await prisma.planConfig.findUnique({
      where: { plan },
    });

    if (!planConfig || !planConfig.stripePriceId) {
      throw new Error("Plano não encontrado ou não configurado.");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not set");
    }

    const successUrl = `${appUrl}/dashboard/owner/subscription?success=true`;
    const cancelUrl = `${appUrl}/dashboard/owner/subscription?canceled=true`;

    const checkoutSession = await createSubscriptionCheckoutSession(
      customer.id,
      barbershop.id,
      planConfig.stripePriceId,
      plan,
      successUrl,
      cancelUrl,
    );

    return { url: checkoutSession.url };
  });
