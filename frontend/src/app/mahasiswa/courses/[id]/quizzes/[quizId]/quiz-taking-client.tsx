"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface QuestionOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  order: number;
}

interface Question {
  id: string;
  type: string;
  questionText: string;
  points: number;
  order: number;
  explanation?: string | null;
  options?: QuestionOption[];
}

interface QuizAttemptSummary {
  id: string;
  status: string;
  startedAt: string | null;
  submittedAt: string | null;
  totalScore: number | null;
  passed?: boolean | null;
  attemptNumber: number;
  autoSavedData?: Record<string, { answerText?: string; selectedOptionId?: string }>;
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  duration: number;
  passingScore: number;
  isPublished: boolean;
  allowRetake: boolean;
  maxAttempts: number;
  showResults: boolean;
  showExplanation: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questions?: Question[];
  myAttempt?: QuizAttemptSummary | null;
}

interface QuizTakingClientProps {
  courseId: string;
  quizId: string;
}

type Phase = "loading" | "lobby" | "taking" | "results" | "blocked";

export function QuizTakingClient({ courseId, quizId }: QuizTakingClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [phase, setPhase] = useState<Phase>("loading");
  const [blockedReason, setBlockedReason] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, { answerText?: string; selectedOptionId?: string }>>({});
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttemptSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Anda perlu login untuk mengakses kuis ini");
      setPhase("blocked");
      setBlockedReason("Anda perlu login untuk mengakses kuis ini");
    }
  }, [status]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchQuizData();
      fetchQuestions(); // Also fetch questions separately
    }
  }, [quizId, session?.accessToken]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === "taking" && timeRemaining !== null && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            submitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, timeRemaining]);

  const fetchQuizData = async () => {
    const currentToken = session?.accessToken;
    if (!currentToken) return;
    
    try {
      const quizResult = await apiFetch<Quiz>(`/quizzes/${quizId}`, {}, currentToken);
      if (!quizResult.data) {
        toast.error("Quiz data tidak ditemukan");
        setPhase("blocked");
        setBlockedReason("Quiz data tidak ditemukan");
        return;
      }
      setQuiz(quizResult.data);
      
      // Check if user has existing attempts
      const attemptsResult = await apiFetch<QuizAttemptSummary[]>(`/quizzes/${quizId}/attempts/student`, {}, currentToken);
      
      if (attemptsResult.data && attemptsResult.data.length > 0) {
        const latestAttempt = attemptsResult.data[0];
        setCurrentAttempt(latestAttempt);

        if (latestAttempt.status === "IN_PROGRESS") {
          // Resume existing attempt
          setPhase("taking");
          // Don't set questions from quiz data - use fetchQuestions instead
          // Load saved answers if available
          if (latestAttempt.autoSavedData) {
            setAnswers(latestAttempt.autoSavedData);
          }
          // Calculate remaining time
          if (latestAttempt.startedAt) {
            const elapsed = Math.floor((Date.now() - new Date(latestAttempt.startedAt).getTime()) / 1000);
            const remaining = quizResult.data.duration * 60 - elapsed;
            setTimeRemaining(Math.max(0, remaining));
          }
        } else if (latestAttempt.status === "SUBMITTED" && quizResult.data.showResults) {
          // Show results
          setPhase("results");
          // Don't set questions from quiz data - use fetchQuestions instead
        } else if (latestAttempt.status === "SUBMITTED" && !quizResult.data.showResults) {
          // Quiz completed but results hidden
          setPhase("blocked");
          setBlockedReason("Quiz sudah selesai. Hasil akan ditampilkan oleh dosen.");
        } else if (attemptsResult.data.length >= quizResult.data.maxAttempts && !quizResult.data.allowRetake) {
          // Max attempts reached
          setPhase("blocked");
          setBlockedReason("Anda telah mencapai batas maksimal percobaan untuk kuis ini.");
        } else {
          // Can start new attempt
          setPhase("lobby");
          // Don't set questions from quiz data - use fetchQuestions instead
        }
      } else {
        // No attempts yet, can start
        setPhase("lobby");
        // Don't set questions from quiz data - use fetchQuestions instead
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      toast.error("Terjadi kesalahan saat memuat kuis");
      setPhase("blocked");
      setBlockedReason("Terjadi kesalahan saat memuat kuis");
    }
  };

  const fetchQuestions = async () => {
    const currentToken = session?.accessToken;
    if (!currentToken) return;
    
    try {
      const result = await apiFetch<Question[]>(`/quizzes/${quizId}/questions`, {}, currentToken);
      if (result.data && Array.isArray(result.data)) {
        setQuestions(result.data);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Terjadi kesalahan saat memuat soal");
      setQuestions([]);
    }
  };

  const startQuiz = async () => {
    setLoading(true);
    try {
      const result = await apiFetch<QuizAttemptSummary>(`/quizzes/${quizId}/attempts/start`, {
        method: "POST",
      }, session?.accessToken || undefined);
      
      setCurrentAttempt(result.data);
      setPhase("taking");
      setTimeRemaining(quiz!.duration * 60);
      setAnswers({});
      // Fetch questions when starting quiz
      await fetchQuestions();
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast.error("Terjadi kesalahan saat memulai kuis");
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answerText: answer.answerText,
        selectedOptionId: answer.selectedOptionId,
      }));

      const result = await apiFetch<QuizAttemptSummary>(`/quizzes/attempts/${currentAttempt!.id}/submit`, {
        method: "POST",
        body: JSON.stringify(answerArray),
      }, session?.accessToken || undefined);
      
      toast.success("Kuis berhasil disubmit");
      setCurrentAttempt(result.data);
      
      if (quiz!.showResults) {
        setPhase("results");
      } else {
        setPhase("blocked");
        setBlockedReason("Kuis berhasil disubmit. Hasil akan ditampilkan oleh dosen.");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Terjadi kesalahan saat mensubmit kuis");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: { answerText?: string; selectedOptionId?: string }) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (phase === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat kuis...</p>
        </div>
      </div>
    );
  }

  if (phase === "blocked") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Akses Kuis Diblokir</h2>
            <p className="text-muted-foreground mb-6">{blockedReason}</p>
            <Button onClick={() => router.back()}>Kembali</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "lobby") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{quiz?.title}</CardTitle>
            {quiz?.description && (
              <p className="text-muted-foreground">{quiz.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Durasi</p>
                  <p className="font-semibold">{quiz?.duration} menit</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nilai Lulus</p>
                  <p className="font-semibold">{quiz?.passingScore}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <span>{questions.length}</span>
                  <span>Soal</span>
                </Badge>
              </div>
              {currentAttempt && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" />
                    <span>Percobaan {currentAttempt.attemptNumber}</span>
                  </Badge>
                </div>
              )}
            </div>

            {currentAttempt && currentAttempt.status === "SUBMITTED" && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Anda sudah menyelesaikan kuis ini. Skor Anda: <strong>{currentAttempt.totalScore}%</strong>
                  {currentAttempt.passed !== undefined && (
                    <span> ({currentAttempt.passed ? "Lulus" : "Tidak Lulus"})</span>
                  )}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={startQuiz}
                disabled={loading}
                className="flex-1"
                size="lg"
              >
                <Play className="mr-2 h-5 w-5" />
                {loading ? "Memulai..." : currentAttempt ? "Coba Lagi" : "Mulai Kuis"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Kembali
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "taking") {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{quiz?.title}</h1>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {timeRemaining !== null ? formatTime(timeRemaining) : "--:--"}
              </Badge>
              <Badge variant="outline">
                {currentQuestionIndex + 1} / {questions.length}
              </Badge>
            </div>
          </div>

          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {currentQuestion && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">
                  Soal {currentQuestionIndex + 1}
                </CardTitle>
                <Badge variant="outline">{currentQuestion.points} poin</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg">{currentQuestion.questionText}</p>

              {currentQuestion.type === "MULTIPLE_CHOICE" && currentQuestion.options && (
                <RadioGroup
                  value={answers[currentQuestion.id]?.selectedOptionId || ""}
                  onValueChange={(value) =>
                    handleAnswerChange(currentQuestion.id, { selectedOptionId: value })
                  }
                >
                  {currentQuestion.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        {option.optionText}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === "SHORT_ANSWER" && (
                <div className="space-y-2">
                  <Label htmlFor="short-answer">Jawaban Anda</Label>
                  <Input
                    id="short-answer"
                    value={answers[currentQuestion.id]?.answerText || ""}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion.id, { answerText: e.target.value })
                    }
                    placeholder="Masukkan jawaban Anda"
                  />
                </div>
              )}

              {currentQuestion.type === "ESSAY" && (
                <div className="space-y-2">
                  <Label htmlFor="essay-answer">Jawaban Anda</Label>
                  <Textarea
                    id="essay-answer"
                    value={answers[currentQuestion.id]?.answerText || ""}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion.id, { answerText: e.target.value })
                    }
                    placeholder="Masukkan jawaban Anda"
                    rows={6}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Sebelumnya
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={submitQuiz} disabled={loading}>
              {loading ? "Mensubmit..." : "Submit Kuis"}
            </Button>
          ) : (
            <Button onClick={goToNextQuestion}>
              Selanjutnya
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Hasil Kuis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                {currentAttempt?.totalScore}%
              </div>
              <Badge
                variant={currentAttempt?.passed ? "default" : "destructive"}
                className="text-lg px-4 py-2"
              >
                {currentAttempt?.passed ? "Lulus" : "Tidak Lulus"}
              </Badge>
            </div>

            <div className="space-y-2 text-center text-sm text-muted-foreground">
              <p>Durasi kuis: {quiz?.duration} menit</p>
              <p>Nilai lulus: {quiz?.passingScore}%</p>
              <p>Percobaan ke: {currentAttempt?.attemptNumber}</p>
            </div>

            {quiz?.showExplanation && (
              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Penjelasan Jawaban</h3>
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <p className="font-medium mb-2">
                        {index + 1}. {question.questionText}
                      </p>
                      {question.explanation && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Penjelasan:</strong> {question.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => router.back()}
                className="flex-1"
              >
                Kembali ke Course
              </Button>
              {quiz?.allowRetake && (currentAttempt?.attemptNumber || 0) < (quiz?.maxAttempts || 1) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setPhase("lobby");
                    setCurrentAttempt(null);
                  }}
                >
                  Coba Lagi
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}