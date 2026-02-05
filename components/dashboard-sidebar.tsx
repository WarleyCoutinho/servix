import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardSidebarProps {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  children?: React.ReactNode;
}

export function DashboardSidebar({
  title,
  subtitle,
  navItems,
  children,
}: DashboardSidebarProps) {
  return (
    <aside className="w-64 border-r bg-card">
      <div className="flex h-16 items-center border-b px-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>
      <div className="p-4">
        <h2 className="mb-1 text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
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
      {children}
    </aside>
  );
}
