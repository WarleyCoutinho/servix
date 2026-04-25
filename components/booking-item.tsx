"use client";

import { BookingWithRelations } from "@/data/bookings";
import { getBookingStatus } from "@/lib/booking-status";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import BookingInfoSheet from "./booking-info-sheet";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Card } from "./ui/card";
import { Sheet, SheetTrigger } from "./ui/sheet";

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle2,
    className: "bg-primary/10 text-primary border-primary/20",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  finished: {
    label: "Finalizado",
    icon: Clock,
    className: "bg-muted text-muted-foreground border-border",
  },
} as const;

// ─── Props ─────────────────────────────────────────────────────────────────────
interface BookingItemProps {
  booking: BookingWithRelations;
}

// ─── Component ─────────────────────────────────────────────────────────────────
const BookingItem = ({ booking }: BookingItemProps) => {
  const [sheetIsOpen, setSheetIsOpen] = useState(false);

  const status = getBookingStatus(booking.date, booking.cancelledAt);
  const {
    label,
    icon: StatusIcon,
    className: statusClassName,
  } = STATUS_CONFIG[status];

  return (
    <Sheet open={sheetIsOpen} onOpenChange={setSheetIsOpen}>
      <SheetTrigger asChild>
        <Card
          className={[
            // layout
            "flex h-full w-full min-w-full cursor-pointer flex-row items-center justify-between overflow-hidden p-0 snap-start",
            // FIX: touch-manipulation remove delay 300ms de tap no iOS Safari
            // sem isso o usuário sente o card "demorar" para reagir ao toque
            "touch-manipulation",
            // feedback visual ao toque — active state nativo iOS
            "transition-all hover:shadow-md active:scale-[0.98] active:shadow-none",
          ].join(" ")}
        >
          {/* ── Info principal ── */}
          <div className="flex flex-1 flex-col gap-3 p-4">
            {/* Badge de status */}
            <div
              className={cn(
                "flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                statusClassName,
              )}
            >
              <StatusIcon size={11} />
              {label}
            </div>

            {/* Serviço e barbearia */}
            <div className="flex flex-col gap-1.5">
              <p className="font-semibold leading-tight">
                {booking.service.name}
              </p>
              <div className="flex items-center gap-2">
                <Avatar className="size-5 rounded-md">
                  <AvatarImage src={booking.barbershop.imageUrl} />
                </Avatar>
                <p className="text-muted-foreground truncate text-sm">
                  {booking.barbershop.name}
                </p>
              </div>
            </div>
          </div>

          {/* ── Data / hora ──
               w-22 = 88px — espaço suficiente para 2 dígitos + mês abrev.
               border-l separa visualmente sem precisar de bg extra             ── */}
          <div className="flex h-full w-22 shrink-0 flex-col items-center justify-center gap-0.5 border-l bg-muted/50 px-3 py-4 text-center">
            <p className="text-muted-foreground text-xs font-medium capitalize">
              {format(booking.date, "MMM", { locale: ptBR })}
            </p>
            {/* tabular-nums: alinha 01, 10, 31 sem layout shift */}
            <p className="text-3xl font-bold leading-none tabular-nums">
              {format(booking.date, "dd")}
            </p>
            <p className="text-muted-foreground text-xs">
              {format(booking.date, "HH:mm")}
            </p>
          </div>
        </Card>
      </SheetTrigger>

      <BookingInfoSheet
        booking={booking}
        onClose={() => setSheetIsOpen(false)}
      />
    </Sheet>
  );
};

export default BookingItem;
