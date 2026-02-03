import { isFuture } from "date-fns";

export type BookingStatus = "confirmed" | "finished" | "cancelled";

export function getBookingStatus(
  date: Date,
  cancelledAt: Date | null,
): BookingStatus {
  if (cancelledAt) {
    return "cancelled";
  }
  if (isFuture(date)) {
    return "confirmed";
  }
  return "finished";
}
