"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

interface AddActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekId: string;
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

export function AddActivityDialog({
  open,
  onOpenChange,
  weekId,
  token,
  courseId,
  onSuccess,
}: AddActivityDialogProps) {
  const { data: session } = useSession();
  const currentToken = session?.accessToken || token;
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleBack = () => {
    setSelectedType(null);
  };

  const handleSuccess = () => {
    setSelectedType(null);
    onOpenChange(false);
    onSuccess();
  };

  if (selectedType) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
                ← Back
              </Button>
              Add {activityTypes.find((t) => t.type === selectedType)?.label}
            </DialogTitle>
          </DialogHeader>
          {selectedType === "MATERIAL" && (
            <MaterialForm weekId={weekId} token={token} onSuccess={handleSuccess} onCancel={() => setSelectedType(null)} />
          )}
          {selectedType === "ASSIGNMENT" && (
            <AssignmentForm weekId={weekId} token={token} courseId={courseId} onSuccess={handleSuccess} onCancel={() => setSelectedType(null)} />
          )}
          {selectedType === "QUIZ" && (
            <QuizForm weekId={weekId} token={currentToken} onSuccess={handleSuccess} onCancel={() => setSelectedType(null)} />
          )}
          {selectedType === "FORUM" && (
            <ForumForm weekId={weekId} token={token} onSuccess={handleSuccess} onCancel={() => setSelectedType(null)} />
          )}
          {selectedType === "VIDEO" && (
            <VideoForm weekId={weekId} token={token} onSuccess={handleSuccess} onCancel={() => setSelectedType(null)} />
          )}
          {selectedType === "EXTERNAL_LINK" && (
            <ExternalLinkForm weekId={weekId} token={token} onSuccess={handleSuccess} onCancel={() => setSelectedType(null)} />
          )}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Activity Type</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
          {activityTypes.map(({ type, label, icon: Icon, color, bgColor }) => (
            <Button
              key={type}
              variant="outline"
              className="h-24 flex flex-col gap-2 hover:border-primary"
              onClick={() => setSelectedType(type)}
            >
              <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </Button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
