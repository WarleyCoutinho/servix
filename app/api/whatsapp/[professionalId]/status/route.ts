import { getStatus } from "@/lib/whatsapp";
import { requireOwnerOrProfessional } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ professionalId: string }> },
) => {
  const { professionalId } = await params;
  const authResult = await requireOwnerOrProfessional(professionalId);

  if (!authResult.authorized) {
    return authResult.response;
  }

  const data = await getStatus(professionalId);
  return NextResponse.json(data);
};
