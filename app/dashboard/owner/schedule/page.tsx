"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { updateOperatingHours } from "@/actions/schedules/update-operating-hours";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { DayOfWeek } from "@/generated/prisma/enums";
import { DAY_OF_WEEK_ORDER, DAY_OF_WEEK_LABELS } from "@/lib/day-of-week";

type DaySchedule = {
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

const defaultSchedule: DaySchedule[] = DAY_OF_WEEK_ORDER.map((day) => ({
  dayOfWeek: day,
  openTime: "09:00",
  closeTime: "18:00",
  isClosed: day === DayOfWeek.SUNDAY,
}));

export default function OwnerSchedulePage() {
  const [schedules, setSchedules] = useState<DaySchedule[]>(defaultSchedule);

  const { execute, isPending } = useAction(updateOperatingHours, {
    onSuccess: () => {
      toast.success("Horários atualizados com sucesso!");
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao atualizar horários");
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
        <h1 className="text-3xl font-bold">Horário de Funcionamento</h1>
        <p className="text-muted-foreground">
          Configure os horários de funcionamento da barbearia
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horários por Dia</CardTitle>
          <CardDescription>
            Defina o horário de abertura e fechamento para cada dia da semana
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
                    checked={!schedule.isClosed}
                    onCheckedChange={(checked) =>
                      handleScheduleChange(
                        schedule.dayOfWeek,
                        "isClosed",
                        !checked,
                      )
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {schedule.isClosed ? "Fechado" : "Aberto"}
                  </span>
                </div>

                {!schedule.isClosed && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={schedule.openTime}
                      onChange={(e) =>
                        handleScheduleChange(
                          schedule.dayOfWeek,
                          "openTime",
                          e.target.value,
                        )
                      }
                      className="w-32"
                    />
                    <span className="text-muted-foreground">até</span>
                    <Input
                      type="time"
                      value={schedule.closeTime}
                      onChange={(e) =>
                        handleScheduleChange(
                          schedule.dayOfWeek,
                          "closeTime",
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
