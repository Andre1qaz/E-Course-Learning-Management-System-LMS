'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useWebSocket } from './use-websocket';
import { apiFetch } from '@/lib/api';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
}

export function useNotificationsRealtime(token: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleNewNotification = useCallback((data: Notification) => {
    setNotifications((prev) => [data, ...prev]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  // Memoized so the socket doesn't reconnect on every render
  const eventHandlers = useMemo(
    () => ({ 'notification:new': handleNewNotification }),
    [handleNewNotification],
  );

  const { isConnected } = useWebSocket(token, {}, eventHandlers);

  // Initial load of existing notifications
  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [listRes, countRes] = await Promise.all([
          apiFetch<Notification[]>('/notifications', {}, token),
          apiFetch<{ count: number }>('/notifications/unread-count', {}, token),
        ]);
        if (cancelled) return;
        setNotifications(listRes.data ?? []);
        setUnreadCount(countRes.data?.count ?? 0);
      } catch {
        // Bell stays empty rather than breaking the navbar
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const markAsRead = useCallback(
    (notificationId: string) => {
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      // Persist to backend (fire-and-forget)
      if (token) {
        void apiFetch(`/notifications/${notificationId}/read`, { method: 'PUT' }, token).catch(() => {});
      }
    },
    [token],
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
    setUnreadCount(0);
    // Persist to backend (fire-and-forget)
    if (token) {
      void apiFetch('/notifications/read-all', { method: 'PUT' }, token).catch(() => {});
    }
  }, [token]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
  };
}
