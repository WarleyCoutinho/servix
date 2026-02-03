"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { createProfessional } from "@/actions/professionals/create-professional";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    bio: "",
    acceptsPix: false,
    acceptsCard: true,
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
          <CardTitle>Dados do Profissional</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome de Exibição</Label>
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
                O profissional receberá um convite neste email para criar sua
                conta.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Biografia (opcional)</Label>
              <Textarea
                id="bio"
                placeholder="Uma breve descrição do profissional..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label>Formas de Pagamento Aceitas</Label>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Cartão de Crédito</p>
                  <p className="text-sm text-muted-foreground">
                    Aceitar pagamentos via cartão
                  </p>
                </div>
                <Switch
                  checked={formData.acceptsCard}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, acceptsCard: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">PIX</p>
                  <p className="text-sm text-muted-foreground">
                    Aceitar pagamentos via PIX
                  </p>
                </div>
                <Switch
                  checked={formData.acceptsPix}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, acceptsPix: checked })
                  }
                />
              </div>
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
