// Data Access Layer
import { prisma, safeQuery } from "@/lib/prisma";

interface BarbershopFilters {
  city?: string;
  state?: string;
}

export const getBarbershops = async (filters?: BarbershopFilters) => {
  const where: Record<string, unknown> = {};

  if (filters?.city) {
    where.city = { equals: filters.city, mode: "insensitive" };
  }
  if (filters?.state) {
    where.state = { equals: filters.state, mode: "insensitive" };
  }

  const { data } = await safeQuery(
    () => prisma.barbershop.findMany({ where }),
    []
  );
  return data;
};

export const getPopularBarbershops = async (filters?: BarbershopFilters) => {
  const where: Record<string, unknown> = {};

  if (filters?.city) {
    where.city = { equals: filters.city, mode: "insensitive" };
  }
  if (filters?.state) {
    where.state = { equals: filters.state, mode: "insensitive" };
  }

  const { data } = await safeQuery(
    () =>
      prisma.barbershop.findMany({
        where,
        orderBy: {
          name: "desc",
        },
      }),
    []
  );
  return data;
};

export const getAvailableLocations = async () => {
  const barbershops = await prisma.barbershop.findMany({
    where: {
      isActive: true,
      city: { not: "" },
      state: { not: "" },
    },
    select: { city: true, state: true },
    distinct: ["city", "state"],
    orderBy: [{ state: "asc" }, { city: "asc" }],
  });

  return barbershops;
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

export const getBarbershopBySlug = async (slug: string) => {
  const barbershop = await prisma.barbershop.findUnique({
    where: { slug },
    include: {
      services: {
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      },
    },
  });
  return barbershop;
};

export const getUserBarbershops = async (userId: string, role: string) => {
  if (role === "owner") {
    const { data } = await safeQuery(
      () =>
        prisma.barbershop.findMany({
          where: { ownerId: userId, isActive: true },
        }),
      [],
    );
    return data;
  }

  if (role === "professional") {
    const professional = await prisma.professional.findUnique({
      where: { userId },
      include: { barbershop: true },
    });
    if (professional?.barbershop) {
      return [professional.barbershop];
    }
    return [];
  }

  return [];
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
