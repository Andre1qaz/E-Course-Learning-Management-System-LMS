"use client";

import { useEffect, useState } from "react";
import { Plus, ArrowUp, ArrowDown, Trash2, Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Question {
  id: string;
  type: string;
  questionText: string;
  points: number;
  order: number;
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
  explanation?: string;
}

interface ExamQuestionsClientProps {
  examId: string;
  token: string;
}

export function ExamQuestionsClient({ examId, token }: ExamQuestionsClientProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>("MULTIPLE_CHOICE");
  const [formData, setFormData] = useState({
    questionText: "",
    points: 1,
    explanation: "",
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
    correctAnswer: "true",
  });

  useEffect(() => {
    fetchExam();
    fetchQuestions();
  }, [examId]);

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
      console.error("Failed to fetch exam:", error);
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

  const handleAddQuestion = async () => {
    try {
      const payload: any = {
        type: selectedQuestionType,
        questionText: formData.questionText,
        points: formData.points,
        explanation: formData.explanation,
      };

      if (selectedQuestionType === "MULTIPLE_CHOICE") {
        payload.options = formData.options.map((opt) => opt.text);
        const correctIndex = formData.options.findIndex((opt) => opt.isCorrect);
        if (correctIndex >= 0) {
          payload.correctAnswer = formData.options[correctIndex].text;
        }
      } else if (selectedQuestionType === "TRUE_FALSE") {
        payload.options = [
          { text: "True", isCorrect: formData.correctAnswer === "true" },
          { text: "False", isCorrect: formData.correctAnswer === "false" },
        ];
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exams/${examId}/questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Soal berhasil ditambahkan");
        setShowAddDialog(false);
        resetFormData();
        fetchQuestions();
      } else {
        toast.error(result.message || "Gagal menambahkan soal");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menambahkan soal");
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus soal ini?")) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/questions/${questionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Soal berhasil dihapus");
        fetchQuestions();
      } else {
        toast.error(result.message || "Gagal menghapus soal");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus soal");
    }
  };

  const handleMoveQuestion = async (questionId: string, direction: "up" | "down") => {
    const currentIndex = questions.findIndex((q) => q.id === questionId);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= questions.length) return;

    const newQuestions = [...questions];
    const [movedQuestion] = newQuestions.splice(currentIndex, 1);
    newQuestions.splice(newIndex, 0, movedQuestion);

    // Update order
    const updatedQuestions = newQuestions.map((q, index) => ({
      ...q,
      order: index,
    }));

    setQuestions(updatedQuestions);

    // Call API to update order
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exams/${examId}/questions/reorder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionOrders: updatedQuestions.map((q) => ({ id: q.id, order: q.order })),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Urutan soal diperbarui");
      } else {
        toast.error(result.message || "Gagal memperbarui urutan soal");
        fetchQuestions(); // Revert to server state on error
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memperbarui urutan soal");
      fetchQuestions(); // Revert to server state on error
    }
  };

  const resetFormData = () => {
    setFormData({
      questionText: "",
      points: 1,
      explanation: "",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
      correctAnswer: "true",
    });
  };

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...formData.options];
    newOptions[index].text = text;
    setFormData({ ...formData, options: newOptions });
  };

  const handleOptionCorrect = (index: number) => {
    const newOptions = formData.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    setFormData({ ...formData, options: newOptions });
  };

  const addOption = () => {
    setFormData({
      ...formData,
      options: [...formData.options, { text: "", isCorrect: false }],
    });
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) {
      toast.error("Minimal harus ada 2 pilihan jawaban");
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return "Pilihan Ganda";
      case "ESSAY":
        return "Essay";
      case "TRUE_FALSE":
        return "Benar/Salah";
      case "SHORT_ANSWER":
        return "Isian Singkat";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">Kelola Soal</h1>
            <p className="text-muted-foreground">{exam?.title || "Memuat..."}</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Soal
          </Button>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        ) : questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Belum ada soal. Klik "Tambah Soal" untuk memulai.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card key={question.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <Badge>{getQuestionTypeLabel(question.type)}</Badge>
                        <Badge variant="secondary">{question.points} poin</Badge>
                      </div>
                      <CardTitle className="text-lg">{question.questionText}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveQuestion(question.id, "up")}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveQuestion(question.id, "down")}
                        disabled={index === questions.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {question.options && question.options.length > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={option.id}
                          className="flex items-center gap-2 p-2 rounded bg-muted/50"
                        >
                          <span className="text-sm font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                          <span className="text-sm">{option.text}</span>
                          {option.isCorrect && (
                            <Badge variant="default" className="ml-auto">
                              Benar
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Question Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Soal Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="questionType">Tipe Soal</Label>
              <select
                id="questionType"
                value={selectedQuestionType}
                onChange={(e) => {
                  setSelectedQuestionType(e.target.value);
                  resetFormData();
                }}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                <option value="TRUE_FALSE">Benar/Salah</option>
                <option value="ESSAY">Essay</option>
                <option value="SHORT_ANSWER">Isian Singkat</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questionText">Pertanyaan</Label>
              <Textarea
                id="questionText"
                value={formData.questionText}
                onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                placeholder="Masukkan pertanyaan"
                rows={3}
                required
              />
            </div>

            {selectedQuestionType === "MULTIPLE_CHOICE" && (
              <div className="space-y-2">
                <Label>Pilihan Jawaban</Label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={option.isCorrect}
                      onChange={() => handleOptionCorrect(index)}
                      className="w-4 h-4"
                    />
                    <Input
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Pilihan ${String.fromCharCode(65 + index)}`}
                      className="flex-1"
                    />
                    {formData.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  disabled={formData.options.length >= 6}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Pilihan
                </Button>
              </div>
            )}

            {selectedQuestionType === "TRUE_FALSE" && (
              <div className="space-y-2">
                <Label>Jawaban Benar</Label>
                <select
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points">Poin</Label>
                <Input
                  id="points"
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="explanation">Pembahasan (Opsional)</Label>
              <Textarea
                id="explanation"
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                placeholder="Pembahasan jawaban"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAddQuestion}>Tambah Soal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
