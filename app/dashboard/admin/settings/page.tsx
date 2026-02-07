import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { SubscriptionStatus, SubscriptionPlan } from "@/generated/prisma/enums";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Users,
  Store,
  CreditCard,
  Activity,
  PieChart,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function AdminSettingsPage() {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const startMonth = startOfMonth(now);
  const endMonth = endOfMonth(now);

  const [
    totalRevenue,
    monthlyRevenue,
    subscriptionsByPlan,
    subscriptionsByStatus,
    recentUsers,
    recentBarbershops,
    bookingsThisMonth,
    activeBookings,
  ] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      include: { barbershop: true },
    }),
    prisma.subscription.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
        createdAt: { gte: startMonth, lte: endMonth },
      },
    }),
    prisma.subscription.groupBy({
      by: ["plan"],
      where: { status: SubscriptionStatus.ACTIVE },
      _count: true,
    }),
    prisma.subscription.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.barbershop.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.booking.count({
      where: {
        createdAt: { gte: startMonth, lte: endMonth },
        cancelledAt: null,
      },
    }),
    prisma.booking.count({
      where: { cancelledAt: null },
    }),
  ]);

  const planConfigs = await prisma.planConfig.findMany();
  const planPrices = planConfigs.reduce(
    (acc, plan) => {
      acc[plan.plan] = plan.priceInCents;
      return acc;
    },
    {} as Record<string, number>,
  );

  const monthlyRecurringRevenue = totalRevenue.reduce((acc, sub) => {
    return acc + (planPrices[sub.plan] || 0);
  }, 0);

  const planLabels: Record<SubscriptionPlan, string> = {
    [SubscriptionPlan.BASIC]: "Básico",
    [SubscriptionPlan.STANDARD]: "Standard",
    [SubscriptionPlan.PROFESSIONAL]: "Profissional",
    [SubscriptionPlan.ENTERPRISE]: "Enterprise",
  };

  const statusLabels: Record<SubscriptionStatus, string> = {
    [SubscriptionStatus.ACTIVE]: "Ativas",
    [SubscriptionStatus.PAST_DUE]: "Atrasadas",
    [SubscriptionStatus.CANCELED]: "Canceladas",
    [SubscriptionStatus.INCOMPLETE]: "Incompletas",
    [SubscriptionStatus.TRIALING]: "Trial",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações e Métricas</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema e métricas de negócio
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR (Receita Mensal)</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(monthlyRecurringRevenue / 100)}
            </div>
            <p className="text-muted-foreground text-xs">
              {totalRevenue.length} assinaturas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos este mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyRevenue}</div>
            <p className="text-muted-foreground text-xs">assinaturas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos (mês)</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingsThisMonth}</div>
            <p className="text-muted-foreground text-xs">
              {activeBookings} total ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento (30d)</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div>
                <div className="text-xl font-bold">{recentUsers}</div>
                <p className="text-muted-foreground text-xs">usuários</p>
              </div>
              <div>
                <div className="text-xl font-bold">{recentBarbershops}</div>
                <p className="text-muted-foreground text-xs">barbearias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Assinaturas por Plano
            </CardTitle>
            <CardDescription>Distribuição de assinaturas ativas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptionsByPlan.length > 0 ? (
                subscriptionsByPlan.map((item) => {
                  const total = subscriptionsByPlan.reduce(
                    (acc, i) => acc + i._count,
                    0,
                  );
                  const percentage = Math.round((item._count / total) * 100);
                  return (
                    <div key={item.plan} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{planLabels[item.plan]}</span>
                        <span className="font-medium">
                          {item._count} ({percentage}%)
                        </span>
                      </div>
                      <div className="bg-muted h-2 overflow-hidden rounded-full">
                        <div
                          className="bg-primary h-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-sm">
                  Nenhuma assinatura ativa
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Status das Assinaturas
            </CardTitle>
            <CardDescription>Visão geral de todas as assinaturas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptionsByStatus.map((item) => {
                const colors: Record<SubscriptionStatus, string> = {
                  [SubscriptionStatus.ACTIVE]: "bg-green-500",
                  [SubscriptionStatus.PAST_DUE]: "bg-yellow-500",
                  [SubscriptionStatus.CANCELED]: "bg-red-500",
                  [SubscriptionStatus.INCOMPLETE]: "bg-gray-500",
                  [SubscriptionStatus.TRIALING]: "bg-blue-500",
                };
                return (
                  <div
                    key={item.status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${colors[item.status]}`}
                      />
                      <span className="text-sm">{statusLabels[item.status]}</span>
                    </div>
                    <span className="font-medium">{item._count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regras de Negócio do Sistema</CardTitle>
          <CardDescription>
            Resumo das permissões e limites por role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-semibold">
                <Users className="h-4 w-4 text-gray-600" />
                Cliente
              </h4>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Visualizar estabelecimentos</li>
                <li>• Agendar serviços</li>
                <li>• Cancelar próprios agendamentos</li>
                <li>• Visualizar histórico de reservas</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-semibold">
                <Store className="h-4 w-4 text-blue-600" />
                Proprietário
              </h4>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Gerenciar estabelecimento</li>
                <li>• Adicionar/remover profissionais*</li>
                <li>• Criar/editar serviços</li>
                <li>• Visualizar agendamentos</li>
                <li>• Gerenciar assinatura</li>
              </ul>
              <p className="text-muted-foreground text-xs italic">
                *Limites baseados no plano
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-semibold">
                <Store className="h-4 w-4 text-purple-600" />
                Prop./Profissional (Básico)
              </h4>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Todas permissões de proprietário</li>
                <li>• Gerenciar própria agenda</li>
                <li>• Receber pagamentos via Stripe</li>
                <li className="text-red-600">• Não pode adicionar profissionais</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-semibold">
                <Users className="h-4 w-4 text-green-600" />
                Profissional
              </h4>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Visualizar estabelecimento</li>
                <li>• Gerenciar própria agenda</li>
                <li>• Visualizar/atualizar agendamentos</li>
                <li>• Configurar conta Stripe</li>
                <li>• Receber pagamentos direto</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-semibold text-red-600">
                <Users className="h-4 w-4" />
                Administrador
              </h4>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Gerenciar todos os planos</li>
                <li>• Alterar roles de usuários</li>
                <li>• Banir/desbanir usuários</li>
                <li>• Visualizar métricas do sistema</li>
                <li>• Acesso total ao sistema</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Limites por Plano</h4>
              <div className="text-muted-foreground space-y-1 text-xs">
                <p>
                  <strong>Básico:</strong> 1 prof., 5 serviços
                </p>
                <p>
                  <strong>Standard:</strong> 3 prof., 10 serviços
                </p>
                <p>
                  <strong>Profissional:</strong> 10 prof., 100 serviços
                </p>
                <p>
                  <strong>Enterprise:</strong> 50 prof., ilimitado
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
