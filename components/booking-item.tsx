"use client";

import { useState } from "react";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Sheet, SheetTrigger } from "./ui/sheet";
import { BookingWithRelations } from "@/data/bookings";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getBookingStatus } from "@/lib/booking-status";
import BookingInfoSheet from "./booking-info-sheet";

interface BookingItemProps {
  booking: BookingWithRelations;
}

const BookingItem = ({ booking }: BookingItemProps) => {
  const [sheetIsOpen, setSheetIsOpen] = useState(false);
  const status = getBookingStatus(booking.date, booking.cancelledAt);

  return (
    <Sheet open={sheetIsOpen} onOpenChange={setSheetIsOpen}>
      <SheetTrigger asChild>
        <Card className="flex h-full w-full min-w-full cursor-pointer flex-row items-center justify-between overflow-hidden p-0 transition-shadow hover:shadow-md snap-start">
          <div className="flex flex-1 flex-col gap-3 p-4">
            {status === "cancelled" ? (
              <Badge variant="destructive" className="w-fit">CANCELADO</Badge>
            ) : status === "confirmed" ? (
              <Badge className="w-fit">CONFIRMADO</Badge>
            ) : (
              <Badge variant="secondary" className="w-fit">FINALIZADO</Badge>
            )}
            <div className="flex flex-col gap-1.5">
              <p className="font-semibold leading-tight">{booking.service.name}</p>
              <div className="flex items-center gap-2">
                <Avatar className="size-5 rounded-md">
                  <AvatarImage src={booking.barbershop.imageUrl} />
                </Avatar>
                <p className="text-sm text-muted-foreground">
                  {booking.barbershop.name}
                </p>
              </div>
            </div>
          </div>

          <div className="flex h-full w-[5.5rem] shrink-0 flex-col items-center justify-center gap-0.5 border-l bg-muted/50 px-3 py-4 text-center">
            <p className="text-xs font-medium capitalize text-muted-foreground">
              {format(booking.date, "MMM", { locale: ptBR })}
            </p>
            <p className="text-3xl font-bold leading-none tabular-nums">
              {format(booking.date, "dd")}
            </p>
            <p className="text-xs text-muted-foreground">
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
