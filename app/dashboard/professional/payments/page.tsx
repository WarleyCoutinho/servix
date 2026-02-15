import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { PaymentStatus } from "@/generated/prisma/enums";
import { startOfMonthBrt, endOfMonthBrt, formatBrt } from "@/lib/timezone";
import PaymentFilters from "./_components/payment-filters";
import type { Prisma } from "@/generated/prisma/client";

function getPaymentStatusInfo(status: PaymentStatus) {
  switch (status) {
    case PaymentStatus.SUCCEEDED:
      return { label: "Aprovado", variant: "default" as const };
    case PaymentStatus.PENDING:
      return { label: "Pendente", variant: "secondary" as const };
    case PaymentStatus.FAILED:
      return { label: "Falhou", variant: "destructive" as const };
    case PaymentStatus.REFUNDED:
      return { label: "Reembolsado", variant: "outline" as const };
    case PaymentStatus.CANCELED:
      return { label: "Cancelado", variant: "destructive" as const };
  }
}

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function ProfessionalPaymentsPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      professional: true,
    },
  });

  if (!user?.professional) {
    redirect("/");
  }

  const professional = user.professional;
  const now = new Date();
  const monthStart = startOfMonthBrt(now);
  const monthEnd = endOfMonthBrt(now);
  const { filter } = await searchParams;

  const filterWhere: Prisma.PaymentWhereInput = (() => {
    switch (filter) {
      case "stripe":
        return { stripePaymentIntentId: { not: null } };
      case "manual":
        return { paymentMethod: "pay_after_service" };
      default:
        return {};
    }
  })();

  const [payments, monthlyStats] = await Promise.all([
    prisma.payment.findMany({
      where: {
        professionalId: professional.id,
        ...filterWhere,
      },
      include: {
        booking: {
          include: {
            user: true,
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
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
      _count: true,
    }),
  ]);

  const totalRevenue = monthlyStats._sum.amountInCents ?? 0;
  const totalFees = monthlyStats._sum.applicationFeeInCents ?? 0;
  const netEarnings = totalRevenue - totalFees;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pagamentos</h1>
        <p className="text-muted-foreground">
          Acompanhe seus recebimentos e histórico de pagamentos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita do Mês
            </CardTitle>
            <DollarSign className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-muted-foreground text-xs">
              {monthlyStats._count} pagamentos recebidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa da Plataforma
            </CardTitle>
            <ArrowDownRight className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              -{formatCurrency(totalFees)}
            </div>
            <p className="text-muted-foreground text-xs">
              {process.env.PLATFORM_FEE_PERCENTAGE || 10}% sobre cada venda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ganho Líquido
            </CardTitle>
            <ArrowUpRight className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(netEarnings)}
            </div>
            <p className="text-muted-foreground text-xs">
              Valor a receber no mês
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Histórico de Pagamentos</CardTitle>
          <PaymentFilters />
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CreditCard className="text-muted-foreground mb-4 size-12" />
              <p className="text-muted-foreground text-lg">
                Nenhum pagamento encontrado
              </p>
              <p className="text-muted-foreground text-sm">
                Seus pagamentos aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => {
                const statusInfo = getPaymentStatusInfo(payment.status);
                const netAmount =
                  payment.amountInCents - payment.applicationFeeInCents;
                const isManual = payment.paymentMethod === "pay_after_service";

                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {payment.booking.service.name}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {payment.booking.user.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatBrt(payment.createdAt, "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {isManual ? "Manual" : "Stripe"}
                        </Badge>
                      </div>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(netAmount)}
                      </p>
                      {!isManual && (
                        <p className="text-muted-foreground text-xs">
                          de {formatCurrency(payment.amountInCents)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
