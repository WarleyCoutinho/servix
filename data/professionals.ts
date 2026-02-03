import { prisma } from "@/lib/prisma";

export async function getProfessionalsByBarbershop(barbershopId: string) {
  return prisma.professional.findMany({
    where: {
      barbershopId,
      isActive: true,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      displayName: "asc",
    },
  });
}

export async function getProfessionalById(professionalId: string) {
  return prisma.professional.findUnique({
    where: { id: professionalId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      barbershop: true,
      schedules: true,
    },
  });
}

export async function getAllProfessionalsByBarbershop(barbershopId: string) {
  return prisma.professional.findMany({
    where: { barbershopId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export type ProfessionalWithUser = Awaited<
  ReturnType<typeof getProfessionalsByBarbershop>
>[number];

export type ProfessionalWithDetails = NonNullable<
  Awaited<ReturnType<typeof getProfessionalById>>
>;
