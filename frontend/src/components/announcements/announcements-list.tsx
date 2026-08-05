"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, Filter, X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AnnouncementCard } from "./announcement-card";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  content: string;
  attachments?: any[];
  publishedAt: string;
  validFrom: string;
  validUntil?: string;
  priority: string;
  courseId?: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  course?: {
    id: string;
    name: string;
    code: string;
    thumbnailColor: string;
  };
  isRead: boolean;
}

interface AnnouncementsListProps {
  courseId?: string;
  basePath: string;
  limit?: number;
}

export function AnnouncementsList({ courseId, basePath, limit }: AnnouncementsListProps) {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchAnnouncements() {
      if (!session?.accessToken) return;

      try {
        const params: Record<string, string> = {};
        if (courseId) params.courseId = courseId;
        if (showUnreadOnly) params.unreadOnly = "true";

        const queryString = new URLSearchParams(params).toString();
        const [announcementsRes, unreadRes] = await Promise.all([
          apiFetch(`/announcements${queryString ? `?${queryString}` : ""}`, {}, session.accessToken),
          apiFetch("/announcements/unread-count", {}, session.accessToken),
        ]);

        setAnnouncements(Array.isArray(announcementsRes.data) ? announcementsRes.data.slice(0, limit) : []);
        setUnreadCount((unreadRes.data as any)?.unreadCount ?? 0);
      } catch (error) {
        toast.error("Gagal memuat pengumuman");
        setAnnouncements([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    }

    fetchAnnouncements();
  }, [session?.accessToken, courseId, showUnreadOnly, limit]);

  const handleMarkAsRead = async (id: string) => {
    if (!session?.accessToken) return;

    try {
      await apiFetch(`/announcements/${id}/read`, { method: "POST" }, session.accessToken);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Gagal menandai sebagai dibaca");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!session?.accessToken) return;

    try {
      await apiFetch("/announcements/mark-all-read", { method: "POST" }, session.accessToken);
      setAnnouncements((prev) => prev.map((a) => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      toast.error("Gagal menandai semua sebagai dibaca");
    }
  };

  const filtered = announcements.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Bell className="icon-xl text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">Tidak ada pengumuman</h3>
        <p className="text-sm text-muted-foreground">
          {showUnreadOnly ? "Tidak ada pengumuman yang belum dibaca" : "Belum ada pengumuman tersedia"}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Bell className="icon-lg" />
          <h3 className="font-semibold">Pengumuman</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} baru
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleMarkAllAsRead}
            >
              <CheckCircle2 className="icon-md" />
              Tandai Semua Dibaca
            </Button>
          )}
          <Button
            variant={showUnreadOnly ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          >
            <Filter className="icon-md" />
            {showUnreadOnly ? "Semua" : "Belum Dibaca"}
          </Button>
        </div>
      </div>

      <div className="relative">
        <Input
          placeholder="Cari pengumuman..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-8"
        />
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 icon-md p-0"
            onClick={() => setSearch("")}
          >
            <X className="icon-md" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((announcement) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            onMarkAsRead={handleMarkAsRead}
            basePath={basePath}
          />
        ))}
      </div>
    </div>
  );
}
