import BookingItem from "@/components/booking-item";
import Footer from "@/components/footer";
import ServiceItem from "@/components/service-item";
import { StoreBoundHeader } from "@/components/store-bound-header";
import {
  PageContainer,
  PageSectionContent,
  PageSectionScroller,
  PageSectionTitle,
} from "@/components/ui/page";
import { getBarbershopBySlug } from "@/data/barbershops";
import { getUserBookings } from "@/data/bookings";
import { MapPin, Phone, Star } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

interface StoreHomePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Rota: /b/[slug]
 *
 * Mini-home isolada da loja. O usuário que entrou pelo link de divulgação
 * (ex: https://servix.app.br/b/barbearia-familia-do-corte) permanece sempre
 * dentro do contexto desta loja — o header não tem link de volta para a home global.
 *
 * Suporta slug ou UUID: basta garantir que getBarbershopBySlug aceite ambos.
 */
export default async function StoreHomePage({ params }: StoreHomePageProps) {
  const { slug } = await params;

  // getUserBookings já usa a sessão internamente — filtramos por barbershopId abaixo
  const [barbershop, { confirmedBookings, finishedBookings }] =
    await Promise.all([getBarbershopBySlug(slug), getUserBookings()]);

  if (!barbershop) {
    notFound();
  }

  // Mantém apenas agendamentos desta loja para o contexto do usuário
  const storeConfirmedBookings = confirmedBookings.filter(
    (b) => b.barbershopId === barbershop.id,
  );
  const storeFinishedBookings = finishedBookings?.filter(
    (b) => b.barbershopId === barbershop.id,
  );

  const hasConfirmed = storeConfirmedBookings.length > 0;
  const hasFinished = (storeFinishedBookings?.length ?? 0) > 0;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header sem link para a home global */}
      <StoreBoundHeader
        storeSlug={slug}
        storeName={barbershop.name}
        storeLogoUrl={barbershop.imageUrl}
      />

      {/* Hero da loja */}
      <div className="relative h-56 w-full sm:h-80">
        <Image
          src={barbershop.imageUrl}
          alt={barbershop.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-2xl font-bold text-white">{barbershop.name}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1.5 text-sm text-white/80">
              <MapPin className="size-3.5 shrink-0" />
              {barbershop.address}
            </span>

            {barbershop.phones.length > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-white/80">
                <Phone className="size-3.5 shrink-0" />
                {barbershop.phones[0]}
                {barbershop.phones.length > 1 &&
                  ` | ${barbershop.phones.slice(1).join(" | ")}`}
              </span>
            )}
          </div>

          {/* Rating badge (se existir no seu schema) */}
          {"rating" in barbershop && typeof barbershop.rating === "number" && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 backdrop-blur-sm">
              <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium text-white">
                {(barbershop.rating as number).toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      <PageContainer>
        {/* Sobre nós */}
        {barbershop.description && (
          <PageSectionContent>
            <PageSectionTitle>Sobre nós</PageSectionTitle>
            <p className="text-sm text-muted-foreground">
              {barbershop.description}
            </p>
          </PageSectionContent>
        )}

        {/* Agendamentos confirmados DESTA loja */}
        {hasConfirmed && (
          <div id="agendamentos">
            <PageSectionContent>
              <PageSectionTitle>Seus agendamentos</PageSectionTitle>
              <PageSectionScroller>
                {storeConfirmedBookings.map((booking) => (
                  <BookingItem key={booking.id} booking={booking} />
                ))}
              </PageSectionScroller>
            </PageSectionContent>
          </div>
        )}

        {/* Histórico de agendamentos desta loja */}
        {hasFinished && (
          <PageSectionContent>
            <PageSectionTitle>Histórico</PageSectionTitle>
            <PageSectionScroller>
              {storeFinishedBookings!.map((booking) => (
                <BookingItem key={booking.id} booking={booking} />
              ))}
            </PageSectionScroller>
          </PageSectionContent>
        )}

        {/* Serviços */}
        <PageSectionContent>
          <PageSectionTitle>Serviços</PageSectionTitle>
          {barbershop.services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum serviço disponível no momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {barbershop.services.map((service) => (
                <ServiceItem
                  key={service.id}
                  service={service}
                  barbershop={barbershop}
                />
              ))}
            </div>
          )}
        </PageSectionContent>
      </PageContainer>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
