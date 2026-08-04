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

interface ExternalLinkFormProps {
  weekId: string;
  token: string;
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ExternalLinkForm({ weekId, token, activity, onSuccess, onCancel }: ExternalLinkFormProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  // Populate form with activity data if editing
  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setDescription(activity.description || "");
      setUrl(activity.metadata?.url || "");
      setIsPublished(activity.status === "PUBLISHED");
    }
  }, [activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEdit = !!activity;
      const url_endpoint = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/weeks/${weekId}/activities/${activity.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/weeks/${weekId}/activities`;
      
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url_endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: "EXTERNAL_LINK",
          title,
          description,
          status: isPublished ? "PUBLISHED" : "DRAFT",
          order: activity?.order || 0,
          metadata: {
            url,
          },
        }),
      });

      if (response.ok) {
        toast.success(isEdit ? "External link updated successfully" : "External link created successfully");
        onSuccess();
      } else {
        toast.error(isEdit ? "Failed to update external link" : "Failed to create external link");
      }
    } catch (error) {
      toast.error("Error saving external link");
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
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          required
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
          {loading ? (activity ? "Updating..." : "Creating...") : (activity ? "Update External Link" : "Create External Link")}
        </Button>
      </div>
    </form>
  );
}
