import { NextResponse } from "next/server";
export async function GET() {
  const res = await fetch(`${process.env.WHATSAPP_SERVICE_URL}/reminders/status`, {
    headers: { "x-api-key": process.env.WHATSAPP_SERVICE_API_KEY! },
  });
  return NextResponse.json(await res.json());
}
