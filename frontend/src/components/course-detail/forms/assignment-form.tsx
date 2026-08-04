"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

interface AssignmentFormProps {
  weekId: string;
  token: string;
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AssignmentForm({ weekId, token, activity, onSuccess, onCancel }: AssignmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  // Populate form with activity data if editing
  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setDescription(activity.description || "");
      setAttachmentUrl(activity.metadata?.attachmentUrl || "");
      setDeadline(activity.metadata?.deadline || "");
      setMaxScore(String(activity.metadata?.maxScore || 100));
      setAllowLateSubmission(activity.metadata?.allowLateSubmission || false);
      setIsPublished(activity.status === "PUBLISHED");
    }
  }, [activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEdit = !!activity;
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/weeks/${weekId}/activities/${activity.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/weeks/${weekId}/activities`;
      
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "ASSIGNMENT",
          title,
          description,
          status: isPublished ? "PUBLISHED" : "DRAFT",
          order: activity?.order || 0,
          metadata: {
            attachmentUrl,
            deadline,
            maxScore: parseInt(maxScore),
            allowLateSubmission,
          },
        }),
      });

      if (response.ok) {
        toast.success(isEdit ? "Assignment updated successfully" : "Assignment created successfully");
        onSuccess();
      } else {
        toast.error(isEdit ? "Failed to update assignment" : "Failed to create assignment");
      }
    } catch (error) {
      toast.error("Error saving assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="attachmentUrl">Attachment URL</Label>
        <Input
          id="attachmentUrl"
          value={attachmentUrl}
          onChange={(e) => setAttachmentUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="deadline">Deadline</Label>
        <Input
          id="deadline"
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxScore">Max Score</Label>
        <Input
          id="maxScore"
          type="number"
          value={maxScore}
          onChange={(e) => setMaxScore(e.target.value)}
          min="0"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="allowLate"
          checked={allowLateSubmission}
          onCheckedChange={setAllowLateSubmission}
        />
        <Label htmlFor="allowLate">Allow Late Submission</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="published"
          checked={isPublished}
          onCheckedChange={setIsPublished}
        />
        <Label htmlFor="published">Publish immediately</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (activity ? "Updating..." : "Creating...") : (activity ? "Update Assignment" : "Create Assignment")}
        </Button>
      </div>
    </form>
  );
}
