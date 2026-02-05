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
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Gerencie planos, usuarios e configuracoes do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-muted-foreground text-xs">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
