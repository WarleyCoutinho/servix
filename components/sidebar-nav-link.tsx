"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarNavLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SidebarNavLink({ href, children }: SidebarNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start rounded-lg",
        isActive &&
          "bg-primary/10 text-primary font-medium border-l-2 border-primary",
      )}
      asChild
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}
