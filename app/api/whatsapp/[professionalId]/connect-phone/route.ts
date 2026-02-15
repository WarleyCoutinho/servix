import { connectWithPhone } from "@/lib/whatsapp";
import { requireOwnerOrProfessional } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ professionalId: string }> },
) => {
  const { professionalId } = await params;
  const authResult = await requireOwnerOrProfessional(professionalId);

  if (!authResult.authorized) {
    return authResult.response;
  }

  const body = await request.json();
  const phoneNumber = body?.phoneNumber;

  if (
    typeof phoneNumber !== "string" ||
    phoneNumber.replace(/\D/g, "").length < 10
  ) {
    return NextResponse.json(
      { error: "Número de telefone inválido" },
      { status: 400 },
    );
  }

  const result = await connectWithPhone(professionalId, phoneNumber);
  return NextResponse.json(result);
};
