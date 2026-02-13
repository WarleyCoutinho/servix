import { DayOfWeek } from "@/generated/prisma/enums";
import {
  format,
  setHours,
  setMinutes,
  addMinutes,
  isBefore,
  startOfDay,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { TIMEZONE, getDayBrt, formatBrt } from "@/lib/timezone";

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

export function parseTimeString(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(":").map(Number);
  return { hours, minutes };
}

export function createTimeSlot(date: Date, timeString: string): Date {
  const { hours, minutes } = parseTimeString(timeString);
  const zoned = toZonedTime(date, TIMEZONE);
  const dayStart = startOfDay(zoned);
  const zonedSlot = setMinutes(setHours(dayStart, hours), minutes);
  return fromZonedTime(zonedSlot, TIMEZONE);
}

export function generateTimeSlots(
  date: Date,
  startTime: string,
  endTime: string,
  intervalMinutes: number = 30,
): string[] {
  const slots: string[] = [];
  const { hours: startHours, minutes: startMinutes } = parseTimeString(startTime);
  const { hours: endHours, minutes: endMinutes } = parseTimeString(endTime);

  const dayStart = startOfDay(toZonedTime(date, TIMEZONE));
  let current = setMinutes(setHours(dayStart, startHours), startMinutes);
  const end = setMinutes(setHours(dayStart, endHours), endMinutes);

  while (isBefore(current, end)) {
    slots.push(format(current, "HH:mm"));
    current = addMinutes(current, intervalMinutes);
  }

  return slots;
}

export function isTimeSlotAvailable(
  slotTime: string,
  bookedSlots: Date[],
  date: Date,
): boolean {
  const slotDate = createTimeSlot(date, slotTime);
  return !bookedSlots.some(
    (booked) => formatBrt(booked, "HH:mm") === formatBrt(slotDate, "HH:mm"),
  );
}

export function filterAvailableSlots(
  allSlots: string[],
  bookedSlots: Date[],
  date: Date,
): string[] {
  return allSlots.filter((slot) => isTimeSlotAvailable(slot, bookedSlots, date));
}

export const DEFAULT_INTERVAL_MINUTES = 30;
