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

interface ForumFormProps {
  weekId: string;
  token: string;
  courseId: string;
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ForumForm({ weekId, token, courseId, activity, onSuccess, onCancel }: ForumFormProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  // Populate form with activity data if editing
  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setDescription(activity.description || "");
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

      // Create activity
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "FORUM",
          title,
          description,
          status: isPublished ? "PUBLISHED" : "DRAFT",
          order: activity ? activity.order : 0,
          metadata: {},
        }),
      });

      if (response.ok) {
        const activityData = await response.json();
        
        // Only create forum thread if it's a new activity (not edit)
        if (!isEdit) {
          // Create forum thread in Forum Diskusi
          const forumThreadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/forum/thread`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              courseId: courseId,
              title: title,
              content: description || "",
            }),
          });

          if (forumThreadResponse.ok) {
            const forumThreadData = await forumThreadResponse.json();

            // Update activity metadata to link with forum thread
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/weeks/${weekId}/activities/${activityData.data.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                type: "FORUM",
                title,
                description,
                status: isPublished ? "PUBLISHED" : "DRAFT",
                order: 0, // Default order for new activities
                metadata: {
                  forumThreadId: forumThreadData.data.id,
                },
              }),
            });
          }
        }

        toast.success(isEdit ? "Forum updated successfully" : "Forum created successfully");
        onSuccess();
      } else {
        toast.error(isEdit ? "Failed to update forum" : "Failed to create forum");
      }
    } catch (error) {
      toast.error("Error saving forum");
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
          {loading ? (activity ? "Updating..." : "Creating...") : (activity ? "Update Forum" : "Create Forum")}
        </Button>
      </div>
    </form>
  );
}
