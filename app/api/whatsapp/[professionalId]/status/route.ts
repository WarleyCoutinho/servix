import { getConnectionStatus, getQRCode } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ professionalId: string }> },
) => {
  const { professionalId } = await params;
  const status = getConnectionStatus(professionalId);
  const qrCode = getQRCode(professionalId);

  return NextResponse.json({ status, qrCode });
};
