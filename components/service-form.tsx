"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { ImageUpload } from "./image-upload";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  price: z.string().min(1, "Preço é obrigatório"),
  durationMinutes: z.string().min(1, "Duração é obrigatória"),
  imageUrl: z.string().optional().or(z.literal("")),
});

export type ServiceFormValues = z.infer<typeof formSchema>;

export interface ServiceFormData {
  name: string;
  description: string;
  priceInCents: number;
  durationMinutes: number;
  imageUrl?: string;
}

export interface ServiceFormRef {
  setFieldError: (field: keyof ServiceFormValues, message: string) => void;
  reset: (values: ServiceFormValues) => void;
}

interface ServiceFormProps {
  mode: "create" | "edit";
  defaultValues?: ServiceFormValues;
  onSubmit: (data: ServiceFormData) => void;
  isPending: boolean;
  backUrl?: string;
  headerActions?: React.ReactNode;
}

export const ServiceForm = forwardRef<ServiceFormRef, ServiceFormProps>(
  function ServiceForm(
    {
      mode,
      defaultValues,
      onSubmit,
      isPending,
      backUrl = "/dashboard/owner/services",
      headerActions,
    },
    ref
  ) {
    const form = useForm<ServiceFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: defaultValues ?? {
        name: "",
        description: "",
        price: "",
        durationMinutes: "30",
        imageUrl: "",
      },
    });

    const [imageUrl, setImageUrl] = useState<string | null>(
      defaultValues?.imageUrl || null,
    );

    useImperativeHandle(ref, () => ({
      setFieldError: (field: keyof ServiceFormValues, message: string) => {
        form.setError(field, { message });
      },
      reset: (values: ServiceFormValues) => {
        form.reset(values);
        setImageUrl(values.imageUrl || null);
      },
    }));

    const handleSubmit = (data: ServiceFormValues) => {
      const priceInCents = Math.round(
        parseFloat(data.price.replace(",", ".")) * 100
      );

      onSubmit({
        name: data.name,
        description: data.description,
        priceInCents,
        durationMinutes: parseInt(data.durationMinutes),
        imageUrl: data.imageUrl || undefined,
      });
    };

    const isEditMode = mode === "edit";
    const title = isEditMode ? "Editar Serviço" : "Novo Serviço";
    const subtitle = isEditMode
      ? "Atualize as informações do serviço"
      : "Adicione um novo serviço à sua barbearia";
    const cardTitle = "Informações do Serviço";
    const cardSubtitle = isEditMode
      ? "Atualize os dados do serviço"
      : "Preencha os dados do serviço que deseja oferecer";
    const submitLabel = isEditMode ? "Salvar Alterações" : "Criar Serviço";

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={backUrl}>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          {headerActions}
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{cardTitle}</CardTitle>
            <CardDescription>{cardSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Serviço</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Corte Masculino" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o serviço..."
                          className="min-h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço (R$)</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="45,00" {...field} />
                        </FormControl>
                        <FormDescription>Valor em reais (ex: 45,00)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="durationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duração (minutos)</FormLabel>
                        <FormControl>
                          <Input type="number" min={5} max={480} {...field} />
                        </FormControl>
                        <FormDescription>Tempo estimado do serviço</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={() => (
                    <FormItem>
                      <FormLabel>Imagem do Serviço (opcional)</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={imageUrl}
                          onChange={(url) => {
                            form.setValue("imageUrl", url);
                            setImageUrl(url);
                          }}
                          onRemove={() => {
                            form.setValue("imageUrl", "");
                            setImageUrl(null);
                          }}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    {submitLabel}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href={backUrl}>Cancelar</Link>
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    );
  }
);

export function handleServiceValidationErrors(
  formRef: React.RefObject<ServiceFormRef | null>,
  validationErrors: Record<string, unknown>
) {
  Object.entries(validationErrors).forEach(([field, errors]) => {
    if (errors && typeof errors === "object" && "_errors" in errors) {
      formRef.current?.setFieldError(
        field as keyof ServiceFormValues,
        ((errors as { _errors: string[] })._errors)[0]
      );
    }
  });
}
