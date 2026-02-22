"use client";

import { createBarbershop } from "@/actions/barbershops/create-barbershop";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];
import { ImageUpload } from "@/components/image-upload";
import { Loader2, Store } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

interface NewEstablishmentFormProps {
  showCpfField: boolean;
}

export function NewEstablishmentForm({ showCpfField }: NewEstablishmentFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    description: "",
    phone: "",
    cpf: "",
    imageUrl: "",
  });

  const { execute, isPending } = useAction(createBarbershop, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        toast.success(data.message);
        router.push("/dashboard/owner/establishments");
        router.refresh();
      }
    },
    onError: ({ error }) => {
      toast.error(error.serverError ?? "Erro ao criar estabelecimento");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { cpf, imageUrl, ...rest } = formData;
    execute({
      ...rest,
      ...(imageUrl ? { imageUrl } : {}),
      ...(showCpfField ? { cpf } : {}),
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Store className="text-primary h-5 w-5" />
          </div>
          <div>
            <CardTitle>Informações do Estabelecimento</CardTitle>
            <CardDescription>
              Preencha os dados da nova loja
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Loja *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Ex: Barbearia Central - Unidade Centro"
              value={formData.name}
              onChange={handleChange}
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço *</Label>
            <Input
              id="address"
              name="address"
              placeholder="Ex: Rua das Flores, 123 - Centro"
              value={formData.address}
              onChange={handleChange}
              required
              minLength={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                name="city"
                placeholder="Ex: Anápolis"
                value={formData.city}
                onChange={handleChange}
                required
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, state: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {BRAZILIAN_STATES.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="Ex: (11) 99999-9999"
              value={formData.phone}
              onChange={handleChange}
              required
              minLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Descreva a loja (opcional)"
              value={formData.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Imagem da Loja (opcional)</Label>
            <ImageUpload
              value={formData.imageUrl || null}
              onChange={(url) =>
                setFormData((prev) => ({ ...prev, imageUrl: url }))
              }
              onRemove={() =>
                setFormData((prev) => ({ ...prev, imageUrl: "" }))
              }
              disabled={isPending}
              folder="barbershop"
            />
          </div>

          {showCpfField && (
            <div className="space-y-2">
              <Label htmlFor="cpf">Seu CPF *</Label>
              <Input
                id="cpf"
                name="cpf"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cpf: formatCPF(e.target.value),
                  }))
                }
                required
                maxLength={14}
              />
              <p className="text-muted-foreground text-xs">
                Você será registrado como profissional do estabelecimento
                automaticamente.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Store className="mr-2 h-4 w-4" />
                  Criar Estabelecimento
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
