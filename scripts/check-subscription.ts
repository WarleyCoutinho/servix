import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\n=== ASSINATURAS NO BANCO ===\n");

  const subscriptions = await prisma.subscription.findMany({
    include: {
      barbershop: {
        select: { id: true, name: true, isActive: true },
      },
    },
  });

  console.log("Subscriptions:", JSON.stringify(subscriptions, null, 2));

  console.log("\n=== USUÁRIOS COM STRIPE CUSTOMER ===\n");

  const users = await prisma.user.findMany({
    where: { stripeCustomerId: { not: null } },
    select: {
      id: true,
      name: true,
      email: true,
      stripeCustomerId: true,
      role: true,
    },
  });

  console.log("Users:", JSON.stringify(users, null, 2));

  console.log("\n=== BARBERSHOPS ===\n");

  const barbershops = await prisma.barbershop.findMany({
    select: { id: true, name: true, isActive: true, ownerId: true },
  });

  console.log("Barbershops:", JSON.stringify(barbershops, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
