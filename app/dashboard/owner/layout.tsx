import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Users,
  Scissors,
  Clock,
  CreditCard,
  LayoutDashboard,
  ChevronLeft,
} from "lucide-react";

const navItems = [
  { href: "/dashboard/owner", label: "Visão Geral", icon: LayoutDashboard },
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
    include: { ownedBarbershop: true },
  });

  if (user?.role !== UserRole.OWNER || !user.ownedBarbershop) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-card">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
        <div className="p-4">
          <h2 className="mb-1 text-lg font-semibold">{user.ownedBarbershop.name}</h2>
          <p className="text-sm text-muted-foreground">Painel do Proprietário</p>
        </div>
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className="w-full justify-start"
              asChild
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
