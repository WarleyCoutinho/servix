import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma, safeQuery } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import { LayoutDashboard, Headset, Link2 } from "lucide-react";
import {
  DashboardSidebar,
  type NavItem,
} from "@/components/dashboard-sidebar";

const navItems: NavItem[] = [
  { href: "/dashboard/support", label: "Visao Geral", icon: LayoutDashboard },
  { href: "/dashboard/support/tickets", label: "Tickets", icon: Headset },
  { href: "/dashboard/support/connected-accounts", label: "Contas Conectadas", icon: Link2 },
];

export default async function SupportDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await auth.api.getSession({
      headers: await headers(),
    });
  } catch {
    redirect("/");
  }

  if (!session?.user) {
    redirect("/");
  }

  const { data: user } = await safeQuery(
    () => prisma.user.findUnique({ where: { id: session.user.id } }),
    null,
  );

  if (user?.role !== UserRole.support && user?.role !== UserRole.admin) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        title="Servix Suporte"
        subtitle="Painel de Atendimento"
        navItems={navItems}
      />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-4 pt-16 sm:p-6 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
