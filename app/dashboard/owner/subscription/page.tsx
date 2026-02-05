"use client";

import { createSubscriptionCheckout } from "@/actions/subscriptions/create-subscription-checkout";
import { getCustomerPortalUrl } from "@/actions/subscriptions/get-customer-portal-url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const toastShownRef = useRef(false);

  const showSuccess = useMemo(
    () => searchParams.get("success") === "true",
    [searchParams]
  );

  useEffect(() => {
    if (showSuccess && !toastShownRef.current) {
      toastShownRef.current = true;
      toast.success("Assinatura ativada com sucesso!");
    }
  }, [showSuccess]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura da Servix
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Plano Barbearia</CardTitle>
              <Badge>Recomendado</Badge>
            </div>
            <CardDescription>
              Tudo que você precisa para gerenciar sua barbearia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <span className="text-4xl font-bold">R$ 99,90</span>
              <span className="text-muted-foreground">/mês</span>
            </div>

            <ul className="space-y-3">
              {[
                "Cadastro ilimitado de profissionais",
                "Cadastro ilimitado de serviços",
                "Agendamento online 24/7",
                "Pagamentos via Stripe Connect",
                "Relatórios e métricas",
                "Suporte prioritário",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full"
              onClick={() => subscribe()}
              disabled={isSubscribing}
            >
              {isSubscribing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              Assinar Agora
            </Button>
          </CardContent>
        </Card>

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
              <li>• Atualizar método de pagamento</li>
              <li>• Visualizar histórico de faturas</li>
              <li>• Baixar recibos</li>
              <li>• Cancelar assinatura</li>
            </ul>

            <Button
              variant="outline"
              className="w-full"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
