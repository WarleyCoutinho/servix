"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "./ui/button";

const SECTIONS = [
  {
    id: 1,
    emoji: "🔐",
    title: "Primeiro Acesso e Login",
    who: "Proprietário",
    steps: [
      "Abra o link enviado para você e toque no ícone de menu <strong>≡</strong> no canto superior direito.",
      "Toque em <strong>Login → Entrar com Google</strong> → autorize o acesso.",
      "Na primeira vez, escolha <strong>Proprietário</strong> e toque em <strong>Continuar</strong>.",
    ],
    tip: null,
  },
  {
    id: 2,
    emoji: "🏪",
    title: "Criando sua Loja",
    who: "Proprietário",
    steps: [
      "Preencha: <strong>Nome do Negócio, Endereço, Cidade, Estado, Telefone, CPF e Descrição</strong> (todos obrigatórios).",
      "Adicione uma foto do negócio — opcional, mas muito recomendado!",
      "Após salvar, você vai para o <strong>Dashboard</strong> — a tela principal.",
    ],
    tip: "A Cidade e o Estado são usados para os clientes encontrarem sua loja ao filtrar por localização.",
  },
  {
    id: 3,
    emoji: "💳",
    title: "Ativando seu Plano",
    who: "Proprietário",
    steps: [
      "Toque na <strong>mensagem amarela</strong> no Dashboard ou acesse <strong>menu ≡ → Assinatura</strong>.",
      "Escolha o plano: <strong>Solo R$39,90</strong> (1 prof.), <strong>Equipe R$79,90</strong> (5 prof.) ou <strong>Profissional R$129,90</strong> (20 prof.).",
      "Preencha os dados do cartão e confirme. Assinatura ativa na hora!",
    ],
    tip: "Sem plano ativo o sistema fica bloqueado. No Plano Solo, você é o dono e também o único profissional.",
  },
  {
    id: 4,
    emoji: "👥",
    title: "Gerenciando Profissionais",
    who: "Proprietário",
    steps: [
      "<strong>Plano Solo:</strong> Configure seu perfil em menu ≡ → Profissionais → Gerenciar.",
      "<strong>Equipe/Profissional:</strong> Vá em Profissionais → Adicionar profissional. Informe nome, e-mail Google e nome do grupo WhatsApp.",
      "Envie o link da loja para o profissional — ele é reconhecido automaticamente ao fazer login com o e-mail cadastrado.",
    ],
    tip: "Você acompanha agenda, agendamentos e status do Stripe de cada profissional.",
  },
  {
    id: 5,
    emoji: "👤",
    title: "Perfil do Profissional",
    who: "Proprietário",
    steps: [
      "Acesse <strong>menu ≡ → Profissionais → Gerenciar</strong>.",
      "Edite: Nome de Exibição, Email, Biografia e Nome do Grupo WhatsApp.",
      "Visualize o status do Stripe e ative/desative o profissional. Toque em <strong>Salvar Alterações</strong>.",
    ],
    tip: null,
  },
  {
    id: 6,
    emoji: "💬",
    title: "Pagamento e WhatsApp",
    who: "Profissional",
    steps: [
      "Acesse <strong>Painel Profissional → menu ≡ → Configurações</strong>.",
      "Formas de pagamento: <strong>Cartão de Crédito</strong> (já ativo) e <strong>Pagar após o serviço</strong> (ative para cobrar presencialmente).",
      "<strong>WhatsApp — Opção A:</strong> Toque em QR Code → escaneie no WhatsApp (Dispositivos Conectados → Conectar dispositivo).",
      "<strong>WhatsApp — Opção B:</strong> Toque em Número do Celular → insira seu número → use o código de pareamento no WhatsApp.",
    ],
    tip: "O nome do grupo no sistema precisa ser idêntico ao nome no WhatsApp — letra por letra, incluindo maiúsculas e espaços.",
  },
  {
    id: 7,
    emoji: "✂️",
    title: "Cadastrando Serviços",
    who: "Proprietário",
    steps: [
      "Acesse <strong>menu ≡ → Serviços → + Novo Serviço</strong>.",
      "Preencha: Nome (ex: Corte Masculino), Descrição, Preço (ex: 50,00) e Duração (ex: 30 min).",
      "Adicione uma foto — opcional, mas aumenta muito as reservas! Toque em <strong>Criar Serviço</strong>.",
    ],
    tip: "No Plano Solo você cadastra até 4 serviços. O contador aparece no topo da tela.",
  },
  {
    id: 8,
    emoji: "⏰",
    title: "Horários e Intervalo de Almoço",
    who: "Profissional",
    steps: [
      "Acesse <strong>Painel Profissional → Minha Agenda</strong>.",
      "Para cada dia: ative/desative e defina horário de início e fim (ex: 08:00 às 18:00).",
      "Ative o <strong>Intervalo de almoço</strong> e defina início e fim (ex: 12:00 às 13:00) — os horários são removidos automaticamente da agenda.",
      "Toque em <strong>Salvar Alterações</strong>.",
    ],
    tip: "Se existir agendamento no horário alterado, o sistema bloqueia e informa o conflito.",
  },
  {
    id: 9,
    emoji: "💰",
    title: "Painel Profissional e Stripe",
    who: "Profissional",
    steps: [
      "No Painel Profissional, toque no aviso amarelo → <strong>Configurar → Configurar conta Stripe</strong>.",
      "<strong>Passo 1:</strong> Informe e-mail e telefone com DDD (+55 62 99999-9999).",
      "<strong>Passo 2:</strong> Setor: Serviços pessoais → Salões de beleza ou barbearias. Informe renda e descrição.",
      "<strong>Passo 3:</strong> Dados pessoais (nome, CPF, endereço). Cargo governamental: selecione Não.",
      "<strong>Passo 4:</strong> Digitalize seu documento (RG, CNH ou Passaporte) em local bem iluminado.",
      "<strong>Passo 5:</strong> Informe seus dados bancários. Conta deve estar no mesmo CPF.",
      "<strong>Passo 6:</strong> Se solicitado, envie comprovante de endereço (últimos 12 meses). Print não é aceito.",
      "<strong>Passo 7:</strong> Revise, corrija se necessário e toque em <strong>Concordar e enviar</strong>.",
    ],
    tip: 'Ao ver "Conta integrada" o cadastro foi enviado! Se aparecer "Configuração pendente", aguarde — o status muda para Ativo automaticamente.',
  },
  {
    id: 10,
    emoji: "✅",
    title: "Checklist Final",
    who: "Todos",
    steps: [
      "✓ Login com Google e seleção de perfil Proprietário",
      "✓ Loja criada (nome, endereço, cidade, estado, CPF, descrição, foto)",
      "✓ Plano de assinatura ativo",
      "✓ Profissionais cadastrados (nome, e-mail)",
      "✓ Serviços cadastrados (nome, preço, duração, foto)",
      "✓ Perfil do profissional configurado",
      "✓ Formas de pagamento e nome do grupo WhatsApp definidos",
      "✓ WhatsApp conectado",
      "✓ Horários de atendimento e intervalo de almoço configurados",
      "✓ Conta Stripe configurada no Painel Profissional",
    ],
    tip: "Sua loja está no ar! Os clientes já podem te encontrar e fazer agendamentos.",
  },
] as const;

const FAQ = [
  {
    q: "Como faço login?",
    a: "Abra o link da sua loja, toque no menu ≡ e depois em Login → Entrar com Google. Na primeira vez escolha Proprietário.",
  },
  {
    q: "Como ativo meu plano?",
    a: "No Dashboard, toque na mensagem amarela ou acesse menu ≡ → Assinatura. Escolha o plano e preencha os dados do cartão.",
  },
  {
    q: "Como adicionar um profissional?",
    a: "Vá em Profissionais → Adicionar profissional. Informe nome, e-mail Google e nome do grupo WhatsApp. Depois envie o link da loja para ele.",
  },
  {
    q: "Como conectar o WhatsApp?",
    a: "No Painel Profissional → Configurações, use o QR Code ou o Número de Celular para parear com o WhatsApp. O nome do grupo deve ser idêntico ao nome no WhatsApp.",
  },
  {
    q: "Como configurar horários?",
    a: "No Painel Profissional → Minha Agenda. Ative os dias, defina início e fim e configure o intervalo de almoço se necessário.",
  },
  {
    q: "Como configurar o Stripe?",
    a: "No Painel Profissional, toque no aviso amarelo → Configurar conta Stripe. Tenha em mãos: RG/CNH, CPF, dados bancários e comprovante de endereço.",
  },
  {
    q: "Por que meus serviços não aparecem?",
    a: "Os serviços só aparecem para os clientes quando há pelo menos um profissional ativo configurado.",
  },
  {
    q: "Como receber presencialmente?",
    a: "Em Configurações, ative Pagar após o serviço. O cliente agenda sem pagar, você atende e marca como Finalizado no sistema.",
  },
  {
    q: "O QR Code expirou, e agora?",
    a: "Basta solicitar um novo QR Code. O sistema limpa a sessão anterior automaticamente antes de criar uma nova.",
  },
  {
    q: "Quantos serviços posso cadastrar?",
    a: "Plano Solo: até 4 serviços. Plano Equipe: até 20. Plano Profissional: até 50.",
  },
] as const;

interface ChatMessage {
  from: "bot" | "user";
  text: string;
}

function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMessage[]>([
    {
      from: "bot",
      text: "Olá! 👋 Sou o assistente do Servix. Selecione uma dúvida abaixo ou me faça uma pergunta.",
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { from: "user", text }]);
    setInput("");

    const match = FAQ.find(
      (f) =>
        f.q.toLowerCase().includes(text.toLowerCase()) ||
        text
          .toLowerCase()
          .includes(f.q.toLowerCase().split(" ").slice(1, 3).join(" ")),
    );

    setTimeout(() => {
      setMsgs((m) => [
        ...m,
        {
          from: "bot",
          text: match
            ? match.a
            : "Não encontrei essa resposta no manual. Consulte a seção correspondente ou entre em contato com o suporte do Servix.",
        },
      ]);
    }, 600);
  };

  return (
    <>
      {/* Chat box */}
      <div
        className={`fixed bottom-18 right-6 z-199 flex w-85 max-h-130 flex-col overflow-hidden rounded-xl border border-gold-border bg-[#141414] shadow-2xl transition-all duration-250 ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-[0.97] opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gold/15 bg-[#0A0A0A] px-4 py-3.5">
          <div className="flex size-8 items-center justify-center rounded-full border border-gold/30 bg-gold-muted text-base">
            ✂️
          </div>
          <div>
            <div className="text-sm font-bold text-white">Ajuda Servix</div>
            <div className="text-xs text-green-400">● Online agora</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
          {msgs.map((m, i) => (
            <div
              key={i}
              className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.from === "bot"
                  ? "self-start rounded-bl-sm border border-white/6 bg-[#1E1E1E] text-white/80"
                  : "self-end rounded-br-sm border border-gold/20 bg-gold-muted text-white"
              }`}
            >
              {m.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* FAQ chips */}
        <div className="flex max-h-45 flex-col gap-1.5 overflow-y-auto border-t border-white/5 px-4 pb-4 pt-2">
          <span className="mb-1 text-[0.68rem] uppercase tracking-wider text-white/25">
            Perguntas frequentes
          </span>
          {FAQ.slice(0, 7).map((f) => (
            <button
              key={f.q}
              className="rounded-md border border-gold/20 px-3 py-2 text-left text-xs text-gold transition-colors hover:bg-gold/10"
              onClick={() => send(f.q)}
            >
              {f.q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-2 border-t border-white/6 p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Digite sua dúvida..."
            className="flex-1 rounded-md border border-white/8 bg-[#1E1E1E] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-gold/30"
          />
          <button
            onClick={() => send(input)}
            className="flex size-9 items-center justify-center rounded-md bg-gold text-base text-gold-foreground transition-colors hover:bg-gold/90"
          >
            →
          </button>
        </div>
      </div>

      {/* Floating button */}
      <button
        className="fixed bottom-6 right-6 z-200 flex size-13 items-center justify-center rounded-full bg-gold text-xl text-gold-foreground shadow-lg shadow-gold/40 transition-transform hover:scale-105"
        onClick={() => setOpen((o) => !o)}
        title="Ajuda"
      >
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}

function getBadgeClasses(who: string): string {
  if (who === "Profissional") {
    return "bg-green-500/10 text-green-400";
  }
  return "bg-gold-muted text-gold";
}

export default function ServixManual() {
  const [active, setActive] = useState(1);
  const [read, setRead] = useState(new Set([1]));

  const section = SECTIONS.find((s) => s.id === active);
  const progress = Math.round((read.size / SECTIONS.length) * 100);

  const go = (id: number) => {
    setActive(id);
    setRead((r) => new Set([...r, id]));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] font-sans text-white">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gold/20 bg-[#111] px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white"
          >
            <Link href="/home">
              <ArrowLeft className="mr-2 size-4" />
              Voltar
            </Link>
          </Button>
          <span className="font-serif text-xl font-bold text-gold tracking-wide">
            Servix
          </span>
          <span className="text-xs uppercase tracking-widest text-white/30">
            Manual do Proprietário
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gold">{progress}% concluído</span>
          <Button
            asChild
            size="sm"
            className="bg-gold text-gold-foreground hover:bg-gold/90 uppercase tracking-wide text-xs font-bold"
          >
            <a href="/manual_servix.pdf" download="Manual_Servix.pdf">
              <Download className="mr-2 size-3.5" />
              Baixar PDF
            </a>
          </Button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 overflow-hidden bg-white/6">
        <div
          className="h-full rounded bg-linear-to-r from-gold to-gold/60 transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* MOBILE SELECT */}
      <div className="block p-3 sm:hidden">
        <select
          value={active}
          onChange={(e) => go(Number(e.target.value))}
          className="w-full rounded-md border border-gold-border bg-[#1A1A1A] px-3 py-2.5 text-sm text-white"
        >
          {SECTIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id}. {s.emoji} {s.title}
            </option>
          ))}
        </select>
      </div>

      {/* LAYOUT */}
      <div className="mx-auto flex max-w-275 px-2">
        {/* SIDEBAR */}
        <aside className="sticky top-0 hidden h-screen w-55 shrink-0 overflow-y-auto py-6 pr-2 sm:block">
          <p className="mb-2.5 px-2 text-[0.65rem] uppercase tracking-[0.18em] text-white/30">
            Seções
          </p>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`flex w-full items-center gap-2 rounded-r px-3 py-2 text-left text-sm transition-all ${
                active === s.id
                  ? "border-l-2 border-gold bg-gold/10 text-gold"
                  : "border-l-2 border-transparent text-white/45 hover:text-white/70"
              }`}
              onClick={() => go(s.id)}
            >
              <span className="w-4 shrink-0 text-right text-[0.65rem] text-white/25">
                {s.id}
              </span>
              <span className="text-xs">{s.emoji}</span>
              <span className="flex-1 text-xs leading-tight">{s.title}</span>
              {read.has(s.id) && s.id !== active && (
                <span className="text-[0.7rem] text-green-400">✓</span>
              )}
            </button>
          ))}
        </aside>

        {/* CONTENT */}
        <main className="min-w-0 flex-1 p-6">
          {section && (
            <div className="rounded-lg border border-white/6 bg-[#161616] p-8">
              {/* Section header */}
              <div className="mb-6 flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/10 text-xl">
                  {section.emoji}
                </div>
                <div>
                  <span
                    className={`inline-block rounded px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${getBadgeClasses(section.who)}`}
                  >
                    {section.who}
                  </span>
                  <h2 className="mt-1 text-lg font-bold text-white leading-snug">
                    {section.id}. {section.title}
                  </h2>
                </div>
              </div>

              {/* Steps */}
              {section.steps.map((step, i) => (
                <div
                  key={i}
                  className="flex gap-3 border-b border-white/4 py-3"
                >
                  <div className="mt-0.5 flex size-5.5 shrink-0 items-center justify-center rounded-full bg-gold text-[0.7rem] font-extrabold text-gold-foreground">
                    {i + 1}
                  </div>
                  <div
                    className="text-sm leading-relaxed text-white/75 [&>strong]:font-semibold [&>strong]:text-white"
                    dangerouslySetInnerHTML={{ __html: step }}
                  />
                </div>
              ))}

              {/* Tip */}
              {section.tip && (
                <div className="mt-5 rounded-r-md border-l-[3px] border-gold bg-gold/6 px-4 py-3 text-sm leading-relaxed text-white/60">
                  💡 <span dangerouslySetInnerHTML={{ __html: section.tip }} />
                </div>
              )}

              {/* Navigation */}
              <div className="mt-8 flex justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={active === 1}
                  onClick={() => go(active - 1)}
                  className="border-white/10 text-white/60 hover:text-white disabled:text-white/20"
                >
                  ← Anterior
                </Button>

                {active < SECTIONS.length ? (
                  <Button
                    size="sm"
                    onClick={() => go(active + 1)}
                    className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold"
                  >
                    Próxima seção →
                  </Button>
                ) : (
                  <Button
                    asChild
                    size="sm"
                    className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold"
                  >
                    <a href="/manual_servix.pdf" download>
                      <Download className="mr-2 size-3.5" />
                      Baixar PDF completo
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* HELP WIDGET */}
      <HelpWidget />
    </div>
  );
}
