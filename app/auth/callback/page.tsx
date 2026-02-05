"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (isPending || isChecking) return;

    if (!session?.user) {
      router.replace("/");
      return;
    }

    const checkAndRedirect = async () => {
      setIsChecking(true);

      try {
        const role = session.user.role;

        if (role === "owner") {
          router.replace("/dashboard/owner");
          return;
        }

        if (role === "professional") {
          router.replace("/dashboard/professional");
          return;
        }

        const hasSelectedType = localStorage.getItem("accountTypeSelected");
        if (hasSelectedType === "true") {
          router.replace("/");
          return;
        }

        const response = await fetch("/api/user/check-new");
        const data = await response.json();

        if (data.isNewUser) {
          router.replace("/auth/select-account-type");
        } else {
          localStorage.setItem("accountTypeSelected", "true");
          router.replace("/");
        }
      } catch {
        router.replace("/");
      }
    };

    checkAndRedirect();
  }, [session, isPending, isChecking, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Preparando sua conta...</p>
      </div>
    </div>
  );
}
