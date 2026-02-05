import { prisma } from "@/lib/prisma";
import { PlansManager } from "./plans-manager";

export default async function AdminPlansPage() {
  const plans = await prisma.planConfig.findMany({
    orderBy: { priceInCents: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciar Planos</h1>
        <p className="text-muted-foreground">
          Configure os limites, precos e recursos de cada plano
        </p>
      </div>

      <PlansManager initialPlans={plans} />
    </div>
  );
}
