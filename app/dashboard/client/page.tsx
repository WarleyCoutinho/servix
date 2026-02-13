import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientStats } from "@/data/client-stats";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CalendarDays,
  DollarSign,
  Store,
  Clock,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ptBR } from "date-fns/locale";
import { formatBrt } from "@/lib/timezone";

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function ClientDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/");
  }

  const stats = await getClientStats(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Olá, {user.name.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">
          Acompanhe suas visitas e agendamentos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Visitas
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              agendamentos realizados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalSpentInCents)}
            </div>
            <p className="text-xs text-muted-foreground">
              em serviços de beleza
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estabelecimentos
            </CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueBarbershops}</div>
            <p className="text-xs text-muted-foreground">
              lugares visitados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estabelecimentos Visitados</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.barbershopVisits.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Você ainda não visitou nenhum estabelecimento.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.barbershopVisits.map((visit) => (
                  <div
                    key={visit.barbershopId}
                    className="flex items-center gap-4"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={visit.barbershopImage} />
                      <AvatarFallback>
                        {visit.barbershopName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {visit.barbershopName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {visit.totalVisits} visita
                        {visit.totalVisits > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(visit.totalSpentInCents)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        última:{" "}
                        {formatBrt(visit.lastVisit, "dd/MM/yy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentServices.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Você ainda não contratou nenhum serviço.
              </p>
            ) : (
              <div className="space-y-4">
                {stats.recentServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-start gap-4 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{service.serviceName}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {service.barbershopName}
                        {service.professionalName && (
                          <> • {service.professionalName}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary">
                        {formatCurrency(service.priceInCents)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatBrt(service.date, "dd/MM/yy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
