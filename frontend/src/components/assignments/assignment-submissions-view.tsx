"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssignmentGradeDialog } from "./assignment-grade-dialog";
import { RubricGradingDialog } from "./rubric-grading-dialog";
import { RubricFormDialog } from "./rubric-form-dialog";
import { Download, FileText, Clock, CheckCircle2, Settings, GraduationCap } from "lucide-react";
import { toast } from "sonner";

// Heuristic #16: Instructional Assessment — comprehensive submissions management
// Heuristic #21: Motivation to Learn — clear status indicators

interface AssignmentSubmissionsViewProps {
  assignmentId: string;
  assignmentTitle: string;
  assignmentMaxScore: number;
  courseId: string;
  token: string;
}

interface Submission {
  id: string;
  fileName: string | null;
  fileUrl: string | null;
  submittedAt: string | null;
  score: number | null;
  feedback: string | null;
  rubricNotes: string | null;
  status: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  rubricAssessments?: Array<{
    id: string;
    rubricCriterionId: string;
    rubricCriterionLevelId: string | null;
    score: number;
    feedback: string | null;
  }>;
}

interface Rubric {
  id: string;
  name: string;
  totalPoints: number;
  criteria: Array<{
    id: string;
    name: string;
    description: string | null;
    maxPoints: number;
    order: number;
    levels: Array<{
      id: string;
      name: string;
      description: string;
      points: number;
      order: number;
    }>;
  }>;
}

export function AssignmentSubmissionsView({
  assignmentId,
  assignmentTitle,
  assignmentMaxScore,
  courseId,
  token,
}: AssignmentSubmissionsViewProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [showRubricDialog, setShowRubricDialog] = useState(false);
  const [showRubricGradingDialog, setShowRubricGradingDialog] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    fetchRubric();
  }, [assignmentId]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignmentId}/submissions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setSubmissions(result.data);
      } else {
        toast.error(result.message || "Gagal memuat submissions");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memuat submissions");
    } finally {
      setLoading(false);
    }
  };

  const fetchRubric = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rubrics/assignment/${assignmentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success && result.data) {
        setRubric(result.data);
      }
    } catch (error) {
      toast.error("Gagal memuat rubrik");
    }
  };

  const handleGrade = (submission: Submission) => {
    setSelectedSubmission(submission);
    if (rubric) {
      setShowRubricGradingDialog(true);
    } else {
      setShowGradeDialog(true);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "GRADED":
        return <Badge className="bg-success/10 text-success"><CheckCircle2 className="icon-xs mr-1" />Dinilai</Badge>;
      case "SUBMITTED":
        return <Badge variant="secondary">Disubmit</Badge>;
      case "LATE":
        return <Badge variant="destructive">Terlambat</Badge>;
      default:
        return <Badge variant="outline">Belum Submit</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{assignmentTitle}</h2>
          <p className="text-muted-foreground">Submissions Management</p>
        </div>
        <div className="flex gap-2">
          {rubric ? (
            <Button variant="outline" onClick={() => setShowRubricDialog(true)}>
              <Settings className="mr-2 icon-sm" />
              Edit Rubrik
            </Button>
          ) : (
            <Button onClick={() => setShowRubricDialog(true)}>
              <GraduationCap className="mr-2 icon-sm" />
              Buat Rubrik
            </Button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Submissions</p>
            <p className="text-2xl font-bold">{submissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Dinilai</p>
            <p className="text-2xl font-bold text-success">
              {submissions.filter((s) => s.status === "GRADED").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Belum Dinilai</p>
            <p className="text-2xl font-bold text-warning">
              {submissions.filter((s) => s.status !== "GRADED" && s.status !== "NOT_SUBMITTED").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Rata-rata Nilai</p>
            <p className="text-2xl font-bold text-primary">
              {submissions.filter((s) => s.score !== null).length > 0
                ? (
                    submissions
                      .filter((s) => s.score !== null)
                      .reduce((sum, s) => sum + (s.score || 0), 0) /
                    submissions.filter((s) => s.score !== null).length
                  ).toFixed(1)
                : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengumpulan</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="icon-xl mx-auto mb-2 opacity-50" />
              <p>Belum ada pengumpulan tugas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{submission.student.name}</p>
                        {getStatusBadge(submission.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{submission.student.email}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="icon-xs" />
                          <span>{formatDate(submission.submittedAt)}</span>
                        </div>
                        {submission.fileName && (
                          <div className="flex items-center gap-1">
                            <FileText className="icon-xs" />
                            <span>{submission.fileName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      {submission.score !== null ? (
                        <div>
                          <p className="text-2xl font-bold text-primary">{submission.score}</p>
                          <p className="text-xs text-muted-foreground">/ {assignmentMaxScore}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">-</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {submission.fileUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={submission.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Download className="icon-sm" />
                          Download
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleGrade(submission)}
                      disabled={submission.status === "NOT_SUBMITTED"}
                    >
                      {rubric ? "Nilai dengan Rubrik" : "Nilai"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Dialog */}
      {selectedSubmission && (
        <>
          <AssignmentGradeDialog
            open={showGradeDialog}
            onOpenChange={setShowGradeDialog}
            submission={{
              id: selectedSubmission.id,
              fileName: selectedSubmission.fileName,
              fileUrl: selectedSubmission.fileUrl,
              submittedAt: selectedSubmission.submittedAt,
              score: selectedSubmission.score,
              feedback: selectedSubmission.feedback,
              rubricNotes: selectedSubmission.rubricNotes,
              student: selectedSubmission.student,
              assignment: {
                id: assignmentId,
                title: assignmentTitle,
                maxScore: assignmentMaxScore,
              },
            }}
            hasRubric={!!rubric}
            onSwitchToRubricGrading={() => {
              setShowGradeDialog(false);
              setShowRubricGradingDialog(true);
            }}
            onSuccess={() => {
              fetchSubmissions();
              setShowGradeDialog(false);
            }}
          />

          {rubric && (
            <RubricGradingDialog
              open={showRubricGradingDialog}
              onOpenChange={setShowRubricGradingDialog}
              submission={{
                id: selectedSubmission.id,
                fileName: selectedSubmission.fileName,
                fileUrl: selectedSubmission.fileUrl,
                submittedAt: selectedSubmission.submittedAt,
                score: selectedSubmission.score,
                feedback: selectedSubmission.feedback,
                student: selectedSubmission.student,
                assignment: {
                  id: assignmentId,
                  title: assignmentTitle,
                  maxScore: assignmentMaxScore,
                },
              }}
              rubric={rubric}
              existingAssessments={selectedSubmission.rubricAssessments}
              onSuccess={() => {
                fetchSubmissions();
                setShowRubricGradingDialog(false);
              }}
            />
          )}
        </>
      )}

      {/* Rubric Form Dialog */}
      <RubricFormDialog
        open={showRubricDialog}
        onOpenChange={setShowRubricDialog}
        assignmentId={assignmentId}
        assignmentMaxScore={assignmentMaxScore}
        existingRubric={rubric}
        onSuccess={() => {
          fetchRubric();
          setShowRubricDialog(false);
        }}
      />
    </div>
  );
}
