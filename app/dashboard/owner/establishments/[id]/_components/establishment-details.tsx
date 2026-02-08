"use client";

import { setActiveBarbershop } from "@/actions/barbershops/set-active-barbershop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubscriptionStatus } from "@/generated/prisma/enums";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Loader2,
  MapPin,
  Phone,
  Scissors,
  Store,
  Users,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Barbershop {
  id: string;
  name: string;
  address: string;
  description: string | null;
  phones: string[];
  imageUrl: string | null;
  subscription: {
    status: SubscriptionStatus;
    plan: string;
  } | null;
  _count: {
    professionals: number;
    services: number;
    bookings: number;
  };
}

interface EstablishmentDetailsProps {
  barbershop: Barbershop;
  isActive: boolean;
}

export function EstablishmentDetails({
  barbershop,
  isActive,
}: EstablishmentDetailsProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: barbershop.name,
    address: barbershop.address,
    description: barbershop.description || "",
    phone: barbershop.phones[0] || "",
  });

  const { execute: setActive, isPending: isSettingActive } = useAction(
    setActiveBarbershop,
    {
      onSuccess: ({ data }) => {
        if (data?.success) {
          toast.success(data.message);
          router.refresh();
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro ao definir loja ativa");
      },
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/owner/establishments">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{barbershop.name}</h1>
            {isActive && <Badge variant="default">Loja Ativa</Badge>}
          </div>
          <p className="text-muted-foreground">Gerenciar estabelecimento</p>
        </div>
        {!isActive && (
          <Button
            onClick={() => setActive({ barbershopId: barbershop.id })}
            disabled={isSettingActive}
          >
            {isSettingActive ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Definir como Ativa
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <Store className="text-primary h-5 w-5" />
              </div>
              <div>
                <CardTitle>Informações</CardTitle>
                <CardDescription>Dados do estabelecimento</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={() => setIsEditing(false)}>Salvar</Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="text-muted-foreground h-4 w-4" />
                    <span>{barbershop.address}</span>
                  </div>
                  {barbershop.phones[0] && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="text-muted-foreground h-4 w-4" />
                      <span>{barbershop.phones[0]}</span>
                    </div>
                  )}
                  {barbershop.description && (
                    <p className="text-muted-foreground text-sm">
                      {barbershop.description}
                    </p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
            <CardDescription>Resumo do estabelecimento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
                  <Users className="text-primary h-6 w-6" />
                </div>
                <p className="text-2xl font-bold">
                  {barbershop._count.professionals}
                </p>
                <p className="text-muted-foreground text-xs">Profissionais</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
                  <Scissors className="text-primary h-6 w-6" />
                </div>
                <p className="text-2xl font-bold">
                  {barbershop._count.services}
                </p>
                <p className="text-muted-foreground text-xs">Serviços</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full">
                  <Calendar className="text-primary h-6 w-6" />
                </div>
                <p className="text-2xl font-bold">
                  {barbershop._count.bookings}
                </p>
                <p className="text-muted-foreground text-xs">Agendamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Gerencie profissionais e serviços desta loja
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {!isActive && (
              <p className="text-muted-foreground w-full text-sm">
                Defina esta loja como ativa para gerenciar profissionais e
                serviços.
              </p>
            )}
            {isActive && (
              <>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/owner/professionals">
                    <Users className="mr-2 h-4 w-4" />
                    Ver Profissionais
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/owner/services">
                    <Scissors className="mr-2 h-4 w-4" />
                    Ver Serviços
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard/owner/schedule">
                    <Calendar className="mr-2 h-4 w-4" />
                    Horários
                  </Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
