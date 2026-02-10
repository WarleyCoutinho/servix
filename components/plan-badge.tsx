"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Crown } from "lucide-react";
import Link from "next/link";

interface PlanBadgeProps {
  planName: string;
  isBasicPlan: boolean;
}

export function PlanBadge({ planName, isBasicPlan }: PlanBadgeProps) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Plano</span>
        </div>
        <Badge variant={isBasicPlan ? "secondary" : "default"}>{planName}</Badge>
      </div>
      {isBasicPlan && (
        <Button
          variant="link"
          size="sm"
          className="mt-2 h-auto w-full justify-start p-0 text-xs"
          asChild
        >
          <Link href="/dashboard/owner/subscription">
            <ArrowUpRight className="mr-1 h-3 w-3" />
            Fazer upgrade
          </Link>
        </Button>
      )}
    </div>
  );
}
