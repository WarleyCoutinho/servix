import { DashboardSidebar, type NavItem } from "@/components/dashboard-sidebar";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  LayoutDashboard,
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

const navItems: NavItem[] = [
  {
    href: "/dashboard/professional",
    label: "Visão Geral",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/professional/schedule",
    label: "Minha Agenda",
    icon: Clock,
  },
  {
    href: "/dashboard/professional/bookings",
    label: "Agendamentos",
    icon: Calendar,
  },
  {
    href: "/dashboard/professional/payments",
    label: "Pagamentos",
    icon: DollarSign,
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
      </DashboardSidebar>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-4 pt-16 sm:p-6 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
