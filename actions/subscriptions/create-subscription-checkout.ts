"use server";

import { ownerActionClient } from "@/lib/action-client";
import {
  getOrCreateCustomer,
  createSubscriptionCheckoutSession,
} from "@/lib/stripe-subscriptions";
import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@/generated/prisma/enums";

export const createSubscriptionCheckout = ownerActionClient.action(
  async ({ ctx: { user, barbershop } }) => {
    const existingSubscription = await prisma.subscription.findUnique({
      where: { barbershopId: barbershop.id },
    });

    if (
      existingSubscription &&
      existingSubscription.status === SubscriptionStatus.ACTIVE
    ) {
      throw new Error("Você já possui uma assinatura ativa.");
    }

    const customer = await getOrCreateCustomer(
      user.id,
      user.email,
      user.name,
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not set");
    }

    const successUrl = `${appUrl}/dashboard/owner/subscription?success=true`;
    const cancelUrl = `${appUrl}/dashboard/owner/subscription?canceled=true`;

    const checkoutSession = await createSubscriptionCheckoutSession(
      customer.id,
      barbershop.id,
      successUrl,
      cancelUrl,
    );

    return { url: checkoutSession.url };
  },
);
