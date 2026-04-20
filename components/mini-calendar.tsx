"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// ─── Constantes localizadas (pt-BR) ───────────────────────────────────────────
const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

const DAYS_MIN = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

// ─── Helpers puros (fora do componente para não recriar a cada render) ────────
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstWeekday(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

// ─── Props públicas ────────────────────────────────────────────────────────────
export interface MiniCalendarProps {
  /** Data atualmente selecionada */
  selected: Date | undefined;
  /** Callback ao selecionar um dia */
  onSelect: (date: Date) => void;
  /** Data mínima selecionável (padrão: hoje) */
  minDate?: Date;
  /** Data máxima selecionável */
  maxDate?: Date;
  /** Classe CSS adicional no container */
  className?: string;
}

// ─── Componente ────────────────────────────────────────────────────────────────
export function MiniCalendar({
  selected,
  onSelect,
  minDate,
  maxDate,
  className,
}: MiniCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const effectiveMin = minDate ?? today;

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function isDisabled(day: number): boolean {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    if (date < effectiveMin) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }

  function isSelected(day: number): boolean {
    if (!selected) return false;
    return isSameDay(selected, new Date(year, month, day));
  }

  function isToday(day: number): boolean {
    return isSameDay(today, new Date(year, month, day));
  }

  const totalDays = getDaysInMonth(year, month);
  const firstWeekday = getFirstWeekday(year, month);

  return (
    <div className={cn("w-full select-none", className)}>
      {/* Navegação do mês */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold capitalize text-foreground">
          {MONTHS_PT[month].toLowerCase()} {year}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Mês anterior"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Próximo mês"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Cabeçalho dos dias da semana */}
      <div className="mb-1 grid grid-cols-7">
        {DAYS_MIN.map((day, i) => (
          <div
            key={i}
            className="py-1 text-center text-[10px] font-medium text-muted-foreground/60"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {/* Células vazias antes do primeiro dia */}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`empty-${i}`} aria-hidden />
        ))}

        {/* Dias do mês */}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const disabled = isDisabled(day);
          const sel = isSelected(day);
          const tod = isToday(day);

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(new Date(year, month, day))}
              aria-label={`${day} de ${MONTHS_PT[month]} de ${year}`}
              aria-pressed={sel}
              aria-disabled={disabled}
              className={cn(
                "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition-all duration-150",
                sel &&
                  "bg-primary font-bold text-primary-foreground shadow-sm scale-110",
                !sel &&
                  disabled &&
                  "cursor-not-allowed text-muted-foreground/25",
                !sel &&
                  !disabled &&
                  tod &&
                  "font-semibold text-primary ring-1 ring-primary/40 hover:bg-primary/10",
                !sel && !disabled && !tod && "text-foreground hover:bg-muted",
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
