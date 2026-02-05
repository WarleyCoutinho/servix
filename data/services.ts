import { prisma } from "@/lib/prisma";

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
