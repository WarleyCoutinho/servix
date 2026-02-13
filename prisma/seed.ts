import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import Stripe from "stripe";
import { PrismaClient } from "../generated/prisma/client";
import { SubscriptionPlan } from "../generated/prisma/enums";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

async function seedPlanConfigs() {
  console.log("📦 Criando/atualizando planos no banco...\n");

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
      console.log(`  ✓ Plano ${planData.name} atualizado`);
    } else {
      await prisma.planConfig.create({
        data: planData,
      });
      console.log(`  ✓ Plano ${planData.name} criado`);
    }
  }

  console.log("\n✅ Planos no banco atualizados!");
}

async function createStripePrices() {
  console.log("\n💳 Criando/verificando preços no Stripe...\n");

  const results = {
    success: [] as string[],
    errors: [] as { plan: string; error: string }[],
  };

  for (const planData of plans) {
    try {
      const existingPlan = await prisma.planConfig.findUnique({
        where: { plan: planData.plan },
      });

      if (!existingPlan) {
        console.log(
          `  ⚠️ Plano ${planData.name} não existe no banco. Pulando...`,
        );
        results.errors.push({
          plan: planData.name,
          error: "Não existe no banco",
        });
        continue;
      }

      // Busca produto existente no Stripe pelo metadata
      const products = await stripe.products.search({
        query: `metadata['plan']:'${planData.plan}'`,
      });

      let product;

      if (products.data.length > 0) {
        // Usa o produto existente
        product = products.data[0];

        // Reativa se necessário
        if (!product.active) {
          console.log(`  ↻ Reativando produto ${planData.name}...`);
          await stripe.products.update(product.id, { active: true });
        }

        // Atualiza informações do produto
        await stripe.products.update(product.id, {
          name: `Servix - Plano ${planData.name}`,
          description: planData.description,
        });

        console.log(`  ✓ Produto encontrado: ${product.id}`);
      } else {
        // Cria novo produto apenas se não existir
        console.log(`  + Criando novo produto para ${planData.name}...`);
        product = await stripe.products.create({
          name: `Servix - Plano ${planData.name}`,
          description: planData.description,
          active: true,
          metadata: {
            plan: planData.plan,
          },
        });
        console.log(`  ✓ Produto criado: ${product.id}`);
      }

      // Lista todos os preços ATIVOS deste produto
      const activePrices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 100,
      });

      console.log(
        `  📋 Preços ativos encontrados: ${activePrices.data.length}`,
      );

      // Procura um preço ativo com o valor correto
      const correctPrice = activePrices.data.find(
        (p) => p.unit_amount === planData.priceInCents && p.currency === "brl",
      );

      let targetPriceId: string;

      if (correctPrice) {
        // Preço correto já existe, reutiliza
        targetPriceId = correctPrice.id;
        console.log(
          `  ✓ Preço correto encontrado: ${targetPriceId} (R$ ${(planData.priceInCents / 100).toFixed(2)})`,
        );
      } else {
        // Não existe preço correto, cria um novo
        console.log(
          `  + Criando novo preço: R$ ${(planData.priceInCents / 100).toFixed(2)}`,
        );
        const newPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: planData.priceInCents,
          currency: "brl",
          recurring: {
            interval: "month",
          },
          metadata: {
            plan: planData.plan,
          },
        });
        targetPriceId = newPrice.id;
        console.log(`  ✓ Preço criado: ${targetPriceId}`);
      }

      // Sincroniza o ID do preço no banco
      if (existingPlan.stripePriceId !== targetPriceId) {
        await prisma.planConfig.update({
          where: { plan: planData.plan },
          data: { stripePriceId: targetPriceId },
        });
        console.log(
          `  💾 Banco sincronizado: ${existingPlan.stripePriceId || "vazio"} → ${targetPriceId}`,
        );
      } else {
        console.log(`  ✓ Banco já sincronizado com: ${targetPriceId}`);
      }

      results.success.push(planData.name);
      console.log(`  ✅ ${planData.name} OK!\n`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ Erro ao processar ${planData.name}:`, errorMsg);
      results.errors.push({ plan: planData.name, error: errorMsg });
      console.log("");
    }
  }

  console.log("=".repeat(60));
  console.log("📊 RESUMO FINAL:");
  console.log(`  ✓ Sucesso: ${results.success.length} planos`);
  if (results.success.length > 0) {
    results.success.forEach((p) => console.log(`    - ${p}`));
  }

  if (results.errors.length > 0) {
    console.log(`  ❌ Erros: ${results.errors.length} planos`);
    results.errors.forEach((e) => console.log(`    - ${e.plan}: ${e.error}`));
  }
  console.log("=".repeat(60));

  console.log("\n✅ Preços no Stripe atualizados!");
}

async function main() {
  console.log("🚀 Iniciando seed completo...\n");

  try {
    await prisma.$connect();
    console.log("✓ Conexão com banco estabelecida\n");

    await seedPlanConfigs();
    await createStripePrices();

    console.log("\n🎉 Seed completo finalizado com sucesso!");
  } catch (error) {
    console.error("\n❌ Erro no seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
