import { disconnectProfessional } from "@/lib/whatsapp";
import { requireOwnerOrProfessional } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ professionalId: string }> },
) => {
  const { professionalId } = await params;
  const authResult = await requireOwnerOrProfessional(professionalId);

  if (!authResult.authorized) {
    return authResult.response;
  }

  await disconnectProfessional(professionalId);
  return NextResponse.json({ status: "disconnected" });
};
