import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import {
  Users,
  Scissors,
  Clock,
  CreditCard,
  LayoutDashboard,
  Store,
} from "lucide-react";
import { DashboardSidebar, type NavItem } from "@/components/dashboard-sidebar";
import { BarbershopSelector } from "@/components/barbershop-selector";

const ACTIVE_BARBERSHOP_COOKIE = "active-barbershop-id";

const navItems: NavItem[] = [
  { href: "/dashboard/owner", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/dashboard/owner/establishments", label: "Estabelecimentos", icon: Store },
  { href: "/dashboard/owner/professionals", label: "Profissionais", icon: Users },
  { href: "/dashboard/owner/services", label: "Serviços", icon: Scissors },
  { href: "/dashboard/owner/schedule", label: "Horários", icon: Clock },
  { href: "/dashboard/owner/subscription", label: "Assinatura", icon: CreditCard },
];

export default async function OwnerDashboardLayout({
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
    include: { ownedBarbershops: true },
  });

  if (user?.role !== UserRole.owner && user?.role !== UserRole.owner_professional) {
    redirect("/");
  }

  if (user.ownedBarbershops.length === 0) {
    redirect("/onboarding/owner");
  }

  const cookieStore = await cookies();
  const activeBarbershopId = cookieStore.get(ACTIVE_BARBERSHOP_COOKIE)?.value;

  let activeBarbershop = user.ownedBarbershops.find(
    (b) => b.id === activeBarbershopId
  );

  if (!activeBarbershop) {
    activeBarbershop = user.ownedBarbershops[0];
  }

  const showSelector = user.ownedBarbershops.length > 1;

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        title={activeBarbershop.name}
        subtitle="Painel do Proprietário"
        navItems={navItems}
      >
        {showSelector && (
          <BarbershopSelector
            barbershops={user.ownedBarbershops}
            activeBarbershopId={activeBarbershop.id}
          />
        )}
      </DashboardSidebar>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
