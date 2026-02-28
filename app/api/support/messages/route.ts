import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const messagesLimiter = rateLimit({ interval: 60_000, limit: 20 });

export const GET = async (request: Request) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { success } = messagesLimiter.check(session.user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde um momento." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const ticketId = searchParams.get("ticketId");

  if (!ticketId) {
    return NextResponse.json({ error: "ticketId obrigatório" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      userId: session.user.id,
    },
    include: {
      assignedTo: {
        select: { name: true },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket não encontrado" }, { status: 404 });
  }

  const messages = await prisma.supportMessage.findMany({
    where: {
      ticketId,
      isFromAdmin: true,
      readByUser: false,
    },
    orderBy: { createdAt: "asc" },
  });

  if (messages.length > 0) {
    await prisma.supportMessage.updateMany({
      where: {
        id: { in: messages.map((m) => m.id) },
      },
      data: { readByUser: true },
    });
  }

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      imageUrl: m.imageUrl,
      createdAt: m.createdAt,
    })),
    ticketStatus: ticket.status,
    assignedToName: ticket.assignedTo?.name ?? null,
  });
};
