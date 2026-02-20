import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import z from "zod";
import { PaymentStatus, SubscriptionPlan } from "@/generated/prisma/enums";
import { syncSubscriptionFromStripe } from "@/lib/stripe-subscriptions";
import { verifyStripeWebhook } from "@/lib/stripe-webhook";
import {
  handlePlanDowngrade,
  handlePlanUpgrade,
  updateUserRoleBasedOnPlan,
} from "@/lib/role-sync";
import { sendDailyScheduleToGroup } from "@/lib/whatsapp-schedule";
import { startOfDayBrt, endOfDayBrt } from "@/lib/timezone";
import { DEFAULT_INTERVAL_MINUTES } from "@/lib/schedule-utils";
import { addMinutes } from "date-fns";
import type Stripe from "stripe";

const PLAN_ORDER: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.BASIC]: 1,
  [SubscriptionPlan.STANDARD]: 2,
  [SubscriptionPlan.PROFESSIONAL]: 3,
  [SubscriptionPlan.ENTERPRISE]: 4,
};

const bookingMetadataSchema = z.object({
  serviceId: z.uuid(),
  barbershopId: z.uuid(),
  userId: z.string(),
  date: z.iso.datetime(),
  professionalId: z.uuid(),
  priceInCents: z.coerce.number(),
  applicationFeeInCents: z.coerce.number().default(0),
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
        console.log(`Processing checkout.session.completed: mode=${session.mode}, sessionId=${session.id}`);

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
            throw new Error(`Invalid booking metadata: ${metadata.error.message}`);
          }

          const expandedSession = await stripe.checkout.sessions.retrieve(
            session.id,
            {
              expand: ["payment_intent", "payment_intent.latest_charge"],
            },
          );

          const paymentIntent =
            expandedSession.payment_intent as import("stripe").Stripe.PaymentIntent;
          const charge = paymentIntent.latest_charge as import("stripe").Stripe.Charge | null;
          const chargeId = charge?.id;
          const transferId = charge?.transfer as string | null;
          const actualPaymentMethod =
            charge?.payment_method_details?.type ?? paymentIntent.payment_method_types?.[0] ?? "card";

          const professionalId = metadata.data.professionalId;

          await prisma.$transaction(async (tx) => {
            const bookingDate = new Date(metadata.data.date);
            const dayStart = startOfDayBrt(bookingDate);
            const dayEnd = endOfDayBrt(bookingDate);

            const existingBookings = await tx.booking.findMany({
              where: {
                professionalId,
                date: { gte: dayStart, lte: dayEnd },
                cancelledAt: null,
              },
              include: { service: { select: { durationMinutes: true } } },
            });

            const service = await tx.barbershopService.findUnique({
              where: { id: metadata.data.serviceId },
              select: { durationMinutes: true },
            });

            const newDuration = service?.durationMinutes ?? DEFAULT_INTERVAL_MINUTES;
            const newSlotsNeeded = Math.ceil(newDuration / DEFAULT_INTERVAL_MINUTES);
            const newStart = bookingDate.getTime();
            const newEnd = addMinutes(bookingDate, newSlotsNeeded * DEFAULT_INTERVAL_MINUTES).getTime();

            for (const existing of existingBookings) {
              const existingDuration = existing.service.durationMinutes;
              const existingSlotsNeeded = Math.ceil(existingDuration / DEFAULT_INTERVAL_MINUTES);
              const existingStart = existing.date.getTime();
              const existingEnd = addMinutes(existing.date, existingSlotsNeeded * DEFAULT_INTERVAL_MINUTES).getTime();

              if (newStart < existingEnd && newEnd > existingStart) {
                throw new Error(`Conflito de horário: profissional ${professionalId} já tem agendamento neste horário`);
              }
            }

            const booking = await tx.booking.create({
              data: {
                serviceId: metadata.data.serviceId,
                barbershopId: metadata.data.barbershopId,
                userId: metadata.data.userId,
                date: metadata.data.date,
                professionalId,
              },
            });

            await tx.payment.create({
              data: {
                bookingId: booking.id,
                professionalId,
                amountInCents: metadata.data.priceInCents,
                applicationFeeInCents: metadata.data.applicationFeeInCents,
                status: PaymentStatus.SUCCEEDED,
                paymentMethod: actualPaymentMethod,
                stripePaymentIntentId: paymentIntent.id,
                stripeChargeId: chargeId,
                stripeTransferId: transferId,
              },
            });

            console.log(
              `Booking ${booking.id} created with payment for user ${metadata.data.userId}${transferId ? ` (transfer: ${transferId})` : ""}`
            );
          });

          // Enviar agenda atualizada ao WhatsApp para qualquer data
          sendDailyScheduleToGroup(professionalId, metadata.data.date).catch(
            (err) => console.error("[WhatsApp] Erro ao enviar agenda:", err),
          );
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const barbershopId = subscription.metadata?.barbershopId;
        const newPlan = subscription.metadata?.plan as SubscriptionPlan | undefined;

        if (barbershopId) {
          const activePlan = newPlan || SubscriptionPlan.BASIC;

          if (event.type === "customer.subscription.updated") {
            const existingSubscription = await prisma.subscription.findUnique({
              where: { barbershopId },
              select: { plan: true },
            });

            const oldPlan = existingSubscription?.plan;

            if (oldPlan && oldPlan !== activePlan) {
              const isUpgrade = PLAN_ORDER[activePlan] > PLAN_ORDER[oldPlan];

              let professionalsDisabled = 0;
              let servicesDisabled = 0;
              let professionalsReactivated = 0;
              let servicesReactivated = 0;

              if (isUpgrade) {
                const upgradeResult = await handlePlanUpgrade(
                  barbershopId,
                  oldPlan,
                  activePlan,
                );
                professionalsReactivated = upgradeResult.reactivatedProfessionals;
                servicesReactivated = upgradeResult.reactivatedServices;
              } else {
                const downgradeResult = await handlePlanDowngrade(
                  barbershopId,
                  oldPlan,
                  activePlan,
                );
                professionalsDisabled = downgradeResult.disabledProfessionals;
                servicesDisabled = downgradeResult.disabledServices;
              }

              await prisma.planHistory.create({
                data: {
                  barbershopId,
                  fromPlan: oldPlan,
                  toPlan: activePlan,
                  isUpgrade,
                  professionalsDisabled,
                  servicesDisabled,
                  professionalsReactivated,
                  servicesReactivated,
                },
              });
            }

            await updateUserRoleBasedOnPlan(barbershopId, activePlan);
          }

          await syncSubscriptionFromStripe(subscription, barbershopId, newPlan);

          if (event.type === "customer.subscription.created") {
            await updateUserRoleBasedOnPlan(barbershopId, activePlan);

            await prisma.planHistory.create({
              data: {
                barbershopId,
                fromPlan: null,
                toPlan: activePlan,
                isUpgrade: true,
              },
            });
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

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const payment = await prisma.payment.findUnique({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (payment && payment.status !== PaymentStatus.SUCCEEDED) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.SUCCEEDED },
          });
          console.log(`Payment ${payment.id} confirmed via payment_intent.succeeded`);
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;

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

          const booking = await prisma.booking.findUnique({
            where: { id: payment.bookingId },
          });

          if (booking) {
            await prisma.booking.update({
              where: { id: booking.id },
              data: { cancelledAt: new Date() },
            });

            sendDailyScheduleToGroup(booking.professionalId, booking.date).catch(
              (err) => console.error("[WhatsApp] Erro ao enviar agenda após reembolso:", err),
            );
          }

          console.log(`Payment ${payment.id} refunded, booking cancelled`);
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
