"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function StripeRefreshPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/onboarding/professional");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold">
          Link expirado
        </h1>
        <p className="text-muted-foreground">
          O link de configuração expirou. Redirecionando para gerar um novo
          link...
        </p>
      </div>
    </div>
  );
}
