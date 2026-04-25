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
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  DatabaseZap,
  WifiOff,
} from "lucide-react";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

type ConnectionErrorType = "no_internet" | "database" | "timeout" | "unknown";

function getConnectionErrorType(error: Error): ConnectionErrorType {
  const message = error.message.toLowerCase();

  if (
    message.includes("eai_again") ||
    message.includes("eai_nodata") ||
    message.includes("enotfound") ||
    message.includes("getaddrinfo") ||
    message.includes("dns")
  ) {
    return "no_internet";
  }

  if (
    message.includes("econnrefused") ||
    message.includes("connection refused") ||
    message.includes("econnreset") ||
    message.includes("socket hang up")
  ) {
    return "database";
  }

  if (
    message.includes("etimedout") ||
    message.includes("timeout") ||
    message.includes("timed out")
  ) {
    return "timeout";
  }

  if (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("connection")
  ) {
    return "no_internet";
  }

  return "unknown";
}

const errorConfig: Record<
  ConnectionErrorType,
  {
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    title: string;
    description: string;
    suggestion: string;
  }
> = {
  no_internet: {
    icon: WifiOff,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-950",
    title: "Sem conexão com a internet",
    description:
      "Não foi possível conectar à internet. Verifique sua conexão de rede.",
    suggestion:
      "Verifique se o Wi-Fi ou dados móveis estão ativados e funcionando corretamente.",
  },
  database: {
    icon: DatabaseZap,
    iconColor: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-950",
    title: "Sem conexão com o banco de dados",
    description: "O servidor de banco de dados não está acessível no momento.",
    suggestion:
      "O banco de dados pode estar em manutenção ou hibernação. Aguarde alguns segundos e tente novamente.",
  },
  timeout: {
    icon: Clock,
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-100 dark:bg-yellow-950",
    title: "Tempo de conexão esgotado",
    description: "O servidor está demorando muito para responder.",
    suggestion:
      "Isso pode acontecer quando o banco está hibernando. Aguarde alguns segundos e tente novamente.",
  },
  unknown: {
    icon: AlertCircle,
    iconColor: "text-destructive",
    bgColor: "bg-destructive/10",
    title: "Algo deu errado",
    description: "Ocorreu um erro inesperado. Nossa equipe foi notificada.",
    suggestion:
      "Se o problema continuar, entre em contato com o suporte informando o código de erro.",
  },
};

export default function ErrorPage({ error }: ErrorProps) {
  const errorType = getConnectionErrorType(error);
  const config = errorConfig[errorType];
  const Icon = config.icon;

  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${config.bgColor}`}
          >
            <Icon className={`h-7 w-7 ${config.iconColor}`} />
          </div>
          <CardTitle className="text-xl">{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="bg-muted text-muted-foreground rounded-lg p-4 text-sm">
            <p>{config.suggestion}</p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs">Código: {error.digest}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          {/* <Button variant="outline" className="flex-1" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Início
            </Link>
          </Button> */}
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {/* <Button className="flex-1" onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button> */}
        </CardFooter>
      </Card>
    </div>
  );
}
