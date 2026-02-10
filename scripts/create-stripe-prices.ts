// scripts/create-stripe-prices.ts
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { SubscriptionPlan } from "../generated/prisma/enums";
import Stripe from "stripe";

const connectionString = process.env.DATABASE_URL!;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});

const stripe = new Stripe(stripeSecretKey);

interface PlanConfig {
  plan: SubscriptionPlan;
  name: string;
  description: string;
  priceInCents: number;
}

const plans: PlanConfig[] = [
  {
    plan: SubscriptionPlan.BASIC,
    name: "Básico",
    description: "Ideal para começar seu negócio",
    priceInCents: 2990,
  },
  {
    plan: SubscriptionPlan.STANDARD,
    name: "Padrão",
    description: "Para pequenos negócios em crescimento",
    priceInCents: 4990,
  },
  {
    plan: SubscriptionPlan.PROFESSIONAL,
    name: "Profissional",
    description: "Para negócios em crescimento",
    priceInCents: 9990,
  },
  {
    plan: SubscriptionPlan.ENTERPRISE,
    name: "Empresarial",
    description: "Para redes e múltiplos estabelecimentos",
    priceInCents: 19990,
  },
];

async function createStripePrices() {
  console.log("🚀 Criando preços no Stripe...\n");

  try {
    await prisma.$connect();
    console.log("✓ Conexão com banco estabelecida");
  } catch (error) {
    console.error("❌ Erro ao conectar ao banco:", error);
    throw error;
  }

  for (const planConfig of plans) {
    console.log(`\n📦 Processando plano: ${planConfig.name}`);

    const existingPlan = await prisma.planConfig.findUnique({
      where: { plan: planConfig.plan },
    });

    if (!existingPlan) {
      console.log(`  ⚠️ Plano ${planConfig.name} não existe no banco. Pulando...`);
      continue;
    }

    const hasValidStripePriceId =
      existingPlan.stripePriceId &&
      !existingPlan.stripePriceId.includes("_xxx");

    if (hasValidStripePriceId) {
      try {
        await stripe.prices.retrieve(existingPlan.stripePriceId);
        console.log(`  ✓ Preço já existe no Stripe: ${existingPlan.stripePriceId}`);
        continue;
      } catch {
        console.log(`  ⚠️ Preço inválido no Stripe, criando novo...`);
      }
    }

    const product = await stripe.products.create({
      name: `Servix - Plano ${planConfig.name}`,
      description: planConfig.description,
      metadata: {
        plan: planConfig.plan,
      },
    });
    console.log(`  ✓ Produto criado: ${product.id}`);

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: planConfig.priceInCents,
      currency: "brl",
      recurring: {
        interval: "month",
      },
      metadata: {
        plan: planConfig.plan,
      },
    });
    console.log(`  ✓ Preço criado: ${price.id}`);

    await prisma.planConfig.update({
      where: { plan: planConfig.plan },
      data: {
        stripePriceId: price.id,
      },
    });
    console.log(`  ✓ Banco atualizado com stripePriceId: ${price.id}`);
  }

  console.log("\n✅ Todos os preços foram criados/verificados com sucesso!");
}

createStripePrices()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
