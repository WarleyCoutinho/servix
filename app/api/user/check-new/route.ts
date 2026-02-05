import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const now = new Date();
    const createdAt = new Date(user.createdAt);
    const diffInSeconds = (now.getTime() - createdAt.getTime()) / 1000;

    const isNewUser =
      user.role === "client" &&
      user._count.bookings === 0 &&
      diffInSeconds < 60;

    return NextResponse.json({
      isNewUser,
      role: user.role,
    });
  } catch (error) {
    console.error("Error checking new user:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
