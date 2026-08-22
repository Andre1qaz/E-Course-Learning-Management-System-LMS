"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch, ApiError } from "@/lib/api";

interface QuestionOption {
  id: string;
  text?: string;
  optionText?: string;
}

interface Question {
  id: string;
  type: string;
  questionText: string;
  points: number;
  order: number;
  maxChars?: number | null;
  options?: QuestionOption[];
}

interface ExamAttemptSummary {
  id: string;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  totalScore: number | null;
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  startTime: string;
  deadline: string;
  isPublished: boolean;
  allowBack?: boolean;
  autoSubmit?: boolean;
  shuffleQuestions?: boolean;
  questionCount?: number;
  questions?: Question[];
  myAttempt?: ExamAttemptSummary | null;
  course?: { id: string; name: string };
}

interface StartAttemptData {
  id: string;
  alreadySubmitted?: boolean;
  remainingSeconds?: number;
  questions?: Question[];
  savedAnswers?: Record<string, string>;
  submittedAt?: string | null;
  exam?: Partial<Exam>;
}

interface ExamTakingClientProps {
  examId: string;
  token: string;
}

type Phase = "loading" | "lobby" | "taking" | "blocked";

function optionLabel(option: QuestionOption) {
  return option.text || option.optionText || "";
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function ExamTakingClient({ examId, token }: ExamTakingClientProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [blockedReason, setBlockedReason] = useState("");
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const answersRef = useRef(answers);
  const attemptIdRef = useRef(attemptId);
  const submittingRef = useRef(false);
  const autoSubmitRef = useRef(false);
  const saveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  answersRef.current = answers;
  attemptIdRef.current = attemptId;

  const closedAttempt =
    exam?.myAttempt?.status === "SUBMITTED" || exam?.myAttempt?.status === "GRADED";
  const inProgressAttempt = exam?.myAttempt?.status === "IN_PROGRESS";

  const loadExam = useCallback(async () => {
    try {
      setPhase("loading");
      const result = await apiFetch<Exam>(`/exams/${examId}`, {}, token);
      const data = result.data;
      if (!data) {
        setBlockedReason("Ujian tidak ditemukan.");
        setPhase("blocked");
        return;
      }

      setExam(data);

      if (data.myAttempt && (data.myAttempt.status === "SUBMITTED" || data.myAttempt.status === "GRADED")) {
        router.replace(`/mahasiswa/exams/${examId}/results/${data.myAttempt.id}`);
        return;
      }

      const now = Date.now();
      const start = new Date(data.startTime).getTime();
      const deadline = new Date(data.deadline).getTime();
      const questionCount = data.questionCount ?? data.questions?.length ?? 0;

      if (!data.isPublished) {
        setBlockedReason("Ujian ini belum dipublikasikan.");
        setPhase("blocked");
        return;
      }

      if (questionCount === 0 && data.myAttempt?.status !== "IN_PROGRESS") {
        setBlockedReason("Ujian ini belum memiliki soal.");
        setPhase("blocked");
        return;
      }

      if (now < start) {
        setBlockedReason("Ujian belum dimulai. Silakan kembali sesuai jadwal.");
        setPhase("blocked");
        return;
      }

      if (now > deadline && data.myAttempt?.status !== "IN_PROGRESS") {
        setBlockedReason("Batas waktu ujian sudah lewat.");
        setPhase("blocked");
        return;
      }

      setPhase("lobby");
    } catch (error) {
      setBlockedReason(errorMessage(error, "Gagal memuat ujian"));
      setPhase("blocked");
    }
  }, [examId, router, token]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  const handleSubmitExam = useCallback(
    async (autoSubmitted = false) => {
      const currentAttemptId = attemptIdRef.current;
      if (!currentAttemptId || submittingRef.current) return;

      if (!autoSubmitted) {
        const unanswered = questions.filter((question) => !answersRef.current[question.id]?.trim()).length;
        const confirmMessage =
          unanswered > 0
            ? `Masih ada ${unanswered} soal belum dijawab. Yakin ingin mengumpulkan ujian?`
            : "Apakah Anda yakin ingin mengumpulkan ujian ini?";
        if (!window.confirm(confirmMessage)) return;
      }

      submittingRef.current = true;
      if (autoSubmitted) {
        autoSubmitRef.current = true;
      }
      setSubmitting(true);

      const answerPayload = Object.entries(answersRef.current)
        .filter(([, answer]) => String(answer ?? "").trim() !== "")
        .map(([questionId, answer]) => ({ questionId, answer }));

      try {
        const result = await apiFetch<{ id: string }>(
          `/exams/attempts/${currentAttemptId}/submit`,
          {
            method: "POST",
            body: JSON.stringify({ answers: answerPayload, autoSubmitted }),
          },
          token,
        );

        toast.success(
          autoSubmitted
            ? result.message || "Waktu habis. Ujian dikumpulkan otomatis"
            : result.message || "Ujian berhasil dikumpulkan",
        );
        router.replace(`/mahasiswa/exams/${examId}/results/${currentAttemptId}`);
      } catch (error) {
        toast.error(errorMessage(error, "Gagal mengumpulkan ujian"));
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [examId, questions, router, token],
  );

  useEffect(() => {
    if (phase !== "taking") return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "taking" || timeRemaining !== 0) return;
    if (exam?.autoSubmit === false || autoSubmitRef.current) return;
    handleSubmitExam(true);
  }, [exam?.autoSubmit, handleSubmitExam, phase, timeRemaining]);

  useEffect(() => {
    return () => {
      Object.values(saveTimersRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const persistAnswer = useCallback(
    async (questionId: string, answer: string) => {
      const currentAttemptId = attemptIdRef.current;
      if (!currentAttemptId) return;

      try {
        await apiFetch(
          `/exams/attempts/${currentAttemptId}/auto-save`,
          {
            method: "POST",
            body: JSON.stringify({ questionId, answer }),
          },
          token,
        );
      } catch {
        // Keep the local answer even if auto-save fails.
      }
    },
    [token],
  );

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

    if (saveTimersRef.current[questionId]) {
      clearTimeout(saveTimersRef.current[questionId]);
    }

    saveTimersRef.current[questionId] = setTimeout(() => {
      persistAnswer(questionId, answer);
    }, 600);
  };

  const startExam = async () => {
    try {
      setStarting(true);
      const result = await apiFetch<StartAttemptData>(
        `/exams/${examId}/start`,
        {
          method: "POST",
          body: JSON.stringify({}),
        },
        token,
      );

      const data = result.data;
      if (!data) {
        toast.error(result.message || "Gagal memulai ujian");
        return;
      }

      if (data.alreadySubmitted || data.submittedAt) {
        toast.info(result.message || "Ujian sudah dikumpulkan");
        router.replace(`/mahasiswa/exams/${examId}/results/${data.id}`);
        return;
      }

      const loadedQuestions = data.questions || [];
      const hasSavedAnswers = Object.keys(data.savedAnswers || {}).length > 0;
      const orderedQuestions =
        exam?.shuffleQuestions && !hasSavedAnswers
          ? [...loadedQuestions].sort(() => Math.random() - 0.5)
          : loadedQuestions;

      setAttemptId(data.id);
      setQuestions(orderedQuestions);
      setAnswers(data.savedAnswers || {});
      setTimeRemaining(data.remainingSeconds ?? (exam?.duration || 0) * 60);
      setExam((prev) =>
        prev
          ? {
              ...prev,
              ...data.exam,
              myAttempt: {
                id: data.id,
                status: "IN_PROGRESS",
                startedAt: new Date().toISOString(),
                submittedAt: null,
                totalScore: null,
              },
            }
          : prev,
      );
      setPhase("taking");
    } catch (error) {
      toast.error(errorMessage(error, "Gagal memulai ujian"));
    } finally {
      setStarting(false);
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

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = useMemo(
    () => questions.filter((question) => Boolean(answers[question.id]?.trim())).length,
    [answers, questions],
  );
  const progress =
    questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const allowBack = exam?.allowBack !== false;

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat ujian...</p>
        </div>
      </div>
    );
  }

  if (phase === "blocked") {
    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>{exam?.title || "Ujian"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <p className="text-sm">{blockedReason}</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/mahasiswa/exams")}>
            Kembali ke daftar ujian
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (phase === "lobby" && exam) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{exam.title}</CardTitle>
              {exam.course?.name && (
                <p className="text-sm text-muted-foreground mt-1">{exam.course.name}</p>
              )}
            </div>
            <Badge className="bg-success/10 text-success">
              {inProgressAttempt ? "Sedang dikerjakan" : "Siap dimulai"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {exam.description && (
            <p className="text-muted-foreground">{exam.description}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                Durasi
              </div>
              <p className="font-semibold">{exam.duration} menit</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <FileText className="h-4 w-4" />
                Jumlah soal
              </div>
              <p className="font-semibold">{exam.questionCount ?? 0} soal</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CheckCircle className="h-4 w-4" />
                Status
              </div>
              <p className="font-semibold">
                {inProgressAttempt ? "Lanjutkan percobaan" : "Belum dikumpulkan"}
              </p>
            </div>
          </div>

          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Mulai: </span>
              {formatDate(exam.startTime)}
            </p>
            <p>
              <span className="text-muted-foreground">Batas waktu: </span>
              {formatDate(exam.deadline)}
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
            <p>Timer berjalan setelah ujian dimulai dan tidak diulang jika halaman dimuat ulang.</p>
            <p>Jawaban disimpan otomatis. Jika waktu habis, ujian dikumpulkan otomatis.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={startExam} disabled={starting || closedAttempt}>
              <Play className="mr-2 h-4 w-4" />
              {starting
                ? "Menyiapkan..."
                : inProgressAttempt
                  ? "Lanjutkan Ujian"
                  : "Mulai Ujian"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/mahasiswa/exams")}>
              Batal
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">{exam?.title}</h1>
            <p className="text-muted-foreground">
              Soal {questions.length === 0 ? 0 : currentQuestionIndex + 1} dari {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {answeredCount} / {questions.length} dijawab
            </Badge>
            <Card className="flex items-center gap-2 px-4 py-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span
                className={`font-mono text-xl font-bold ${
                  (timeRemaining ?? 0) < 300 ? "text-destructive" : ""
                }`}
              >
                {formatTime(timeRemaining ?? 0)}
              </span>
            </Card>
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-2 mb-6">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {currentQuestion ? (
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
                    <div
                      key={option.id}
                      className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                      <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                        {String.fromCharCode(65 + index)}. {optionLabel(option)}
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
                  {(currentQuestion.options && currentQuestion.options.length > 0
                    ? currentQuestion.options
                    : [
                        { id: "true", text: "Benar" },
                        { id: "false", text: "Salah" },
                      ]
                  ).map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <RadioGroupItem value={option.id} id={`tf-${option.id}`} />
                      <Label htmlFor={`tf-${option.id}`} className="flex-1 cursor-pointer">
                        {optionLabel(option)}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === "ESSAY" && (
                <Textarea
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Tulis jawaban Anda di sini..."
                  rows={8}
                  maxLength={currentQuestion.maxChars || undefined}
                  className="w-full"
                />
              )}

              {currentQuestion.type === "SHORT_ANSWER" && (
                <Input
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Jawaban singkat..."
                  maxLength={currentQuestion.maxChars || undefined}
                  className="w-full"
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="py-8 text-center text-muted-foreground">
              Soal ujian tidak tersedia.
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={!allowBack || currentQuestionIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Sebelumnya
          </Button>

          <div className="flex flex-wrap justify-center gap-2">
            {questions.map((question, index) => (
              <Button
                key={question.id}
                variant={index === currentQuestionIndex ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (!allowBack && index < currentQuestionIndex) return;
                  setCurrentQuestionIndex(index);
                }}
                className={answers[question.id] ? "bg-success hover:bg-success/90" : ""}
              >
                {index + 1}
              </Button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={() => handleSubmitExam(false)} disabled={submitting || questions.length === 0}>
              {submitting ? "Mengumpulkan..." : "Selesai & Kumpulkan"}
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
              }
            >
              Selanjutnya
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            variant="destructive"
            onClick={() => handleSubmitExam(false)}
            disabled={submitting || questions.length === 0}
          >
            {submitting ? "Mengumpulkan..." : "Kumpulkan Ujian"}
          </Button>
        </div>

        {timeRemaining !== null && timeRemaining < 300 && timeRemaining > 0 && (
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
