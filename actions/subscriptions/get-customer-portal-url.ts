"use server";

import { ownerActionClient } from "@/lib/action-client";
import { createCustomerPortalSession } from "@/lib/stripe-subscriptions";

export const getCustomerPortalUrl = ownerActionClient.action(
  async ({ ctx: { user } }) => {
    if (!user.stripeCustomerId) {
      throw new Error(
        "Você precisa ter uma assinatura para acessar o portal do cliente.",
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not set");
    }

    const returnUrl = `${appUrl}/dashboard/owner/subscription`;

    const portalSession = await createCustomerPortalSession(
      user.stripeCustomerId,
      returnUrl,
    );

    return { url: portalSession.url };
  },
);
