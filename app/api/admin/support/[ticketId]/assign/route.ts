import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> },
) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (user?.role !== UserRole.admin && user?.role !== UserRole.support) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { ticketId } = await params;

  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: "IN_PROGRESS",
      assignedToId: session.user.id,
    },
    include: {
      assignedTo: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json({ ticket });
};
