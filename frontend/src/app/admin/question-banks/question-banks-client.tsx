"use client";

import { useEffect, useState } from "react";
import { Plus, Search, BookOpen, Download, Upload, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Course {
  id: string;
  name: string;
  code: string;
}

interface QuestionBank {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
  difficulty: string;
  questionType: string;
  courseId: string | null;
  course: Course | null;
  _count: {
    questions: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface QuestionBanksClientProps {
  token: string;
  userRole: string;
}

export function QuestionBanksClient({ token, userRole }: QuestionBanksClientProps) {
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    description: "",
    topic: "",
    difficulty: "MEDIUM",
    questionType: "MULTIPLE_CHOICE",
  });

  useEffect(() => {
    fetchCourses();
    fetchQuestionBanks();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setCourses(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  const fetchQuestionBanks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/question-banks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setQuestionBanks(result.data);
      }
    } catch (error) {
      toast.error("Gagal memuat question banks");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestionBank = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/question-banks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Question bank berhasil dibuat");
        setShowCreateDialog(false);
        setFormData({
          courseId: "",
          title: "",
          description: "",
          topic: "",
          difficulty: "MEDIUM",
          questionType: "MULTIPLE_CHOICE",
        });
        fetchQuestionBanks();
      } else {
        toast.error(result.message || "Gagal membuat question bank");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat membuat question bank");
    }
  };

  const handleDeleteQuestionBank = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus question bank ini?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/question-banks/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Question bank berhasil dihapus");
        fetchQuestionBanks();
      } else {
        toast.error(result.message || "Gagal menghapus question bank");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus question bank");
    }
  };

  const filteredQuestionBanks = questionBanks.filter((qb) => {
    return (
      qb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (qb.topic?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (qb.course?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-success/10 text-success";
      case "MEDIUM":
        return "bg-warning/10 text-warning";
      case "HARD":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Question Banks</h1>
            <p className="text-muted-foreground">Kelola bank soal untuk digunakan di ujian</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Question Bank
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari question bank berdasarkan judul, topik, atau course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Question Banks List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredQuestionBanks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Belum ada Question Bank</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? "Tidak ada question bank yang cocok dengan pencarian"
                  : "Mulai dengan membuat question bank pertama"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuestionBanks.map((qb) => (
              <Card key={qb.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{qb.title}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getDifficultyColor(qb.difficulty)}>
                          {qb.difficulty}
                        </Badge>
                        <Badge variant="outline">{qb.questionType}</Badge>
                      </div>
                      {qb.topic && (
                        <p className="text-sm text-muted-foreground mb-2">{qb.topic}</p>
                      )}
                      {qb.course && (
                        <p className="text-sm text-muted-foreground">
                          {qb.course.code} - {qb.course.name}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>{qb._count.questions} soal</span>
                    <span>{formatDate(qb.createdAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="mr-2 h-4 w-4" />
                      Kelola
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuestionBank(qb.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Question Bank Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buat Question Bank Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masukkan judul question bank"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">Course (Opsional)</Label>
              <select
                id="course"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Tanpa Course (Umum)</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Topik</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Contoh: JavaScript, Database, dll."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Tingkat Kesulitan</Label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="EASY">Mudah</option>
                  <option value="MEDIUM">Sedang</option>
                  <option value="HARD">Sulit</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="questionType">Tipe Soal</Label>
                <select
                  id="questionType"
                  value={formData.questionType}
                  onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                  <option value="ESSAY">Essay</option>
                  <option value="TRUE_FALSE">Benar/Salah</option>
                  <option value="SHORT_ANSWER">Isian Singkat</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi question bank (opsional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateQuestionBank}>Buat Question Bank</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
