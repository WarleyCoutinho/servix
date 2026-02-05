"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Save } from "lucide-react";
import { DayOfWeek } from "@/generated/prisma/enums";
import { DAY_OF_WEEK_ORDER, DAY_OF_WEEK_LABELS } from "@/lib/day-of-week";

export type DaySchedule = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

const createDefaultSchedule = (): DaySchedule[] =>
  DAY_OF_WEEK_ORDER.map((day) => ({
    dayOfWeek: day,
    startTime: "09:00",
    endTime: "18:00",
    isAvailable: day !== DayOfWeek.SUNDAY,
  }));

interface ScheduleFormConfig {
  title: string;
  subtitle: string;
  cardTitle: string;
  cardDescription: string;
  availableLabel: string;
  unavailableLabel: string;
}

interface ScheduleFormProps {
  config: ScheduleFormConfig;
  isPending: boolean;
  onSubmit: (schedules: DaySchedule[]) => void;
  initialSchedules?: DaySchedule[];
}

export function ScheduleForm({
  config,
  isPending,
  onSubmit,
  initialSchedules,
}: ScheduleFormProps) {
  const [schedules, setSchedules] = useState<DaySchedule[]>(
    initialSchedules ?? createDefaultSchedule()
  );

  function handleScheduleChange(
    dayOfWeek: DayOfWeek,
    field: keyof DaySchedule,
    value: string | boolean
  ) {
    setSchedules((prev) =>
      prev.map((s) => (s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s))
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(schedules);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{config.title}</h1>
        <p className="text-muted-foreground">{config.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{config.cardTitle}</CardTitle>
          <CardDescription>{config.cardDescription}</CardDescription>
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
                      handleScheduleChange(schedule.dayOfWeek, "isAvailable", checked)
                    }
                  />
                  <span className="text-muted-foreground text-sm">
                    {schedule.isAvailable
                      ? config.availableLabel
                      : config.unavailableLabel}
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
                          e.target.value
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
                          e.target.value
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

export const ownerScheduleConfig: ScheduleFormConfig = {
  title: "Horário de Funcionamento",
  subtitle: "Configure os horários de funcionamento da barbearia",
  cardTitle: "Horários por Dia",
  cardDescription: "Defina o horário de abertura e fechamento para cada dia da semana",
  availableLabel: "Aberto",
  unavailableLabel: "Fechado",
};

export const professionalScheduleConfig: ScheduleFormConfig = {
  title: "Minha Agenda",
  subtitle: "Configure seus horários de trabalho",
  cardTitle: "Horários de Trabalho",
  cardDescription: "Defina os dias e horários em que você está disponível para atender",
  availableLabel: "Disponível",
  unavailableLabel: "Indisponível",
};
