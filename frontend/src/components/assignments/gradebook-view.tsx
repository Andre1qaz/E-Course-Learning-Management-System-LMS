"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Table, User } from "lucide-react";
import { toast } from "sonner";

// Heuristic #16: Instructional Assessment — comprehensive gradebook view
// Heuristic #21: Motivation to Learn — clear progress visualization

interface GradebookViewProps {
  courseId: string;
}

interface GradebookData {
  course: {
    id: string;
    name: string;
  };
  assignments: Array<{
    id: string;
    title: string;
    maxScore: number;
  }>;
  gradebook: Array<{
    student: {
      id: string;
      name: string;
      email: string;
    };
    grades: Array<{
      assignmentId: string;
      assignmentTitle: string;
      maxScore: number;
      score: number | null;
      status: string | null;
      submittedAt: string | null;
    }>;
    totalScore: number;
    maxTotalScore: number;
    average: number;
  }>;
}

export function GradebookView({ courseId }: GradebookViewProps) {
  const { data: session } = useSession();
  const [gradebook, setGradebook] = useState<GradebookData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.accessToken) {
      fetchGradebook();
    }
  }, [courseId, session?.accessToken]);

  const fetchGradebook = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assignments/gradebook/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken ?? ""}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setGradebook(result.data);
      } else {
        toast.error(result.message || "Gagal memuat gradebook");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memuat gradebook");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!gradebook) return;

    const headers = ["Nama Mahasiswa", "Email", ...gradebook.assignments.map(a => a.title), "Total", "Rata-rata"];
    const rows = gradebook.gradebook.map(student => [
      student.student.name,
      student.student.email,
      ...student.grades.map(g => g.score !== null ? g.score.toString() : "-"),
      student.totalScore.toString(),
      student.average.toFixed(2)
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `gradebook_${gradebook.course.name.replace(/\s+/g, "_")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="skeleton h-64 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!gradebook) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Gagal memuat gradebook</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Table className="h-5 w-5 text-accent" />
          Gradebook — {gradebook.course.name}
        </CardTitle>
        <Button size="sm" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        {gradebook.gradebook.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Belum ada mahasiswa yang terdaftar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Mahasiswa</th>
                  {gradebook.assignments.map((assignment) => (
                    <th key={assignment.id} className="text-center py-3 px-4 font-medium">
                      {assignment.title}
                      <br />
                      <span className="text-xs text-muted-foreground">Max: {assignment.maxScore}</span>
                    </th>
                  ))}
                  <th className="text-center py-3 px-4 font-medium">Total</th>
                  <th className="text-center py-3 px-4 font-medium">Rata-rata</th>
                </tr>
              </thead>
              <tbody>
                {gradebook.gradebook.map((studentData, index) => (
                  <tr key={studentData.student.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <p className="font-medium">{studentData.student.name}</p>
                      <p className="text-xs text-muted-foreground">{studentData.student.email}</p>
                    </td>
                    {studentData.grades.map((grade) => (
                      <td key={grade.assignmentId} className="text-center py-3 px-4">
                        {grade.score !== null ? (
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              grade.score >= grade.maxScore * 0.8
                                ? "bg-success/10 text-success"
                                : grade.score >= grade.maxScore * 0.6
                                ? "bg-warning/10 text-warning"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            {grade.score}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    ))}
                    <td className="text-center py-3 px-4 font-medium">
                      {studentData.totalScore} / {studentData.maxTotalScore}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          studentData.average >= 80
                            ? "bg-success/10 text-success"
                            : studentData.average >= 60
                            ? "bg-warning/10 text-warning"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {studentData.average.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
