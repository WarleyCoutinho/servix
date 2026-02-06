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
import { AlertTriangle, Users, Scissors } from "lucide-react";

interface DowngradeAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DowngradeAlertDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: DowngradeAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Confirmar Downgrade para Básico
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Ao mudar para o plano Básico, você perderá alguns recursos
            importantes. Esta ação pode afetar o funcionamento do seu
            estabelecimento.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="my-4 space-y-3">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <h4 className="mb-3 font-semibold text-destructive">
              O que você vai perder:
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-medium">Profissionais Adicionais</p>
                  <p className="text-sm text-muted-foreground">
                    Todos os profissionais cadastrados serão desativados. Apenas
                    você poderá atender.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Scissors className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="font-medium">Limite de Serviços</p>
                  <p className="text-sm text-muted-foreground">
                    Você terá limite de até 5 serviços cadastrados.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <AlertDialogCancel className="w-full" disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : "Confirmar Downgrade"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
