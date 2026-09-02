"use client";

import { Bell, Paperclip, Calendar, User, Check, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
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

interface AnnouncementCardProps {
  announcement: Announcement;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  basePath: string;
}

export function AnnouncementCard({ announcement, onMarkAsRead, onDelete, basePath }: AnnouncementCardProps) {
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

  const handleMarkAsRead = () => {
    if (onMarkAsRead && !announcement.isRead) {
      onMarkAsRead(announcement.id);
    }
  };

  const handleClick = () => {
    handleMarkAsRead();
    if (announcement.courseId) {
      window.location.href = `${basePath}/courses/${announcement.courseId}`;
    } else {
      window.location.href = `${basePath}/announcements/${announcement.id}`;
    }
  };

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        !announcement.isRead ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {!announcement.isRead && (
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            )}
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
                {announcement.course.code}
              </Badge>
            )}
          </div>
          
          <h3 className="font-semibold text-base mb-1 line-clamp-1">
            {announcement.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {announcement.content}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{announcement.author.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(announcement.publishedAt), { addSuffix: true, locale: id })}</span>
            </div>
            {announcement.attachments && announcement.attachments.length > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                <span>{announcement.attachments.length} lampiran</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {!announcement.isRead && onMarkAsRead && (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsRead();
              }}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(announcement.id);
              }}
              title="Hapus pengumuman"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
