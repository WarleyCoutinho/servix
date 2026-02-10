import { prisma, safeQuery } from "@/lib/prisma";

export interface ServiceCategory {
  label: string;
  search: string;
}

export async function getServiceCategories(): Promise<ServiceCategory[]> {
  const { data: services } = await safeQuery(
    () =>
      prisma.barbershopService.findMany({
        where: {
          deletedAt: null,
          barbershop: {
            isActive: true,
          },
        },
        select: {
          name: true,
        },
        distinct: ["name"],
        orderBy: {
          name: "asc",
        },
      }),
    []
  );

  return services.map((service) => ({
    label: service.name,
    search: service.name.toLowerCase(),
  }));
}

export async function getServiceById(serviceId: string) {
  return prisma.barbershopService.findUnique({
    where: { id: serviceId },
    include: {
      barbershop: true,
    },
  });
}

export async function getServicesByBarbershop(barbershopId: string) {
  return prisma.barbershopService.findMany({
    where: {
      barbershopId,
      deletedAt: null,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export type ServiceWithBarbershop = NonNullable<
  Awaited<ReturnType<typeof getServiceById>>
>;
