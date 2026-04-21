import { prisma, safeQuery } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Prisma } from "@/generated/prisma/client";

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    barbershop: true;
    service: true;
    professional: { include: { user: { select: { name: true } } } };
  };
}>;

export const getUserBookings = async () => {
  let session;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    return { confirmedBookings: [], finishedBookings: [] };
  }

  if (!session?.user) {
    return { confirmedBookings: [], finishedBookings: [] };
  }

  const now = new Date();

  const { data } = await safeQuery(
    async () => {
      const [confirmed, finished] = await Promise.all([
        prisma.booking.findMany({
          where: {
            userId: session.user.id,
            date: { gte: now },
            cancelledAt: null,
          },
          include: {
            barbershop: true,
            service: true,
            professional: { include: { user: { select: { name: true } } } },
          },
          orderBy: { date: "asc" },
        }),
        prisma.booking.findMany({
          where: {
            userId: session.user.id,
            OR: [{ date: { lt: now } }, { cancelledAt: { not: null } }],
          },
          include: {
            barbershop: true,
            service: true,
            professional: { include: { user: { select: { name: true } } } },
          },
          orderBy: { date: "desc" },
        }),
      ]);
      return { confirmedBookings: confirmed, finishedBookings: finished };
    },
    { confirmedBookings: [], finishedBookings: [] },
  );

  return data;
};
