import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import z from "zod";
import { PaymentStatus, SubscriptionPlan } from "@/generated/prisma/enums";
import { syncSubscriptionFromStripe } from "@/lib/stripe-subscriptions";
import { verifyStripeWebhook } from "@/lib/stripe-webhook";
import { handlePlanDowngrade, updateUserRoleBasedOnPlan } from "@/lib/role-sync";

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
  plan: z.enum(["BASIC", "STANDARD", "PROFESSIONAL", "ENTERPRISE"]).optional(),
});

export const POST = async (request: Request) => {
  const verification = await verifyStripeWebhook(
    request,
    process.env.STRIPE_WEBHOOK_SECRET_KEY,
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET_KEY"
  );

  if (!verification.success) {
    return verification.response;
  }

  const { event, stripe } = verification;

  // Idempotência: verificar se evento já foi processado
  const existingEvent = await prisma.stripeEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existingEvent) {
    console.log(`Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true, skipped: true });
  }

  // Marcar evento como processado ANTES de processar
  await prisma.stripeEvent.create({
    data: {
      stripeEventId: event.id,
      eventType: event.type,
    },
  });

  try {
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

            const plan = metadata.data.plan as SubscriptionPlan | undefined;
            await syncSubscriptionFromStripe(
              subscription,
              metadata.data.barbershopId,
              plan,
            );

            const activePlan = plan || SubscriptionPlan.BASIC;
            await updateUserRoleBasedOnPlan(metadata.data.barbershopId, activePlan);

            console.log(
              `Subscription ${subscriptionId} created for barbershop ${metadata.data.barbershopId} with plan ${activePlan}`,
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
            expandedSession.payment_intent as import("stripe").Stripe.PaymentIntent;
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
        const newPlan = subscription.metadata?.plan as SubscriptionPlan | undefined;

        if (barbershopId) {
          if (event.type === "customer.subscription.updated") {
            const existingSubscription = await prisma.subscription.findUnique({
              where: { barbershopId },
              select: { plan: true },
            });

            const oldPlan = existingSubscription?.plan;
            const activePlan = newPlan || SubscriptionPlan.BASIC;

            if (oldPlan && oldPlan !== activePlan) {
              await handlePlanDowngrade(barbershopId, oldPlan, activePlan);
            }

            await updateUserRoleBasedOnPlan(barbershopId, activePlan);
          }

          await syncSubscriptionFromStripe(subscription, barbershopId, newPlan);

          if (event.type === "customer.subscription.created") {
            const activePlan = newPlan || SubscriptionPlan.BASIC;
            await updateUserRoleBasedOnPlan(barbershopId, activePlan);
          }

          console.log(
            `Subscription ${subscription.id} ${event.type === "customer.subscription.created" ? "created" : "updated"} for barbershop ${barbershopId} with plan ${newPlan || "BASIC"}`,
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const barbershopId = subscription.metadata?.barbershopId;
        const plan = subscription.metadata?.plan as SubscriptionPlan | undefined;

        if (barbershopId) {
          await syncSubscriptionFromStripe(subscription, barbershopId, plan);
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
          const plan = subscription.metadata?.plan as SubscriptionPlan | undefined;

          if (barbershopId) {
            await syncSubscriptionFromStripe(subscription, barbershopId, plan);
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
          const plan = subscription.metadata?.plan as SubscriptionPlan | undefined;

          if (barbershopId) {
            await syncSubscriptionFromStripe(subscription, barbershopId, plan);
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
  } catch (processingError) {
    // Se falhar o processamento, remover o evento para permitir retry
    await prisma.stripeEvent.delete({
      where: { stripeEventId: event.id },
    }).catch(() => {});

    console.error(`Error processing event ${event.id}:`, processingError);
    return NextResponse.json(
      { error: "Error processing event" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
};
