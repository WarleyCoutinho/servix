"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Loader2, Scissors, Calendar, Star } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import logoDark from "@/public/servix_logo_horizontal.svg";
import logoLight from "@/public/servix_logo_light.svg";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const features = [
  { icon: Scissors, label: "Profissionais verificados" },
  { icon: Calendar, label: "Agendamento em segundos" },
  { icon: Star, label: "Avaliações reais" },
];

const LoginModal = ({ open, onOpenChange }: LoginModalProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/auth/callback",
      });
      if (error) toast.error(error.message);
    } catch {
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">Entrar no Servix</DialogTitle>
        <div className="flex flex-col sm:flex-row">
          {/* Lado esquerdo — destaque verde */}
          <div className="relative hidden sm:flex sm:w-2/5 flex-col justify-between bg-primary p-8 overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #000 0px, #000 1px, transparent 1px, transparent 12px)",
              }}
            />
            <div className="relative z-10 flex flex-col gap-8 h-full justify-center">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70">
                  Plataforma
                </p>
                <h2 className="text-2xl font-black leading-tight text-primary-foreground">
                  Gestão profissional para negócios de beleza
                </h2>
              </div>

              <ul className="space-y-4">
                {features.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
                      <Icon className="size-4 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-medium text-primary-foreground/90">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Lado direito — form */}
          <div className="flex flex-1 flex-col items-center justify-center gap-8 px-8 py-10">
            <div className="w-full flex justify-center">
              <Image
                src={logoLight}
                alt="Servix"
                width={180}
                height={48}
                priority
                className="block dark:hidden"
              />
              <Image
                src={logoDark}
                alt="Servix"
                width={180}
                height={48}
                priority
                className="hidden dark:block"
              />
            </div>

            <div className="w-full space-y-2 text-center">
              <h3 className="text-lg font-semibold tracking-tight">
                Acesse sua conta
              </h3>
              <p className="text-sm text-muted-foreground">
                Entre com sua conta Google para continuar
              </p>
            </div>

            <div className="w-full space-y-3">
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 size-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar com Google
                  </>
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">
                    acesso seguro
                  </span>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground leading-relaxed">
                Ao continuar, você concorda com os{" "}
                <span className="underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">
                  Termos de Serviço
                </span>{" "}
                e{" "}
                <span className="underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">
                  Política de Privacidade
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
