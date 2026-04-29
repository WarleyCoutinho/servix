"use client";

import { cn } from "@/lib/utils";
import { Calendar, Clock, Users } from "lucide-react";

export type ScheduleViewType = "DEFAULT" | "RECENT" | "CONTINUOUS";

interface ScheduleViewSelectorProps {
  value: ScheduleViewType;
  onChange: (value: ScheduleViewType) => void;
  disabled?: boolean;
}

const OPTIONS: {
  value: ScheduleViewType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "DEFAULT",
    label: "Agenda Padrão",
    description: "Exibe todos os slots do dia, do início ao fim do expediente.",
    icon: Calendar,
  },
  {
    value: "RECENT",
    label: "Agenda Recente",
    description:
      "Exibe apenas os slots a partir de 30 min antes do horário atual.",
    icon: Clock,
  },
  {
    value: "CONTINUOUS",
    label: "Agenda Corrida",
    description: "Exibe slots com vagas simultâneas para múltiplos clientes.",
    icon: Users,
  },
];

export function ScheduleViewSelector({
  value,
  onChange,
  disabled,
}: ScheduleViewSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
              isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                isSelected ? "bg-primary/15" : "bg-muted",
              )}
            >
              <Icon
                size={16}
                className={
                  isSelected ? "text-primary" : "text-muted-foreground"
                }
              />
            </div>
            <div className="flex-1">
              <p
                className={cn(
                  "text-sm font-semibold",
                  isSelected && "text-primary",
                )}
              >
                {option.label}
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {option.description}
              </p>
            </div>
            <div
              className={cn(
                "h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
