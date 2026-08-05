"use client";

import { useState, useEffect } from "react";
import { Bell, X, Check, CheckCheck, Trash2 } from "lucide-react";
import { Notification, getNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

// Heuristic #1: Visibility of System Status — clear notification indicators
// Heuristic #20: Feedback and Assessment — notification system for grades

interface NotificationBellProps {
  token: string;
  userId: string;
}

export function NotificationBell({ token, userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsData, unreadData] = await Promise.all([
        getNotifications(token),
        getUnreadCount(token),
      ]);
      setNotifications(notificationsData.data || []);
      setUnreadCount(unreadData.data?.count || 0);
    } catch (error) {
      // Silently fail - notifications are not critical
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(token, notificationId);
      await fetchNotifications();
    } catch (error) {
      toast.error("Gagal menandai notifikasi sebagai dibaca");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(token);
      await fetchNotifications();
      toast.success("Semua notifikasi ditandai sebagai dibaca");
    } catch (error) {
      toast.error("Gagal menandai semua notifikasi sebagai dibaca");
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(token, notificationId);
      await fetchNotifications();
      toast.success("Notifikasi dihapus");
    } catch (error) {
      toast.error("Gagal menghapus notifikasi");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "DEADLINE_REMINDER":
        return "⏰";
      case "EXAM_REMINDER":
        return "📝";
      case "GRADE_RELEASED":
        return "📊";
      case "FORUM_REPLY":
        return "💬";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "DEADLINE_REMINDER":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      case "EXAM_REMINDER":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "GRADE_RELEASED":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      case "FORUM_REPLY":
        return "bg-purple-500/10 text-purple-700 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="flex items-center justify-between p-4 border-b">
          <span className="font-semibold">Notifikasi</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Tandai semua
            </Button>
          )}
        </DropdownMenuLabel>
        <ScrollArea className="h-96">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Memuat notifikasi...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 transition-colors",
                    !notification.isRead && "bg-accent/5"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg border",
                        getNotificationColor(notification.type)
                      )}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      {notification.link ? (
                        <Link
                          href={notification.link}
                          onClick={() => {
                            if (!notification.isRead) {
                              handleMarkAsRead(notification.id);
                            }
                            setIsOpen(false);
                          }}
                          className="block"
                        >
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </Link>
                      ) : (
                        <>
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
