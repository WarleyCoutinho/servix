"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const filters = [
  { key: "all", label: "Todos" },
  { key: "stripe", label: "Stripe" },
  { key: "manual", label: "Recebidos manualmente" },
] as const;

export default function PaymentFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get("filter") || "all";

  const handleFilter = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (filter === "all") {
      params.delete("filter");
    } else {
      params.set("filter", filter);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.key}
          variant={currentFilter === filter.key ? "default" : "outline"}
          size="sm"
          onClick={() => handleFilter(filter.key)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
