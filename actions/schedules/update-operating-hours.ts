"use server";

import { z } from "zod";
import { subscribedOwnerActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DayOfWeek } from "@/generated/prisma/enums";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const dayScheduleSchema = z.object({
  dayOfWeek: z.nativeEnum(DayOfWeek),
  openTime: z.string().regex(timeRegex, "Formato de hora inválido (HH:mm)"),
  closeTime: z.string().regex(timeRegex, "Formato de hora inválido (HH:mm)"),
  isClosed: z.boolean(),
});

const inputSchema = z.object({
  schedules: z.array(dayScheduleSchema).length(7),
});

export const updateOperatingHours = subscribedOwnerActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { schedules }, ctx: { barbershop } }) => {
    const operations = schedules.map((schedule) =>
      prisma.operatingHours.upsert({
        where: {
          barbershopId_dayOfWeek: {
            barbershopId: barbershop.id,
            dayOfWeek: schedule.dayOfWeek,
          },
        },
        create: {
          barbershopId: barbershop.id,
          dayOfWeek: schedule.dayOfWeek,
          openTime: schedule.openTime,
          closeTime: schedule.closeTime,
          isClosed: schedule.isClosed,
        },
        update: {
          openTime: schedule.openTime,
          closeTime: schedule.closeTime,
          isClosed: schedule.isClosed,
        },
      }),
    );

    await prisma.$transaction(operations);

    revalidatePath("/dashboard/owner/schedule");
    return { success: true };
  });
