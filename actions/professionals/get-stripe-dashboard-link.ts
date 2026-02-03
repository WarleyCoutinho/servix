"use server";

import { professionalActionClient } from "@/lib/action-client";
import { createLoginLink, isAccountReadyForPayments } from "@/lib/stripe-connect";

export const getStripeDashboardLink = professionalActionClient.action(
  async ({ ctx: { professional } }) => {
    if (!professional.stripeAccountId) {
      throw new Error(
        "Você ainda não configurou sua conta Stripe. Por favor, complete o onboarding primeiro.",
      );
    }

    if (!isAccountReadyForPayments(professional.stripeAccountStatus)) {
      throw new Error(
        "Sua conta Stripe ainda não está ativa. Por favor, complete o onboarding ou aguarde a verificação.",
      );
    }

    const loginLink = await createLoginLink(professional.stripeAccountId);
    return { url: loginLink.url };
  },
);
