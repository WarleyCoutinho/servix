"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthErrorAlert() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const errorCode = searchParams.get("auth_error");
  const errorTitle = searchParams.get("auth_error_title");
  const errorMessage = searchParams.get("auth_error_message");

  const handleDismiss = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("auth_error");
    url.searchParams.delete("auth_error_title");
    url.searchParams.delete("auth_error_message");
    router.replace(url.pathname + url.search);
  };

  if (!errorCode) {
    return null;
  }

  return (
    <Alert variant="destructive" className="relative mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{errorTitle || "Erro de autenticação"}</AlertTitle>
      <AlertDescription>
        {errorMessage || "Ocorreu um erro durante o login. Tente novamente."}
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}
