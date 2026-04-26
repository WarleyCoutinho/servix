// components/dashboard-mobile-header.tsx
"use client";

import MenuSheet from "@/components/menu-sheet";

interface DashboardMobileHeaderProps {
  title: string;
  subtitle: string;
}

export function DashboardMobileHeader({
  title,
  subtitle,
}: DashboardMobileHeaderProps) {
  return (
    <div className="bg-card fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b px-4 md:hidden">
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
      </div>
      {/* MenuSheet já lê a sessão internamente via authClient.useSession() */}
      <MenuSheet onLoginClick={() => {}} />
    </div>
  );
}
