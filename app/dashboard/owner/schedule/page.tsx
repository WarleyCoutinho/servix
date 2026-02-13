import { auth } from "@/lib/auth";
import { getActiveBarbershop } from "@/lib/get-active-barbershop";
import { getBarbershopOperatingHours } from "@/data/schedules";
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

  const operatingHours = await getBarbershopOperatingHours(
    data.activeBarbershop.id,
  );

  const initialSchedules: DaySchedule[] = DAY_OF_WEEK_ORDER.map((day) => {
    const existing = operatingHours.find((h) => h.dayOfWeek === day);
    return {
      dayOfWeek: day,
      startTime: existing?.openTime ?? "09:00",
      endTime: existing?.closeTime ?? "18:00",
      isAvailable: existing ? !existing.isClosed : day !== DayOfWeek.SUNDAY,
      hasLunchBreak: false,
      lunchStartTime: "12:00",
      lunchEndTime: "13:00",
    };
  });

  return <OwnerScheduleClient initialSchedules={initialSchedules} />;
}
