'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useNotificationsRealtime } from '@/hooks/use-notifications-realtime';

export function NotificationToast({ token }: { token: string | null }) {
  const { notifications, markAsRead } = useNotificationsRealtime(token);

  useEffect(() => {
    // Show toast for new notifications
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (!latestNotification.isRead) {
        toast.success(latestNotification.title, {
          description: latestNotification.message,
          action: latestNotification.link ? {
            label: 'View',
            onClick: () => {
              if (latestNotification.link) {
                window.location.href = latestNotification.link;
              }
              markAsRead(latestNotification.id);
            },
          } : undefined,
          duration: 5000,
        });
      }
    }
  }, [notifications, markAsRead]);

  return null; // This component doesn't render anything, it just shows toasts
}