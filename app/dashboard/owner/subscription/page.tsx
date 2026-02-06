import { getAllPlans, type PlanConfig } from "@/data/plans";
import { SubscriptionPlans } from "./_components/subscription-plans";

export default async function SubscriptionPage() {
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

  return <SubscriptionPlans plans={plansData} />;
}
