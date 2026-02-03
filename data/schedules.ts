import { prisma } from "@/lib/prisma";
import { DayOfWeek } from "@/generated/prisma/enums";
export {
  DAY_OF_WEEK_ORDER,
  DAY_OF_WEEK_LABELS,
  DAY_OF_WEEK_SHORT_LABELS,
} from "@/lib/day-of-week";

export async function getBarbershopOperatingHours(barbershopId: string) {
  return prisma.operatingHours.findMany({
    where: { barbershopId },
    orderBy: {
      dayOfWeek: "asc",
    },
  });
}

export async function getProfessionalSchedule(professionalId: string) {
  return prisma.professionalSchedule.findMany({
    where: { professionalId },
    orderBy: {
      dayOfWeek: "asc",
    },
  });
}

export async function getBarbershopOperatingHoursForDay(
  barbershopId: string,
  dayOfWeek: DayOfWeek,
) {
  return prisma.operatingHours.findUnique({
    where: {
      barbershopId_dayOfWeek: {
        barbershopId,
        dayOfWeek,
      },
    },
  });
}

export async function getProfessionalScheduleForDay(
  professionalId: string,
  dayOfWeek: DayOfWeek,
) {
  return prisma.professionalSchedule.findUnique({
    where: {
      professionalId_dayOfWeek: {
        professionalId,
        dayOfWeek,
      },
    },
  });
}
