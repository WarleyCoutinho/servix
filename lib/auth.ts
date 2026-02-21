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
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  databaseHooks: {
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
