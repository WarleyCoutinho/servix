import { prisma, safeQuery } from "@/lib/prisma";
import { DayOfWeek } from "@/generated/prisma/enums";
export {
  DAY_OF_WEEK_ORDER,
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_SHORT_LABELS,
} from "@/lib/day-of-week";

export async function getBarbershopOperatingHours(barbershopId: string) {
  const { data } = await safeQuery(
    () =>
      prisma.operatingHours.findMany({
        where: { barbershopId },
        orderBy: {
          dayOfWeek: "asc",
        },
      }),
    []
  );
  return data;
}

export async function getProfessionalSchedule(professionalId: string) {
  const { data } = await safeQuery(
    () =>
      prisma.professionalSchedule.findMany({
        where: { professionalId },
        orderBy: {
          dayOfWeek: "asc",
        },
      }),
    []
  );
  return data;
}

export async function getBarbershopOperatingHoursForDay(
  barbershopId: string,
  dayOfWeek: DayOfWeek,
) {
  const { data } = await safeQuery(
    () =>
      prisma.operatingHours.findUnique({
        where: {
          barbershopId_dayOfWeek: {
            barbershopId,
            dayOfWeek,
          },
        },
      }),
    null
  );
  return data;
}

export async function getProfessionalScheduleForDay(
  professionalId: string,
  dayOfWeek: DayOfWeek,
) {
  const { data } = await safeQuery(
    () =>
      prisma.professionalSchedule.findUnique({
        where: {
          professionalId_dayOfWeek: {
            professionalId,
            dayOfWeek,
          },
        },
      }),
    null
  );
  return data;
}
