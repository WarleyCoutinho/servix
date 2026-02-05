import { NextResponse } from "next/server";
import Stripe from "stripe";

interface VerifyWebhookResult {
  success: true;
  event: Stripe.Event;
  stripe: Stripe;
}

interface VerifyWebhookError {
  success: false;
  response: NextResponse;
}

export type WebhookVerificationResult = VerifyWebhookResult | VerifyWebhookError;

export async function verifyStripeWebhook(
  request: Request,
  webhookSecret: string | undefined,
  secretKeyEnvName: string = "STRIPE_SECRET_KEY",
  webhookSecretEnvName: string = "STRIPE_WEBHOOK_SECRET"
): Promise<WebhookVerificationResult> {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || !webhookSecret) {
    console.error(`${secretKeyEnvName} or ${webhookSecretEnvName} is not set`);
    return {
      success: false,
      response: NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      ),
    };
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      ),
    };
  }

  const body = await request.text();
  const stripe = new Stripe(secretKey, {
    apiVersion: "2025-07-30.basil",
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      ),
    };
  }

  return { success: true, event, stripe };
}
