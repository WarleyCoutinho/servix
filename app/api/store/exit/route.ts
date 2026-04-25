import { STORE_CONTEXT_COOKIE } from "@/proxy";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(STORE_CONTEXT_COOKIE);
  return response;
}
