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
});

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

  const { messages, userPlan } = parsed.data;
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

    return NextResponse.json({
      type: "ai_response",
      message: text,
    });
  } catch (error) {
    console.error("AI support error:", error);

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
      type: "ai_response",
      message:
        "Desculpe, houve um problema ao processar sua mensagem. Por favor, tente novamente em alguns instantes.",
    });
  }
};
