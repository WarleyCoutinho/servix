"use client";

import { createSubscriptionCheckout } from "@/actions/subscriptions/create-subscription-checkout";
import { getCustomerPortalUrl } from "@/actions/subscriptions/get-customer-portal-url";
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
import { Check, CreditCard, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface PlanData {
  plan: SubscriptionPlan;
  name: string;
  description: string;
  priceInCents: number;
  maxBarbershops: number;
  maxProfessionals: number;
  maxServices: number | null;
  features: string[];
}

interface SubscriptionPlansProps {
  plans: PlanData[];
  currentPlan?: SubscriptionPlan | null;
}

const RECOMMENDED_PLAN = SubscriptionPlan.PROFESSIONAL;

const PLAN_ORDER: Record<SubscriptionPlan, number> = {
  [SubscriptionPlan.BASIC]: 1,
  [SubscriptionPlan.STANDARD]: 2,
  [SubscriptionPlan.PROFESSIONAL]: 3,
  [SubscriptionPlan.ENTERPRISE]: 4,
};

export function SubscriptionPlans({ plans, currentPlan }: SubscriptionPlansProps) {
  const searchParams = useSearchParams();
  const toastShownRef = useRef(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [showDowngradeAlert, setShowDowngradeAlert] = useState(false);
  const [pendingDowngradePlan, setPendingDowngradePlan] =
    useState<SubscriptionPlan | null>(null);

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

  console.log("Plans data:", plans);
  console.log("Plans length:", plans?.length);

  const { execute: subscribe, isPending: isSubscribing } = useAction(
    createSubscriptionCheckout,
    {
      onSuccess: ({ data }) => {
        if (data?.url) {
          window.location.href = data.url;
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro ao criar checkout");
        setSelectedPlan(null);
      },
    },
  );

  const { execute: openPortal, isPending: isOpeningPortal } = useAction(
    getCustomerPortalUrl,
    {
      onSuccess: ({ data }) => {
        if (data?.url) {
          window.location.href = data.url;
        }
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

  const isDowngrade = (targetPlan: SubscriptionPlan): boolean => {
    if (!currentPlan) return false;
    return PLAN_ORDER[targetPlan] < PLAN_ORDER[currentPlan];
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (isDowngrade(plan) && plan === SubscriptionPlan.BASIC) {
      setPendingDowngradePlan(plan);
      setShowDowngradeAlert(true);
      return;
    }

    setSelectedPlan(plan);
    subscribe({ plan });
  };

  const handleConfirmDowngrade = () => {
    if (pendingDowngradePlan) {
      setSelectedPlan(pendingDowngradePlan);
      subscribe({ plan: pendingDowngradePlan });
      setShowDowngradeAlert(false);
      setPendingDowngradePlan(null);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2).replace(".", ",");
  };

  const getButtonVariant = (plan: SubscriptionPlan) => {
    return plan === RECOMMENDED_PLAN
      ? ("default" as const)
      : ("outline" as const);
  };

  const getButtonText = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.BASIC:
        return "Assinar Básico";
      case SubscriptionPlan.STANDARD:
        return "Assinar Padrão";
      case SubscriptionPlan.PROFESSIONAL:
        return "Assinar Profissional";
      case SubscriptionPlan.ENTERPRISE:
        return "Assinar Empresarial";
      default:
        return "Assinar";
    }
  };

  return (
    <>
      <DowngradeAlertDialog
        open={showDowngradeAlert}
        onOpenChange={setShowDowngradeAlert}
        onConfirm={handleConfirmDowngrade}
        isLoading={isSubscribing}
      />

      <div className="space-y-6">
        <div className="text-center">
        <h1 className="text-3xl font-bold">Planos que crescem com você</h1>
        <p className="text-muted-foreground mt-2">
          Escolha o plano ideal para o seu negócio
        </p>
      </div>

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isRecommended = plan.plan === RECOMMENDED_PLAN;
          return (
            <Card
              key={plan.plan}
              className={isRecommended ? "border-primary shadow-lg" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {isRecommended && (
                    <Badge className="bg-primary">Recomendado</Badge>
                  )}
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

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={getButtonVariant(plan.plan)}
                  onClick={() => handleSubscribe(plan.plan)}
                  disabled={isSubscribing && selectedPlan === plan.plan}
                >
                  {isSubscribing && selectedPlan === plan.plan ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  {getButtonText(plan.plan)}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Gerenciar Assinatura</CardTitle>
          <CardDescription>
            Acesse o portal do cliente para atualizar dados de pagamento,
            visualizar faturas ou cancelar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            No portal do Stripe você pode:
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="text-muted-foreground h-4 w-4" />
              Atualizar método de pagamento
            </li>
            <li className="flex items-center gap-2">
              <Check className="text-muted-foreground h-4 w-4" />
              Visualizar histórico de faturas
            </li>
            <li className="flex items-center gap-2">
              <Check className="text-muted-foreground h-4 w-4" />
              Baixar recibos
            </li>
            <li className="flex items-center gap-2">
              <Check className="text-muted-foreground h-4 w-4" />
              Cancelar assinatura
            </li>
          </ul>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => openPortal()}
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
              onClick={() => sync()}
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

          <p className="text-muted-foreground text-xs">
            Use &quot;Sincronizar Assinatura&quot; caso seu pagamento tenha sido
            confirmado no Stripe mas não esteja refletindo aqui.
          </p>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
