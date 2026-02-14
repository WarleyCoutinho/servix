const WHATSAPP_SERVICE_URL =
  process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";
const WHATSAPP_SERVICE_API_KEY = process.env.WHATSAPP_SERVICE_API_KEY || "";

type ConnectionStatus = "disconnected" | "connecting" | "qr_code" | "connected";

async function whatsappFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${WHATSAPP_SERVICE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": WHATSAPP_SERVICE_API_KEY,
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`WhatsApp service error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export function getConnectionStatus(
  professionalId: string,
): Promise<ConnectionStatus> {
  return whatsappFetch<{ status: ConnectionStatus; qrCode: string | null }>(
    `/status/${professionalId}`,
  ).then((data) => data.status).catch(() => "disconnected" as ConnectionStatus);
}

export function getQRCode(professionalId: string): Promise<string | null> {
  return whatsappFetch<{ status: ConnectionStatus; qrCode: string | null }>(
    `/status/${professionalId}`,
  ).then((data) => data.qrCode).catch(() => null);
}

export async function connectProfessional(
  professionalId: string,
): Promise<{ status: ConnectionStatus; qrCode: string | null }> {
  try {
    return await whatsappFetch<{
      status: ConnectionStatus;
      qrCode: string | null;
    }>(`/connect/${professionalId}`, { method: "POST" });
  } catch (error) {
    console.error("[WhatsApp Client] Erro ao conectar:", error);
    return { status: "disconnected", qrCode: null };
  }
}

export async function disconnectProfessional(
  professionalId: string,
): Promise<void> {
  try {
    await whatsappFetch(`/disconnect/${professionalId}`, { method: "POST" });
  } catch (error) {
    console.error("[WhatsApp Client] Erro ao desconectar:", error);
  }
}

export async function sendGroupMessage(
  professionalId: string,
  groupName: string,
  message: string,
): Promise<boolean> {
  try {
    const result = await whatsappFetch<{ success: boolean }>("/send-message", {
      method: "POST",
      body: JSON.stringify({ professionalId, groupName, message }),
    });
    return result.success;
  } catch (error) {
    console.error("[WhatsApp Client] Erro ao enviar mensagem:", error);
    return false;
  }
}
