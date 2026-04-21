"use client";

import { changeSubscriptionPlan } from "@/actions/subscriptions/change-subscription-plan";
import { createSubscriptionCheckout } from "@/actions/subscriptions/create-subscription-checkout";
import { getCustomerPortalUrl } from "@/actions/subscriptions/get-customer-portal-url";
import { getDowngradeImpactAction } from "@/actions/subscriptions/get-downgrade-impact";
import { syncSubscription } from "@/actions/subscriptions/sync-subscription";
import { DowngradeAlertDialog } from "@/components/downgrade-alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubscriptionPlan } from "@/generated/prisma/enums";
import {
  ArrowUp,
  Check,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanData {
  plan: SubscriptionPlan;
  name: string;
  description: string;
  priceInCents: number;
  maxBarbershops: number;
  maxProfessionals: number;
  maxServices: number | null;
  features: string[];
  idealFor: string[];
}

interface DowngradeImpact {
  professionalsToDisable: number;
  servicesToDisable: number;
  barbershopsToDisable: number;
}

interface DowngradeState {
  isOpen: boolean;
  pendingPlan: SubscriptionPlan | null;
  impact: DowngradeImpact | null;
  isLoadingImpact: boolean;
}

export interface SubscriptionPlansProps {
  plans: PlanData[];
  currentPlan?: SubscriptionPlan | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RECOMMENDED_PLAN = SubscriptionPlan.PROFESSIONAL;

const PLAN_ORDER: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.BASIC]: 1,
  [SubscriptionPlan.STANDARD]: 2,
  [SubscriptionPlan.PROFESSIONAL]: 3,
  [SubscriptionPlan.ENTERPRISE]: 4,
};

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  [SubscriptionPlan.BASIC]: "Assinar Básico",
  [SubscriptionPlan.STANDARD]: "Assinar Padrão",
  [SubscriptionPlan.PROFESSIONAL]: "Assinar Profissional",
  [SubscriptionPlan.ENTERPRISE]: "Assinar Empresarial",
};

const DOWNGRADE_STATE_INITIAL: DowngradeState = {
  isOpen: false,
  pendingPlan: null,
  impact: null,
  isLoadingImpact: false,
};

const BUSINESS_SEGMENTS = [
  "Barbearia",
  "Salão de beleza",
  "Studio de sobrancelhas / Lash",
  "Esmalteria / Nail studio",
  "Escovaria",
  "Depilação",
  "Clínica de estética",
  "Maquiagem",
];

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatPrice(priceInCents: number): string {
  return (priceInCents / 100).toFixed(2).replace(".", ",");
}

function getPlanRelation(
  plan: SubscriptionPlan,
  currentPlan: SubscriptionPlan | null | undefined,
): "current" | "upgrade" | "downgrade" | "new" {
  if (!currentPlan) return "new";
  if (plan === currentPlan) return "current";
  return PLAN_ORDER[plan] > PLAN_ORDER[currentPlan] ? "upgrade" : "downgrade";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UniversalPlansBanner() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 px-6 py-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            Todos os planos funcionam para qualquer tipo de negócio
          </p>

          <div className="flex flex-wrap gap-1.5">
            {BUSINESS_SEGMENTS.map((segment) => (
              <span
                key={segment}
                className="rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-foreground"
              >
                {segment}
              </span>
            ))}
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              e muito mais...
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            Comece pelo plano que couber no seu momento —{" "}
            <span className="font-medium text-foreground">
              a diferença está apenas nos limites de uso.
            </span>{" "}
            Quando seu negócio crescer, é só fazer upgrade.
          </p>
        </div>
      </div>
    </div>
  );
}

interface FeatureListProps {
  items: string[];
  label?: string;
}

function FeatureList({ items, label }: FeatureListProps) {
  return (
    <div className="space-y-3">
      {label && (
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      )}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <span className="text-sm">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PlanCardButtonProps {
  plan: SubscriptionPlan;
  relation: ReturnType<typeof getPlanRelation>;
  isLoading: boolean;
  onClick: () => void;
}

function PlanCardButton({
  plan,
  relation,
  isLoading,
  onClick,
}: PlanCardButtonProps) {
  const label = useMemo(() => {
    if (relation === "current") return "Plano Atual";
    if (relation === "upgrade") return "Fazer Upgrade";
    if (relation === "downgrade") return "Fazer Downgrade";
    return PLAN_LABELS[plan] ?? "Assinar";
  }, [plan, relation]);

  const variant = useMemo(() => {
    if (relation === "current") return "secondary" as const;
    return plan === RECOMMENDED_PLAN
      ? ("default" as const)
      : ("outline" as const);
  }, [plan, relation]);

  const icon = useMemo(() => {
    if (isLoading) return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
    if (relation === "upgrade") return <ArrowUp className="mr-2 h-4 w-4" />;
    return <CreditCard className="mr-2 h-4 w-4" />;
  }, [isLoading, relation]);

  return (
    <Button
      className="w-full"
      variant={variant}
      onClick={onClick}
      disabled={relation === "current" || isLoading}
    >
      {icon}
      {label}
    </Button>
  );
}

interface PlanCardProps {
  plan: PlanData;
  relation: ReturnType<typeof getPlanRelation>;
  isLoading: boolean;
  onSubscribe: (plan: SubscriptionPlan) => void;
}

function PlanCard({ plan, relation, isLoading, onSubscribe }: PlanCardProps) {
  const isRecommended = plan.plan === RECOMMENDED_PLAN;
  const isCurrent = relation === "current";

  return (
    <Card
      className={
        isCurrent
          ? "border-green-500 shadow-lg"
          : isRecommended
            ? "border-primary shadow-lg"
            : ""
      }
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{plan.name}</CardTitle>
          <div className="flex gap-2">
            {isCurrent && <Badge className="bg-green-500">Atual</Badge>}
            {isRecommended && !isCurrent && (
              <Badge className="bg-primary">Recomendado</Badge>
            )}
          </div>
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <span className="text-4xl font-bold">
            R$ {formatPrice(plan.priceInCents)}
          </span>
          <span className="text-muted-foreground">/mês</span>
        </div>

        <FeatureList items={plan.features} />
        <FeatureList items={plan.idealFor} label="Ideal para" />

        <PlanCardButton
          plan={plan.plan}
          relation={relation}
          isLoading={isLoading}
          onClick={() => onSubscribe(plan.plan)}
        />
      </CardContent>
    </Card>
  );
}

interface ManageSubscriptionCardProps {
  isOpeningPortal: boolean;
  isSyncing: boolean;
  onOpenPortal: () => void;
  onSync: () => void;
}

const PORTAL_FEATURES = [
  "Atualizar método de pagamento",
  "Visualizar histórico de faturas",
  "Baixar recibos",
  "Cancelar assinatura",
];

function ManageSubscriptionCard({
  isOpeningPortal,
  isSyncing,
  onOpenPortal,
  onSync,
}: ManageSubscriptionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Assinatura</CardTitle>
        <CardDescription>
          Acesse o portal do cliente para atualizar dados de pagamento,
          visualizar faturas ou cancelar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No portal do Stripe você pode:
        </p>
        <ul className="space-y-2 text-sm">
          {PORTAL_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-muted-foreground" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onOpenPortal}
            disabled={isOpeningPortal}
          >
            {isOpeningPortal ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="mr-2 h-4 w-4" />
            )}
            Abrir Portal do Cliente
          </Button>

          <Button
            variant="secondary"
            className="flex-1"
            onClick={onSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sincronizar Assinatura
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Use &quot;Sincronizar Assinatura&quot; caso seu pagamento tenha sido
          confirmado no Stripe mas não esteja refletindo aqui.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useSubscriptionActions(
  currentPlan: SubscriptionPlan | null | undefined,
) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [downgrade, setDowngrade] = useState<DowngradeState>(
    DOWNGRADE_STATE_INITIAL,
  );

  const resetDowngrade = useCallback(() => {
    setDowngrade(DOWNGRADE_STATE_INITIAL);
  }, []);

  const { execute: subscribe, isPending: isSubscribing } = useAction(
    createSubscriptionCheckout,
    {
      onSuccess: ({ data }) => {
        if (data?.url) window.location.href = data.url;
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro ao criar checkout");
        setSelectedPlan(null);
      },
    },
  );

  const { execute: changePlan, isPending: isChangingPlan } = useAction(
    changeSubscriptionPlan,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success(data.message);
          router.refresh();
        }
        setSelectedPlan(null);
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro ao alterar plano");
        setSelectedPlan(null);
      },
    },
  );

  const { execute: openPortal, isPending: isOpeningPortal } = useAction(
    getCustomerPortalUrl,
    {
      onSuccess: ({ data }) => {
        if (data?.url) window.location.href = data.url;
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro ao abrir portal");
      },
    },
  );

  const { execute: sync, isPending: isSyncing } = useAction(syncSubscription, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success(data.message);
        window.location.reload();
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao sincronizar assinatura");
    },
  });

  const { execute: getImpact } = useAction(getDowngradeImpactAction, {
    onSuccess: ({ data }) => {
      setDowngrade((prev) => ({
        ...prev,
        impact: data ?? null,
        isLoadingImpact: false,
      }));
    },
    onError: () => {
      setDowngrade((prev) => ({
        ...prev,
        impact: null,
        isLoadingImpact: false,
      }));
    },
  });

  const executePlan = useCallback(
    (plan: SubscriptionPlan) => {
      setSelectedPlan(plan);
      if (currentPlan) {
        changePlan({ plan });
      } else {
        subscribe({ plan });
      }
    },
    [currentPlan, changePlan, subscribe],
  );

  const handleSubscribe = useCallback(
    (plan: SubscriptionPlan) => {
      const relation = getPlanRelation(plan, currentPlan);

      if (relation === "downgrade") {
        setDowngrade({
          isOpen: true,
          pendingPlan: plan,
          impact: null,
          isLoadingImpact: true,
        });
        getImpact({ toPlan: plan });
        return;
      }

      executePlan(plan);
    },
    [currentPlan, executePlan, getImpact],
  );

  const handleConfirmDowngrade = useCallback(() => {
    if (downgrade.pendingPlan) {
      executePlan(downgrade.pendingPlan);
      resetDowngrade();
    }
  }, [downgrade.pendingPlan, executePlan, resetDowngrade]);

  return {
    selectedPlan,
    downgrade,
    setDowngrade,
    resetDowngrade,
    handleSubscribe,
    handleConfirmDowngrade,
    openPortal,
    sync,
    isSubscribing,
    isChangingPlan,
    isOpeningPortal,
    isSyncing,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SubscriptionPlans({
  plans,
  currentPlan,
}: SubscriptionPlansProps) {
  const searchParams = useSearchParams();
  const toastShownRef = useRef(false);

  const showSuccess = useMemo(
    () => searchParams.get("success") === "true",
    [searchParams],
  );

  useEffect(() => {
    if (showSuccess && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success("Assinatura ativada com sucesso!");
    }
  }, [showSuccess]);

  const {
    selectedPlan,
    downgrade,
    setDowngrade,
    resetDowngrade,
    handleSubscribe,
    handleConfirmDowngrade,
    openPortal,
    sync,
    isSubscribing,
    isChangingPlan,
    isOpeningPortal,
    isSyncing,
  } = useSubscriptionActions(currentPlan);

  const isLoading = isSubscribing || isChangingPlan;

  const pendingPlanData = useMemo(
    () => plans.find((p) => p.plan === downgrade.pendingPlan),
    [plans, downgrade.pendingPlan],
  );

  return (
    <>
      <DowngradeAlertDialog
        open={downgrade.isOpen}
        onOpenChange={(open) => {
          if (!open) resetDowngrade();
          else setDowngrade((prev) => ({ ...prev, isOpen: open }));
        }}
        onConfirm={handleConfirmDowngrade}
        isLoading={isLoading}
        isLoadingImpact={downgrade.isLoadingImpact}
        targetPlanName={pendingPlanData?.name}
        newMaxServices={pendingPlanData?.maxServices}
        newMaxProfessionals={pendingPlanData?.maxProfessionals}
        newMaxBarbershops={pendingPlanData?.maxBarbershops}
        impact={downgrade.impact}
      />

      <div className="space-y-8">
        {/* Cabeçalho */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Planos que crescem com você</h1>
          <p className="mt-2 text-muted-foreground">
            Escolha o plano ideal para o seu negócio
          </p>
        </div>

        {/* Banner de sucesso */}
        {showSuccess && (
          <Card className="border-green-500 bg-green-50 dark:bg-green-950">
            <CardContent className="flex items-center gap-3 pt-6">
              <Check className="h-5 w-5 text-green-600" />
              <p className="text-green-800 dark:text-green-200">
                Sua assinatura foi ativada com sucesso!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Banner universal */}
        <UniversalPlansBanner />

        {/* Cards dos planos */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.plan}
              plan={plan}
              relation={getPlanRelation(plan.plan, currentPlan)}
              isLoading={isLoading && selectedPlan === plan.plan}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>

        {/* Gerenciar assinatura */}
        <ManageSubscriptionCard
          isOpeningPortal={isOpeningPortal}
          isSyncing={isSyncing}
          onOpenPortal={() => openPortal()}
          onSync={() => sync()}
        />
      </div>
    </>
  );
}
