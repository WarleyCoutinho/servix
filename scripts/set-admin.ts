import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { UserRole } from "../generated/prisma/enums";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function setAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("❌ Uso: pnpm tsx scripts/set-admin.ts <email>");
    console.error("   Exemplo: pnpm tsx scripts/set-admin.ts admin@exemplo.com");
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ Usuário com email "${email}" não encontrado.`);
      process.exit(1);
    }

    if (user.role === UserRole.admin) {
      console.log(`ℹ️  Usuário "${email}" já é admin.`);
      process.exit(0);
    }

    await prisma.user.update({
      where: { email },
      data: { role: UserRole.admin },
    });

    console.log(`✅ Usuário "${email}" agora é admin!`);
    console.log(`   Acesse: /dashboard/admin`);
  } catch (error) {
    console.error("❌ Erro ao atualizar usuário:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setAdmin();
