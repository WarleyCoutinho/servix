"use server";

import { protectedActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";

export const getNotifications = protectedActionClient.action(
  async ({ ctx }) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return notifications;
  },
);
