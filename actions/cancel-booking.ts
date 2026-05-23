// actions/cancel-booking.ts
"use server";

import { z } from "zod";
import { protectedActionClient } from "@/lib/action-client";
import { returnValidationErrors } from "next-safe-action";
import { prisma } from "@/lib/prisma";
import { isFuture } from "date-fns";
import { revalidatePath } from "next/cache";
import { stripe } from "@/lib/stripe";
import { PaymentStatus } from "@/generated/prisma/enums";
import { sendDailyScheduleToGroup } from "@/lib/whatsapp-schedule";
import { deleteCalendarEvent } from "@/lib/google-calendar";

const inputSchema = z.object({
  bookingId: z.uuid(),
});

export const cancelBooking = protectedActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { bookingId }, ctx: { user } }) => {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        professional: {
          include: { user: true },
        },
      },
    });

    if (!booking) {
      returnValidationErrors(inputSchema, {
        _errors: ["Agendamento não encontrado."],
      });
    }
    if (booking.userId !== user.id) {
      returnValidationErrors(inputSchema, {
        _errors: ["Você não tem permissão para cancelar este agendamento."],
      });
    }
    if (booking.cancelledAt) {
      returnValidationErrors(inputSchema, {
        _errors: ["Este agendamento já foi cancelado."],
      });
    }
    if (!isFuture(booking.date)) {
      returnValidationErrors(inputSchema, {
        _errors: ["Não é possível cancelar um agendamento passado."],
      });
    }

    if (
      booking.payment?.paymentMethod === "pay_after_service" &&
      booking.payment.status === PaymentStatus.PENDING
    ) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: { status: PaymentStatus.CANCELED },
      });
    } else if (
      booking.payment?.stripeChargeId &&
      booking.payment.status === PaymentStatus.SUCCEEDED
    ) {
      try {
        await stripe.refunds.create({
          charge: booking.payment.stripeChargeId,
          reason: "requested_by_customer",
        });
      } catch (error) {
        console.error("Erro ao processar o reembolso do agendamento", error);
        returnValidationErrors(inputSchema, {
          _errors: [
            "Erro ao processar o reembolso do agendamento. Por favor, tente novamente.",
          ],
        });
      }
    }

    const cancelledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { cancelledAt: new Date() },
    });

    // Deleta da agenda do PROFISSIONAL
    if (booking.googleEventId) {
      deleteCalendarEvent(
        booking.professional.userId,
        booking.googleEventId,
        booking.isRecurring,
      ).catch((err) =>
        console.error("Google Calendar (profissional) delete failed:", err),
      );
    }

    // Deleta da agenda do CLIENTE (se tiver evento criado lá)
    if (booking.clientGoogleEventId) {
      deleteCalendarEvent(
        booking.userId, // token do cliente
        booking.clientGoogleEventId,
        booking.isRecurring,
      ).catch((err) =>
        console.error("Google Calendar (cliente) delete failed:", err),
      );
    }

    // Enviar agenda atualizada ao WhatsApp
    sendDailyScheduleToGroup(booking.professionalId, booking.date).catch(
      (err) => console.error("[WhatsApp] Erro ao enviar agenda:", err),
    );

    revalidatePath("/");
    revalidatePath("/bookings");
    return cancelledBooking;
  });
