"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";

const PLANS = [
  {
    name: "Solo",
    price: "39,90",
    highlight: false,
    badge: null,
    desc: "Para o profissional autônomo que quer parecer grande sem complicação",
    profissionais: "1 profissional",
    servicos: "Até 4 serviços",
    extras: [
      "1 loja",
      "Agendamento online 24/7",
      "Página pública do seu negócio",
      "Pagamentos online integrados",
      "Suporte via chat",
    ],
  },
  {
    name: "Equipe",
    price: "79,90",
    highlight: true,
    badge: "MAIS POPULAR",
    desc: "Sua equipe cresceu — organize horários, comissões e clientes em um só lugar",
    profissionais: "Até 5 profissionais",
    servicos: "Até 20 serviços",
    extras: [
      "Tudo do Solo",
      "Agendamento online por profissional",
      "Comissão automática por profissional",
      "Relatórios de faturamento",
      "Suporte via chat",
    ],
  },
  {
    name: "Profissional",
    price: "129,90",
    highlight: false,
    badge: null,
    desc: "Gestão completa para quem quer crescer com dados e não no escuro",
    profissionais: "Até 20 profissionais",
    servicos: "Até 50 serviços",
    extras: [
      "Tudo do Equipe",
      "Relatórios avançados por unidade",
      "Ranking de desempenho por profissional",
      "Histórico completo de clientes",
      "Suporte prioritário",
    ],
  },
] as const;

const FEATURES = [
  {
    icon: "📅",
    title: "Agendamento Online 24/7",
    desc: "Seu cliente agenda a qualquer hora, mesmo enquanto você dorme. Chega de perder cliente por não atender o telefone.",
  },
  {
    icon: "💬",
    title: "Notificações Automáticas no WhatsApp",
    desc: "A cada agendamento ou cancelamento, a agenda atualizada vai direto para o grupo do WhatsApp — sem você fazer nada.",
  },
  {
    icon: "💳",
    title: "Pagamento Online com Cartão",
    desc: "Receba pelo cartão de crédito diretamente na sua conta bancária via Stripe, com total segurança.",
  },
  {
    icon: "⏰",
    title: "Controle Total de Horários",
    desc: "Configure expediente, intervalo de almoço e dias de folga. O sistema bloqueia horários automaticamente.",
  },
  {
    icon: "👥",
    title: "Gestão de Equipe Completa",
    desc: "Acompanhe a agenda e os ganhos de cada profissional em tempo real, tudo em um único painel.",
  },
  {
    icon: "🔒",
    title: "Configuração em Minutos",
    desc: "Login com Google, sem senhas para criar. Sua loja no ar em menos de 10 minutos do zero.",
  },
] as const;

const PAINS = [
  {
    icon: "😤",
    title: "Agenda bagunçada no papel?",
    desc: "Horários conflitantes, rasuras e clientes ligando a toda hora para confirmar.",
  },
  {
    icon: "📵",
    title: "Perdendo cliente por não atender?",
    desc: "Enquanto você está atendendo, dezenas de ligações vão para o concorrente.",
  },
  {
    icon: "💸",
    title: "Recebendo só em dinheiro?",
    desc: "Sem cartão, você perde clientes que não têm dinheiro na hora.",
  },
  {
    icon: "😰",
    title: "Sem controle dos seus ganhos?",
    desc: "Não sabe quanto faturou no mês? Quanto cada profissional gerou?",
  },
] as const;

function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible] as const;
}

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

function RevealSection({
  children,
  className = "",
  delay = 0,
}: RevealSectionProps) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

interface PlanCardProps {
  plan: (typeof PLANS)[number];
}

function PlanCard({ plan, onCtaClick }: PlanCardProps & { onCtaClick: () => void }) {
  return (
    <div
      className={`relative flex flex-col gap-4 rounded-lg p-8 transition-transform duration-300 ${
        plan.highlight
          ? "border border-gold bg-linear-to-br from-gold-muted to-[#1a1a1a]"
          : "border border-white/[0.07] bg-[#161616]"
      }`}
    >
      {plan.badge && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2 whitespace-nowrap rounded-b-md bg-gold px-4 py-1 text-[0.6rem] font-extrabold uppercase tracking-widest text-gold-foreground">
          {plan.badge}
        </div>
      )}
      <p
        className={`text-[0.7rem] uppercase tracking-[0.18em] text-gold ${plan.badge ? "mt-3" : ""}`}
      >
        {plan.name}
      </p>
      <div>
        <span className="text-sm text-muted-foreground">R$</span>
        <span className="mx-1 font-serif text-5xl font-bold text-white">
          {plan.price}
        </span>
        <span className="text-sm text-muted-foreground">/mês</span>
      </div>
      <p className="mb-2 border-b border-white/6 pb-5 text-sm text-muted-foreground">
        {plan.desc}
      </p>
      <ul className="flex flex-col gap-2.5">
        <li className="flex items-center gap-2.5 text-sm text-white/85">
          <span className="font-bold text-gold">✓</span>
          {plan.profissionais}
        </li>
        <li className="flex items-center gap-2.5 text-sm text-white/85">
          <span className="font-bold text-gold">✓</span>
          {plan.servicos}
        </li>
        {plan.extras.map((e: string) => (
          <li
            key={e}
            className="flex items-center gap-2.5 text-sm text-white/60"
          >
            <span className="font-bold text-gold">✓</span>
            {e}
          </li>
        ))}
      </ul>
      <Button
        variant={plan.highlight ? "default" : "outline"}
        className={`mt-6 w-full uppercase tracking-wide ${
          plan.highlight
            ? "bg-gold text-gold-foreground hover:bg-gold/90"
            : "border-gold/50 text-gold hover:bg-gold/10"
        }`}
        onClick={onCtaClick}
      >
        Começar agora
      </Button>
    </div>
  );
}

export default function ServixLanding() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCtaClick = () => {
    authClient.signIn.social({ provider: "google", callbackURL: "/auth/callback" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0A0A] font-sans text-white">
      {/* NAV */}
      <nav
        className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-400 md:px-16 ${
          scrolled
            ? "border-b border-gold/10 bg-[#0A0A0A]/90 backdrop-blur-sm"
            : "bg-transparent"
        }`}
      >
        <span className="font-serif text-2xl font-black tracking-wide text-gold">
          Servix
        </span>
        <Button
          size="sm"
          className="bg-gold text-gold-foreground hover:bg-gold/90 uppercase tracking-wide text-xs font-bold"
          onClick={handleCtaClick}
        >
          Começar agora
        </Button>
      </nav>

      {/* HERO */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-32 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_45%_at_50%_60%,var(--gold-muted)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--gold-muted)_1px,transparent_1px),linear-gradient(90deg,var(--gold-muted)_1px,transparent_1px)] bg-size-[3.75rem_3.75rem] mask-[radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)] opacity-40" />

        <p className="animate-fade-up relative mb-5 text-[0.7rem] uppercase tracking-[0.22em] text-gold">
          ✦ Gestão Profissional para Negócios de Beleza
        </p>

        <h1 className="animate-fade-up relative max-w-225 font-serif text-[clamp(2.6rem,6.5vw,6rem)] font-black leading-none [animation-delay:150ms]">
          Seu salão cheio,
          <br />
          <em className="italic text-gold">sem você precisar</em>
          <br />
          atender o telefone.
        </h1>

        <p className="animate-fade-up relative mt-6 max-w-125 text-lg font-light leading-relaxed text-white/50 [animation-delay:300ms]">
          O Servix automatiza seus agendamentos, envia confirmações pelo
          WhatsApp e ainda recebe pelo cartão — tudo no piloto automático.
        </p>

        <div className="animate-fade-up relative mt-10 flex flex-wrap justify-center gap-4 [animation-delay:450ms]">
          <Button
            size="lg"
            className="bg-gold text-gold-foreground shadow-lg shadow-gold/25 hover:bg-gold/90 uppercase tracking-wide font-bold"
            onClick={handleCtaClick}
          >
            Quero começar agora →
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-gold/40 text-gold hover:bg-gold/10 uppercase tracking-wide"
            asChild
          >
            <a href="#como-funciona">Ver como funciona</a>
          </Button>
        </div>

        {/* Stats */}
        <div className="animate-fade-up relative mt-16 flex flex-wrap justify-center gap-12 rounded-lg border border-gold/10 bg-white/3 px-12 py-6 [animation-delay:600ms]">
          {[
            { val: "10 min", label: "para configurar" },
            { val: "24/7", label: "agendamentos online" },
            { val: "R$ 39,90", label: "para começar" },
          ].map(({ val, label }) => (
            <div key={label} className="text-center">
              <p className="font-serif text-3xl font-bold text-gold">{val}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-white/30">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* DOR */}
      <section className="bg-[#111111] px-6 py-24" id="problema">
        <div className="mx-auto max-w-275">
          <RevealSection>
            <p className="mb-3 text-[0.68rem] uppercase tracking-[0.2em] text-gold">
              O problema que você vive todo dia
            </p>
            <h2 className="font-serif text-[clamp(1.9rem,3.5vw,3rem)] font-bold leading-tight">
              Você cuida do cliente.
              <br />
              <em className="italic text-gold">
                Mas quem cuida da sua agenda?
              </em>
            </h2>
            <p className="mb-12 mt-4 max-w-130 text-base leading-relaxed text-white/45">
              Sem um sistema profissional, você perde tempo, perde cliente e
              perde dinheiro. Todo. Dia.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {PAINS.map((pain, i) => (
              <RevealSection key={pain.title} delay={i * 100}>
                <div className="flex items-start gap-4 rounded-r-md border-l-2 border-gold/20 bg-[#161616] px-6 py-5 transition-colors hover:border-gold">
                  <span className="shrink-0 text-2xl">{pain.icon}</span>
                  <div>
                    <p className="mb-1 text-[0.95rem] font-semibold">
                      {pain.title}
                    </p>
                    <p className="text-sm leading-relaxed text-white/40">
                      {pain.desc}
                    </p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>

          <RevealSection delay={400}>
            <div className="mt-12 rounded-lg border border-gold/20 bg-linear-to-br from-gold/8 to-gold/2 p-8 md:p-10">
              <p className="font-serif text-xl italic leading-relaxed text-white/85">
                &ldquo;Com o Servix,{" "}
                <strong className="not-italic text-gold">
                  meus clientes agendam sozinhos
                </strong>
                , recebo notificação no WhatsApp e o pagamento cai direto na
                minha conta.{" "}
                <strong className="not-italic text-gold">
                  Nunca mais perdi um horário.
                </strong>
                &rdquo;
              </p>
              <p className="mt-4 text-xs tracking-wider text-white/30">
                — Proprietário de barbearia, usando o Servix
              </p>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-24" id="como-funciona">
        <div className="mx-auto max-w-275">
          <RevealSection>
            <p className="mb-3 text-[0.68rem] uppercase tracking-[0.2em] text-gold">
              O que o Servix faz por você
            </p>
            <h2 className="font-serif text-[clamp(1.9rem,3.5vw,3rem)] font-bold leading-tight">
              Tudo que seu negócio precisa
              <br />
              <em className="italic text-gold">em um só lugar.</em>
            </h2>
            <p className="mb-14 mt-4 max-w-130 text-base leading-relaxed text-white/45">
              Do agendamento ao pagamento, o Servix cuida de tudo para você
              focar no que realmente importa: atender bem.
            </p>
          </RevealSection>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat, i) => (
              <RevealSection key={feat.title} delay={i * 80}>
                <div className="group relative overflow-hidden rounded-lg border border-white/6 bg-[#111] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-gold to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="mb-5 block text-3xl">{feat.icon}</span>
                  <h3 className="mb-2 text-base font-semibold">{feat.title}</h3>
                  <p className="text-sm leading-relaxed text-white/40">
                    {feat.desc}
                  </p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="bg-[#111111] px-6 py-24" id="planos">
        <div className="mx-auto max-w-275">
          <RevealSection>
            <div className="mb-14 text-center">
              <p className="mb-3 text-[0.68rem] uppercase tracking-[0.2em] text-gold">
                Escolha o seu plano
              </p>
              <h2 className="font-serif text-[clamp(1.9rem,3.5vw,3rem)] font-bold leading-tight">
                Invista menos que uma pizza
                <br />
                <em className="italic text-gold">e lucre muito mais.</em>
              </h2>
              <p className="mx-auto mt-4 max-w-130 text-base leading-relaxed text-white/45">
                Planos acessíveis para qualquer tamanho de negócio. Sem
                fidelidade, sem taxa de adesão.
              </p>
            </div>
          </RevealSection>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PLANS.map((plan, i) => (
              <RevealSection key={plan.name} delay={i * 120}>
                <PlanCard plan={plan} onCtaClick={handleCtaClick} />
              </RevealSection>
            ))}
          </div>

          <RevealSection delay={400}>
            <p className="mt-8 text-center text-sm text-white/25">
              Cancele quando quiser &bull; Sem multa &bull; Sem taxa de adesão
            </p>
          </RevealSection>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 py-24" id="comecar">
        <div className="mx-auto max-w-275 text-center">
          <RevealSection>
            <div className="relative overflow-hidden rounded-xl border border-gold/15 bg-linear-to-br from-gold/8 to-transparent p-12 md:p-20">
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-gold to-transparent" />
              <p className="mb-5 text-[0.68rem] uppercase tracking-[0.2em] text-gold">
                Comece hoje mesmo
              </p>
              <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-bold leading-tight">
                Sua loja no ar em
                <br />
                <em className="italic text-gold">menos de 10 minutos.</em>
              </h2>
              <p className="mx-auto mb-10 mt-5 max-w-130 text-base leading-relaxed text-white/45">
                Login com Google, sem senha para criar. Configure e já comece a
                receber agendamentos hoje.
              </p>
              <Button
                size="lg"
                className="bg-gold text-gold-foreground shadow-lg shadow-gold/25 hover:bg-gold/90 px-12 text-base uppercase tracking-wide font-bold"
                onClick={handleCtaClick}
              >
                Assinar o Servix agora →
              </Button>
              <p className="mt-5 text-xs text-white/25">
                A partir de R$ 39,90/mês &bull; Cancele quando quiser
              </p>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-6 pb-8 pt-12 text-center">
        <p className="mb-4 font-serif text-xl text-gold">Servix</p>
        <p className="text-xs uppercase tracking-wider text-white/20">
          Gestão Profissional para Negócios de Beleza
        </p>
      </footer>

      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(1.5rem); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fade-up 0.9s ease both;
        }
      `}</style>
    </div>
  );
}
