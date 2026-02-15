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
import { getUserPlanInfo } from "@/lib/plan-limits";
import { PlanBadge } from "@/components/plan-badge";

const ACTIVE_BARBERSHOP_COOKIE = "active-barbershop-id";

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
    include: {
      ownedBarbershops: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (user?.role !== UserRole.owner) {
    redirect("/");
  }

  if (user.ownedBarbershops.length === 0) {
    redirect("/onboarding/owner");
  }

  const activeBarbershops = user.ownedBarbershops.filter((b) => b.isActive);

  if (activeBarbershops.length === 0) {
    redirect("/dashboard/owner/subscription");
  }

  const cookieStore = await cookies();
  const activeBarbershopId = cookieStore.get(ACTIVE_BARBERSHOP_COOKIE)?.value;

  let activeBarbershop = activeBarbershops.find(
    (b) => b.id === activeBarbershopId,
  );

  if (!activeBarbershop) {
    activeBarbershop = activeBarbershops[0];
  }

  const planInfo = await getUserPlanInfo(user.id, activeBarbershop.id);

  const navItems: NavItem[] = [
    { href: "/dashboard/owner", label: "Visão Geral", icon: LayoutDashboard },
  ];

  if (planInfo?.canHaveMultipleBarbershops) {
    navItems.push({
      href: "/dashboard/owner/establishments",
      label: "Estabelecimentos",
      icon: Store,
    });
  }

  navItems.push({
    href: "/dashboard/owner/professionals",
    label: "Profissionais",
    icon: Users,
  });

  navItems.push(
    { href: "/dashboard/owner/services", label: "Serviços", icon: Scissors },
    { href: "/dashboard/owner/schedule", label: "Horários", icon: Clock },
    { href: "/dashboard/owner/subscription", label: "Assinatura", icon: CreditCard },
  );

  const showSelector = activeBarbershops.length > 1;

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        title={activeBarbershop.name}
        subtitle="Painel do Proprietário"
        navItems={navItems}
      >
        <div className="space-y-3">
          {planInfo && (
            <PlanBadge
              planName={planInfo.planName}
              isBasicPlan={planInfo.isBasicPlan}
            />
          )}
          {showSelector && (
            <BarbershopSelector
              barbershops={activeBarbershops}
              activeBarbershopId={activeBarbershop.id}
            />
          )}
        </div>
      </DashboardSidebar>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-4 pt-16 sm:p-6 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
