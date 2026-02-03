import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { SubscriptionStatus } from "@/generated/prisma/enums";

export default async function OwnerDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedBarbershop: {
        include: {
          subscription: true,
          professionals: true,
          _count: {
            select: {
              services: true,
            },
          },
        },
      },
    },
  });

  if (!user?.ownedBarbershop) {
    redirect("/");
  }

  const barbershop = user.ownedBarbershop;
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

  const isSubscriptionActive =
    barbershop.subscription?.status === SubscriptionStatus.ACTIVE;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da sua barbearia
        </p>
      </div>

      {!isSubscriptionActive && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              Sua assinatura não está ativa. Ative para desbloquear todos os
              recursos.
            </p>
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
            <p className="text-xs text-muted-foreground">receita da plataforma</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
