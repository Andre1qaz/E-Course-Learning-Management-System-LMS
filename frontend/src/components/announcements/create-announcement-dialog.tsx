"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  courseId?: string;
  onSuccess: () => void;
}

export function CreateAnnouncementDialog({
  open,
  onOpenChange,
  token,
  courseId,
  onSuccess,
}: CreateAnnouncementDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    validFrom: "",
    validUntil: "",
    priority: "NORMAL",
    isPublished: true,
  });

  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        title: "",
        content: "",
        validFrom: "",
        validUntil: "",
        priority: "NORMAL",
        isPublished: true,
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error("Judul pengumuman wajib diisi");
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error("Konten pengumuman wajib diisi");
      return;
    }
    
    setLoading(true);

    try {
      const payload: any = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        isPublished: formData.isPublished,
      };

      if (formData.validFrom) payload.validFrom = formData.validFrom;
      if (formData.validUntil) payload.validUntil = formData.validUntil;
      if (courseId) payload.courseId = courseId;

      const response = await apiFetch("/announcements", {
        method: "POST",
        body: JSON.stringify(payload),
      }, token);

      if (response.success) {
        toast.success("Pengumuman berhasil dibuat");
        onOpenChange(false);
        onSuccess();
        setFormData({
          title: "",
          content: "",
          validFrom: "",
          validUntil: "",
          priority: "NORMAL",
          isPublished: true,
        });
      } else {
        toast.error(response.message || "Gagal membuat pengumuman");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat membuat pengumuman");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Pengumuman Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Masukkan judul pengumuman"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Konten</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Masukkan konten pengumuman"
              rows={5}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validFrom">Valid Dari</Label>
            <Input
              id="validFrom"
              type="datetime-local"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="validUntil">Valid Sampai</Label>
            <Input
              id="validUntil"
              type="datetime-local"
              value={formData.validUntil}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority">Prioritas</Label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Buat Pengumuman"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
