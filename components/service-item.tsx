"use client";

import { createBookingCheckoutSession } from "@/actions/create-booking-checkout-session";
import { Barbershop, BarbershopService } from "@/generated/prisma/client";
import { useGetBarbershopProfessionals } from "@/hooks/data/use-get-barbershop-professionals";
import { useGetDateAvailableTimeSlots } from "@/hooks/data/use-get-date-availabe-time-slots";
import { authClient } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/utils";
import { loadStripe } from "@stripe/stripe-js";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, Loader2, LogIn, User } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "./ui/alert";
import BookingSummary from "./booking-summary";
import LoginModal from "./login-modal";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

interface ServiceItemProps {
  service: BarbershopService;
  barbershop: Barbershop;
}

const ServiceItem = ({ service, barbershop }: ServiceItemProps) => {
  const searchParams = useSearchParams();
  const refProfessionalId = searchParams.get("ref");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedProfessional, setSelectedProfessional] = useState<
    string | undefined
  >(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  );
  const [sheetIsOpen, setSheetIsOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const { executeAsync: executeCreateBooking, isPending: isCreatingBooking } =
    useAction(createBookingCheckoutSession);

  const { data: professionals, isLoading: isLoadingProfessionals } =
    useGetBarbershopProfessionals(barbershop.id);

  const { data: availableTimeSlots, isLoading: isLoadingSlots } =
    useGetDateAvailableTimeSlots({
      barbershopId: barbershop.id,
      professionalId: selectedProfessional,
      date: selectedDate,
    });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedProfessional(undefined);
    setSelectedTime(undefined);
  };

  const handleProfessionalSelect = (professionalId: string) => {
    setSelectedProfessional(professionalId);
    setSelectedTime(undefined);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedProfessional) {
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
      professionalId: selectedProfessional,
    });
    if (!result) {
      return toast.error(
        "Erro ao criar agendamento. Por favor, tente novamente.",
      );
    }
    if (result.validationErrors) {
      const errors = result.validationErrors;
      const firstError =
        errors._errors?.[0] ||
        Object.values(errors).find(
          (v): v is { _errors: string[] } =>
            v != null && typeof v === "object" && "_errors" in v && Array.isArray((v as { _errors?: unknown })._errors),
        )?._errors?.[0];
      return toast.error(
        firstError || "Erro ao criar agendamento. Por favor, tente novamente.",
      );
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
    if (checkoutSession.pixFallback) {
      toast.info("PIX indisponível para este profissional. Pagamento será por cartão.");
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
    setSelectedProfessional(undefined);
    setSelectedTime(undefined);
  };

  const selectedProfessionalData = professionals?.data?.find(
    (p) => p.id === selectedProfessional,
  );

  return (
    <div className="border-border bg-card flex gap-3 rounded-2xl border p-3">
      {/* Service Image */}
      <div className="relative h-27.5 w-27.5 shrink-0">
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

              {!session?.user ? (
                <div className="flex flex-col items-center justify-center gap-4 px-5 py-12">
                  <div className="rounded-full bg-muted p-4">
                    <LogIn className="size-8 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">
                      Faça login para continuar
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Para fazer um agendamento, você precisa estar cadastrado
                      na plataforma. Faça login ou crie sua conta para acessar
                      nossos serviços.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setSheetIsOpen(false);
                      setLoginModalOpen(true);
                    }}
                    className="mt-2 w-full"
                  >
                    <LogIn className="mr-2 size-4" />
                    Fazer Login
                  </Button>
                </div>
              ) : (
                <>
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

                  {/* Professional Selection */}
                  {selectedDate && (
                    <div className="border-border border-b px-5 py-6">
                      <p className="text-muted-foreground mb-3 text-sm font-medium">
                        Selecione o profissional
                      </p>
                      {isLoadingProfessionals ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="size-5 animate-spin" />
                        </div>
                      ) : professionals?.data &&
                        professionals.data.length > 0 ? (
                        <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                          {professionals.data.map((professional) => (
                            <button
                              key={professional.id}
                              type="button"
                              onClick={() =>
                                handleProfessionalSelect(professional.id)
                              }
                              className={`flex min-w-20 flex-col items-center gap-2 rounded-lg border p-3 transition-colors ${
                                selectedProfessional === professional.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:bg-muted"
                              }`}
                            >
                              <Avatar className="size-12">
                                <AvatarImage
                                  src={professional.user.image ?? undefined}
                                  alt={
                                    professional.displayName ??
                                    professional.user.name ??
                                    "Profissional"
                                  }
                                />
                                <AvatarFallback>
                                  <User className="size-5" />
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">
                                {professional.displayName ??
                                  professional.user.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground py-4 text-center text-sm">
                          Nenhum profissional disponível
                        </p>
                      )}
                    </div>
                  )}

                  {/* Warning for different professional */}
                  {refProfessionalId &&
                    selectedProfessional &&
                    selectedProfessional !== refProfessionalId && (
                      <div className="px-5 pt-2">
                        <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 [&>svg]:text-amber-600">
                          <AlertTriangle className="size-4" />
                          <AlertDescription className="text-xs leading-relaxed">
                            Se você não estiver no grupo desse profissional, não
                            vai poder acompanhar a agenda pelo WhatsApp.
                            Recomendamos agendar com o profissional do seu grupo.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                  {/* Time Selection */}
                  {selectedDate && selectedProfessional && (
                    <div className="border-border border-b px-5 py-6">
                      <p className="text-muted-foreground mb-3 text-sm font-medium">
                        Selecione o horário
                      </p>
                      {isLoadingSlots ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="size-5 animate-spin" />
                        </div>
                      ) : availableTimeSlots?.data?.slots &&
                        availableTimeSlots.data.slots.length > 0 ? (
                        <div className="flex gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                          {availableTimeSlots.data.slots.map((time) => (
                            <Button
                              key={time}
                              variant={
                                selectedTime === time ? "default" : "outline"
                              }
                              className="rounded-full"
                              onClick={() => handleTimeSelect(time)}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground py-4 text-center text-sm">
                          {availableTimeSlots?.data?.message ??
                            "Nenhum horário disponível"}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Booking Summary */}
                  {selectedDate && selectedProfessional && selectedTime && (
                    <div className="px-5 py-6">
                      <BookingSummary
                        serviceName={service.name}
                        servicePrice={service.priceInCents}
                        barbershopName={barbershop.name}
                        professionalName={
                          selectedProfessionalData?.displayName ??
                          selectedProfessionalData?.user.name ??
                          undefined
                        }
                        date={selectedDate}
                        time={selectedTime}
                      />
                    </div>
                  )}

                  <SheetFooter className="px-5 pb-6">
                    <Button
                      className="w-full"
                      disabled={
                        !selectedDate ||
                        !selectedProfessional ||
                        !selectedTime ||
                        isCreatingBooking
                      }
                      onClick={handleConfirmBooking}
                    >
                      {isCreatingBooking ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Confirmar"
                      )}
                    </Button>
                  </SheetFooter>
                </>
              )}
            </SheetContent>
          </Sheet>

          <LoginModal open={loginModalOpen} onOpenChange={setLoginModalOpen} />
        </div>
      </div>
    </div>
  );
};

export default ServiceItem;
