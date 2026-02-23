import { getAllPlans, type PlanConfig } from "@/data/plans";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getOwnerSubscription } from "@/lib/get-owner-subscription";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SubscriptionPlans } from "./_components/subscription-plans";
import { FeeNotificationBanner } from "./_components/fee-notification-banner";

export default async function SubscriptionPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const [ownerSubscription, plans, notifications] = await Promise.all([
    getOwnerSubscription(session.user.id),
    getAllPlans(),
    prisma.notification.findMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const currentPlan = ownerSubscription?.plan ?? null;

  const plansData = plans.map((plan: PlanConfig) => ({
    plan: plan.plan,
    name: plan.name,
    description: plan.description,
    priceInCents: plan.priceInCents,
    maxBarbershops: plan.maxBarbershops,
    maxProfessionals: plan.maxProfessionals,
    maxServices: plan.maxServices,
    features: plan.features,
  }));

  return (
    <div className="space-y-6">
      <FeeNotificationBanner notifications={notifications} />
      <SubscriptionPlans plans={plansData} currentPlan={currentPlan} />
    </div>
  );
}
