import { prisma } from "@/lib/prisma";
import { SupportTicketsView } from "./support-tickets-view";

export default async function SupportTicketsPage() {
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

  return <SupportTicketsView tickets={tickets} />;
}
