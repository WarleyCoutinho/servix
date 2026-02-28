import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supportEvents } from "@/lib/support-events";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return new Response("Não autenticado", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ticketId = searchParams.get("ticketId");

  if (!ticketId) {
    return new Response("ticketId obrigatório", { status: 400 });
  }

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      userId: session.user.id,
    },
    select: { id: true },
  });

  if (!ticket) {
    return new Response("Ticket não encontrado", { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch {}
      };

      send("connected");

      const heartbeat = setInterval(() => send("ping"), 30_000);

      const unsubscribe = supportEvents.subscribe(ticketId, () =>
        send("update"),
      );

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
