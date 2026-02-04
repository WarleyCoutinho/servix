import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { ac, clientRole, ownerRole, professionalRole } from "./permissions";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    admin({
      ac,
      roles: {
        owner: ownerRole,
        professional: professionalRole,
        client: clientRole,
      },
      defaultRole: "client",
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
