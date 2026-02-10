"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Users, Scissors, Store, Loader2 } from "lucide-react";

interface DowngradeImpact {
  professionalsToDisable: number;
  servicesToDisable: number;
  barbershopsToDisable: number;
}

interface DowngradeAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  isLoadingImpact?: boolean;
  targetPlanName?: string;
  newMaxServices?: number | null;
  newMaxProfessionals?: number;
  newMaxBarbershops?: number;
  impact?: DowngradeImpact | null;
}

export function DowngradeAlertDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  isLoadingImpact = false,
  targetPlanName = "Básico",
  newMaxServices = 5,
  newMaxProfessionals = 1,
  newMaxBarbershops = 1,
  impact,
}: DowngradeAlertDialogProps) {
  const hasImpact =
    impact &&
    (impact.professionalsToDisable > 0 ||
      impact.servicesToDisable > 0 ||
      impact.barbershopsToDisable > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Confirmar Downgrade para {targetPlanName}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Ao mudar para o plano {targetPlanName}, os recursos e limites serão
            reduzidos de acordo com as regras do plano.{" "}
            <strong>Seus dados não serão apagados</strong> — apenas ficarão
            desativados e poderão ser recuperados em um upgrade futuro.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isLoadingImpact ? (
          <div className="my-4 flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="my-4 space-y-3">
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <h4 className="mb-3 font-semibold text-destructive">
                O que será alterado:
              </h4>
              <ul className="space-y-3">
                {impact && impact.barbershopsToDisable > 0 && (
                  <li className="flex items-start gap-3">
                    <Store className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <div>
                      <p className="font-medium">
                        {impact.barbershopsToDisable}{" "}
                        {impact.barbershopsToDisable === 1
                          ? "estabelecimento será desativado"
                          : "estabelecimentos serão desativados"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        O plano {targetPlanName} permite até {newMaxBarbershops}{" "}
                        {newMaxBarbershops === 1
                          ? "estabelecimento"
                          : "estabelecimentos"}
                        .
                      </p>
                    </div>
                  </li>
                )}
                {impact && impact.professionalsToDisable > 0 && (
                  <li className="flex items-start gap-3">
                    <Users className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <div>
                      <p className="font-medium">
                        {impact.professionalsToDisable}{" "}
                        {impact.professionalsToDisable === 1
                          ? "profissional será desativado"
                          : "profissionais serão desativados"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        O plano {targetPlanName} permite até{" "}
                        {newMaxProfessionals}{" "}
                        {newMaxProfessionals === 1
                          ? "profissional"
                          : "profissionais"}
                        .
                      </p>
                    </div>
                  </li>
                )}
                {impact && impact.servicesToDisable > 0 && (
                  <li className="flex items-start gap-3">
                    <Scissors className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <div>
                      <p className="font-medium">
                        {impact.servicesToDisable}{" "}
                        {impact.servicesToDisable === 1
                          ? "serviço será desativado"
                          : "serviços serão desativados"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        O plano {targetPlanName} permite até {newMaxServices}{" "}
                        {newMaxServices === 1 ? "serviço" : "serviços"}.
                      </p>
                    </div>
                  </li>
                )}
                {!hasImpact && (
                  <li className="text-sm text-muted-foreground">
                    Nenhum recurso será desativado com esta mudança. Seus dados
                    estão dentro dos limites do novo plano.
                  </li>
                )}
              </ul>
            </div>

            {hasImpact && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-50 p-4 dark:bg-amber-950/20">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Importante:</strong> Os dados desativados não serão
                  apagados. Se você fizer upgrade futuramente, eles serão
                  automaticamente reativados.
                </p>
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogCancel className="w-full" disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading || isLoadingImpact}
          >
            {isLoading ? "Processando..." : "Confirmar Downgrade"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
