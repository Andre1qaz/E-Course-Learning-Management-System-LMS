"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssignmentSubmitDialog } from "./assignment-submit-dialog";
import { FileText, Clock, Calendar, CheckCircle2, AlertCircle, Download, Video, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  deadline: string;
  maxScore: number;
  createdAt: string;
  updatedAt: string;
  course: {
    id: string;
    name: string;
  };
  metadata?: {
    uploadedFiles?: Array<{
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }>;
    videoUrl?: string;
  };
}

interface Submission {
  id: string;
  fileName: string | null;
  fileUrl: string | null;
  submittedAt: string | null;
  score: number | null;
  feedback: string | null;
  status: string;
}

interface StudentAssignmentDetailProps {
  assignment: Assignment;
  submission: Submission | null;
  courseId: string;
  token: string;
}

export function StudentAssignmentDetail({
  assignment,
  submission,
  courseId,
  token,
}: StudentAssignmentDetailProps) {
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isPastDeadline, setIsPastDeadline] = useState(false);

  useEffect(() => {
    const deadline = new Date(assignment.deadline);
    setIsPastDeadline(new Date() > deadline);
  }, [assignment.deadline]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = () => {
    if (submission) {
      if (submission.status === "GRADED") {
        return (
          <Badge className="bg-success/10 text-success">
            <CheckCircle2 className="icon-xs mr-1" />
            Dinilai: {submission.score}/{assignment.maxScore}
          </Badge>
        );
      }
      return (
        <Badge variant="secondary">
          <CheckCircle2 className="icon-xs mr-1" />
          Disubmit
        </Badge>
      );
    }
    if (isPastDeadline) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="icon-xs mr-1" />
          Deadline Terlewati
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Clock className="icon-xs mr-1" />
        Belum Disubmit
      </Badge>
    );
  };

  const handleSubmitSuccess = () => {
    toast.success("Tugas berhasil disubmit");
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{assignment.title}</h1>
          <p className="text-muted-foreground mt-1">{assignment.course.name}</p>
        </div>
        {getStatusBadge()}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="icon-md" />
            Deskripsi Tugas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignment.description && (
            <div className="prose prose-sm max-w-none">
              <p>{assignment.description}</p>
            </div>
          )}

          {/* Show uploaded files */}
          {assignment.metadata?.uploadedFiles && assignment.metadata.uploadedFiles.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <p className="text-sm font-medium">Dokumen Tugas:</p>
              <div className="space-y-2">
                {assignment.metadata.uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(file.fileUrl, '_blank')}
                    >
                      <Download className="icon-xs mr-1" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show video URL */}
          {assignment.metadata?.videoUrl && (
            <div className="space-y-2 pt-4 border-t">
              <p className="text-sm font-medium">Video Referensi:</p>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Video className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{assignment.metadata?.videoUrl}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(assignment.metadata?.videoUrl || '', '_blank')}
                >
                  <ExternalLink className="icon-xs mr-1" />
                  Tonton Video
                </Button>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Clock className="icon-sm text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="font-medium">{formatDate(assignment.deadline)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="icon-sm text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nilai Maksimal</p>
                <p className="font-medium">{assignment.maxScore} poin</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {submission ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="icon-md" />
              Submission Anda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="icon-sm text-muted-foreground" />
                <div>
                  <p className="font-medium">{submission.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    Disubmit pada: {formatDate(submission.submittedAt!)}
                  </p>
                </div>
              </div>
              {submission.fileUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(submission.fileUrl!, '_blank')}
                >
                  <Download className="icon-xs mr-1" />
                  Download
                </Button>
              )}
            </div>

            {submission.status === "GRADED" && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="icon-sm text-success" />
                  <p className="font-medium">Nilai: {submission.score}/{assignment.maxScore}</p>
                </div>
                {submission.feedback && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Feedback:</p>
                    <p className="text-sm">{submission.feedback}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="icon-md" />
              Submit Tugas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPastDeadline ? (
              <div className="text-center py-8">
                <AlertCircle className="icon-xl text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Deadline telah terlewati. Anda tidak dapat mengumpulkan tugas ini lagi.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="icon-xl text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Anda belum mengumpulkan tugas ini. Silakan upload file tugas Anda sebelum deadline.
                </p>
                <Button onClick={() => setShowSubmitDialog(true)}>
                  Upload Tugas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AssignmentSubmitDialog
        open={showSubmitDialog}
        onOpenChange={setShowSubmitDialog}
        assignmentId={assignment.id}
        assignmentTitle={assignment.title}
        token={token}
        onSuccess={handleSubmitSuccess}
      />
    </div>
  );
}
