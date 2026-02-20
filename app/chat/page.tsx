"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { BotMessageSquare, ChevronLeft, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";

import { Button } from "@/components/ui/button";

const ChatPage = () => {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      const isInternal =
        href.startsWith("/") || href.startsWith(window.location.origin);

      if (isInternal) {
        e.preventDefault();
        const path = href.startsWith("/")
          ? href
          : href.replace(window.location.origin, "");
        router.push(path);
      }
    },
    [router],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status === "ready") {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background border-border sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="size-8">
            <ChevronLeft className="size-5" />
          </Button>
        </Link>
        <h1 className="font-[family-name:var(--font-merriweather)] text-xl tracking-tight italic">
          Agenda.ai
        </h1>
        <div className="size-8" />
      </header>

      <div className="px-5 pt-4">
        <div className="bg-muted/30 rounded-xl border p-3">
          <p className="text-muted-foreground text-center text-sm">
            Seu assistente de agendamentos está online.
          </p>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 pb-32"
        onClick={handleLinkClick}
      >
        <div className="flex gap-2 pt-6 pr-14">
          <div className="bg-primary/12 flex size-8 shrink-0 items-center justify-center rounded-full border">
            <BotMessageSquare className="text-primary size-3.5" />
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            Olá! Sou o{" "}
            <span className="font-[family-name:var(--font-merriweather)] tracking-tight italic">
              Agenda.ai
            </span>
            , seu assistente pessoal.
            {"\n\n"}
            Estou aqui para te auxiliar a agendar seu corte ou barba, encontrar
            as barbearias disponíveis perto de você e responder às suas dúvidas.
          </p>
        </div>

        {messages.map((message) => (
          <div key={message.id} className="pt-6">
            {message.role === "assistant" ? (
              <div className="flex items-start gap-2 pr-14">
                <div className="bg-primary/12 flex size-8 shrink-0 items-center justify-center rounded-full border">
                  <BotMessageSquare className="text-primary size-3.5" />
                </div>
                <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                  {message.parts.map((part, index) =>
                    part.type === "text" ? (
                      <Streamdown key={index}>{part.text}</Streamdown>
                    ) : null,
                  )}
                </div>
              </div>
            ) : (
              <div className="flex justify-end pl-10 pr-2">
                <div className="bg-secondary rounded-full px-4 py-3">
                  <p className="text-sm">
                    {message.parts.map((part, index) =>
                      part.type === "text" ? (
                        <span key={index}>{part.text}</span>
                      ) : null,
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2 pt-6 pr-14">
            <div className="bg-primary/12 flex size-8 shrink-0 items-center justify-center rounded-full border">
              <BotMessageSquare className="text-primary size-3.5" />
            </div>
            <div className="text-muted-foreground text-sm">Digitando...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-muted fixed right-0 bottom-0 left-0 border-t p-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="bg-background text-foreground placeholder:text-muted-foreground flex-1 rounded-full border px-4 py-3 text-sm outline-none"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="size-[42px] shrink-0 rounded-full"
          >
            <Send className="size-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
