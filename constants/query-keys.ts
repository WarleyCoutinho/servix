export const queryKeys = {
  getDateAvailableTimeSlots: (barbershopId: string, date?: Date) => [
    "date-available-time-slots",
    barbershopId,
    date?.toISOString(),
  ],
};
