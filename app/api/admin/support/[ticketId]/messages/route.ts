import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { logSupportAction } from "@/lib/support-audit";
import { UserRole } from "@/generated/prisma/enums";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const MAX_MESSAGE_LENGTH = 5000;
const adminMessagesLimiter = rateLimit({ interval: 60_000, limit: 30 });

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

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
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

  if (!ticket) {
    return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
  }

  const messages = await prisma.supportMessage.findMany({
    where: { ticketId },
    include: {
      sender: {
        select: { name: true, image: true },
      },
    },
    orderBy: { createdAt: "asc" },
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

  const { success } = adminMessagesLimiter.check(session.user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde um momento." },
      { status: 429 },
    );
  }

  const { ticketId } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
  }

  if (ticket.status === "RESOLVED") {
    return NextResponse.json({ error: "Ticket já foi resolvido" }, { status: 400 });
  }

  let body: { content?: string; imageUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { content, imageUrl } = body;

  if (!content?.trim() && !imageUrl) {
    return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
  }

  const sanitizedContent = (content?.trim() ?? "").slice(0, MAX_MESSAGE_LENGTH);

  if (imageUrl && !imageUrl.startsWith("/api/uploads/")) {
    return NextResponse.json({ error: "URL de imagem inválida" }, { status: 400 });
  }

  const message = await prisma.supportMessage.create({
    data: {
      ticketId,
      content: sanitizedContent,
      imageUrl: imageUrl || undefined,
      isFromAdmin: true,
      senderId: session.user.id,
    },
  });

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: "IN_PROGRESS",
      assignedToId: ticket.assignedToId ?? session.user.id,
    },
  });

  logSupportAction("ADMIN_MESSAGE", ticketId, session.user.id, {
    messageId: message.id,
  });

  return NextResponse.json({ message });
};
