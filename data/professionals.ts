import { prisma, safeQuery } from "@/lib/prisma";

export async function getProfessionalsByBarbershop(barbershopId: string) {
  const { data } = await safeQuery(
    () =>
      prisma.professional.findMany({
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
      }),
    []
  );
  return data;
}

export async function getProfessionalById(professionalId: string) {
  const { data } = await safeQuery(
    () =>
      prisma.professional.findUnique({
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
      }),
    null
  );
  return data;
}

export async function getAllProfessionalsByBarbershop(barbershopId: string) {
  const { data } = await safeQuery(
    () =>
      prisma.professional.findMany({
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
      }),
    []
  );
  return data;
}

export type ProfessionalWithUser = Awaited<
  ReturnType<typeof getProfessionalsByBarbershop>
>[number];

export type ProfessionalWithDetails = NonNullable<
  Awaited<ReturnType<typeof getProfessionalById>>
>;
