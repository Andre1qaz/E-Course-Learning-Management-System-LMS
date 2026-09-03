"use client";

import { useState, useEffect } from "react";
import { ForumThread, getForumThreads, getForumThread, createForumThread, updateForumThread, deleteForumThread, togglePinThread, createForumReply, updateForumReply, deleteForumReply, getCourses } from "@/lib/api";
import { ForumThreadList } from "@/components/forum/forum-thread-list";
import { ForumThreadDetail } from "@/components/forum/forum-thread-detail";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

// Heuristic #1: Visibility of System Status — loading states and error handling
// Heuristic #18: Collaborative Learning — support threaded discussions

interface ForumClientProps {
  role: string;
  token: string;
  userId: string;
}

export function ForumClient({ role, token, userId }: ForumClientProps) {
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [currentThread, setCurrentThread] = useState<ForumThread | null>(null);
  const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [createCourseId, setCreateCourseId] = useState<string>("");

  const fetchCourses = async () => {
    try {
      const coursesData = await getCourses(token);
      setCourses(
        (coursesData.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
        }))
      );
      if (coursesData.data && coursesData.data.length > 0) {
        setSelectedCourseId(coursesData.data[0].id);
      }
      setLoadingCourses(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat courses");
      setLoadingCourses(false);
    }
  };

  const fetchThreads = async () => {
    if (!selectedCourseId) return;

    try {
      setLoadingThreads(true);
      setError(null);
      const threadsData = await getForumThreads(token, selectedCourseId);
      setThreads(threadsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat forum");
    } finally {
      setLoadingThreads(false);
    }
  };

  const fetchThreadDetail = async () => {
    if (!selectedThreadId) return;

    try {
      setLoadingThreads(true);
      setError(null);
      const threadData = await getForumThread(token, selectedThreadId);
      setCurrentThread(threadData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat diskusi");
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [token]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchThreads();
    }
  }, [selectedCourseId, token]);

  useEffect(() => {
    if (selectedThreadId) {
      fetchThreadDetail();
    }
  }, [selectedThreadId, token]);

  const handleCreateThread = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const courseId = createCourseId || selectedCourseId;
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    if (!courseId || !title || !content) {
      toast.error("Course, judul, dan konten wajib diisi");
      return;
    }

    try {
      await createForumThread(token, { courseId, title, content });
      setIsCreateDialogOpen(false);
      await fetchThreads();
      toast.success("Diskusi berhasil dibuat");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat diskusi");
    }
  };

  const handleThreadClick = (threadId: string) => {
    setSelectedThreadId(threadId);
    setView("detail");
  };

  const handleBack = () => {
    setSelectedThreadId(null);
    setCurrentThread(null);
    setView("list");
  };

  const handleReply = async (content: string) => {
    if (!selectedThreadId) return;
    
    await createForumReply(token, selectedThreadId, content);
    await fetchThreadDetail();
  };

  const handleUpdateThread = async (threadId: string, data: { title?: string; content?: string }) => {
    await updateForumThread(token, threadId, data);
    await fetchThreadDetail();
  };

  const handleDeleteThreadClick = (threadId: string) => {
    setThreadToDelete(threadId);
    setShowDeleteDialog(true);
  };

  const handleDeleteThreadConfirm = async () => {
    if (!threadToDelete) return;

    try {
      setIsDeleting(true);
      await deleteForumThread(token, threadToDelete);
      handleBack();
      await fetchThreads();
    } catch (error) {
      toast.error("Gagal menghapus diskusi");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setThreadToDelete(null);
    }
  };

  const handlePinThread = async (threadId: string) => {
    await togglePinThread(token, threadId);
    await fetchThreads();
  };

  const handleUpdateReply = async (replyId: string, content: string) => {
    await updateForumReply(token, replyId, content);
    await fetchThreadDetail();
  };

  const handleDeleteReply = async (replyId: string) => {
    await deleteForumReply(token, replyId);
    await fetchThreadDetail();
  };

  if (loadingCourses) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-destructive/50">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Gagal memuat forum</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">Tidak ada course tersedia</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Anda belum terdaftar dalam course apapun. Daftar ke course terlebih dahulu untuk mengakses forum diskusi.
        </p>
        <Button asChild>
          <a href="/mahasiswa/courses">Lihat Course Tersedia</a>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Selector */}
      {courses.length > 0 && (
        <div className="flex items-center gap-4">
          <Label htmlFor="course-select">Pilih Course:</Label>
          <Select value={selectedCourseId || ""} onValueChange={setSelectedCourseId}>
            <SelectTrigger id="course-select" className="w-[300px]">
              <SelectValue placeholder="Pilih course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {view === "list" ? (
        <>
          {loadingThreads ? (
            <div className="space-y-4">
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-muted rounded" />
                <div className="h-32 bg-muted rounded" />
                <div className="h-32 bg-muted rounded" />
              </div>
            </div>
          ) : (
            <ForumThreadList
              threads={threads}
              onThreadClick={handleThreadClick}
              canCreate={true}
              onCreateThread={() => setIsCreateDialogOpen(true)}
              currentUserId={userId}
              userRole={role}
              onPinThread={handlePinThread}
              onDeleteThread={handleDeleteThreadClick}
            />
          )}

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Diskusi Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateThread} className="space-y-4">
                <div>
                  <Label htmlFor="course">Course *</Label>
                  <Select
                    value={createCourseId || selectedCourseId || ""}
                    onValueChange={setCreateCourseId}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Judul *</Label>
                  <Input id="title" name="title" required placeholder="Masukkan judul diskusi" />
                </div>
                <div>
                  <Label htmlFor="content">Konten *</Label>
                  <Textarea
                    id="content"
                    name="content"
                    required
                    placeholder="Tulis pertanyaan atau topik diskusi Anda"
                    rows={6}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Buat Diskusi</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        currentThread && (
          <ForumThreadDetail
            thread={currentThread}
            onBack={handleBack}
            onReply={handleReply}
            onUpdateThread={handleUpdateThread}
            onDeleteThread={handleDeleteThreadClick}
            onUpdateReply={handleUpdateReply}
            onDeleteReply={handleDeleteReply}
            onPinThread={handlePinThread}
            currentUserId={userId}
            userRole={role}
          />
        )
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Hapus Diskusi"
        description="Apakah Anda yakin ingin menghapus diskusi ini? Semua balasan juga akan dihapus. Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDeleteThreadConfirm}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
