import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, Scissors, Clock, ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function OwnerServicesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedBarbershops: {
        include: {
          services: {
            orderBy: { name: "asc" },
          },
        },
      },
    },
  });

  if (!user || user.ownedBarbershops.length === 0) {
    redirect("/");
  }

  const activeBarbershop = user.ownedBarbershops[0];
  const services = activeBarbershop.services.filter((s) => !s.deletedAt);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">
            Gerencie os serviços oferecidos pela sua barbearia
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/owner/services/new">
            <Plus className="mr-2 size-4" />
            Novo Serviço
          </Link>
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Scissors className="text-muted-foreground mb-4 size-12" />
            <p className="text-muted-foreground text-lg">
              Nenhum serviço cadastrado
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              Adicione serviços para seus clientes agendarem
            </p>
            <Button asChild>
              <Link href="/dashboard/owner/services/new">
                <Plus className="mr-2 size-4" />
                Adicionar Serviço
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              <div className="relative aspect-video">
                {service.imageUrl ? (
                  <Image
                    src={service.imageUrl}
                    alt={service.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-muted flex size-full items-center justify-center">
                    <ImageIcon className="text-muted-foreground size-12" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{service.name}</span>
                  <Badge variant="secondary">
                    {formatCurrency(service.priceInCents)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground line-clamp-2 text-sm">
                  {service.description}
                </p>
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Clock className="size-4" />
                  {service.durationMinutes} minutos
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/dashboard/owner/services/${service.id}/edit`}>
                      Editar
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
