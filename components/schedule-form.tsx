"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DayOfWeek } from "@/generated/prisma/enums";
import { DAY_OF_WEEK_LABELS, DAY_OF_WEEK_ORDER } from "@/lib/day-of-week";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock, Coffee, Loader2, Save } from "lucide-react";
import { useState } from "react";

export type DaySchedule = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  hasLunchBreak: boolean;
  lunchStartTime: string;
  lunchEndTime: string;
};

const createDefaultSchedule = (): DaySchedule[] =>
  DAY_OF_WEEK_ORDER.map((day) => ({
    dayOfWeek: day,
    startTime: "09:00",
    endTime: "18:00",
    isAvailable: day !== DayOfWeek.SUNDAY,
    hasLunchBreak: day !== DayOfWeek.SUNDAY && day !== DayOfWeek.SATURDAY,
    lunchStartTime: "12:00",
    lunchEndTime: "13:00",
  }));

interface ScheduleFormConfig {
  title: string;
  subtitle: string;
  cardTitle: string;
  cardDescription: string;
  availableLabel: string;
  unavailableLabel: string;
  lunchBreakLabel?: string;
  workingHoursLabel?: string;
  lunchHoursLabel?: string;
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
    initialSchedules ?? createDefaultSchedule(),
  );

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
    onSubmit(schedules);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-8 w-8" />
          <h1 className="text-3xl font-bold tracking-tight">{config.title}</h1>
        </div>
        <p className="text-muted-foreground">{config.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{config.cardTitle}</CardTitle>
          <CardDescription>{config.cardDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grid de calendário semanal */}
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
              {schedules.map((schedule) => (
                <Card
                  key={schedule.dayOfWeek}
                  className={cn(
                    "transition-all duration-200",
                    schedule.isAvailable
                      ? "border-primary/20 bg-primary/5 shadow-sm hover:shadow-md"
                      : "border-muted bg-muted/30 opacity-75",
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">
                        {DAY_OF_WEEK_LABELS[schedule.dayOfWeek]}
                      </CardTitle>
                      <Badge
                        variant={schedule.isAvailable ? "default" : "secondary"}
                        className="ml-2"
                      >
                        {schedule.isAvailable
                          ? config.availableLabel
                          : config.unavailableLabel}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Toggle de disponibilidade */}
                    <div className="flex items-center justify-between rounded-lg bg-background/50 p-3">
                      <Label
                        htmlFor={`available-${schedule.dayOfWeek}`}
                        className="cursor-pointer text-sm font-medium"
                      >
                        Ativar dia
                      </Label>
                      <Switch
                        id={`available-${schedule.dayOfWeek}`}
                        checked={schedule.isAvailable}
                        onCheckedChange={(checked) =>
                          handleScheduleChange(
                            schedule.dayOfWeek,
                            "isAvailable",
                            checked,
                          )
                        }
                      />
                    </div>

                    {/* Horários de trabalho */}
                    {schedule.isAvailable && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Horário de Trabalho
                          </Label>
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
                              className="text-sm"
                              aria-label={`Horário de início - ${DAY_OF_WEEK_LABELS[schedule.dayOfWeek]}`}
                            />
                            <span className="text-xs text-muted-foreground">
                              até
                            </span>
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
                              className="text-sm"
                              aria-label={`Horário de término - ${DAY_OF_WEEK_LABELS[schedule.dayOfWeek]}`}
                            />
                          </div>
                        </div>

                        {/* Intervalo de almoço */}
                        <div className="space-y-2 rounded-lg bg-background/50 p-3">
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor={`lunch-${schedule.dayOfWeek}`}
                              className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                            >
                              <Coffee className="h-3 w-3" />
                              {config.lunchBreakLabel || "Intervalo"}
                            </Label>
                            <Switch
                              id={`lunch-${schedule.dayOfWeek}`}
                              checked={schedule.hasLunchBreak}
                              onCheckedChange={(checked) =>
                                handleScheduleChange(
                                  schedule.dayOfWeek,
                                  "hasLunchBreak",
                                  checked,
                                )
                              }
                            />
                          </div>

                          {schedule.hasLunchBreak && (
                            <div className="flex items-center gap-2 pt-2">
                              <Input
                                type="time"
                                value={schedule.lunchStartTime}
                                onChange={(e) =>
                                  handleScheduleChange(
                                    schedule.dayOfWeek,
                                    "lunchStartTime",
                                    e.target.value,
                                  )
                                }
                                className="text-sm"
                                aria-label={`Início do almoço - ${DAY_OF_WEEK_LABELS[schedule.dayOfWeek]}`}
                              />
                              <span className="text-xs text-muted-foreground">
                                até
                              </span>
                              <Input
                                type="time"
                                value={schedule.lunchEndTime}
                                onChange={(e) =>
                                  handleScheduleChange(
                                    schedule.dayOfWeek,
                                    "lunchEndTime",
                                    e.target.value,
                                  )
                                }
                                className="text-sm"
                                aria-label={`Término do almoço - ${DAY_OF_WEEK_LABELS[schedule.dayOfWeek]}`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Placeholder quando dia está indisponível */}
                    {!schedule.isAvailable && (
                      <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed">
                        <p className="text-sm text-muted-foreground">
                          Dia não disponível
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Botão de salvar */}
            <div className="flex justify-end border-t pt-6">
              <Button type="submit" disabled={isPending} size="lg">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
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
  cardDescription:
    "Defina o horário de abertura e fechamento para cada dia da semana",
  availableLabel: "Aberto",
  unavailableLabel: "Fechado",
  lunchBreakLabel: "Intervalo de almoço",
};

export const professionalScheduleConfig: ScheduleFormConfig = {
  title: "Minha Agenda",
  subtitle: "Configure seus horários de trabalho",
  cardTitle: "Horários de Trabalho",
  cardDescription:
    "Defina os dias e horários em que você está disponível para atender",
  availableLabel: "Disponível",
  unavailableLabel: "Indisponível",
  lunchBreakLabel: "Intervalo de almoço",
};
