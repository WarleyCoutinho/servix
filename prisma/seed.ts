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
      description: "Organize sua agenda e comece a atender online",
      priceInCents: 3990,
      stripePriceId: "price_placeholder_basic",
      maxBarbershops: 1,
      maxProfessionals: 1,
      maxServices: 3,
      features: [
        "1 estabelecimento",
        "1 profissional (proprietário)",
        "Até 3 serviços",
        "Agendamento online 24/7",
        "Pagamentos via Stripe Connect",
        "Controle básico de agenda",
      ],
    },
    {
      plan: SubscriptionPlan.STANDARD,
      name: "Padrão",
      description: "Mais equipe, mais organização e menos bagunça",
      priceInCents: 5990,
      stripePriceId: "price_placeholder_standard",
      maxBarbershops: 1,
      maxProfessionals: 3,
      maxServices: 10,
      features: [
        "1 estabelecimento",
        "Até 3 profissionais",
        "Até 10 serviços",
        "Agendamento online 24/7",
        "Pagamentos via Stripe Connect",
        "Gerenciamento básico da equipe",
      ],
    },
    {
      plan: SubscriptionPlan.PROFESSIONAL,
      name: "Profissional",
      description: "Controle total para crescer com dados",
      priceInCents: 9990,
      stripePriceId: "price_placeholder_professional",
      maxBarbershops: 1,
      maxProfessionals: 10,
      maxServices: 30,
      features: [
        "1 estabelecimento",
        "Até 10 profissionais",
        "Até 30 serviços",
        "Agendamento online 24/7",
        "Relatórios avançados",
        "Desempenho por profissional",
        "Pagamentos via Stripe Connect",
        "Suporte prioritário",
      ],
    },
    {
      plan: SubscriptionPlan.ENTERPRISE,
      name: "Empresarial",
      description: "Escala, padronização e gestão profissional",
      priceInCents: 24990,
      stripePriceId: "price_placeholder_enterprise",
      maxBarbershops: 5,
      maxProfessionals: 50,
      maxServices: null,
      features: [
        "Até 5 estabelecimentos",
        "Até 50 profissionais por unidade",
        "Serviços ilimitados",
        "Agendamento online 24/7",
        "Pagamentos via Stripe Connect",
        "Gestão avançada de equipe",
        "Suporte prioritário VIP",
      ],
    },
  ];

  for (const planData of plans) {
    const existingPlan = await prisma.planConfig.findUnique({
      where: { plan: planData.plan },
    });

    if (existingPlan) {
      await prisma.planConfig.update({
        where: { plan: planData.plan },
        data: {
          name: planData.name,
          description: planData.description,
          priceInCents: planData.priceInCents,
          maxBarbershops: planData.maxBarbershops,
          maxProfessionals: planData.maxProfessionals,
          maxServices: planData.maxServices,
          features: planData.features,
        },
      });
    } else {
      await prisma.planConfig.create({
        data: planData,
      });
    }
  }

  console.log("✅ Planos criados/atualizados com sucesso!");
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
