"use client";

import { useEffect, useState } from "react";
import { Clock, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Question {
  id: string;
  type: string;
  questionText: string;
  points: number;
  order: number;
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  startTime: string;
  deadline: string;
  isPublished: boolean;
}

interface ExamTakingClientProps {
  examId: string;
  token: string;
}

export function ExamTakingClient({ examId, token }: ExamTakingClientProps) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExam();
    startExam();
  }, [examId]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0) {
      handleSubmitExam();
    }
  }, [timeRemaining]);

  const fetchExam = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exams/${examId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setExam(result.data);
      }
    } catch (error) {
      toast.error("Gagal memuat ujian");
    }
  };

  const startExam = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exams/${examId}/start`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setAttemptId(result.data.id);
        fetchQuestions();
        
        // Calculate time remaining
        const duration = exam?.duration || 60;
        const startedAt = new Date(result.data.startedAt || new Date());
        const endTime = new Date(startedAt.getTime() + duration * 60 * 1000);
        const now = new Date();
        const remaining = Math.floor((endTime.getTime() - now.getTime()) / 1000);
        setTimeRemaining(Math.max(0, remaining));
      } else {
        toast.error(result.message || "Gagal memulai ujian");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memulai ujian");
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
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

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    // Auto-save answer
    autoSaveAnswer(questionId, answer);
  };

  const autoSaveAnswer = async (questionId: string, answer: string) => {
    if (!attemptId) return;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exams/attempts/${attemptId}/auto-save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ questionId, answer }),
        }
      );
    } catch (error) {
      // Silent fail for auto-save, don't interrupt user
      // Intentionally not showing toast to avoid disrupting exam experience
    }
  };

  const handleSubmitExam = async () => {
    if (!attemptId) return;

    if (!confirm("Apakah Anda yakin ingin menyelesaikan ujian ini?")) return;

    try {
      setSubmitting(true);

      const answerPayload = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exams/attempts/${attemptId}/submit`,
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
        toast.success("Ujian berhasil dikumpulkan");
        // Redirect to results page
        window.location.href = `/mahasiswa/exams/${examId}/results/${attemptId}`;
      } else {
        toast.error(result.message || "Gagal mengumpulkan ujian");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengumpulkan ujian");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat ujian...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-6">
        {/* Header with Timer */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">{exam?.title}</h1>
            <p className="text-muted-foreground">
              Soal {currentQuestionIndex + 1} dari {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {answeredCount} / {questions.length} dijawab
            </Badge>
            <Card className="flex items-center gap-2 px-4 py-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className={`font-mono text-xl font-bold ${timeRemaining < 300 ? "text-destructive" : ""}`}>
                {formatTime(timeRemaining)}
              </span>
            </Card>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 mb-6">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline">Soal {currentQuestionIndex + 1}</Badge>
                    <Badge>{currentQuestion.type}</Badge>
                    <Badge variant="secondary">{currentQuestion.points} poin</Badge>
                  </div>
                  <CardTitle className="text-xl">{currentQuestion.questionText}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {currentQuestion.type === "MULTIPLE_CHOICE" && currentQuestion.options && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                >
                  {currentQuestion.options.map((option, index) => (
                    <div key={option.id} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                      <RadioGroupItem value={option.id} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                        {String.fromCharCode(65 + index)}. {option.text}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === "TRUE_FALSE" && (
                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                >
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value="true" id="true" />
                    <Label htmlFor="true" className="flex-1 cursor-pointer">
                      True
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value="false" id="false" />
                    <Label htmlFor="false" className="flex-1 cursor-pointer">
                      False
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {currentQuestion.type === "ESSAY" && (
                <Textarea
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Tulis jawaban Anda di sini..."
                  rows={8}
                  className="w-full"
                />
              )}

              {currentQuestion.type === "SHORT_ANSWER" && (
                <Input
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Jawaban singkat..."
                  className="w-full"
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Sebelumnya
          </Button>

          <div className="flex gap-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={index === currentQuestionIndex ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentQuestionIndex(index)}
                className={answers[questions[index].id] ? "bg-success hover:bg-success/90" : ""}
              >
                {index + 1}
              </Button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={handleSubmitExam} disabled={submitting}>
              {submitting ? "Mengumpulkan..." : "Selesai & Kumpulkan"}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            >
              Selanjutnya
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Warning for time running out */}
        {timeRemaining < 300 && timeRemaining > 0 && (
          <Card className="mt-6 border-destructive bg-destructive/10">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive font-medium">
                Waktu tinggal {formatTime(timeRemaining)}. Pastikan Anda sudah menjawab semua soal.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
