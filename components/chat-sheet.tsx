"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { BotMessageSquare, Send, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Streamdown } from "streamdown";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

interface ChatSheetProps {
  triggerClassName?: string;
  iconOnly?: boolean;
}

const ChatSheet = ({ triggerClassName, iconOnly = false }: ChatSheetProps) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();
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
        href.startsWith("/") ||
        href.startsWith(window.location.origin);

      if (isInternal) {
        e.preventDefault();
        setOpen(false);
        const path = href.startsWith("/")
          ? href
          : href.replace(window.location.origin, "");
        router.push(path);
      } else {
        setOpen(false);
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {iconOnly ? (
          <Button variant="ghost" size="icon" className={triggerClassName}>
            <BotMessageSquare className="size-5" />
          </Button>
        ) : (
          <button
            type="button"
            className={triggerClassName}
          >
            <Sparkles className="size-4 shrink-0" />
            Assistente IA
          </button>
        )}
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[90vw] max-w-md flex-col overflow-hidden p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-border shrink-0 border-b px-4 py-4 text-left sm:px-6">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <BotMessageSquare className="size-5" />
            <span className="font-[family-name:var(--font-merriweather)] tracking-tight italic">
              Agenda.ai
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="bg-muted/30 mx-4 mt-4 rounded-xl border p-3 sm:mx-6">
          <p className="text-muted-foreground text-center text-sm">
            Seu assistente de agendamentos está online.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6" onClick={handleLinkClick}>
          <div className="flex gap-2 pt-6 pr-8">
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
                <div className="flex items-start gap-2 pr-8">
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
                <div className="flex justify-end pl-8">
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
            <div className="flex items-start gap-2 pt-6 pr-8">
              <div className="bg-primary/12 flex size-8 shrink-0 items-center justify-center rounded-full border">
                <BotMessageSquare className="text-primary size-3.5" />
              </div>
              <div className="text-muted-foreground text-sm">Digitando...</div>
            </div>
          )}
        </div>

        <div className="bg-muted shrink-0 border-t p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua mensagem"
              disabled={isLoading}
              className="bg-background text-foreground placeholder:text-muted-foreground flex-1 rounded-full px-4 py-3 text-sm outline-none"
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
      </SheetContent>
    </Sheet>
  );
};

export default ChatSheet;
