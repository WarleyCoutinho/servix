import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Headset, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SupportDashboardPage() {
  const openTickets = await prisma.supportTicket.count({
    where: { status: "OPEN" },
  });

  const waitingAdmin = await prisma.supportTicket.count({
    where: { status: "WAITING_ADMIN" },
  });

  const resolvedToday = await prisma.supportTicket.count({
    where: {
      status: "RESOLVED",
      closedAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });

  const totalResolved = await prisma.supportTicket.count({
    where: { status: "RESOLVED" },
  });

  const stats = [
    {
      title: "Aguardando Resposta",
      value: waitingAdmin,
      icon: AlertTriangle,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Tickets Abertos",
      value: openTickets,
      icon: Headset,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Resolvidos Hoje",
      value: resolvedToday,
      icon: CheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Total Resolvidos",
      value: totalResolved,
      icon: Clock,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Painel de Suporte
        </h1>
        <p className="text-muted-foreground">
          Acompanhe e responda os tickets de atendimento
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {waitingAdmin > 0 && (
        <Card className="border-amber-500/30">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-amber-500" />
              <div>
                <p className="font-medium">
                  {waitingAdmin} ticket{waitingAdmin > 1 ? "s" : ""}{" "}
                  aguardando sua resposta
                </p>
                <p className="text-sm text-muted-foreground">
                  Clientes estão esperando atendimento humano
                </p>
              </div>
            </div>
            <Button asChild>
              <Link href="/dashboard/support/tickets">Ver Tickets</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
