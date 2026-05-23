import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import {
  ac,
  clientRole,
  ownerRole,
  professionalRole,
  supportRole,
} from "./permissions";
import { prisma } from "./prisma";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.NEXT_PUBLIC_APP_URL
    ? [process.env.NEXT_PUBLIC_APP_URL]
    : [],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false,
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          include_granted_scopes: "true",
        },
      },
    },
  },
  databaseHooks: {
    account: {
      update: {
        after: async (account) => {
          // Só interessa conta Google com escopos de Calendar
          if (account.providerId !== "google") return;
          if (!account.scope?.includes("calendar")) return;

          try {
            // Reseta flag de reconexão sempre que o token é atualizado
            await prisma.user.update({
              where: { id: account.userId },
              data: { googleCalendarNeedsReconnect: false },
            });

            // Watch só faz sentido para profissionais
            const professional = await prisma.professional.findUnique({
              where: { userId: account.userId },
              select: { id: true },
            });

            if (!professional) return;

            const user = await prisma.user.findUnique({
              where: { id: account.userId },
              select: { calendarWatchExpiry: true },
            });

            const needsWatch =
              !user?.calendarWatchExpiry ||
              user.calendarWatchExpiry < new Date();

            if (needsWatch) {
              const { watchCalendar } = await import("./calendar-watch");
              await watchCalendar(account.userId);
            }
          } catch (error) {
            // Silencioso — não quebra o login
            console.error("Calendar watch setup failed (non-fatal):", error);
          }
        },
      },
    },
    user: {
      create: {
        after: async (user) => {
          try {
            const invite = await prisma.supportInvite.findUnique({
              where: { email: user.email, accepted: false },
            });
            if (invite) {
              await prisma.user.update({
                where: { id: user.id },
                data: { role: "support" },
              });
              await prisma.supportInvite.update({
                where: { id: invite.id },
                data: { accepted: true },
              });
            }
          } catch (error) {
            console.error("Error checking support invite:", error);
          }
        },
      },
    },
  },
  plugins: [
    admin({
      ac,
      roles: {
        owner: ownerRole,
        professional: professionalRole,
        client: clientRole,
        support: supportRole,
      },
      defaultRole: "client",
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
