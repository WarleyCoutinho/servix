"use client";

import { updateProfessionalProfile } from "@/actions/professionals/update-professional-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  ScheduleViewSelector,
  type ScheduleViewType,
} from "@/components/schedule-view-selector";
import {
  Banknote,
  Calendar,
  CreditCard,
  HandCoins,
  Loader2,
  MessageCircle,
  QrCode,
  Save,
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
    scheduleViewType: ScheduleViewType;
  };
}

// ─── Section wrapper ───────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon size={16} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Toggle row ────────────────────────────────────────────────────────────────
function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  faded,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange?: (v: boolean) => void;
  disabled?: boolean;
  faded?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors",
        checked && !faded ? "border-primary/30 bg-primary/5" : "border-border",
        faded ? "opacity-50" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon size={16} className="text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium">{label}</p>
            {badge && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled || faded}
        className="shrink-0"
      />
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ProfessionalSettingsClient({
  professional,
}: ProfessionalSettingsClientProps) {
  const [formData, setFormData] = useState({
    acceptsPix: professional.acceptsPix,
    acceptsCard: professional.acceptsCard,
    acceptsPayAfterService: professional.acceptsPayAfterService,
    whatsappGroupName: professional.whatsappGroupName ?? "",
    scheduleViewType: professional.scheduleViewType,
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

  const noPaymentMethod =
    !formData.acceptsCard &&
    !formData.acceptsPix &&
    !formData.acceptsPayAfterService;

  // ── WhatsApp polling ─────────────────────────────────────────────────────────
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
      if (data.qrCode || data.pairingCode) gotQrOrPairingRef.current = true;
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
      /* ignore */
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
      toast.error("Digite um número válido com DDD.");
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
    const t = setTimeout(() => pollWhatsAppStatus(), 0);
    return () => {
      clearTimeout(t);
      stopPolling();
    };
  }, [pollWhatsAppStatus, stopPolling]);

  // ── Save ─────────────────────────────────────────────────────────────────────
  const { execute: executeSave, isPending: isSaving } = useAction(
    updateProfessionalProfile,
    {
      onSuccess: () => toast.success("Configurações salvas!"),
      onError: ({ error }) =>
        toast.error(error.serverError ?? "Erro ao salvar."),
    },
  );

  const handleSave = () => {
    if (noPaymentMethod) {
      toast.error("Selecione ao menos uma forma de pagamento.");
      return;
    }
    executeSave({
      acceptsPix: formData.acceptsPix,
      acceptsCard: formData.acceptsCard,
      acceptsPayAfterService: formData.acceptsPayAfterService,
      whatsappGroupName: formData.whatsappGroupName,
      scheduleViewType: formData.scheduleViewType,
    });
  };

  // ── Status WhatsApp label ────────────────────────────────────────────────────
  const waLabel =
    waStatus === "connected"
      ? "Conectado"
      : waAuthenticating
        ? "Autenticando..."
        : waStatus === "qr_code"
          ? "Aguardando leitura"
          : waStatus === "connecting"
            ? "Conectando..."
            : "Desconectado";

  return (
    <div className="space-y-4 pb-8">
      {/* ── Pagamento ── */}
      <Section
        icon={CreditCard}
        title="Formas de Pagamento"
        description="Selecione como seus clientes podem pagar."
      >
        <div className="space-y-2">
          <ToggleRow
            icon={CreditCard}
            label="Cartão de Crédito"
            description="Pagamento online via cartão"
            checked={formData.acceptsCard}
            onCheckedChange={(v) =>
              setFormData((p) => ({ ...p, acceptsCard: v }))
            }
            disabled={
              isSaving ||
              (!formData.acceptsPix &&
                !formData.acceptsPayAfterService &&
                formData.acceptsCard)
            }
          />
          <ToggleRow
            icon={Banknote}
            label="PIX"
            badge="Em breve"
            checked={false}
            faded
          />
          <ToggleRow
            icon={HandCoins}
            label="Pagar após o serviço"
            description="Cliente paga presencialmente após o atendimento"
            checked={formData.acceptsPayAfterService}
            onCheckedChange={(v) =>
              setFormData((p) => ({ ...p, acceptsPayAfterService: v }))
            }
            disabled={
              isSaving ||
              (!formData.acceptsCard &&
                !formData.acceptsPix &&
                formData.acceptsPayAfterService)
            }
          />
        </div>

        {noPaymentMethod && (
          <p className="text-xs text-destructive">
            Selecione ao menos uma forma de pagamento.
          </p>
        )}
      </Section>

      {/* ── Agenda WhatsApp ── */}
      <Section
        icon={Calendar}
        title="Agenda no WhatsApp"
        description="Como a agenda do dia aparece no grupo."
      >
        <ScheduleViewSelector
          value={formData.scheduleViewType}
          onChange={(v) => setFormData((p) => ({ ...p, scheduleViewType: v }))}
          disabled={isSaving}
        />

        <div className="space-y-2 pt-1">
          <p className="text-xs font-medium text-muted-foreground">
            Grupo do WhatsApp
          </p>
          <Input
            placeholder="Nome exato do grupo"
            value={formData.whatsappGroupName}
            onChange={(e) =>
              setFormData((p) => ({ ...p, whatsappGroupName: e.target.value }))
            }
            disabled={isSaving}
            className="h-11 rounded-xl text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Nome idêntico ao do grupo no WhatsApp.
          </p>
        </div>
      </Section>

      {/* ── Conexão WhatsApp ── */}
      <Section icon={MessageCircle} title="Conexão WhatsApp">
        {/* Status */}
        <div className="flex items-center justify-between gap-3 rounded-xl border p-4">
          <div className="flex items-center gap-3 min-w-0">
            {waStatus === "connected" ? (
              <Wifi size={16} className="text-green-500 shrink-0" />
            ) : (
              <WifiOff size={16} className="text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium">{waLabel}</p>
              <p className="text-xs text-muted-foreground truncate">
                {waStatus === "connected"
                  ? "Agenda enviada automaticamente"
                  : "Conecte para enviar a agenda"}
              </p>
            </div>
          </div>
          {waStatus === "connected" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnectWhatsApp}
              className="shrink-0 rounded-xl h-9"
            >
              Desconectar
            </Button>
          )}
        </div>

        {/* Opções de conexão */}
        {waStatus !== "connected" && !waConnecting && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {(["qr", "phone"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setWaConnectionMode(mode)}
                  className={[
                    "flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors touch-manipulation",
                    waConnectionMode === mode
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted",
                  ].join(" ")}
                >
                  {mode === "qr" ? (
                    <>
                      <QrCode size={15} /> QR Code
                    </>
                  ) : (
                    <>
                      <Smartphone size={15} /> Celular
                    </>
                  )}
                </button>
              ))}
            </div>

            {waConnectionMode === "qr" ? (
              <Button
                onClick={handleConnectWhatsApp}
                className="w-full h-11 rounded-xl"
              >
                <QrCode className="mr-2 h-4 w-4" /> Gerar QR Code
              </Button>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="tel"
                  placeholder="5562999999999"
                  value={waPhoneNumber}
                  onChange={(e) => setWaPhoneNumber(e.target.value)}
                  className="h-11 rounded-xl flex-1"
                />
                <Button
                  onClick={handleConnectWithPhone}
                  disabled={waPhoneNumber.replace(/\D/g, "").length < 10}
                  className="h-11 rounded-xl shrink-0"
                >
                  Conectar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* QR Code */}
        {waStatus === "qr_code" && waQrCode && !waPairingCode && (
          <div className="flex flex-col items-center gap-3 rounded-xl border p-6">
            <p className="text-sm font-medium">Escaneie com o WhatsApp</p>
            <div className="rounded-xl border bg-white p-3">
              <Image
                src={waQrCode}
                alt="QR Code"
                width={220}
                height={220}
                unoptimized
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              WhatsApp → Dispositivos conectados → Conectar dispositivo
            </p>
          </div>
        )}

        {/* Código de pareamento */}
        {waPairingCode && waStatus !== "connected" && (
          <div className="flex flex-col items-center gap-3 rounded-xl border p-6">
            <p className="text-sm font-medium">Código de Pareamento</p>
            <div className="rounded-xl border bg-white px-6 py-4">
              <p className="font-mono text-2xl font-bold tracking-widest text-black">
                {waPairingCode}
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              WhatsApp → Dispositivos conectados → Conectar com número
            </p>
          </div>
        )}

        {/* Autenticando */}
        {waAuthenticating && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950">
            <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              Autenticando...
            </p>
            <p className="text-xs text-green-600 dark:text-green-500">
              Confirme no celular se solicitado
            </p>
          </div>
        )}

        {/* Gerando */}
        {waConnecting &&
          waStatus === "connecting" &&
          !waQrCode &&
          !waPairingCode &&
          !waAuthenticating && (
            <div className="flex flex-col items-center gap-2 rounded-xl border p-5">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              <p className="text-sm font-medium">
                {waConnectionMode === "phone"
                  ? "Gerando código..."
                  : "Gerando QR Code..."}
              </p>
            </div>
          )}
      </Section>

      {/* ── Botão único salvar ── */}
      <Button
        onClick={handleSave}
        disabled={isSaving || noPaymentMethod}
        className="w-full h-12 rounded-xl text-sm font-semibold"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" /> Salvar configurações
          </>
        )}
      </Button>
    </div>
  );
}
