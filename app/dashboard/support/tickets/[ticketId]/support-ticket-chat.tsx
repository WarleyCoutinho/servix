"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  ImagePlus,
  Loader2,
  Send,
  Shield,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Message {
  id: string;
  content: string;
  imageUrl?: string | null;
  isFromAdmin: boolean;
  isFromAI: boolean;
  createdAt: string | Date;
  sender: {
    name: string;
    image: string | null;
    role: string;
  } | null;
}

interface Ticket {
  id: string;
  status: string;
  createdAt: string | Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    createdAt: string | Date;
    ownedBarbershops: {
      name: string;
      subscription: { plan: string; status: string } | null;
    }[];
  };
  messages: Message[];
}

function ChatImage({ src }: { src: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <img
        src={src}
        alt="Imagem anexada"
        className="mt-1.5 max-h-40 cursor-pointer rounded-lg border border-border object-cover"
        onClick={() => setExpanded(true)}
      />
      {expanded && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setExpanded(false)}
        >
          <img
            src={src}
            alt="Imagem expandida"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}

export function SupportTicketChat({ ticket }: { ticket: Ticket }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(ticket.messages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barbershop = ticket.user.ownedBarbershops[0];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/admin/support/${ticket.id}/messages`,
        );
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [ticket.id]);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "support");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return data.imageUrl ?? null;
    } catch {
      return null;
    }
  }, []);

  const handleSend = async (imageUrl?: string) => {
    if (!input.trim() && !imageUrl) return;
    if (sending) return;

    setSending(true);
    try {
      const res = await fetch(
        `/api/admin/support/${ticket.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: input || "Imagem enviada", imageUrl }),
        },
      );
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [
          ...prev,
          {
            ...data.message,
            sender: { name: "Suporte", image: null, role: "support" },
          },
        ]);
        setInput("");
      }
    } catch {
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const url = await uploadImage(file);
      setUploading(false);

      if (url) {
        await handleSend(url);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadImage, input],
  );

  const handleResolve = async () => {
    setResolving(true);
    try {
      await fetch(`/api/admin/support/${ticket.id}/resolve`, {
        method: "POST",
      });
      router.push("/dashboard/support/tickets");
      router.refresh();
    } catch {
      setResolving(false);
    }
  };

  const formatTime = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard/support/tickets">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold">
              Suporte - {ticket.user.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              Ticket aberto em{" "}
              {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              ticket.status === "WAITING_ADMIN" ? "destructive" : "secondary"
            }
          >
            {ticket.status === "WAITING_ADMIN"
              ? "Aguardando Resposta"
              : ticket.status === "RESOLVED"
                ? "Resolvido"
                : "Aberto"}
          </Badge>
          {ticket.status !== "RESOLVED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleResolve}
              disabled={resolving}
            >
              {resolving ? (
                <Loader2 className="mr-1 size-3 animate-spin" />
              ) : (
                <CheckCircle className="mr-1 size-3" />
              )}
              Resolver
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card className="flex flex-col overflow-hidden">
          <div className="flex max-h-[32rem] flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.isFromAdmin ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                    msg.isFromAdmin
                      ? "bg-primary/10"
                      : msg.isFromAI
                        ? "bg-amber-500/10"
                        : "bg-muted"
                  }`}
                >
                  {msg.isFromAdmin ? (
                    <Shield className="size-3.5 text-primary" />
                  ) : msg.isFromAI ? (
                    <Bot className="size-3.5 text-amber-500" />
                  ) : (
                    <User className="size-3.5 text-muted-foreground" />
                  )}
                </div>
                <div
                  className={`max-w-[75%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.isFromAdmin
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : msg.isFromAI
                        ? "rounded-bl-sm border border-amber-500/20 bg-amber-500/5"
                        : "rounded-bl-sm border bg-muted"
                  }`}
                >
                  {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                  {msg.imageUrl && <ChatImage src={msg.imageUrl} />}
                  <p
                    className={`mt-1 text-[0.65rem] ${
                      msg.isFromAdmin
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
                    }`}
                  >
                    {msg.isFromAI ? "IA" : msg.sender?.name ?? "Usuário"} -{" "}
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          {ticket.status !== "RESOLVED" && (
            <div className="flex gap-2 border-t p-3">
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
                className="shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || uploading}
                title="Enviar imagem"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <ImagePlus className="size-4" />
                )}
              </Button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Digite sua resposta..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={sending || !input.trim()}
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Info do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src={ticket.user.image ?? ""} />
                  <AvatarFallback>
                    {ticket.user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{ticket.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.user.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t pt-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role</span>
                  <Badge variant="outline" className="text-xs">
                    {ticket.user.role}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Barbearia</span>
                  <span className="text-right text-xs font-medium">
                    {barbershop?.name ?? "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plano</span>
                  <Badge variant="secondary" className="text-xs">
                    {barbershop?.subscription?.plan ?? "Sem plano"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      barbershop?.subscription?.status === "ACTIVE"
                        ? "default"
                        : "destructive"
                    }
                    className="text-xs"
                  >
                    {barbershop?.subscription?.status ?? "N/A"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membro desde</span>
                  <span className="text-xs">
                    {new Date(ticket.user.createdAt).toLocaleDateString(
                      "pt-BR",
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
