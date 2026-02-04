"use client";

import { updateProfessionalSchedule } from "@/actions/schedules/update-professional-schedule";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DayOfWeek } from "@/generated/prisma/enums";
import { DAY_OF_WEEK_LABELS, DAY_OF_WEEK_ORDER } from "@/lib/day-of-week";
import { Loader2, Save } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

type DaySchedule = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

const defaultSchedule: DaySchedule[] = DAY_OF_WEEK_ORDER.map((day) => ({
  dayOfWeek: day,
  startTime: "09:00",
  endTime: "18:00",
  isAvailable: day !== DayOfWeek.SUNDAY,
}));

export default function ProfessionalSchedulePage() {
  const [schedules, setSchedules] = useState<DaySchedule[]>(defaultSchedule);

  const { execute, isPending } = useAction(updateProfessionalSchedule, {
    onSuccess: () => {
      toast.success("Agenda atualizada com sucesso!");
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao atualizar agenda");
    },
  });

  function handleScheduleChange(
    dayOfWeek: DayOfWeek,
    field: keyof DaySchedule,
    value: string | boolean,
  ) {
    setSchedules((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s,
      ),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    execute({ schedules });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minha Agenda</h1>
        <p className="text-muted-foreground">
          Configure seus horários de trabalho
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horários de Trabalho</CardTitle>
          <CardDescription>
            Defina os dias e horários em que você está disponível para atender
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.dayOfWeek}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <div className="w-32">
                  <p className="font-medium">
                    {DAY_OF_WEEK_LABELS[schedule.dayOfWeek]}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={schedule.isAvailable}
                    onCheckedChange={(checked) =>
                      handleScheduleChange(
                        schedule.dayOfWeek,
                        "isAvailable",
                        checked,
                      )
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {schedule.isAvailable ? "Disponível" : "Indisponível"}
                  </span>
                </div>

                {schedule.isAvailable && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) =>
                        handleScheduleChange(
                          schedule.dayOfWeek,
                          "startTime",
                          e.target.value,
                        )
                      }
                      className="w-32"
                    />
                    <span className="text-muted-foreground">até</span>
                    <Input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) =>
                        handleScheduleChange(
                          schedule.dayOfWeek,
                          "endTime",
                          e.target.value,
                        )
                      }
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            ))}

            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
