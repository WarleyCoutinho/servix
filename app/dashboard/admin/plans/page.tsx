import { safeQuery } from "@/lib/prisma";
import { prisma } from "@/lib/prisma";
import { PlansManager } from "./plans-manager";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function AdminPlansPage() {
  const { data: plans, error } = await safeQuery(
    () => prisma.planConfig.findMany({
      orderBy: { priceInCents: "asc" },
    }),
    []
  );

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Planos</h1>
          <p className="text-muted-foreground">
            Configure os limites, precos e recursos de cada plano
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Erro ao carregar planos</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Não foi possível carregar os planos. Tente novamente.
          </p>
          <Button asChild>
            <Link href="/dashboard/admin/plans">
              <RefreshCw className="mr-2 h-4 w-4" />
              Recarregar
            </Link>
          </Button>
        </div>
      </div>
    );
  }

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
