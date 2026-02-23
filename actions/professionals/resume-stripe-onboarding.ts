"use server";

import { StripeAccountStatus } from "@/generated/prisma/enums";
import { professionalActionClient } from "@/lib/action-client";
import { createAccountLink, isStripeAccountValid } from "@/lib/stripe-connect";

export const resumeStripeOnboarding = professionalActionClient.action(
  async ({ ctx: { professional } }) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not set");
    }

    if (professional.stripeAccountStatus === StripeAccountStatus.ACTIVE) {
      throw new Error("Sua conta já está ativa.");
    }

    if (!professional.stripeAccountId) {
      throw new Error(
        "Nenhuma conta Stripe encontrada. Inicie o processo de configuração.",
      );
    }

    const accountValid = await isStripeAccountValid(professional.stripeAccountId);
    if (!accountValid) {
      throw new Error(
        "Sua conta Stripe não foi encontrada. Inicie o processo novamente.",
      );
    }

    const refreshUrl = `${appUrl}/onboarding/professional/stripe-refresh`;
    const returnUrl = `${appUrl}/onboarding/professional/stripe-return`;

    const accountLink = await createAccountLink(
      professional.stripeAccountId,
      refreshUrl,
      returnUrl,
    );

    return { url: accountLink.url };
  },
);
