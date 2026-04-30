"use client";

import { createBookingCheckoutSession } from "@/actions/create-booking-checkout-session";
import { createBooking } from "@/actions/create-booking";
import { Barbershop, BarbershopService } from "@/generated/prisma/client";
import { useGetBarbershopProfessionals } from "@/hooks/data/use-get-barbershop-professionals";
import { useGetDateAvailableTimeSlots } from "@/hooks/data/use-get-date-availabe-time-slots";
import { authClient } from "@/lib/auth-client";
import { formatCurrency } from "@/lib/utils";
import { loadStripe } from "@stripe/stripe-js";
import {
  AlertTriangle,
  Check,
  CreditCard,
  HandCoins,
  Info,
  Loader2,
  LogIn,
  User,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { MutableRefObject, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "./ui/alert";
import BookingSummary from "./booking-summary";
import LoginModal from "./login-modal";
import { MiniCalendar } from "./mini-calendar";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "./ui/sheet";

// ─── Step Badge ────────────────────────────────────────────────────────────────
function StepBadge({
  n,
  done,
  active,
}: {
  n: number;
  done: boolean;
  active: boolean;
}) {
  return (
    <div
      className={[
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
        done
          ? "bg-primary text-primary-foreground"
          : active
            ? "bg-primary/15 text-primary ring-1 ring-primary/40"
            : "bg-muted text-muted-foreground",
      ].join(" ")}
    >
      {done ? <Check size={12} /> : n}
    </div>
  );
}

// ─── Section Wrapper ───────────────────────────────────────────────────────────
function Section({
  step,
  label,
  done,
  active,
  children,
  locked,
}: {
  step: number;
  label: string;
  done: boolean;
  active: boolean;
  children: React.ReactNode;
  locked?: boolean;
}) {
  if (locked) {
    return (
      <div className="border-border border-b">
        <div className="flex items-center gap-2.5 px-5 py-4 opacity-35">
          <StepBadge n={step} done={done} active={active} />
          <span className="text-sm font-semibold text-muted-foreground">
            {label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border border-b transition-all duration-300">
      <div className="flex items-center gap-2.5 px-5 pb-3 pt-5">
        <StepBadge n={step} done={done} active={active} />
        <span
          className={[
            "text-sm font-semibold transition-colors",
            active || done ? "text-foreground" : "text-muted-foreground",
          ].join(" ")}
        >
          {label}
        </span>
      </div>
      <div className="pb-5">{children}</div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
interface ServiceItemProps {
  service: BarbershopService;
  barbershop: Barbershop;
  isOwner?: boolean;
  isProfessional?: boolean;
}

const ServiceItem = ({
  service,
  barbershop,
  isOwner = false,
  isProfessional = false,
}: ServiceItemProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const refProfessionalId = searchParams.get("ref");

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedProfessional, setSelectedProfessional] = useState<
    string | undefined
  >(undefined);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "online" | "pay_after_service" | undefined
  >(undefined);
  const [clientName, setClientName] = useState("");
  const [sheetIsOpen, setSheetIsOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const profSectionRef = useRef<HTMLDivElement | null>(null);
  const timeSectionRef = useRef<HTMLDivElement | null>(null);
  const paySectionRef = useRef<HTMLDivElement | null>(null);
  const clientNameSectionRef = useRef<HTMLDivElement | null>(null);
  // ── FIX 2: referência ao container scrollável para scrollTo correto no iOS ──
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const { data: session } = authClient.useSession();

  const {
    executeAsync: executeCheckoutBooking,
    isPending: isCreatingCheckout,
  } = useAction(createBookingCheckoutSession);
  const { executeAsync: executeDirectBooking, isPending: isCreatingDirect } =
    useAction(createBooking);

  const isCreatingBooking = isCreatingCheckout || isCreatingDirect;

  const { data: professionals, isLoading: isLoadingProfessionals } =
    useGetBarbershopProfessionals(barbershop.id);

  const { data: availableTimeSlots, isLoading: isLoadingSlots } =
    useGetDateAvailableTimeSlots({
      barbershopId: barbershop.id,
      professionalId: selectedProfessional,
      date: selectedDate,
      serviceId: service.id,
    });

  const selectedProfessionalData = professionals?.data?.find(
    (p) => p.id === selectedProfessional,
  );

  const hasStripePayment =
    selectedProfessionalData?.acceptsCard ||
    selectedProfessionalData?.acceptsPix;
  const hasPayAfterService = selectedProfessionalData?.acceptsPayAfterService;

  const slots = availableTimeSlots?.data?.slots;
  const slotMsg = availableTimeSlots?.data?.message;

  // ── FIX 2: scroll no container pai em vez de scrollIntoView no iOS ──
  const scrollTo = (ref: MutableRefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
      } else {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedProfessional(undefined);
    setSelectedTime(undefined);
    setSelectedPaymentMethod(undefined);
    setClientName("");
    if (date) scrollTo(profSectionRef);
  };

  const handleProfessionalSelect = (professionalId: string) => {
    setSelectedProfessional(professionalId);
    setSelectedTime(undefined);
    setSelectedPaymentMethod(undefined);
    setClientName("");
    scrollTo(timeSectionRef);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setSelectedPaymentMethod(undefined);
    setClientName("");
    if (isOwner || isProfessional) {
      scrollTo(clientNameSectionRef);
    } else if (hasPayAfterService) {
      scrollTo(paySectionRef);
    }
  };

  const handlePaymentMethodSelect = (
    method: "online" | "pay_after_service",
  ) => {
    setSelectedPaymentMethod(method);
  };

  const reset = () => {
    setSelectedDate(undefined);
    setSelectedProfessional(undefined);
    setSelectedTime(undefined);
    setSelectedPaymentMethod(undefined);
    setClientName("");
  };

  const getFirstError = (
    errors: Record<string, { _errors?: string[] } | string[] | undefined> & {
      _errors?: string[];
    },
  ) =>
    errors._errors?.[0] ||
    Object.values(errors).find(
      (v): v is { _errors: string[] } =>
        v != null &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        Array.isArray((v as { _errors?: unknown })._errors),
    )?._errors?.[0];

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedProfessional) return;

    const [h, m] = selectedTime.split(":").map(Number);
    const date = new Date(selectedDate);
    date.setHours(h, m, 0, 0);

    if (isOwner || isProfessional) {
      if (clientName.trim().length < 2) {
        return toast.error("Digite o nome do cliente.");
      }
      const result = await executeDirectBooking({
        date,
        serviceId: service.id,
        professionalId: selectedProfessional,
        payAfterService: true,
        clientName: clientName.trim(),
      });
      if (!result || result.serverError)
        return toast.error("Erro ao criar agendamento. Tente novamente.");
      if (result.validationErrors)
        return toast.error(
          getFirstError(result.validationErrors) ||
            "Erro ao criar agendamento.",
        );
      toast.success("Agendamento confirmado! 🎉");
      setSheetIsOpen(false);
      reset();
      router.push("/bookings?success=true");
      return;
    }

    const effectivePaymentMethod =
      hasPayAfterService && !hasStripePayment
        ? "pay_after_service"
        : selectedPaymentMethod;

    if (!effectivePaymentMethod && hasPayAfterService && hasStripePayment) {
      return toast.error("Selecione uma forma de pagamento.");
    }

    if (effectivePaymentMethod === "pay_after_service") {
      const result = await executeDirectBooking({
        date,
        serviceId: service.id,
        professionalId: selectedProfessional,
        payAfterService: true,
      });
      if (!result || result.serverError)
        return toast.error("Erro ao criar agendamento. Tente novamente.");
      if (result.validationErrors)
        return toast.error(
          getFirstError(result.validationErrors) ||
            "Erro ao criar agendamento.",
        );
      toast.success("Agendamento confirmado! 🎉");
      setSheetIsOpen(false);
      reset();
      router.push("/bookings?success=true");
      return;
    }

    const result = await executeCheckoutBooking({
      date,
      serviceId: service.id,
      professionalId: selectedProfessional,
    });
    if (!result || result.serverError)
      return toast.error("Erro ao criar agendamento. Tente novamente.");
    if (result.validationErrors)
      return toast.error(
        getFirstError(result.validationErrors) || "Erro ao criar agendamento.",
      );

    const checkoutSession = result.data;
    if (!checkoutSession)
      return toast.error("Erro ao criar agendamento. Tente novamente.");
    if (checkoutSession.pixFallback)
      toast.info("PIX indisponível. Pagamento será por cartão.");
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
      return toast.error("Erro ao criar agendamento. Tente novamente.");

    const stripe = await loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    );
    if (!stripe)
      return toast.error("Erro ao criar agendamento. Tente novamente.");

    await stripe.redirectToCheckout({ sessionId: checkoutSession.id });
    setSheetIsOpen(false);
    reset();
  };

  const step1Done = !!selectedDate;
  const step2Done = !!selectedProfessional;
  const step3Done = !!selectedTime;
  const step4Done =
    !hasPayAfterService ||
    !!selectedPaymentMethod ||
    (!hasStripePayment && !!hasPayAfterService);
  const stepOwnerDone = clientName.trim().length >= 2;

  const canConfirm =
    isOwner || isProfessional
      ? step1Done && step2Done && step3Done && stepOwnerDone
      : step1Done &&
        step2Done &&
        step3Done &&
        (!hasPayAfterService || !hasStripePayment || !!selectedPaymentMethod);

  // ── FIX 1: progress bar não mostra 4º segmento já preenchido quando
  //    o profissional não tem pagamento online (hasPayAfterService only) ──
  const progressSegments =
    isOwner || isProfessional
      ? [step1Done, step2Done, step3Done, stepOwnerDone]
      : hasPayAfterService
        ? [step1Done, step2Done, step3Done, step4Done]
        : [step1Done, step2Done, step3Done];

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "short",
    }).format(d);

  return (
    <div className="border-border bg-card flex gap-3 rounded-2xl border p-3 transition-shadow hover:shadow-sm">
      <div className="relative h-27.5 w-27.5 shrink-0">
        <Image
          src={service.imageUrl}
          alt={service.name}
          fill
          className="rounded-xl object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold">{service.name}</p>
          <p className="text-muted-foreground text-sm">{service.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">
            {formatCurrency(service.priceInCents)}
          </p>

          <Sheet
            open={sheetIsOpen}
            onOpenChange={(open) => {
              setSheetIsOpen(open);
              if (!open) reset();
            }}
          >
            <SheetTrigger asChild>
              <Button className="h-11 rounded-full px-5 text-sm" size="default">
                Agendar
              </Button>
            </SheetTrigger>

            <SheetContent
              className={[
                "flex flex-col gap-0 p-0 sm:max-w-md",
                "overflow-hidden",
                "will-change-transform",
              ].join(" ")}
            >
              <SheetTitle className="sr-only">Fazer Reserva</SheetTitle>

              {/* ── Cabeçalho sticky ── */}
              <div className="bg-card border-border shrink-0 border-b px-5 py-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                    <Image
                      src={service.imageUrl}
                      alt={service.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground text-xs">
                      {barbershop.name}
                    </p>
                    <p className="text-foreground truncate text-sm font-bold">
                      {service.name}
                    </p>
                    <p className="text-primary text-sm font-semibold">
                      {formatCurrency(service.priceInCents)}
                    </p>
                  </div>
                </div>

                {/* Barra de progresso — FIX 1 aplicado */}
                <div className="mt-4 flex gap-1.5">
                  {progressSegments.map((done, i) => (
                    <div
                      key={i}
                      className={[
                        "h-1 flex-1 rounded-full transition-all duration-500",
                        done ? "bg-primary" : "bg-muted",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </div>

              {!session?.user ? (
                /* ── Não logado ── */
                <div className="flex flex-col items-center justify-center gap-4 px-5 py-16 text-center">
                  <div className="bg-muted rounded-2xl p-5">
                    <LogIn className="text-muted-foreground size-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">Entre para reservar</h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      Crie sua conta grátis e agende em segundos.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setSheetIsOpen(false);
                      setLoginModalOpen(true);
                    }}
                    className="h-11 w-full rounded-xl"
                  >
                    <LogIn className="mr-2 size-4" /> Fazer Login
                  </Button>
                </div>
              ) : (
                /* ── Logado ── */
                <div className="flex min-h-0 flex-1 flex-col">
                  {/* ── FIX 2: ref no container + data-scroll para scrollTo correto ── */}
                  <div
                    ref={scrollContainerRef}
                    data-scroll
                    className="flex-1 overflow-y-auto overscroll-contain"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    {/* ══ PASSO 1 — Data ══ */}
                    <Section
                      step={1}
                      label="Escolha a data"
                      done={step1Done}
                      active={!step1Done}
                    >
                      <div className="px-5">
                        <MiniCalendar
                          selected={selectedDate}
                          onSelect={handleDateSelect}
                        />
                        {selectedDate && (
                          <div className="bg-primary/8 mt-3 flex items-center gap-2 rounded-xl px-3 py-2">
                            <Check
                              size={14}
                              className="text-primary shrink-0"
                            />
                            <span className="text-primary text-xs font-medium capitalize">
                              {formatDate(selectedDate)}
                            </span>
                          </div>
                        )}
                      </div>
                    </Section>

                    {/* ══ PASSO 2 — Profissional ══ */}
                    <div ref={profSectionRef}>
                      <Section
                        step={2}
                        label="Escolha o profissional"
                        done={step2Done}
                        active={step1Done && !step2Done}
                        locked={!step1Done}
                      >
                        <div className="px-5">
                          {isLoadingProfessionals ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="text-muted-foreground size-5 animate-spin" />
                            </div>
                          ) : professionals?.data &&
                            professionals.data.length > 0 ? (
                            <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                              {professionals.data.map((professional) => {
                                const isSel =
                                  selectedProfessional === professional.id;
                                return (
                                  <button
                                    key={professional.id}
                                    type="button"
                                    onClick={() =>
                                      handleProfessionalSelect(professional.id)
                                    }
                                    className={[
                                      "flex h-11 shrink-0 items-center gap-2.5 rounded-xl border px-3 transition-all duration-200",
                                      isSel
                                        ? "border-primary bg-primary/8 shadow-sm"
                                        : "border-border bg-background",
                                    ].join(" ")}
                                  >
                                    <Avatar className="size-7">
                                      <AvatarImage
                                        src={
                                          professional.user.image ?? undefined
                                        }
                                      />
                                      <AvatarFallback className="text-xs">
                                        <User size={12} />
                                      </AvatarFallback>
                                    </Avatar>
                                    <span
                                      className={[
                                        "text-sm font-medium",
                                        isSel
                                          ? "text-primary"
                                          : "text-foreground",
                                      ].join(" ")}
                                    >
                                      {professional.displayName ??
                                        professional.user.name}
                                    </span>
                                    {isSel && (
                                      <Check
                                        size={13}
                                        className="text-primary ml-0.5"
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-muted-foreground py-3 text-sm">
                              Nenhum profissional disponível
                            </p>
                          )}

                          {refProfessionalId &&
                            selectedProfessional &&
                            selectedProfessional !== refProfessionalId && (
                              <Alert className="mt-3 border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 [&>svg]:text-amber-600">
                                <AlertTriangle className="size-4" />
                                <AlertDescription className="text-xs leading-relaxed">
                                  Agende com o profissional do seu grupo para
                                  acompanhar pelo WhatsApp.
                                </AlertDescription>
                              </Alert>
                            )}
                        </div>
                      </Section>
                    </div>

                    {/* ══ PASSO 3 — Horário ══ */}
                    <div ref={timeSectionRef}>
                      <Section
                        step={3}
                        label="Escolha o horário"
                        done={step3Done}
                        active={step2Done && !step3Done}
                        locked={!step2Done}
                      >
                        <div className="px-5">
                          {isLoadingSlots ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="text-muted-foreground size-5 animate-spin" />
                            </div>
                          ) : slots && slots.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                              {slots.map((time) => {
                                const isSel = selectedTime === time;
                                return (
                                  <button
                                    key={time}
                                    type="button"
                                    onClick={() => handleTimeSelect(time)}
                                    className={[
                                      "h-11 rounded-xl border text-xs font-semibold transition-all duration-150",
                                      isSel
                                        ? "border-primary bg-primary text-primary-foreground scale-105 shadow-sm"
                                        : "border-border bg-background text-foreground",
                                    ].join(" ")}
                                  >
                                    {time}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="bg-muted rounded-xl px-4 py-5 text-center">
                              <p className="text-muted-foreground text-sm">
                                {slotMsg ??
                                  "Nenhum horário disponível nesta data"}
                              </p>
                              {step2Done && (
                                <button
                                  type="button"
                                  onClick={() => scrollTo(profSectionRef)}
                                  className="text-primary mt-2 text-xs font-medium underline-offset-2 hover:underline"
                                >
                                  Tentar outro profissional
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </Section>
                    </div>

                    {/* ══ PASSO 4 — Pagamento ══ */}
                    {!isOwner && !isProfessional && hasPayAfterService && (
                      <div ref={paySectionRef}>
                        <Section
                          step={4}
                          label="Como vai pagar?"
                          done={step4Done}
                          active={step3Done && !step4Done}
                          locked={!step3Done}
                        >
                          <div className="flex flex-col gap-2 px-5">
                            {hasStripePayment && (
                              <button
                                type="button"
                                onClick={() =>
                                  handlePaymentMethodSelect("online")
                                }
                                className={[
                                  "flex h-auto min-h-15 items-center gap-3 rounded-xl border p-4 text-left transition-all duration-150",
                                  selectedPaymentMethod === "online"
                                    ? "border-primary bg-primary/8"
                                    : "border-border",
                                ].join(" ")}
                              >
                                <div
                                  className={[
                                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                    selectedPaymentMethod === "online"
                                      ? "bg-primary/15"
                                      : "bg-muted",
                                  ].join(" ")}
                                >
                                  <CreditCard
                                    size={16}
                                    className={
                                      selectedPaymentMethod === "online"
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                    }
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold">
                                    Pagamento Online
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    Realize pagamentos no cartão com rapidez e
                                    total segurança.
                                  </p>
                                </div>
                                {selectedPaymentMethod === "online" && (
                                  <Check
                                    size={16}
                                    className="text-primary shrink-0"
                                  />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handlePaymentMethodSelect("pay_after_service")
                              }
                              className={[
                                "flex h-auto min-h-15 items-center gap-3 rounded-xl border p-4 text-left transition-all duration-150",
                                selectedPaymentMethod === "pay_after_service" ||
                                !hasStripePayment
                                  ? "border-primary bg-primary/8"
                                  : "border-border",
                              ].join(" ")}
                            >
                              <div
                                className={[
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                  selectedPaymentMethod ===
                                    "pay_after_service" || !hasStripePayment
                                    ? "bg-primary/15"
                                    : "bg-muted",
                                ].join(" ")}
                              >
                                <HandCoins
                                  size={16}
                                  className={
                                    selectedPaymentMethod ===
                                      "pay_after_service" || !hasStripePayment
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  }
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold">
                                  Pagamento no Local
                                </p>
                                <p className="text-muted-foreground text-xs">
                                  Pague presencialmente via dinheiro, PIX ou
                                  cartão.
                                </p>
                              </div>
                              {(selectedPaymentMethod === "pay_after_service" ||
                                !hasStripePayment) && (
                                <Check
                                  size={16}
                                  className="text-primary shrink-0"
                                />
                              )}
                            </button>

                            {(selectedPaymentMethod === "pay_after_service" ||
                              (!hasStripePayment && hasPayAfterService)) && (
                              <Alert className="mt-1 border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400 [&>svg]:text-blue-600">
                                <Info className="size-4" />
                                <AlertDescription className="text-xs leading-relaxed">
                                  Pagamento via PIX, dinheiro ou maquininha após
                                  o serviço.
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </Section>
                      </div>
                    )}

                    {/* ══ PASSO 4 — Nome do cliente (owner) ══ */}
                    {(isOwner || isProfessional) && (
                      <div ref={clientNameSectionRef}>
                        <Section
                          step={4}
                          label="Nome do cliente"
                          done={stepOwnerDone}
                          active={step3Done && !stepOwnerDone}
                          locked={!step3Done}
                        >
                          <div className="flex flex-col gap-2 px-5">
                            <div className="relative">
                              <User
                                size={14}
                                className="text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"
                              />
                              <input
                                type="text"
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Nome do cliente"
                                maxLength={100}
                                className="border-border bg-background placeholder:text-muted-foreground focus:border-primary focus:ring-primary/40 h-11 w-full rounded-xl border py-2.5 pl-9 pr-3 text-base transition-all focus:outline-none focus:ring-1"
                              />
                            </div>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                              O agendamento será registrado com esse nome.
                            </p>
                          </div>
                        </Section>
                      </div>
                    )}

                    {/* ══ Resumo ══ */}
                    {step1Done && step2Done && step3Done && (
                      <div className="px-5 py-5">
                        <BookingSummary
                          serviceName={service.name}
                          servicePrice={service.priceInCents}
                          barbershopName={barbershop.name}
                          professionalName={
                            selectedProfessionalData?.displayName ??
                            selectedProfessionalData?.user.name ??
                            undefined
                          }
                          date={selectedDate!}
                          time={selectedTime!}
                        />
                      </div>
                    )}

                    <div className="h-4" />
                  </div>

                  {/* ══ Botão confirmar — fora do scroll ══ */}
                  <div
                    className="border-border bg-card shrink-0 border-t px-5 pt-4"
                    style={{
                      paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
                    }}
                  >
                    {!step1Done && (
                      <p className="text-muted-foreground mb-2 text-center text-xs">
                        👆 Selecione uma data para começar
                      </p>
                    )}
                    <Button
                      className="h-11 w-full rounded-xl text-sm font-semibold"
                      disabled={!canConfirm || isCreatingBooking}
                      onClick={handleConfirmBooking}
                    >
                      {isCreatingBooking ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : canConfirm ? (
                        `Confirmar · ${formatCurrency(service.priceInCents)}`
                      ) : (
                        "Complete os passos acima"
                      )}
                    </Button>
                  </div>
                </div>
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
