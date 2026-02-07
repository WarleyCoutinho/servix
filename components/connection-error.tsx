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
  RefreshCw,
  WifiOff,
  DatabaseZap,
  Clock,
} from "lucide-react";

export type ConnectionErrorType =
  | "no_internet"
  | "database"
  | "timeout"
  | "unknown";

interface ConnectionErrorProps {
  type?: ConnectionErrorType;
  onRetry?: () => void;
  showCard?: boolean;
  className?: string;
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
    title: "Erro de conexão",
    description: "Ocorreu um erro ao tentar conectar ao servidor.",
    suggestion: "Verifique sua conexão e tente novamente.",
  },
};

export function getErrorTypeFromMessage(message: string): ConnectionErrorType {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("eai_again") ||
    lowerMessage.includes("eai_nodata") ||
    lowerMessage.includes("enotfound") ||
    lowerMessage.includes("getaddrinfo") ||
    lowerMessage.includes("dns") ||
    lowerMessage.includes("fetch failed") ||
    lowerMessage.includes("network")
  ) {
    return "no_internet";
  }

  if (
    lowerMessage.includes("econnrefused") ||
    lowerMessage.includes("connection refused") ||
    lowerMessage.includes("econnreset") ||
    lowerMessage.includes("socket hang up")
  ) {
    return "database";
  }

  if (
    lowerMessage.includes("etimedout") ||
    lowerMessage.includes("timeout") ||
    lowerMessage.includes("timed out")
  ) {
    return "timeout";
  }

  return "unknown";
}

export function ConnectionError({
  type = "unknown",
  onRetry,
  showCard = true,
  className,
}: ConnectionErrorProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  const content = (
    <div className={`text-center ${className ?? ""}`}>
      <div
        className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${config.bgColor}`}
      >
        <Icon className={`h-7 w-7 ${config.iconColor}`} />
      </div>
      <h3 className="mb-2 text-lg font-semibold">{config.title}</h3>
      <p className="text-muted-foreground mb-4 text-sm">{config.description}</p>
      <p className="text-muted-foreground mb-6 text-xs">{config.suggestion}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
      )}
    </div>
  );

  if (!showCard) {
    return content;
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="pb-2" />
      <CardContent>{content}</CardContent>
      <CardFooter />
    </Card>
  );
}

export function ConnectionErrorInline({
  type = "unknown",
  onRetry,
  className,
}: Omit<ConnectionErrorProps, "showCard">) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-4 ${className ?? ""}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
      >
        <Icon className={`h-5 w-5 ${config.iconColor}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{config.title}</p>
        <p className="text-muted-foreground text-xs">{config.suggestion}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
