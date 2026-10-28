"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// Heuristic #1: Visibility of System Status — show timer and progress
// Heuristic #3: User Control and Freedom — allow navigation between questions
// Heuristic #16: Instructional Assessment — clear question presentation

interface ExamTakingProps {
  examId: string;
  examTitle: string;
  duration: number;
  questions: Array<{
    id: string;
    questionText: string;
    type: string;
    points: number;
    options?: Array<{
      id: string;
      optionText: string;
    }>;
  }>;
  onSubmit: (answers: Array<{ questionId: string; answer?: string; essayAnswer?: string }>) => void;
  onCancel: () => void;
}

export function ExamTaking({
  examId,
  examTitle,
  duration,
  questions,
  onSubmit,
  onCancel,
}: ExamTakingProps) {
  const { data: session } = useSession();
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert to seconds
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hasStarted, setHasStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cheatLog, setCheatLog] = useState<number[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const blurCountRef = useRef(0);

  useEffect(() => {
    // Start exam attempt
    const startExam = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/exams/${examId}/start`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session?.accessToken ?? ""}`,
            },
          }
        );

        const result = await response.json();

        if (result.success) {
          setAttemptId(result.data.id);
          setHasStarted(true);
          startTimer();
        } else {
          toast.error(result.message || "Gagal memulai ujian");
          onCancel();
        }
      } catch (error) {
        toast.error("Terjadi kesalahan saat memulai ujian");
        onCancel();
      }
    };

    startExam();

    // Anti-cheat: detect tab/window switch
    const handleVisibilityChange = () => {
      if (document.hidden && hasStarted) {
        blurCountRef.current += 1;
        const timestamp = Date.now();
        setCheatLog((prev) => [...prev, timestamp]);
        toast.warning(`Peringatan: Jangan pindah tab/window! (${blurCountRef.current}x)`);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [examId, hasStarted, onCancel]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!attemptId) return;

    setLoading(true);

    // Prepare answers for submission
    const submissionAnswers = questions.map((q) => ({
      questionId: q.id,
      answer: q.type !== "ESSAY" ? answers[q.id] : undefined,
      essayAnswer: q.type === "ESSAY" ? answers[q.id] : undefined,
    }));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exams/attempts/${attemptId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken ?? ""}`,
          },
          body: JSON.stringify({ answers: submissionAnswers }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Ujian berhasil dikumpulkan");
        onSubmit(submissionAnswers);
      } else {
        toast.error(result.message || "Gagal mengumpulkan ujian");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengumpulkan ujian");
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isTimeWarning = timeLeft < 300; // Less than 5 minutes
  const isTimeCritical = timeLeft < 60; // Less than 1 minute

  if (!hasStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="skeleton h-8 w-32 mx-auto mb-4" />
            <p className="text-muted-foreground">Memuat ujian...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Timer Header */}
      <div
        className={`sticky top-0 z-10 px-6 py-4 border-b ${
          isTimeCritical
            ? "bg-destructive text-destructive-foreground"
            : isTimeWarning
            ? "bg-warning text-warning-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold">{examTitle}</h1>
            <p className="text-sm opacity-80">
              Soal {currentQuestionIndex + 1} dari {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="text-2xl font-bold font-mono">
                {formatTime(timeLeft)}
              </span>
            </div>
            {isTimeWarning && (
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Question Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {questions.map((q, index) => (
            <Button
              key={q.id}
              variant={index === currentQuestionIndex ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentQuestionIndex(index)}
              className={`min-w-[40px] ${
                answers[q.id] ? "bg-success text-success-foreground" : ""
              }`}
            >
              {index + 1}
            </Button>
          ))}
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-start justify-between">
              <span className="flex-1">{currentQuestion.questionText}</span>
              <span className="text-sm font-normal text-muted-foreground ml-4">
                {currentQuestion.points} poin
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion.type === "MULTIPLE_CHOICE" && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value: string) =>
                  handleAnswerChange(currentQuestion.id, value)
                }
              >
                {currentQuestion.options?.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <RadioGroupItem value={option.id} id={option.id} />
                    <label
                      htmlFor={option.id}
                      className="flex-1 cursor-pointer"
                    >
                      {option.optionText}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === "SHORT_ANSWER" && (
              <Input
                placeholder="Masukkan jawaban Anda..."
                value={answers[currentQuestion.id] || ""}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, e.target.value)
                }
              />
            )}

            {currentQuestion.type === "ESSAY" && (
              <Textarea
                placeholder="Tulis jawaban essay Anda di sini..."
                className="min-h-[200px] resize-none"
                value={answers[currentQuestion.id] || ""}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, e.target.value)
                }
              />
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={currentQuestionIndex === 0}
              >
                Sebelumnya
              </Button>

              {currentQuestionIndex === questions.length - 1 ? (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Mengumpulkan..." : "Kumpulkan Ujian"}
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    setCurrentQuestionIndex((prev) =>
                      Math.min(questions.length - 1, prev + 1)
                    )
                  }
                >
                  Selanjutnya
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="mt-6 flex justify-end">
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Mengumpulkan..." : "Kumpulkan Ujian"}
          </Button>
        </div>
      </div>
    </div>
  );
}
