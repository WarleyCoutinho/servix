"use client";

import { STORE_CONTEXT_COOKIE } from "@/proxy";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/**
 * Hook para sair do contexto isolado de uma loja.
 * Limpa o cookie antes de navegar para que "/" volte a mostrar a home global.
 *
 * Uso:
 *   const { exitStore } = useStoreContext();
 *   <button onClick={() => exitStore()}>Ver todas as lojas</button>
 */
export function useStoreContext() {
  const router = useRouter();

  const exitStore = useCallback(
    (redirectTo = "/") => {
      document.cookie = `${STORE_CONTEXT_COOKIE}=; path=/; max-age=0; samesite=lax`;
      router.push(redirectTo);
    },
    [router],
  );

  return { exitStore };
}
