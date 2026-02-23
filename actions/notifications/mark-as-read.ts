"use server";

import { protectedActionClient } from "@/lib/action-client";
import { prisma } from "@/lib/prisma";
import z from "zod";

const inputSchema = z.object({
  notificationId: z.uuid(),
});

export const markNotificationAsRead = protectedActionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { notificationId }, ctx }) => {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: ctx.user.id,
      },
      data: { read: true },
    });

    return { success: true };
  });
