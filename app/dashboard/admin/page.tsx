import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@/generated/prisma/enums";
import { Users, Store, CreditCard, TrendingUp } from "lucide-react";

export default async function AdminDashboardPage() {
  const [totalUsers, totalBarbershops, activeSubscriptions, totalPlans] =
    await Promise.all([
      prisma.user.count(),
      prisma.barbershop.count(),
      prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      prisma.planConfig.count({ where: { isActive: true } }),
    ]);

  const stats = [
    {
      title: "Total de Usuarios",
      value: totalUsers,
      icon: Users,
      description: "Usuarios cadastrados",
    },
    {
      title: "Barbearias",
      value: totalBarbershops,
      icon: Store,
      description: "Estabelecimentos",
    },
    {
      title: "Assinaturas Ativas",
      value: activeSubscriptions,
      icon: CreditCard,
      description: "Pagantes",
    },
    {
      title: "Planos Ativos",
      value: totalPlans,
      icon: TrendingUp,
      description: "Disponiveis",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Gerencie planos, usuarios e configuracoes do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="relative overflow-hidden transition-shadow hover:shadow-md">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
              <p className="text-muted-foreground mt-1 text-xs">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
