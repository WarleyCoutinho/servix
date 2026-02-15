import Header from "@/components/header";
import Footer from "@/components/footer";
import BookingItem from "@/components/booking-item";
import { getUserBookings } from "@/data/bookings";
import { getServiceCategories } from "@/data/services";
import {
  PageContainer,
  PageSectionContent,
  PageSectionTitle,
} from "@/components/ui/page";

const BookingsPage = async () => {
  const [{ confirmedBookings, finishedBookings }, categories] =
    await Promise.all([getUserBookings(), getServiceCategories()]);

  return (
    <div>
      <Header categories={categories} />
      <PageContainer>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold sm:text-3xl">Meus Agendamentos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus agendamentos confirmados e historico
          </p>
        </div>

        <PageSectionContent>
          <PageSectionTitle>Confirmados</PageSectionTitle>
          {confirmedBookings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {confirmedBookings.map((booking) => (
                <BookingItem key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhum agendamento confirmado.
            </p>
          )}
        </PageSectionContent>

        <PageSectionContent>
          <PageSectionTitle>Finalizados</PageSectionTitle>
          {finishedBookings.length > 0 ? (
            <div className="flex flex-col gap-3">
              {finishedBookings.map((booking) => (
                <BookingItem key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhum agendamento finalizado.
            </p>
          )}
        </PageSectionContent>
      </PageContainer>
      <Footer />
    </div>
  );
};

export default BookingsPage;
