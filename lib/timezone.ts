import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  getDay,
  isSameDay,
} from "date-fns";
import type { Locale } from "date-fns";

export const TIMEZONE = "America/Sao_Paulo";

export function formatBrt(
  date: Date,
  formatStr: string,
  options?: { locale?: Locale },
): string {
  return formatInTimeZone(date, TIMEZONE, formatStr, options);
}

export function startOfDayBrt(date: Date): Date {
  const zoned = toZonedTime(date, TIMEZONE);
  return fromZonedTime(startOfDay(zoned), TIMEZONE);
}

export function endOfDayBrt(date: Date): Date {
  const zoned = toZonedTime(date, TIMEZONE);
  return fromZonedTime(endOfDay(zoned), TIMEZONE);
}

export function startOfMonthBrt(date: Date): Date {
  const zoned = toZonedTime(date, TIMEZONE);
  return fromZonedTime(startOfMonth(zoned), TIMEZONE);
}

export function endOfMonthBrt(date: Date): Date {
  const zoned = toZonedTime(date, TIMEZONE);
  return fromZonedTime(endOfMonth(zoned), TIMEZONE);
}

export function getDayBrt(date: Date): number {
  return getDay(toZonedTime(date, TIMEZONE));
}

export function isTodayBrt(date: Date | string): boolean {
  const nowBrt = toZonedTime(new Date(), TIMEZONE);
  const dateBrt = toZonedTime(new Date(date), TIMEZONE);
  return isSameDay(nowBrt, dateBrt);
}
