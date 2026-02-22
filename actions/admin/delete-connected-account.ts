"use server";

import { z } from "zod";
import { adminActionClient } from "@/lib/action-client";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { StripeAccountStatus } from "@/generated/prisma/enums";

const schema = z.object({
  accountId: z.string().min(1, "ID da conta é obrigatório"),
});

export const deleteConnectedAccount = adminActionClient
  .schema(schema)
  .action(async ({ parsedInput: { accountId } }) => {
    await stripe.accounts.del(accountId);

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
