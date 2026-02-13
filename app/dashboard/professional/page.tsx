import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, TrendingUp, CreditCard } from "lucide-react";
import { startOfMonthBrt, endOfMonthBrt, startOfDayBrt, endOfDayBrt } from "@/lib/timezone";
import { formatCurrency } from "@/lib/utils";
import { StripeAccountStatus, PaymentStatus } from "@/generated/prisma/enums";

function getStripeStatusInfo(status: StripeAccountStatus) {
  switch (status) {
    case StripeAccountStatus.ACTIVE:
      return { label: "Ativo", variant: "default" as const };
    case StripeAccountStatus.ONBOARDING:
      return { label: "Configurando", variant: "secondary" as const };
    case StripeAccountStatus.PENDING:
      return { label: "Pendente", variant: "outline" as const };
    case StripeAccountStatus.RESTRICTED:
      return { label: "Restrito", variant: "destructive" as const };
    case StripeAccountStatus.DISABLED:
      return { label: "Desativado", variant: "destructive" as const };
  }
}

export default async function ProfessionalDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      professional: {
        include: { barbershop: true },
      },
    },
  });

  if (!user?.professional) {
    redirect("/");
  }

  const professional = user.professional;
  const now = new Date();
  const monthStart = startOfMonthBrt(now);
  const monthEnd = endOfMonthBrt(now);
  const todayStart = startOfDayBrt(now);
  const todayEnd = endOfDayBrt(now);

  const [todayBookings, monthlyBookings, monthlyEarnings] = await Promise.all([
    prisma.booking.count({
      where: {
        professionalId: professional.id,
        date: { gte: todayStart, lte: todayEnd },
        cancelledAt: null,
      },
    }),
    prisma.booking.count({
      where: {
        professionalId: professional.id,
        date: { gte: monthStart, lte: monthEnd },
        cancelledAt: null,
      },
    }),
    prisma.payment.aggregate({
      where: {
        professionalId: professional.id,
        createdAt: { gte: monthStart, lte: monthEnd },
        status: PaymentStatus.SUCCEEDED,
      },
      _sum: {
        amountInCents: true,
        applicationFeeInCents: true,
      },
    }),
  ]);

  const totalEarnings =
    (monthlyEarnings._sum.amountInCents ?? 0) -
    (monthlyEarnings._sum.applicationFeeInCents ?? 0);

  const stripeStatus = getStripeStatusInfo(professional.stripeAccountStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Olá, {professional.displayName ?? user.name}!
        </h1>
        <p className="text-muted-foreground">
          Confira seu desempenho e próximos agendamentos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayBookings}</div>
            <p className="text-xs text-muted-foreground">
              agendamentos para hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyBookings}</div>
            <p className="text-xs text-muted-foreground">
              agendamentos no mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ganhos (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalEarnings)}
            </div>
            <p className="text-xs text-muted-foreground">
              líquido após taxa da plataforma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Stripe</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={stripeStatus.variant}>{stripeStatus.label}</Badge>
            <p className="mt-1 text-xs text-muted-foreground">
              {professional.stripeOnboardingComplete
                ? "Pronto para receber"
                : "Configure sua conta"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
