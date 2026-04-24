"use client";

import { STORE_CONTEXT_COOKIE } from "@/proxy";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Hook para sair do contexto isolado de uma loja.
 * Deleta o cookie via API (server-side) antes de navegar,
 * garantindo que o middleware não redirecione de volta para /b/[slug].
 *
 * Uso:
 *   const { exitStore } = useStoreContext();
 *   <button onClick={() => exitStore()}>Ver todas as lojas</button>
 */
export function useStoreContext() {
  const router = useRouter();

  const exitStore = useCallback(
    async (redirectTo = "/") => {
      // Deleta o cookie server-side antes de navegar.
      // Se a chamada falhar, limpa também client-side como fallback.
      try {
        await fetch("/api/store/exit", { method: "POST" });
      } catch {
        document.cookie = `${STORE_CONTEXT_COOKIE}=; path=/; max-age=0; samesite=lax`;
      }
      router.push(redirectTo);
    },
    [router],
  );

  return { exitStore };
}
