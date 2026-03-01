import Link from "next/link";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { SidebarNavLink } from "@/components/sidebar-nav-link";
import { MobileSidebarSheet } from "@/components/mobile-sidebar-sheet";

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

function SidebarContent({
  title,
  subtitle,
  navItems,
  children,
}: DashboardSidebarProps) {
  return (
    <>
      <div className="flex h-16 items-center border-b px-4">
        <Link
          href="/home"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
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
          <SidebarNavLink key={item.href} href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </SidebarNavLink>
        ))}
      </nav>
      {children}
    </>
  );
}

export function DashboardSidebar(props: DashboardSidebarProps) {
  return (
    <>
      {/* Mobile: header com hamburger */}
      <div className="bg-card fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b px-4 md:hidden">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{props.title}</h2>
          <p className="text-muted-foreground truncate text-xs">
            {props.subtitle}
          </p>
        </div>
        <MobileSidebarSheet>
          <SidebarContent {...props} />
        </MobileSidebarSheet>
      </div>

      {/* Desktop: sidebar fixa */}
      <aside className="bg-card hidden w-64 shrink-0 border-r md:sticky md:top-0 md:block md:h-screen md:overflow-y-auto">
        <SidebarContent {...props} />
      </aside>
    </>
  );
}
