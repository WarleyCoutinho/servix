import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@/generated/prisma/enums";

export interface PlanLimits {
  maxBarbershops: number;
  maxProfessionals: number;
  maxServices: number | null;
  currentBarbershops: number;
  currentProfessionals: number;
  currentServices: number;
  canAddBarbershop: boolean;
  canAddProfessional: boolean;
  canAddService: boolean;
}

export async function getPlanLimits(
  barbershopId: string,
): Promise<PlanLimits | null> {
  const barbershop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    select: { ownerId: true },
  });

  if (!barbershop?.ownerId) {
    return null;
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      barbershop: {
        ownerId: barbershop.ownerId,
      },
      status: SubscriptionStatus.ACTIVE,
    },
  });

  if (!subscription) {
    return null;
  }

  const planConfig = await prisma.planConfig.findUnique({
    where: { plan: subscription.plan },
  });

  if (!planConfig) {
    return null;
  }

  const [currentProfessionals, currentServices, currentBarbershops] = await Promise.all([
    prisma.professional.count({
      where: { barbershopId, isActive: true },
    }),
    prisma.barbershopService.count({
      where: { barbershopId, deletedAt: null },
    }),
    prisma.barbershop.count({
      where: { ownerId: barbershop.ownerId },
    }),
  ]);

  const canAddProfessional = currentProfessionals < planConfig.maxProfessionals;
  const canAddService =
    planConfig.maxServices === null ||
    currentServices < planConfig.maxServices;

  return {
    maxBarbershops: planConfig.maxBarbershops,
    maxProfessionals: planConfig.maxProfessionals,
    maxServices: planConfig.maxServices,
    currentBarbershops,
    currentProfessionals,
    currentServices,
    canAddBarbershop: currentBarbershops < planConfig.maxBarbershops,
    canAddProfessional,
    canAddService,
  };
}

export async function checkProfessionalLimit(
  barbershopId: string,
): Promise<{ allowed: boolean; message?: string }> {
  const limits = await getPlanLimits(barbershopId);

  if (!limits) {
    return {
      allowed: false,
      message: "Assinatura inativa. Renove para adicionar profissionais.",
    };
  }

  if (!limits.canAddProfessional) {
    return {
      allowed: false,
      message: `Limite de profissionais atingido (${limits.currentProfessionals}/${limits.maxProfessionals}). Faça upgrade do seu plano para adicionar mais.`,
    };
  }

  return { allowed: true };
}

export async function checkServiceLimit(
  barbershopId: string,
): Promise<{ allowed: boolean; message?: string }> {
  const limits = await getPlanLimits(barbershopId);

  if (!limits) {
    return {
      allowed: false,
      message: "Assinatura inativa. Renove para adicionar serviços.",
    };
  }

  if (!limits.canAddService) {
    return {
      allowed: false,
      message: `Limite de serviços atingido (${limits.currentServices}/${limits.maxServices}). Faça upgrade do seu plano para adicionar mais.`,
    };
  }

  return { allowed: true };
}

export async function checkBarbershopLimit(
  userId: string,
): Promise<{ allowed: boolean; message?: string; maxBarbershops?: number }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ownedBarbershops: {
        include: {
          subscription: true,
        },
      },
    },
  });

  if (!user) {
    return {
      allowed: false,
      message: "Usuário não encontrado.",
    };
  }

  if (user.ownedBarbershops.length === 0) {
    return { allowed: true, maxBarbershops: 1 };
  }

  const activeSubscription = user.ownedBarbershops.find(
    (b) => b.subscription?.status === SubscriptionStatus.ACTIVE,
  )?.subscription;

  if (!activeSubscription) {
    return {
      allowed: false,
      message: "Você não possui uma assinatura ativa.",
    };
  }

  const planConfig = await prisma.planConfig.findUnique({
    where: { plan: activeSubscription.plan },
  });

  if (!planConfig) {
    return {
      allowed: false,
      message: "Plano não encontrado.",
    };
  }

  const currentBarbershops = user.ownedBarbershops.length;

  if (currentBarbershops >= planConfig.maxBarbershops) {
    return {
      allowed: false,
      message: `Limite de estabelecimentos atingido (${currentBarbershops}/${planConfig.maxBarbershops}). Faça upgrade para o plano Enterprise para adicionar mais.`,
      maxBarbershops: planConfig.maxBarbershops,
    };
  }

  return { allowed: true, maxBarbershops: planConfig.maxBarbershops };
}
