import { getAvailableSlots } from "@/actions/schedules/get-available-slots";
import { queryKeys } from "@/constants/query-keys";
import { useQuery } from "@tanstack/react-query";

export const useGetDateAvailableTimeSlots = ({
  barbershopId,
  professionalId,
  date,
}: {
  barbershopId: string;
  professionalId?: string;
  date?: Date;
}) => {
  return useQuery({
    queryKey: queryKeys.getDateAvailableTimeSlots(
      barbershopId,
      professionalId,
      date,
    ),
    queryFn: () =>
      getAvailableSlots({
        barbershopId,
        professionalId: professionalId!,
        date: date!,
      }),
    enabled: Boolean(date) && Boolean(professionalId),
  });
};
