"use client";

import { useState, useEffect } from "react";
import { useAction } from "next-safe-action/hooks";
import { toggleManualActivation } from "@/actions/admin/toggle-manual-activation";
import { getManualActivationLogs } from "@/actions/admin/get-manual-activation-logs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Zap, XCircle, RefreshCw, History } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ManualActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string | null;
  professionalName: string | null;
  acceptsPayAfterService: boolean;
  stripeAccountStatus: string;
  chargesEnabled: boolean;
  onStatusChange: (
    professionalId: string,
    acceptsPayAfterService: boolean,
    stripeAccountStatus: string,
  ) => void;
}

interface LogEntry {
  id: string;
  action: string;
  reason: string | null;
  stripeStatusAtMoment: string | null;
  performedByName: string;
  performedByRole: string;
  performedAt: Date;
}

const STRIPE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Ativo", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  ONBOARDING: { label: "Configurando", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  RESTRICTED: { label: "Restrito", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  DISABLED: { label: "Desabilitado", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

export function ManualActivationDialog({
  open,
  onOpenChange,
  professionalId,
  professionalName,
  acceptsPayAfterService,
  stripeAccountStatus,
  chargesEnabled,
  onStatusChange,
}: ManualActivationDialogProps) {
  const [reason, setReason] = useState<"STRIPE_ISSUE" | "PROFESSIONAL_CHOICE">(
    "STRIPE_ISSUE",
  );
  const [confirmAction, setConfirmAction] = useState<
    "activate" | "deactivate" | "reactivate" | null
  >(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const { execute: executeToggle, isPending: isToggling } = useAction(
    toggleManualActivation,
    {
      onSuccess: ({ data }) => {
        if (data) {
          onStatusChange(
            data.professionalId,
            data.acceptsPayAfterService,
            data.stripeAccountStatus,
          );
          toast.success(
            data.acceptsPayAfterService
              ? "Acesso manual ativado com sucesso"
              : "Acesso manual desativado com sucesso",
          );
          setConfirmAction(null);
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro ao alterar acesso manual");
        setConfirmAction(null);
      },
    },
  );

  const { execute: executeLogs } = useAction(getManualActivationLogs, {
    onSuccess: ({ data }) => {
      if (data) {
        setLogs(data);
      }
    },
  });

  useEffect(() => {
    if (open && professionalId) {
      executeLogs({ professionalId });
    }
  }, [open, professionalId]);

  if (!professionalId) return null;

  const isManualActive = acceptsPayAfterService;
  const isStripeDisabledByChoice =
    isManualActive && stripeAccountStatus === "DISABLED";
  const isStripeIssue =
    isManualActive && stripeAccountStatus !== "DISABLED";

  const stripeInfo = STRIPE_STATUS_LABELS[stripeAccountStatus] ??
    STRIPE_STATUS_LABELS.PENDING;

  const handleConfirmActivate = () => {
    executeToggle({
      professionalId,
      activate: true,
      reason,
    });
  };

  const handleConfirmDeactivate = () => {
    executeToggle({
      professionalId,
      activate: false,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Acesso ao Sistema</DialogTitle>
            {professionalName && (
              <p className="text-muted-foreground text-sm">
                {professionalName}
              </p>
            )}
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stripe:</span>
                <Badge className={stripeInfo.color}>{stripeInfo.label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Acesso manual:</span>
                <Badge
                  className={
                    isManualActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }
                >
                  {isManualActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>

            {isManualActive && isStripeIssue && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Ativo (problema Stripe)
                </p>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  Será desativado automaticamente quando Stripe for aprovada
                </p>
              </div>
            )}

            {isManualActive && isStripeDisabledByChoice && (
              <div className="rounded-md border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Ativo (sem Stripe por escolha)
                </p>
                <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                  Permanente até o profissional decidir reativar
                </p>
              </div>
            )}

            {!isManualActive && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Motivo da ativação:
                </Label>
                <RadioGroup
                  value={reason}
                  onValueChange={(v) =>
                    setReason(v as "STRIPE_ISSUE" | "PROFESSIONAL_CHOICE")
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="STRIPE_ISSUE" id="stripe-issue" />
                    <Label htmlFor="stripe-issue" className="cursor-pointer">
                      Problema temporário com a Stripe
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="PROFESSIONAL_CHOICE"
                      id="prof-choice"
                    />
                    <Label htmlFor="prof-choice" className="cursor-pointer">
                      Profissional optou por não usar a Stripe
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <div className="flex gap-2">
              {!isManualActive && (
                <Button
                  className="flex-1"
                  onClick={() => setConfirmAction("activate")}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Ativar Acesso Manual
                </Button>
              )}

              {isManualActive && !isStripeDisabledByChoice && (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setConfirmAction("deactivate")}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Desativar Acesso Manual
                </Button>
              )}

              {isManualActive && isStripeDisabledByChoice && (
                <Button
                  className="flex-1"
                  onClick={() => setConfirmAction("reactivate")}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reabilitar Stripe
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowLogs(!showLogs)}
            >
              <History className="mr-2 h-4 w-4" />
              {showLogs ? "Ocultar histórico" : "Ver histórico"}
            </Button>

            {showLogs && logs.length > 0 && (
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-md border p-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {log.action === "MANUAL_ACTIVATION_ENABLED"
                          ? "Ativado"
                          : "Desativado"}
                      </span>
                      <span className="text-muted-foreground">
                        {format(new Date(log.performedAt), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      Por: {log.performedByName} ({log.performedByRole})
                      {log.reason && (
                        <>
                          {" · "}
                          {log.reason === "STRIPE_ISSUE"
                            ? "Problema Stripe"
                            : "Escolha do profissional"}
                        </>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {showLogs && logs.length === 0 && (
              <p className="text-muted-foreground text-center text-sm">
                Nenhum registro encontrado
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmAction === "activate"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ativar acesso manual?</AlertDialogTitle>
            <AlertDialogDescription>
              O profissional poderá usar o sistema, porém sem os benefícios da
              Stripe:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1 text-sm">
            <p>Pagamento online com cartão</p>
            <p>PIX integrado</p>
            <p>Cobrança automática</p>
            <p>Proteção contra no-show</p>
            <p>Histórico financeiro automático</p>
            <p>Relatórios de faturamento completos</p>
            <p>Comissão automática</p>
            <p>Período de 0% de taxa (primeiros 90 dias)</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isToggling}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmActivate();
              }}
            >
              {isToggling && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmAction === "deactivate"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar acesso manual?</AlertDialogTitle>
            <AlertDialogDescription>
              O profissional voltará a depender exclusivamente do status da
              Stripe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              Status atual da Stripe:{" "}
              <Badge className={stripeInfo.color}>{stripeInfo.label}</Badge>
            </p>
            {!chargesEnabled && (
              <p className="font-medium text-amber-600">
                Se a Stripe não estiver ativa, o profissional perderá o acesso
                ao sistema.
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isToggling}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDeactivate();
              }}
            >
              {isToggling && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmAction === "reactivate"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reabilitar Stripe?</AlertDialogTitle>
            <AlertDialogDescription>
              A Stripe será reativada e o acesso manual será desativado. O
              profissional voltará a ter todos os benefícios da Stripe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isToggling}
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDeactivate();
              }}
            >
              {isToggling && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
