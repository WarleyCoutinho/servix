import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import { LayoutDashboard, CreditCard, Users, Settings } from "lucide-react";
import {
  DashboardSidebar,
  type NavItem,
} from "@/components/dashboard-sidebar";

const navItems: NavItem[] = [
  { href: "/dashboard/admin", label: "Visao Geral", icon: LayoutDashboard },
  { href: "/dashboard/admin/plans", label: "Planos", icon: CreditCard },
  { href: "/dashboard/admin/users", label: "Usuarios", icon: Users },
  { href: "/dashboard/admin/settings", label: "Configuracoes", icon: Settings },
];

export default async function AdminDashboardLayout({
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
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
