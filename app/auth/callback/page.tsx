"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

interface UserProfile {
  role: string;
  hasOwnedBarbershop: boolean;
  hasProfessionalProfile: boolean;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isProcessing) return;

    const checkAndRedirect = async () => {
      setIsProcessing(true);

      try {
        const { data: sessionData } = await authClient.getSession();

        if (!sessionData?.user) {
          router.replace("/");
          return;
        }

        const profileResponse = await fetch("/api/user/profile");
        const profile: UserProfile = await profileResponse.json();

        if (profile.role === "admin") {
          router.replace("/dashboard/admin");
          return;
        }

        if (profile.role === "owner" && profile.hasOwnedBarbershop) {
          router.replace("/dashboard/owner");
          return;
        }

        if (profile.role === "professional" && profile.hasProfessionalProfile) {
          router.replace("/dashboard/professional");
          return;
        }

        if (profile.role === "owner" && !profile.hasOwnedBarbershop) {
          router.replace("/onboarding/owner");
          return;
        }

        if (profile.role === "professional" && !profile.hasProfessionalProfile) {
          router.replace("/onboarding/professional");
          return;
        }

        const response = await fetch("/api/user/check-new");
        const data = await response.json();

        if (data.isNewUser) {
          router.replace("/auth/select-account-type");
        } else {
          router.replace("/");
        }
      } catch {
        router.replace("/");
      }
    };

    checkAndRedirect();
  }, [isProcessing, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Preparando sua conta...</p>
      </div>
    </div>
  );
}
