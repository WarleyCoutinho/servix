import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async (
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

  const messages = await prisma.supportMessage.findMany({
    where: { ticketId },
    include: {
      sender: {
        select: { name: true, image: true, role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          ownedBarbershops: {
            select: {
              name: true,
              subscription: {
                select: { plan: true, status: true },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ messages, ticket });
};

export const POST = async (
  request: Request,
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
  const { content, imageUrl } = await request.json();

  if (!content?.trim() && !imageUrl) {
    return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
  }

  const message = await prisma.supportMessage.create({
    data: {
      ticketId,
      content: content?.trim() ?? "",
      imageUrl: imageUrl || undefined,
      isFromAdmin: true,
      senderId: session.user.id,
    },
  });

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "OPEN" },
  });

  return NextResponse.json({ message });
};
