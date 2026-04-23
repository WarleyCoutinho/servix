import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/barbershops",
  "/api/auth",
  "/api/stripe/webhook",
  "/api/stripe/connect/webhook",
  "/api/cron",
];

const ownerRoutes = ["/dashboard/owner"];
const professionalRoutes = ["/dashboard/professional"];
const supportRoutes = ["/dashboard/support"];

const PROTECTED_ROUTES = ["/dashboard", "/bookings", "/api/whatsapp"];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isOwnerRoute(pathname: string): boolean {
  return ownerRoutes.some((route) => pathname.startsWith(route));
}

function isProfessionalRoute(pathname: string): boolean {
  return professionalRoutes.some((route) => pathname.startsWith(route));
}

function isSupportRoute(pathname: string): boolean {
  return supportRoutes.some((route) => pathname.startsWith(route));
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

async function getUserRole(request: NextRequest): Promise<string | null> {
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    return null;
  }

  try {
    const response = await fetch(
      `${process.env.BETTER_AUTH_URL}/api/auth/get-session`,
      {
        headers: {
          cookie: `${sessionCookie.name}=${sessionCookie.value}`,
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data?.user?.role || null;
  } catch {
    return null;
  }
}

// Detecta a rota de barbearia — ajuste o padrão se sua rota for diferente
// Ex: /barbershops/minha-barbearia ou /minha-barbearia diretamente
const BARBERSHOP_ROUTE_REGEX = /^\/barbershops\/([^/]+)$/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Seta o cookie de barbearia vinculada ao acessar o link da barbearia ---
  const barbershopMatch = pathname.match(BARBERSHOP_ROUTE_REGEX);
  if (barbershopMatch) {
    const slug = barbershopMatch[1];
    const response = NextResponse.next();
    response.cookies.set("barbershop_slug", slug, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      sameSite: "lax",
    });
    return response;
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/stripe") || pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/stripe") &&
    !pathname.startsWith("/api/cron") &&
    !pathname.startsWith("/api/auth")
  ) {
    const origin = request.headers.get("origin");
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL;

    if (allowedOrigin && origin && origin !== allowedOrigin) {
      return NextResponse.json(
        { error: "CSRF validation failed" },
        { status: 403 },
      );
    }
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  if (isProtectedRoute(pathname) && !sessionCookie) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!sessionCookie) {
    return NextResponse.next();
  }

  const userRole = await getUserRole(request);

  if (isOwnerRoute(pathname)) {
    if (userRole !== "owner") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (isProfessionalRoute(pathname)) {
    if (userRole !== "professional" && userRole !== "owner") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (isSupportRoute(pathname)) {
    if (userRole !== "support" && userRole !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
