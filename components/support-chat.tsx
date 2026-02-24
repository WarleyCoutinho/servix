"use client";

import {
  Headset,
  ImagePlus,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Send,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";

const SUPPORT_WHATSAPP = "5516989118349";
const SUPPORT_EMAIL = "contatoadapticode@gmail.com";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

type ChatStatus = "idle" | "loading" | "error" | "waiting_admin";

interface SupportChatProps {
  userPlan: string;
  userName: string;
}

interface ApiResponse {
  type:
    | "ai_response"
    | "escalate"
    | "redirect_human"
    | "waiting_admin"
    | "admin_response";
  message: string;
  whatsapp?: string;
  email?: string;
  ticketId?: string;
}

interface PollMessage {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

function ContactButtons() {
  return (
    <div className="mt-3 flex flex-col gap-2">
      <a
        href={`https://wa.me/${SUPPORT_WHATSAPP}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/20"
      >
        <Phone className="size-3.5" />
        WhatsApp: +55 16 98911-8349
      </a>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="flex items-center gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
      >
        <Mail className="size-3.5" />
        {SUPPORT_EMAIL}
      </a>
    </div>
  );
}

function ChatImage({ src }: { src: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <Image
        src={src}
        alt="Imagem anexada"
        className="mt-1.5 max-h-40 cursor-pointer rounded-lg border border-border object-cover"
        onClick={() => setExpanded(true)}
      />
      {expanded && (
        <div
          className="fixed inset-0 z-300 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpanded(false)}
        >
          <Image
            src={src}
            alt="Imagem expandida"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}

export function SupportChat({ userPlan, userName }: SupportChatProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Olá, ${userName}! Sou o assistente de suporte do Servix. Como posso te ajudar?`,
    },
  ]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const isPremiumPlan =
    userPlan === "PROFESSIONAL" || userPlan === "ENTERPRISE";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (status !== "waiting_admin" || !ticketId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/support/messages?ticketId=${ticketId}`);
        const data = await res.json();

        if (data.messages && data.messages.length > 0) {
          const adminMessages: PollMessage[] = data.messages;
          setMessages((prev) => [
            ...prev,
            ...adminMessages.map((m: PollMessage) => ({
              role: "assistant" as const,
              content: m.content,
              imageUrl: m.imageUrl,
            })),
          ]);
          setStatus("idle");
        }

        if (data.ticketStatus === "RESOLVED") {
          setStatus("idle");
          setTicketId(null);
        }
      } catch {}
    }, 5000);

    return () => clearInterval(interval);
  }, [status, ticketId]);

  const uploadImage = useCallback(
    async (file: File): Promise<string | null> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "support");

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        return data.id ? `/api/uploads/${data.id}` : null;
      } catch {
        return null;
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string, imageUrl?: string) => {
      if ((!text.trim() && !imageUrl) || status === "loading") return;

      const userMsg: ChatMessage = { role: "user", content: text, imageUrl };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setStatus("loading");

      try {
        const messagesForApi = updatedMessages
          .filter(
            (_, i) => !(i === 0 && updatedMessages[0].role === "assistant"),
          )
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/support/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messagesForApi,
            userPlan,
            imageUrl,
          }),
        });

        const data: ApiResponse = await res.json();

        if (data.ticketId) {
          setTicketId(data.ticketId);
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);

        if (data.type === "waiting_admin") {
          setStatus("waiting_admin");
        } else if (data.type === "escalate" || data.type === "redirect_human") {
          setStatus("error");
        } else {
          setStatus("idle");
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Desculpe, houve um problema. Tente novamente ou entre em contato pelo WhatsApp.",
          },
        ]);
        setStatus("error");
      }
    },
    [messages, status, userPlan],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const url = await uploadImage(file);
      setUploading(false);

      if (url) {
        await sendMessage(input || "Imagem enviada", url);
        setInput("");
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadImage, sendMessage, input],
  );

  const statusColor =
    status === "loading"
      ? "bg-yellow-400"
      : status === "error"
        ? "bg-red-400"
        : status === "waiting_admin"
          ? "bg-amber-400"
          : "bg-green-400";

  const statusText =
    status === "loading"
      ? "Processando..."
      : status === "error"
        ? "Encaminhando ao suporte"
        : status === "waiting_admin"
          ? "Aguardando atendente..."
          : "Online agora";

  return (
    <>
      <div
        className={`fixed bottom-18 right-6 z-199 flex w-85 max-h-130 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl transition-all duration-250 ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-[0.97] opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-base">
              {status === "waiting_admin" ? (
                <Headset className="size-4 text-amber-500" />
              ) : (
                "✂️"
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {status === "waiting_admin" ? "Suporte Humano" : "Ajuda Servix"}
              </p>
              <div className="flex items-center gap-1.5">
                <span className={`size-1.5 rounded-full ${statusColor}`} />
                <span className="text-[0.68rem] text-muted-foreground">
                  {statusText}
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {isPremiumPlan ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
              🌟
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Suporte Premium
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Como assinante do plano{" "}
                {userPlan === "ENTERPRISE" ? "Rede" : "Profissional"}, você tem
                acesso ao suporte direto:
              </p>
            </div>
            <ContactButtons />
          </div>
        ) : (
          <>
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "assistant"
                      ? "self-start rounded-bl-sm border border-border bg-muted text-foreground"
                      : "self-end rounded-br-sm bg-primary text-primary-foreground"
                  }`}
                >
                  {m.content && <span>{m.content}</span>}
                  {m.imageUrl && <ChatImage src={m.imageUrl} />}
                  {m.role === "assistant" &&
                    isPremiumPlan &&
                    (m.content.includes("suporte") ||
                      m.content.includes("encaminhar")) &&
                    i > 0 && <ContactButtons />}
                </div>
              ))}

              {status === "loading" && (
                <div className="flex items-center gap-2 self-start text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span className="text-xs">Digitando...</span>
                </div>
              )}

              {uploading && (
                <div className="flex items-center gap-2 self-end text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span className="text-xs">Enviando imagem...</span>
                </div>
              )}

              {status === "waiting_admin" && (
                <div className="flex items-center gap-2 self-start rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-amber-500">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span className="text-xs">Aguardando atendente...</span>
                </div>
              )}

              <div ref={endRef} />
            </div>

            <div className="flex gap-2 border-t border-border p-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={status === "loading" || uploading}
                title="Enviar imagem"
              >
                <ImagePlus className="size-4" />
              </Button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Digite sua dúvida..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <Button
                size="icon"
                className="size-9 shrink-0"
                onClick={() => sendMessage(input)}
                disabled={status === "loading" || uploading || !input.trim()}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      <Button
        size="icon"
        className="fixed bottom-6 right-6 z-200 size-13 rounded-full shadow-lg"
        onClick={() => setOpen((o) => !o)}
        title="Suporte"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>
    </>
  );
}
