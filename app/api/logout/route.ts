import { NextResponse } from "next/server";

function clearCookie(response: NextResponse, name: string) {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set(name, "", {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
    sameSite: "lax",
    secure: isProduction,
  });

  // fallback extra para cookies antigos
  response.headers.append(
    "Set-Cookie",
    `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  );

  response.headers.append(
    "Set-Cookie",
    `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`,
  );

  if (isProduction) {
    response.headers.append(
      "Set-Cookie",
      `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure`,
    );

    response.headers.append(
      "Set-Cookie",
      `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; SameSite=Lax`,
    );
  }
}

export async function POST() {
  const response = NextResponse.json({
    success: true,
  });

  clearCookie(response, "barbershop_slug");
  clearCookie(response, "better-auth.state");
  clearCookie(response, "better-auth.session_token");
  clearCookie(response, "__Secure-better-auth.session_token");

  return response;
}
