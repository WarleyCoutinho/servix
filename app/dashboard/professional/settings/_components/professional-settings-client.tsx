"use client";

import { updateProfessionalProfile } from "@/actions/professionals/update-professional-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Banknote,
  CreditCard,
  HandCoins,
  Loader2,
  MessageCircle,
  QrCode,
  Smartphone,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ProfessionalSettingsClientProps {
  professional: {
    id: string;
    acceptsPix: boolean;
    acceptsCard: boolean;
    acceptsPayAfterService: boolean;
    whatsappGroupName: string | null;
  };
}

export default function ProfessionalSettingsClient({
  professional,
}: ProfessionalSettingsClientProps) {
  const [formData, setFormData] = useState({
    acceptsPix: professional.acceptsPix,
    acceptsCard: professional.acceptsCard,
    acceptsPayAfterService: professional.acceptsPayAfterService,
    whatsappGroupName: professional.whatsappGroupName ?? "",
  });

  const [waStatus, setWaStatus] = useState<string>("disconnected");
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waPairingCode, setWaPairingCode] = useState<string | null>(null);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waConnectionMode, setWaConnectionMode] = useState<"qr" | "phone">(
    "qr",
  );
  const [waPhoneNumber, setWaPhoneNumber] = useState("");
  const [waAuthenticating, setWaAuthenticating] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectingRef = useRef(false);
  const gotQrOrPairingRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  const pollWhatsAppStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/${professional.id}/status`);
      const data = await res.json();
      setWaStatus(data.status);
      setWaQrCode(data.qrCode);
      setWaPairingCode(data.pairingCode);

      if (data.qrCode || data.pairingCode) {
        gotQrOrPairingRef.current = true;
      }

      // Detect authentication phase: QR/pairing was shown, now gone but not connected
      if (
        gotQrOrPairingRef.current &&
        !data.qrCode &&
        !data.pairingCode &&
        data.status === "connecting"
      ) {
        setWaAuthenticating(true);
      } else {
        setWaAuthenticating(false);
      }

      if (data.status === "connected") {
        isConnectingRef.current = false;
        gotQrOrPairingRef.current = false;
        setWaConnecting(false);
        setWaAuthenticating(false);
        stopPolling();
        toast.success("WhatsApp conectado com sucesso!");
      } else if (data.status === "disconnected" && !isConnectingRef.current) {
        setWaConnecting(false);
        setWaAuthenticating(false);
        stopPolling();
      }
    } catch {
      /* ignore network errors during polling */
    }
  }, [professional.id, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    pollingRef.current = setInterval(pollWhatsAppStatus, 3000);
    pollingTimeoutRef.current = setTimeout(() => {
      stopPolling();
      isConnectingRef.current = false;
      gotQrOrPairingRef.current = false;
      setWaConnecting(false);
      setWaStatus("disconnected");
      setWaQrCode(null);
      toast.error("Tempo esgotado. Tente conectar novamente.");
    }, 180000);
  }, [pollWhatsAppStatus, stopPolling]);

  const handleConnectWhatsApp = async () => {
    if (waConnecting) return;
    setWaConnecting(true);
    isConnectingRef.current = true;
    gotQrOrPairingRef.current = false;
    setWaQrCode(null);
    setWaPairingCode(null);
    try {
      await fetch(`/api/whatsapp/${professional.id}/connect`, {
        method: "POST",
      });
      startPolling();
      pollWhatsAppStatus();
    } catch {
      isConnectingRef.current = false;
      setWaConnecting(false);
      toast.error("Erro ao conectar WhatsApp. Tente novamente.");
    }
  };

  const handleConnectWithPhone = async () => {
    const cleanPhone = waPhoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Digite um número de celular válido com DDD.");
      return;
    }
    if (waConnecting) return;
    setWaConnecting(true);
    isConnectingRef.current = true;
    gotQrOrPairingRef.current = false;
    setWaQrCode(null);
    setWaPairingCode(null);
    try {
      const res = await fetch(
        `/api/whatsapp/${professional.id}/connect-phone`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: cleanPhone }),
        },
      );
      const data = await res.json();
      if (data.pairingCode) {
        setWaPairingCode(data.pairingCode);
        setWaStatus(data.status);
      }
      startPolling();
    } catch {
      isConnectingRef.current = false;
      setWaConnecting(false);
      toast.error("Erro ao conectar WhatsApp. Tente novamente.");
    }
  };

  const handleDisconnectWhatsApp = async () => {
    stopPolling();
    isConnectingRef.current = false;
    gotQrOrPairingRef.current = false;
    try {
      await fetch(`/api/whatsapp/${professional.id}/disconnect`, {
        method: "POST",
      });
    } catch {
      /* ignore */
    }
    setWaStatus("disconnected");
    setWaQrCode(null);
    setWaPairingCode(null);
    setWaConnecting(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      pollWhatsAppStatus();
    }, 0);

    return () => {
      clearTimeout(timer);
      stopPolling();
    };
  }, [pollWhatsAppStatus, stopPolling]);

  const { execute: executeSavePayment, isPending: isSavingPayment } =
    useAction(updateProfessionalProfile, {
      onSuccess: () => {
        toast.success("Configurações salvas com sucesso!");
      },
      onError: ({ error }) => {
        toast.error(error.serverError ?? "Erro ao salvar configurações.");
      },
    });

  const handleSavePaymentMethods = () => {
    executeSavePayment({
      acceptsPix: formData.acceptsPix,
      acceptsCard: formData.acceptsCard,
      acceptsPayAfterService: formData.acceptsPayAfterService,
      whatsappGroupName: formData.whatsappGroupName,
    });
  };

  const isLoading = isSavingPayment;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Formas de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Configure quais formas de pagamento você aceita.
          </p>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="font-medium">Cartão de Crédito</p>
                <p className="text-muted-foreground text-sm">
                  Pagamentos via cartão
                </p>
              </div>
            </div>
            <Switch
              checked={formData.acceptsCard}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, acceptsCard: checked })
              }
              disabled={
                isLoading ||
                (!formData.acceptsPix &&
                  !formData.acceptsPayAfterService &&
                  formData.acceptsCard)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Banknote className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="font-medium">PIX</p>
                <p className="text-muted-foreground text-sm">
                  Pagamentos via PIX
                </p>
              </div>
            </div>
            <Switch
              checked={formData.acceptsPix}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, acceptsPix: checked })
              }
              disabled={
                isLoading ||
                (!formData.acceptsCard &&
                  !formData.acceptsPayAfterService &&
                  formData.acceptsPix)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <HandCoins className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="font-medium">Pagar após o serviço</p>
                <p className="text-muted-foreground text-sm">
                  Permite agendar e pagar presencialmente após a conclusão
                </p>
              </div>
            </div>
            <Switch
              checked={formData.acceptsPayAfterService}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, acceptsPayAfterService: checked })
              }
              disabled={
                isLoading ||
                (!formData.acceptsCard &&
                  !formData.acceptsPix &&
                  formData.acceptsPayAfterService)
              }
            />
          </div>
          {!formData.acceptsCard &&
            !formData.acceptsPix &&
            !formData.acceptsPayAfterService && (
              <p className="text-destructive text-sm">
                Você deve aceitar pelo menos uma forma de pagamento.
              </p>
            )}

          <div className="space-y-2">
            <Label htmlFor="whatsappGroupName">Nome do Grupo WhatsApp</Label>
            <Input
              id="whatsappGroupName"
              placeholder="Nome exato do grupo no WhatsApp"
              value={formData.whatsappGroupName}
              onChange={(e) =>
                setFormData({ ...formData, whatsappGroupName: e.target.value })
              }
              disabled={isLoading}
            />
            <p className="text-muted-foreground text-xs">
              Nome exato do grupo onde a agenda será enviada automaticamente.
            </p>
          </div>

          <Button
            onClick={handleSavePaymentMethods}
            disabled={isLoading}
            className="w-full"
          >
            {isSavingPayment && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {waStatus === "connected" ? (
                <Wifi className="h-5 w-5 shrink-0 text-green-600" />
              ) : (
                <WifiOff className="text-muted-foreground h-5 w-5 shrink-0" />
              )}
              <div>
                <p className="font-medium">
                  {waStatus === "connected"
                    ? "Conectado"
                    : waAuthenticating
                      ? "Autenticando..."
                      : waStatus === "qr_code"
                        ? "Aguardando QR Code"
                        : waStatus === "connecting"
                          ? "Conectando..."
                          : "Desconectado"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {waStatus === "connected"
                    ? "WhatsApp conectado. A agenda será enviada automaticamente."
                    : "Conecte o WhatsApp para enviar a agenda no grupo."}
                </p>
              </div>
            </div>
            {waStatus === "connected" ? (
              <Button
                variant="destructive"
                onClick={handleDisconnectWhatsApp}
                className="w-full sm:w-auto"
              >
                Desconectar
              </Button>
            ) : (
              !waConnecting && (
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button
                    onClick={() => {
                      setWaConnectionMode("qr");
                      handleConnectWhatsApp();
                    }}
                    disabled={waConnecting}
                    variant={waConnectionMode === "qr" ? "default" : "outline"}
                    className="flex-1 sm:flex-initial"
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    QR Code
                  </Button>
                </div>
              )
            )}
          </div>

          {waStatus !== "connected" && !waConnecting && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWaConnectionMode("qr")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                    waConnectionMode === "qr"
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setWaConnectionMode("phone")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${
                    waConnectionMode === "phone"
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-accent"
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                  Número do Celular
                </button>
              </div>

              {waConnectionMode === "qr" ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    Clique para gerar o QR Code e escaneie com o WhatsApp.
                  </p>
                  <Button
                    onClick={handleConnectWhatsApp}
                    disabled={waConnecting}
                    className="w-full"
                  >
                    Gerar QR Code
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    Digite o número do celular com o codigo do Páis DDD para
                    receber o código de pareamento.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      placeholder="5562999999999"
                      value={waPhoneNumber}
                      onChange={(e) => setWaPhoneNumber(e.target.value)}
                      disabled={waConnecting}
                    />
                    <Button
                      onClick={handleConnectWithPhone}
                      disabled={
                        waConnecting ||
                        waPhoneNumber.replace(/\D/g, "").length < 10
                      }
                    >
                      Conectar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {waStatus === "qr_code" && waQrCode && !waPairingCode && (
            <div className="flex flex-col items-center gap-3 rounded-lg border p-6">
              <QrCode className="text-muted-foreground h-8 w-8" />
              <p className="text-center text-sm font-medium">
                Escaneie o QR Code com o WhatsApp
              </p>
              <div className="rounded-lg border bg-white p-4">
                <Image
                  src={waQrCode}
                  alt="QR Code WhatsApp"
                  width={256}
                  height={256}
                  unoptimized
                />
              </div>
              <p className="text-muted-foreground text-center text-xs">
                Abra o WhatsApp {">"} Dispositivos conectados {">"} Conectar
                dispositivo
              </p>
            </div>
          )}

          {waPairingCode && waStatus !== "connected" && (
            <div className="flex flex-col items-center gap-3 rounded-lg border p-6">
              <Smartphone className="text-muted-foreground h-8 w-8" />
              <p className="text-center text-sm font-medium">
                Código de Pareamento
              </p>
              <div className="rounded-lg border bg-white px-6 py-4">
                <p className="text-center font-mono text-2xl font-bold tracking-widest text-black">
                  {waPairingCode}
                </p>
              </div>
              <p className="text-muted-foreground text-center text-xs">
                Abra o WhatsApp {">"} Dispositivos conectados {">"} Conectar
                dispositivo {">"} Conectar com número de telefone
              </p>
            </div>
          )}

          {waAuthenticating && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950">
              <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              <p className="text-center text-sm font-medium text-green-700 dark:text-green-400">
                Autenticando com o WhatsApp...
              </p>
              <p className="text-center text-xs text-green-600 dark:text-green-500">
                Confirme no seu celular se solicitado
              </p>
            </div>
          )}

          {waConnecting &&
            waStatus === "connecting" &&
            !waQrCode &&
            !waPairingCode &&
            !waAuthenticating && (
              <div className="flex flex-col items-center gap-3 rounded-lg border p-6">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                <p className="text-center text-sm font-medium">
                  {waConnectionMode === "phone"
                    ? "Gerando código de pareamento..."
                    : "Gerando QR Code..."}
                </p>
                <p className="text-muted-foreground text-center text-xs">
                  Aguarde um momento
                </p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
