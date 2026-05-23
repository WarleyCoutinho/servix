import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/google-calendar";
import { timingSafeEqual } from "crypto";

function validateApiKey(req: NextRequest): boolean {
  const provided = req.headers.get("x-api-key") ?? "";
  const expected = process.env.WHATSAPP_SERVICE_API_KEY ?? "";
  if (!provided || provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

// GET — lista serviços da barbearia
export async function GET(req: NextRequest) {
  if (!validateApiKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const barbershopId = searchParams.get("barbershopId");

  if (!barbershopId) {
    return NextResponse.json(
      { error: "barbershopId é obrigatório" },
      { status: 400 },
    );
  }

  const services = await prisma.barbershopService.findMany({
    where: { barbershopId, deletedAt: null },
    select: { name: true, priceInCents: true, durationMinutes: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ services });
}

// POST — cria agendamento via WhatsApp
export async function POST(req: NextRequest) {
  if (!validateApiKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { barbershopId, phone, serviceName, dateTime, clientName } = body;

  if (!barbershopId || !phone || !serviceName || !dateTime) {
    return NextResponse.json(
      { error: "barbershopId, phone, serviceName e dateTime são obrigatórios" },
      { status: 400 },
    );
  }

  // Busca o serviço pelo nome
  const service = await prisma.barbershopService.findFirst({
    where: {
      barbershopId,
      name: { contains: serviceName, mode: "insensitive" },
      deletedAt: null,
    },
  });

  if (!service) {
    return NextResponse.json(
      { error: `Serviço "${serviceName}" não encontrado` },
      { status: 404 },
    );
  }

  // Busca profissional disponível
  const barbershop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    include: {
      professionals: {
        where: { isActive: true },
        include: { user: true },
        take: 1,
      },
      owner: true,
    },
  });

  if (!barbershop) {
    return NextResponse.json(
      { error: "Barbearia não encontrada" },
      { status: 404 },
    );
  }

  const professional = barbershop.professionals[0];
  if (!professional) {
    return NextResponse.json(
      { error: "Nenhum profissional disponível" },
      { status: 404 },
    );
  }

  const userId = barbershop.ownerId ?? professional.userId;

  // Normaliza telefone pra salvar no clientPhone
  let normalizedPhone = phone.replace(/\D/g, "");
  if (!normalizedPhone.startsWith("55"))
    normalizedPhone = `55${normalizedPhone}`;

  // Cria o booking
  const booking = await prisma.booking.create({
    data: {
      date: new Date(dateTime),
      barbershopId,
      serviceId: service.id,
      userId,
      professionalId: professional.id,
      clientName: clientName ?? `Cliente WhatsApp`,
      clientPhone: normalizedPhone, // salva pra lembretes
    },
  });

  // Cria no Google Calendar do profissional (non-fatal)
  try {
    const calendarEvent = await createCalendarEvent({
      professionalUserId: professional.userId,
      clientName: clientName ?? "Cliente WhatsApp",
      clientEmail: null,
      serviceName: service.name,
      startTime: new Date(dateTime),
      durationMinutes: service.durationMinutes,
      recurrence: "none",
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { googleEventId: calendarEvent.googleEventId },
    });
  } catch (err) {
    console.error("[WhatsApp Booking] Google Calendar sync failed:", err);
  }

  return NextResponse.json({
    bookingId: booking.id,
    service: service.name,
    dateTime,
    professional: professional.displayName ?? professional.user.name,
  });
}
