import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isConnectionError, getUserFriendlyMessage } from "@/lib/db-error";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Usuário é considerado "novo" apenas se:
    // 1. O role ainda é "client" (padrão) E
    // 2. A conta foi criada há menos de 1 minuto (acabou de se registrar)
    const ONE_MINUTE = 60 * 1000;
    const timeSinceCreation = Date.now() - user.createdAt.getTime();
    const isNewUser = user.role === "client" && timeSinceCreation < ONE_MINUTE;

    return NextResponse.json({
      isNewUser,
      role: user.role,
    });
  } catch (error) {
    console.error("Error checking new user:", error);

    if (isConnectionError(error)) {
      return NextResponse.json(
        { error: getUserFriendlyMessage(error) },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
