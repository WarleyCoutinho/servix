import { DayOfWeek } from "@/generated/prisma/enums";

export const DAY_OF_WEEK_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Segunda-feira",
  [DayOfWeek.TUESDAY]: "Terça-feira",
  [DayOfWeek.WEDNESDAY]: "Quarta-feira",
  [DayOfWeek.THURSDAY]: "Quinta-feira",
  [DayOfWeek.FRIDAY]: "Sexta-feira",
  [DayOfWeek.SATURDAY]: "Sábado",
  [DayOfWeek.SUNDAY]: "Domingo",
};

export const DAY_OF_WEEK_SHORT_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "Seg",
  [DayOfWeek.TUESDAY]: "Ter",
  [DayOfWeek.WEDNESDAY]: "Qua",
  [DayOfWeek.THURSDAY]: "Qui",
  [DayOfWeek.FRIDAY]: "Sex",
  [DayOfWeek.SATURDAY]: "Sáb",
  [DayOfWeek.SUNDAY]: "Dom",
};
