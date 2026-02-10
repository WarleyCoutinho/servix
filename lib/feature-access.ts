"use server";

import { prisma } from "@/lib/prisma";
import {
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from "@/generated/prisma/enums";

type Feature =
  | "add_professional"
  | "add_service"
  | "add_barbershop"
  | "view_professionals"
  | "manage_subscription"
  | "access_owner_dashboard"
  | "access_professional_dashboard"
  | "access_admin_dashboard";

interface FeatureAccessParams {
  userId: string;
  role: UserRole;
  feature: Feature;
  barbershopId?: string;
}

interface AccessResult {
  allowed: boolean;
  reason?: string;
  limit?: number;
  current?: number;
}

const rolePermissions: Record<UserRole, Feature[]> = {
  [UserRole.admin]: ["access_admin_dashboard", "manage_subscription"],
  [UserRole.owner]: [
    "access_owner_dashboard",
    "access_professional_dashboard",
    "add_professional",
    "add_service",
    "add_barbershop",
    "view_professionals",
    "manage_subscription",
  ],
  [UserRole.professional]: ["access_professional_dashboard"],
  [UserRole.client]: [],
};

export async function canAccessFeature(
  params: FeatureAccessParams,
): Promise<AccessResult> {
  const { userId, role, feature, barbershopId } = params;

  const permissions = rolePermissions[role];
  if (!permissions.includes(feature)) {
    return {
      allowed: false,
      reason: `Role ${role} não tem permissão para ${feature}`,
    };
  }

  if (role === UserRole.owner && barbershopId) {
    return checkPlanLimits(userId, feature, barbershopId);
  }

  return { allowed: true };
}

async function checkPlanLimits(
  userId: string,
  feature: Feature,
  barbershopId: string,
): Promise<AccessResult> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      barbershop: { ownerId: userId },
      status: SubscriptionStatus.ACTIVE,
    },
  });

  if (!subscription) {
    return {
      allowed: false,
      reason: "Assinatura inativa",
    };
  }

  const planConfig = await prisma.planConfig.findUnique({
    where: { plan: subscription.plan },
  });

  if (!planConfig) {
    return {
      allowed: false,
      reason: "Configuração de plano não encontrada",
    };
  }

  switch (feature) {
    case "add_professional": {
      if (subscription.plan === SubscriptionPlan.BASIC) {
        return {
          allowed: false,
          reason:
            "Plano Básico permite apenas o proprietário como profissional",
          limit: 1,
          current: 1,
        };
      }

      const count = await prisma.professional.count({
        where: { barbershopId, isActive: true },
      });

      return {
        allowed: count < planConfig.maxProfessionals,
        reason:
          count >= planConfig.maxProfessionals
            ? `Limite de profissionais atingido (${count}/${planConfig.maxProfessionals})`
            : undefined,
        limit: planConfig.maxProfessionals,
        current: count,
      };
    }

    case "add_service": {
      if (planConfig.maxServices === null) {
        return { allowed: true };
      }

      const count = await prisma.barbershopService.count({
        where: { barbershopId, deletedAt: null },
      });

      return {
        allowed: count < planConfig.maxServices,
        reason:
          count >= planConfig.maxServices
            ? `Limite de serviços atingido (${count}/${planConfig.maxServices})`
            : undefined,
        limit: planConfig.maxServices,
        current: count,
      };
    }

    case "add_barbershop": {
      const count = await prisma.barbershop.count({
        where: { ownerId: userId, isActive: true },
      });

      return {
        allowed: count < planConfig.maxBarbershops,
        reason:
          count >= planConfig.maxBarbershops
            ? `Limite de estabelecimentos atingido (${count}/${planConfig.maxBarbershops})`
            : undefined,
        limit: planConfig.maxBarbershops,
        current: count,
      };
    }

    default:
      return { allowed: true };
  }
}
