import { getConnectionStatus, getQRCode } from "@/lib/whatsapp";
import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ professionalId: string }> },
) => {
  const { professionalId } = await params;
  const status = getConnectionStatus(professionalId);
  const qrCode = getQRCode(professionalId);

  let qrDataUrl: string | null = null;
  if (qrCode) {
    try {
      qrDataUrl = await QRCode.toDataURL(qrCode, {
        width: 256,
        margin: 2,
      });
    } catch {
      qrDataUrl = null;
    }
  }

  return NextResponse.json({ status, qrCode: qrDataUrl });
};
