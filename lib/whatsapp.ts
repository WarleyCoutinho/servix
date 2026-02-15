const WHATSAPP_SERVICE_URL =
  process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";
const WHATSAPP_SERVICE_API_KEY = process.env.WHATSAPP_SERVICE_API_KEY || "";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ConnectionStatus = "disconnected" | "connecting" | "qr_code" | "connected";

function validateProfessionalId(professionalId: string): void {
  if (!UUID_REGEX.test(professionalId)) {
    throw new Error("Invalid professionalId format");
  }
}

function buildUrl(path: string): string {
  const url = new URL(path, WHATSAPP_SERVICE_URL);
  const baseOrigin = new URL(WHATSAPP_SERVICE_URL).origin;
  if (url.origin !== baseOrigin) {
    throw new Error("URL origin mismatch");
  }
  return url.toString();
}

async function whatsappFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    "x-api-key": WHATSAPP_SERVICE_API_KEY,
  };

  if (options?.body) {
    headers["Content-Type"] = "application/json";
  }

  const url = buildUrl(path);

  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
    redirect: "error",
  });

  if (!res.ok) {
    throw new Error(`WhatsApp service error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function getStatus(
  professionalId: string,
): Promise<{ status: ConnectionStatus; qrCode: string | null; pairingCode: string | null }> {
  try {
    validateProfessionalId(professionalId);
    return await whatsappFetch<{ status: ConnectionStatus; qrCode: string | null; pairingCode: string | null }>(
      `/status/${professionalId}`,
    );
  } catch {
    return { status: "disconnected", qrCode: null, pairingCode: null };
  }
}

export async function getConnectionStatus(
  professionalId: string,
): Promise<ConnectionStatus> {
  const data = await getStatus(professionalId);
  return data.status;
}

export async function getQRCode(professionalId: string): Promise<string | null> {
  const data = await getStatus(professionalId);
  return data.qrCode;
}

export async function connectProfessional(
  professionalId: string,
): Promise<{ status: ConnectionStatus; qrCode: string | null }> {
  try {
    validateProfessionalId(professionalId);
    return await whatsappFetch<{
      status: ConnectionStatus;
      qrCode: string | null;
    }>(`/connect/${professionalId}`, { method: "POST" });
  } catch (error) {
    console.error("[WhatsApp Client] Erro ao conectar:", error instanceof Error ? error.message : "Unknown error");
    return { status: "disconnected", qrCode: null };
  }
}

export async function connectWithPhone(
  professionalId: string,
  phoneNumber: string,
): Promise<{ status: ConnectionStatus; pairingCode: string | null }> {
  try {
    validateProfessionalId(professionalId);
    return await whatsappFetch<{
      status: ConnectionStatus;
      pairingCode: string | null;
    }>(`/connect-phone/${professionalId}`, {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    });
  } catch (error) {
    console.error("[WhatsApp Client] Erro ao conectar via telefone:", error instanceof Error ? error.message : "Unknown error");
    return { status: "disconnected", pairingCode: null };
  }
}

export async function disconnectProfessional(
  professionalId: string,
): Promise<void> {
  try {
    validateProfessionalId(professionalId);
    await whatsappFetch(`/disconnect/${professionalId}`, { method: "POST" });
  } catch (error) {
    console.error("[WhatsApp Client] Erro ao desconectar:", error instanceof Error ? error.message : "Unknown error");
  }
}

export async function sendGroupMessage(
  professionalId: string,
  groupName: string,
  message: string,
): Promise<boolean> {
  try {
    validateProfessionalId(professionalId);
    const result = await whatsappFetch<{ success: boolean }>("/send-message", {
      method: "POST",
      body: JSON.stringify({ professionalId, groupName, message }),
    });
    return result.success;
  } catch (error) {
    console.error("[WhatsApp Client] Erro ao enviar mensagem:", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}
