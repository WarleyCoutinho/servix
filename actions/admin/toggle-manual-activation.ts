"use server";

import { supportActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { StripeAccountStatus } from "@/generated/prisma/enums";
import { getAccountStatus } from "@/lib/stripe-connect";
import z from "zod";

const inputSchema = z
  .object({
    professionalId: z.string().uuid(),
    activate: z.boolean(),
    reason: z.enum(["STRIPE_ISSUE", "PROFESSIONAL_CHOICE"]).optional(),
  })
  .refine(
    (data) => !data.activate || data.reason !== undefined,
    { message: "Motivo é obrigatório ao ativar", path: ["reason"] },
  );

export const toggleManualActivation = supportActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { professionalId, activate, reason }, ctx }) => {
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: {
        id: true,
        userId: true,
        stripeAccountId: true,
        stripeAccountStatus: true,
        acceptsPayAfterService: true,
        displayName: true,
      },
    });

    if (!professional) {
      throw new Error("Profissional não encontrado");
    }

    const result = await prisma.$transaction(async (tx) => {
      let newStripeStatus: StripeAccountStatus;

      if (activate) {
        newStripeStatus =
          reason === "STRIPE_ISSUE"
            ? StripeAccountStatus.ACTIVE
            : StripeAccountStatus.DISABLED;

        await tx.professional.update({
          where: { id: professionalId },
          data: {
            acceptsPayAfterService: true,
            stripeAccountStatus: newStripeStatus,
          },
        });
      } else {
        if (professional.stripeAccountId) {
          newStripeStatus = await getAccountStatus(professional.stripeAccountId);
        } else {
          newStripeStatus = StripeAccountStatus.PENDING;
        }

        await tx.professional.update({
          where: { id: professionalId },
          data: {
            acceptsPayAfterService: false,
            stripeAccountStatus: newStripeStatus,
          },
        });
      }

      await tx.manualActivationLog.create({
        data: {
          action: activate
            ? "MANUAL_ACTIVATION_ENABLED"
            : "MANUAL_ACTIVATION_DISABLED",
          reason: reason ?? null,
          stripeStatusAtMoment: professional.stripeAccountStatus,
          professionalId,
          performedById: ctx.user.id,
          performedByRole: ctx.user.role ?? "admin",
        },
      });

      await tx.notification.create({
        data: {
          userId: professional.userId,
          title: activate
            ? "Acesso manual ativado"
            : "Acesso manual desativado",
          message: activate
            ? "Seu acesso ao sistema foi ativado manualmente pela equipe. Você pode continuar usando o sistema, porém sem os benefícios da Stripe."
            : "Seu acesso manual foi desativado. Seu acesso agora depende exclusivamente do status da sua conta Stripe.",
        },
      });

      return {
        professionalId,
        acceptsPayAfterService: activate,
        stripeAccountStatus: newStripeStatus,
        reason,
      };
    });

    return result;
  });
