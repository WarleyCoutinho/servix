import { createSafeActionClient } from "next-safe-action";
import { headers } from "next/headers";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { SubscriptionStatus, UserRole } from "@/generated/prisma/enums";
import { getUserFriendlyMessage, isConnectionError } from "./db-error";

export const actionClient = createSafeActionClient({
  handleServerError: (error) => {
    if (isConnectionError(error)) {
      console.error("[Database Connection Error]", error);
      return getUserFriendlyMessage(error);
    }

    console.error("[Server Action Error]", error);

    if (error instanceof Error) {
      return error.message;
    }

    return "Ocorreu um erro inesperado. Por favor, tente novamente.";
  },
});

export const protectedActionClient = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    throw new Error("Não autorizado. Por favor, faça login para continuar.");
  }
  return next({ ctx: { user: session.user } });
});

export const ownerActionClient = protectedActionClient.use(
  async ({ next, ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: { ownedBarbershop: true },
    });

    if (user?.role !== UserRole.owner || !user.ownedBarbershop) {
      throw new Error(
        "Acesso negado. Apenas proprietários podem acessar este recurso.",
      );
    }

    return next({
      ctx: {
        ...ctx,
        user,
        barbershop: user.ownedBarbershop,
      },
    });
  },
);

export const professionalActionClient = protectedActionClient.use(
  async ({ next, ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        professional: {
          include: { barbershop: true },
        },
      },
    });

    if (user?.role !== UserRole.professional || !user.professional) {
      throw new Error(
        "Acesso negado. Apenas profissionais podem acessar este recurso.",
      );
    }

    if (!user.professional.isActive) {
      throw new Error(
        "Sua conta de profissional está desativada. Entre em contato com o proprietário da barbearia.",
      );
    }

    return next({
      ctx: {
        ...ctx,
        user,
        professional: user.professional,
        barbershop: user.professional.barbershop,
      },
    });
  },
);

export const subscribedOwnerActionClient = ownerActionClient.use(
  async ({ next, ctx }) => {
    const subscription = await prisma.subscription.findUnique({
      where: { barbershopId: ctx.barbershop.id },
    });

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new Error(
        "Assinatura inativa. Por favor, renove sua assinatura para continuar.",
      );
    }

    return next({
      ctx: {
        ...ctx,
        subscription,
      },
    });
  },
);

export const adminActionClient = protectedActionClient.use(
  async ({ next, ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
    });

    if (user?.role !== UserRole.admin) {
      throw new Error(
        "Acesso negado. Apenas administradores podem acessar este recurso.",
      );
    }

    return next({
      ctx: {
        ...ctx,
        user,
      },
    });
  },
);
