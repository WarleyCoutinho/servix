import { getDateAvailableTimeSlots } from "@/actions/get-date-available-time-slots";
import { queryKeys } from "@/constants/query-keys";
import { useQuery } from "@tanstack/react-query";

export const useGetDateAvailableTimeSlots = ({
  barbershopId,
  date,
}: {
  barbershopId: string;
  date?: Date;
}) => {
  return useQuery({
    queryKey: queryKeys.getDateAvailableTimeSlots(barbershopId, date),
    queryFn: () =>
      getDateAvailableTimeSlots({
        barbershopId,
        date: date!,
      }),
    enabled: Boolean(date),
  });
};
