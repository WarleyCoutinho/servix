import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Buscar o primeiro usuário (ou especifique um email)
  const userEmail = process.argv[2] || "warleycoutinho74@gmail.com";

  console.log(`\n🔍 Buscando usuário com email: ${userEmail}\n`);

  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { ownedBarbershop: true },
  });

  if (!user) {
    console.log("❌ Usuário não encontrado!");
    return;
  }

  console.log("📋 Usuário encontrado:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Nome: ${user.name}`);
  console.log(`   Role atual: ${user.role}`);
  console.log(`   Tem barbershop: ${user.ownedBarbershop ? "Sim" : "Não"}`);

  // Atualizar role para owner
  if (user.role !== "owner") {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "owner" },
    });
    console.log("\n✅ Role atualizado para 'owner'");
  } else {
    console.log("\n✓ Role já é 'owner'");
  }

  // Criar barbershop se não existir
  if (!user.ownedBarbershop) {
    const barbershop = await prisma.barbershop.create({
      data: {
        name: "Barbearia Teste",
        address: "Rua Exemplo, 123 - Centro",
        description: "Uma barbearia de teste para desenvolvimento",
        imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800",
        phones: ["(11) 99999-9999"],
        isActive: true,
        ownerId: user.id,
      },
    });
    console.log(`✅ Barbershop criada: ${barbershop.name} (ID: ${barbershop.id})`);

    // Criar horários de funcionamento padrão
    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
    for (const day of days) {
      await prisma.operatingHours.create({
        data: {
          barbershopId: barbershop.id,
          dayOfWeek: day,
          openTime: "09:00",
          closeTime: "19:00",
          isClosed: false,
        },
      });
    }
    // Domingo fechado
    await prisma.operatingHours.create({
      data: {
        barbershopId: barbershop.id,
        dayOfWeek: "SUNDAY",
        openTime: "09:00",
        closeTime: "19:00",
        isClosed: true,
      },
    });
    console.log("✅ Horários de funcionamento criados");

    // Criar alguns serviços de exemplo
    const services = [
      { name: "Corte Masculino", description: "Corte tradicional masculino", priceInCents: 4500, durationMinutes: 30 },
      { name: "Barba", description: "Barba completa com toalha quente", priceInCents: 3500, durationMinutes: 20 },
      { name: "Corte + Barba", description: "Combo corte e barba", priceInCents: 7000, durationMinutes: 50 },
    ];

    for (const service of services) {
      await prisma.barbershopService.create({
        data: {
          ...service,
          barbershopId: barbershop.id,
          imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400",
        },
      });
    }
    console.log("✅ Serviços de exemplo criados");
  } else {
    console.log(`✓ Barbershop já existe: ${user.ownedBarbershop.name}`);
  }

  console.log("\n🎉 Setup completo! Agora você pode acessar /dashboard/owner\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
