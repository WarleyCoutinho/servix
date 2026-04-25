import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export const STORE_CONTEXT_COOKIE = "barbershop_slug";
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

// Rotas fixas do app que não são slug de loja
const EXCLUDED_SLUG_PATHS = [
  "/barbershops",
  "/dashboard",
  "/bookings",
  "/api",
  "/_next",
  "/favicon.ico",
];

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

function isStoreRoute(pathname: string): boolean {
  const isExcluded = EXCLUDED_SLUG_PATHS.some((p) => pathname.startsWith(p));
  return !isExcluded && /^\/([^/]+)$/.test(pathname);
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*  console.log("[proxy] pathname:", pathname);
  console.log("[proxy] cookies:", request.cookies.getAll()); */

  // ── Store context: /{slug} → seta cookie e deixa passar ─────────────────────
  if (isStoreRoute(pathname)) {
    const slug = decodeURIComponent(pathname.slice(1)).trim(); // remove a barra inicial
    const response = NextResponse.next();
    response.cookies.set(STORE_CONTEXT_COOKIE, slug, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      sameSite: "lax",
      httpOnly: false,
    });
    return response;
  }

  // ── Store context: "/" com cookie → redireciona para /{slug} ─────────────────
  if (pathname === "/") {
    const storeSlug = request.cookies.get(STORE_CONTEXT_COOKIE)?.value;
    if (storeSlug) {
      const url = request.nextUrl.clone();
      url.pathname = `/${storeSlug}`;
      return NextResponse.redirect(url, { status: 302 });
    }
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
