import { getAvailableSlots } from "@/actions/schedules/get-available-slots";
import { queryKeys } from "@/constants/query-keys";
import { useQuery } from "@tanstack/react-query";

export const useGetDateAvailableTimeSlots = ({
  barbershopId,
  professionalId,
  date,
  serviceId,
}: {
  barbershopId: string;
  professionalId?: string;
  date?: Date;
  serviceId?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.getDateAvailableTimeSlots(
      barbershopId,
      professionalId,
      date,
      serviceId,
    ),
    queryFn: () =>
      getAvailableSlots({
        barbershopId,
        professionalId: professionalId!,
        date: date!,
        serviceId,
      }),
    enabled: Boolean(date) && Boolean(professionalId),
  });
};
