import path from "path";

type ConnectionStatus = "disconnected" | "connecting" | "qr_code" | "connected";

interface ProfessionalConnection {
  socket: unknown;
  status: ConnectionStatus;
  qrCode: string | null;
}

const AUTH_BASE_DIR = path.join(process.cwd(), "whatsapp-auth");

const connections = new Map<string, ProfessionalConnection>();

async function loadBaileys() {
  const baileys = await import("@whiskeysockets/baileys");
  return baileys;
}

function getConnection(professionalId: string): ProfessionalConnection {
  if (!connections.has(professionalId)) {
    connections.set(professionalId, {
      socket: null,
      status: "disconnected",
      qrCode: null,
    });
  }
  return connections.get(professionalId)!;
}

export function getConnectionStatus(professionalId: string): ConnectionStatus {
  return getConnection(professionalId).status;
}

export function getQRCode(professionalId: string): string | null {
  return getConnection(professionalId).qrCode;
}

export async function connectProfessional(
  professionalId: string,
): Promise<{ status: ConnectionStatus; qrCode: string | null }> {
  const conn = getConnection(professionalId);

  if (conn.status === "connected" && conn.socket) {
    return { status: "connected", qrCode: null };
  }

  if (conn.status === "connecting") {
    return { status: conn.status, qrCode: conn.qrCode };
  }

  conn.status = "connecting";
  conn.qrCode = null;

  const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } =
    await loadBaileys();

  const authDir = path.join(AUTH_BASE_DIR, professionalId);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const socket = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  conn.socket = socket;

  socket.ev.on("creds.update", saveCreds);

  socket.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      conn.status = "qr_code";
      conn.qrCode = qr;
      console.log(`[WhatsApp] QR code gerado para profissional ${professionalId}`);
    }

    if (connection === "open") {
      conn.status = "connected";
      conn.qrCode = null;
      console.log(`[WhatsApp] Profissional ${professionalId} conectado`);
    }

    if (connection === "close") {
      const statusCode = (
        lastDisconnect?.error as { output?: { statusCode?: number } }
      )?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      conn.socket = null;
      conn.qrCode = null;

      if (shouldReconnect) {
        console.log(
          `[WhatsApp] Reconectando profissional ${professionalId}...`,
        );
        conn.status = "connecting";
        connectProfessional(professionalId);
      } else {
        conn.status = "disconnected";
        console.log(
          `[WhatsApp] Profissional ${professionalId} deslogado`,
        );
      }
    }
  });

  return { status: conn.status, qrCode: conn.qrCode };
}

export async function disconnectProfessional(
  professionalId: string,
): Promise<void> {
  const conn = getConnection(professionalId);
  if (conn.socket) {
    const socket = conn.socket as { logout: () => Promise<void> };
    await socket.logout();
    conn.socket = null;
  }
  conn.status = "disconnected";
  conn.qrCode = null;
}

export async function sendGroupMessage(
  professionalId: string,
  groupName: string,
  message: string,
): Promise<boolean> {
  const conn = getConnection(professionalId);

  if (conn.status !== "connected" || !conn.socket) {
    console.log(
      `[WhatsApp] Profissional ${professionalId} não está conectado. Status: ${conn.status}`,
    );
    return false;
  }

  const socket = conn.socket as {
    groupFetchAllParticipating: () => Promise<
      Record<string, { id: string; subject: string }>
    >;
    sendMessage: (
      jid: string,
      content: { text: string },
    ) => Promise<unknown>;
  };

  const groups = await socket.groupFetchAllParticipating();
  const targetGroup = Object.values(groups).find(
    (group) => group.subject.toLowerCase() === groupName.toLowerCase(),
  );

  if (!targetGroup) {
    console.log(
      `[WhatsApp] Grupo "${groupName}" não encontrado para profissional ${professionalId}`,
    );
    return false;
  }

  await socket.sendMessage(targetGroup.id, { text: message });
  console.log(
    `[WhatsApp] Mensagem enviada no grupo "${groupName}" para profissional ${professionalId}`,
  );
  return true;
}
