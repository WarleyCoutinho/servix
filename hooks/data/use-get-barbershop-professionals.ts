import { getBarbershopProfessionals } from "@/actions/get-barbershop-professionals";
import { queryKeys } from "@/constants/query-keys";
import { useQuery } from "@tanstack/react-query";

export const useGetBarbershopProfessionals = (barbershopId: string) => {
  return useQuery({
    queryKey: queryKeys.getBarbershopProfessionals(barbershopId),
    queryFn: () => getBarbershopProfessionals({ barbershopId }),
    enabled: Boolean(barbershopId),
  });
};
