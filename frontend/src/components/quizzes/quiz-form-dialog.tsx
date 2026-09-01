"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
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
import { apiFetch } from "@/lib/api";

const quizSchema = z.object({
  title: z.string().min(1, "Judul kuis wajib diisi").max(200, "Judul maksimal 200 karakter"),
  description: z.string().max(2000, "Deskripsi maksimal 2000 karakter").optional(),
  duration: z.number().min(1, "Durasi minimal 1 menit").max(480, "Durasi maksimal 480 menit"),
  passingScore: z.number().min(0, "Nilai lulus minimal 0").max(100, "Nilai lulus maksimal 100"),
  allowRetake: z.boolean().optional(),
  maxAttempts: z.number().min(1, "Maksimal percobaan minimal 1").max(10, "Maksimal percobaan maksimal 10"),
  isPublished: z.boolean().optional(),
  showResults: z.boolean().optional(),
  showExplanation: z.boolean().optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
});

type QuizFormValues = z.infer<typeof quizSchema>;

interface QuizFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: string;
  quiz?: {
    id: string;
    title: string;
    description: string | null;
    duration: number;
    passingScore: number;
    allowRetake: boolean;
    maxAttempts: number;
    isPublished: boolean;
    showResults: boolean;
    showExplanation: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
  } | null;
  onSuccess: () => void;
}

export function QuizFormDialog({
  open,
  onOpenChange,
  activityId,
  quiz,
  onSuccess,
}: QuizFormDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const isEdit = !!quiz;

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: quiz?.title || "",
      description: quiz?.description || "",
      duration: quiz?.duration || 30,
      passingScore: quiz?.passingScore || 60,
      allowRetake: quiz?.allowRetake || false,
      maxAttempts: quiz?.maxAttempts || 1,
      isPublished: quiz?.isPublished || false,
      showResults: quiz?.showResults !== undefined ? quiz.showResults : true,
      showExplanation: quiz?.showExplanation || false,
      shuffleQuestions: quiz?.shuffleQuestions || false,
      shuffleOptions: quiz?.shuffleOptions || false,
    },
  });

  useEffect(() => {
    if (quiz) {
      form.reset({
        title: quiz.title,
        description: quiz.description || "",
        duration: quiz.duration,
        passingScore: quiz.passingScore,
        allowRetake: quiz.allowRetake,
        maxAttempts: quiz.maxAttempts,
        isPublished: quiz.isPublished,
        showResults: quiz.showResults,
        showExplanation: quiz.showExplanation,
        shuffleQuestions: quiz.shuffleQuestions,
        shuffleOptions: quiz.shuffleOptions,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        duration: 30,
        passingScore: 60,
        allowRetake: false,
        maxAttempts: 1,
        isPublished: false,
        showResults: true,
        showExplanation: false,
        shuffleQuestions: false,
        shuffleOptions: false,
      });
    }
  }, [quiz, form]);

  const onSubmit = async (values: QuizFormValues) => {
    setLoading(true);
    try {
      const url = isEdit
        ? `/quizzes/${quiz.id}`
        : `/quizzes/activity/${activityId}`;

      const payload = {
        title: values.title,
        description: values.description?.trim() || undefined,
        duration: values.duration,
        passingScore: values.passingScore,
        allowRetake: values.allowRetake,
        maxAttempts: values.maxAttempts,
        isPublished: values.isPublished,
        showResults: values.showResults,
        showExplanation: values.showExplanation,
        shuffleQuestions: values.shuffleQuestions,
        shuffleOptions: values.shuffleOptions,
      };

      const result = await apiFetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      }, session?.accessToken || undefined);

      toast.success(isEdit ? "Kuis berhasil diperbarui" : "Kuis berhasil dibuat");
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error("Terjadi kesalahan saat menyimpan kuis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Kuis" : "Buat Kuis Baru"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Edit detail kuis yang ada." : "Buat kuis baru untuk aktivitas ini."}
          </DialogDescription>
        </DialogHeader>

        <Form form={form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Judul Kuis</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan judul kuis" {...field} />
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
                      placeholder="Deskripsi kuis (opsional)"
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
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durasi (menit)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="480"
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
              name="passingScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nilai Lulus (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
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
              name="maxAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maksimal Percobaan</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="10"
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
              name="allowRetake"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Izinkan Percobaan Ulang</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Mahasiswa dapat mengulang kuis jika gagal
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

            <FormField
              control={form.control}
              name="showResults"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Tampilkan Hasil</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Mahasiswa dapat melihat hasil kuis
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

            <FormField
              control={form.control}
              name="showExplanation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Tampilkan Penjelasan</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Tampilkan penjelasan setelah kuis selesai
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

            <FormField
              control={form.control}
              name="shuffleQuestions"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Acak Urutan Soal</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Soal akan ditampilkan dalam urutan acak
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

            <FormField
              control={form.control}
              name="shuffleOptions"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Acak Opsi Jawaban</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Opsi jawaban akan ditampilkan dalam urutan acak
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

            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Publish Kuis</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Kuis akan terlihat oleh mahasiswa setelah dipublish
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
                {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Kuis"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}