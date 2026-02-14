import { getStatus } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ professionalId: string }> },
) => {
  const { professionalId } = await params;
  const data = await getStatus(professionalId);
  return NextResponse.json(data);
};
