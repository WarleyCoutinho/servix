"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function isConnectionError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes("etimedout") ||
    message.includes("econnrefused") ||
    message.includes("timeout") ||
    message.includes("connection") ||
    message.includes("fetch failed") ||
    message.includes("network")
  );
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const isConnection = isConnectionError(error);

  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">
            {isConnection ? "Problema de Conexão" : "Algo deu errado"}
          </CardTitle>
          <CardDescription>
            {isConnection
              ? "O servidor está demorando para responder. Isso pode acontecer quando o banco de dados está em modo de hibernação."
              : "Ocorreu um erro inesperado. Nossa equipe foi notificada."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            {isConnection ? (
              <p>
                Por favor, aguarde alguns segundos e tente novamente. Se o
                problema persistir, verifique sua conexão com a internet.
              </p>
            ) : (
              <p>
                Se o problema continuar, entre em contato com o suporte
                informando o código de erro.
              </p>
            )}
            {error.digest && (
              <p className="mt-2 font-mono text-xs">
                Código: {error.digest}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <a href="/">
              <Home className="mr-2 h-4 w-4" />
              Início
            </a>
          </Button>
          <Button className="flex-1" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
