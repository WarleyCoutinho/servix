import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfessionalStripeStatus } from "@/lib/stripe-connect";
import { StripeAccountStatus } from "@/generated/prisma/enums";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function StripeReturnPage() {
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
    redirect("/");
  }

  if (professional.stripeAccountId) {
    try {
      await updateProfessionalStripeStatus(professional.stripeAccountId);
    } catch (error) {
      console.error("[Stripe Return] Erro ao atualizar status:", error);
    }
  }

  const updatedProfessional = await prisma.professional.findUnique({
    where: { id: professional.id },
  });

  const isComplete = updatedProfessional?.stripeOnboardingComplete;
  const isActive =
    updatedProfessional?.stripeAccountStatus === StripeAccountStatus.ACTIVE;
  const isRestricted =
    updatedProfessional?.stripeAccountStatus === StripeAccountStatus.RESTRICTED;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {isActive ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">Configuração concluída!</h1>
            <p className="text-muted-foreground">
              Sua conta Stripe foi configurada com sucesso. Você já pode receber
              pagamentos pelos seus serviços.
            </p>
          </>
        ) : isComplete ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold">Verificação em andamento</h1>
            <p className="text-muted-foreground">
              Seus dados foram enviados com sucesso! O Stripe está verificando
              suas informações. Isso pode levar alguns minutos. Você será
              notificado quando sua conta estiver ativa.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold">Configuração pendente</h1>
            <p className="text-muted-foreground">
              Sua conta Stripe ainda não está completamente configurada. Você
              precisa fornecer informações adicionais para concluir o cadastro.
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/dashboard/professional">Ir para o Dashboard</Link>
          </Button>
          {(!isComplete || isRestricted) && (
            <Button variant="outline" asChild>
              <Link href="/onboarding/professional">
                {isRestricted
                  ? "Completar informações pendentes"
                  : "Continuar configuração"}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
