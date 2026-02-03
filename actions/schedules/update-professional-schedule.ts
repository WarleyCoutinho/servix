"use server";

import { z } from "zod";
import { professionalActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DayOfWeek } from "@/generated/prisma/enums";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const dayScheduleSchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  startTime: z.string().regex(timeRegex, "Formato de hora inválido (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Formato de hora inválido (HH:mm)"),
  isAvailable: z.boolean(),
});

const inputSchema = z.object({
  schedules: z.array(dayScheduleSchema).length(7),
});

export const updateProfessionalSchedule = professionalActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { schedules }, ctx: { professional } }) => {
    const operations = schedules.map((schedule) =>
      prisma.professionalSchedule.upsert({
        where: {
          professionalId_dayOfWeek: {
            professionalId: professional.id,
            dayOfWeek: schedule.dayOfWeek,
          },
        },
        create: {
          professionalId: professional.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isAvailable: schedule.isAvailable,
        },
        update: {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isAvailable: schedule.isAvailable,
        },
      }),
    );

    await prisma.$transaction(operations);

    revalidatePath("/dashboard/professional/schedule");
    return { success: true };
  });
