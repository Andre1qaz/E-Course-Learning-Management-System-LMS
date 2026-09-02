"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizFormDialog } from "@/components/quizzes/quiz-form-dialog";
import { QuizQuestionFormDialog } from "@/components/quizzes/quiz-question-form-dialog";
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
  student: {
    id: string;
    name: string;
    email: string;
  };
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
}

interface QuizReviewClientProps {
  courseId: string;
  quizId: string;
}

export function QuizReviewClient({ courseId, quizId }: QuizReviewClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<QuizAttemptSummary[]>([]);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"questions" | "attempts">("questions");
  const hasLoadedRef = useRef(false);

  const fetchQuizData = async (forceRefresh = false) => {
    const currentToken = session?.accessToken;
    
    if (!currentToken) {
      toast.error("Anda perlu login untuk mengakses halaman ini");
      setLoading(false);
      return;
    }
    
    // Always allow refresh when forceRefresh is true
    if (!forceRefresh && hasLoadedRef.current) {
      return;
    }
    
    if (forceRefresh) {
      hasLoadedRef.current = false;
    }
    
    hasLoadedRef.current = true;
    setLoading(true);
    
    try {
      // Fetch quiz data
      const quizResult = await apiFetch<Quiz>(`/quizzes/${quizId}`, {}, currentToken);
      
      if (quizResult.data) {
        setQuiz(quizResult.data);
        // Don't set questions from quiz data to avoid conflicts
        // Let fetchQuestions handle it separately
      } else {
        toast.error("Quiz data tidak ditemukan");
        setQuestions([]);
      }
      
      // Fetch attempts
      try {
        const attemptsResult = await apiFetch<QuizAttemptSummary[]>(`/quizzes/${quizId}/attempts/all`, {}, currentToken);
        if (attemptsResult.data) {
          setAttempts(attemptsResult.data);
        } else {
          setAttempts([]);
        }
      } catch (attemptsError) {
        console.error("Error fetching attempts:", attemptsError);
        setAttempts([]);
      }
      
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      toast.error(error instanceof Error ? error.message : "Terjadi kesalahan saat memuat kuis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      // Always fetch both on mount
      fetchQuizData();
      fetchQuestions();
    } else if (status === "unauthenticated") {
      toast.error("Anda perlu login untuk mengakses halaman ini");
      setLoading(false);
    }
  }, [status, session, quizId]);

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

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus soal ini?")) return;

    try {
      await apiFetch(`/quizzes/${quizId}/questions/${questionId}`, {
        method: "DELETE",
      }, session?.accessToken || undefined);
      toast.success("Soal berhasil dihapus");
      fetchQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Gagal menghapus soal");
    }
  };

  const calculateStatistics = () => {
    if (!Array.isArray(attempts) || attempts.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0,
        completedAttempts: 0,
      };
    }

    const completedAttempts = attempts.filter(a => a.status === "SUBMITTED");
    const averageScore = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.totalScore || 0), 0) / completedAttempts.length
      : 0;
    const passRate = completedAttempts.length > 0
      ? (completedAttempts.filter(a => a.passed).length / completedAttempts.length) * 100
      : 0;

    return {
      totalAttempts: attempts.length,
      averageScore: Math.round(averageScore),
      passRate: Math.round(passRate),
      completedAttempts: completedAttempts.length,
    };
  };

  const statistics = calculateStatistics();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat kuis...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Kuis Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-6">Kuis yang Anda cari tidak ditemukan atau tidak dapat diakses.</p>
            <Button onClick={() => router.back()}>Kembali</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-muted-foreground mt-1">{quiz.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Kembali
          </Button>
          <Button onClick={() => setShowQuizForm(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Kuis
          </Button>
        </div>
      </div>

      {/* Quiz Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Kuis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Durasi</p>
                <p className="font-semibold">{quiz.duration} menit</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nilai Lulus</p>
                <p className="font-semibold">{quiz.passingScore}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                {quiz.isPublished ? "Published" : "Draft"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {Array.isArray(questions) ? questions.length : 0} Soal
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistik
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Percobaan</p>
              <p className="text-2xl font-bold">{statistics.totalAttempts}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Selesai</p>
              <p className="text-2xl font-bold">{statistics.completedAttempts}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rata-rata Skor</p>
              <p className="text-2xl font-bold">{statistics.averageScore}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tingkat Kelulusan</p>
              <p className="text-2xl font-bold">{statistics.passRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "questions" ? "default" : "outline"}
          onClick={() => setActiveTab("questions")}
        >
          Soal
        </Button>
        <Button
          variant={activeTab === "attempts" ? "default" : "outline"}
          onClick={() => setActiveTab("attempts")}
        >
          Percobaan Mahasiswa
        </Button>
      </div>

      {/* Questions Tab */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Daftar Soal</h2>
            <Button onClick={() => setShowQuestionForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Soal
            </Button>
          </div>

          {Array.isArray(questions) && questions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Belum Ada Soal</h3>
                <p className="text-muted-foreground mb-4">
                  Kuis ini belum memiliki soal. Tambahkan soal untuk memulai.
                </p>
                <Button onClick={() => setShowQuestionForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Soal Pertama
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Soal {currentQuestionIndex + 1} dari {Array.isArray(questions) ? questions.length : 0}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                        disabled={currentQuestionIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentQuestionIndex(Math.min(Array.isArray(questions) ? questions.length - 1 : 0, currentQuestionIndex + 1))}
                        disabled={currentQuestionIndex === (Array.isArray(questions) ? questions.length - 1 : 0)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentQuestion && (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-2">
                            {currentQuestion.type}
                          </Badge>
                          <p className="text-lg font-medium">{currentQuestion.questionText}</p>
                          <Badge variant="secondary" className="mt-2">
                            {currentQuestion.points} poin
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(currentQuestion.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      {currentQuestion.type === "MULTIPLE_CHOICE" && currentQuestion.options && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Opsi Jawaban:</p>
                          {currentQuestion.options.map((option) => (
                            <div
                              key={option.id}
                              className={`flex items-center gap-2 p-2 rounded ${
                                option.isCorrect ? "bg-green-50 dark:bg-green-950" : "bg-muted"
                              }`}
                            >
                              {option.isCorrect && <CheckCircle className="h-4 w-4 text-green-600" />}
                              <p className="flex-1">{option.optionText}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {currentQuestion.explanation && (
                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                          <p className="text-sm">
                            <strong>Penjelasan:</strong> {currentQuestion.explanation}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-center gap-2">
                {Array.isArray(questions) && questions.map((_, index) => (
                  <Button
                    key={index}
                    variant={index === currentQuestionIndex ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentQuestionIndex(index)}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Attempts Tab */}
      {activeTab === "attempts" && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Percobaan Mahasiswa</h2>

          {attempts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Belum Ada Percobaan</h3>
                <p className="text-muted-foreground">
                  Belum ada mahasiswa yang mencoba kuis ini.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {attempts.map((attempt) => (
                <Card key={attempt.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{attempt.student.name}</p>
                        <p className="text-sm text-muted-foreground">{attempt.student.email}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span>Percobaan ke: {attempt.attemptNumber}</span>
                          <Badge variant={attempt.status === "SUBMITTED" ? "default" : "secondary"}>
                            {attempt.status}
                          </Badge>
                          {attempt.status === "SUBMITTED" && (
                            <>
                              <span>Skor: {attempt.totalScore}%</span>
                              {attempt.passed !== undefined && (
                                <Badge variant={attempt.passed ? "default" : "destructive"}>
                                  {attempt.passed ? "Lulus" : "Tidak Lulus"}
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      {attempt.submittedAt && (
                        <p className="text-sm text-muted-foreground">
                          {new Date(attempt.submittedAt).toLocaleDateString("id-ID")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      {showQuizForm && (
        <QuizFormDialog
          open={showQuizForm}
          onOpenChange={setShowQuizForm}
          activityId={quizId}
          quiz={quiz}
          onSuccess={fetchQuizData}
        />
      )}

      {showQuestionForm && (
        <QuizQuestionFormDialog
          open={showQuestionForm}
          onOpenChange={setShowQuestionForm}
          quizId={quizId}
          onSuccess={async () => {
            // Only refresh questions - don't call fetchQuizData as it doesn't handle questions
            await fetchQuestions();
          }}
        />
      )}
    </div>
  );
}