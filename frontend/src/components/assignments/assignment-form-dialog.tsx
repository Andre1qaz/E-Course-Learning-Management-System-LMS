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
import { toast } from "sonner";

// Heuristic #5: Error Prevention — validate form data before submission
// Heuristic #16: Instructional Assessment — require maxScore for grading

const assignmentSchema = z.object({
  title: z.string().min(1, "Judul tugas wajib diisi").max(200, "Judul maksimal 200 karakter"),
  description: z.string().max(2000, "Deskripsi maksimal 2000 karakter").optional(),
  deadline: z.string().min(1, "Deadline wajib diisi"),
  maxScore: z.number().min(1, "Nilai maksimal minimal 1").max(1000, "Nilai maksimal maksimal 1000"),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface AssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  assignment?: {
    id: string;
    title: string;
    description: string | null;
    deadline: string;
    maxScore: number;
  } | null;
  onSuccess: () => void;
}

export function AssignmentFormDialog({
  open,
  onOpenChange,
  courseId,
  assignment,
  onSuccess,
}: AssignmentFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!assignment;

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: assignment?.title || "",
      description: assignment?.description || "",
      deadline: assignment?.deadline
        ? new Date(assignment.deadline).toISOString().slice(0, 16)
        : "",
      maxScore: assignment?.maxScore || 100,
    },
  });

  useEffect(() => {
    if (assignment) {
      form.reset({
        title: assignment.title,
        description: assignment.description || "",
        deadline: new Date(assignment.deadline).toISOString().slice(0, 16),
        maxScore: assignment.maxScore,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        deadline: "",
        maxScore: 100,
      });
    }
  }, [assignment, form]);

  const onSubmit = async (values: AssignmentFormValues) => {
    setLoading(true);
    try {
      const url = isEdit
        ? `${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignment.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/assignments/course/${courseId}`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(isEdit ? "Tugas berhasil diperbarui" : "Tugas berhasil dibuat");
        onSuccess();
        onOpenChange(false);
        form.reset();
      } else {
        toast.error(result.message || "Gagal menyimpan tugas");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan tugas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Tugas" : "Buat Tugas Baru"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Edit detail tugas yang ada." : "Buat tugas baru untuk course ini."}
          </DialogDescription>
        </DialogHeader>

        <Form form={form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Tugas</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan judul tugas" {...field} />
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
                      placeholder="Deskripsi tugas (opsional)"
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
              name="maxScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nilai Maksimal</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
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
                {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Tugas"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
