export const queryKeys = {
  getDateAvailableTimeSlots: (
    barbershopId: string,
    professionalId?: string,
    date?: Date,
  ) => [
    "date-available-time-slots",
    barbershopId,
    professionalId,
    date?.toISOString(),
  ],
  getBarbershopProfessionals: (barbershopId: string) => [
    "barbershop-professionals",
    barbershopId,
  ],
};
