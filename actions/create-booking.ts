"use server";

import { z } from "zod";
import { protectedActionClient } from "@/lib/action-client";
import { returnValidationErrors } from "next-safe-action";
import { prisma } from "@/lib/prisma";
import { isPast } from "date-fns";

const inputSchema = z.object({
  serviceId: z.uuid(),
  professionalId: z.uuid(),
  date: z.date(),
});

export const createBooking = protectedActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { serviceId, professionalId, date }, ctx: { user } }) => {
    if (isPast(date)) {
      returnValidationErrors(inputSchema, {
        _errors: ["Data e hora selecionadas já passaram."],
      });
    }
    const service = await prisma.barbershopService.findUnique({
      where: {
        id: serviceId,
      },
    });
    if (!service) {
      returnValidationErrors(inputSchema, {
        _errors: [
          "Serviço não encontrado. Por favor, selecione outro serviço.",
        ],
      });
    }

    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
    });
    if (!professional || !professional.isActive) {
      returnValidationErrors(inputSchema, {
        _errors: ["Profissional não encontrado ou indisponível."],
      });
    }
    if (professional.barbershopId !== service.barbershopId) {
      returnValidationErrors(inputSchema, {
        _errors: ["Profissional não pertence a esta barbearia."],
      });
    }

    const existingBooking = await prisma.booking.findFirst({
      where: {
        professionalId,
        date,
        cancelledAt: null,
      },
    });
    if (existingBooking) {
      returnValidationErrors(inputSchema, {
        _errors: ["Este profissional já possui agendamento neste horário."],
      });
    }
    const booking = await prisma.booking.create({
      data: {
        serviceId,
        professionalId,
        date: date.toISOString(),
        userId: user.id,
        barbershopId: service.barbershopId,
      },
    });
    return booking;
  });
