import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { formatBrt } from "@/lib/timezone";
import { Calendar, Clock, User } from "lucide-react";

export default async function ProfessionalBookingsPage() {
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

  const bookings = await prisma.booking.findMany({
    where: {
      professionalId: professional.id,
    },
    include: {
      user: true,
      service: true,
    },
    orderBy: {
      date: "desc",
    },
    take: 50,
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Agendamentos</h1>
        <p className="text-muted-foreground">
          Gerencie seus agendamentos com clientes
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="text-muted-foreground mb-4 size-12" />
            <p className="text-muted-foreground text-lg">
              Nenhum agendamento encontrado
            </p>
            <p className="text-muted-foreground text-sm">
              Seus agendamentos aparecerão aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isPast = booking.date < now;
            const isCancelled = !!booking.cancelledAt;

            return (
              <Card key={booking.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="size-12">
                    <AvatarImage
                      src={booking.user.image ?? ""}
                      alt={booking.user.name}
                    />
                    <AvatarFallback>
                      {booking.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{booking.user.name}</p>
                      {isCancelled && (
                        <Badge variant="destructive">Cancelado</Badge>
                      )}
                      {!isCancelled && isPast && (
                        <Badge variant="secondary">Concluído</Badge>
                      )}
                      {!isCancelled && !isPast && (
                        <Badge variant="default">Agendado</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {booking.service.name}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="size-4" />
                      {formatBrt(booking.date, "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1 text-sm">
                      <Clock className="size-4" />
                      {formatBrt(booking.date, "HH:mm", { locale: ptBR })}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(booking.service.priceInCents)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {booking.service.durationMinutes} min
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
