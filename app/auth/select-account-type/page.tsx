"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Building2, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACCOUNT_TYPES = [
  {
    id: "client",
    title: "Cliente",
    description: "Quero agendar serviços em barbearias e salões",
    icon: User,
    href: "/",
  },
  {
    id: "owner",
    title: "Proprietário",
    description: "Quero cadastrar e gerenciar minha barbearia ou salão",
    icon: Building2,
    href: "/onboarding/owner",
  },
] as const;

type AccountType = (typeof ACCOUNT_TYPES)[number]["id"];

const ROLES_QUE_REDIRECIONAM = ["admin", "owner", "professional"] as const;

export default function SelectAccountTypePage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);

  useEffect(() => {
    if (isSessionLoading) return;
    if (!session?.user) { router.replace("/"); return; }
    if (session.user.role === "admin") { router.replace("/dashboard/admin"); return; }
    if (session.user.role === "owner") { router.replace("/dashboard/owner"); return; }
    if (session.user.role === "professional") { router.replace("/dashboard/professional"); return; }
  }, [session, isSessionLoading, router]);

  // Estado derivado — sem setState necessário
  const roleVaiRedirecionar = ROLES_QUE_REDIRECIONAM.includes(
    session?.user?.role as (typeof ROLES_QUE_REDIRECIONAM)[number]
  );
  const isChecking = isSessionLoading || !session?.user || roleVaiRedirecionar;

  const handleContinue = () => {
    if (!selectedType) return;
    const selected = ACCOUNT_TYPES.find((t) => t.id === selectedType);
    if (selected) router.push(selected.href);
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo ao Servix!</CardTitle>
          <CardDescription>
            Como você deseja usar a plataforma?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            {ACCOUNT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;

              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={cn(
                    "flex items-start gap-4 rounded-lg border p-4 text-left transition-all",
                    "hover:border-primary/50 hover:bg-accent/50",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSelected && "border-primary bg-accent"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-full",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <Icon className="size-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{type.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "mt-1 size-5 shrink-0 rounded-full border-2 transition-colors",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {isSelected && (
                      <div className="flex size-full items-center justify-center">
                        <div className="size-2 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleContinue}
            disabled={!selectedType}
            className="w-full"
            size="lg"
          >
            Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
