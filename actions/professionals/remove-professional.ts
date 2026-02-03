"use server";

import { z } from "zod";
import { subscribedOwnerActionClient } from "@/lib/action-client";
import { returnValidationErrors } from "next-safe-action";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isFuture } from "date-fns";

const inputSchema = z.object({
  professionalId: z.uuid(),
});

export const removeProfessional = subscribedOwnerActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { professionalId }, ctx: { barbershop } }) => {
    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      include: {
        bookings: {
          where: {
            cancelledAt: null,
          },
        },
        user: true,
      },
    });

    if (!professional) {
      returnValidationErrors(inputSchema, {
        professionalId: { _errors: ["Profissional não encontrado."] },
      });
    }

    if (professional.barbershopId !== barbershop.id) {
      returnValidationErrors(inputSchema, {
        _errors: ["Você não tem permissão para remover este profissional."],
      });
    }

    const futureBookings = professional.bookings.filter((booking) =>
      isFuture(booking.date),
    );

    if (futureBookings.length > 0) {
      returnValidationErrors(inputSchema, {
        _errors: [
          `Este profissional possui ${futureBookings.length} agendamento(s) futuro(s). Cancele-os antes de remover o profissional.`,
        ],
      });
    }

    await prisma.professional.delete({
      where: { id: professionalId },
    });

    await prisma.user.update({
      where: { id: professional.userId },
      data: { role: "CLIENT" },
    });

    revalidatePath("/dashboard/owner/professionals");
    return { success: true };
  });
