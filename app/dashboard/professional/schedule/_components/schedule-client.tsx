"use client";

import { useAction } from "next-safe-action/hooks";
import { updateProfessionalSchedule } from "@/actions/schedules/update-professional-schedule";
import { toast } from "sonner";
import {
  ScheduleForm,
  professionalScheduleConfig,
  type DaySchedule,
} from "@/components/schedule-form";

interface ProfessionalScheduleClientProps {
  initialSchedules: DaySchedule[];
}

export default function ProfessionalScheduleClient({
  initialSchedules,
}: ProfessionalScheduleClientProps) {
  const { execute, isPending } = useAction(updateProfessionalSchedule, {
    onSuccess: () => {
      toast.success("Agenda atualizada com sucesso!");
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao atualizar agenda");
    },
  });

  function handleSubmit(schedules: DaySchedule[]) {
    execute({ schedules });
  }

  return (
    <ScheduleForm
      config={professionalScheduleConfig}
      isPending={isPending}
      onSubmit={handleSubmit}
      initialSchedules={initialSchedules}
    />
  );
}
