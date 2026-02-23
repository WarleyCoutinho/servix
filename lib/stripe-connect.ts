import { stripe } from "./stripe";
import { prisma } from "./prisma";
import { StripeAccountStatus } from "@/generated/prisma/enums";
import type Stripe from "stripe";

interface PrefillData {
  firstName?: string;
  lastName?: string;
  cpf?: string;
  phone?: string;
}

export async function createExpressAccount(
  professionalId: string,
  email: string,
  prefillData?: PrefillData,
): Promise<Stripe.Account> {
  try {
    const individual: Stripe.AccountCreateParams.Individual = {};

    if (prefillData?.firstName) {
      individual.first_name = prefillData.firstName;
    }
    if (prefillData?.lastName) {
      individual.last_name = prefillData.lastName;
    }
    if (prefillData?.cpf) {
      individual.id_number = prefillData.cpf.replace(/\D/g, "");
    }
    if (prefillData?.phone) {
      individual.phone = prefillData.phone;
    }

    const account = await stripe.accounts.create({
      type: "express",
      country: "BR",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      individual: Object.keys(individual).length > 0 ? individual : undefined,
      business_profile: {
        mcc: "7230",
        name: prefillData?.firstName && prefillData?.lastName
          ? `${prefillData.firstName} ${prefillData.lastName}`
          : undefined,
      },
      settings: {
        payouts: {
          schedule: {
            interval: "daily",
          },
        },
      },
      metadata: {
        professionalId,
      },
    });

    await prisma.professional.update({
      where: { id: professionalId },
      data: {
        stripeAccountId: account.id,
        stripeAccountStatus: StripeAccountStatus.ONBOARDING,
      },
    });

    return account;
  } catch (error) {
    console.error("[Stripe Connect] Erro ao criar conta Express:", error);
    throw new Error("Não foi possível criar sua conta de pagamentos. Por favor, tente novamente.");
  }
}

export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string,
): Promise<Stripe.AccountLink> {
  try {
    return await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });
  } catch (error) {
    console.error("[Stripe Connect] Erro ao criar link de onboarding:", error);
    throw new Error("Não foi possível gerar o link de configuração. Por favor, tente novamente.");
  }
}

export async function createLoginLink(
  accountId: string,
): Promise<Stripe.LoginLink> {
  try {
    return await stripe.accounts.createLoginLink(accountId);
  } catch (error) {
    console.error("[Stripe Connect] Erro ao criar link do dashboard:", error);
    throw new Error("Não foi possível acessar o dashboard de pagamentos. Por favor, tente novamente.");
  }
}

export async function isStripeAccountValid(
  accountId: string,
): Promise<boolean> {
  try {
    await stripe.accounts.retrieve(accountId);
    return true;
  } catch {
    return false;
  }
}

export async function getAccountStatus(
  accountId: string,
): Promise<StripeAccountStatus> {
  try {
    const account = await stripe.accounts.retrieve(accountId);

    if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
      return StripeAccountStatus.ACTIVE;
    }

    if (account.requirements?.disabled_reason) {
      if (
        account.requirements.disabled_reason.includes("rejected") ||
        account.requirements.disabled_reason.includes("fraud")
      ) {
        return StripeAccountStatus.DISABLED;
      }
      return StripeAccountStatus.RESTRICTED;
    }

    if (account.details_submitted) {
      const hasPendingRequirements =
        (account.requirements?.currently_due?.length ?? 0) > 0;

      if (hasPendingRequirements) {
        return StripeAccountStatus.RESTRICTED;
      }

      return StripeAccountStatus.PENDING;
    }

    return StripeAccountStatus.ONBOARDING;
  } catch (error) {
    console.error("[Stripe Connect] Erro ao buscar status da conta:", error);
    return StripeAccountStatus.DISABLED;
  }
}

export async function updateProfessionalStripeStatus(
  stripeAccountId: string,
): Promise<void> {
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId);
    const status = await getAccountStatus(stripeAccountId);

    await prisma.professional.update({
      where: { stripeAccountId },
      data: {
        stripeAccountStatus: status,
        stripeOnboardingComplete: account.details_submitted === true,
      },
    });
  } catch (error) {
    console.error("[Stripe Connect] Erro ao atualizar status do profissional:", error);
  }
}

export function isAccountReadyForPayments(
  status: StripeAccountStatus,
): boolean {
  return status === StripeAccountStatus.ACTIVE;
}

const DISABLED_REASON_MESSAGES: Record<string, string> = {
  "requirements.past_due":
    "Existem informações obrigatórias pendentes. Complete a verificação para ativar sua conta.",
  "requirements.pending_verification":
    "Seus documentos estão sendo analisados pelo Stripe. Isso pode levar alguns minutos.",
  "listed": "Sua conta foi sinalizada para revisão.",
  "platform_paused": "A plataforma pausou sua conta temporariamente.",
  "rejected.fraud": "Sua conta foi rejeitada por suspeita de fraude.",
  "rejected.listed": "Sua conta foi rejeitada por estar em lista restrita.",
  "rejected.terms_of_service": "Sua conta foi rejeitada por violação dos termos de uso.",
  "rejected.other": "Sua conta foi rejeitada. Entre em contato com o suporte.",
  "under_review": "Sua conta está em análise pelo Stripe.",
};

export interface AccountRestrictionInfo {
  reason: string;
  message: string;
  currentlyDue: string[];
  isPendingVerification: boolean;
}

export async function getAccountRestrictionInfo(
  accountId: string,
): Promise<AccountRestrictionInfo | null> {
  try {
    const account = await stripe.accounts.retrieve(accountId);

    if (account.charges_enabled) {
      return null;
    }

    const disabledReason = account.requirements?.disabled_reason ?? "";
    const currentlyDue = account.requirements?.currently_due ?? [];
    const isPendingVerification =
      disabledReason === "requirements.pending_verification";

    const message =
      DISABLED_REASON_MESSAGES[disabledReason] ??
      "Sua conta possui restrições. Complete a verificação para ativar.";

    return {
      reason: disabledReason,
      message,
      currentlyDue,
      isPendingVerification,
    };
  } catch {
    return null;
  }
}
