import { Prisma } from "@/generated/prisma/client";

export type DatabaseErrorType =
  | "CONNECTION_TIMEOUT"
  | "CONNECTION_REFUSED"
  | "QUERY_TIMEOUT"
  | "UNIQUE_CONSTRAINT"
  | "FOREIGN_KEY_CONSTRAINT"
  | "NOT_FOUND"
  | "UNKNOWN";

interface DatabaseErrorInfo {
  type: DatabaseErrorType;
  message: string;
  userMessage: string;
  isRetryable: boolean;
}

const ERROR_MESSAGES: Record<DatabaseErrorType, Omit<DatabaseErrorInfo, "type">> = {
  CONNECTION_TIMEOUT: {
    message: "Database connection timeout",
    userMessage:
      "O servidor está demorando para responder. Por favor, aguarde alguns segundos e tente novamente.",
    isRetryable: true,
  },
  CONNECTION_REFUSED: {
    message: "Database connection refused",
    userMessage:
      "Não foi possível conectar ao servidor. Por favor, tente novamente em alguns instantes.",
    isRetryable: true,
  },
  QUERY_TIMEOUT: {
    message: "Query timeout",
    userMessage:
      "A operação demorou muito para ser concluída. Por favor, tente novamente.",
    isRetryable: true,
  },
  UNIQUE_CONSTRAINT: {
    message: "Unique constraint violation",
    userMessage: "Este registro já existe no sistema.",
    isRetryable: false,
  },
  FOREIGN_KEY_CONSTRAINT: {
    message: "Foreign key constraint violation",
    userMessage:
      "Não foi possível completar a operação devido a registros relacionados.",
    isRetryable: false,
  },
  NOT_FOUND: {
    message: "Record not found",
    userMessage: "O registro solicitado não foi encontrado.",
    isRetryable: false,
  },
  UNKNOWN: {
    message: "Unknown database error",
    userMessage:
      "Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.",
    isRetryable: false,
  },
};

export function classifyDatabaseError(error: unknown): DatabaseErrorInfo {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return { type: "UNIQUE_CONSTRAINT", ...ERROR_MESSAGES.UNIQUE_CONSTRAINT };
      case "P2003":
        return {
          type: "FOREIGN_KEY_CONSTRAINT",
          ...ERROR_MESSAGES.FOREIGN_KEY_CONSTRAINT,
        };
      case "P2025":
        return { type: "NOT_FOUND", ...ERROR_MESSAGES.NOT_FOUND };
      default:
        return { type: "UNKNOWN", ...ERROR_MESSAGES.UNKNOWN };
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return { type: "CONNECTION_REFUSED", ...ERROR_MESSAGES.CONNECTION_REFUSED };
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("etimedout") ||
      message.includes("timeout") ||
      message.includes("timed out")
    ) {
      return { type: "CONNECTION_TIMEOUT", ...ERROR_MESSAGES.CONNECTION_TIMEOUT };
    }

    if (
      message.includes("econnrefused") ||
      message.includes("connection refused")
    ) {
      return { type: "CONNECTION_REFUSED", ...ERROR_MESSAGES.CONNECTION_REFUSED };
    }

    if (
      message.includes("enotfound") ||
      message.includes("getaddrinfo")
    ) {
      return { type: "CONNECTION_REFUSED", ...ERROR_MESSAGES.CONNECTION_REFUSED };
    }

    if (message.includes("query timeout") || message.includes("statement timeout")) {
      return { type: "QUERY_TIMEOUT", ...ERROR_MESSAGES.QUERY_TIMEOUT };
    }
  }

  return { type: "UNKNOWN", ...ERROR_MESSAGES.UNKNOWN };
}

export class DatabaseError extends Error {
  public readonly type: DatabaseErrorType;
  public readonly userMessage: string;
  public readonly isRetryable: boolean;
  public readonly originalError: unknown;

  constructor(error: unknown) {
    const info = classifyDatabaseError(error);
    super(info.message);

    this.name = "DatabaseError";
    this.type = info.type;
    this.userMessage = info.userMessage;
    this.isRetryable = info.isRetryable;
    this.originalError = error;

    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError;
}

export function isConnectionError(error: unknown): boolean {
  if (isDatabaseError(error)) {
    return (
      error.type === "CONNECTION_TIMEOUT" ||
      error.type === "CONNECTION_REFUSED" ||
      error.type === "QUERY_TIMEOUT"
    );
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("etimedout") ||
      message.includes("econnrefused") ||
      message.includes("timeout") ||
      message.includes("connection")
    );
  }

  return false;
}

export function getUserFriendlyMessage(error: unknown): string {
  if (isDatabaseError(error)) {
    return error.userMessage;
  }

  const info = classifyDatabaseError(error);
  return info.userMessage;
}
