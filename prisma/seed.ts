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
    name: "Solo",
    description:
      "Para o profissional autônomo que quer parecer grande sem complicação",
    priceInCents: 3990,
    stripePriceId: "price_placeholder_basic",
    maxBarbershops: 1,
    maxProfessionals: 1,
    maxServices: 4,
    features: [
      "1 loja",
      "1 profissional",
      "Até 4 serviços",
      "Agendamento online 24/7",
      "Página pública do seu negócio",
      "Pagamentos online integrados",
      "Suporte via chat",
    ],
  },
  {
    plan: SubscriptionPlan.STANDARD,
    name: "Equipe",
    description:
      "Sua equipe cresceu — organize horários, comissões e clientes em um só lugar",
    priceInCents: 7990,
    stripePriceId: "price_placeholder_standard",
    maxBarbershops: 1,
    maxProfessionals: 5,
    maxServices: 20,
    features: [
      "1 loja",
      "Até 5 profissionais",
      "Até 20 serviços",
      "Agendamento online por profissional",
      "Página pública do seu negócio",
      "Pagamentos online integrados",
      "Comissão automática por profissional",
      "Relatórios de faturamento",
      "Suporte via chat",
    ],
  },
  {
    plan: SubscriptionPlan.PROFESSIONAL,
    name: "Profissional",
    description:
      "Gestão completa para quem quer crescer com dados e não no escuro",
    priceInCents: 12990,
    stripePriceId: "price_placeholder_professional",
    maxBarbershops: 1,
    maxProfessionals: 20,
    maxServices: 50,
    features: [
      "1 loja",
      "20 profissionais ",
      "Até 50 serviços",
      "Agendamento online por profissional",
      "Página pública por estabelecimento",
      "Pagamentos online integrados",
      "Comissão automática por profissional",
      "Relatórios avançados por unidade",
      "Ranking de desempenho por profissional",
      "Histórico completo de clientes",
      "Suporte prioritário",
    ],
  },
  // {
  //   plan: SubscriptionPlan.ENTERPRISE,
  //   name: "Rede",
  //   description:
  //     "Múltiplas unidades, gestão centralizada e controle total da operação",
  //   priceInCents: 24990,
  //   stripePriceId: "price_placeholder_enterprise",
  //   maxBarbershops: 5,
  //   maxProfessionals: 100,
  //   maxServices: 999,
  //   features: [
  //     "Até 5 lojas",
  //     "Até 100 profissionais por unidade",
  //     "Ate 999 serviços por unidade",
  //     "Agendamento online por profissional",
  //     "Página pública por estabelecimento",
  //     "Pagamentos online integrados",
  //     "Comissão automática por profissional",
  //     "Dashboard centralizado — todas as unidades",
  //     "Relatórios consolidados da rede",
  //     "Gestão de permissões por unidade",
  //     "Integração dedicado",
  //     "Suporte VIP com gerente de conta",
  //   ],
  // },
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

      // ─── Produto ────────────────────────────────────────────────────────────

      const products = await stripe.products.search({
        query: `metadata['plan']:'${planData.plan}'`,
      });

      let product: Stripe.Product;

      if (products.data.length > 0) {
        product = products.data[0];

        if (!product.active) {
          console.log(`  ↻ Reativando produto ${planData.name}...`);
          await stripe.products.update(product.id, { active: true });
        }

        await stripe.products.update(product.id, {
          name: `Servix - Plano ${planData.name}`,
          description: planData.description,
        });

        console.log(`  ✓ Produto encontrado: ${product.id}`);
      } else {
        console.log(`  + Criando novo produto para ${planData.name}...`);
        product = await stripe.products.create({
          name: `Servix - Plano ${planData.name}`,
          description: planData.description,
          active: true,
          metadata: { plan: planData.plan },
        });
        console.log(`  ✓ Produto criado: ${product.id}`);
      }

      // ─── Preços ─────────────────────────────────────────────────────────────

      const activePrices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 100,
      });

      console.log(
        `  📋 Preços ativos encontrados: ${activePrices.data.length}`,
      );

      // Preço ativo com o valor exato já existe → reutiliza
      const correctPrice = activePrices.data.find(
        (p) =>
          p.unit_amount === planData.priceInCents &&
          p.currency === "brl" &&
          p.recurring?.interval === "month",
      );

      let targetPriceId: string;

      if (correctPrice) {
        targetPriceId = correctPrice.id;
        console.log(
          `  ✓ Preço correto já existe: ${targetPriceId} (R$ ${(planData.priceInCents / 100).toFixed(2)})`,
        );
      } else {
        // Cria o novo preço ANTES de arquivar os antigos
        // (garante que nunca ficamos sem preço ativo)
        console.log(
          `  + Criando novo preço: R$ ${(planData.priceInCents / 100).toFixed(2)}`,
        );
        const newPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: planData.priceInCents,
          currency: "brl",
          recurring: { interval: "month" },
          metadata: { plan: planData.plan },
        });
        targetPriceId = newPrice.id;
        console.log(`  ✓ Preço criado: ${targetPriceId}`);

        // Arquiva preços antigos com valor diferente
        // (não os deleta — o Stripe não permite deleção de preços usados em assinaturas)
        const outdatedPrices = activePrices.data.filter(
          (p) => p.id !== targetPriceId,
        );

        if (outdatedPrices.length > 0) {
          console.log(
            `  🗂️  Arquivando ${outdatedPrices.length} preço(s) antigo(s)...`,
          );
          for (const old of outdatedPrices) {
            await stripe.prices.update(old.id, { active: false });
            console.log(
              `     - Arquivado: ${old.id} (R$ ${((old.unit_amount ?? 0) / 100).toFixed(2)})`,
            );
          }
        }
      }

      // ─── Sincroniza banco ────────────────────────────────────────────────────

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
