"use client";

import { useEffect, useState } from "react";
import { Search, Clock, FileText, Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";

interface Exam {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  deadline: string;
  duration: number;
  isPublished: boolean;
  course: {
    id: string;
    name: string;
    code: string;
  };
  _count: {
    questions: number;
    attempts: number;
  };
  myAttempt?: {
    id: string;
    status: string;
    startedAt: string | null;
    submittedAt: string | null;
    totalScore: number | null;
  } | null;
}

interface MahasiswaExamsClientProps {
  token: string;
}

export function MahasiswaExamsClient({ token }: MahasiswaExamsClientProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const result = await apiFetch<Exam[]>("/exams", {}, token);
      const list = result.data || [];
      const query = searchQuery.trim().toLowerCase();
      setExams(
        query
          ? list.filter(
              (exam) =>
                exam.title.toLowerCase().includes(query) ||
                exam.course.name.toLowerCase().includes(query) ||
                exam.course.code.toLowerCase().includes(query),
            )
          : list,
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Terjadi kesalahan saat memuat ujian");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchExams();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getExamStatusBadge = (exam: Exam) => {
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.deadline);

    if (!exam.isPublished) {
      return <Badge variant="secondary">Draft</Badge>;
    } else if (now < start) {
      return <Badge variant="outline">Akan Datang</Badge>;
    } else if (now >= start && now <= end) {
      return <Badge className="bg-success/10 text-success">Sedang Berlangsung</Badge>;
    } else {
      return <Badge variant="secondary">Selesai</Badge>;
    }
  };

  const canAccessExam = (exam: Exam) => {
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.deadline);
    const status = exam.myAttempt?.status;
    if (status === "IN_PROGRESS") return true;
    return exam.isPublished && now >= start && now <= end && status !== "SUBMITTED" && status !== "GRADED";
  };

  const isSubmitted = (exam: Exam) => {
    const status = exam.myAttempt?.status;
    return status === "SUBMITTED" || status === "GRADED";
  };

  const isInProgress = (exam: Exam) => exam.myAttempt?.status === "IN_PROGRESS";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ujian Saya</h1>
          <p className="text-muted-foreground">Daftar ujian dari course yang Anda ikuti</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari ujian berdasarkan nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">Cari</Button>
      </form>

      {/* Exams Grid */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="skeleton h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">Belum ada ujian</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Tidak ada ujian yang cocok dengan pencarian" : "Belum ada ujian tersedia"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{exam.title}</CardTitle>
                      {getExamStatusBadge(exam)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {exam.course.code} - {exam.course.name}
                    </p>
                    {exam.description && (
                      <p className="text-sm text-muted-foreground mb-3">{exam.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{exam.duration} menit</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{exam._count.questions} soal</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>{formatDate(exam.startTime)}</p>
                      <p>s/d {formatDate(exam.deadline)}</p>
                    </div>
                    <div className="flex gap-2">
                      {canAccessExam(exam) && (
                        <Link href={`/mahasiswa/exams/${exam.id}`}>
                          <Button>
                            <Play className="mr-2 h-4 w-4" />
                            {isInProgress(exam) ? "Lanjutkan Ujian" : "Mulai Ujian"}
                          </Button>
                        </Link>
                      )}
                      {isSubmitted(exam) && exam.myAttempt && (
                        <Link href={`/mahasiswa/exams/${exam.id}/results/${exam.myAttempt.id}`}>
                          <Button variant="outline">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Lihat Hasil
                          </Button>
                        </Link>
                      )}
                      {!canAccessExam(exam) && !isSubmitted(exam) && (
                        <Button disabled>
                          <Clock className="mr-2 h-4 w-4" />
                          Belum Dapat Dimulai
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
