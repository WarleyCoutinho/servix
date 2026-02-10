import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllProfessionalsByBarbershop } from "@/data/professionals";
import { StripeAccountStatus } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { getActiveBarbershop } from "@/lib/get-active-barbershop";
import { getPlanLimits, getUserPlanInfo } from "@/lib/plan-limits";
import { AlertTriangle, Plus, UserCheck, UserX } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

function getStripeStatusBadge(status: StripeAccountStatus) {
  switch (status) {
    case StripeAccountStatus.ACTIVE:
      return <Badge variant="default">Stripe Ativo</Badge>;
    case StripeAccountStatus.ONBOARDING:
      return <Badge variant="secondary">Configurando Stripe</Badge>;
    case StripeAccountStatus.PENDING:
      return <Badge variant="outline">Stripe Pendente</Badge>;
    case StripeAccountStatus.RESTRICTED:
      return <Badge variant="destructive">Stripe Restrito</Badge>;
    case StripeAccountStatus.DISABLED:
      return <Badge variant="destructive">Stripe Desativado</Badge>;
    default:
      return null;
  }
}

export default async function ProfessionalsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const data = await getActiveBarbershop(session.user.id);

  if (!data || !data.activeBarbershop) {
    redirect("/dashboard/owner/subscription");
  }

  const { user, activeBarbershop } = data;
  const professionals = await getAllProfessionalsByBarbershop(
    activeBarbershop.id,
  );

  const planInfo = await getUserPlanInfo(user.id, activeBarbershop.id);
  const isBasicPlan = planInfo?.isBasicPlan ?? false;
  const limits = await getPlanLimits(activeBarbershop.id);

  const canAddProfessional = !isBasicPlan && (limits?.canAddProfessional ?? false);
  const isAtLimit = !isBasicPlan && limits && !limits.canAddProfessional;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profissionais</h1>
          <p className="text-muted-foreground">
            Gerencie os profissionais da sua barbearia
            {limits && !isBasicPlan && (
              <span className="ml-2">
                ({limits.currentProfessionals}/{limits.maxProfessionals})
              </span>
            )}
          </p>
        </div>
        {!isBasicPlan && (
          <Button asChild disabled={!canAddProfessional}>
            <Link href={canAddProfessional ? "/dashboard/owner/professionals/new" : "#"}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Profissional
            </Link>
          </Button>
        )}
      </div>

      {isBasicPlan && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Plano Básico
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-3 text-yellow-700 dark:text-yellow-300">
            <span>
              No plano Básico, você é o único profissional do estabelecimento.
              Para adicionar outros profissionais, faça upgrade para o plano
              Standard ou superior.
            </span>
            <Button size="sm" variant="outline" className="w-fit" asChild>
              <Link href="/dashboard/owner/subscription">Fazer Upgrade</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isAtLimit && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Limite de profissionais atingido
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-3 text-yellow-700 dark:text-yellow-300">
            <span>
              Você atingiu o limite de {limits.maxProfessionals} profissionais
              do seu plano.
            </span>
            <Button size="sm" variant="outline" className="w-fit" asChild>
              <Link href="/dashboard/owner/subscription">Fazer Upgrade</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {professionals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-muted-foreground">
              Nenhum profissional cadastrado ainda.
            </p>
            {canAddProfessional && (
              <Button asChild>
                <Link href="/dashboard/owner/professionals/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeiro Profissional
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map((professional) => (
            <Card key={professional.id}>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={professional.imageUrl ?? professional.user.image ?? ""}
                  />
                  <AvatarFallback>
                    {(professional.displayName ?? professional.user.name)
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {professional.displayName ?? professional.user.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {professional.user.email}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {professional.isActive ? (
                    <Badge variant="default" className="gap-1">
                      <UserCheck className="h-3 w-3" />
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <UserX className="h-3 w-3" />
                      Bloqueado
                    </Badge>
                  )}
                  {getStripeStatusBadge(professional.stripeAccountStatus)}
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">
                    CPF:{" "}
                    {professional.cpf.replace(
                      /(\d{3})(\d{3})(\d{3})(\d{2})/,
                      "$1.$2.$3-$4",
                    )}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <Link
                      href={`/dashboard/owner/professionals/${professional.id}`}
                    >
                      Gerenciar
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
