"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";

const gradeSchema = z.object({
  score: z
    .number()
    .min(0, "Nilai tidak boleh negatif")
    .max(1000, "Nilai maksimal 1000"),
  feedback: z.string().max(2000, "Feedback maksimal 2000 karakter").optional(),
  rubricNotes: z.string().max(2000, "Catatan rubrik maksimal 2000 karakter").optional(),
});

type GradeFormValues = z.infer<typeof gradeSchema>;

interface AssignmentGradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: {
    id: string;
    fileName: string | null;
    fileUrl: string | null;
    submittedAt: string | null;
    score: number | null;
    feedback: string | null;
    rubricNotes: string | null;
    student: {
      id: string;
      name: string;
      email: string;
    };
    assignment: {
      id: string;
      title: string;
      maxScore: number;
    };
  };
  hasRubric?: boolean;
  onSwitchToRubricGrading?: () => void;
  onSuccess: () => void;
  token: string;
}

export function AssignmentGradeDialog({
  open,
  onOpenChange,
  submission,
  hasRubric,
  onSwitchToRubricGrading,
  onSuccess,
  token,
}: AssignmentGradeDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: {
      score: submission.score || 0,
      feedback: submission.feedback || "",
      rubricNotes: submission.rubricNotes || "",
    },
  });

  useEffect(() => {
    form.reset({
      score: submission.score || 0,
      feedback: submission.feedback || "",
      rubricNotes: submission.rubricNotes || "",
    });
  }, [submission, form]);

  const onSubmit = async (values: GradeFormValues) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assignments/submissions/${submission.id}/grade`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(values),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Penilaian berhasil disimpan");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.message || "Gagal menyimpan penilaian");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan penilaian");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Penilaian Tugas</DialogTitle>
          <DialogDescription>
            {submission.assignment.title} — {submission.student.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Mahasiswa</p>
                  <p className="font-medium">{submission.student.name}</p>
                  <p className="text-xs text-muted-foreground">{submission.student.email}</p>
                </div>
                {submission.submittedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground">Waktu Pengumpulan</p>
                    <p className="text-sm">
                      {new Date(submission.submittedAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {submission.fileUrl && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-10 w-10 text-accent" />
                    <div>
                      <p className="font-medium text-sm">{submission.fileName}</p>
                      <p className="text-xs text-muted-foreground">File tugas</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Form form={form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nilai (Maksimal: {submission.assignment.maxScore})
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max={submission.assignment.maxScore}
                        step="0.5"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Berikan feedback kepada mahasiswa..."
                        className="min-h-[120px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rubricNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan Rubrik (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Catatan penilaian berdasarkan rubrik..."
                        className="min-h-[100px] resize-none"
                        {...field}
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
                {hasRubric && onSwitchToRubricGrading && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      onOpenChange(false);
                      onSwitchToRubricGrading();
                    }}
                    disabled={loading}
                  >
                    Gunakan Rubrik
                  </Button>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan Penilaian"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
