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

interface MaterialFormProps {
  weekId: string;
  token: string;
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MaterialForm({ weekId, token, activity, onSuccess, onCancel }: MaterialFormProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [references, setReferences] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  // Populate form with activity data if editing
  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setDescription(activity.description || "");
      setFileUrl(activity.metadata?.fileUrl || "");
      setVideoUrl(activity.metadata?.videoUrl || "");
      setReferences(activity.metadata?.references || "");
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
          type: "MATERIAL",
          title,
          description,
          status: isPublished ? "PUBLISHED" : "DRAFT",
          order: activity?.order || 0,
          metadata: {
            fileUrl,
            videoUrl,
            references,
          },
        }),
      });

      if (response.ok) {
        toast.success(isEdit ? "Material updated successfully" : "Material created successfully");
        onSuccess();
      } else {
        toast.error(isEdit ? "Failed to update material" : "Failed to create material");
      }
    } catch (error) {
      toast.error("Error saving material");
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
        <Label htmlFor="fileUrl">File URL (PDF, PPT, DOCX)</Label>
        <Input
          id="fileUrl"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="videoUrl">Video URL (YouTube)</Label>
        <Input
          id="videoUrl"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://youtube.com/..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="references">References</Label>
        <Textarea
          id="references"
          value={references}
          onChange={(e) => setReferences(e.target.value)}
          rows={2}
          placeholder="Additional references..."
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
          {loading ? (activity ? "Updating..." : "Creating...") : (activity ? "Update Material" : "Create Material")}
        </Button>
      </div>
    </form>
  );
}
