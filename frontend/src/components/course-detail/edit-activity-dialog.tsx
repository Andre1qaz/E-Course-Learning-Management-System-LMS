"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  ClipboardList,
  HelpCircle,
  MessageSquare,
  Video,
  ExternalLink,
} from "lucide-react";
import { MaterialForm } from "./forms/material-form";
import { AssignmentForm } from "./forms/assignment-form";
import { QuizForm } from "./forms/quiz-form";
import { ForumForm } from "./forms/forum-form";
import { VideoForm } from "./forms/video-form";
import { ExternalLinkForm } from "./forms/external-link-form";

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

interface EditActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekId: string;
  activity: Activity | null;
  token: string;
  courseId: string;
  onSuccess: () => void;
}

const activityTypes = [
  { type: "MATERIAL", label: "Material", icon: FileText, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  { type: "ASSIGNMENT", label: "Assignment", icon: ClipboardList, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  { type: "QUIZ", label: "Quiz", icon: HelpCircle, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  { type: "FORUM", label: "Forum", icon: MessageSquare, color: "text-green-500", bgColor: "bg-green-500/10" },
  { type: "VIDEO", label: "Video", icon: Video, color: "text-red-500", bgColor: "bg-red-500/10" },
  { type: "EXTERNAL_LINK", label: "External Link", icon: ExternalLink, color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
];

export function EditActivityDialog({
  open,
  onOpenChange,
  weekId,
  activity,
  token,
  courseId,
  onSuccess,
}: EditActivityDialogProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Reset selected type when dialog opens/closes or activity changes
  useEffect(() => {
    if (open && activity) {
      setSelectedType(activity.type);
    } else {
      setSelectedType(null);
    }
  }, [open, activity]);

  const handleSuccess = () => {
    setSelectedType(null);
    onOpenChange(false);
    onSuccess();
  };

  if (!activity) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {activityTypes.find((t) => t.type === activity.type)?.label}
          </DialogTitle>
        </DialogHeader>
        {activity.type === "MATERIAL" && (
          <MaterialForm 
            weekId={weekId} 
            token={token} 
            activity={activity}
            onSuccess={handleSuccess} 
            onCancel={() => onOpenChange(false)} 
          />
        )}
        {activity.type === "ASSIGNMENT" && (
          <AssignmentForm 
            weekId={weekId} 
            token={token} 
            courseId={courseId}
            activity={activity}
            onSuccess={handleSuccess} 
            onCancel={() => onOpenChange(false)} 
          />
        )}
        {activity.type === "QUIZ" && (
          <QuizForm 
            weekId={weekId} 
            token={token} 
            activity={activity}
            onSuccess={handleSuccess} 
            onCancel={() => onOpenChange(false)} 
          />
        )}
        {activity.type === "FORUM" && (
          <ForumForm 
            weekId={weekId} 
            token={token} 
            activity={activity}
            onSuccess={handleSuccess} 
            onCancel={() => onOpenChange(false)} 
          />
        )}
        {activity.type === "VIDEO" && (
          <VideoForm 
            weekId={weekId} 
            token={token} 
            activity={activity}
            onSuccess={handleSuccess} 
            onCancel={() => onOpenChange(false)} 
          />
        )}
        {activity.type === "EXTERNAL_LINK" && (
          <ExternalLinkForm 
            weekId={weekId} 
            token={token} 
            activity={activity}
            onSuccess={handleSuccess} 
            onCancel={() => onOpenChange(false)} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
