"use client";

import { setOwnerRole } from "@/actions/user/set-owner-role";
import { ImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  barbershopName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  description: z
    .string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres"),
  phone: z
    .string()
    .min(10, "Telefone inválido")
    .transform((val) => val.replace(/\D/g, "")),
  imageUrl: z.string().optional().or(z.literal("")),
  ownerCpf: z.string().min(11, "CPF deve conter 11 dígitos"),
});

type FormData = z.infer<typeof formSchema>;

export default function OwnerOnboardingPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } =
    authClient.useSession();
  const [isChecking, setIsChecking] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      barbershopName: "",
      address: "",
      description: "",
      phone: "",
      imageUrl: "",
      ownerCpf: "",
    },
  });

  const { execute, isPending } = useAction(setOwnerRole, {
    onSuccess: () => {
      toast.success("Barbearia criada com sucesso!");
      router.push("/dashboard/owner");
    },
    onError: ({ error }) => {
      const errorMessage =
        error.serverError ??
        error.validationErrors?._errors?.[0] ??
        "Erro ao criar barbearia";
      toast.error(errorMessage);
    },
  });

  useEffect(() => {
    if (isSessionLoading) return;

    if (!session?.user) {
      router.replace("/");
      return;
    }

    const checkOwnerStatus = async () => {
      try {
        const response = await fetch("/api/user/profile");
        const profile = await response.json();

        if (profile.role === "owner" && profile.hasOwnedBarbershop) {
          router.replace("/dashboard/owner");
          return;
        }

        if (profile.role === "professional") {
          toast.error("Profissionais não podem se tornar proprietários.");
          router.replace("/");
          return;
        }

        setIsChecking(false);
      } catch {
        router.replace("/");
      }
    };

    checkOwnerStatus();
  }, [session, isSessionLoading, router]);

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const onSubmit = (data: FormData) => {
    execute({
      ...data,
      imageUrl: imageUrl || undefined,
    });
  };

  if (isSessionLoading || isChecking) {
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
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="size-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Configure seu negócio</CardTitle>
          <CardDescription>
            Preencha as informações básicas para começar a usar a plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="barbershopName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Negócio</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Negocio do Fulano" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Rua das Flores, 123 - Centro"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormDescription>
                      Telefone para contato dos clientes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerCpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seu CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormDescription>
                      Necessário para seu cadastro como profissional
                    </FormDescription>
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
                        placeholder="Descreva seu negócio, serviços oferecidos, diferenciais..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={() => (
                  <FormItem>
                    <FormLabel>Imagem do Negócio (opcional)</FormLabel>
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

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Negócio"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
