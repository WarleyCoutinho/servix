// actions/create-booking.ts
"use server";

import { actionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  createCalendarEvent,
  type RecurrenceType,
} from "@/lib/google-calendar";
import { hasGoogleCalendarScope } from "@/lib/google-scopes";
import { headers } from "next/headers";
import { z } from "zod";

const schema = z.object({
  date: z.coerce.date(),
  serviceId: z.string(),
  professionalId: z.string(),
  payAfterService: z.boolean().optional().default(false),
  clientName: z.string().min(2).optional(),
  clientPhone: z.string().optional().nullable(),
  clientEmail: z.string().email().optional().nullable(),
  recurrence: z.enum(["none", "weekly", "monthly", "yearly"]).default("none"),
  recurrenceCount: z.number().int().min(1).max(52).optional(),
});

export const createBooking = actionClient
  .schema(schema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) throw new Error("Unauthorized");

    if (parsedInput.clientPhone) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          phone: parsedInput.clientPhone,
        },
      });
    }
    const professional = await prisma.professional.findUniqueOrThrow({
      where: { id: parsedInput.professionalId },
      include: { user: true, barbershop: true },
    });

    const service = await prisma.barbershopService.findUniqueOrThrow({
      where: { id: parsedInput.serviceId },
    });
    console.log("PHONE RECEBIDO:", parsedInput.clientPhone);
    // 1. Salva no Prisma (fonte de verdade)
    const booking = await prisma.booking.create({
      data: {
        date: parsedInput.date,
        barbershopId: professional.barbershopId,
        serviceId: parsedInput.serviceId,
        userId: session.user.id,
        professionalId: parsedInput.professionalId,
        clientName: parsedInput.clientName,
        clientPhone: parsedInput.clientPhone ?? null,
        isRecurring: parsedInput.recurrence !== "none",
        recurrenceRule:
          parsedInput.recurrence !== "none"
            ? `FREQ=${parsedInput.recurrence.toUpperCase()}${parsedInput.recurrenceCount ? `;COUNT=${parsedInput.recurrenceCount}` : ""}`
            : null,
      },
    });

    const clientEmail =
      parsedInput.clientEmail ??
      (session.user.id !== professional.userId ? session.user.email : null);

    const isClientBooking = session.user.id !== professional.userId;

    // 2. Cria na agenda do PROFISSIONAL (non-fatal)
    try {
      const calendarEvent = await createCalendarEvent({
        professionalUserId: professional.userId,
        clientName: parsedInput.clientName ?? session.user.name,
        clientEmail,
        serviceName: service.name,
        startTime: parsedInput.date,
        durationMinutes: service.durationMinutes,
        recurrence: parsedInput.recurrence as RecurrenceType,
        recurrenceCount: parsedInput.recurrenceCount,
      });

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          googleEventId: calendarEvent.googleEventId,
          googleRecurrenceId: calendarEvent.googleRecurrenceId,
        },
      });
    } catch (error) {
      console.error("Google Calendar (profissional) sync failed:", error);

      if (
        error instanceof Error &&
        error.message === "GOOGLE_RECONNECT_REQUIRED"
      ) {
        await prisma.user.update({
          where: { id: professional.userId },
          data: { googleCalendarNeedsReconnect: true },
        });
      }
    }

    // 3. Cria na agenda do CLIENTE (non-fatal)
    // Só se o cliente está fazendo o próprio agendamento (não é o profissional)
    if (isClientBooking) {
      try {
        // Verifica se o cliente tem token Google com escopo do Calendar
        const clientAccount = await prisma.account.findFirst({
          where: { userId: session.user.id, providerId: "google" },
          select: { scope: true },
        });

        if (!hasGoogleCalendarScope(clientAccount?.scope)) {
          // Token antigo — marca pra mostrar alerta pro cliente
          await prisma.user.update({
            where: { id: session.user.id },
            data: { googleCalendarNeedsReconnect: true },
          });
        } else {
          const clientCalendarEvent = await createCalendarEvent({
            professionalUserId: session.user.id, // token do cliente
            clientName: session.user.name,
            clientEmail: null, // não precisa de attendee na agenda do próprio cliente
            serviceName: service.name,
            startTime: parsedInput.date,
            durationMinutes: service.durationMinutes,
            recurrence: parsedInput.recurrence as RecurrenceType,
            recurrenceCount: parsedInput.recurrenceCount,
          });

          // Salva o ID do evento do cliente separado
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              clientGoogleEventId: clientCalendarEvent.googleEventId,
            },
          });
        }
      } catch (error) {
        console.error("Google Calendar (cliente) sync failed:", error);

        if (
          error instanceof Error &&
          error.message === "GOOGLE_RECONNECT_REQUIRED"
        ) {
          await prisma.user.update({
            where: { id: session.user.id },
            data: { googleCalendarNeedsReconnect: true },
          });
        }
      }
    }

    return { bookingId: booking.id };
  });
