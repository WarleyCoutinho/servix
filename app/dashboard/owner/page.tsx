import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getActiveBarbershop } from "@/lib/get-active-barbershop";
import { hasActiveSubscription } from "@/lib/get-owner-subscription";
import { getUserPlanInfo } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { endOfMonth, startOfMonth } from "date-fns";
import {
  ArrowUpRight,
  Calendar,
  Crown,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OwnerDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const data = await getActiveBarbershop(session.user.id);

  if (!data || !data.activeBarbershop) {
    redirect("/dashboard/owner/subscription");
  }

  const barbershop = await prisma.barbershop.findUnique({
    where: { id: data.activeBarbershop.id },
    include: {
      subscription: true,
      professionals: true,
      _count: {
        select: {
          services: true,
        },
      },
    },
  });

  if (!barbershop) {
    redirect("/");
  }
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthlyBookings = await prisma.booking.count({
    where: {
      barbershopId: barbershop.id,
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
      cancelledAt: null,
    },
  });

  const monthlyRevenue = await prisma.payment.aggregate({
    where: {
      booking: {
        barbershopId: barbershop.id,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      status: "SUCCEEDED",
    },
    _sum: {
      applicationFeeInCents: true,
    },
  });

  const isSubscriptionActive = await hasActiveSubscription(session.user.id);
  const planInfo = await getUserPlanInfo(
    session.user.id,
    data.activeBarbershop.id,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua barbearia</p>
      </div>

      {!isSubscriptionActive && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="flex items-center justify-between pt-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              Sua assinatura não está ativa. Ative para desbloquear todos os
              recursos.
            </p>
            <Button size="sm" asChild>
              <Link href="/dashboard/owner/subscription">Assinar Agora</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {planInfo && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Seu Plano</CardTitle>
              </div>
              <Badge
                variant={planInfo.isBasicPlan ? "secondary" : "default"}
                className="text-sm"
              >
                {planInfo.planName}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Estabelecimentos</span>
                <span className="font-medium">
                  {planInfo.currentBarbershops}/{planInfo.maxBarbershops}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Profissionais</span>
                <span className="font-medium">
                  {planInfo.currentProfessionals}/{planInfo.maxProfessionals}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Serviços</span>
                <span className="font-medium">
                  {planInfo.currentServices}/
                  {planInfo.maxServices ?? "Ilimitado"}
                </span>
              </div>
            </div>

            {planInfo.isBasicPlan && (
              <div className="flex items-center justify-between rounded-lg border bg-background p-3">
                <p className="text-sm text-muted-foreground">
                  Desbloqueie mais recursos com um plano superior
                </p>
                <Button size="sm" variant="default" asChild>
                  <Link href="/dashboard/owner/subscription">
                    <ArrowUpRight className="mr-1 h-4 w-4" />
                    Fazer Upgrade
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profissionais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {barbershop.professionals.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {barbershop.professionals.filter((p) => p.isActive).length} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {barbershop._count.services}
            </div>
            <p className="text-xs text-muted-foreground">cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Agendamentos (Mês)
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyBookings}</div>
            <p className="text-xs text-muted-foreground">neste mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa Plataforma (Mês)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(monthlyRevenue._sum.applicationFeeInCents ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              receita da plataforma
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
