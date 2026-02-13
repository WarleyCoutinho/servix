"use client";

import { updateOperatingHours } from "@/actions/schedules/update-operating-hours";
import {
  ScheduleForm,
  ownerScheduleConfig,
  type DaySchedule,
} from "@/components/schedule-form";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

interface OwnerScheduleClientProps {
  initialSchedules: DaySchedule[];
}

export default function OwnerScheduleClient({
  initialSchedules,
}: OwnerScheduleClientProps) {
  const { execute, isPending } = useAction(updateOperatingHours, {
    onSuccess: () => {
      toast.success("Horários atualizados com sucesso!");
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao atualizar horários");
    },
  });

  function handleSubmit(schedules: DaySchedule[]) {
    const convertedSchedules = schedules.map((s) => ({
      dayOfWeek: s.dayOfWeek,
      openTime: s.startTime,
      closeTime: s.endTime,
      isClosed: !s.isAvailable,
    }));

    execute({ schedules: convertedSchedules });
  }

  return (
    <ScheduleForm
      config={ownerScheduleConfig}
      isPending={isPending}
      onSubmit={handleSubmit}
      initialSchedules={initialSchedules}
    />
  );
}
