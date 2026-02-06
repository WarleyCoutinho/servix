// scripts/seed-plan.ts
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { SubscriptionPlan } from "../generated/prisma/enums";

const connectionString = process.env.DATABASE_URL!;

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});

async function seedPlans() {
  const plans = [
    {
      plan: SubscriptionPlan.BASIC,
      name: "Básico",
      description: "Ideal para começar seu negócio",
      priceInCents: 2900, // R$ 29,00
      stripePriceId: "price_basic_xxx",
      maxBarbershops: 1,
      maxProfessionals: 1,
      maxServices: 5,
      isActive: true,
      features: [
        "1 barbearia",
        "Até 1 profissional",
        "5 serviços cadastrados",
        "Agendamento online",
        "Suporte por email",
      ],
    },
    {
      plan: SubscriptionPlan.STANDARD,
      name: "Padrão",
      description: "Para pequenos negócios em crescimento",
      priceInCents: 4990, // R$ 49,90
      stripePriceId: "price_standard_xxx",
      maxBarbershops: 1,
      maxProfessionals: 3,
      maxServices: 10,
      isActive: true,
      features: [
        "1 barbearia",
        "Até 3 profissionais",
        "10 serviços cadastrados",
        "Agendamento online",
        "Suporte por email",
      ],
    },
    {
      plan: SubscriptionPlan.PROFESSIONAL,
      name: "Profissional",
      description: "Para negócios em crescimento",
      priceInCents: 9990, // R$ 99,90
      stripePriceId: "price_professional_xxx",
      maxBarbershops: 1,
      maxProfessionals: 10,
      maxServices: 30,
      isActive: true,
      features: [
        "1 barbearia",
        "Até 10 profissionais",
        "30 serviços cadastrados",
        "Agendamento online",
        "Relatórios avançados",
        "Suporte prioritário",
      ],
    },
    {
      plan: SubscriptionPlan.ENTERPRISE,
      name: "Empresarial",
      description: "Para grandes operações",
      priceInCents: 19990, // R$ 199,90
      stripePriceId: "price_enterprise_xxx",
      maxBarbershops: 999,
      maxProfessionals: 999,
      maxServices: null, // ilimitado
      isActive: true,
      features: [
        "Barbearias ilimitadas",
        "Profissionais ilimitados",
        "Serviços ilimitados",
        "Agendamento online",
        "Relatórios personalizados",
        "API de integração",
        "Suporte 24/7",
        "Gerente de conta dedicado",
      ],
    },
  ];

  console.log("🌱 Iniciando seed dos planos...");
  console.log(
    `📦 Conectando em: ${connectionString.replace(/:.+@/, ":****@")}`,
  );

  try {
    await prisma.$connect();
    console.log("✓ Conexão com banco estabelecida");
  } catch (error) {
    console.error("❌ Erro ao conectar ao banco:", error);
    throw error;
  }

  for (const plan of plans) {
    await prisma.planConfig.upsert({
      where: { plan: plan.plan },
      update: plan,
      create: plan,
    });
    console.log(`✓ Plano ${plan.name} criado/atualizado`);
  }

  console.log("✅ Planos criados com sucesso!");
}

seedPlans()
  .catch((e) => {
    console.error("❌ Erro ao criar planos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
