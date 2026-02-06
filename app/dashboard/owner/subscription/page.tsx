import { getAllPlans, type PlanConfig } from "@/data/plans";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SubscriptionPlans } from "./_components/subscription-plans";

export default async function SubscriptionPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedBarbershop: {
        include: {
          subscription: true,
        },
      },
    },
  });

  const currentPlan = user?.ownedBarbershop?.subscription?.plan ?? null;

  const plans = await getAllPlans();

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

  return <SubscriptionPlans plans={plansData} currentPlan={currentPlan} />;
}
