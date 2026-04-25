"use client";

import { cancelBooking } from "@/actions/cancel-booking";
import CopyButton from "@/app/barbershops/[id]/_components/copy-button";
import { BookingWithRelations } from "@/data/bookings";
import { getBookingStatus } from "@/lib/booking-status";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Smartphone,
  XCircle,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { toast } from "sonner";
import BookingSummary from "./booking-summary";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { SheetContent, SheetTitle } from "./ui/sheet";

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
interface BookingInfoSheetProps {
  booking: BookingWithRelations;
  onClose: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────
const BookingInfoSheet = ({ booking, onClose }: BookingInfoSheetProps) => {
  const status = getBookingStatus(booking.date, booking.cancelledAt);
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;

  const encodedAddress = encodeURIComponent(booking.barbershop.address);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  const wazeUrl = `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;

  const { executeAsync: executeCancelBooking, isPending: isCancelling } =
    useAction(cancelBooking);

  const handleCancelBooking = async () => {
    const result = await executeCancelBooking({ bookingId: booking.id });
    if (result?.validationErrors) {
      return toast.error(result.validationErrors._errors?.[0]);
    }
    if (result?.serverError) {
      return toast.error("Erro ao cancelar agendamento. Tente novamente.");
    }
    toast.success("Agendamento cancelado com sucesso!");
    onClose();
  };

  return (
    // FIX: overflow-hidden no SheetContent — o scroll fica isolado no filho
    // will-change-transform evita jank na animação de entrada no iOS Safari
    <SheetContent
      className={[
        "flex flex-col gap-0 p-0 sm:max-w-md",
        "overflow-hidden",
        "will-change-transform",
      ].join(" ")}
    >
      <SheetTitle className="sr-only">Informações da Reserva</SheetTitle>

      {/* ── FIX: cabeçalho shrink-0 FORA do scroll — nunca esconde no iOS ── */}
      <div className="bg-card border-border shrink-0 border-b px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
            <Image
              src={booking.barbershop.imageUrl}
              alt={booking.barbershop.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-xs">Reserva</p>
            <p className="text-foreground truncate text-sm font-bold">
              {booking.barbershop.name}
            </p>
            <p className="text-primary text-xs font-medium">
              {booking.service.name}
            </p>
          </div>
          {/* Badge de status */}
          <div
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
              statusConfig.className,
            )}
          >
            <StatusIcon size={12} />
            {statusConfig.label}
          </div>
        </div>
      </div>

      {/* ── FIX: área scrollável isolada — momentum scroll nativo iOS ── */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* ── Mapa / localização ── */}
        <div className="border-border border-b px-5 py-5">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir ${booking.barbershop.name} no Google Maps`}
            className="group relative block h-36 w-full overflow-hidden rounded-xl"
          >
            <Image
              src="/map.png"
              alt="Mapa"
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 rounded-xl bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
            <div className="bg-card/95 absolute right-3 bottom-3 left-3 flex items-center gap-3 rounded-xl px-3 py-2.5 shadow-sm backdrop-blur-sm">
              <Avatar className="size-9 shrink-0 rounded-lg">
                <AvatarImage
                  src={booking.barbershop.imageUrl}
                  className="rounded-lg object-cover"
                />
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">
                  {booking.barbershop.name}
                </p>
                <div className="mt-0.5 flex items-center gap-1">
                  <MapPin
                    size={10}
                    className="text-muted-foreground shrink-0"
                  />
                  <p className="text-muted-foreground truncate text-[10px]">
                    {booking.barbershop.address}
                  </p>
                </div>
              </div>
              <Navigation size={13} className="text-primary shrink-0" />
            </div>
          </a>

          {/* Botões de navegação — h-11 = 44pt HIG Apple */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              // touch-manipulation remove delay 300ms no tap iOS
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-all touch-manipulation hover:border-primary/40 hover:bg-muted active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden>
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                  fill="#4285F4"
                />
              </svg>
              Google Maps
            </a>
            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-all touch-manipulation hover:border-primary/40 hover:bg-muted active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden>
                <path
                  d="M20.54 6.63C19.68 3.04 16.39 1 12.06 1 6.96 1 3 4.18 3 9.26c0 2.54 1.3 4.78 2.56 6.41.63.82.93 1.83.85 2.85l-.13 1.65c-.06.73.54 1.36 1.27 1.36h8.92c.67 0 1.23-.5 1.28-1.17l.13-1.66c.09-1.17.61-2.28 1.47-3.1 1.63-1.56 2.52-3.62 2.19-8.97zM9 13c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm6 0c-.83 0-1.5-.67-1.5-1.5S14.17 10 15 10s1.5.67 1.5 1.5S15.83 13 15 13zm-7.5 6h9l-.23 2.28c-.08.73-.68 1.28-1.41 1.28h-5.72c-.73 0-1.33-.55-1.41-1.28L7.5 19z"
                  fill="#33CCFF"
                />
              </svg>
              Waze
            </a>
          </div>
        </div>

        {/* ── Resumo do agendamento ── */}
        <div className="border-border border-b px-5 py-5">
          <BookingSummary
            serviceName={booking.service.name}
            servicePrice={booking.service.priceInCents}
            barbershopName={booking.barbershop.name}
            date={booking.date}
            professionalName={
              booking.professional?.displayName ??
              booking.professional?.user?.name
            }
            clientName={booking.clientName}
          />
        </div>

        {/* ── Contatos ── */}
        {booking.barbershop.phones.length > 0 && (
          <div className="border-border border-b px-5 py-5">
            <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
              Contato
            </p>
            <div className="flex flex-col gap-2.5">
              {booking.barbershop.phones.map((phone, index) => (
                <div
                  key={`${phone}-${index}`}
                  className="border-border bg-muted/40 flex items-center justify-between rounded-xl border px-4 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone size={15} className="text-muted-foreground" />
                    <p className="text-sm font-medium">{phone}</p>
                  </div>
                  <CopyButton text={phone} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Aviso de cancelamento ── */}
        {status === "confirmed" && (
          <div className="px-5 py-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
              <AlertTriangle
                size={14}
                className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
              />
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                Cancelamentos devem ser feitos com no mínimo 1 hora de
                antecedência. Para pagamentos realizados via cartão, o estorno
                será solicitado e seguirá os prazos da operadora. Após esse
                prazo, ou em caso de não comparecimento, o valor não será
                devolvido.
              </p>
            </div>
          </div>
        )}

        {/* espaço extra para o footer não cobrir conteúdo no fim do scroll */}
        <div className="h-4" />
      </div>

      {/* ── FIX: footer shrink-0 FORA do scroll + safe-area-inset-bottom ──
           Nunca cortado pelo home indicator em nenhum iPhone              ── */}
      <div
        className="bg-card border-border shrink-0 flex gap-3 border-t px-5 pt-4"
        style={{
          paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
        }}
      >
        <Button
          variant="outline"
          // h-11 = 44pt mínimo HIG Apple
          className="h-11 flex-1 rounded-xl touch-manipulation"
          onClick={onClose}
        >
          Voltar
        </Button>

        {status === "confirmed" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="h-11 flex-1 rounded-xl touch-manipulation"
              >
                Cancelar Reserva
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar Reserva</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja cancelar esta reserva? Esta ação não
                  pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Não, manter</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelBooking}
                  disabled={isCancelling}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isCancelling ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Sim, cancelar"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </SheetContent>
  );
};

export default BookingInfoSheet;
