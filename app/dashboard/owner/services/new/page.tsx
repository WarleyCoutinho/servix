"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { createService } from "@/actions/services/create-service";
import {
  ServiceForm,
  handleServiceValidationErrors,
  type ServiceFormRef,
  type ServiceFormData,
} from "@/components/service-form";

export default function NewServicePage() {
  const router = useRouter();
  const formRef = useRef<ServiceFormRef>(null);

  const { execute, isPending } = useAction(createService, {
    onSuccess: () => {
      toast.success("Serviço criado com sucesso!");
      router.push("/dashboard/owner/services");
    },
    onError: ({ error }) => {
      if (error.validationErrors) {
        handleServiceValidationErrors(formRef, error.validationErrors);
      } else {
        toast.error(error.serverError || "Erro ao criar serviço");
      }
    },
  });

  function handleSubmit(data: ServiceFormData) {
    execute(data);
  }

  return (
    <ServiceForm
      ref={formRef}
      mode="create"
      onSubmit={handleSubmit}
      isPending={isPending}
    />
  );
}
