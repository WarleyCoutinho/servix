import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfessionalStripeStatus } from "@/lib/stripe-connect";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
    await updateProfessionalStripeStatus(professional.stripeAccountId);
  }

  const updatedProfessional = await prisma.professional.findUnique({
    where: { id: professional.id },
  });

  const isComplete = updatedProfessional?.stripeOnboardingComplete;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {isComplete ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold">
              Configuração concluída!
            </h1>
            <p className="text-muted-foreground">
              Sua conta Stripe foi configurada com sucesso. Você já pode receber
              pagamentos pelos seus serviços.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold">
              Configuração pendente
            </h1>
            <p className="text-muted-foreground">
              Sua conta Stripe ainda não está completamente configurada. Pode
              levar alguns minutos para a verificação ser concluída, ou você pode
              precisar fornecer informações adicionais.
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/dashboard/professional">
              Ir para o Dashboard
            </Link>
          </Button>
          {!isComplete && (
            <Button variant="outline" asChild>
              <Link href="/onboarding/professional">
                Continuar configuração
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
