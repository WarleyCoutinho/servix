import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function requireOwnerOrProfessional(professionalId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 },
      ),
    };
  }

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    include: { barbershop: { select: { ownerId: true } } },
  });

  if (!professional) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 },
      ),
    };
  }

  const isOwner = professional.barbershop.ownerId === session.user.id;
  const isProfessional = professional.userId === session.user.id;

  if (!isOwner && !isProfessional) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 },
      ),
    };
  }

  return { authorized: true as const, professional, user: session.user };
}
