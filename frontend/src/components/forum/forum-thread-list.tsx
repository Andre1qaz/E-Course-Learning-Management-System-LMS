"use client";

import { useState } from "react";
import { ForumThread } from "@/lib/api";
import { MessageSquare, Pin, MessageCircle, Clock, User, Lock, CheckCircle, Paperclip, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

// Heuristic #1: Visibility of System Status — clear thread indicators
// Heuristic #18: Collaborative Learning — clear thread hierarchy and unread indicators

interface ForumThreadListProps {
  threads: ForumThread[];
  onThreadClick: (threadId: string) => void;
  canCreate?: boolean;
  onCreateThread?: () => void;
  currentUserId?: string;
  userRole?: string;
  onPinThread?: (threadId: string) => Promise<void>;
  onLockThread?: (threadId: string) => Promise<void>;
  onDeleteThread?: (threadId: string) => void | Promise<void>;
}

export function ForumThreadList({
  threads,
  onThreadClick,
  canCreate = true,
  onCreateThread,
  currentUserId,
  userRole,
  onPinThread,
  onLockThread,
  onDeleteThread,
}: ForumThreadListProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [threadToDelete, setThreadToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (threadId: string) => {
    setThreadToDelete(threadId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!threadToDelete) return;

    try {
      setIsDeleting(true);
      await onDeleteThread?.(threadToDelete);
    } catch (error) {
      console.error("Failed to delete thread:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setThreadToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Diskusi Forum</h2>
        {canCreate && onCreateThread && (
          <Button onClick={onCreateThread}>
            <MessageSquare className="icon-md mr-2" />
            Buat Diskusi Baru
          </Button>
        )}
      </div>

      {threads.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="icon-xl mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Belum ada diskusi</h3>
          <p className="text-muted-foreground mb-4">
            Mulai diskusi dengan bertanya atau berbagi informasi
          </p>
          {canCreate && onCreateThread && (
            <Button onClick={onCreateThread}>Buat Diskusi Pertama</Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <Card
              key={thread.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:border-accent/50 hover:shadow-md",
                thread.isPinned && "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20",
                thread.isLocked && "opacity-75"
              )}
              onClick={() => onThreadClick(thread.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {thread.isPinned && (
                      <Badge variant="secondary" className="bg-semantic-amber-light text-semantic-amber dark:bg-semantic-amber/20 dark:text-semantic-amber">
                        <Pin className="icon-sm mr-1" />
                        Disematkan
                      </Badge>
                    )}
                    {thread.isLocked && (
                      <Badge variant="secondary" className="bg-semantic-slate-light text-semantic-slate dark:bg-semantic-slate/20 dark:text-semantic-slate">
                        <Lock className="icon-sm mr-1" />
                        Dikunci
                      </Badge>
                    )}
                    {thread.bestReply && (
                      <Badge variant="secondary" className="bg-semantic-green-light text-semantic-green dark:bg-semantic-green/20 dark:text-semantic-green">
                        <CheckCircle className="icon-sm mr-1" />
                        Solusi
                      </Badge>
                    )}
                    {(thread.unreadCount || 0) > 0 && (
                      <Badge variant="default" className="bg-accent">
                        {thread.unreadCount} baru
                      </Badge>
                    )}
                    {thread.attachments && thread.attachments.length > 0 && (
                      <Badge variant="outline">
                        <Paperclip className="icon-sm mr-1" />
                        {thread.attachments.length}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1">{thread.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {thread.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="icon-sm" />
                      <span>{thread.author.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="icon-sm" />
                      <span>{formatDate(thread.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="icon-sm" />
                      <span>{thread._count?.replies || thread.replies.length} balasan</span>
                    </div>
                  </div>
                </div>
                {(userRole === "DOSEN" || userRole === "ADMIN" || thread.authorId === currentUserId) && (
                  <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                    {userRole === "DOSEN" || userRole === "ADMIN" ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPinThread?.(thread.id)}
                          title={thread.isPinned ? "Lepas semat" : "Sematkan"}
                        >
                          <Pin className={cn("icon-md", thread.isPinned && "fill-current")} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onLockThread?.(thread.id)}
                          title={thread.isLocked ? "Buka kunci" : "Kunci"}
                        >
                          <Lock className={cn("icon-md", thread.isLocked && "fill-current")} />
                        </Button>
                      </>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(thread.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="icon-md" />
                      Hapus
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Hapus Diskusi"
        description="Apakah Anda yakin ingin menghapus diskusi ini? Semua balasan juga akan dihapus. Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        variant="destructive"
      />
    </div>
  );
}
