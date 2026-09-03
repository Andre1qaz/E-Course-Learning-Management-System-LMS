"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowLeft, Calendar, User, Paperclip, Bell, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface Attachment {
  fileName: string;
  fileUrl: string;
  fileSize: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  attachments?: Attachment[];
  publishedAt: string;
  validFrom: string;
  validUntil?: string;
  priority: string;
  courseId?: string;
  color?: string;
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

interface AnnouncementDetailProps {
  announcementId: string;
  token: string;
  basePath: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function AnnouncementDetail({
  announcementId,
  token,
  basePath,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: AnnouncementDetailProps) {
  const { data: session } = useSession();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const priorityColors = {
    normal: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    important: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  };

  const priorityLabels = {
    normal: "Normal",
    urgent: "Urgent",
    important: "Penting",
  };

  useEffect(() => {
    async function fetchAnnouncement() {
      if (!session?.accessToken) return;

      try {
        const response = await apiFetch(`/announcements/${announcementId}`, {}, session.accessToken);
        setAnnouncement(response.data as Announcement);
        
        // Mark as read
        if (!(response.data as Announcement).isRead) {
          await apiFetch(`/announcements/${announcementId}/read`, { method: "POST" }, session.accessToken);
        }
      } catch (error) {
        toast.error("Gagal memuat pengumuman");
      } finally {
        setLoading(false);
      }
    }

    fetchAnnouncement();
  }, [session?.accessToken, announcementId]);

  const handleDeleteConfirm = async () => {
    if (!session?.accessToken) return;

    try {
      await apiFetch(`/announcements/${announcementId}`, { method: "DELETE" }, session.accessToken);
      toast.success("Pengumuman berhasil dihapus");
      if (onDelete) onDelete();
      else window.location.href = `${basePath}/announcements`;
    } catch (error) {
      toast.error("Gagal menghapus pengumuman");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const handleDownload = (attachment: Attachment) => {
    window.open(attachment.fileUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-32" />
        <div className="skeleton h-12 w-3/4" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-4 w-4/6" />
      </div>
    );
  }

  if (!announcement) {
    return (
      <Card className="p-8 text-center">
        <Bell className="icon-xl text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">Pengumuman tidak ditemukan</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Pengumuman yang Anda cari mungkin telah dihapus atau tidak tersedia.
        </p>
        <Button onClick={() => window.location.href = `${basePath}/announcements`}>
          Kembali ke Daftar Pengumuman
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => window.location.href = `${basePath}/announcements`}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
        <div className="flex items-center gap-2">
          {canEdit && onEdit && (
            <Button variant="outline" onClick={onEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>
          )}
        </div>
      </div>

      {/* Announcement Card */}
      <Card className="p-6">
        {/* Priority and Course Badges */}
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className={priorityColors[announcement.priority as keyof typeof priorityColors]}>
            {priorityLabels[announcement.priority as keyof typeof priorityLabels]}
          </Badge>
          {announcement.course && (
            <Badge
              variant="outline"
              style={{
                backgroundColor: announcement.color || announcement.course.thumbnailColor,
                color: 'white',
                borderColor: announcement.color || announcement.course.thumbnailColor
              }}
            >
              {announcement.course.code} - {announcement.course.name}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl font-bold mb-4">{announcement.title}</h1>

        {/* Author and Date */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6 pb-6 border-b">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{announcement.author.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(announcement.publishedAt), "dd MMMM yyyy, HH:mm", { locale: id })}
            </span>
          </div>
          {announcement.validUntil && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                Berlaku sampai: {format(new Date(announcement.validUntil), "dd MMMM yyyy", { locale: id })}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
          <div className="whitespace-pre-wrap">{announcement.content}</div>
        </div>

        {/* Attachments */}
        {announcement.attachments && announcement.attachments.length > 0 && (
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Paperclip className="h-4 w-4" />
              Lampiran ({announcement.attachments.length})
            </h3>
            <div className="space-y-2">
              {announcement.attachments.map((attachment, index) => (
                <Card
                  key={index}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleDownload(attachment)}
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{attachment.fileName}</p>
                      <p className="text-xs text-muted-foreground">{attachment.fileSize}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Download
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="font-semibold text-lg mb-2">Hapus Pengumuman</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Batal
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Hapus
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
