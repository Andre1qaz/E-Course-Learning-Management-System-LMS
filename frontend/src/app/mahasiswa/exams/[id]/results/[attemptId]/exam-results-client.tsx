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
  explanation?: string;
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
    showExplanation?: boolean;
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
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite" aria-busy="true">
        <div className="text-center">
          <div className="animate-spin rounded-full icon-xl border-b-2 border-primary mx-auto mb-4" aria-hidden="true" />
          <p className="text-muted-foreground">Memuat hasil...</p>
        </div>
      </div>
    );
  }

  const scorePercentage = getScorePercentage();
  const passed = isPassed();

  return (
    <main className="min-h-screen bg-background" role="main" aria-label="Hasil ujian">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="font-display text-xl md:text-2xl lg:text-3xl font-bold">Hasil Ujian</h1>
          <p className="text-sm md:text-base text-muted-foreground">{attempt?.exam.title}</p>
        </div>

        {/* Score Card */}
        <Card className="mb-4 md:mb-6">
          <CardContent className="py-4 md:py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {passed ? (
                    <CheckCircle className="icon-lg text-success" aria-hidden="true" />
                  ) : (
                    <XCircle className="icon-lg text-destructive" aria-hidden="true" />
                  )}
                </div>
                <p className="text-2xl md:text-3xl font-bold" aria-live="polite">{attempt?.totalScore || 0}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Nilai Akhir</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold" aria-live="polite">{scorePercentage.toFixed(1)}%</p>
                <p className="text-xs md:text-sm text-muted-foreground">Persentase</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold">{attempt?.exam.maxScore || 100}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Nilai Maksimum</p>
              </div>
              <div className="text-center">
                <Badge variant={passed ? "default" : "destructive"} className="text-base md:text-lg px-3 md:px-4 py-2">
                  {passed ? "Lulus" : "Tidak Lulus"}
                </Badge>
                <p className="text-xs md:text-sm text-muted-foreground mt-2">
                  Batas Lulus: {attempt?.exam.passingGrade || 60}%
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs md:text-sm text-muted-foreground">Progress Nilai</span>
                <span className="text-xs md:text-sm font-medium" aria-live="polite">{scorePercentage.toFixed(1)}%</span>
              </div>
              <Progress
                value={scorePercentage}
                className="h-2 md:h-3"
                aria-label={`Skor: ${scorePercentage.toFixed(1)}% dari ${attempt?.exam.maxScore || 100}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={scorePercentage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Exam Info */}
        <Card className="mb-4 md:mb-6">
          <CardHeader>
            <CardTitle className="text-base md:text-lg" id="exam-info-title">Informasi Ujian</CardTitle>
          </CardHeader>
          <CardContent aria-labelledby="exam-info-title">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-xs md:text-sm">
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
            <CardTitle className="text-base md:text-lg" id="question-results-title">Detail Jawaban</CardTitle>
          </CardHeader>
          <CardContent aria-labelledby="question-results-title">
            <div className="space-y-3 md:space-y-4">
              {questions.map((question, index) => {
                const { answer } = getQuestionWithAnswer(question.id);
                const isCorrect = answer?.score === question.points;

                return (
                  <div key={question.id} className="p-3 md:p-4 rounded-lg border">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">Soal {index + 1}</Badge>
                          <Badge className="text-xs">{question.type}</Badge>
                          <Badge variant="secondary" className="text-xs">{question.points} poin</Badge>
                          {answer?.score !== undefined && (
                            <Badge variant={isCorrect ? "default" : "destructive"} className="text-xs">
                              {isCorrect ? "Benar" : "Salah"}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-sm md:text-base">{question.questionText}</h3>
                      </div>
                      {answer?.score !== undefined && (
                        <div className="text-right sm:text-left">
                          <p className="text-xl md:text-2xl font-bold">{answer.score}</p>
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
                              <span className="text-xs md:text-sm font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                              <span className="text-xs md:text-sm flex-1">{option.text}</span>
                              {isSelected && <Badge variant="outline" className="text-xs hidden sm:inline">Jawaban Anda</Badge>}
                              {isCorrectOption && <Badge variant="default" className="text-xs hidden sm:inline">Benar</Badge>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {question.type === "TRUE_FALSE" && (
                      <div className="mt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1 p-2 rounded bg-muted/50">
                            <span className="text-xs md:text-sm">Jawaban Anda: </span>
                            <span className="font-medium text-xs md:text-sm">{answer?.answerText || "-"}</span>
                          </div>
                          {question.options && (
                            <div className="flex-1 p-2 rounded bg-success/10">
                              <span className="text-xs md:text-sm">Jawaban Benar: </span>
                              <span className="font-medium text-xs md:text-sm">
                                {question.options.find((o) => o.isCorrect)?.text || "-"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {question.type === "ESSAY" && (
                      <div className="mt-4">
                        <div className="p-3 md:p-4 rounded bg-muted/50">
                          <p className="text-xs md:text-sm text-muted-foreground mb-2">Jawaban Anda:</p>
                          <p className="text-xs md:text-sm">{answer?.answerText || "Tidak ada jawaban"}</p>
                        </div>
                        {answer?.feedback && (
                          <div className="mt-2 p-3 md:p-4 rounded bg-primary/10">
                            <p className="text-xs md:text-sm text-muted-foreground mb-2">Feedback:</p>
                            <p className="text-xs md:text-sm">{answer.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {question.type === "SHORT_ANSWER" && (
                      <div className="mt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex-1 p-2 rounded bg-muted/50">
                            <span className="text-xs md:text-sm">Jawaban Anda: </span>
                            <span className="font-medium text-xs md:text-sm">{answer?.answerText || "-"}</span>
                          </div>
                          {question.options && (
                            <div className="flex-1 p-2 rounded bg-success/10">
                              <span className="text-xs md:text-sm">Jawaban Benar: </span>
                              <span className="font-medium text-xs md:text-sm">
                                {question.options.find((o) => o.isCorrect)?.text || "-"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {answer?.feedback && question.type !== "ESSAY" && (
                      <div className="mt-2 p-3 rounded bg-primary/10">
                        <p className="text-xs md:text-sm text-muted-foreground mb-1">Pembahasan:</p>
                        <p className="text-xs md:text-sm">{answer.feedback}</p>
                      </div>
                    )}

                    {question.explanation && attempt?.exam.showExplanation && (
                      <div className="mt-2 p-3 rounded bg-accent/10">
                        <p className="text-xs md:text-sm text-muted-foreground mb-1">Penjelasan Soal:</p>
                        <p className="text-xs md:text-sm">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-4 md:mt-6">
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <a href="/mahasiswa/courses">Kembali ke Courses</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
