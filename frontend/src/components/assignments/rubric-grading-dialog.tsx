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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileText, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// Heuristic #16: Instructional Assessment — detailed rubric-based grading
// Heuristic #5: Error Prevention — validate assessment before submission

const rubricAssessmentSchema = z.object({
  assessments: z.array(
    z.object({
      rubricCriterionId: z.string(),
      rubricCriterionLevelId: z.string().optional(),
      score: z.number().min(0, "Nilai tidak boleh negatif"),
      feedback: z.string().max(1000, "Feedback maksimal 1000 karakter").optional(),
    })
  ),
});

type RubricAssessmentFormValues = z.infer<typeof rubricAssessmentSchema>;

interface RubricGradingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: {
    id: string;
    fileName: string | null;
    fileUrl: string | null;
    submittedAt: string | null;
    score: number | null;
    feedback: string | null;
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
  rubric: {
    id: string;
    name: string;
    totalPoints: number;
    criteria: Array<{
      id: string;
      name: string;
      description: string | null;
      maxPoints: number;
      order: number;
      levels: Array<{
        id: string;
        name: string;
        description: string;
        points: number;
        order: number;
      }>;
    }>;
  };
  existingAssessments?: Array<{
    id: string;
    rubricCriterionId: string;
    rubricCriterionLevelId: string | null;
    score: number;
    feedback: string | null;
  }>;
  onSuccess: () => void;
}

export function RubricGradingDialog({
  open,
  onOpenChange,
  submission,
  rubric,
  existingAssessments,
  onSuccess,
}: RubricGradingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  const form = useForm<RubricAssessmentFormValues>({
    resolver: zodResolver(rubricAssessmentSchema),
    defaultValues: {
      assessments: rubric.criteria.map((criterion) => {
        const existing = existingAssessments?.find(
          (a) => a.rubricCriterionId === criterion.id
        );
        return {
          rubricCriterionId: criterion.id,
          rubricCriterionLevelId: existing?.rubricCriterionLevelId || undefined,
          score: existing?.score || 0,
          feedback: existing?.feedback || "",
        };
      }),
    },
  });

  useEffect(() => {
    if (existingAssessments) {
      const assessments = rubric.criteria.map((criterion) => {
        const existing = existingAssessments.find(
          (a) => a.rubricCriterionId === criterion.id
        );
        return {
          rubricCriterionId: criterion.id,
          rubricCriterionLevelId: existing?.rubricCriterionLevelId || undefined,
          score: existing?.score || 0,
          feedback: existing?.feedback || "",
        };
      });
      form.reset({ assessments });
      calculateTotal(assessments);
    } else {
      const assessments = rubric.criteria.map((criterion) => ({
        rubricCriterionId: criterion.id,
        rubricCriterionLevelId: undefined,
        score: 0,
        feedback: "",
      }));
      form.reset({ assessments });
      calculateTotal(assessments);
    }
  }, [existingAssessments, rubric, form]);

  const calculateTotal = (assessments: any[]) => {
    const total = assessments.reduce((sum, a) => sum + (a.score || 0), 0);
    setTotalScore(total);
  };

  const handleLevelSelect = (criterionIndex: number, level: any) => {
    const currentAssessments = form.getValues("assessments");
    currentAssessments[criterionIndex] = {
      ...currentAssessments[criterionIndex],
      rubricCriterionLevelId: level.id,
      score: level.points,
    };
    form.setValue("assessments", currentAssessments);
    calculateTotal(currentAssessments);
  };

  const handleScoreChange = (criterionIndex: number, score: number) => {
    const currentAssessments = form.getValues("assessments");
    currentAssessments[criterionIndex] = {
      ...currentAssessments[criterionIndex],
      score,
    };
    form.setValue("assessments", currentAssessments);
    calculateTotal(currentAssessments);
  };

  const onSubmit = async (values: RubricAssessmentFormValues) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rubrics/submissions/${submission.id}/assess`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(values),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Penilaian rubrik berhasil disimpan");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.message || "Gagal menyimpan penilaian rubrik");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan penilaian rubrik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Penilaian dengan Rubrik</DialogTitle>
          <DialogDescription>
            {submission.assignment.title} — {submission.student.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Student Info */}
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

          {/* Submitted File */}
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

          {/* Total Score */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Nilai</p>
                  <p className="text-2xl font-bold text-primary">
                    {totalScore} / {rubric.totalPoints}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Persentase</p>
                  <p className="text-lg font-semibold">
                    {((totalScore / rubric.totalPoints) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rubric Grading Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                {rubric.criteria.map((criterion, index) => (
                  <Card key={criterion.id}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{criterion.name}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                          Max: {criterion.maxPoints} poin
                        </span>
                      </CardTitle>
                      {criterion.description && (
                        <p className="text-sm text-muted-foreground">{criterion.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Level Selection */}
                      <div>
                        <p className="text-sm font-medium mb-2">Pilih Level Penilaian:</p>
                        <FormField
                          control={form.control}
                          name={`assessments.${index}.rubricCriterionLevelId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <RadioGroup
                                  value={field.value || ""}
                                  onValueChange={(value) => {
                                    const selectedLevel = criterion.levels.find((l) => l.id === value);
                                    if (selectedLevel) {
                                      handleLevelSelect(index, selectedLevel);
                                    }
                                  }}
                                >
                                  {criterion.levels.map((level) => (
                                    <div
                                      key={level.id}
                                      className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                                      onClick={() => handleLevelSelect(index, level)}
                                    >
                                      <RadioGroupItem value={level.id} id={`level-${level.id}`} />
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <label
                                            htmlFor={`level-${level.id}`}
                                            className="font-medium cursor-pointer"
                                          >
                                            {level.name}
                                          </label>
                                          <span className="text-sm font-semibold text-primary">
                                            {level.points} poin
                                          </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {level.description}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Manual Score Override */}
                      <div>
                        <FormField
                          control={form.control}
                          name={`assessments.${index}.score`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nilai Manual (Opsional)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max={criterion.maxPoints}
                                  step="0.5"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(Number(e.target.value));
                                    handleScoreChange(index, Number(e.target.value));
                                  }}
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground">
                                Override nilai yang dipilih dari level (0-{criterion.maxPoints})
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Criterion Feedback */}
                      <FormField
                        control={form.control}
                        name={`assessments.${index}.feedback`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Feedback per Kriteria (Opsional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Berikan feedback spesifik untuk kriteria ini..."
                                className="min-h-[80px] resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>

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
