"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { formatCurrency } from "@/lib/utils";
import { BarbershopService, Barbershop } from "@/generated/prisma/client";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Calendar } from "./ui/calendar";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useGetDateAvailableTimeSlots } from "@/hooks/data/use-get-date-availabe-time-slots";
import BookingSummary from "./booking-summary";
import { createBookingCheckoutSession } from "@/actions/create-booking-checkout-session";
import { loadStripe } from "@stripe/stripe-js";

interface ServiceItemProps {
  service: BarbershopService;
  barbershop: Barbershop;
}

const ServiceItem = ({ service, barbershop }: ServiceItemProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  );
  const [sheetIsOpen, setSheetIsOpen] = useState(false);
  const { executeAsync: executeCreateBooking, isPending: isCreatingBooking } =
    useAction(createBookingCheckoutSession);
  const { data: availableTimeSlots } = useGetDateAvailableTimeSlots({
    barbershopId: barbershop.id,
    date: selectedDate,
  });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(undefined);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime) {
      return;
    }
    const splittedTime = selectedTime.split(":");
    const hours = Number(splittedTime[0]);
    const minutes = Number(splittedTime[1]);
    const date = new Date(selectedDate);
    date.setHours(hours, minutes);
    const result = await executeCreateBooking({
      date,
      serviceId: service.id,
    });
    if (result.validationErrors) {
      return toast.error(result.validationErrors._errors?.[0]);
    }
    if (result.serverError) {
      return toast.error(
        "Erro ao criar agendamento. Por favor, tente novamente.",
      );
    }
    const checkoutSession = result.data;
    if (!checkoutSession) {
      return toast.error(
        "Erro ao criar agendamento. Por favor, tente novamente.",
      );
    }
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      return toast.error(
        "Erro ao criar agendamento. Por favor, tente novamente.",
      );
    }
    const stripe = await loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    );
    if (!stripe) {
      return toast.error(
        "Erro ao criar agendamento. Por favor, tente novamente.",
      );
    }
    await stripe.redirectToCheckout({
      sessionId: checkoutSession.id,
    });
    setSheetIsOpen(false);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
  };

  return (
    <div className="border-border bg-card flex gap-3 rounded-2xl border p-3">
      {/* Service Image */}
      <div className="relative h-[110px] w-[110px] shrink-0">
        <Image
          src={service.imageUrl}
          alt={service.name}
          fill
          className="rounded-xl object-cover"
        />
      </div>

      {/* Service Info */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold">{service.name}</p>
          <p className="text-muted-foreground text-sm">{service.description}</p>
        </div>

        {/* Price and Booking Button */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">
            {formatCurrency(service.priceInCents)}
          </p>

          <Sheet open={sheetIsOpen} onOpenChange={setSheetIsOpen}>
            <SheetTrigger asChild>
              <Button className="rounded-full" size="sm">
                Reservar
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto px-0 pb-0">
              <SheetHeader className="border-border border-b px-5 py-6">
                <SheetTitle>Fazer Reserva</SheetTitle>
              </SheetHeader>

              <div className="border-border border-b px-5 py-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={ptBR}
                  className="w-full p-0"
                  disabled={{ before: new Date() }}
                  classNames={{
                    cell: "w-full",
                    day: "w-[36px] h-[36px] mx-auto text-sm bg-transparent hover:bg-muted rounded-full data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
                    head_cell:
                      "w-full text-xs font-normal text-muted-foreground capitalize",
                    caption: "capitalize",
                    caption_label: "text-base font-bold",
                    nav: "flex gap-1 absolute right-0 top-0 z-10",
                    nav_button_previous:
                      "w-7 h-7 bg-transparent border border-border rounded-lg hover:opacity-100 hover:bg-transparent",
                    nav_button_next:
                      "w-7 h-7 bg-muted text-muted-foreground rounded-lg hover:opacity-100 hover:bg-muted",
                    month_caption:
                      "flex justify-start pt-1 relative items-center w-full px-0",
                  }}
                />
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="border-border flex gap-3 overflow-x-auto border-b px-5 py-6 [&::-webkit-scrollbar]:hidden">
                  {availableTimeSlots?.data?.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => handleTimeSelect(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              )}

              {/* Booking Summary */}
              {selectedDate && selectedTime && (
                <div className="px-5 py-6">
                  <BookingSummary
                    serviceName={service.name}
                    servicePrice={service.priceInCents}
                    barbershopName={barbershop.name}
                    date={selectedDate}
                    time={selectedTime}
                  />
                </div>
              )}

              <SheetFooter className="px-5 pb-6">
                <Button
                  className="w-full"
                  disabled={!selectedDate || !selectedTime || isCreatingBooking}
                  onClick={handleConfirmBooking}
                >
                  {isCreatingBooking ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Confirmar"
                  )}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default ServiceItem;
