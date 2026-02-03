import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil",
      typescript: true,
    });
  }
  return stripeInstance;
}

export const stripe = {
  get accounts() {
    return getStripe().accounts;
  },
  get accountLinks() {
    return getStripe().accountLinks;
  },
  get checkout() {
    return getStripe().checkout;
  },
  get customers() {
    return getStripe().customers;
  },
  get subscriptions() {
    return getStripe().subscriptions;
  },
  get billingPortal() {
    return getStripe().billingPortal;
  },
  get refunds() {
    return getStripe().refunds;
  },
  get webhooks() {
    return getStripe().webhooks;
  },
};

export function calculatePlatformFee(amountInCents: number): number {
  const feePercentage = parseInt(
    process.env.PLATFORM_FEE_PERCENTAGE ?? "10",
    10,
  );
  return Math.round((amountInCents * feePercentage) / 100);
}
