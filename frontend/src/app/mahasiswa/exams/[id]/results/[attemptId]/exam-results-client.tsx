"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, Award, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  exam: {
    id: string;
    title: string;
    duration: number;
    maxScore?: number;
    passingGrade?: number;
  };
}

interface ExamResultsClientProps {
  examId: string;
  attemptId: string;
  token: string;
}

export function ExamResultsClient({ examId, attemptId, token }: ExamResultsClientProps) {
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

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
      }
    } catch (error) {
      toast.error("Gagal memuat hasil ujian");
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

  const getScorePercentage = () => {
    if (!attempt?.totalScore || !attempt.exam.maxScore) return 0;
    return (attempt.totalScore / attempt.exam.maxScore) * 100;
  };

  const isPassed = () => {
    const percentage = getScorePercentage();
    const passingGrade = attempt?.exam.passingGrade || 60;
    return percentage >= passingGrade;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat hasil...</p>
        </div>
      </div>
    );
  }

  const scorePercentage = getScorePercentage();
  const passed = isPassed();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">Hasil Ujian</h1>
          <p className="text-muted-foreground">{attempt?.exam.title}</p>
        </div>

        {/* Score Card */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {passed ? (
                    <CheckCircle className="h-8 w-8 text-success" />
                  ) : (
                    <XCircle className="h-8 w-8 text-destructive" />
                  )}
                </div>
                <p className="text-3xl font-bold">{attempt?.totalScore || 0}</p>
                <p className="text-sm text-muted-foreground">Nilai Akhir</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{scorePercentage.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Persentase</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">{attempt?.exam.maxScore || 100}</p>
                <p className="text-sm text-muted-foreground">Nilai Maksimum</p>
              </div>
              <div className="text-center">
                <Badge variant={passed ? "default" : "destructive"} className="text-lg px-4 py-2">
                  {passed ? "Lulus" : "Tidak Lulus"}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Batas Lulus: {attempt?.exam.passingGrade || 60}%
                </p>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress Nilai</span>
                <span className="text-sm font-medium">{scorePercentage.toFixed(1)}%</span>
              </div>
              <Progress value={scorePercentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Exam Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informasi Ujian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Waktu Mulai</p>
                <p className="font-medium">{attempt?.startedAt ? formatDate(attempt.startedAt) : "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Waktu Selesai</p>
                <p className="font-medium">{attempt?.submittedAt ? formatDate(attempt.submittedAt) : "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Durasi</p>
                <p className="font-medium">{attempt?.exam.duration} menit</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={attempt?.status === "GRADED" ? "default" : "secondary"}>
                  {attempt?.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Results */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Jawaban</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.map((question, index) => {
                const { answer } = getQuestionWithAnswer(question.id);
                const isCorrect = answer?.score === question.points;

                return (
                  <div key={question.id} className="p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline">Soal {index + 1}</Badge>
                          <Badge>{question.type}</Badge>
                          <Badge variant="secondary">{question.points} poin</Badge>
                          {answer?.score !== undefined && (
                            <Badge variant={isCorrect ? "default" : "destructive"}>
                              {isCorrect ? "Benar" : "Salah"}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium">{question.questionText}</p>
                      </div>
                      {answer?.score !== undefined && (
                        <div className="text-right">
                          <p className="text-2xl font-bold">{answer.score}</p>
                          <p className="text-xs text-muted-foreground">/ {question.points}</p>
                        </div>
                      )}
                    </div>

                    {question.type === "MULTIPLE_CHOICE" && question.options && (
                      <div className="space-y-2 mt-4">
                        {question.options.map((option, optIndex) => {
                          const isSelected = answer?.selectedOptionId === option.id;
                          const isCorrectOption = option.isCorrect;

                          return (
                            <div
                              key={option.id}
                              className={`flex items-center gap-2 p-2 rounded ${
                                isSelected && isCorrectOption
                                  ? "bg-success/20 border-success"
                                  : isSelected && !isCorrectOption
                                  ? "bg-destructive/20 border-destructive"
                                  : isCorrectOption
                                  ? "bg-success/10 border-success/30"
                                  : "bg-muted/50"
                              }`}
                            >
                              <span className="text-sm font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                              <span className="text-sm flex-1">{option.text}</span>
                              {isSelected && <Badge variant="outline">Jawaban Anda</Badge>}
                              {isCorrectOption && <Badge variant="default">Benar</Badge>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {question.type === "TRUE_FALSE" && (
                      <div className="mt-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 p-2 rounded bg-muted/50">
                            <span className="text-sm">Jawaban Anda: </span>
                            <span className="font-medium">{answer?.answerText || "-"}</span>
                          </div>
                          {question.options && (
                            <div className="flex-1 p-2 rounded bg-success/10">
                              <span className="text-sm">Jawaban Benar: </span>
                              <span className="font-medium">
                                {question.options.find((o) => o.isCorrect)?.text || "-"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {question.type === "ESSAY" && (
                      <div className="mt-4">
                        <div className="p-4 rounded bg-muted/50">
                          <p className="text-sm text-muted-foreground mb-2">Jawaban Anda:</p>
                          <p className="text-sm">{answer?.answerText || "Tidak ada jawaban"}</p>
                        </div>
                        {answer?.feedback && (
                          <div className="mt-2 p-4 rounded bg-primary/10">
                            <p className="text-sm text-muted-foreground mb-2">Feedback:</p>
                            <p className="text-sm">{answer.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {question.type === "SHORT_ANSWER" && (
                      <div className="mt-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 p-2 rounded bg-muted/50">
                            <span className="text-sm">Jawaban Anda: </span>
                            <span className="font-medium">{answer?.answerText || "-"}</span>
                          </div>
                          {question.options && (
                            <div className="flex-1 p-2 rounded bg-success/10">
                              <span className="text-sm">Jawaban Benar: </span>
                              <span className="font-medium">
                                {question.options.find((o) => o.isCorrect)?.text || "-"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {answer?.feedback && question.type !== "ESSAY" && (
                      <div className="mt-2 p-3 rounded bg-primary/10">
                        <p className="text-sm text-muted-foreground mb-1">Pembahasan:</p>
                        <p className="text-sm">{answer.feedback}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-6">
          <Button variant="outline" asChild>
            <a href="/mahasiswa/courses">Kembali ke Courses</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
