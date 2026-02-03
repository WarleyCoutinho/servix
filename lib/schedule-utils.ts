import { DayOfWeek } from "@/generated/prisma/enums";
import {
  format,
  setHours,
  setMinutes,
  addMinutes,
  isBefore,
  isAfter,
  startOfDay,
  getDay,
} from "date-fns";

export function getDayOfWeekFromDate(date: Date): DayOfWeek {
  const day = getDay(date);
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
  let slot = startOfDay(date);
  slot = setHours(slot, hours);
  slot = setMinutes(slot, minutes);
  return slot;
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

  let current = setMinutes(setHours(startOfDay(date), startHours), startMinutes);
  const end = setMinutes(setHours(startOfDay(date), endHours), endMinutes);

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
    (booked) => format(booked, "HH:mm") === format(slotDate, "HH:mm"),
  );
}

export function filterAvailableSlots(
  allSlots: string[],
  bookedSlots: Date[],
  date: Date,
): string[] {
  return allSlots.filter((slot) => isTimeSlotAvailable(slot, bookedSlots, date));
}

export function isWithinOperatingHours(
  time: string,
  openTime: string,
  closeTime: string,
): boolean {
  const { hours: timeHours, minutes: timeMinutes } = parseTimeString(time);
  const { hours: openHours, minutes: openMinutes } = parseTimeString(openTime);
  const { hours: closeHours, minutes: closeMinutes } = parseTimeString(closeTime);

  const timeInMinutes = timeHours * 60 + timeMinutes;
  const openInMinutes = openHours * 60 + openMinutes;
  const closeInMinutes = closeHours * 60 + closeMinutes;

  return timeInMinutes >= openInMinutes && timeInMinutes < closeInMinutes;
}

export function getIntersectingSlots(
  barbershopSlots: string[],
  professionalSlots: string[],
): string[] {
  return barbershopSlots.filter((slot) => professionalSlots.includes(slot));
}

export const DEFAULT_OPERATING_HOURS = {
  openTime: "09:00",
  closeTime: "18:00",
};

export const DEFAULT_INTERVAL_MINUTES = 30;
