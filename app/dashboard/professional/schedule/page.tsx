import { auth } from "@/lib/auth";
import { getProfessionalSchedule } from "@/data/schedules";
import { DayOfWeek } from "@/generated/prisma/enums";
import { DAY_OF_WEEK_ORDER } from "@/lib/day-of-week";
import { prisma } from "@/lib/prisma";
import type { DaySchedule } from "@/components/schedule-form";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ProfessionalScheduleClient from "./_components/schedule-client";

export default async function ProfessionalSchedulePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const professional = await prisma.professional.findUnique({
    where: { userId: session.user.id },
  });

  if (!professional) {
    redirect("/dashboard");
  }

  const dbSchedules = await getProfessionalSchedule(professional.id);

  const initialSchedules: DaySchedule[] = DAY_OF_WEEK_ORDER.map((day) => {
    const existing = dbSchedules.find((s) => s.dayOfWeek === day);
    return {
      dayOfWeek: day,
      startTime: existing?.startTime ?? "09:00",
      endTime: existing?.endTime ?? "18:00",
      isAvailable:
        existing?.isAvailable ??
        (day !== DayOfWeek.SATURDAY && day !== DayOfWeek.SUNDAY),
      hasLunchBreak: false,
      lunchStartTime: "12:00",
      lunchEndTime: "13:00",
    };
  });

  return <ProfessionalScheduleClient initialSchedules={initialSchedules} />;
}
