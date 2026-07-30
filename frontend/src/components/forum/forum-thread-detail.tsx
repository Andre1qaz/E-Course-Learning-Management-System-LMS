"use client";

import { useState } from "react";
import { ForumThread, ForumReply } from "@/lib/api";
import { ArrowLeft, Pin, MessageCircle, User, Clock, Send, Edit2, Trash2, Lock, CheckCircle, Paperclip, AtSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Heuristic #1: Visibility of System Status — clear reply indicators
// Heuristic #18: Collaborative Learning — threaded reply structure

interface ForumThreadDetailProps {
  thread: ForumThread;
  onBack: () => void;
  onReply: (content: string, attachments?: Array<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }>) => Promise<void>;
  onUpdateThread?: (threadId: string, data: { title?: string; content?: string }) => Promise<void>;
  onDeleteThread?: (threadId: string) => Promise<void>;
  onUpdateReply?: (replyId: string, content: string) => Promise<void>;
  onDeleteReply?: (replyId: string) => Promise<void>;
  onPinThread?: (threadId: string) => Promise<void>;
  onLockThread?: (threadId: string) => Promise<void>;
  onMarkBestAnswer?: (threadId: string, replyId: string) => Promise<void>;
  onRemoveBestAnswer?: (threadId: string) => Promise<void>;
  onUploadAttachment?: (file: File) => Promise<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }>;
  currentUserId?: string;
  userRole?: string;
}

export function ForumThreadDetail({
  thread,
  onBack,
  onReply,
  onUpdateThread,
  onDeleteThread,
  onUpdateReply,
  onDeleteReply,
  onPinThread,
  onLockThread,
  onMarkBestAnswer,
  onRemoveBestAnswer,
  onUploadAttachment,
  currentUserId,
  userRole,
}: ForumThreadDetailProps) {
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState("");
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editThreadData, setEditThreadData] = useState({ title: thread.title, content: thread.content });
  const [replyAttachments, setReplyAttachments] = useState<Array<{ fileName: string; fileUrl: string; fileSize: number; mimeType: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmitReply = async () => {
    if (!replyContent.trim()) {
      toast.error("Balasan tidak boleh kosong");
      return;
    }

    try {
      setIsSubmitting(true);
      await onReply(replyContent, replyAttachments);
      setReplyContent("");
      setReplyAttachments([]);
      toast.success("Balasan berhasil dikirim");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengirim balasan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const file = files[0];
      const attachment = await onUploadAttachment?.(file);
      if (attachment) {
        setReplyAttachments([...replyAttachments, attachment]);
        toast.success("File berhasil diunggah");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengunggah file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setReplyAttachments(replyAttachments.filter((_, i) => i !== index));
  };

  const handleMarkBestAnswer = async (replyId: string) => {
    try {
      await onMarkBestAnswer?.(thread.id, replyId);
      toast.success("Jawaban ditandai sebagai solusi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menandai jawaban");
    }
  };

  const handleRemoveBestAnswer = async () => {
    try {
      await onRemoveBestAnswer?.(thread.id);
      toast.success("Solusi dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus solusi");
    }
  };

  const handleLockThread = async () => {
    try {
      await onLockThread?.(thread.id);
      toast.success(thread.isLocked ? "Diskusi dibuka kembali" : "Diskusi dikunci");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengubah status kunci");
    }
  };

  const renderContentWithMentions = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = content.split(mentionRegex);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} className="text-accent font-medium">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  const handleUpdateReply = async (replyId: string) => {
    if (!editReplyContent.trim()) {
      toast.error("Balasan tidak boleh kosong");
      return;
    }

    try {
      await onUpdateReply?.(replyId, editReplyContent);
      setEditingReplyId(null);
      setEditReplyContent("");
      toast.success("Balasan berhasil diperbarui");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui balasan");
    }
  };

  const handleUpdateThread = async () => {
    if (!editThreadData.title.trim() || !editThreadData.content.trim()) {
      toast.error("Judul dan konten tidak boleh kosong");
      return;
    }

    try {
      await onUpdateThread?.(thread.id, editThreadData);
      setIsEditingThread(false);
      toast.success("Diskusi berhasil diperbarui");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui diskusi");
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus balasan ini?")) return;
    
    try {
      await onDeleteReply?.(replyId);
      toast.success("Balasan berhasil dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus balasan");
    }
  };

  const handleDeleteThread = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus diskusi ini? Semua balasan juga akan dihapus.")) return;
    
    try {
      await onDeleteThread?.(thread.id);
      toast.success("Diskusi berhasil dihapus");
      onBack();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus diskusi");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          {thread.course && (
            <p className="text-sm text-muted-foreground">
              {thread.course.code} - {thread.course.name}
            </p>
          )}
        </div>
        {(userRole === "DOSEN" || userRole === "ADMIN" || thread.authorId === currentUserId) && (
          <div className="flex gap-2 flex-wrap">
            {userRole === "DOSEN" || userRole === "ADMIN" ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPinThread?.(thread.id)}
                >
                  <Pin className={cn("h-4 w-4 mr-2", thread.isPinned && "fill-current")} />
                  {thread.isPinned ? "Lepas Semat" : "Sematkan"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLockThread}
                >
                  <Lock className={cn("h-4 w-4 mr-2", thread.isLocked && "fill-current")} />
                  {thread.isLocked ? "Buka Kunci" : "Kunci"}
                </Button>
                {thread.bestReply && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveBestAnswer}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Hapus Solusi
                  </Button>
                )}
              </>
            ) : null}
            {thread.authorId === currentUserId && (
              <Button variant="outline" size="sm" onClick={() => setIsEditingThread(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={handleDeleteThread}>
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus
            </Button>
          </div>
        )}
      </div>

      {/* Thread Content */}
      <Card className="p-6">
        {isEditingThread ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Judul</Label>
              <input
                id="edit-title"
                value={editThreadData.title}
                onChange={(e) => setEditThreadData({ ...editThreadData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Konten</Label>
              <Textarea
                id="edit-content"
                value={editThreadData.content}
                onChange={(e) => setEditThreadData({ ...editThreadData, content: e.target.value })}
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateThread}>Simpan</Button>
              <Button variant="outline" onClick={() => setIsEditingThread(false)}>
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-4 mb-4 flex-wrap">
              {thread.isPinned && (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  <Pin className="h-3 w-3 mr-1" />
                  Disematkan
                </Badge>
              )}
              {thread.isLocked && (
                <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                  <Lock className="h-3 w-3 mr-1" />
                  Dikunci
                </Badge>
              )}
              {thread.attachments && thread.attachments.length > 0 && (
                <Badge variant="outline">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {thread.attachments.length} lampiran
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-4">{thread.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarImage src={thread.author.avatarUrl || undefined} />
                <AvatarFallback>{getInitials(thread.author.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{thread.author.name}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(thread.createdAt)}
                </p>
              </div>
            </div>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{renderContentWithMentions(thread.content)}</p>
            </div>
            {thread.attachments && thread.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">Lampiran:</h4>
                {thread.attachments.map((att, idx) => (
                  <a
                    key={idx}
                    href={att.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-accent hover:underline"
                  >
                    <Paperclip className="h-4 w-4" />
                    {att.fileName}
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Replies */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h2 className="text-xl font-semibold">
            Balasan ({thread.replies.length})
          </h2>
        </div>

        {thread.replies.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Belum ada balasan</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {thread.replies.map((reply) => (
              <Card key={reply.id} className={cn("p-4", thread.bestReplyId === reply.id && "border-green-500/50 bg-green-50/50 dark:bg-green-950/20")}>
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src={reply.author.avatarUrl || undefined} />
                    <AvatarFallback>{getInitials(reply.author.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-medium text-sm">{reply.author.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(reply.createdAt)}
                      </p>
                      {reply.updatedAt !== reply.createdAt && (
                        <Badge variant="outline" className="text-xs">
                          Diedit
                        </Badge>
                      )}
                      {thread.bestReplyId === reply.id && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Solusi
                        </Badge>
                      )}
                    </div>
                    {editingReplyId === reply.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editReplyContent}
                          onChange={(e) => setEditReplyContent(e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleUpdateReply(reply.id)}>
                            Simpan
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingReplyId(null);
                              setEditReplyContent("");
                            }}
                          >
                            Batal
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap">{renderContentWithMentions(reply.content)}</p>
                        {reply.attachments && reply.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {reply.attachments.map((att: any, idx: number) => (
                              <a
                                key={idx}
                                href={att.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-accent hover:underline"
                              >
                                <Paperclip className="h-3 w-3" />
                                {att.fileName}
                              </a>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {(userRole === "DOSEN" || userRole === "ADMIN" || thread.authorId === currentUserId) && thread.bestReplyId !== reply.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700"
                        onClick={() => handleMarkBestAnswer(reply.id)}
                        title="Tandai sebagai solusi"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {reply.author.id === currentUserId && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingReplyId(reply.id);
                            setEditReplyContent(reply.content);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteReply(reply.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reply Form */}
      {!thread.isLocked && (
        <Card className="p-4">
          <h3 className="font-medium mb-3">Tulis Balasan</h3>
          <div className="space-y-3">
            <Textarea
              placeholder="Tulis balasan Anda... Gunakan @username untuk menyebut pengguna lain"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={4}
            />
            {replyAttachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Lampiran:</h4>
                {replyAttachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Paperclip className="h-4 w-4" />
                    <span>{att.fileName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="h-6 w-6 p-0 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isUploading}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  {isUploading ? "Mengunggah..." : "Lampirkan File"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Gunakan @username untuk menyebut pengguna lain
                </p>
              </div>
              <Button onClick={handleSubmitReply} disabled={isSubmitting || !replyContent.trim()}>
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Mengirim..." : "Kirim Balasan"}
              </Button>
            </div>
          </div>
        </Card>
      )}
      {thread.isLocked && (
        <Card className="p-4 text-center">
          <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Diskusi ini telah dikunci dan tidak menerima balasan baru</p>
        </Card>
      )}
    </div>
  );
}
