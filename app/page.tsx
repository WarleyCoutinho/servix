import BookingItem from "@/components/booking-item";
import Header from "@/components/header";
import banner from "@/public/logo-marca-sem-fundo.png";
import Image from "next/image";
import { Suspense } from "react";

import { AuthErrorAlert } from "@/components/auth-error-alert";
import BarbershopItem from "@/components/barbershop-item";
import Footer from "@/components/footer";
import { LocationFilter } from "@/components/location-filter";
import QuickSearch from "@/components/quick-search";
import {
  PageContainer,
  PageSectionContent,
  PageSectionScroller,
  PageSectionTitle,
} from "@/components/ui/page";
import {
  getAvailableLocations,
  getBarbershops,
  getPopularBarbershops,
} from "@/data/barbershops";
import { getUserBookings } from "@/data/bookings";
import { getServiceCategories } from "@/data/services";

interface HomeProps {
  searchParams: Promise<{ city?: string; state?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const filters = {
    city: params.city,
    state: params.state,
  };

  const [barbershops, popularBarbershops, { confirmedBookings }, categories, locations] =
    await Promise.all([
      getBarbershops(filters),
      getPopularBarbershops(filters),
      getUserBookings(),
      getServiceCategories(),
      getAvailableLocations(),
    ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header categories={categories} />
      <PageContainer>
        <Suspense fallback={null}>
          <AuthErrorAlert />
        </Suspense>
        <QuickSearch categories={categories} />

        <div className="relative overflow-hidden rounded-2xl">
          <Image
            src={banner}
            alt="Agende nos melhores com a Servix"
            sizes="(max-width: 768px) 100vw, 1024px"
            className="h-auto w-full rounded-2xl"
            priority
          />
          <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-black/60 via-black/30 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8">
            <h2 className="text-xl font-bold text-white sm:text-3xl">
              Encontre barbearias e salões de beleza perto de você.
            </h2>
            <p className="mt-1 text-sm text-white/80 sm:text-base">
              Agende com os melhores profissionais da sua cidade
            </p>
          </div>
        </div>

        {locations.length > 0 && (
          <Suspense fallback={null}>
            <LocationFilter
              locations={locations}
              currentCity={params.city}
              currentState={params.state}
            />
          </Suspense>
        )}

        {confirmedBookings.length > 0 && (
          <PageSectionContent>
            <PageSectionTitle>Agendamentos</PageSectionTitle>
            <PageSectionScroller>
              {confirmedBookings.map((booking) => (
                <BookingItem key={booking.id} booking={booking} />
              ))}
            </PageSectionScroller>
          </PageSectionContent>
        )}
        <PageSectionContent>
          <PageSectionTitle>Barbearias e Salões</PageSectionTitle>
          {barbershops.length > 0 ? (
            <PageSectionScroller>
              {barbershops.map((barbershop) => (
                <BarbershopItem key={barbershop.id} barbershop={barbershop} />
              ))}
            </PageSectionScroller>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum estabelecimento encontrado para a localização selecionada.
            </p>
          )}
        </PageSectionContent>
        <PageSectionContent>
          <PageSectionTitle>Barbearias e Salões populares</PageSectionTitle>
          {popularBarbershops.length > 0 ? (
            <PageSectionScroller>
              {popularBarbershops.map((barbershop) => (
                <BarbershopItem key={barbershop.id} barbershop={barbershop} />
              ))}
            </PageSectionScroller>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum estabelecimento popular encontrado para a localização selecionada.
            </p>
          )}
        </PageSectionContent>
      </PageContainer>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
