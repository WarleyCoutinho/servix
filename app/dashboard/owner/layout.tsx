import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import { DashboardSidebar, type NavItem } from "@/components/dashboard-sidebar";
import { BarbershopSelector } from "@/components/barbershop-selector";
import { StripeWarningBanner } from "@/components/stripe-warning-banner";
import { getUserPlanInfo } from "@/lib/plan-limits";
import { PlanBadge } from "@/components/plan-badge";
import { SupportChat } from "@/components/support-chat";

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
      professional: {
        select: {
          acceptsPayAfterService: true,
          stripeAccountStatus: true,
        },
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
    { href: "/dashboard/owner", label: "Visão Geral", icon: "LayoutDashboard" },
  ];

  if (planInfo?.canHaveMultipleBarbershops) {
    navItems.push({
      href: "/dashboard/owner/establishments",
      label: "Minhas Lojas",
      icon: "Store",
    });
  }

  navItems.push({
    href: "/dashboard/owner/professionals",
    label: "Minha Equipe",
    icon: "Users",
  });

  navItems.push(
    {
      href: "/dashboard/owner/services",
      label: "Meus Serviços",
      icon: "Scissors",
    },
    {
      href: "/dashboard/owner/subscription",
      label: "Assinatura",
      icon: "CreditCard",
    },
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
        {user.professional?.acceptsPayAfterService &&
          user.professional.stripeAccountStatus !== "ACTIVE" && (
            <StripeWarningBanner userPlan={planInfo?.plan ?? "BASIC"} />
          )}
      </DashboardSidebar>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-4 pb-8 pt-16 sm:p-6 sm:pb-8 md:pt-6">
          {children}
        </div>
      </main>
      <SupportChat userPlan={planInfo?.plan ?? "BASIC"} userName={user.name} />
    </div>
  );
}
