import { DayOfWeek } from "@/generated/prisma/enums";
import { getDayBrt } from "@/lib/timezone";

export function getDayOfWeekFromDate(date: Date): DayOfWeek {
  const day = getDayBrt(date);
  const mapping: Record<number, DayOfWeek> = {
    0: DayOfWeek.SUNDAY,
    1: DayOfWeek.MONDAY,
    2: DayOfWeek.TUESDAY,
    3: DayOfWeek.WEDNESDAY,
    4: DayOfWeek.THURSDAY,
    5: DayOfWeek.FRIDAY,
    6: DayOfWeek.SATURDAY,
  };
  return mapping[day];
}

// Intervalo fixo de 30min para visualização da agenda no WhatsApp
export const DISPLAY_INTERVAL_MINUTES = 30;
