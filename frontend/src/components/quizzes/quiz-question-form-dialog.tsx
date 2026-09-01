"use client";

import { useState, useEffect } from "react";
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

const questionSchema = z.object({
  questionText: z.string().min(1, "Pertanyaan wajib diisi").max(500, "Pertanyaan maksimal 500 karakter"),
  type: z.enum(["MULTIPLE_CHOICE", "ESSAY", "SHORT_ANSWER"]),
  points: z.number().min(1, "Poin minimal 1").max(100, "Poin maksimal 100"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().max(5000, "Penjelasan maksimal 5000 karakter").optional(),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

interface QuizQuestionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  onSuccess: () => void;
}

export function QuizQuestionFormDialog({
  open,
  onOpenChange,
  quizId,
  onSuccess,
}: QuizQuestionFormDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<string[]>(["", ""]);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionText: "",
      type: "MULTIPLE_CHOICE",
      points: 1,
      options: ["", ""],
      correctAnswer: "",
      explanation: "",
    },
  });

  const questionType = form.watch("type");

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      form.setValue("options", newOptions);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    form.setValue("options", newOptions);
  };

  const onSubmit = async (values: QuestionFormValues) => {
    setLoading(true);
    try {
      const payload: any = {
        questionText: values.questionText,
        type: values.type,
        points: values.points,
        explanation: values.explanation,
      };

      if (values.type === "MULTIPLE_CHOICE") {
        payload.options = options.filter((o) => o.trim() !== "");
        payload.correctAnswer = values.correctAnswer;
      } else if (values.type === "SHORT_ANSWER") {
        payload.correctAnswer = values.correctAnswer;
      }

      await apiFetch(`/quizzes/${quizId}/questions`, {
        method: "POST",
        body: JSON.stringify(payload),
      }, session?.accessToken || undefined);

      toast.success("Soal berhasil ditambahkan");
      onSuccess();
      onOpenChange(false);
      form.reset();
      setOptions(["", ""]);
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat menambahkan soal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle>Tambah Soal Kuis</DialogTitle>
          <DialogDescription id="dialog-description">
            Tambah soal baru ke kuis ini
          </DialogDescription>
        </DialogHeader>

        <Form form={form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="questionText">Pertanyaan</Label>
                  <FormControl>
                    <Textarea
                      id="questionText"
                      placeholder="Masukkan pertanyaan..."
                      className="min-h-[80px] resize-none"
                      aria-describedby="questionText-error"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage id="questionText-error" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="questionType">Tipe Soal</Label>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger id="questionType" aria-describedby="questionType-error">
                        <SelectValue placeholder="Pilih tipe soal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MULTIPLE_CHOICE">Pilihan Ganda</SelectItem>
                      <SelectItem value="ESSAY">Essay</SelectItem>
                      <SelectItem value="SHORT_ANSWER">Isian Singkat</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage id="questionType-error" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="points">Poin</Label>
                  <FormControl>
                    <Input
                      id="points"
                      type="number"
                      min="1"
                      max="100"
                      aria-describedby="points-error"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage id="points-error" />
                </FormItem>
              )}
            />

            {questionType === "MULTIPLE_CHOICE" && (
              <div className="space-y-2">
                <Label>Opsi Jawaban</Label>
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      id={`option-${index}`}
                      placeholder={`Opsi ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      aria-label={`Opsi jawaban ${index + 1}`}
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeOption(index)}
                        aria-label={`Hapus opsi ${index + 1}`}
                      >
                        <Trash2 className="icon-sm" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                ))}
                {options.length < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    aria-label="Tambah opsi jawaban"
                  >
                    <Plus className="mr-2 icon-sm" aria-hidden="true" />
                    Tambah Opsi
                  </Button>
                )}
              </div>
            )}

            {questionType === "MULTIPLE_CHOICE" && (
              <FormField
                control={form.control}
                name="correctAnswer"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="correctAnswerMC">Jawaban Benar</Label>
                    <FormControl>
                      <Input
                        id="correctAnswerMC"
                        placeholder="Masukkan jawaban yang benar (harus sama persis dengan salah satu opsi)"
                        aria-describedby="correctAnswerMC-error"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage id="correctAnswerMC-error" />
                  </FormItem>
                )}
              />
            )}

            {questionType === "SHORT_ANSWER" && (
              <FormField
                control={form.control}
                name="correctAnswer"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="correctAnswerSA">Jawaban Benar</Label>
                    <FormControl>
                      <Input
                        id="correctAnswerSA"
                        placeholder="Masukkan jawaban yang benar (case-insensitive)"
                        aria-describedby="correctAnswerSA-error"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage id="correctAnswerSA-error" />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="explanation">Penjelasan Soal (Opsional)</Label>
                  <FormControl>
                    <Textarea
                      id="explanation"
                      placeholder="Penjelasan yang akan ditampilkan setelah kuis selesai..."
                      className="min-h-[80px] resize-none"
                      aria-describedby="explanation-error"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage id="explanation-error" />
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
                {loading ? "Menyimpan..." : "Tambah Soal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}