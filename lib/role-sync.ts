import { prisma } from "./prisma";
import { SubscriptionPlan, UserRole } from "@/generated/prisma/enums";

export async function updateUserRoleBasedOnPlan(
  barbershopId: string,
  plan: SubscriptionPlan,
): Promise<void> {
  const barbershop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    select: { ownerId: true },
  });

  if (!barbershop?.ownerId) return;

  const newRole =
    plan === SubscriptionPlan.BASIC
      ? UserRole.owner_professional
      : UserRole.owner;

  await prisma.user.update({
    where: { id: barbershop.ownerId },
    data: { role: newRole },
  });

  if (plan === SubscriptionPlan.BASIC) {
    await ensureOwnerHasProfessionalRecord(barbershop.ownerId, barbershopId);
  }
}

export async function ensureOwnerHasProfessionalRecord(
  userId: string,
  barbershopId: string,
): Promise<void> {
  const existingProfessional = await prisma.professional.findUnique({
    where: { userId },
  });

  if (existingProfessional) {
    if (!existingProfessional.isActive) {
      await prisma.professional.update({
        where: { id: existingProfessional.id },
        data: { isActive: true },
      });
    }
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  if (!user) return;

  await prisma.professional.create({
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
}

export async function handlePlanDowngrade(
  barbershopId: string,
  fromPlan: SubscriptionPlan,
  toPlan: SubscriptionPlan,
): Promise<{ disabledProfessionals: number; disabledServices: number }> {
  const result = { disabledProfessionals: 0, disabledServices: 0 };

  const [barbershop, newPlanConfig] = await Promise.all([
    prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { ownerId: true },
    }),
    prisma.planConfig.findUnique({
      where: { plan: toPlan },
    }),
  ]);

  if (!barbershop?.ownerId || !newPlanConfig) return result;

  if (toPlan === SubscriptionPlan.BASIC) {
    const additionalProfessionals = await prisma.professional.findMany({
      where: {
        barbershopId,
        userId: { not: barbershop.ownerId },
        isActive: true,
      },
    });

    if (additionalProfessionals.length > 0) {
      await prisma.professional.updateMany({
        where: {
          barbershopId,
          userId: { not: barbershop.ownerId },
        },
        data: { isActive: false },
      });
      result.disabledProfessionals = additionalProfessionals.length;
    }
  } else {
    const activeProfessionals = await prisma.professional.findMany({
      where: { barbershopId, isActive: true },
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
      result.disabledProfessionals = professionalsToDisable.length;
    }
  }

  if (newPlanConfig.maxServices !== null) {
    const activeServices = await prisma.barbershopService.findMany({
      where: { barbershopId, deletedAt: null },
      orderBy: { name: "asc" },
    });

    if (activeServices.length > newPlanConfig.maxServices) {
      const servicesToDisable = activeServices.slice(newPlanConfig.maxServices);
      await prisma.barbershopService.updateMany({
        where: {
          id: { in: servicesToDisable.map((s) => s.id) },
        },
        data: { deletedAt: new Date() },
      });
      result.disabledServices = servicesToDisable.length;
    }
  }

  return result;
}
