"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";

// Heuristic #1: Visibility of System Status — show upload progress
// Heuristic #5: Error Prevention — validate file before upload
// Heuristic #9: Help Users Recognize Errors — specific error messages

interface AssignmentSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  assignmentTitle: string;
  token: string;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "application/zip",
];

export function AssignmentSubmitDialog({
  open,
  onOpenChange,
  assignmentId,
  assignmentTitle,
  token,
  onSuccess,
}: AssignmentSubmitDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = useCallback((selectedFile: File) => {
    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(`File terlalu besar. Maksimal ${formatBytes(MAX_FILE_SIZE)}`);
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      toast.error(
        "Tipe file tidak didukung. Gunakan PDF, DOC, DOCX, JPG, PNG, atau ZIP."
      );
      return;
    }

    setFile(selectedFile);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Pilih file terlebih dahulu");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Get upload URL from backend for assignment submissions
      const uploadUrlResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/private-files/upload`,
        {
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
        }
      );

      if (!uploadUrlResponse.ok) {
        const errorText = await uploadUrlResponse.text();
        console.error('Upload URL error:', errorText);
        throw new Error("Failed to get upload URL");
      }

      const uploadUrlResult = await uploadUrlResponse.json();
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

      setUploadProgress(100);

      // Submit assignment with the file URL
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignmentId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileUrl,
            fileName: file.name,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Tugas berhasil dikumpulkan");
        onSuccess();
        onOpenChange(false);
        setFile(null);
        setUploadProgress(0);
      } else {
        toast.error(result.message || "Gagal mengumpulkan tugas");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Terjadi kesalahan: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Kumpulkan Tugas</DialogTitle>
          <DialogDescription>
            {assignmentTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-accent transition-colors cursor-pointer"
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag & drop file di sini atau
              </p>
              <Label
                htmlFor="file-upload"
                className="text-sm text-accent cursor-pointer hover:underline"
              >
                klik untuk memilih
              </Label>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
              />
              <p className="text-xs text-muted-foreground mt-4">
                Maksimal {formatBytes(MAX_FILE_SIZE)}. Format: PDF, DOC, DOCX, JPG, PNG, ZIP
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <FileText className="h-10 w-10 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                  {uploading && (
                    <div className="mt-2">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadProgress}% uploaded
                      </p>
                    </div>
                  )}
                </div>
                {!uploading && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setFile(null);
              setUploadProgress(0);
            }}
            disabled={uploading}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!file || uploading}>
            {uploading ? "Mengunggah..." : "Kumpulkan Tugas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
