"use server";

import { z } from "zod";
import { adminActionClient } from "@/lib/action-client";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { StripeAccountStatus } from "@/generated/prisma/enums";

const schema = z.object({
  accountId: z.string().min(1, "ID da conta é obrigatório"),
});

export const deleteConnectedAccount = adminActionClient
  .schema(schema)
  .action(async ({ parsedInput: { accountId } }) => {
    const stripeClient = getStripe();
    const account = await stripeClient.accounts.retrieve(accountId);

    if (account.type !== "standard") {
      try {
        await stripeClient.accounts.del(accountId);
      } catch (error: unknown) {
        const isV2Account =
          error instanceof Error &&
          error.message.includes("v2/core/accounts") &&
          error.message.includes("close");

        if (isV2Account) {
          await stripeClient.rawRequest(
            "POST",
            `/v2/core/accounts/${accountId}/close`,
            {},
            { apiVersion: "2025-03-31.preview" },
          );
        } else {
          throw error;
        }
      }
    }

    const professional = await prisma.professional.findUnique({
      where: { stripeAccountId: accountId },
    });

    if (professional) {
      await prisma.professional.update({
        where: { id: professional.id },
        data: {
          stripeAccountId: null,
          stripeAccountStatus: StripeAccountStatus.DISABLED,
          stripeOnboardingComplete: false,
        },
      });
    }

    return { deletedId: accountId };
  });
