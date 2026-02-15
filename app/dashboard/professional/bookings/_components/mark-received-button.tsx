"use client";

import { markPaymentReceived } from "@/actions/mark-payment-received";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

interface MarkReceivedButtonProps {
  paymentId: string;
}

export default function MarkReceivedButton({ paymentId }: MarkReceivedButtonProps) {
  const { execute, isPending } = useAction(markPaymentReceived, {
    onSuccess: () => {
      toast.success("Pagamento marcado como recebido!");
    },
    onError: ({ error }) => {
      const message =
        error.validationErrors?._errors?.[0] ||
        error.serverError ||
        "Erro ao marcar pagamento.";
      toast.error(message);
    },
  });

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => execute({ paymentId })}
      disabled={isPending}
      className="border-green-500/50 text-green-700 hover:bg-green-500/10 dark:text-green-400"
    >
      {isPending ? (
        <Loader2 className="mr-1 size-3 animate-spin" />
      ) : (
        <CheckCircle className="mr-1 size-3" />
      )}
      Marcar como Recebido
    </Button>
  );
}
