import { auth } from "@/lib/auth";
import { getUserFriendlyMessage, isConnectionError } from "@/lib/db-error";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const { POST: originalPost, GET: originalGet } = toNextJsHandler(auth);

function withErrorHandler(
  handler: (req: NextRequest) => Promise<Response>
): (req: NextRequest) => Promise<Response> {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      console.error("[Better Auth Error]", error);

      if (isConnectionError(error)) {
        const message = getUserFriendlyMessage(error);
        return NextResponse.json(
          {
            error: "DATABASE_CONNECTION_ERROR",
            message,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: "INTERNAL_SERVER_ERROR",
          message: "Ocorreu um erro inesperado. Por favor, tente novamente.",
        },
        { status: 500 }
      );
    }
  };
}

export const GET = withErrorHandler(originalGet);
export const POST = withErrorHandler(originalPost);
