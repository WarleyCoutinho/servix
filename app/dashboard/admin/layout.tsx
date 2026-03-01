import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma, safeQuery } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import { LayoutDashboard, CreditCard, Users, Settings, Headset, Link2, Percent } from "lucide-react";
import {
  DashboardSidebar,
  type NavItem,
} from "@/components/dashboard-sidebar";

const navItems: NavItem[] = [
  { href: "/dashboard/admin", label: "Visao Geral", icon: LayoutDashboard },
  { href: "/dashboard/admin/plans", label: "Planos", icon: CreditCard },
  { href: "/dashboard/admin/users", label: "Usuarios", icon: Users },
  { href: "/dashboard/admin/fees", label: "Taxas", icon: Percent },
  { href: "/dashboard/admin/connected-accounts", label: "Contas Conectadas", icon: Link2 },
  { href: "/dashboard/admin/support", label: "Suporte", icon: Headset },
  { href: "/dashboard/admin/settings", label: "Configuracoes", icon: Settings },
];

export default async function AdminDashboardLayout({
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
    null
  );

  if (user?.role !== UserRole.admin) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        title="Servix Admin"
        subtitle="Painel Administrativo"
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
