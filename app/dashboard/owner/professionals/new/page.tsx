"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { createProfessional } from "@/actions/professionals/create-professional";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function NewProfessionalPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    cpf: "",
    displayName: "",
    email: "",
  });

  const { execute, isPending } = useAction(createProfessional, {
    onSuccess: () => {
      toast.success("Profissional adicionado com sucesso!");
      router.push("/dashboard/owner/professionals");
    },
    onError: ({ error }) => {
      let errorMessage = "Erro ao adicionar profissional";
      if (error.serverError) {
        errorMessage = error.serverError;
      } else if (error.validationErrors) {
        const firstFieldError = Object.values(error.validationErrors).find(
          (v) => v && typeof v === "object" && "_errors" in v,
        ) as { _errors?: string[] } | undefined;
        if (firstFieldError?._errors?.[0]) {
          errorMessage = firstFieldError._errors[0];
        }
      }
      toast.error(errorMessage);
    },
  });

  function formatCPF(value: string) {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    execute({
      ...formData,
      cpf: formData.cpf.replace(/\D/g, ""),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/owner/professionals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Adicionar Profissional</h1>
          <p className="text-muted-foreground">
            Cadastre um novo profissional na sua barbearia
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dados Básicos do Profissional</CardTitle>
          <CardDescription>
            Preencha apenas os dados básicos. O profissional completará seu
            cadastro (biografia, foto e dados bancários) após fazer login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome</Label>
                <Input
                  id="displayName"
                  placeholder="Nome do profissional"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf: formatCPF(e.target.value) })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                O profissional usará este email para fazer login e completar
                seu cadastro.
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar Profissional
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/owner/professionals">Cancelar</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
