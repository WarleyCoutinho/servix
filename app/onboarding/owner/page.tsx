"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { setOwnerRole } from "@/actions/user/set-owner-role";
import { authClient } from "@/lib/auth-client";
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
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  barbershopName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
  phone: z
    .string()
    .min(10, "Telefone inválido")
    .transform((val) => val.replace(/\D/g, "")),
});

type FormData = z.infer<typeof formSchema>;

export default function OwnerOnboardingPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  const [isChecking, setIsChecking] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      barbershopName: "",
      address: "",
      description: "",
      phone: "",
    },
  });

  const { execute, isPending } = useAction(setOwnerRole, {
    onSuccess: () => {
      localStorage.removeItem("pendingAccountType");
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

    const pendingAccountType = localStorage.getItem("pendingAccountType");

    if (session.user.role === "owner") {
      localStorage.removeItem("pendingAccountType");
      router.replace("/dashboard/owner");
      return;
    }

    if (session.user.role === "professional") {
      localStorage.removeItem("pendingAccountType");
      toast.error("Profissionais não podem se tornar proprietários.");
      router.replace("/");
      return;
    }

    if (pendingAccountType !== "owner") {
      router.replace("/");
      return;
    }

    setIsChecking(false);
  }, [session, isSessionLoading, router]);

  const onSubmit = (data: FormData) => {
    execute(data);
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
          <CardTitle className="text-2xl">Configure sua barbearia</CardTitle>
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
                    <FormLabel>Nome da Barbearia</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Barbearia do João" {...field} />
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
                      <Input
                        placeholder="(11) 99999-9999"
                        {...field}
                      />
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva sua barbearia, serviços oferecidos, diferenciais..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Barbearia"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
