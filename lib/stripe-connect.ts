import { stripe } from "./stripe";
import { prisma } from "./prisma";
import { StripeAccountStatus } from "@/generated/prisma/enums";
import type Stripe from "stripe";

export async function createExpressAccount(
  professionalId: string,
  email: string,
): Promise<Stripe.Account> {
  const account = await stripe.accounts.create({
    type: "express",
    country: "BR",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: "individual",
    settings: {
      payouts: {
        schedule: {
          interval: "daily",
        },
      },
    },
    metadata: {
      professionalId,
    },
  });

  await prisma.professional.update({
    where: { id: professionalId },
    data: {
      stripeAccountId: account.id,
      stripeAccountStatus: StripeAccountStatus.ONBOARDING,
    },
  });

  return account;
}

export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string,
): Promise<Stripe.AccountLink> {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

export async function createLoginLink(
  accountId: string,
): Promise<Stripe.LoginLink> {
  return stripe.accounts.createLoginLink(accountId);
}

export async function getAccountStatus(
  accountId: string,
): Promise<StripeAccountStatus> {
  const account = await stripe.accounts.retrieve(accountId);

  if (account.details_submitted && account.charges_enabled) {
    return StripeAccountStatus.ACTIVE;
  }

  if (account.requirements?.disabled_reason) {
    if (
      account.requirements.disabled_reason.includes("rejected") ||
      account.requirements.disabled_reason.includes("fraud")
    ) {
      return StripeAccountStatus.DISABLED;
    }
    return StripeAccountStatus.RESTRICTED;
  }

  if (account.details_submitted) {
    return StripeAccountStatus.RESTRICTED;
  }

  return StripeAccountStatus.ONBOARDING;
}

export async function updateProfessionalStripeStatus(
  stripeAccountId: string,
): Promise<void> {
  const status = await getAccountStatus(stripeAccountId);
  const account = await stripe.accounts.retrieve(stripeAccountId);

  await prisma.professional.update({
    where: { stripeAccountId },
    data: {
      stripeAccountStatus: status,
      stripeOnboardingComplete:
        account.details_submitted && account.charges_enabled,
    },
  });
}

export function isAccountReadyForPayments(
  status: StripeAccountStatus,
): boolean {
  return status === StripeAccountStatus.ACTIVE;
}
