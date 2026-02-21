import { prisma } from "@/lib/prisma";
import { SupportTicketsList } from "./support-tickets-list";

export default async function AdminSupportPage() {
  const tickets = await prisma.supportTicket.findMany({
    where: {
      status: { in: ["OPEN", "WAITING_ADMIN"] },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
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
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: { messages: true },
      },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  const resolvedToday = await prisma.supportTicket.count({
    where: {
      status: "RESOLVED",
      closedAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
  });

  const stats = {
    total: tickets.length,
    waitingAdmin: tickets.filter((t) => t.status === "WAITING_ADMIN").length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    resolvedToday,
  };

  return <SupportTicketsList initialTickets={tickets} stats={stats} />;
}
