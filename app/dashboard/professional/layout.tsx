import { DashboardSidebar, type NavItem } from "@/components/dashboard-sidebar";
import { StripeWarningBanner } from "@/components/stripe-warning-banner";
import { SupportChat } from "@/components/support-chat";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getUserPlanInfo } from "@/lib/plan-limits";
import { prisma } from "@/lib/prisma";
import { getAccountRestrictionInfo } from "@/lib/stripe-connect";
import { AlertTriangle, Clock, CreditCard } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

const navItems: NavItem[] = [
  {
    href: "/dashboard/professional",
    label: "Visão Geral",
    icon: "LayoutDashboard",
  },
  {
    href: "/dashboard/professional/schedule",
    label: "Minha Agenda",
    icon: "Clock",
  },
  {
    href: "/dashboard/professional/bookings",
    label: "Agendamentos",
    icon: "Calendar",
  },
  {
    href: "/dashboard/professional/payments",
    label: "Pagamentos",
    icon: "DollarSign",
  },
  {
    href: "/dashboard/professional/settings",
    label: "Configurações",
    icon: "Settings",
  },
];

export default async function ProfessionalDashboardLayout({
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
      professional: {
        include: { barbershop: true },
      },
    },
  });

  if (user?.role !== UserRole.professional && user?.role !== UserRole.owner) {
    redirect("/");
  }

  if (!user.professional) {
    redirect("/onboarding/professional");
  }

  const professional = user.professional;

  const planInfo = professional.barbershop.ownerId
    ? await getUserPlanInfo(
        professional.barbershop.ownerId,
        professional.barbershopId,
      )
    : null;
  const userPlan = planInfo?.plan ?? "BASIC";

  const restrictionInfo =
    professional.stripeAccountId &&
    professional.stripeAccountStatus === "RESTRICTED"
      ? await getAccountRestrictionInfo(professional.stripeAccountId)
      : null;

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        title={professional.displayName ?? user.name}
        subtitle={professional.barbershop.name}
        navItems={navItems}
      >
        {!professional.stripeOnboardingComplete && (
          <div className="alert-warning m-4 rounded-lg border p-4">
            <p className="mb-2 text-sm font-medium">
              Configure sua conta para receber pagamentos
            </p>
            <p className="mb-3 text-xs opacity-80">
              Para receber pagamentos, configure sua conta para transferências
              diretas. Assim, você pode receber seus ganhos diretamente em sua
              conta bancária, sem intermediários.
            </p>
            <Button size="sm" asChild className="w-full">
              <Link href="/onboarding/professional">
                <CreditCard className="mr-2 h-4 w-4" />
                Configurar
              </Link>
            </Button>
          </div>
        )}
        {professional.stripeOnboardingComplete &&
          professional.stripeAccountStatus === "RESTRICTED" &&
          restrictionInfo &&
          (restrictionInfo.isPendingVerification ? (
            <div className="m-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Documentos em analise
                </p>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {restrictionInfo.message}
              </p>
            </div>
          ) : (
            <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Conta restrita
                </p>
              </div>
              <p className="mb-3 text-xs text-red-600 dark:text-red-400">
                {restrictionInfo.message}
              </p>
              <Button
                size="sm"
                asChild
                className="w-full"
                variant="destructive"
              >
                <Link href="/onboarding/professional">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Completar verificação
                </Link>
              </Button>
            </div>
          ))}
        {professional.stripeOnboardingComplete &&
          professional.stripeAccountStatus === "PENDING" && (
            <div className="m-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
              <p className="mb-1 text-sm font-medium text-blue-800 dark:text-blue-200">
                Verificação em andamento
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                O Stripe está verificando seus dados. Sua conta será ativada
                automaticamente quando a verificação for concluída.
              </p>
            </div>
          )}
        {professional.acceptsPayAfterService &&
          professional.stripeAccountStatus !== "ACTIVE" && (
            <StripeWarningBanner userPlan={userPlan} />
          )}
      </DashboardSidebar>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-4 pb-8 pt-16 sm:p-6 sm:pb-8 md:pt-6">
          {children}
        </div>
      </main>
      <SupportChat
        userPlan={userPlan}
        userName={professional.displayName ?? user.name}
      />
    </div>
  );
}
