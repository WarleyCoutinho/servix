import { stripe } from "./stripe";
import { prisma } from "./prisma";
import { SubscriptionPlan, SubscriptionStatus } from "@/generated/prisma/enums";
import type Stripe from "stripe";

export async function createCustomer(
  userId: string,
  email: string,
  name: string,
): Promise<Stripe.Customer> {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer;
}

export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name: string,
): Promise<Stripe.Customer> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user?.stripeCustomerId) {
    const customer = await stripe.customers.retrieve(user.stripeCustomerId);
    if (!customer.deleted) {
      return customer;
    }
  }

  return createCustomer(userId, email, name);
}

export async function createSubscriptionCheckoutSession(
  customerId: string,
  barbershopId: string,
  priceId: string,
  plan: SubscriptionPlan,
  successUrl: string,
  cancelUrl: string,
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      barbershopId,
      plan,
    },
    subscription_data: {
      metadata: {
        barbershopId,
        plan,
      },
    },
  });
}

export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export function mapStripeStatusToSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status,
): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "incomplete":
    case "incomplete_expired":
      return SubscriptionStatus.INCOMPLETE;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    case "unpaid":
      return SubscriptionStatus.PAST_DUE;
    case "paused":
      return SubscriptionStatus.CANCELED;
    default:
      return SubscriptionStatus.INCOMPLETE;
  }
}

export async function syncSubscriptionFromStripe(
  stripeSubscription: Stripe.Subscription,
  barbershopId: string,
  planFromMetadata?: SubscriptionPlan,
): Promise<void> {
  const sub = stripeSubscription as unknown as {
    id: string;
    status: Stripe.Subscription.Status;
    items: { data: Array<{ price: { id: string; product: string | { id: string } } }> };
    current_period_start: number;
    current_period_end: number;
    cancel_at_period_end: boolean;
    canceled_at: number | null;
    metadata?: { plan?: string };
  };

  const status = mapStripeStatusToSubscriptionStatus(sub.status);
  const priceId = sub.items.data[0].price.id;
  const productId =
    typeof sub.items.data[0].price.product === "string"
      ? sub.items.data[0].price.product
      : sub.items.data[0].price.product.id;

  const plan =
    planFromMetadata ||
    (sub.metadata?.plan as SubscriptionPlan) ||
    SubscriptionPlan.BASIC;

  await prisma.subscription.upsert({
    where: { barbershopId },
    create: {
      barbershopId,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      stripeProductId: productId,
      plan,
      status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
    update: {
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      stripeProductId: productId,
      plan,
      status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
    },
  });

  const isActive = status === SubscriptionStatus.ACTIVE;
  await prisma.barbershop.update({
    where: { id: barbershopId },
    data: { isActive },
  });
}

export async function cancelSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.cancel(subscriptionId);
}

export async function getSubscription(
  subscriptionId: string,
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId);
}
