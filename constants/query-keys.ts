export const queryKeys = {
  getDateAvailableTimeSlots: (
    barbershopId: string,
    professionalId?: string,
    date?: Date,
    serviceId?: string,
  ) => [
    "date-available-time-slots",
    barbershopId,
    professionalId,
    date?.toISOString(),
    serviceId,
  ],
  getBarbershopProfessionals: (barbershopId: string) => [
    "barbershop-professionals",
    barbershopId,
  ],
};
