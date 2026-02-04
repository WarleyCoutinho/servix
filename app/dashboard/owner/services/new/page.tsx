"use client";

import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createService } from "@/actions/services/create-service";
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

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  price: z.string().min(1, "Preço é obrigatório"),
  durationMinutes: z.string().min(1, "Duração é obrigatória"),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewServicePage() {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      durationMinutes: "30",
      imageUrl: "",
    },
  });

  const { execute, isPending } = useAction(createService, {
    onSuccess: () => {
      toast.success("Serviço criado com sucesso!");
      router.push("/dashboard/owner/services");
    },
    onError: ({ error }) => {
      if (error.validationErrors) {
        Object.entries(error.validationErrors).forEach(([field, errors]) => {
          if (errors && "_errors" in errors) {
            form.setError(field as keyof FormValues, {
              message: (errors._errors as string[])[0],
            });
          }
        });
      } else {
        toast.error(error.serverError || "Erro ao criar serviço");
      }
    },
  });

  const onSubmit = (data: FormValues) => {
    const priceInCents = Math.round(
      parseFloat(data.price.replace(",", ".")) * 100
    );

    execute({
      name: data.name,
      description: data.description,
      priceInCents,
      durationMinutes: parseInt(data.durationMinutes),
      imageUrl: data.imageUrl || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/owner/services">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Serviço</h1>
          <p className="text-muted-foreground">
            Adicione um novo serviço à sua barbearia
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Serviço</CardTitle>
          <CardDescription>
            Preencha os dados do serviço que deseja oferecer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <Input
                          type="text"
                          placeholder="45,00"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Valor em reais (ex: 45,00)
                      </FormDescription>
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
                        <Input
                          type="number"
                          min={5}
                          max={480}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Tempo estimado do serviço
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://exemplo.com/imagem.jpg"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      URL de uma imagem para representar o serviço
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Criar Serviço
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/owner/services">Cancelar</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
