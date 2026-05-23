"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import Link from "next/link";

// ─── DADOS ────────────────────────────────────────────────────────────────────

const BUSINESS_SEGMENTS = [
  "Barbearia/ ",
  "Salão de beleza/ ",
  "Studio de sobrancelhas / Lash/ ",
  "Esmalteria / Nail studio/ ",
  "Escovaria/ ",
  "Depilação/ ",
  "Clínica de estética/ ",
  "Maquiagem/ ",
] as const;

const PLANS = [
  {
    name: "Solo",
    price: "39",
    cents: ",90",
    highlight: false,
    badge: null,
    note: "Organize sua agenda, reduza faltas e aceite pagamentos online — sem complicação",
    features: [
      "1 loja · 1 profissional",
      "Até 15 serviços",
      "Agenda online 24h",
      "Página pública com link de agendamento",
      "Lembretes automáticos (redução de faltas no WhatsApp do profissional)",
      "Confirmação de agendamento",
      "Pagamento online (cartão)",
    ],
    idealFor: ["Nail designer", "Lash / Sobrancelha", "Depilação", "Maquiagem"],
  },
  {
    name: "Equipe",
    price: "79",
    cents: ",90",
    highlight: true,
    badge: "★ Mais popular",
    note: "Gerencie sua equipe, controle atendimentos e acompanhe seu faturamento em um só lugar",
    features: [
      "1 loja",
      "Até 3 profissionais",
      "Até 30 serviços",
      "Agenda por profissional",
      "Página pública com link de agendamento",
      "Histórico de clientes",
      "Lembretes automáticos (redução de faltas no WhatsApp do profissional)",
      "Confirmação de agendamento",
      "Pagamento online (cartão)",
      "Visualização de faturamento",
      "Controle de caixa",
      "Comissão automática por profissional (via Stripe)",
    ],
    idealFor: [
      "Barbearia",
      "Salão de beleza",
      "Escova progressiva / Smoothing",
      "Studio de beleza",
    ],
  },
  {
    name: "Profissional",
    price: "129",
    cents: ",90",
    highlight: false,
    badge: null,
    note: "Gestão completa com dados, performance e controle total da operação",
    features: [
      "1 loja",
      "Até 10 profissionais",
      "Até 100 serviços",
      "Agenda por profissional",
      "Página pública por estabelecimento",
      "Histórico completo de clientes",
      "Lembretes automáticos (redução de faltas no WhatsApp do profissional)",
      "Confirmação de agendamento",
      "Pagamento online (cartão)",
      "Controle financeiro completo",
      "Ranking de desempenho da equipe",
      "Comissão automática por profissional (via Stripe)",
    ],
    idealFor: [
      "Estética facial e corporal",
      "Salões completos",
      "Espaços multi-serviços",
      "Hair spa",
    ],
  },
] as const;

const FEATURES = [
  {
    icon: "📅",
    title: "Agendamento Online 24/7",
    tag: "Automático",
    desc: "Seu cliente agenda a qualquer hora, mesmo enquanto você dorme. Chega de perder cliente por não atender o telefone.",
  },
  {
    icon: "✂️",
    title: "Agenda Corrida",
    tag: "Vagas simultâneas",
    desc: "Marcou uma cliente pra fazer luzes? Enquanto o produto age, o sistema já libera vaga automática pra você atender outra. Você configura quantas vagas simultâneas consegue tocar — e o Servix cuida do resto. Sem conflito de horário. Sem cadeira parada. Sem surpresa.",
  },
  {
    icon: "💬",
    title: "WhatsApp Automático",
    tag: "Integrado",
    desc: "Cada agendamento ou cancelamento — o Servix envia a agenda do dia pro seu grupo automaticamente. Você não faz nada.",
  },
  {
    icon: "💳",
    title: "Pagamento Online",
    tag: "Stripe · 0% por 90d",
    desc: "Receba pelo cartão de crédito diretamente na sua conta bancária via Stripe, com total segurança.",
  },
  {
    icon: "⏰",
    title: "Controle de Horários",
    tag: "Bloqueio automático",
    desc: "Configure expediente, intervalo de almoço e dias de folga. O sistema bloqueia horários automaticamente.",
  },
  {
    icon: "👥",
    title: "Gestão de Equipe",
    tag: "Multi-profissional",
    desc: "Acompanhe a agenda e os ganhos de cada profissional em tempo real, tudo em um único painel.",
  },
  {
    icon: "🔒",
    title: "Setup em Minutos",
    tag: "Login com Google",
    desc: "Login com Google, sem senhas para criar. Sua loja no ar em menos de 10 minutos do zero.",
  },
] as const;

const PAINS = [
  {
    icon: "📵",
    title: "Cliente não aparece",
    desc: "Você reservou o horário, bloqueou o espaço, e o cliente simplesmente sumiu. Sem aviso. Sem satisfação.",
    cost: "⚠ Horário perdido = dinheiro perdido",
    isPositive: false,
  },
  {
    icon: "📱",
    title: "Confirmação manual",
    desc: "Você fica no celular confirmando o dia inteiro. Isso não é gestão — é trabalho que o sistema deveria fazer por você.",
    cost: "⚠ Tempo é dinheiro",
    isPositive: false,
  },
  {
    icon: "💸",
    title: "Sem pagamento antecipado",
    desc: "Quando não há compromisso financeiro, o cliente não sente obrigação de aparecer. O dinheiro garante a cadeira cheia.",
    cost: "⚠ Sem pagamento = risco total",
    isPositive: false,
  },
  {
    icon: "✅",
    title: "Com o Servix",
    desc: "O cliente agenda, paga e confirma sozinho. Você recebe notificação no WhatsApp automaticamente. Fim do caos.",
    cost: "✓ Agenda 100% automática",
    isPositive: true,
  },
] as const;

const STEPS = [
  {
    num: "01",
    title: "Crie sua conta",
    desc: "Login com Google. Nada de senha. Em 30 segundos você já está dentro.",
    last: false,
  },
  {
    num: "02",
    title: "Monte sua loja",
    desc: "Adicione serviços, preços e horários. Interface simples, sem manual.",
    last: false,
  },
  {
    num: "03",
    title: "Compartilhe o link",
    desc: "Manda pro seu cliente. Ele agenda, paga e você recebe a notificação.",
    last: false,
  },
  {
    num: "04",
    title: "Pronto.",
    desc: "Sua loja funcionando 24/7. Você corta, o sistema cuida do resto.",
    last: true,
  },
] as const;

const PROFILES = [
  {
    emoji: "👑",
    role: "Dono",
    features: [
      "Todos os profissionais",
      "Faturamento total",
      "Ranking de desempenho",
      "Agenda de toda equipe",
      "Status Stripe de cada um",
    ],
    highlight: false,
  },
  {
    emoji: "✂️",
    role: "Profissional",
    features: [
      "Sua agenda do dia",
      "Quem pagou / vai pagar",
      "Seus horários e almoço",
      "WhatsApp e pagamento",
      "Seus ganhos do mês",
    ],
    highlight: true,
  },
  {
    emoji: "📱",
    role: "Cliente",
    features: [
      "Suas barbearias e salões",
      "Histórico de visitas",
      "Total gasto",
      "Próximo agendamento",
      "Status de pagamento",
    ],
    highlight: false,
  },
] as const;

const PROBLEM_ITEMS = [
  "Cliente não aparece",
  "Horário perdido",
  "WhatsApp o dia inteiro",
  "Confirmação manual",
  "Sem pagamento antecipado",
  "Agenda bagunçada",
];

const WA_APPOINTMENTS = [
  { time: "09:00", name: "Carlos H." },
  { time: "10:30", name: "Bruno A." },
  { time: "11:00", name: "Diego S." },
  { time: "13:00", name: "Mateus R." },
];

const WA_CONFIG_ITEMS = [
  {
    title: "Conexão por QR Code",
    desc: "Escaneia uma vez no WhatsApp → Dispositivos Conectados → pronto.",
    highlight: false,
  },
  {
    title: "Ou por número",
    desc: "Digita o número, recebe o código de pareamento e conecta.",
    highlight: false,
  },
  {
    title: "Nome exato do grupo",
    desc: "O nome no sistema precisa ser idêntico ao do grupo no WhatsApp — letra por letra.",
    highlight: true,
  },
];

const HERO_STATS = [
  { num: "10min", label: "Sua loja no ar" },
  { num: "90d", label: "Sem taxa" },
  { num: "24/7", label: "Agenda online" },
  { num: "R$0", label: "Taxa nos 90 dias" },
];

// ─── HOOKS ────────────────────────────────────────────────────────────────────

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
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible] as const;
}

// ─── COMPONENTES ──────────────────────────────────────────────────────────────

function RevealSection({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="sx-label mb-4">{children}</p>;
}

function SectionTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h2 className={`sx-section-title ${className}`}>{children}</h2>;
}

function ArrowIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────

export default function ServixLanding() {
  const [scrolled, setScrolled] = useState(false);

  const handleCtaClick = () => {
    authClient.signIn.social({
      provider: "google",
      /* callbackURL: "/auth/callback", */
      callbackURL: "/home",
    });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sx-root">
      {/* ─── NOISE OVERLAY ─── */}
      <div className="sx-noise" aria-hidden />

      {/* ─── NAV ─── */}
      <nav className={`sx-nav ${scrolled ? "sx-nav--scrolled" : ""}`}>
        <div className="sx-logo">
          SERVI<span>X</span>
        </div>
        <div className="sx-nav-pill">Barbearias &amp; Salões</div>
        <Button onClick={handleCtaClick} className="sx-nav-cta">
          Começar agora →
        </Button>
      </nav>

      {/* ─── HERO ─── */}
      <section className="sx-hero">
        <div className="sx-hero-glow" aria-hidden />
        <p className="sx-hero-eyebrow">
          O problema de todo barbeiro e dono de salão
        </p>
        <h1 className="sx-hero-h1">
          AGENDA
          <br />
          <span className="sx-dim">SÓ PELO</span>
          <br />
          <span className="sx-accent">WHATSAPP?</span>
        </h1>
        <p className="sx-hero-sub">
          <strong>&ldquo;Oi, tem horário?&rdquo;</strong> →{" "}
          <strong>&ldquo;Depois confirmo...&rdquo;</strong> →{" "}
          <strong>&ldquo;Esqueci de ir.&rdquo;</strong>
          <br />
          Isso custa dinheiro. Todo dia. O Servix resolve isso em menos de 10
          minutos.
        </p>
        <div className="sx-hero-actions">
          <Button onClick={handleCtaClick} className="sx-btn-primary">
            Testar 90 dias sem taxa
            <ArrowIcon size={18} />
          </Button>
          <p className="sx-hero-note">
            A partir de <strong>R$39,90/mês</strong> · Cancele quando quiser
          </p>
        </div>
        <div className="sx-hero-stats">
          {HERO_STATS.map(({ num, label }) => (
            <div key={label}>
              <div className="sx-stat-num">{num}</div>
              <div className="sx-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PROBLEM STRIP ─── */}
      <div className="sx-problem-strip" aria-hidden>
        <div className="sx-problem-scroll">
          {[...PROBLEM_ITEMS, ...PROBLEM_ITEMS].map((item, i) => (
            <span key={i} className="sx-problem-item">
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ─── DOR / PAIN ─── */}
      <section className="sx-section">
        <RevealSection>
          <SectionLabel>O custo real do caos</SectionLabel>
          <SectionTitle>
            CADA FURO
            <br />
            <span className="sx-accent">CUSTA DINHEIRO</span>
          </SectionTitle>
        </RevealSection>
        <RevealSection delay={100}>
          <div className="sx-pain-grid">
            {PAINS.map((pain) => (
              <div
                key={pain.title}
                className={`sx-pain-card ${pain.isPositive ? "sx-pain-card--positive" : ""}`}
              >
                <div className="sx-pain-icon">{pain.icon}</div>
                <div className="sx-pain-title">{pain.title}</div>
                <div className="sx-pain-desc">{pain.desc}</div>
                <div
                  className={`sx-pain-cost ${pain.isPositive ? "sx-pain-cost--positive" : ""}`}
                >
                  {pain.cost}
                </div>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      <div className="sx-sep" />

      {/* ─── COMO FUNCIONA ─── */}
      <section className="sx-section" id="como-funciona">
        <RevealSection>
          <SectionLabel>Em menos de 10 minutos</SectionLabel>
          <SectionTitle>
            4 PASSOS.
            <br />
            <span className="sx-accent">ZERO TÉCNICO.</span>
          </SectionTitle>
        </RevealSection>
        <RevealSection delay={100}>
          <div className="sx-steps-grid">
            {STEPS.map((step) => (
              <div key={step.num} className="sx-step">
                <div
                  className={`sx-step-num ${step.last ? "sx-step-num--last" : ""}`}
                >
                  {step.num}
                </div>
                <div className="sx-step-title">{step.title}</div>
                <div className="sx-step-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      <div className="sx-sep" />

      {/* ─── FEATURES ─── */}
      <section className="sx-section" id="recursos">
        <RevealSection>
          <SectionLabel>O que o Servix faz por você</SectionLabel>
          <SectionTitle>
            TUDO QUE
            <br />
            <span className="sx-accent">SEU NEGÓCIO PRECISA</span>
          </SectionTitle>
          <p className="sx-section-desc">
            Do agendamento ao pagamento, o Servix cuida de tudo para você focar
            no que realmente importa: atender bem.
          </p>
        </RevealSection>
        <div className="sx-features-grid">
          {FEATURES.map((feat, i) => (
            <RevealSection key={feat.title} delay={i * 60}>
              <div className="sx-feature-card">
                <span className="sx-feature-icon">{feat.icon}</span>
                <div className="sx-feature-title">{feat.title}</div>
                <div className="sx-feature-desc">{feat.desc}</div>
                <span className="sx-feature-tag">{feat.tag}</span>
              </div>
            </RevealSection>
          ))}
        </div>
      </section>

      <div className="sx-sep" />

      {/* ─── PAGAMENTO ─── */}
      <section className="sx-section">
        <RevealSection>
          <SectionLabel>Flexibilidade de pagamento</SectionLabel>
          <SectionTitle>
            PAGAR ANTES
            <br />
            <span className="sx-accent">OU DEPOIS.</span>
            <br />
            <span className="sx-dim">VOCÊ DECIDE.</span>
          </SectionTitle>
        </RevealSection>
        <RevealSection delay={100}>
          <div className="sx-payment-split">
            <div className="sx-pay-card">
              <span className="sx-pay-icon">💳</span>
              <div className="sx-pay-title">Pagar antes</div>
              <p className="sx-pay-desc">
                Cliente agenda e paga pelo cartão de crédito na hora. Horário
                garantido, dinheiro na sua conta via Stripe.
              </p>
              <span className="sx-pay-badge">
                Stripe integrado · 0% por 90 dias
              </span>
            </div>
            <div className="sx-pay-card">
              <span className="sx-pay-icon">🤝</span>
              <div className="sx-pay-title">Pagar depois</div>
              <p className="sx-pay-desc">
                Cliente agenda sem pagar. Você atende, recebe na maquininha ou
                dinheiro e marca como Finalizado no sistema.
              </p>
              <span className="sx-pay-badge sx-pay-badge--neutral">
                Maquininha · PIX · Dinheiro
              </span>
            </div>
            <div className="sx-pay-hybrid">
              <span className="sx-pay-hybrid-icon">💡</span>
              <div className="sx-pay-hybrid-text">
                <strong>Modo híbrido:</strong> ative os dois ao mesmo tempo — o
                cliente escolhe na hora de agendar. Funciona perfeitamente.
              </div>
            </div>
          </div>
        </RevealSection>
      </section>

      <div className="sx-sep" />

      {/* ─── WHATSAPP ─── */}
      <section className="sx-section">
        <RevealSection>
          <SectionLabel>WhatsApp automático</SectionLabel>
          <SectionTitle>
            SEU GRUPO
            <br />
            <span className="sx-accent">SEMPRE</span>
            <br />
            ATUALIZADO
          </SectionTitle>
          <p className="sx-section-desc">
            Cada agendamento ou cancelamento — o Servix envia a agenda do dia
            pro seu grupo automaticamente. Você não faz nada.
          </p>
        </RevealSection>
        <RevealSection delay={100}>
          <div className="sx-wa-layout">
            {/* Mock WhatsApp */}
            <div className="sx-wa-demo">
              <div className="sx-wa-header">
                <div className="sx-wa-avatar">✂️</div>
                <div>
                  <div className="sx-wa-name">Agenda JP — Hoje</div>
                  <div className="sx-wa-status">Atualizado agora</div>
                </div>
              </div>
              <div className="sx-wa-label">Novo agendamento</div>
              <div className="sx-wa-message">
                <strong>Carlos H.</strong> — Corte + Barba
                <br />
                Hoje às 09:00 · Pago ✓
                <div className="sx-wa-grid">
                  {WA_APPOINTMENTS.map(({ time, name }) => (
                    <div key={time} className="sx-wa-info">
                      <div className="sx-wa-info-key">{time}</div>
                      <div className="sx-wa-info-val">{name}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sx-wa-message sx-wa-message--cancel">
                <span className="sx-wa-cancel-name">
                  Felipe N. cancelou 14:00
                </span>
                <br />
                <span className="sx-wa-cancel-sub">Horário liberado</span>
              </div>
              <div className="sx-wa-time">Servix · automático</div>
            </div>

            {/* Configuração */}
            <div className="sx-wa-config">
              {WA_CONFIG_ITEMS.map(({ title, desc, highlight }) => (
                <div
                  key={title}
                  className={`sx-wa-config-item ${highlight ? "sx-wa-config-item--highlight" : ""}`}
                >
                  <div className="sx-wa-config-dot" />
                  <strong className="sx-wa-config-title">{title}</strong>
                  <p className="sx-wa-config-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ─── GARANTIA ─── */}
      <RevealSection>
        <div className="sx-guarantee">
          <div className="sx-guarantee-inner">
            <div className="sx-guarantee-num">90</div>
            <div className="sx-guarantee-label">Dias sem taxa de transação</div>
            <p className="sx-guarantee-desc">
              Todos os planos incluem 90 dias sem cobrança de taxa sobre as
              transações. Você fatura tudo, paga só a assinatura. Cancele quando
              quiser.
            </p>
          </div>
        </div>
      </RevealSection>

      {/* ─── PERFIS ─── */}
      <section className="sx-section">
        <RevealSection>
          <SectionLabel>3 painéis no mesmo sistema</SectionLabel>
          <SectionTitle>
            GESTÃO COMPLETA
            <br />
            <span className="sx-accent">EM 3 PERFIS</span>
          </SectionTitle>
          <p className="sx-section-desc">
            Dono, profissional e cliente — cada um com seu painel. Cada perfil
            acessa apenas o que é dele. Simples e seguro.
          </p>
        </RevealSection>
        <RevealSection delay={100}>
          <div className="sx-profiles-grid">
            {PROFILES.map((profile) => (
              <div
                key={profile.role}
                className={`sx-profile-card ${profile.highlight ? "sx-profile-card--highlight" : ""}`}
              >
                <div
                  className={`sx-profile-avatar ${profile.highlight ? "sx-profile-avatar--highlight" : ""}`}
                >
                  {profile.emoji}
                </div>
                <div className="sx-profile-role">{profile.role}</div>
                {profile.features.map((feat) => (
                  <div key={feat} className="sx-profile-feature">
                    {feat}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      <div className="sx-sep" />

      {/* ─── PLANOS ─── */}
      <section className="sx-section" id="planos">
        <RevealSection>
          <SectionLabel>Escolha seu plano</SectionLabel>
          <SectionTitle>
            3 PLANOS.
            <br />
            <span className="sx-accent">1 DECISÃO.</span>
          </SectionTitle>
          <p className="sx-section-desc">
            Para barbeiros autônomos, barbearias e salões. Cresça sem trocar de
            sistema.
          </p>
        </RevealSection>

        {/* ─── UNIVERSAL BANNER ─── */}
        <RevealSection delay={60}>
          <div className="sx-universal-banner">
            <div className="sx-universal-banner-glow" aria-hidden />
            <div className="sx-universal-banner-inner">
              <div className="sx-universal-banner-icon">✦</div>
              <div className="sx-universal-banner-content">
                <p className="sx-universal-banner-title">
                  Todos os planos funcionam para qualquer tipo de negócio
                </p>
                <div className="sx-universal-banner-tags">
                  {BUSINESS_SEGMENTS.map((segment) => (
                    <span key={segment} className="sx-universal-tag">
                      {segment}
                    </span>
                  ))}
                  {/* <span className="sx-universal-tag sx-universal-tag--muted">
                    e muito mais...
                  </span> */}
                </div>
                <p className="text-sm text-muted-foreground">
                  Comece simples —{" "}
                  <span className="font-medium text-foreground">
                    seu negócio evolui e seu plano acompanha.
                  </span>{" "}
                  Mais serviços, mais profissionais e mais capacidade conforme
                  você cresce.
                </p>
              </div>
            </div>
          </div>
        </RevealSection>

        <RevealSection delay={80}>
          <div className="sx-pricing-grid">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`sx-price-card ${plan.highlight ? "sx-price-card--featured" : ""}`}
              >
                {plan.badge && (
                  <div className="sx-price-badge">{plan.badge}</div>
                )}
                <div
                  className={`sx-price-name ${plan.highlight ? "sx-price-name--featured" : ""}`}
                >
                  {plan.name}
                </div>
                <div className="sx-price-amount">
                  <sup>R$</sup>
                  {plan.price}
                  <sup className="sx-price-cents">{plan.cents}</sup>
                </div>
                <div className="sx-price-period">/mês</div>
                <div className="sx-price-divider" />
                {plan.features.map((feat) => (
                  <div key={feat} className="sx-price-feature">
                    {feat}
                  </div>
                ))}
                {/* ─── IDEAL PARA ─── */}
                <div className="sx-price-ideal">
                  <span className="sx-price-ideal-label">Ideal para</span>
                  <div className="sx-price-ideal-tags">
                    {plan.idealFor.map((tag) => (
                      <span key={tag} className="sx-price-ideal-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="sx-price-note">{plan.note}</p>
                <Button
                  onClick={handleCtaClick}
                  className={`sx-price-cta ${plan.highlight ? "sx-price-cta--featured" : ""}`}
                >
                  Começar agora
                </Button>
              </div>
            ))}
          </div>

          <div className="sx-pricing-footer">
            <p className="sx-pricing-footer-text">
              Todos os planos: <strong>90 dias sem taxa</strong> de transação.
              Cancele quando quiser.
            </p>
            <Button onClick={handleCtaClick} className="sx-btn-sm">
              Acessar servix.app.br →
            </Button>
          </div>
        </RevealSection>
      </section>

      {/* ─── FINAL CTA ─── */}
      <RevealSection>
        <div className="sx-final-cta">
          <h2 className="sx-final-h2">
            COMECE
            <br />
            HOJE.
          </h2>
          <p className="sx-final-p">
            Sua loja no ar em menos de 10 minutos. Sem técnico, sem complicação.
            Cancele quando quiser.
          </p>
          <Button onClick={handleCtaClick} className="sx-btn-dark">
            Começar agora
            <ArrowIcon size={20} />
          </Button>
          <p className="sx-final-note">
            servix.app.br · Barbearia &amp; Salão de Beleza
          </p>
        </div>
      </RevealSection>

      {/* ─── FOOTER ─── */}
      <footer className="sx-footer">
        <div className="sx-footer-logo">
          SERVI<span>X</span>
        </div>

        <p className="sx-footer-text">
          Gestão profissional para barbearias, salões de beleza, esmalterias,
          estúdios e clínicas de estética.
        </p>

        <div className="mt-3">
          <Button onClick={handleCtaClick} className="sx-footer-link">
            servix.app.br
          </Button>
        </div>

        {/* Links legais — exigidos pelo Google OAuth */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/privacidade"
            className="
      text-sm
      font-medium
      text-zinc-300
      underline-offset-4
      transition-all
      duration-200
      hover:text-lime-400
      hover:underline
    "
          >
            Política de Privacidade
          </Link>

          <span className="text-zinc-600 text-sm">•</span>

          <Link
            href="/termos"
            className="
      text-sm
      font-medium
      text-zinc-300
      underline-offset-4
      transition-all
      duration-200
      hover:text-lime-400
      hover:underline
    "
          >
            Termos de Uso
          </Link>
        </div>

        <p className="sx-footer-copy">
          © {new Date().getFullYear()} Servix · Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
