import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isConnectionError, getUserFriendlyMessage } from "@/lib/db-error";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        ownedBarbershops: true,
      },
    });

    if (!user || user.ownedBarbershops.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const activeBarbershop = user.ownedBarbershops[0];

    const service = await prisma.barbershopService.findUnique({
      where: { id },
    });

    if (!service || service.barbershopId !== activeBarbershop.id) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error("Error fetching service:", error);

    if (isConnectionError(error)) {
      return NextResponse.json(
        { error: getUserFriendlyMessage(error) },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
