"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, FileText, X, Video } from "lucide-react";

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
  courseId: string;
  activity?: Activity;
  onSuccess: () => void;
  onCancel: () => void;
}

interface UploadedFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export function AssignmentForm({ weekId, token, courseId, activity, onSuccess, onCancel }: AssignmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Populate form with activity data if editing
  useEffect(() => {
    if (activity) {
      setTitle(activity.title);
      setDescription(activity.description || "");
      setVideoUrl(activity.metadata?.videoUrl || "");
      setDeadline(activity.metadata?.deadline || "");
      setMaxScore(String(activity.metadata?.maxScore || 100));
      setAllowLateSubmission(activity.metadata?.allowLateSubmission || false);
      setIsPublished(activity.status === "PUBLISHED");
      setUploadedFiles(activity.metadata?.uploadedFiles || []);
    }
  }, [activity]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      // Get upload URL from backend
      const uploadEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/weeks/${weekId}/activities/upload-url`;

      const uploadResponse = await fetch(uploadEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload URL error:', errorText);
        throw new Error("Failed to get upload URL");
      }

      const uploadUrlResult = await uploadResponse.json();
      console.log('Upload URL response:', uploadUrlResult);

      if (!uploadUrlResult.success || !uploadUrlResult.data) {
        throw new Error("Invalid upload URL response");
      }

      const { uploadUrl, fileUrl } = uploadUrlResult.data;

      // Upload file to the presigned URL
      const uploadResult = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload file");
      }

      // Add to uploaded files list
      setUploadedFiles([
        ...uploadedFiles,
        {
          fileName: file.name,
          fileUrl: fileUrl,
          fileType: file.type,
          fileSize: file.size,
        },
      ]);

      toast.success("File uploaded successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to upload file: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (fileUrl: string) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.fileUrl !== fileUrl));
    toast.success("File removed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEdit = !!activity;
      
      // First, create/update the assignment in the backend
      let assignmentId = activity?.metadata?.assignmentId;
      
      if (!isEdit) {
        // Create new assignment
        const assignmentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/assignments/course/${courseId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              title,
              description,
              deadline: new Date(deadline).toISOString(),
              maxScore: parseInt(maxScore),
            }),
          }
        );

        const assignmentResult = await assignmentResponse.json();
        
        if (assignmentResult.success) {
          assignmentId = assignmentResult.data.id;
        } else {
          toast.error("Failed to create assignment");
          setLoading(false);
          return;
        }
      }

      // Then create/update the activity
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
            assignmentId,
            videoUrl,
            deadline,
            maxScore: parseInt(maxScore),
            allowLateSubmission,
            uploadedFiles,
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
          rows={6}
          placeholder="Tulis deskripsi tugas di sini..."
        />
      </div>

      {/* File Upload Section */}
      <div className="space-y-2">
        <Label>Upload Documents (PDF, DOCX, PPTX, TXT)</Label>
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {uploading ? "Uploading..." : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOCX, PPTX, TXT (Max 50MB)
            </p>
          </label>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2 mt-2">
            <Label>Uploaded Files</Label>
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file.fileUrl)}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Video URL Section */}
      <div className="space-y-2">
        <Label htmlFor="videoUrl">Video URL (YouTube)</Label>
        <Input
          id="videoUrl"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://youtube.com/..."
        />
        <p className="text-xs text-muted-foreground">
          Tambahkan link YouTube sebagai referensi tugas
        </p>
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
        <Button type="submit" disabled={loading || uploading}>
          {loading ? (activity ? "Updating..." : "Creating...") : (activity ? "Update Assignment" : "Create Assignment")}
        </Button>
      </div>
    </form>
  );
}
