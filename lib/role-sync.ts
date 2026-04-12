import { prisma } from "./prisma";
import { DayOfWeek, SubscriptionPlan } from "@/generated/prisma/enums";
import { DAY_OF_WEEK_ORDER } from "@/lib/day-of-week";

export async function updateUserRoleBasedOnPlan(
  barbershopId: string,
): Promise<void> {
  const barbershop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    select: { ownerId: true },
  });

  if (!barbershop?.ownerId) return;

  await ensureOwnerHasProfessionalRecord(barbershop.ownerId, barbershopId);
}

export async function ensureOwnerHasProfessionalRecord(
  userId: string,
  barbershopId: string,
): Promise<void> {
  const existingProfessional = await prisma.professional.findUnique({
    where: { userId },
    include: {
      _count: { select: { schedules: true } },
    },
  });

  if (existingProfessional) {
    if (!existingProfessional.isActive) {
      await prisma.professional.update({
        where: { id: existingProfessional.id },
        data: { isActive: true },
      });
    }

    if (existingProfessional._count.schedules < 7) {
      const existingSchedules = await prisma.professionalSchedule.findMany({
        where: { professionalId: existingProfessional.id },
        select: { dayOfWeek: true },
      });
      const existingDays = new Set(existingSchedules.map((s) => s.dayOfWeek));
      const missingDays = DAY_OF_WEEK_ORDER.filter((day) => !existingDays.has(day));

      if (missingDays.length > 0) {
        await prisma.professionalSchedule.createMany({
          data: missingDays.map((day) => ({
            professionalId: existingProfessional.id,
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "18:00",
            isAvailable: day !== DayOfWeek.SATURDAY && day !== DayOfWeek.SUNDAY,
          })),
        });
      }
    }

    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const professional = await prisma.professional.create({
    data: {
      userId,
      barbershopId,
      cpf: `owner_${userId.slice(0, 8)}`,
      displayName: user.name,
      isActive: true,
      acceptsCard: true,
      acceptsPix: false,
    },
  });

  await prisma.professionalSchedule.createMany({
    data: DAY_OF_WEEK_ORDER.map((day) => ({
      professionalId: professional.id,
      dayOfWeek: day,
      startTime: "09:00",
      endTime: "18:00",
      isAvailable: day !== DayOfWeek.SATURDAY && day !== DayOfWeek.SUNDAY,
    })),
  });
}

interface DowngradeResult {
  disabledProfessionals: number;
  disabledServices: number;
  disabledBarbershops: number;
}

export async function handlePlanDowngrade(
  userId: string,
  fromPlan: SubscriptionPlan,
  toPlan: SubscriptionPlan,
): Promise<DowngradeResult> {
  const result: DowngradeResult = {
    disabledProfessionals: 0,
    disabledServices: 0,
    disabledBarbershops: 0,
  };

  const newPlanConfig = await prisma.planConfig.findUnique({
    where: { plan: toPlan },
  });

  if (!newPlanConfig) return result;

  const activeBarbershops = await prisma.barbershop.findMany({
    where: { ownerId: userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (activeBarbershops.length > newPlanConfig.maxBarbershops) {
    const barbershopsToDisable = activeBarbershops.slice(
      newPlanConfig.maxBarbershops,
    );

    await prisma.barbershop.updateMany({
      where: {
        id: { in: barbershopsToDisable.map((b) => b.id) },
      },
      data: { isActive: false },
    });

    result.disabledBarbershops = barbershopsToDisable.length;
  }

  const remainingActiveBarbershops = activeBarbershops.slice(
    0,
    newPlanConfig.maxBarbershops,
  );

  for (const barbershop of remainingActiveBarbershops) {
    if (toPlan === SubscriptionPlan.BASIC) {
      const additionalProfessionals = await prisma.professional.findMany({
        where: {
          barbershopId: barbershop.id,
          userId: { not: userId },
          isActive: true,
        },
      });

      if (additionalProfessionals.length > 0) {
        await prisma.professional.updateMany({
          where: {
            barbershopId: barbershop.id,
            userId: { not: userId },
          },
          data: { isActive: false },
        });
        result.disabledProfessionals += additionalProfessionals.length;
      }
    } else {
      const activeProfessionals = await prisma.professional.findMany({
        where: { barbershopId: barbershop.id, isActive: true },
        orderBy: { createdAt: "desc" },
      });

      if (activeProfessionals.length > newPlanConfig.maxProfessionals) {
        const professionalsToDisable = activeProfessionals.slice(
          newPlanConfig.maxProfessionals,
        );
        await prisma.professional.updateMany({
          where: {
            id: { in: professionalsToDisable.map((p) => p.id) },
          },
          data: { isActive: false },
        });
        result.disabledProfessionals += professionalsToDisable.length;
      }
    }

    if (newPlanConfig.maxServices !== null) {
      const activeServices = await prisma.barbershopService.findMany({
        where: { barbershopId: barbershop.id, deletedAt: null },
        orderBy: { name: "asc" },
      });

      if (activeServices.length > newPlanConfig.maxServices) {
        const servicesToDisable = activeServices.slice(
          newPlanConfig.maxServices,
        );
        await prisma.barbershopService.updateMany({
          where: {
            id: { in: servicesToDisable.map((s) => s.id) },
          },
          data: { deletedAt: new Date() },
        });
        result.disabledServices += servicesToDisable.length;
      }
    }
  }

  return result;
}

interface UpgradeResult {
  reactivatedProfessionals: number;
  reactivatedServices: number;
  reactivatedBarbershops: number;
}

export async function handlePlanUpgrade(
  userId: string,
  fromPlan: SubscriptionPlan,
  toPlan: SubscriptionPlan,
): Promise<UpgradeResult> {
  const result: UpgradeResult = {
    reactivatedProfessionals: 0,
    reactivatedServices: 0,
    reactivatedBarbershops: 0,
  };

  const newPlanConfig = await prisma.planConfig.findUnique({
    where: { plan: toPlan },
  });

  if (!newPlanConfig) return result;

  const currentActiveBarbershops = await prisma.barbershop.count({
    where: { ownerId: userId, isActive: true },
  });

  const availableBarbershopSlots =
    newPlanConfig.maxBarbershops - currentActiveBarbershops;

  if (availableBarbershopSlots > 0) {
    const inactiveBarbershops = await prisma.barbershop.findMany({
      where: { ownerId: userId, isActive: false },
      orderBy: { createdAt: "asc" },
      take: availableBarbershopSlots,
    });

    if (inactiveBarbershops.length > 0) {
      await prisma.barbershop.updateMany({
        where: {
          id: { in: inactiveBarbershops.map((b) => b.id) },
        },
        data: { isActive: true },
      });
      result.reactivatedBarbershops = inactiveBarbershops.length;
    }
  }

  const allActiveBarbershops = await prisma.barbershop.findMany({
    where: { ownerId: userId, isActive: true },
  });

  for (const barbershop of allActiveBarbershops) {
    const currentActiveProfessionals = await prisma.professional.count({
      where: { barbershopId: barbershop.id, isActive: true },
    });

    const availableProfessionalSlots =
      newPlanConfig.maxProfessionals - currentActiveProfessionals;

    if (availableProfessionalSlots > 0) {
      const inactiveProfessionals = await prisma.professional.findMany({
        where: { barbershopId: barbershop.id, isActive: false },
        orderBy: { createdAt: "asc" },
        take: availableProfessionalSlots,
      });

      if (inactiveProfessionals.length > 0) {
        await prisma.professional.updateMany({
          where: {
            id: { in: inactiveProfessionals.map((p) => p.id) },
          },
          data: { isActive: true },
        });
        result.reactivatedProfessionals += inactiveProfessionals.length;
      }
    }

    if (newPlanConfig.maxServices === null) {
      const deletedServices = await prisma.barbershopService.findMany({
        where: { barbershopId: barbershop.id, deletedAt: { not: null } },
      });

      if (deletedServices.length > 0) {
        await prisma.barbershopService.updateMany({
          where: {
            id: { in: deletedServices.map((s) => s.id) },
          },
          data: { deletedAt: null },
        });
        result.reactivatedServices += deletedServices.length;
      }
    } else {
      const currentActiveServices = await prisma.barbershopService.count({
        where: { barbershopId: barbershop.id, deletedAt: null },
      });

      const availableServiceSlots =
        newPlanConfig.maxServices - currentActiveServices;

      if (availableServiceSlots > 0) {
        const deletedServices = await prisma.barbershopService.findMany({
          where: { barbershopId: barbershop.id, deletedAt: { not: null } },
          orderBy: { deletedAt: "asc" },
          take: availableServiceSlots,
        });

        if (deletedServices.length > 0) {
          await prisma.barbershopService.updateMany({
            where: {
              id: { in: deletedServices.map((s) => s.id) },
            },
            data: { deletedAt: null },
          });
          result.reactivatedServices += deletedServices.length;
        }
      }
    }
  }

  return result;
}

interface DowngradeImpact {
  professionalsToDisable: number;
  servicesToDisable: number;
  barbershopsToDisable: number;
}

export async function getDowngradeImpact(
  userId: string,
  toPlan: SubscriptionPlan,
): Promise<DowngradeImpact> {
  const result: DowngradeImpact = {
    professionalsToDisable: 0,
    servicesToDisable: 0,
    barbershopsToDisable: 0,
  };

  const newPlanConfig = await prisma.planConfig.findUnique({
    where: { plan: toPlan },
  });

  if (!newPlanConfig) return result;

  const activeBarbershops = await prisma.barbershop.findMany({
    where: { ownerId: userId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (activeBarbershops.length > newPlanConfig.maxBarbershops) {
    result.barbershopsToDisable =
      activeBarbershops.length - newPlanConfig.maxBarbershops;
  }

  const remainingBarbershops = activeBarbershops.slice(
    0,
    newPlanConfig.maxBarbershops,
  );

  for (const barbershop of remainingBarbershops) {
    if (toPlan === SubscriptionPlan.BASIC) {
      const additionalProfessionals = await prisma.professional.count({
        where: {
          barbershopId: barbershop.id,
          userId: { not: userId },
          isActive: true,
        },
      });
      result.professionalsToDisable += additionalProfessionals;
    } else {
      const activeProfessionals = await prisma.professional.count({
        where: { barbershopId: barbershop.id, isActive: true },
      });

      if (activeProfessionals > newPlanConfig.maxProfessionals) {
        result.professionalsToDisable +=
          activeProfessionals - newPlanConfig.maxProfessionals;
      }
    }

    if (newPlanConfig.maxServices !== null) {
      const activeServices = await prisma.barbershopService.count({
        where: { barbershopId: barbershop.id, deletedAt: null },
      });

      if (activeServices > newPlanConfig.maxServices) {
        result.servicesToDisable +=
          activeServices - newPlanConfig.maxServices;
      }
    }
  }

  return result;
}
