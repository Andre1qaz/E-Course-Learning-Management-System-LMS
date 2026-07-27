"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Question {
  id: string;
  type: string;
  questionText: string;
  points: number;
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
}

interface Answer {
  id: string;
  questionId: string;
  answerText?: string;
  selectedOptionId?: string;
  score?: number;
  feedback?: string;
}

interface ExamAttempt {
  id: string;
  startedAt: string;
  submittedAt: string;
  totalScore?: number;
  status: string;
  answers: Answer[];
  student: {
    id: string;
    name: string;
    email: string;
  };
  exam: {
    id: string;
    title: string;
    maxScore?: number;
    passingGrade?: number;
  };
}

interface ExamGradingClientProps {
  examId: string;
  attemptId: string;
  token: string;
}

export function ExamGradingClient({ examId, attemptId, token }: ExamGradingClientProps) {
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [grades, setGrades] = useState<Record<string, { score: number; feedback: string }>>({});

  useEffect(() => {
    fetchAttempt();
    fetchQuestions();
  }, [examId, attemptId]);

  const fetchAttempt = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exams/attempts/${attemptId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setAttempt(result.data);
        // Initialize grades from existing answers
        const initialGrades: Record<string, { score: number; feedback: string }> = {};
        result.data.answers.forEach((answer: Answer) => {
          if (answer.score !== undefined || answer.feedback) {
            initialGrades[answer.questionId] = {
              score: answer.score || 0,
              feedback: answer.feedback || "",
            };
          }
        });
        setGrades(initialGrades);
      }
    } catch (error) {
      toast.error("Gagal memuat jawaban ujian");
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exams/${examId}/questions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setQuestions(result.data);
      }
    } catch (error) {
      toast.error("Gagal memuat soal");
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (questionId: string, field: "score" | "feedback", value: string | number) => {
    setGrades((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  const handleSubmitGrades = async () => {
    try {
      setSaving(true);

      const answerPayload = Object.entries(grades).map(([questionId, data]) => ({
        questionId,
        score: data.score,
        feedback: data.feedback,
      }));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exams/attempts/${attemptId}/grade`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answers: answerPayload }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Penilaian berhasil disimpan");
        fetchAttempt(); // Refresh to get updated total score
      } else {
        toast.error(result.message || "Gagal menyimpan penilaian");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan penilaian");
    } finally {
      setSaving(false);
    }
  };

  const getQuestionWithAnswer = (questionId: string) => {
    const question = questions.find((q) => q.id === questionId);
    const answer = attempt?.answers.find((a) => a.questionId === questionId);
    return { question, answer };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateTotalScore = () => {
    let total = 0;
    Object.values(grades).forEach((grade) => {
      total += grade.score;
    });
    // Add auto-graded questions (not in grades)
    attempt?.answers.forEach((answer) => {
      if (!grades[answer.questionId] && answer.score !== undefined) {
        total += answer.score;
      }
    });
    return total;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat jawaban...</p>
        </div>
      </div>
    );
  }

  const totalScore = calculateTotalScore();
  const maxScore = attempt?.exam.maxScore || 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Penilaian Ujian</h1>
            <p className="text-muted-foreground">{attempt?.exam.title}</p>
          </div>
          <Button onClick={handleSubmitGrades} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Menyimpan..." : "Simpan Penilaian"}
          </Button>
        </div>

        {/* Student Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informasi Mahasiswa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Nama</p>
                  <p className="font-medium">{attempt?.student.name}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{attempt?.student.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Waktu Selesai</p>
                  <p className="font-medium">{attempt?.submittedAt ? formatDate(attempt.submittedAt) : "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Nilai Saat Ini</p>
                <p className="text-2xl font-bold">{totalScore} / {maxScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions for Grading */}
        <div className="space-y-4">
          {questions.map((question, index) => {
            const { answer } = getQuestionWithAnswer(question.id);
            const grade = grades[question.id];
            const needsGrading = question.type === "ESSAY" || question.type === "SHORT_ANSWER";

            return (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">Soal {index + 1}</Badge>
                        <Badge>{question.type}</Badge>
                        <Badge variant="secondary">{question.points} poin</Badge>
                        {needsGrading && (
                          <Badge variant="outline">Perlu Penilaian Manual</Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg">{question.questionText}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Student Answer */}
                  <div className="mb-4 p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground mb-2">Jawaban Mahasiswa:</p>
                    <p className="text-sm">{answer?.answerText || "Tidak ada jawaban"}</p>
                  </div>

                  {/* Auto-graded result */}
                  {!needsGrading && answer?.score !== undefined && (
                    <div className="mb-4 flex items-center gap-2">
                      {answer.score === question.points ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <span className="font-medium">
                        {answer.score} / {question.points} poin (Otomatis)
                      </span>
                    </div>
                  )}

                  {/* Manual Grading */}
                  {needsGrading && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`score-${question.id}`}>Nilai (0-{question.points})</Label>
                          <Input
                            id={`score-${question.id}`}
                            type="number"
                            min="0"
                            max={question.points}
                            value={grade?.score || 0}
                            onChange={(e) => handleGradeChange(question.id, "score", parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`feedback-${question.id}`}>Feedback</Label>
                        <Textarea
                          id={`feedback-${question.id}`}
                          value={grade?.feedback || ""}
                          onChange={(e) => handleGradeChange(question.id, "feedback", e.target.value)}
                          placeholder="Berikan feedback untuk jawaban ini..."
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  {/* Existing feedback for auto-graded */}
                  {!needsGrading && answer?.feedback && (
                    <div className="mt-4 p-3 rounded bg-primary/10">
                      <p className="text-sm text-muted-foreground mb-1">Feedback:</p>
                      <p className="text-sm">{answer.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Ringkasan Penilaian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold">{totalScore}</p>
                <p className="text-sm text-muted-foreground">Total Nilai</p>
              </div>
              <div>
                <p className="text-3xl font-bold">{maxScore}</p>
                <p className="text-sm text-muted-foreground">Nilai Maksimum</p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {((totalScore / maxScore) * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Persentase</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
