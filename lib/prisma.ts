// lib/prisma.ts

import { Prisma, PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
};

const RETRYABLE_NETWORK_ERRORS = new Set([
  "etimedout",
  "econnreset",
  "econnrefused",
  "eai_again",
  "epipe",
  "enotfound",
  "ehostunreach",
  "enetunreach",
]);

function isRetryableError(error: unknown): boolean {
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const errorCode = (error.code || "").toLowerCase();
    if (RETRYABLE_NETWORK_ERRORS.has(errorCode)) {
      return true;
    }

    const meta = error.meta as { code?: string } | undefined;
    const metaCode = (meta?.code || "").toLowerCase();
    if (RETRYABLE_NETWORK_ERRORS.has(metaCode)) {
      return true;
    }

    const message = error.message.toLowerCase();
    for (const networkError of RETRYABLE_NETWORK_ERRORS) {
      if (message.includes(networkError)) {
        return true;
      }
    }

    return (
      message.includes("timed out") ||
      message.includes("connection reset") ||
      message.includes("socket hang up")
    );
  }

  if (error instanceof Error) {
    const errorWithCode = error as { code?: string; cause?: { code?: string } };
    const code = (errorWithCode.code || "").toLowerCase();
    const causeCode = (errorWithCode.cause?.code || "").toLowerCase();

    if (RETRYABLE_NETWORK_ERRORS.has(code) || RETRYABLE_NETWORK_ERRORS.has(causeCode)) {
      return true;
    }

    const message = error.message.toLowerCase();
    for (const networkError of RETRYABLE_NETWORK_ERRORS) {
      if (message.includes(networkError)) {
        return true;
      }
    }

    return (
      message.includes("timed out") ||
      message.includes("connection reset") ||
      message.includes("socket hang up") ||
      message.includes("connection closed") ||
      message.includes("connection terminated")
    );
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number): number {
  const delay =
    RETRY_CONFIG.initialDelayMs *
    Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  const jitter = Math.random() * 100;
  return Math.min(delay + jitter, RETRY_CONFIG.maxDelayMs);
}

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const retryable = isRetryableError(error);
      const isLastAttempt = attempt === RETRY_CONFIG.maxRetries;

      if (!retryable || isLastAttempt) {
        throw error;
      }

      await sleep(calculateDelay(attempt));
    }
  }

  throw lastError;
}

function buildConnectionString(): string {
  const baseUrl = process.env.DATABASE_URL;

  if (!baseUrl) {
    throw new Error("DATABASE_URL não está configurada");
  }

  const url = new URL(baseUrl);

  url.searchParams.set("connect_timeout", "30");
  url.searchParams.set("pool_timeout", "30");

  return url.toString();
}

const connectionString = buildConnectionString();

const adapter = new PrismaPg({ connectionString });

const globalForPrisma = global as unknown as {
  prisma: ReturnType<typeof createPrismaClientWithRetry>;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter,
    log: [],
  });
}

function createPrismaClientWithRetry() {
  const baseClient = createPrismaClient();

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          return withRetry(() => query(args));
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClientWithRetry();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function safeQuery<T>(
  query: () => Promise<T>,
  fallback: T
): Promise<{ data: T; error: boolean }> {
  try {
    const data = await query();
    return { data, error: false };
  } catch (error) {
    console.error("[safeQuery Error]", error);
    return { data: fallback, error: true };
  }
}
