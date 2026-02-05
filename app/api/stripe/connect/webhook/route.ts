import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { updateProfessionalStripeStatus } from "@/lib/stripe-connect";
import { prisma } from "@/lib/prisma";
import { StripeAccountStatus } from "@/generated/prisma/enums";
import { verifyStripeWebhook } from "@/lib/stripe-webhook";

export const POST = async (request: Request) => {
  const verification = await verifyStripeWebhook(
    request,
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
    "STRIPE_SECRET_KEY",
    "STRIPE_CONNECT_WEBHOOK_SECRET"
  );

  if (!verification.success) {
    return verification.response;
  }

  const { event } = verification;

  switch (event.type) {
    case "account.updated": {
      const account = event.data.object as Stripe.Account;

      const professional = await prisma.professional.findUnique({
        where: { stripeAccountId: account.id },
      });

      if (professional) {
        await updateProfessionalStripeStatus(account.id);
        console.log(
          `Updated professional ${professional.id} Stripe status from account.updated event`,
        );
      }
      break;
    }

    case "account.application.deauthorized": {
      const application = event.data.object;
      const accountId = event.account;

      if (accountId) {
        await prisma.professional.updateMany({
          where: { stripeAccountId: accountId },
          data: {
            stripeAccountStatus: StripeAccountStatus.DISABLED,
            stripeOnboardingComplete: false,
          },
        });
        console.log(
          `Professional with Stripe account ${accountId} deauthorized from application ${application.id}`,
        );
      }
      break;
    }

    case "payout.paid": {
      const payout = event.data.object as Stripe.Payout;
      console.log(
        `Payout ${payout.id} paid to account ${event.account} - Amount: ${payout.amount / 100} ${payout.currency}`,
      );
      break;
    }

    case "payout.failed": {
      const payout = event.data.object as Stripe.Payout;
      console.error(
        `Payout ${payout.id} failed for account ${event.account} - Reason: ${payout.failure_message}`,
      );
      break;
    }

    default:
      console.log(`Unhandled Connect event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
};
