"use server";

import { auth } from "@/lib/auth";
import { responder, SERVIX_SUPPORT_PROMPT } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import z from "zod";

const MAX_MESSAGE_LENGTH = 5000;
const MAX_MESSAGES_HISTORY = 50;

const messageSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(MAX_MESSAGE_LENGTH),
      }),
    )
    .max(MAX_MESSAGES_HISTORY),
  userPlan: z.string().optional(),
  imageUrl: z
    .string()
    .refine(
      (url) => url.startsWith("/api/uploads/"),
      "imageUrl deve ser um upload válido",
    )
    .optional(),
});

async function getOrCreateTicket(userId: string) {
  const existing = await prisma.supportTicket.findFirst({
    where: {
      userId,
      status: { in: ["OPEN", "WAITING_ADMIN", "IN_PROGRESS"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) return existing;

  const justCreated = await prisma.supportTicket.findFirst({
    where: {
      userId,
      status: { in: ["OPEN", "WAITING_ADMIN", "IN_PROGRESS"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (justCreated) return justCreated;

  return prisma.supportTicket.create({
    data: { userId },
  });
}

async function saveMessage(
  ticketId: string,
  content: string,
  opts: { isFromAdmin?: boolean; isFromAI?: boolean; senderId?: string; imageUrl?: string },
) {
  const sanitizedContent = content.slice(0, MAX_MESSAGE_LENGTH);
  return prisma.supportMessage.create({
    data: {
      ticketId,
      content: sanitizedContent,
      imageUrl: opts.imageUrl,
      isFromAdmin: opts.isFromAdmin ?? false,
      isFromAI: opts.isFromAI ?? false,
      senderId: opts.senderId,
    },
  });
}

async function getUnreadAdminMessages(ticketId: string) {
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

  return messages;
}

export const POST = async (request: Request) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos" },
      { status: 400 },
    );
  }

  const { messages, imageUrl } = parsed.data;
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || lastMessage.role !== "user") {
    return NextResponse.json(
      { error: "Mensagem do usuário não encontrada" },
      { status: 400 },
    );
  }

  if (!lastMessage.content.trim() && !imageUrl) {
    return NextResponse.json(
      { error: "Mensagem vazia" },
      { status: 400 },
    );
  }

  const ticket = await getOrCreateTicket(session.user.id);
  await saveMessage(ticket.id, lastMessage.content, {
    senderId: session.user.id,
    imageUrl,
  });

  if (ticket.status === "IN_PROGRESS") {
    return NextResponse.json({
      type: "in_progress",
      message: "",
      ticketId: ticket.id,
    });
  }

  const unreadAdminMessages = await getUnreadAdminMessages(ticket.id);
  if (unreadAdminMessages.length > 0) {
    const combined = unreadAdminMessages
      .map((m) => m.content)
      .join("\n\n");
    return NextResponse.json({
      type: "admin_response",
      message: combined,
      ticketId: ticket.id,
    });
  }

  try {
    const userBarbershop = await prisma.barbershop.findFirst({
      where: { ownerId: session.user.id },
      select: {
        name: true,
        subscription: { select: { plan: true, status: true } },
      },
    });

    const contextInfo = userBarbershop
      ? `\n\nCONTEXTO DO USUÁRIO: Nome: ${session.user.name}, Loja: ${userBarbershop.name}, Plano: ${userBarbershop.subscription?.plan ?? "Sem plano"}, Status: ${userBarbershop.subscription?.status ?? "N/A"}`
      : `\n\nCONTEXTO DO USUÁRIO: Nome: ${session.user.name}, Sem loja cadastrada`;

    const systemPrompt = SERVIX_SUPPORT_PROMPT + contextInfo;

    const firstUserIdx = messages.findIndex((m) => m.role === "user");
    const sanitizedMessages =
      firstUserIdx >= 0 ? messages.slice(firstUserIdx) : messages;

    const text = await responder(sanitizedMessages, systemPrompt, 800);

    await saveMessage(ticket.id, text, { isFromAI: true });

    return NextResponse.json({
      type: "ai_response",
      message: text,
      ticketId: ticket.id,
    });
  } catch (error) {
    console.error("AI support error:", error);

    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: "WAITING_ADMIN" },
    });

    return NextResponse.json({
      type: "waiting_admin",
      message:
        "Nosso assistente automático está temporariamente indisponível. " +
        "Sua mensagem foi encaminhada para nossa equipe de suporte humano. " +
        "Fique tranquilo, um atendente vai responder em breve! " +
        "Você pode continuar enviando mensagens aqui mesmo.",
      ticketId: ticket.id,
    });
  }
};
