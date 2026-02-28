"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, MessageCircle, Phone } from "lucide-react";

const MINIMIZED_KEY = "stripe-warning-minimized";
const SUPPORT_WHATSAPP = "5516989118349";

const LOST_BENEFITS = [
  "Pagamento online com cartão",
  "PIX integrado",
  "Cobrança automática",
  "Proteção contra no-show",
  "Histórico financeiro automático",
  "Relatórios de faturamento",
  "Comissão automática",
  "Período de 0% de taxa",
];

interface StripeWarningBannerProps {
  userPlan?: string;
}

export function StripeWarningBanner({ userPlan = "BASIC" }: StripeWarningBannerProps) {
  const isPremiumPlan = userPlan === "PROFESSIONAL" || userPlan === "ENTERPRISE";
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(MINIMIZED_KEY);
    if (stored === "true") {
      setMinimized(true);
    }
  }, []);

  const toggleMinimized = () => {
    const next = !minimized;
    setMinimized(next);
    sessionStorage.setItem(MINIMIZED_KEY, String(next));
  };

  if (minimized) {
    return (
      <div className="m-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
        <button
          onClick={toggleMinimized}
          className="flex w-full items-center justify-between text-sm font-medium text-amber-800 dark:text-amber-200"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Sistema sem Stripe
          </span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="m-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Você está usando o sistema sem a Stripe
          </p>
        </div>
        <button
          onClick={toggleMinimized}
          className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">
        Você não tem acesso a:
      </p>

      <div className="mb-3 grid grid-cols-1 gap-1">
        {LOST_BENEFITS.map((benefit) => (
          <p
            key={benefit}
            className="text-xs text-amber-600 dark:text-amber-400"
          >
            &times; {benefit}
          </p>
        ))}
      </div>

      <p className="mb-3 text-xs text-amber-700 dark:text-amber-300">
        Ative a Stripe para ter esses benefícios.
      </p>

      {isPremiumPlan ? (
        <a
          href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent("Olá, preciso de ajuda para ativar a Stripe na minha conta.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
        >
          <Phone className="h-3.5 w-3.5" />
          Falar com suporte
        </a>
      ) : (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-support-chat"))}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 underline underline-offset-2 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Quero ativar a Stripe
        </button>
      )}
    </div>
  );
}
