"use server";

import { StripeAccountStatus } from "@/generated/prisma/enums";
import { professionalActionClient } from "@/lib/action-client";
import {
  createAccountLink,
  createExpressAccount,
  isStripeAccountValid,
} from "@/lib/stripe-connect";

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: parts[0] || "", lastName: "" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export const startStripeOnboarding = professionalActionClient.action(
  async ({ ctx: { professional, user } }) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not set");
    }

    const refreshUrl = `${appUrl}/onboarding/professional/stripe-refresh`;
    const returnUrl = `${appUrl}/onboarding/professional/stripe-return`;

    const { firstName, lastName } = splitName(user.name);
    const prefillData = {
      firstName,
      lastName,
      cpf: professional.cpf,
    };

    let accountId = professional.stripeAccountId;

    if (accountId) {
      if (professional.stripeAccountStatus === StripeAccountStatus.ACTIVE) {
        throw new Error("Sua conta já está configurada e ativa.");
      }

      const accountValid = await isStripeAccountValid(accountId);
      if (!accountValid) {
        const account = await createExpressAccount(
          professional.id,
          user.email,
          prefillData,
        );
        accountId = account.id;
      }
    } else {
      const account = await createExpressAccount(
        professional.id,
        user.email,
        prefillData,
      );
      accountId = account.id;
    }

    const accountLink = await createAccountLink(
      accountId,
      refreshUrl,
      returnUrl,
    );

    return { url: accountLink.url };
  },
);
