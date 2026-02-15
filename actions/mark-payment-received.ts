"use server";

import { z } from "zod";
import { protectedActionClient } from "@/lib/action-client";
import { returnValidationErrors } from "next-safe-action";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";

const inputSchema = z.object({
  paymentId: z.uuid(),
});

export const markPaymentReceived = protectedActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { paymentId }, ctx: { user } }) => {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { professional: { select: { userId: true } } },
    });

    if (!payment) {
      returnValidationErrors(inputSchema, {
        _errors: ["Pagamento não encontrado."],
      });
    }

    if (payment.professional?.userId !== user.id) {
      returnValidationErrors(inputSchema, {
        _errors: ["Você não tem permissão para alterar este pagamento."],
      });
    }

    if (payment.paymentMethod !== "pay_after_service") {
      returnValidationErrors(inputSchema, {
        _errors: ["Este pagamento não é do tipo presencial."],
      });
    }

    if (payment.status !== PaymentStatus.PENDING) {
      returnValidationErrors(inputSchema, {
        _errors: ["Este pagamento já foi processado."],
      });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.SUCCEEDED },
    });

    revalidatePath("/dashboard/professional/bookings");
    revalidatePath("/dashboard/professional/payments");
    return updatedPayment;
  });
