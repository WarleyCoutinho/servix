import BookingItem from "@/components/booking-item";
import Header from "@/components/header";
import bannerDark from "@/public/servix_dark.png";
import bannerLight from "@/public/servix_light.png";
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
  getBarbershopBySlug,
  getPopularBarbershops,
  getUserBarbershops,
} from "@/data/barbershops";
import { getUserBookings } from "@/data/bookings";
import { getServiceCategories } from "@/data/services";
import { auth } from "@/lib/auth";
import { cookies, headers } from "next/headers";

interface HomeProps {
  searchParams: Promise<{ city?: string; state?: string }>;
}

const Banner = ({ children }: { children?: React.ReactNode }) => (
  <div className="relative overflow-hidden rounded-2xl">
    <Image
      src={bannerDark}
      alt="Agende nos melhores com a Servix"
      sizes="(max-width: 768px) 100vw, 1024px"
      className="hidden h-auto w-full rounded-2xl dark:block"
      priority
    />
    <Image
      src={bannerLight}
      alt="Agende nos melhores com a Servix"
      sizes="(max-width: 768px) 100vw, 1024px"
      className="block h-auto w-full rounded-2xl dark:hidden"
      priority
    />
    <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-black/60 via-black/30 to-transparent" />
    {children && (
      <div className="absolute bottom-[8%] left-4 right-4 sm:bottom-[10%] sm:left-8 md:bottom-[12%]">
        {children}
      </div>
    )}
  </div>
);

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const filters = {
    city: params.city,
    state: params.state,
  };

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const role = session?.user?.role as string | undefined;
  const userId = session?.user?.id;
  const isRestricted = role === "owner" || role === "professional";

  // --- 1. Owners e professionals: veem apenas seus estabelecimentos ---
  if (isRestricted && userId) {
    const [myBarbershops, { confirmedBookings }, categories] =
      await Promise.all([
        getUserBarbershops(userId, role!),
        getUserBookings(),
        getServiceCategories(),
      ]);

    return (
      <div className="flex min-h-screen flex-col">
        <Header categories={categories} />
        <PageContainer>
          <Suspense fallback={null}>
            <AuthErrorAlert />
          </Suspense>

          <Banner />

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
            <PageSectionTitle>
              {role === "owner"
                ? "Meus Estabelecimentos"
                : "Meu Estabelecimento"}
            </PageSectionTitle>
            {myBarbershops.length > 0 ? (
              <PageSectionScroller>
                {myBarbershops.map((barbershop) => (
                  <BarbershopItem key={barbershop.id} barbershop={barbershop} />
                ))}
              </PageSectionScroller>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum estabelecimento encontrado.
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

  // --- 2. Qualquer pessoa que entrou pelo link da barbearia: vê só aquela ---
  const cookieStore = await cookies();
  const linkedSlug = cookieStore.get("barbershop_slug")?.value;

  if (linkedSlug) {
    const [linkedBarbershop, { confirmedBookings }, categories] =
      await Promise.all([
        getBarbershopBySlug(linkedSlug),
        getUserBookings(),
        getServiceCategories(),
      ]);

    return (
      <div className="flex min-h-screen flex-col">
        <Header categories={categories} />
        <PageContainer>
          <Suspense fallback={null}>
            <AuthErrorAlert />
          </Suspense>

          <Banner />

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
            <PageSectionTitle>Estabelecimento</PageSectionTitle>
            {linkedBarbershop ? (
              <PageSectionScroller>
                <BarbershopItem barbershop={linkedBarbershop} />
              </PageSectionScroller>
            ) : (
              <p className="text-sm text-muted-foreground">
                Estabelecimento não encontrado.
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

  // --- 3. Sem cookie: vê tudo normalmente ---
  const [
    barbershops,
    popularBarbershops,
    { confirmedBookings },
    categories,
    locations,
  ] = await Promise.all([
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

        <Banner />

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
              Nenhum estabelecimento popular encontrado para a localização
              selecionada.
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
