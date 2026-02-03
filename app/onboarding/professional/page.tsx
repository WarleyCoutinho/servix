"use client";

import { useAction } from "next-safe-action/hooks";
import { startStripeOnboarding } from "@/actions/professionals/start-stripe-onboarding";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ProfessionalOnboardingPage() {
  const { execute, isPending } = useAction(startStripeOnboarding, {
    onSuccess: ({ data }) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: ({ error }) => {
      const errorMessage =
        error.serverError ??
        error.validationErrors?.formErrors?.[0] ??
        "Erro ao iniciar configuração do Stripe";
      toast.error(errorMessage);
    },
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CreditCard className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">
            Configure sua conta de pagamentos
          </h1>
          <p className="text-muted-foreground">
            Para receber pagamentos pelos seus serviços, você precisa configurar
            sua conta no Stripe. É rápido e seguro.
          </p>
        </div>

        <div className="space-y-4 text-left">
          <h2 className="font-semibold">O que você vai precisar:</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Documento de identidade (RG ou CNH)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Dados bancários para recebimento
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              Comprovante de endereço (opcional)
            </li>
          </ul>
        </div>

        <Button
          onClick={() => execute()}
          disabled={isPending}
          className="w-full"
          size="lg"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Configurar conta Stripe
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Seus dados bancários são processados diretamente pelo Stripe e nunca
          são armazenados em nossos servidores.
        </p>
      </div>
    </div>
  );
}
