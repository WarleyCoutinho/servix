import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import {
  LayoutDashboard,
  CalendarDays,
} from "lucide-react";
import { DashboardSidebar, type NavItem } from "@/components/dashboard-sidebar";

const navItems: NavItem[] = [
  { href: "/dashboard/client", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/bookings", label: "Meus Agendamentos", icon: CalendarDays },
];

export default async function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.role !== UserRole.client) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        title={user.name}
        subtitle="Meu Painel"
        navItems={navItems}
      />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-4 pb-8 pt-16 sm:p-6 sm:pb-8 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
