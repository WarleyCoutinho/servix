import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@/generated/prisma/enums";

export interface PlanLimits {
  maxBarbershops: number;
  maxProfessionals: number;
  maxServices: number | null;
  currentProfessionals: number;
  currentServices: number;
  canAddProfessional: boolean;
  canAddService: boolean;
}

export async function getPlanLimits(
  barbershopId: string,
): Promise<PlanLimits | null> {
  const subscription = await prisma.subscription.findUnique({
    where: { barbershopId },
  });

  if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
    return null;
  }

  const planConfig = await prisma.planConfig.findUnique({
    where: { plan: subscription.plan },
  });

  if (!planConfig) {
    return null;
  }

  const [currentProfessionals, currentServices] = await Promise.all([
    prisma.professional.count({
      where: { barbershopId, isActive: true },
    }),
    prisma.barbershopService.count({
      where: { barbershopId, deletedAt: null },
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
    currentProfessionals,
    currentServices,
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
