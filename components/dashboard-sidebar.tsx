import Link from "next/link";
import {
  ChevronLeft,
  LayoutDashboard,
  Clock,
  Calendar,
  DollarSign,
  Settings,
  Store,
  Users,
  Scissors,
  CreditCard,
  Percent,
  Link2,
  Headset,
  CalendarDays,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";
import { SidebarNavLink } from "@/components/sidebar-nav-link";
import { DashboardMobileHeader } from "./dashboard-mobile-header";

export type NavIconKey =
  | "LayoutDashboard"
  | "Clock"
  | "Calendar"
  | "CalendarDays"
  | "DollarSign"
  | "Settings"
  | "Store"
  | "Users"
  | "Scissors"
  | "CreditCard"
  | "Percent"
  | "Link2"
  | "Headset"
  | "MessageCircle";

export const navIconMap: Record<NavIconKey, LucideIcon> = {
  LayoutDashboard,
  Clock,
  Calendar,
  CalendarDays,
  DollarSign,
  Settings,
  Store,
  Users,
  Scissors,
  CreditCard,
  Percent,
  Link2,
  Headset,
  MessageCircle,
};

export interface NavItem {
  href: string;
  label: string;
  icon: NavIconKey;
  onNavigate?: () => void;
}

interface DashboardSidebarProps {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  children?: React.ReactNode;
}

export function SidebarContent({
  title,
  subtitle,
  navItems,
  children,
}: DashboardSidebarProps) {
  return (
    <>
      <div className="flex h-16 items-center border-b px-4">
        <Link
          href="/bookings"
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
        {navItems.map((item) => {
          const Icon = navIconMap[item.icon];
          return (
            <SidebarNavLink
              key={item.href}
              href={item.href}
              onClick={item.onNavigate}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </SidebarNavLink>
          );
        })}
      </nav>
      {children}
    </>
  );
}

export function DashboardSidebar(props: DashboardSidebarProps) {
  return (
    <>
      <DashboardMobileHeader
        title={props.title}
        subtitle={props.subtitle}
        navItems={props.navItems}
      >
        {props.children}
      </DashboardMobileHeader>

      <aside className="bg-card hidden w-64 shrink-0 border-r md:sticky md:top-0 md:block md:h-screen md:overflow-y-auto">
        <SidebarContent {...props} />
      </aside>
    </>
  );
}
