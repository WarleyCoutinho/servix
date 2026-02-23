"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { markNotificationAsRead } from "@/actions/notifications/mark-as-read";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";

interface NotificationData {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
}

interface FeeNotificationBannerProps {
  notifications: NotificationData[];
}

export function FeeNotificationBanner({
  notifications: initialNotifications,
}: FeeNotificationBannerProps) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const { execute } = useAction(markNotificationAsRead);

  function handleDismiss(notificationId: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    execute({ notificationId });
  }

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-2">
      {notifications.map((notification) => (
        <Alert key={notification.id}>
          <Bell className="size-4" />
          <AlertTitle>{notification.title}</AlertTitle>
          <AlertDescription className="flex items-start justify-between gap-4">
            <span>{notification.message}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={() => handleDismiss(notification.id)}
            >
              <X className="size-4" />
            </Button>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
