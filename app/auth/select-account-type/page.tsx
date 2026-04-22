"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

const ACCOUNT_TYPES = [
  {
    id: "client",
    title: "Cliente",
    description: "Encontre e agende serviços profissionais na sua região.",
    href: "/",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    id: "owner",
    title: "Proprietário",
    description:
      "Cadastre seu estabelecimento e gerencie agendamentos e equipe.",
    href: "/onboarding/owner",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
  },
] as const;

type AccountType = (typeof ACCOUNT_TYPES)[number]["id"];

export default function SelectAccountTypePage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);

  // ✅ Fix: derivar estado de loading sem setState síncrono no useEffect
  const redirectRole = useMemo(() => {
    if (isSessionLoading || !session?.user) return null;
    const role = session.user.role;
    if (role === "admin") return "/dashboard/admin";
    if (role === "owner") return "/dashboard/owner";
    if (role === "professional") return "/dashboard/professional";
    return null;
  }, [isSessionLoading, session]);

  useEffect(() => {
    if (isSessionLoading) return;
    if (!session?.user) {
      router.replace("/");
      return;
    }
    if (redirectRole) {
      router.replace(redirectRole);
    }
  }, [isSessionLoading, session, redirectRole, router]);

  const handleContinue = () => {
    if (!selectedType) return;
    const selected = ACCOUNT_TYPES.find((t) => t.id === selectedType);
    if (selected) router.push(selected.href);
  };

  const isLoading = isSessionLoading || (!!session?.user && !!redirectRole);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-8"
      style={{
        background: "var(--background)",
        fontFamily: "'Barlow', sans-serif",
      }}
    >
      {/* Decorative circles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 size-80 rounded-full bg-muted opacity-50" />
        <div className="absolute -bottom-16 -left-16 size-60 rounded-full bg-muted opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-120 rounded-2xl border bg-card p-10 shadow-sm">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-foreground">
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span
            className="text-xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Servix
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-8 flex gap-1">
          <div className="h-0.75 flex-1 rounded-full bg-primary" />
          <div className="h-0.75 flex-1 rounded-full bg-border" />
          <div className="h-0.75 flex-1 rounded-full bg-border" />
        </div>

        {/* Heading */}
        <div className="mb-7">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Passo 1 de 3 — Configuração da conta
          </p>
          <h1
            className="text-[26px] font-semibold leading-tight tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Como você vai{" "}
            <span className="italic font-light text-muted-foreground">
              usar o Servix?
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione o perfil que melhor descreve sua necessidade.
          </p>
        </div>

        {/* Options */}
        <div className="mb-6 flex flex-col gap-3">
          {ACCOUNT_TYPES.map((type) => {
            const isSelected = selectedType === type.id;

            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type.id)}
                className={[
                  "flex w-full items-center gap-4 rounded-xl border p-4.5 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "border-primary bg-card"
                    : "border-border bg-card hover:border-border/60 hover:bg-muted/50",
                ].join(" ")}
              >
                {/* Icon */}
                <div
                  className={[
                    "flex size-11 shrink-0 items-center justify-center rounded-[10px] border transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  {type.icon}
                </div>

                {/* Text */}
                <div className="flex-1">
                  <p className="text-[15px] font-medium text-foreground">
                    {type.title}
                  </p>
                  <p className="text-[13px] leading-snug text-muted-foreground">
                    {type.description}
                  </p>
                </div>

                {/* Radio */}
                <div
                  className={[
                    "flex size-4.5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors",
                    isSelected ? "border-primary" : "border-border",
                  ].join(" ")}
                >
                  {isSelected && (
                    <div className="size-2 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={!selectedType}
          className={[
            "btn-lime w-full rounded-lg py-3.5 text-[15px] tracking-tight transition-opacity",
            !selectedType
              ? "cursor-not-allowed opacity-30"
              : "hover:opacity-85",
          ].join(" ")}
        >
          Continuar
        </button>

        {/* Footer */}
        {/* Footer */}
        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
          Ao continuar, você concorda com os{" "}
          <a
            href="#"
            className="text-foreground/60 underline-offset-2 hover:underline"
          >
            Termos de Uso
          </a>{" "}
          e a{" "}
          <a
            href="#"
            className="text-foreground/60 underline-offset-2 hover:underline"
          >
            Política de Privacidade
          </a>{" "}
          do Servix.
        </p>
      </div>
    </div>
  );
}
