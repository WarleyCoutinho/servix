import BookingItem from "@/components/booking-item";
import Header from "@/components/header";
import banner from "@/public/logo-marca.png";
import Image from "next/image";

import BarbershopItem from "@/components/barbershop-item";
import Footer from "@/components/footer";
import QuickSearch from "@/components/quick-search";
import {
  PageContainer,
  PageSectionContent,
  PageSectionScroller,
  PageSectionTitle,
} from "@/components/ui/page";
import { getBarbershops, getPopularBarbershops } from "@/data/barbershops";
import { getUserBookings } from "@/data/bookings";
import { getServiceCategories } from "@/data/services";

export default async function Home() {
  const [barbershops, popularBarbershops, { confirmedBookings }, categories] =
    await Promise.all([
      getBarbershops(),
      getPopularBarbershops(),
      getUserBookings(),
      getServiceCategories(),
    ]);

  return (
    <div>
      <Header categories={categories} />
      <PageContainer>
        <QuickSearch categories={categories} />
        <Image
          src={banner}
          alt="Agende nos melhores com a Servix"
          sizes="100vw"
          className="h-auto w-full"
        />
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
          <PageSectionTitle>Barbearias</PageSectionTitle>
          <PageSectionScroller>
            {barbershops.map((barbershop) => (
              <BarbershopItem key={barbershop.id} barbershop={barbershop} />
            ))}
          </PageSectionScroller>
        </PageSectionContent>
        <PageSectionContent>
          <PageSectionTitle>Barbearias populares</PageSectionTitle>
          <PageSectionScroller>
            {popularBarbershops.map((barbershop) => (
              <BarbershopItem key={barbershop.id} barbershop={barbershop} />
            ))}
          </PageSectionScroller>
        </PageSectionContent>
      </PageContainer>
      <Footer />
    </div>
  );
}
