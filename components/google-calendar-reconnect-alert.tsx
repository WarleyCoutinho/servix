"use client";

import { CalendarClock, ExternalLink } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export function GoogleCalendarReconnectAlert() {
  const [isLoading, setIsLoading] = useState(false);

  const handleReconnect = async () => {
    setIsLoading(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: window.location.pathname,
      scopes: [
        "openid",
        "email",
        "profile",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
    });
  };

  return (
    <div className="w-full border-b border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/40">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:gap-4">
        <CalendarClock className="size-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
        <p className="flex-1 text-sm text-yellow-900 dark:text-yellow-200">
          Autorize o Google Calendar para sincronizar seus agendamentos
          automaticamente
        </p>
        <button
          onClick={handleReconnect}
          disabled={isLoading}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-yellow-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-yellow-700 disabled:opacity-60 dark:bg-yellow-500 dark:text-yellow-950 dark:hover:bg-yellow-400"
        >
          {isLoading ? (
            <>
              <span className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-yellow-950" />
              Conectando...
            </>
          ) : (
            <>
              <ExternalLink className="size-3" />
              Autorizar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
