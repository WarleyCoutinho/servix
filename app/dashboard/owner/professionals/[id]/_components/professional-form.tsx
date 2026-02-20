"use client";

import { removeProfessional } from "@/actions/professionals/remove-professional";
import { toggleProfessionalStatus } from "@/actions/professionals/toggle-professional-status";
import { updateProfessional } from "@/actions/professionals/update-professional";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StripeAccountStatus } from "@/generated/prisma/enums";
import {
  AlertTriangle,
  Loader2,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ProfessionalFormProps {
  professional: {
    id: string;
    cpf: string;
    displayName: string | null;
    bio: string | null;
    isActive: boolean;
    whatsappGroupName: string | null;
    stripeAccountStatus: StripeAccountStatus;
    stripeOnboardingComplete: boolean;
    user: {
      name: string;
      email: string;
      image: string | null;
    };
  };
  isBasicPlan: boolean;
  isOwnerProfessional: boolean;
  canActivateProfessional: boolean;
}

function getStripeStatusInfo(status: StripeAccountStatus) {
  switch (status) {
    case StripeAccountStatus.ACTIVE:
      return { label: "Ativo", variant: "default" as const };
    case StripeAccountStatus.ONBOARDING:
      return { label: "Configurando", variant: "secondary" as const };
    case StripeAccountStatus.PENDING:
      return { label: "Pendente", variant: "outline" as const };
    case StripeAccountStatus.RESTRICTED:
      return { label: "Restrito", variant: "destructive" as const };
    case StripeAccountStatus.DISABLED:
      return { label: "Desativado", variant: "destructive" as const };
    default:
      return { label: "Desconhecido", variant: "outline" as const };
  }
}

export default function ProfessionalForm({
  professional,
  isBasicPlan,
  isOwnerProfessional,
  canActivateProfessional,
}: ProfessionalFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: professional.displayName ?? professional.user.name,
    email: professional.user.email,
    bio: professional.bio ?? "",
    whatsappGroupName: professional.whatsappGroupName ?? "",
  });

  const { execute: executeUpdate, isPending: isUpdating } = useAction(
    updateProfessional,
    {
      onSuccess: () => {
        toast.success("Profissional atualizado com sucesso!");
      },
      onError: ({ error }) => {
        let errorMessage = "Erro ao atualizar profissional";
        if (error.serverError) {
          errorMessage = error.serverError;
        } else if (error.validationErrors) {
          const firstFieldError = Object.values(error.validationErrors).find(
            (v) => v && typeof v === "object" && "_errors" in v,
          ) as { _errors?: string[] } | undefined;
          if (firstFieldError?._errors?.[0]) {
            errorMessage = firstFieldError._errors[0];
          }
        }
        toast.error(errorMessage);
      },
    },
  );

  const { execute: executeToggleStatus, isPending: isTogglingStatus } =
    useAction(toggleProfessionalStatus, {
      onSuccess: (result) => {
        const newStatus = result.data?.isActive ? "ativado" : "bloqueado";
        toast.success(`Profissional ${newStatus} com sucesso!`);
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro ao alterar status");
      },
    });

  const { execute: executeRemove, isPending: isRemoving } = useAction(
    removeProfessional,
    {
      onSuccess: () => {
        toast.success("Profissional removido com sucesso!");
        router.push("/dashboard/owner/professionals");
      },
      onError: ({ error }) => {
        let errorMessage = "Erro ao remover profissional";
        if (error.serverError) {
          errorMessage = error.serverError;
        } else if (error.validationErrors) {
          const errors = error.validationErrors._errors;
          if (errors && errors.length > 0) {
            errorMessage = errors[0];
          }
        }
        toast.error(errorMessage);
      },
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeUpdate({
      professionalId: professional.id,
      ...formData,
    });
  };

  const handleToggleStatus = () => {
    executeToggleStatus({
      professionalId: professional.id,
      isActive: !professional.isActive,
    });
  };

  const handleRemove = () => {
    executeRemove({ professionalId: professional.id });
  };

  const stripeStatus = getStripeStatusInfo(professional.stripeAccountStatus);
  const isLoading = isUpdating || isTogglingStatus || isRemoving;

  const canToggleStatus = (() => {
    if (professional.isActive) {
      return true;
    }
    if (isOwnerProfessional) {
      return true;
    }
    if (isBasicPlan) {
      return false;
    }
    return canActivateProfessional;
  })();

  const toggleStatusDisabledReason = (() => {
    if (canToggleStatus) return null;
    if (isBasicPlan && !isOwnerProfessional) {
      return "No plano Básico, apenas o proprietário pode ser profissional. Faça upgrade para reativar.";
    }
    return "Limite de profissionais ativos atingido. Faça upgrade para reativar.";
  })();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Profissional</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome de Exibição</Label>
                <Input
                  id="displayName"
                  placeholder="Nome do profissional"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={professional.cpf.replace(
                    /(\d{3})(\d{3})(\d{3})(\d{2})/,
                    "$1.$2.$3-$4",
                  )}
                  disabled
                  className="bg-muted"
                />
                <p className="text-muted-foreground text-xs">
                  CPF não pode ser alterado
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biografia (opcional)</Label>
              <Textarea
                id="bio"
                placeholder="Uma breve descrição do profissional..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsappGroupName">Nome do Grupo WhatsApp</Label>
              <Input
                id="whatsappGroupName"
                placeholder="Ex: Agenda - João Silva"
                value={formData.whatsappGroupName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whatsappGroupName: e.target.value,
                  })
                }
                disabled={isLoading}
              />
              <p className="text-muted-foreground text-xs">
                Nome exato do grupo no WhatsApp onde a agenda será enviada
                automaticamente.
              </p>
            </div>

            <Button type="submit" disabled={isLoading}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conta Stripe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Status da Conta Stripe</p>
              <p className="text-muted-foreground text-sm">
                A configuração da conta bancária é gerenciada pelo próprio
                profissional
              </p>
            </div>
            <Badge variant={stripeStatus.variant} className="w-fit">
              {stripeStatus.label}
            </Badge>
          </div>

          {professional.stripeAccountStatus === StripeAccountStatus.PENDING && (
            <div className="bg-muted/50 flex items-start gap-3 rounded-lg p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Conta não configurada</p>
                <p className="text-muted-foreground text-sm">
                  O profissional precisa acessar o painel e configurar sua conta
                  Stripe para receber pagamentos diretamente.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status e Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                {professional.isActive ? (
                  <UserCheck className="h-5 w-5 shrink-0 text-green-600" />
                ) : (
                  <UserX className="h-5 w-5 shrink-0 text-red-600" />
                )}
                <div>
                  <p className="font-medium">
                    {professional.isActive
                      ? "Profissional Ativo"
                      : "Profissional Bloqueado"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {professional.isActive
                      ? "O profissional pode receber agendamentos"
                      : "O profissional não pode receber agendamentos"}
                  </p>
                </div>
              </div>
              <Button
                variant={professional.isActive ? "destructive" : "default"}
                onClick={handleToggleStatus}
                disabled={isLoading || !canToggleStatus}
                className="w-full sm:w-auto"
              >
                {isTogglingStatus && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {professional.isActive ? "Bloquear" : "Ativar"}
              </Button>
            </div>
            {toggleStatusDisabledReason && (
              <div className="flex items-start gap-2 rounded-lg border border-yellow-500 bg-yellow-50 p-3 dark:bg-yellow-950">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {toggleStatusDisabledReason}
                </p>
              </div>
            )}
          </div>

          {!isOwnerProfessional && (
            <div className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-red-900 dark:bg-red-950">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">
                    Desativar Profissional
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    O profissional será desativado e não poderá receber
                    agendamentos. Você pode reativá-lo depois.
                  </p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    Desativar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Desativar profissional?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O profissional será desativado e não poderá receber novos
                      agendamentos. Agendamentos futuros precisam ser cancelados
                      primeiro. Você pode reativá-lo posteriormente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRemove}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isRemoving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Sim, desativar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
