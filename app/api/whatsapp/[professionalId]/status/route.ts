import { NextResponse } from "next/server";

const WHATSAPP_SERVICE_URL =
  process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";
const WHATSAPP_SERVICE_API_KEY = process.env.WHATSAPP_SERVICE_API_KEY || "";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ professionalId: string }> },
) => {
  const { professionalId } = await params;

  try {
    const res = await fetch(
      `${WHATSAPP_SERVICE_URL}/status/${professionalId}`,
      {
        headers: { "x-api-key": WHATSAPP_SERVICE_API_KEY },
      },
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: "disconnected", qrCode: null });
  }
};
