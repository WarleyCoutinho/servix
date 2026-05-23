"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  QrCode,
  LogOut,
  Info,
} from "lucide-react";
import Image from "next/image";
type Status = "connected" | "connecting" | "qr_code" | "disconnected";

interface ReminderStatus {
  status: Status;
  qrCode: string | null;
  pairingCode: string | null;
}

export default function WhatsAppAdminPage() {
  const [data, setData] = useState<ReminderStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp-reminders/status");
      if (res.ok) setData(await res.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const connect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp-reminders/connect", {
        method: "POST",
      });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp-reminders/disconnect", {
        method: "POST",
      });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Record<
    Status,
    { label: string; dot: string; pulse: boolean }
  > = {
    connected: { label: "Conectado", dot: "bg-green-500", pulse: false },
    connecting: { label: "Conectando...", dot: "bg-yellow-500", pulse: true },
    qr_code: {
      label: "Aguardando escaneamento",
      dot: "bg-primary",
      pulse: true,
    },
    disconnected: { label: "Desconectado", dot: "bg-red-500", pulse: false },
  };

  const current = data ? statusConfig[data.status] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">WhatsApp Lembretes</h1>
        <p className="text-muted-foreground">
          Gerencie o número dedicado para envio de lembretes automáticos
        </p>
      </div>

      {/* Status card */}
      <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-primary/60 to-transparent" />
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Status da Conexão</CardTitle>
              <CardDescription>
                Número dedicado para lembretes automáticos
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchStatus}
            title="Atualizar status"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status indicator */}
          <div className="flex items-center gap-3">
            {current ? (
              <>
                <div
                  className={`h-3 w-3 rounded-full ${current.dot} ${current.pulse ? "animate-pulse" : ""}`}
                />
                <span className="font-medium">{current.label}</span>
              </>
            ) : (
              <span className="text-muted-foreground text-sm">
                Carregando...
              </span>
            )}
          </div>

          {/* QR Code */}
          {data?.status === "qr_code" && data.qrCode && (
            <div className="flex flex-col items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <QrCode className="h-4 w-4 text-primary" />
                Escaneie o QR Code com o WhatsApp
              </div>
              <div className="rounded-xl border-4 border-primary/30 p-1">
                <Image
                  src={data.qrCode}
                  alt="QR Code WhatsApp"
                  className="h-56 w-56 rounded-lg"
                />
              </div>
              <p className="text-muted-foreground max-w-xs text-center text-xs">
                Abra o WhatsApp no celular → Dispositivos conectados → Conectar
                dispositivo
              </p>
            </div>
          )}

          {/* Connected */}
          {data?.status === "connected" && (
            <div className="alert-success flex items-center gap-3 rounded-lg border p-4">
              <Wifi className="h-4 w-4 shrink-0" />
              <span className="text-sm">
                Número conectado e pronto para enviar lembretes automáticos.
              </span>
            </div>
          )}

          {/* Disconnected */}
          {data?.status === "disconnected" && (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-red-600 dark:text-red-400">
              <WifiOff className="h-4 w-4 shrink-0" />
              <span className="text-sm">
                Nenhum número conectado. Clique em <strong>Conectar</strong>{" "}
                para gerar o QR Code.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {(data?.status === "disconnected" ||
              data?.status === "qr_code") && (
              <Button
                onClick={connect}
                disabled={loading || data?.status === "qr_code"}
                className="btn-lime"
              >
                <QrCode className="mr-2 h-4 w-4" />
                {data?.status === "qr_code"
                  ? "Aguardando escaneamento..."
                  : "Conectar"}
              </Button>
            )}

            {(data?.status === "connected" ||
              data?.status === "connecting") && (
              <Button
                variant="destructive"
                onClick={disconnect}
                disabled={loading}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Desconectar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" />
            Como funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>
            • O sistema envia lembretes automáticos <strong>1 hora</strong> e{" "}
            <strong>30 minutos</strong> antes de cada agendamento confirmado.
          </p>
          <p>
            • O número conectado aqui é o remetente de todas as mensagens
            enviadas aos clientes.
          </p>
          <p>
            • Use um chip com WhatsApp <strong>normal</strong> (não Business)
            para melhor compatibilidade.
          </p>
          <p>
            • Mantenha o celular com internet ativa para garantir a entrega das
            mensagens.
          </p>
          <p>
            • Se a conexão cair, reconecte escaneando o QR novamente — a sessão
            é preservada automaticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
