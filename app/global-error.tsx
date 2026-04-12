"use client";

import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from 'next/link'

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

function isConnectionError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes("etimedout") ||
    message.includes("econnrefused") ||
    message.includes("timeout") ||
    message.includes("connection") ||
    message.includes("fetch failed") ||
    message.includes("network")
  );
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const isConnection = isConnectionError(error);

  return (
    <html lang="pt-BR">
      <body className="antialiased">
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fafafa",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "28rem",
              backgroundColor: "white",
              borderRadius: "0.75rem",
              border: "1px solid #e5e5e5",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "50%",
                  backgroundColor: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <AlertCircle
                  style={{ width: "1.5rem", height: "1.5rem", color: "#dc2626" }}
                />
              </div>
              <h1
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: "#171717",
                  marginBottom: "0.5rem",
                }}
              >
                {isConnection ? "Problema de Conexão" : "Erro Crítico"}
              </h1>
              <p style={{ fontSize: "0.875rem", color: "#737373" }}>
                {isConnection
                  ? "O servidor está demorando para responder. O banco de dados pode estar em modo de hibernação."
                  : "Ocorreu um erro crítico na aplicação."}
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#f5f5f5",
                borderRadius: "0.5rem",
                padding: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              <p style={{ fontSize: "0.875rem", color: "#525252" }}>
                {isConnection
                  ? "Por favor, aguarde alguns segundos e tente novamente. Se o problema persistir, verifique sua conexão."
                  : "Tente recarregar a página. Se o erro continuar, entre em contato com o suporte."}
              </p>
              {error.digest && (
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#737373",
                    marginTop: "0.5rem",
                    fontFamily: "monospace",
                  }}
                >
                  Código: {error.digest}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Link
                href="/"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "white",
                  border: "1px solid #e5e5e5",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#171717",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <Home style={{ width: "1rem", height: "1rem" }} />
                Início
              </Link>
              <button
                onClick={reset}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#171717",
                  border: "none",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <RefreshCw style={{ width: "1rem", height: "1rem" }} />
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
