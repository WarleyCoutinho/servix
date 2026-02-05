import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Clock,
  Calendar,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { DashboardSidebar, type NavItem } from "@/components/dashboard-sidebar";

const navItems: NavItem[] = [
  { href: "/dashboard/professional", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/dashboard/professional/schedule", label: "Minha Agenda", icon: Clock },
  { href: "/dashboard/professional/bookings", label: "Agendamentos", icon: Calendar },
  { href: "/dashboard/professional/payments", label: "Pagamentos", icon: DollarSign },
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

  if (user?.role !== UserRole.professional || !user.professional) {
    redirect("/");
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
          <div className="m-4 rounded-lg border border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-950">
            <p className="mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Configure seu Stripe
            </p>
            <p className="mb-3 text-xs text-yellow-700 dark:text-yellow-300">
              Para receber pagamentos, configure sua conta Stripe.
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
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
