import { prisma } from "@/lib/prisma";
import { FeesManager } from "./fees-manager";

export default async function AdminFeesPage() {
  const barbershops = await prisma.barbershop.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      platformFeePercentage: true,
      feeOverride: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Taxas</h1>
        <p className="text-muted-foreground">
          Configure as taxas de plataforma por barbearia
        </p>
      </div>
      <FeesManager initialBarbershops={barbershops} />
    </div>
  );
}
