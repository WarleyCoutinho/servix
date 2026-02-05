"use client";

import { useAction } from "next-safe-action/hooks";
import { updateOperatingHours } from "@/actions/schedules/update-operating-hours";
import { toast } from "sonner";
import {
  ScheduleForm,
  ownerScheduleConfig,
  type DaySchedule,
} from "@/components/schedule-form";

export default function OwnerSchedulePage() {
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
    />
  );
}
