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

interface Course {
  id: string;
  name: string;
  code: string;
}

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  courseId?: string;
  userRole?: string;
  onSuccess: () => void;
}

export function CreateAnnouncementDialog({
  open,
  onOpenChange,
  token,
  courseId,
  userRole,
  onSuccess,
}: CreateAnnouncementDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    validFrom: "",
    validUntil: "",
    priority: "NORMAL",
    isPublished: true,
    courseId: courseId || "",
    color: "#3B82F6",
  });

  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Fetch courses when dialog opens (for lecturers)
  useEffect(() => {
    if (open && userRole === "DOSEN" && !courseId) {
      fetchCourses();
    }
  }, [open, userRole, courseId]);

  const fetchCourses = async () => {
    if (!token) return;
    
    setLoadingCourses(true);
    try {
      const response = await apiFetch("/courses", {}, token);
      if (response.success && Array.isArray(response.data)) {
        setCourses(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoadingCourses(false);
    }
  };

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
        courseId: courseId || "",
        color: "#3B82F6",
      });
    }
  }, [open, courseId]);

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
    
    // For lecturers, if not provided courseId, they must select one for course-specific announcements
    // or leave empty for global announcements (only admins can create global announcements)
    if (userRole === "DOSEN" && !formData.courseId && !courseId) {
      toast.error("Silakan pilih course untuk pengumuman");
      return;
    }
    
    setLoading(true);

    try {
      const payload: any = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        isPublished: formData.isPublished,
        color: formData.color,
      };

      if (formData.validFrom) payload.validFrom = formData.validFrom;
      if (formData.validUntil) payload.validUntil = formData.validUntil;
      if (formData.courseId) payload.courseId = formData.courseId;
      else if (courseId) payload.courseId = courseId;

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
          courseId: courseId || "",
          color: "#3B82F6",
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

          {/* Course selector for lecturers when not already provided */}
          {userRole === "DOSEN" && !courseId && (
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <select
                id="course"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                disabled={loadingCourses}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
              >
                <option value="">Pilih Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
              {loadingCourses && (
                <p className="text-xs text-muted-foreground">Memuat courses...</p>
              )}
            </div>
          )}
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
          <div className="space-y-2">
            <Label htmlFor="color">Warna Badge</Label>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: "#3B82F6", label: "Blue" },
                { value: "#22C55E", label: "Green" },
                { value: "#F97316", label: "Orange" },
                { value: "#6366F1", label: "Indigo" },
                { value: "#EF4444", label: "Red" },
                { value: "#14B8A6", label: "Teal" },
              ].map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color.value
                      ? "border-ring scale-110"
                      : "border-border hover:border-ring"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
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
