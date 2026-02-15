import { SubscriptionStatus, UserRole } from "@/generated/prisma/enums";
import { createSafeActionClient } from "next-safe-action";
import { cookies, headers } from "next/headers";
import { auth } from "./auth";
import { getUserFriendlyMessage, isConnectionError } from "./db-error";
import { prisma } from "./prisma";

const ACTIVE_BARBERSHOP_COOKIE = "active-barbershop-id";

const SAFE_ERROR_MESSAGES = new Set([
  "Não autorizado. Por favor, faça login para continuar.",
  "Acesso negado. Apenas proprietários podem acessar este recurso.",
  "Acesso negado. Apenas profissionais podem acessar este recurso.",
  "Acesso negado. Apenas administradores podem acessar este recurso.",
  "Nenhum estabelecimento ativo. Faça upgrade do seu plano para reativar.",
  "Sua conta de profissional está desativada. Entre em contato com o proprietário da barbearia.",
  "Assinatura inativa. Por favor, renove sua assinatura para continuar.",
  "Este profissional já possui agendamento neste horário.",
  "Nenhuma forma de pagamento disponível para este profissional.",
]);

export const actionClient = createSafeActionClient({
  handleServerError: (error) => {
    if (isConnectionError(error)) {
      console.error("[Database Connection Error]", error);
      return getUserFriendlyMessage(error);
    }

    console.error("[Server Action Error]", error);

    if (error instanceof Error && SAFE_ERROR_MESSAGES.has(error.message)) {
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
      include: {
        ownedBarbershops: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (user?.role !== UserRole.owner || user.ownedBarbershops.length === 0) {
      throw new Error(
        "Acesso negado. Apenas proprietários podem acessar este recurso.",
      );
    }

    const activeBarbershops = user.ownedBarbershops.filter((b) => b.isActive);

    if (activeBarbershops.length === 0) {
      throw new Error(
        "Nenhum estabelecimento ativo. Faça upgrade do seu plano para reativar.",
      );
    }

    const cookieStore = await cookies();
    const activeBarbershopId = cookieStore.get(ACTIVE_BARBERSHOP_COOKIE)?.value;

    let activeBarbershop = activeBarbershops.find(
      (b) => b.id === activeBarbershopId,
    );

    if (!activeBarbershop) {
      activeBarbershop = activeBarbershops[0];
    }

    return next({
      ctx: {
        ...ctx,
        user,
        barbershop: activeBarbershop,
        ownedBarbershops: activeBarbershops,
        allBarbershops: user.ownedBarbershops,
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

    if (
      (user?.role !== UserRole.professional && user?.role !== UserRole.owner) ||
      !user.professional
    ) {
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
    const subscription = await prisma.subscription.findFirst({
      where: {
        barbershop: {
          ownerId: ctx.user.id,
        },
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!subscription) {
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
