"use client";

import { setActiveBarbershop } from "@/actions/barbershops/set-active-barbershop";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Barbershop {
  id: string;
  name: string;
  isActive: boolean;
}

interface BarbershopSelectorProps {
  barbershops: Barbershop[];
  activeBarbershopId: string;
}

export function BarbershopSelector({
  barbershops,
  activeBarbershopId,
}: BarbershopSelectorProps) {
  const router = useRouter();

  const { execute, isPending } = useAction(setActiveBarbershop, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success(data.message);
        router.refresh();
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao trocar de loja");
    },
  });

  const handleChange = (barbershopId: string) => {
    if (barbershopId !== activeBarbershopId) {
      execute({ barbershopId });
    }
  };

  return (
    <div className="border-t p-4">
      <label className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-medium">
        <Store className="h-3 w-3" />
        Trocar Loja
      </label>
      <Select
        value={activeBarbershopId}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione uma loja" />
        </SelectTrigger>
        <SelectContent>
          {barbershops.map((barbershop) => (
            <SelectItem
              key={barbershop.id}
              value={barbershop.id}
              disabled={!barbershop.isActive}
              className={!barbershop.isActive ? "opacity-50" : ""}
            >
              {barbershop.name}
              {!barbershop.isActive && " (Desativado)"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
