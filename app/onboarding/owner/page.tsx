"use client";

import { setOwnerRole } from "@/actions/user/set-owner-role";
import { ImageUpload } from "@/components/image-upload";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth-client";
import { formatCPF, formatPhone } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const formSchema = z.object({
  barbershopName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
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
  // ✅ Fix: iniciar como false quando session ainda está carregando,
  // sem precisar de setState síncrono dentro do efeito
  const [isChecking, setIsChecking] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      barbershopName: "",
      address: "",
      city: "",
      state: "",
      description: "",
      phone: "",
      imageUrl: "",
      ownerCpf: "",
    },
  });

  const { execute, isPending } = useAction(setOwnerRole, {
    onSuccess: () => {
      toast.success("Negócio criado com sucesso!");
      router.push("/dashboard/owner");
    },
    onError: ({ error }) => {
      const errorMessage =
        error.serverError ??
        error.validationErrors?._errors?.[0] ??
        "Erro ao criar negócio";
      toast.error(errorMessage);
    },
  });

  useEffect(() => {
    if (isSessionLoading) return;

    if (!session?.user) {
      router.replace("/");
      return;
    }

    setIsChecking(true);

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
      } catch {
        router.replace("/");
      } finally {
        // ✅ setState dentro de callback assíncrono — sem cascata síncrona
        setIsChecking(false);
      }
    };

    checkOwnerStatus();
  }, [session, isSessionLoading, router]);

  const onSubmit = (data: FormData) => {
    execute({ ...data, imageUrl: imageUrl || undefined });
  };

  if (isSessionLoading || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-8"
      style={{ fontFamily: "'Barlow', sans-serif" }}
    >
      {/* Decorative circles */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 size-80 rounded-full bg-muted opacity-50" />
        <div className="absolute -bottom-16 -left-16 size-60 rounded-full bg-muted opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-130 rounded-2xl border bg-card p-10 shadow-sm">
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
          <div className="h-0.75 flex-1 rounded-full bg-primary" />
          <div className="h-0.75 flex-1 rounded-full bg-border" />
        </div>

        {/* Heading */}
        <div className="mb-8">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Passo 2 de 3 — Dados do estabelecimento
          </p>
          <h1
            className="text-[26px] font-semibold leading-tight tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Configure{" "}
            <span className="italic font-light text-muted-foreground">
              seu negócio
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Preencha as informações básicas para começar a usar a plataforma.
          </p>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="barbershopName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-foreground">
                    Nome do negócio
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Barbearia do João"
                      className="h-10 rounded-lg border-border bg-background text-[14px] placeholder:text-muted-foreground/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-foreground">
                    Endereço
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Rua das Flores, 123 - Centro"
                      className="h-10 rounded-lg border-border bg-background text-[14px] placeholder:text-muted-foreground/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-foreground">
                      Cidade
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: São Paulo"
                        className="h-10 rounded-lg border-border bg-background text-[14px] placeholder:text-muted-foreground/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-foreground">
                      Estado
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-lg border-border bg-background text-[14px]">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BRAZILIAN_STATES.map((uf) => (
                          <SelectItem
                            key={uf}
                            value={uf}
                            className="text-[14px]"
                          >
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[12px]" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-foreground">
                    Telefone
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(11) 99999-9999"
                      className="h-10 rounded-lg border-border bg-background text-[14px] placeholder:text-muted-foreground/50"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(formatPhone(e.target.value))
                      }
                      maxLength={15}
                    />
                  </FormControl>
                  <FormDescription className="text-[12px] text-muted-foreground">
                    Telefone para contato dos clientes
                  </FormDescription>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerCpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-foreground">
                    Seu CPF
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="000.000.000-00"
                      className="h-10 rounded-lg border-border bg-background text-[14px] placeholder:text-muted-foreground/50"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(formatCPF(e.target.value))
                      }
                      maxLength={14}
                    />
                  </FormControl>
                  <FormDescription className="text-[12px] text-muted-foreground">
                    Necessário para seu cadastro como proprietário
                  </FormDescription>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-foreground">
                    Descrição
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva seu negócio, serviços oferecidos, diferenciais..."
                      rows={4}
                      className="rounded-lg border-border bg-background text-[14px] placeholder:text-muted-foreground/50 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={() => (
                <FormItem>
                  <FormLabel className="text-[13px] font-medium text-foreground">
                    Imagem do negócio{" "}
                    <span className="font-normal text-muted-foreground">
                      (opcional)
                    </span>
                  </FormLabel>
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
                      folder="barbershop"
                    />
                  </FormControl>
                  <FormMessage className="text-[12px]" />
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={isPending}
              className={[
                "btn-lime w-full rounded-lg py-3.5 text-[15px] tracking-tight transition-opacity",
                isPending
                  ? "cursor-not-allowed opacity-50"
                  : "hover:opacity-85",
              ].join(" ")}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Criar...
                </span>
              ) : (
                "Criar negócio"
              )}
            </button>
          </form>
        </Form>

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
