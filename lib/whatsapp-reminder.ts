// lib/whatsapp-reminder.ts
export async function sendWhatsAppReminder(
  phone: string,
  clientName: string,
  serviceName: string,
  date: Date,
  minutesBefore: number,
) {
  if (
    !process.env.WHATSAPP_SERVICE_URL ||
    !process.env.WHATSAPP_SERVICE_API_KEY
  ) {
    return;
  }

  const timeStr = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });

  const message =
    minutesBefore === 60
      ? `Olá${clientName ? `, ${clientName.split(" ")[0]}` : ""}! 👋\n\nLembrete: seu agendamento de *${serviceName}* é hoje às *${timeStr}* — daqui a 1 hora.\n\nAté logo! ✂️`
      : `⏰ Seu agendamento de *${serviceName}* começa em *30 minutos* (às ${timeStr}).\n\nEstamos te esperando! 😊`;

  await fetch(`${process.env.WHATSAPP_SERVICE_URL}/send-direct`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.WHATSAPP_SERVICE_API_KEY,
    },
    body: JSON.stringify({ phone, message }),
  }).catch((err) =>
    console.error("WhatsApp reminder failed (non-fatal):", err),
  );
}
