import { prisma } from "@/lib/prisma";

export interface BarbershopVisit {
  barbershopId: string;
  barbershopName: string;
  barbershopImage: string;
  totalVisits: number;
  totalSpentInCents: number;
  lastVisit: Date;
}

export interface ServiceHistory {
  id: string;
  serviceName: string;
  barbershopName: string;
  professionalName: string | null;
  date: Date;
  priceInCents: number;
}

export interface ClientStats {
  totalBookings: number;
  totalSpentInCents: number;
  uniqueBarbershops: number;
  barbershopVisits: BarbershopVisit[];
  recentServices: ServiceHistory[];
}

export async function getClientStats(userId: string): Promise<ClientStats> {
  const bookings = await prisma.booking.findMany({
    where: {
      userId,
      cancelledAt: null,
    },
    include: {
      barbershop: true,
      service: true,
      professional: {
        include: {
          user: true,
        },
      },
      payment: true,
    },
    orderBy: {
      date: "desc",
    },
  });

  const barbershopMap = new Map<string, BarbershopVisit>();

  for (const booking of bookings) {
    const existing = barbershopMap.get(booking.barbershopId);
    const spentInCents = booking.payment?.amountInCents ?? booking.service.priceInCents;

    if (existing) {
      existing.totalVisits += 1;
      existing.totalSpentInCents += spentInCents;
      if (booking.date > existing.lastVisit) {
        existing.lastVisit = booking.date;
      }
    } else {
      barbershopMap.set(booking.barbershopId, {
        barbershopId: booking.barbershopId,
        barbershopName: booking.barbershop.name,
        barbershopImage: booking.barbershop.imageUrl,
        totalVisits: 1,
        totalSpentInCents: spentInCents,
        lastVisit: booking.date,
      });
    }
  }

  const barbershopVisits = Array.from(barbershopMap.values()).sort(
    (a, b) => b.totalVisits - a.totalVisits,
  );

  const totalSpentInCents = barbershopVisits.reduce(
    (acc, visit) => acc + visit.totalSpentInCents,
    0,
  );

  const recentServices: ServiceHistory[] = bookings.slice(0, 10).map((booking) => ({
    id: booking.id,
    serviceName: booking.service.name,
    barbershopName: booking.barbershop.name,
    professionalName:
      booking.professional?.displayName ?? booking.professional?.user.name ?? null,
    date: booking.date,
    priceInCents: booking.payment?.amountInCents ?? booking.service.priceInCents,
  }));

  return {
    totalBookings: bookings.length,
    totalSpentInCents,
    uniqueBarbershops: barbershopVisits.length,
    barbershopVisits,
    recentServices,
  };
}
