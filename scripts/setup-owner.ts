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
    include: { ownedBarbershops: true },
  });

  if (!user) {
    console.log("Usuário não encontrado!");
    return;
  }

  const ownedBarbershop = user.ownedBarbershops[0];

  console.log("Usuário encontrado:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Nome: ${user.name}`);
  console.log(`   Role atual: ${user.role}`);
  console.log(`   Tem barbershop: ${ownedBarbershop ? "Sim" : "Não"}`);

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
  if (!ownedBarbershop) {
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

    // Criar profissional do owner com agenda
    const existingProfessional = await prisma.professional.findUnique({
      where: { userId: user.id },
    });

    if (!existingProfessional) {
      const professional = await prisma.professional.create({
        data: {
          userId: user.id,
          barbershopId: barbershop.id,
          cpf: `owner_${user.id.slice(0, 8)}`,
          displayName: user.name,
          isActive: true,
          acceptsCard: true,
          acceptsPix: false,
        },
      });

      const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
      for (const day of days) {
        await prisma.professionalSchedule.create({
          data: {
            professionalId: professional.id,
            dayOfWeek: day,
            startTime: "09:00",
            endTime: day === "SATURDAY" ? "14:00" : "18:00",
            isAvailable: day !== "SUNDAY",
          },
        });
      }
      console.log("✅ Profissional do owner criado com agenda");
    }

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
    console.log(`Barbershop já existe: ${ownedBarbershop.name}`);
  }

  console.log("\n🎉 Setup completo! Agora você pode acessar /dashboard/owner\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
