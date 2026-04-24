import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import { formatBrt } from "@/lib/timezone";
import { Calendar, Clock } from "lucide-react";
import { PaymentStatus } from "@/generated/prisma/enums";
import MarkReceivedButton from "./_components/mark-received-button";

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
      payment: true,
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
            const isPayAfterService =
              booking.payment?.paymentMethod === "pay_after_service";
            const isPaymentPending =
              isPayAfterService &&
              booking.payment?.status === PaymentStatus.PENDING;
            const isPaymentReceived =
              isPayAfterService &&
              booking.payment?.status === PaymentStatus.SUCCEEDED;

            return (
              <Card key={booking.id}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <Avatar className="size-12 shrink-0">
                    <AvatarImage
                      src={booking.user.image ?? ""}
                      alt={booking.user.name}
                    />
                    <AvatarFallback>
                      {booking.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{booking.user.name}</p>
                      {isCancelled && (
                        <Badge variant="destructive">Cancelado</Badge>
                      )}
                      {!isCancelled && isPast && !isPaymentPending && (
                        <Badge variant="secondary">Concluído</Badge>
                      )}
                      {!isCancelled && !isPast && (
                        <Badge variant="default">Agendado</Badge>
                      )}
                      {!isCancelled && isPaymentPending && (
                        <Badge
                          variant="outline"
                          className="border-yellow-500/50 text-yellow-700 dark:text-yellow-400"
                        >
                          Não pago
                        </Badge>
                      )}
                      {!isCancelled && isPaymentReceived && (
                        <Badge
                          variant="outline"
                          className="border-green-500/50 text-green-700 dark:text-green-400"
                        >
                          Recebido
                        </Badge>
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

                  {!isCancelled && isPaymentPending && booking.payment && (
                    <div className="shrink-0">
                      <MarkReceivedButton paymentId={booking.payment.id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
