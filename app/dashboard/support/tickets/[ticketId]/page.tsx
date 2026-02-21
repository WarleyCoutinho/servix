import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SupportTicketChat } from "./support-ticket-chat";

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          ownedBarbershops: {
            select: {
              name: true,
              subscription: {
                select: { plan: true, status: true },
              },
            },
          },
        },
      },
      messages: {
        include: {
          sender: {
            select: { name: true, image: true, role: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  return <SupportTicketChat ticket={ticket} />;
}
