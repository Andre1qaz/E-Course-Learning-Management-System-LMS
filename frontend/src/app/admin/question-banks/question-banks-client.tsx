"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Search, BookOpen, Download, Upload, Trash2, Edit, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFormat, setImportFormat] = useState("json");
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      toast.error("Gagal memuat courses");
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

  const handleExportQuestionBank = async (id: string, format: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/question-banks/${id}/export/${format}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const fileName = format === 'json' ? 'questions.json' : 
                      format === 'csv' ? 'questions.csv' : 'questions.xlsx';
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Question bank berhasil diexport sebagai ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Gagal mengexport question bank');
    }
  };

  const handleImportQuestionBank = async () => {
    if (!importFile) {
      toast.error('Pilih file terlebih dahulu');
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/question-banks/import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            format: importFormat,
            data: await parseImportFile(importFile, importFormat),
            courseId: formData.courseId || undefined,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('Question bank berhasil diimport');
        setShowImportDialog(false);
        setImportFile(null);
        fetchQuestionBanks();
      } else {
        toast.error(result.message || 'Gagal mengimport question bank');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat mengimport question bank');
    }
  };

  const parseImportFile = async (file: File, format: string): Promise<any> => {
    if (format === 'json') {
      const text = await file.text();
      return JSON.parse(text);
    } else if (format === 'csv') {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header.trim()] = values[index]?.trim() || '';
        });
        return obj;
      });
    } else if (format === 'excel' || format === 'xlsx') {
      // For Excel, we'll need a library like xlsx
      // For now, return empty array as placeholder
      return [];
    }
    return null;
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
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4 md:mb-6">
          <div>
            <h1 className="font-display text-xl md:text-2xl lg:text-3xl font-bold">Question Banks</h1>
            <p className="text-sm md:text-base text-muted-foreground">Kelola bank soal untuk digunakan di ujian</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(true)} className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Import</span>
              <span className="sm:hidden">Imp</span>
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Buat Question Bank</span>
              <span className="sm:hidden">Buat</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 md:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari question bank berdasarkan judul, topik, atau course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm md:text-base"
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
            <CardContent className="py-8 md:py-12 text-center px-4">
              <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted mb-4">
                <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-base md:text-lg font-semibold mb-2">Belum ada Question Bank</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
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
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base md:text-lg mb-2 truncate">{qb.title}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={getDifficultyColor(qb.difficulty) + " text-xs"}>
                          {qb.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">{qb.questionType}</Badge>
                      </div>
                      {qb.topic && (
                        <p className="text-xs md:text-sm text-muted-foreground mb-2 truncate">{qb.topic}</p>
                      )}
                      {qb.course && (
                        <p className="text-xs md:text-sm text-muted-foreground truncate">
                          {qb.course.code} - {qb.course.name}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground mb-4">
                    <span>{qb._count.questions} soal</span>
                    <span className="hidden sm:inline">{formatDate(qb.createdAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs">
                      <Edit className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Kelola</span>
                      <span className="sm:hidden">Kelola</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs">
                          <Download className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportQuestionBank(qb.id, 'json')}>
                          <FileJson className="mr-2 h-4 w-4" />
                          Export JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportQuestionBank(qb.id, 'csv')}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Export CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportQuestionBank(qb.id, 'excel')}>
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Export Excel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuestionBank(qb.id)}
                      className="text-xs"
                    >
                      <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
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
        <DialogContent className="max-w-2xl w-[95%] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Buat Question Bank Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm">Judul</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Masukkan judul question bank"
                required
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course" className="text-sm">Course (Opsional)</Label>
              <select
                id="course"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
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
              <Label htmlFor="topic" className="text-sm">Topik</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                placeholder="Contoh: JavaScript, Database, dll."
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty" className="text-sm">Tingkat Kesulitan</Label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="EASY">Mudah</option>
                  <option value="MEDIUM">Sedang</option>
                  <option value="HARD">Sulit</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="questionType" className="text-sm">Tipe Soal</Label>
                <select
                  id="questionType"
                  value={formData.questionType}
                  onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                  <option value="ESSAY">Essay</option>
                  <option value="TRUE_FALSE">Benar/Salah</option>
                  <option value="SHORT_ANSWER">Isian Singkat</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deskripsi question bank (opsional)"
                rows={3}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="text-sm w-full sm:w-auto">
              Batal
            </Button>
            <Button onClick={handleCreateQuestionBank} className="text-sm w-full sm:w-auto">Buat Question Bank</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Question Bank Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl w-[95%] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Import Question Bank</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="format" className="text-sm">Format File</Label>
              <select
                id="format"
                value={importFormat}
                onChange={(e) => setImportFormat(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="excel">Excel (XLSX)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file" className="text-sm">File</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                accept={importFormat === 'json' ? '.json' : importFormat === 'csv' ? '.csv' : '.xlsx,.xls'}
                required
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="importCourse" className="text-sm">Course (Opsional)</Label>
              <select
                id="importCourse"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Tanpa Course (Umum)</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowImportDialog(false)} className="text-sm w-full sm:w-auto">
              Batal
            </Button>
            <Button onClick={handleImportQuestionBank} className="text-sm w-full sm:w-auto">Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
