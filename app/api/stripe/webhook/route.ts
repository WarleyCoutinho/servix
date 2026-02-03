import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import z from "zod";
import { PaymentStatus } from "@/generated/prisma/enums";
import { syncSubscriptionFromStripe } from "@/lib/stripe-subscriptions";

const bookingMetadataSchema = z.object({
  serviceId: z.uuid(),
  barbershopId: z.uuid(),
  userId: z.string(),
  date: z.iso.datetime(),
  professionalId: z.string().optional(),
  priceInCents: z.coerce.number().optional(),
  applicationFeeInCents: z.coerce.number().optional(),
});

const subscriptionMetadataSchema = z.object({
  barbershopId: z.uuid(),
});

export const POST = async (request: Request) => {
  if (
    !process.env.STRIPE_SECRET_KEY ||
    !process.env.STRIPE_WEBHOOK_SECRET_KEY
  ) {
    console.error("STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.error();
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.error();
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
      process.env.STRIPE_WEBHOOK_SECRET_KEY,
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      if (session.mode === "subscription") {
        const metadata = subscriptionMetadataSchema.safeParse(session.metadata);
        if (metadata.success && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;

          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscriptionFromStripe(
            subscription,
            metadata.data.barbershopId,
          );
          console.log(
            `Subscription ${subscriptionId} created for barbershop ${metadata.data.barbershopId}`,
          );
        }
      } else if (session.mode === "payment") {
        const metadata = bookingMetadataSchema.safeParse(session.metadata);
        if (!metadata.success) {
          console.error("Invalid booking metadata", metadata.error);
          break;
        }

        const expandedSession = await stripe.checkout.sessions.retrieve(
          session.id,
          {
            expand: ["payment_intent"],
          },
        );

        const paymentIntent =
          expandedSession.payment_intent as Stripe.PaymentIntent;
        const chargeId =
          typeof paymentIntent.latest_charge === "string"
            ? paymentIntent.latest_charge
            : paymentIntent.latest_charge?.id;

        const professionalId = metadata.data.professionalId || undefined;

        const booking = await prisma.booking.create({
          data: {
            serviceId: metadata.data.serviceId,
            barbershopId: metadata.data.barbershopId,
            userId: metadata.data.userId,
            date: metadata.data.date,
            professionalId: professionalId || null,
          },
        });

        if (metadata.data.priceInCents) {
          await prisma.payment.create({
            data: {
              bookingId: booking.id,
              professionalId: professionalId || null,
              amountInCents: metadata.data.priceInCents,
              applicationFeeInCents: metadata.data.applicationFeeInCents ?? 0,
              status: PaymentStatus.SUCCEEDED,
              paymentMethod: paymentIntent.payment_method_types?.[0] ?? "card",
              stripePaymentIntentId: paymentIntent.id,
              stripeChargeId: chargeId,
            },
          });
        }
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const barbershopId = subscription.metadata?.barbershopId;

      if (barbershopId) {
        await syncSubscriptionFromStripe(subscription, barbershopId);
        console.log(
          `Subscription ${subscription.id} ${event.type === "customer.subscription.created" ? "created" : "updated"} for barbershop ${barbershopId}`,
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const barbershopId = subscription.metadata?.barbershopId;

      if (barbershopId) {
        await syncSubscriptionFromStripe(subscription, barbershopId);
        console.log(
          `Subscription ${subscription.id} deleted for barbershop ${barbershopId}`,
        );
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as unknown as {
        id: string;
        subscription: string | { id: string } | null;
      };
      if (invoice.subscription) {
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id;

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        const barbershopId = subscription.metadata?.barbershopId;

        if (barbershopId) {
          await syncSubscriptionFromStripe(subscription, barbershopId);
          console.log(`Invoice ${invoice.id} paid for subscription ${subscriptionId}`);
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as unknown as {
        id: string;
        subscription: string | { id: string } | null;
      };
      if (invoice.subscription) {
        const subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id;

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        const barbershopId = subscription.metadata?.barbershopId;

        if (barbershopId) {
          await syncSubscriptionFromStripe(subscription, barbershopId);
          console.log(
            `Invoice ${invoice.id} payment failed for subscription ${subscriptionId}`,
          );
        }
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;

      const payment = await prisma.payment.findUnique({
        where: { stripePaymentIntentId: paymentIntent.id },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        });
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;

      const payment = await prisma.payment.findUnique({
        where: { stripeChargeId: charge.id },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.REFUNDED,
            refundedAt: new Date(),
          },
        });
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
};
