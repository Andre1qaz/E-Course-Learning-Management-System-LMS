"use client";

import { useState } from "react";
import {
  FileText,
  ClipboardList,
  HelpCircle,
  MessageSquare,
  Video,
  ExternalLink,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Clock,
  Calendar,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  metadata: any;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ActivityCardProps {
  activity: Activity;
  weekId: string;
  canEdit: boolean;
  onEdit: () => void;
  token: string;
  userRole: string;
  onChange: () => void;
  courseId: string;
}

const activityConfig: Record<
  string,
  { icon: any; color: string; label: string; bgColor: string }
> = {
  MATERIAL: {
    icon: FileText,
    color: "text-blue-500",
    label: "Material",
    bgColor: "bg-blue-500/10",
  },
  ASSIGNMENT: {
    icon: ClipboardList,
    color: "text-orange-500",
    label: "Assignment",
    bgColor: "bg-orange-500/10",
  },
  QUIZ: {
    icon: HelpCircle,
    color: "text-purple-500",
    label: "Quiz",
    bgColor: "bg-purple-500/10",
  },
  FORUM: {
    icon: MessageSquare,
    color: "text-green-500",
    label: "Forum",
    bgColor: "bg-green-500/10",
  },
  VIDEO: {
    icon: Video,
    color: "text-red-500",
    label: "Video",
    bgColor: "bg-red-500/10",
  },
  EXTERNAL_LINK: {
    icon: ExternalLink,
    color: "text-cyan-500",
    label: "External Link",
    bgColor: "bg-cyan-500/10",
  },
};

export function ActivityCard({
  activity,
  weekId,
  canEdit,
  onEdit,
  token,
  userRole,
  onChange,
  courseId,
}: ActivityCardProps) {
  const config = activityConfig[activity.type] || activityConfig.MATERIAL;
  const Icon = config.icon;
  const isDraft = activity.status === "DRAFT";

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this activity?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/weeks/${weekId}/activities/${activity.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Activity deleted successfully");
        onChange();
      } else {
        toast.error("Failed to delete activity");
      }
    } catch (error) {
      toast.error("Error deleting activity");
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/weeks/${weekId}/activities/${activity.id}/duplicate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Activity duplicated successfully");
        onChange();
      } else {
        toast.error("Failed to duplicate activity");
      }
    } catch (error) {
      toast.error("Error duplicating activity");
    }
  };

  const handlePublish = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/weeks/${weekId}/activities/${activity.id}/publish`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Activity published successfully");
        onChange();
      } else {
        toast.error("Failed to publish activity");
      }
    } catch (error) {
      toast.error("Error publishing activity");
    }
  };

  const handleUnpublish = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/weeks/${weekId}/activities/${activity.id}/unpublish`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        toast.success("Activity unpublished successfully");
        onChange();
      } else {
        toast.error("Failed to unpublish activity");
      }
    } catch (error) {
      toast.error("Error unpublishing activity");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDeadline = () => {
    if (activity.type === "ASSIGNMENT" && activity.metadata?.deadline) {
      return formatDate(activity.metadata.deadline);
    }
    return null;
  };

  const getActivityLink = () => {
    switch (activity.type) {
      case "MATERIAL":
        if (activity.metadata?.fileUrl) return activity.metadata.fileUrl;
        if (activity.metadata?.videoUrl) return activity.metadata.videoUrl;
        return null;
      case "ASSIGNMENT":
        if (userRole === "MAHASISWA") {
          return `/mahasiswa/courses/${courseId}/assignments/${activity.metadata?.assignmentId}`;
        } else if (canEdit) {
          return `/dosen/courses/${courseId}/assignments/${activity.metadata?.assignmentId}/submissions`;
        }
        return null;
      case "QUIZ":
        return `/mahasiswa/courses/${courseId}/quizzes/${activity.id}`;
      case "FORUM":
        return `/mahasiswa/courses/${courseId}/forums/${activity.id}`;
      case "VIDEO":
        return activity.metadata?.videoUrl;
      case "EXTERNAL_LINK":
        return activity.metadata?.url;
      default:
        return null;
    }
  };

  const getActionLabel = () => {
    switch (activity.type) {
      case "MATERIAL":
        return "Buka Materi";
      case "ASSIGNMENT":
        return userRole === "MAHASISWA" ? "Kerjakan Tugas" : "Lihat Submissions";
      case "QUIZ":
        return "Mulai Kuis";
      case "FORUM":
        return "Buka Forum";
      case "VIDEO":
        return "Tonton Video";
      case "EXTERNAL_LINK":
        return "Buka Link";
      default:
        return "Buka";
    }
  };

  const activityLink = getActivityLink();
  const actionLabel = getActionLabel();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`icon-md ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium truncate">{activity.title}</h4>
                <Badge variant="outline" className={config.bgColor + " " + config.color}>
                  {config.label}
                </Badge>
                {isDraft && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <EyeOff className="icon-xs" />
                    Draft
                  </Badge>
                )}
              </div>
              {activity.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {activity.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {getDeadline() && (
                  <div className="flex items-center gap-1">
                    <Clock className="icon-xs" />
                    <span>Deadline: {getDeadline()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="icon-xs" />
                  <span>Created: {formatDate(activity.createdAt)}</span>
                </div>
              </div>
              {activityLink && !isDraft && (
                <div className="mt-3">
                  {activity.type === "MATERIAL" || activity.type === "VIDEO" || activity.type === "EXTERNAL_LINK" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => window.open(activityLink, '_blank')}
                    >
                      <ExternalLink className="mr-1 icon-xs" />
                      {actionLabel}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      asChild
                    >
                      <a href={activityLink}>
                        {actionLabel}
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="icon-sm" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 icon-sm" />
                  Edit
                </DropdownMenuItem>
                {activity.type === "ASSIGNMENT" && canEdit && (
                  <DropdownMenuItem asChild>
                    <a href={`/dosen/courses/${courseId}/assignments/${activity.metadata?.assignmentId}/submissions`}>
                      <Users className="mr-2 icon-sm" />
                      View Submissions
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="mr-2 icon-sm" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 icon-sm" />
                  Delete
                </DropdownMenuItem>
                {isDraft ? (
                  <DropdownMenuItem
                    onClick={handlePublish}
                  >
                    <Eye className="mr-2 icon-sm" />
                    Publish
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={handleUnpublish}
                  >
                    <EyeOff className="mr-2 icon-sm" />
                    Unpublish
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
