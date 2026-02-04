import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const userEmail = process.argv[2] || "warleycoutinho74@gmail.com";

  console.log(`\n🔍 Buscando usuário com email: ${userEmail}\n`);

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { professional: true },
  });

  if (!user) {
    console.log("❌ Usuário não encontrado!");
    return;
  }

  console.log("📋 Usuário encontrado:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Nome: ${user.name}`);
  console.log(`   Role atual: ${user.role}`);
  console.log(`   Tem registro Professional: ${user.professional ? "Sim" : "Não"}`);

  // Buscar uma barbershop existente
  const barbershop = await prisma.barbershop.findFirst({
    where: { isActive: true },
  });

  if (!barbershop) {
    console.log("\n❌ Nenhuma barbershop encontrada! Crie uma primeiro com setup-owner.ts");
    return;
  }

  console.log(`\n🏪 Barbershop encontrada: ${barbershop.name}`);

  // Atualizar role para professional
  if (user.role !== "professional") {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "professional" },
    });
    console.log("✅ Role atualizado para 'professional'");
  } else {
    console.log("✓ Role já é 'professional'");
  }

  // Criar registro Professional se não existir
  if (!user.professional) {
    const professional = await prisma.professional.create({
      data: {
        userId: user.id,
        barbershopId: barbershop.id,
        cpf: "000.000.000-00",
        displayName: user.name,
        bio: "Profissional especializado em cortes modernos e tradicionais.",
        imageUrl: user.image,
        isActive: true,
        acceptsPix: true,
        acceptsCard: true,
      },
    });
    console.log(`✅ Registro Professional criado (ID: ${professional.id})`);

    // Criar agenda padrão (Seg-Sáb)
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
    for (const day of days) {
      await prisma.professionalSchedule.create({
        data: {
          professionalId: professional.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "18:00",
          isAvailable: true,
        },
      });
    }
    console.log("✅ Agenda semanal criada (Seg-Sáb 09:00-18:00)");
  } else {
    console.log(`✓ Registro Professional já existe (ID: ${user.professional.id})`);
  }

  console.log("\n🎉 Setup completo! Agora você pode acessar /dashboard/professional\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
