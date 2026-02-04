import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import Stripe from "stripe";
import { SubscriptionStatus } from "../generated/prisma/enums";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function mapStatus(stripeStatus: string): SubscriptionStatus {
  switch (stripeStatus) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    default:
      return SubscriptionStatus.INCOMPLETE;
  }
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: { not: null } },
  });

  if (!user?.stripeCustomerId) {
    console.log("Nenhum usuario com stripeCustomerId");
    return;
  }

  console.log("Buscando assinaturas do customer:", user.stripeCustomerId);

  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    limit: 10,
  });

  console.log("Assinaturas encontradas:", subscriptions.data.length);

  // Pegar primeira assinatura ativa
  const activeSub = subscriptions.data.find((s) => s.status === "active") || subscriptions.data[0];

  if (!activeSub) {
    console.log("Nenhuma assinatura encontrada");
    return;
  }

  console.log("Subscription:", activeSub.id, "Status:", activeSub.status);

  const barbershop = await prisma.barbershop.findFirst({
    where: { ownerId: user.id },
  });

  if (!barbershop) {
    console.log("Barbershop nao encontrada");
    return;
  }

  const priceId = activeSub.items.data[0]?.price?.id || "unknown";
  const product = activeSub.items.data[0]?.price?.product;
  const productId = typeof product === "string" ? product : product?.id || "unknown";

  // Converter datas - a API pode retornar Date ou timestamp
  const sub = activeSub as unknown as Record<string, unknown>;
  const periodStart = sub.current_period_start;
  const periodEnd = sub.current_period_end;
  const canceledAt = sub.canceled_at;

  const currentPeriodStart =
    periodStart instanceof Date
      ? periodStart
      : typeof periodStart === "number"
        ? new Date(periodStart * 1000)
        : new Date();

  const currentPeriodEnd =
    periodEnd instanceof Date
      ? periodEnd
      : typeof periodEnd === "number"
        ? new Date(periodEnd * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const canceledAtDate =
    canceledAt instanceof Date
      ? canceledAt
      : typeof canceledAt === "number"
        ? new Date(canceledAt * 1000)
        : null;

  console.log("Period Start:", currentPeriodStart);
  console.log("Period End:", currentPeriodEnd);

  await prisma.subscription.upsert({
    where: { barbershopId: barbershop.id },
    create: {
      barbershopId: barbershop.id,
      stripeSubscriptionId: activeSub.id,
      stripePriceId: priceId,
      stripeProductId: productId,
      status: mapStatus(activeSub.status),
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: activeSub.cancel_at_period_end,
      canceledAt: canceledAtDate,
    },
    update: {
      stripeSubscriptionId: activeSub.id,
      stripePriceId: priceId,
      stripeProductId: productId,
      status: mapStatus(activeSub.status),
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: activeSub.cancel_at_period_end,
      canceledAt: canceledAtDate,
    },
  });

  console.log("Assinatura sincronizada para barbershop:", barbershop.name);

  console.log("Sincronizacao completa!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
