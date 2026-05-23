// lib/google-calendar.ts
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { hasGoogleCalendarScope } from "@/lib/google-scopes";

export async function getCalendarClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "google",
    },
  });

  if (!account?.accessToken) {
    throw new Error("GOOGLE_NOT_CONNECTED");
  }

  if (!hasGoogleCalendarScope(account.scope)) {
    throw new Error("GOOGLE_RECONNECT_REQUIRED");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.accessTokenExpiresAt?.getTime(),
  });

  oauth2Client.on("tokens", async (tokens) => {
    await prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        ...(tokens.access_token && {
          accessToken: tokens.access_token,
        }),

        ...(tokens.refresh_token && {
          refreshToken: tokens.refresh_token,
        }),

        ...(tokens.expiry_date && {
          accessTokenExpiresAt: new Date(tokens.expiry_date),
        }),
      },
    });
  });

  return google.calendar({
    version: "v3",
    auth: oauth2Client,
  });
}

export type RecurrenceType = "none" | "weekly" | "monthly" | "yearly";

interface CreateCalendarEventParams {
  professionalUserId: string;
  clientName: string;
  clientEmail?: string | null;
  serviceName: string;
  startTime: Date;
  durationMinutes: number;
  recurrence: RecurrenceType;
  recurrenceCount?: number;
}

export async function createCalendarEvent(params: CreateCalendarEventParams) {
  const calendar = await getCalendarClient(params.professionalUserId);

  const endTime = new Date(
    params.startTime.getTime() + params.durationMinutes * 60_000,
  );

  const rruleMap: Record<RecurrenceType, string | null> = {
    none: null,

    weekly: `RRULE:FREQ=WEEKLY${
      params.recurrenceCount ? `;COUNT=${params.recurrenceCount}` : ""
    }`,

    monthly: `RRULE:FREQ=MONTHLY${
      params.recurrenceCount ? `;COUNT=${params.recurrenceCount}` : ""
    }`,

    yearly: `RRULE:FREQ=YEARLY${
      params.recurrenceCount ? `;COUNT=${params.recurrenceCount}` : ""
    }`,
  };

  const rrule = rruleMap[params.recurrence];

  try {
    const event = await calendar.events.insert({
      calendarId: "primary",

      sendUpdates: params.clientEmail ? "all" : "none",

      requestBody: {
        summary: `${params.serviceName} — ${params.clientName}`,

        description: `Agendamento Servix\nCliente: ${params.clientName}`,

        start: {
          dateTime: params.startTime.toISOString(),

          timeZone: "America/Sao_Paulo",
        },

        end: {
          dateTime: endTime.toISOString(),

          timeZone: "America/Sao_Paulo",
        },

        ...(params.clientEmail && {
          attendees: [
            {
              email: params.clientEmail,

              displayName: params.clientName,

              responseStatus: "accepted",
            },
          ],
        }),

        ...(rrule && {
          recurrence: [rrule],
        }),

        reminders: {
          useDefault: false,

          overrides: [
            {
              method: "email",
              minutes: 1440,
            },

            {
              method: "popup",
              minutes: 60,
            },

            {
              method: "popup",
              minutes: 15,
            },
          ],
        },

        colorId: "2",
      },
    });

    return {
      googleEventId: event.data.id!,

      googleRecurrenceId: rrule ? event.data.id! : null,

      htmlLink: event.data.htmlLink,
    };
  } catch (error: unknown) {
    console.error("❌ Google Calendar API Error:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      "response" in error
    ) {
      const status = error.status;

      const response = error.response;

      const message =
        typeof response === "object" &&
        response !== null &&
        "data" in response &&
        typeof response.data === "object" &&
        response.data !== null &&
        "error" in response.data &&
        typeof response.data.error === "object" &&
        response.data.error !== null &&
        "message" in response.data.error
          ? String(response.data.error.message).toLowerCase()
          : "";

      if (
        status === 403 &&
        message.includes("insufficient authentication scopes")
      ) {
        throw new Error("GOOGLE_RECONNECT_REQUIRED");
      }
    }

    throw error;
  }
}

export async function deleteCalendarEvent(
  professionalUserId: string,
  googleEventId: string,
  deleteAll = false,
) {
  try {
    const calendar = await getCalendarClient(professionalUserId);

    if (deleteAll) {
      const event = await calendar.events.get({
        calendarId: "primary",
        eventId: googleEventId,
      });

      const seriesId = event.data.recurringEventId ?? googleEventId;

      await calendar.events.delete({
        calendarId: "primary",
        eventId: seriesId,
      });
    } else {
      await calendar.events.delete({
        calendarId: "primary",
        eventId: googleEventId,
      });
    }
  } catch (error: unknown) {
    console.error("❌ Erro ao deletar evento do Google Calendar:", error);
  }
}
