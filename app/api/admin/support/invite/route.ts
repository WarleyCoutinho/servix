import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.role !== UserRole.admin) return null;
  return user;
}

export const GET = async () => {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const invites = await prisma.supportInvite.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      admin: {
        select: { name: true },
      },
    },
  });

  const acceptedUsers = await prisma.user.findMany({
    where: { role: UserRole.support },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invites, acceptedUsers });
};

export const POST = async (request: Request) => {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { email } = await request.json();

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingInvite = await prisma.supportInvite.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingInvite) {
    return NextResponse.json(
      { error: "Este email já foi convidado" },
      { status: 409 },
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: UserRole.support },
    });

    await prisma.supportInvite.create({
      data: {
        email: normalizedEmail,
        invitedBy: admin.id,
        accepted: true,
      },
    });

    return NextResponse.json({
      message: "Usuário já cadastrado. Role atualizada para suporte.",
      alreadyRegistered: true,
    });
  }

  const invite = await prisma.supportInvite.create({
    data: {
      email: normalizedEmail,
      invitedBy: admin.id,
    },
  });

  return NextResponse.json({ invite });
};

export const DELETE = async (request: Request) => {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const inviteId = searchParams.get("id");

  if (!inviteId) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  }

  const invite = await prisma.supportInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite) {
    return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  }

  if (invite.accepted) {
    const user = await prisma.user.findFirst({
      where: { email: invite.email },
    });
    if (user && user.role === UserRole.support) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.client },
      });
    }
  }

  await prisma.supportInvite.delete({
    where: { id: inviteId },
  });

  return NextResponse.json({ success: true });
};
