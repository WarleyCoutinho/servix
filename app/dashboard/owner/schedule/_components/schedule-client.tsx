"use client";

import { updateProfessionalSchedule } from "@/actions/schedules/update-professional-schedule";
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
  const { execute, isPending } = useAction(updateProfessionalSchedule, {
    onSuccess: () => {
      toast.success("Horários atualizados com sucesso!");
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao atualizar horários");
    },
  });

  function handleSubmit(schedules: DaySchedule[]) {
    execute({ schedules });
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
