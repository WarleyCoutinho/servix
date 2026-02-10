import { NextRequest, NextResponse } from "next/server";

const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  invalid_code: {
    title: "Erro de conexão",
    message:
      "Não foi possível completar o login. Verifique sua conexão com a internet e tente novamente.",
  },
  access_denied: {
    title: "Acesso negado",
    message: "Você cancelou o processo de login ou o acesso foi negado.",
  },
  invalid_request: {
    title: "Requisição inválida",
    message: "Houve um problema com a requisição de login. Tente novamente.",
  },
  server_error: {
    title: "Erro no servidor",
    message:
      "O servidor de autenticação está temporariamente indisponível. Tente novamente em alguns instantes.",
  },
  temporarily_unavailable: {
    title: "Serviço indisponível",
    message:
      "O serviço de autenticação está temporariamente indisponível. Tente novamente em alguns instantes.",
  },
  default: {
    title: "Erro de autenticação",
    message:
      "Ocorreu um erro durante o processo de login. Por favor, tente novamente.",
  },
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const errorCode = searchParams.get("error") || "default";

  const errorInfo = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default;

  const redirectUrl = new URL("/", request.url);
  redirectUrl.searchParams.set("auth_error", errorCode);
  redirectUrl.searchParams.set("auth_error_title", errorInfo.title);
  redirectUrl.searchParams.set("auth_error_message", errorInfo.message);

  return NextResponse.redirect(redirectUrl);
}
