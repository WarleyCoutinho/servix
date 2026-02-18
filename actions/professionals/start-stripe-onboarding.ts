"use server";

import { StripeAccountStatus } from "@/generated/prisma/enums";
import { professionalActionClient } from "@/lib/action-client";
import { createAccountLink, createExpressAccount } from "@/lib/stripe-connect";

export const startStripeOnboarding = professionalActionClient.action(
  async ({ ctx: { professional, user } }) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not set");
    }

    const refreshUrl = `${appUrl}/onboarding/professional/stripe-refresh`;
    const returnUrl = `${appUrl}/onboarding/professional/stripe-return`;

    let accountId = professional.stripeAccountId;

    if (!accountId) {
      const account = await createExpressAccount(professional.id, user.email);
      accountId = account.id;
    } else if (
      professional.stripeAccountStatus === StripeAccountStatus.ACTIVE
    ) {
      throw new Error("Sua conta  já está configurada e ativa.");
    }

    const accountLink = await createAccountLink(
      accountId,
      refreshUrl,
      returnUrl,
    );

    return { url: accountLink.url };
  },
);
