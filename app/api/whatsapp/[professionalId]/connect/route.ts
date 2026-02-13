import { connectProfessional } from "@/lib/whatsapp";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ professionalId: string }> },
) => {
  const { professionalId } = await params;

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { id: true },
  });

  if (!professional) {
    return NextResponse.json(
      { error: "Profissional não encontrado" },
      { status: 404 },
    );
  }

  const result = await connectProfessional(professionalId);
  return NextResponse.json(result);
};
