"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "radix-ui";
import { SidebarContent, type NavItem } from "@/components/dashboard-sidebar";

interface DashboardMobileHeaderProps {
  title: string;
  subtitle: string;
  navItems: NavItem[];
  children?: React.ReactNode;
}

export function DashboardMobileHeader({
  title,
  subtitle,
  navItems,
  children,
}: DashboardMobileHeaderProps) {
  const [open, setOpen] = useState(false);

  const navItemsWithClose = navItems.map((item) => ({
    ...item,
    onNavigate: () => setOpen(false),
  }));

  return (
    <div className="bg-card fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b px-4 md:hidden">
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 touch-manipulation"
          >
            <Menu className="size-5" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 p-0 overflow-y-auto will-change-transform"
        >
          <VisuallyHidden.Root>
            <SheetTitle>Menu de navegação</SheetTitle>
          </VisuallyHidden.Root>
          <SidebarContent
            title={title}
            subtitle={subtitle}
            navItems={navItemsWithClose}
          >
            {children}
          </SidebarContent>
        </SheetContent>
      </Sheet>
    </div>
  );
}
