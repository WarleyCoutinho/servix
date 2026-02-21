import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async () => {
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

  const tickets = await prisma.supportTicket.findMany({
    where: {
      status: { in: ["OPEN", "WAITING_ADMIN"] },
    },
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
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: [
      { status: "asc" },
      { updatedAt: "desc" },
    ],
  });

  return NextResponse.json({ tickets });
};
