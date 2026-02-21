"use server";

import { auth } from "@/lib/auth";
import { responder, SERVIX_SUPPORT_PROMPT, shouldEscalate } from "@/lib/ai";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import z from "zod";

const SUPPORT_WHATSAPP = "5562999687179";
const SUPPORT_EMAIL = "contatoadapticode@gmail.com";

const messageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
  userPlan: z.string().optional(),
  imageUrl: z.string().optional(),
});

async function getOrCreateTicket(userId: string) {
  const existing = await prisma.supportTicket.findFirst({
    where: {
      userId,
      status: { in: ["OPEN", "WAITING_ADMIN"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) return existing;

  return prisma.supportTicket.create({
    data: { userId },
  });
}

async function saveMessage(
  ticketId: string,
  content: string,
  opts: { isFromAdmin?: boolean; isFromAI?: boolean; senderId?: string; imageUrl?: string },
) {
  return prisma.supportMessage.create({
    data: {
      ticketId,
      content,
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

  const body = await request.json();
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos" },
      { status: 400 },
    );
  }

  const { messages, userPlan, imageUrl } = parsed.data;
  const lastMessage = messages[messages.length - 1];

  if (!lastMessage || lastMessage.role !== "user") {
    return NextResponse.json(
      { error: "Mensagem do usuário não encontrada" },
      { status: 400 },
    );
  }

  const plan = userPlan ?? "BASIC";
  const isPremiumPlan = plan === "PROFESSIONAL" || plan === "ENTERPRISE";

  if (isPremiumPlan) {
    return NextResponse.json({
      type: "redirect_human",
      message:
        "Como assinante do plano premium, você tem acesso ao suporte direto. Entre em contato pelos canais abaixo:",
      whatsapp: SUPPORT_WHATSAPP,
      email: SUPPORT_EMAIL,
    });
  }

  if (shouldEscalate(lastMessage.content) && isPremiumPlan) {
    return NextResponse.json({
      type: "escalate",
      message:
        "Entendi que você precisa de atendimento especializado. Vou te encaminhar para nossa equipe de suporte:",
      whatsapp: SUPPORT_WHATSAPP,
      email: SUPPORT_EMAIL,
    });
  }

  const ticket = await getOrCreateTicket(session.user.id);
  await saveMessage(ticket.id, lastMessage.content, {
    senderId: session.user.id,
    imageUrl,
  });

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

    if (isPremiumPlan) {
      return NextResponse.json({
        type: "escalate",
        message:
          "Desculpe, houve um problema ao processar sua mensagem. Entre em contato com nosso suporte:",
        whatsapp: SUPPORT_WHATSAPP,
        email: SUPPORT_EMAIL,
      });
    }

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
