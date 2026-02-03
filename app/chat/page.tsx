"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { BotMessageSquare, ChevronLeft, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Streamdown } from "streamdown";

import { Button } from "@/components/ui/button";

const ChatPage = () => {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && status === "ready") {
      sendMessage({ text: input });
      setInput("");
    }
  };

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="size-6">
            <ChevronLeft className="size-6" />
          </Button>
        </Link>
        <h1 className="font-[family-name:var(--font-merriweather)] text-xl tracking-tight italic">
          Agenda.ai
        </h1>
        <div className="size-6" />
      </header>

      {/* Status Message */}
      <div className="px-5 pt-6">
        <div className="rounded-xl border p-3">
          <p className="text-muted-foreground text-center text-sm">
            Seu assistente de agendamentos está online.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Initial AI Message */}
        <div className="flex gap-2 px-3 pt-6 pr-14">
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

        {/* Chat Messages */}
        {messages.map((message) => (
          <div key={message.id} className="pt-6">
            {message.role === "assistant" ? (
              <div className="flex items-start gap-2 px-3 pr-14">
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
              <div className="flex justify-end pr-5 pl-10">
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

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start gap-2 px-3 pt-6 pr-14">
            <div className="bg-primary/12 flex size-8 shrink-0 items-center justify-center rounded-full border">
              <BotMessageSquare className="text-primary size-3.5" />
            </div>
            <div className="text-muted-foreground text-sm">Digitando...</div>
          </div>
        )}
      </div>

      {/* Input Container */}
      <div className="bg-muted fixed right-0 bottom-0 left-0 p-5">
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
    </div>
  );
};

export default ChatPage;
