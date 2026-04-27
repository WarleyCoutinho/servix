"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarNavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function SidebarNavLink({
  href,
  children,
  onClick,
}: SidebarNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start rounded-lg transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
          : "hover:bg-muted/50",
      )}
      asChild
    >
      <Link href={href} onClick={onClick}>
        {children}
      </Link>
    </Button>
  );
}
