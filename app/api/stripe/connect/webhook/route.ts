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

  // Idempotência: verificar se evento já foi processado
  const existingEvent = await prisma.stripeEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existingEvent) {
    return NextResponse.json({ received: true, skipped: true });
  }

  await prisma.stripeEvent.create({
    data: {
      stripeEventId: event.id,
      eventType: event.type,
    },
  });

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;

        const professional = await prisma.professional.findUnique({
          where: { stripeAccountId: account.id },
        });

        if (professional) {
          await updateProfessionalStripeStatus(account.id);

          if (
            account.charges_enabled &&
            account.payouts_enabled &&
            account.details_submitted
          ) {
            console.log(
              `Professional ${professional.id} Stripe account ACTIVE - charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}, details_submitted: ${account.details_submitted}`,
            );
          } else {
            console.log(
              `Professional ${professional.id} Stripe account PENDING - charges_enabled: ${account.charges_enabled}, payouts_enabled: ${account.payouts_enabled}, details_submitted: ${account.details_submitted}`,
            );
          }
        }
        break;
      }

      case "account.application.deauthorized": {
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
            `Professional with Stripe account ${accountId} deauthorized`,
          );
        }
        break;
      }

      case "account.external_account.created": {
        const externalAccount = event.data.object as Stripe.BankAccount;
        const accountId = event.account;

        if (accountId) {
          console.log(
            `External account (bank) added to Stripe account ${accountId} - ${externalAccount.bank_name ?? "unknown bank"}`,
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
  } catch (processingError) {
    await prisma.stripeEvent.delete({
      where: { stripeEventId: event.id },
    }).catch(() => {});

    console.error(`Error processing Connect event ${event.id}:`, processingError);
    return NextResponse.json(
      { error: "Error processing event" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
};
