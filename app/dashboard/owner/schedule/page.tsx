import { auth } from "@/lib/auth";
import { getActiveBarbershop } from "@/lib/get-active-barbershop";
import { prisma } from "@/lib/prisma";
import { DayOfWeek } from "@/generated/prisma/enums";
import { DAY_OF_WEEK_ORDER } from "@/lib/day-of-week";
import type { DaySchedule } from "@/components/schedule-form";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import OwnerScheduleClient from "./_components/schedule-client";

export default async function OwnerSchedulePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const data = await getActiveBarbershop(session.user.id);

  if (!data || !data.activeBarbershop) {
    redirect("/dashboard/owner");
  }

  const ownerProfessional = await prisma.professional.findUnique({
    where: { userId: session.user.id },
    include: { schedules: true },
  });

  if (!ownerProfessional) {
    redirect("/dashboard/owner");
  }

  const initialSchedules: DaySchedule[] = DAY_OF_WEEK_ORDER.map((day) => {
    const existing = ownerProfessional.schedules.find(
      (s) => s.dayOfWeek === day,
    );
    return {
      dayOfWeek: day,
      startTime: existing?.startTime ?? "09:00",
      endTime: existing?.endTime ?? "18:00",
      isAvailable: existing?.isAvailable ?? day !== DayOfWeek.SUNDAY,
      hasLunchBreak: existing?.hasLunchBreak ?? false,
      lunchStartTime: existing?.lunchStartTime ?? "12:00",
      lunchEndTime: existing?.lunchEndTime ?? "13:00",
    };
  });

  return <OwnerScheduleClient initialSchedules={initialSchedules} />;
}
