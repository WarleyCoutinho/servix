import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { SubscriptionPlan } from "../generated/prisma/enums";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function seedPlanConfigs() {
  const plans = [
    {
      plan: SubscriptionPlan.BASIC,
      name: "Básico",
      description: "Ideal para profissionais autônomos",
      priceInCents: 2990,
      stripePriceId:
        process.env.STRIPE_PRICE_BASIC || "price_placeholder_basic",
      maxBarbershops: 1,
      maxProfessionals: 1,
      maxServices: 5,
      features: [
        "1 Estabelecimento",
        "Proprietário é o profissional",
        "Até 5 Serviços",
        "Agendamento online",
        "Pagamentos via Stripe Connect",
      ],
    },
    {
      plan: SubscriptionPlan.STANDARD,
      name: "Padrão",
      description: "Para pequenos negócios em crescimento",
      priceInCents: 4990,
      stripePriceId:
        process.env.STRIPE_PRICE_STANDARD || "price_placeholder_standard",
      maxBarbershops: 1,
      maxProfessionals: 3,
      maxServices: 10,
      features: [
        "1 Estabelecimento",
        "Até 3 Profissionais",
        "Até 10 Serviços",
        "Agendamento online",
        "Pagamentos via Stripe Connect",
        "Gerenciamento de equipe",
      ],
    },
    {
      plan: SubscriptionPlan.PROFESSIONAL,
      name: "Profissional",
      description: "Tudo que você precisa para crescer",
      priceInCents: 9990,
      stripePriceId:
        process.env.STRIPE_PRICE_PROFESSIONAL ||
        "price_placeholder_professional",
      maxBarbershops: 1,
      maxProfessionals: 10,
      maxServices: 100,
      features: [
        "1 Estabelecimento",
        "Até 10 Profissionais",
        "Até 100 Serviços",
        "Agendamento online",
        "Pagamentos via Stripe Connect",
        "Gerenciamento de equipe",
        "Suporte prioritário",
      ],
    },
    {
      plan: SubscriptionPlan.ENTERPRISE,
      name: "Empresarial",
      description: "Para redes e múltiplos estabelecimentos",
      priceInCents: 19990,
      stripePriceId:
        process.env.STRIPE_PRICE_ENTERPRISE || "price_placeholder_enterprise",
      maxBarbershops: 5,
      maxProfessionals: 50,
      maxServices: null,
      features: [
        "Até 5 Estabelecimentos",
        "Até 50 Profissionais por unidade",
        "Serviços ilimitados",
        "Agendamento online",
        "Pagamentos via Stripe Connect",
        "Gerenciamento de equipe",
        "Suporte prioritário",
      ],
    },
  ];

  for (const planData of plans) {
    await prisma.planConfig.upsert({
      where: { plan: planData.plan },
      update: {
        name: planData.name,
        description: planData.description,
        priceInCents: planData.priceInCents,
        stripePriceId: planData.stripePriceId,
        maxBarbershops: planData.maxBarbershops,
        maxProfessionals: planData.maxProfessionals,
        maxServices: planData.maxServices,
        features: planData.features,
      },
      create: planData,
    });
  }

  console.log("✅ PlanConfigs criados/atualizados com sucesso!");
}

async function main() {
  try {
    await seedPlanConfigs();
  } catch (error) {
    console.error("❌ Erro no seed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
