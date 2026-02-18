"use server";

import { professionalActionClient } from "@/lib/action-client";
import {
  createLoginLink,
  isAccountReadyForPayments,
} from "@/lib/stripe-connect";

export const getStripeDashboardLink = professionalActionClient.action(
  async ({ ctx: { professional } }) => {
    if (!professional.stripeAccountId) {
      throw new Error(
        "Você ainda não configurou sua conta . Por favor, complete a integração primeiro.",
      );
    }

    if (!isAccountReadyForPayments(professional.stripeAccountStatus)) {
      throw new Error(
        "Sua conta  ainda não está ativa. Por favor, complete a integração ou aguarde a verificação.",
      );
    }

    const loginLink = await createLoginLink(professional.stripeAccountId);
    return { url: loginLink.url };
  },
);
