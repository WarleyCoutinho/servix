import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      ownedBarbershop: true,
    },
  });

  if (!user?.ownedBarbershop) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = await prisma.barbershopService.findUnique({
    where: { id },
  });

  if (!service || service.barbershopId !== user.ownedBarbershop.id) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json(service);
}
