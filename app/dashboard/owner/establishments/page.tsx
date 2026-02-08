import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { auth } from "@/lib/auth";
import { getActiveBarbershop } from "@/lib/get-active-barbershop";
import { checkBarbershopLimit } from "@/lib/plan-limits";
import { AlertTriangle, MapPin, Phone, Plus, Store, Users } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function EstablishmentsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const data = await getActiveBarbershop(session.user.id);

  if (!data) {
    redirect("/");
  }

  const { user, activeBarbershop, ownedBarbershops } = data;

  const limitCheck = await checkBarbershopLimit(user.id);
  const canAddEstablishment = limitCheck.allowed;
  const maxEstablishments = limitCheck.maxBarbershops ?? 1;

  const barbershopsWithCounts = await Promise.all(
    ownedBarbershops.map(async (barbershop) => {
      const [professionalsCount, servicesCount] = await Promise.all([
        prisma.professional.count({
          where: { barbershopId: barbershop.id, isActive: true },
        }),
        prisma.barbershopService.count({
          where: { barbershopId: barbershop.id, deletedAt: null },
        }),
      ]);
      return {
        ...barbershop,
        professionalsCount,
        servicesCount,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estabelecimentos</h1>
          <p className="text-muted-foreground">
            Gerencie suas lojas
            <span className="ml-2">
              ({ownedBarbershops.length}/{maxEstablishments})
            </span>
          </p>
        </div>
        {canAddEstablishment && (
          <Button asChild>
            <Link href="/dashboard/owner/establishments/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Loja
            </Link>
          </Button>
        )}
      </div>

      {!canAddEstablishment && maxEstablishments === 1 && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Plano com 1 estabelecimento
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            Seu plano atual permite apenas 1 estabelecimento. Faça upgrade para o plano
            Enterprise para ter até 5 lojas.
          </AlertDescription>
        </Alert>
      )}

      {!canAddEstablishment && maxEstablishments > 1 && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            Limite de estabelecimentos atingido
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            Você atingiu o limite de {maxEstablishments} estabelecimentos do seu plano.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {barbershopsWithCounts.map((barbershop) => {
          const isActive = barbershop.id === activeBarbershop.id;
          return (
            <Card
              key={barbershop.id}
              className={isActive ? "border-primary shadow-lg" : ""}
            >
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Store className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{barbershop.name}</CardTitle>
                    {isActive && (
                      <Badge variant="default" className="mt-1">
                        Loja Ativa
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{barbershop.address}</span>
                  </div>
                  {barbershop.phones[0] && (
                    <div className="text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{barbershop.phones[0]}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="text-muted-foreground h-4 w-4" />
                    <span>{barbershop.professionalsCount} profissionais</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full"
                >
                  <Link href={`/dashboard/owner/establishments/${barbershop.id}`}>
                    Gerenciar
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
