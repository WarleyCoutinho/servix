"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { updateService } from "@/actions/services/update-service";
import { deleteService } from "@/actions/services/delete-service";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import {
  ServiceForm,
  handleServiceValidationErrors,
  type ServiceFormRef,
  type ServiceFormData,
  type ServiceFormValues,
} from "@/components/service-form";

interface Service {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  durationMinutes: number;
  imageUrl: string | null;
}

export default function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const formRef = useRef<ServiceFormRef>(null);
  const [serviceId, setServiceId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState<ServiceFormValues | null>(null);

  useEffect(() => {
    async function loadService() {
      const resolvedParams = await params;
      setServiceId(resolvedParams.id);

      try {
        const response = await fetch(`/api/services/${resolvedParams.id}`);
        if (!response.ok) {
          toast.error("Serviço não encontrado");
          router.push("/dashboard/owner/services");
          return;
        }
        const data: Service = await response.json();
        setInitialValues({
          name: data.name,
          description: data.description,
          price: (data.priceInCents / 100).toFixed(2).replace(".", ","),
          durationMinutes: data.durationMinutes.toString(),
          imageUrl: data.imageUrl || "",
        });
      } catch {
        toast.error("Erro ao carregar serviço");
        router.push("/dashboard/owner/services");
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, [params, router]);

  const { execute: executeUpdate, isPending: isUpdating } = useAction(updateService, {
    onSuccess: () => {
      toast.success("Serviço atualizado com sucesso!");
      router.push("/dashboard/owner/services");
    },
    onError: ({ error }) => {
      if (error.validationErrors) {
        handleServiceValidationErrors(formRef, error.validationErrors);
      } else {
        toast.error(error.serverError || "Erro ao atualizar serviço");
      }
    },
  });

  const { execute: executeDelete, isPending: isDeleting } = useAction(deleteService, {
    onSuccess: () => {
      toast.success("Serviço excluído com sucesso!");
      router.push("/dashboard/owner/services");
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao excluir serviço");
    },
  });

  function handleSubmit(data: ServiceFormData) {
    executeUpdate({ id: serviceId, ...data });
  }

  function handleDelete() {
    executeDelete({ id: serviceId });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    );
  }

  if (!initialValues) {
    return null;
  }

  return (
    <ServiceForm
      ref={formRef}
      mode="edit"
      defaultValues={initialValues}
      onSubmit={handleSubmit}
      isPending={isUpdating}
      headerActions={
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 size-4" />
              Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O serviço será removido
                permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      }
    />
  );
}
