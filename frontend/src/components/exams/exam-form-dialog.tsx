"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

// Heuristic #5: Error Prevention — validate exam data before submission
// Heuristic #16: Instructional Assessment — require duration for proper timing

const examSchema = z.object({
  title: z.string().min(1, "Judul ujian wajib diisi").max(200, "Judul maksimal 200 karakter"),
  description: z.string().max(2000, "Deskripsi maksimal 2000 karakter").optional(),
  startTime: z.string().min(1, "Waktu mulai wajib diisi"),
  deadline: z.string().min(1, "Deadline wajib diisi"),
  duration: z.number().min(1, "Durasi minimal 1 menit").max(300, "Durasi maksimal 300 menit"),
  isPublished: z.boolean().optional(),
});

type ExamFormValues = z.infer<typeof examSchema>;

interface ExamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  exam?: {
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    deadline: string;
    duration: number;
    isPublished: boolean;
  } | null;
  onSuccess: () => void;
}

export function ExamFormDialog({
  open,
  onOpenChange,
  courseId,
  exam,
  onSuccess,
}: ExamFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!exam;

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: exam?.title || "",
      description: exam?.description || "",
      startTime: exam?.startTime
        ? new Date(exam.startTime).toISOString().slice(0, 16)
        : "",
      deadline: exam?.deadline
        ? new Date(exam.deadline).toISOString().slice(0, 16)
        : "",
      duration: exam?.duration || 60,
      isPublished: exam?.isPublished || false,
    },
  });

  useEffect(() => {
    if (exam) {
      form.reset({
        title: exam.title,
        description: exam.description || "",
        startTime: new Date(exam.startTime).toISOString().slice(0, 16),
        deadline: new Date(exam.deadline).toISOString().slice(0, 16),
        duration: exam.duration,
        isPublished: exam.isPublished,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        startTime: "",
        deadline: "",
        duration: 60,
        isPublished: false,
      });
    }
  }, [exam, form]);

  const onSubmit = async (values: ExamFormValues) => {
    setLoading(true);
    try {
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/exams/${exam.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/exams/course/${courseId}`;

      const payload = {
        title: values.title,
        description: values.description?.trim() || undefined,
        startTime: new Date(values.startTime).toISOString(),
        deadline: new Date(values.deadline).toISOString(),
        duration: values.duration,
        isPublished: values.isPublished,
      };

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(isEdit ? "Ujian berhasil diperbarui" : "Ujian berhasil dibuat");
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.message || "Gagal menyimpan ujian");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan ujian");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Ujian" : "Buat Ujian Baru"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Edit detail ujian yang ada." : "Buat ujian baru untuk course ini."}
          </DialogDescription>
        </DialogHeader>

        <Form form={form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Ujian</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan judul ujian" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Deskripsi ujian (opsional)"
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Waktu Mulai</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durasi (menit)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="300"
                      value={Number.isFinite(field.value) ? field.value : ""}
                      onChange={(e) => {
                        const next = Number(e.target.value);
                        field.onChange(Number.isNaN(next) ? undefined : next);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Publish Ujian</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Ujian akan terlihat oleh mahasiswa setelah dipublish
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Ujian"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
