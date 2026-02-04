import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/barbershops",
  "/api/auth",
  "/api/stripe/webhook",
  "/api/stripe/connect/webhook",
];

const ownerRoutes = ["/dashboard/owner"];
const professionalRoutes = ["/dashboard/professional"];

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

// Função para decodificar o token e extrair o role do usuário
async function getUserRole(request: NextRequest): Promise<string | null> {
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    return null;
  }

  try {
    // Faz uma requisição interna para obter os dados da sessão
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
  } catch (error) {
    console.error("Erro ao verificar role do usuário:", error);
    return null;
  }
}

// MUDANÇA AQUI: Renomeie de "middleware" para "proxy"
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permite rotas públicas
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Verifica se existe sessão
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  if (!sessionCookie) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verifica permissões para rotas específicas
  const userRole = await getUserRole(request);

  // Proteção de rotas do Owner
  if (isOwnerRoute(pathname)) {
    if (userRole !== "owner") {
      // Redireciona para a página inicial se não for owner
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Proteção de rotas do Professional
  if (isProfessionalRoute(pathname)) {
    if (userRole !== "professional" && userRole !== "owner") {
      // Owner também pode acessar rotas de professional
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
