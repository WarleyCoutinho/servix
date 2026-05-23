import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasGoogleCalendarScope } from "@/lib/google-scopes";
import { GoogleCalendarReconnectAlert } from "@/components/google-calendar-reconnect-alert";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) return children;

  const professional = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  let needsCalendarPermission = false;

  if (professional) {
    const [user, account] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { googleCalendarNeedsReconnect: true },
      }),
      prisma.account.findFirst({
        where: { userId: session.user.id, providerId: "google" },
        select: { scope: true },
      }),
    ]);

    needsCalendarPermission =
      !!user?.googleCalendarNeedsReconnect ||
      !hasGoogleCalendarScope(account?.scope);
  }

  return (
    <>
      {needsCalendarPermission && <GoogleCalendarReconnectAlert />}
      {children}
    </>
  );
}
