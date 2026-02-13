// Data Access Layer
import { prisma, safeQuery } from "@/lib/prisma";

export const getBarbershops = async () => {
  const { data } = await safeQuery(
    () => prisma.barbershop.findMany(),
    []
  );
  return data;
};

export const getPopularBarbershops = async () => {
  const { data } = await safeQuery(
    () =>
      prisma.barbershop.findMany({
        orderBy: {
          name: "desc",
        },
      }),
    []
  );
  return data;
};

export const getBarbershopById = async (id: string) => {
  const barbershop = await prisma.barbershop.findUnique({
    where: { id },
    include: {
      services: {
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      },
    },
  });
  return barbershop;
};

export const getBarbershopsByServiceName = async (serviceName: string) => {
  const barbershops = await prisma.barbershop.findMany({
    where: {
      services: {
        some: {
          name: {
            contains: serviceName,
            mode: "insensitive",
          },
        },
      },
    },
  });
  return barbershops;
};
