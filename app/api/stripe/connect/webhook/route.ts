import { NextResponse } from "next/server";
import Stripe from "stripe";
import { updateProfessionalStripeStatus } from "@/lib/stripe-connect";
import { prisma } from "@/lib/prisma";
import { StripeAccountStatus } from "@/generated/prisma/enums";

export const POST = async (request: Request) => {
  if (
    !process.env.STRIPE_SECRET_KEY ||
    !process.env.STRIPE_CONNECT_WEBHOOK_SECRET
  ) {
    console.error(
      "STRIPE_SECRET_KEY or STRIPE_CONNECT_WEBHOOK_SECRET is not set",
    );
    return NextResponse.error();
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const body = await request.text();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Connect webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

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
