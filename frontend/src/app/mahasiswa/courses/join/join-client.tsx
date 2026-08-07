"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, ArrowRight, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface JoinCourseClientProps {
  token: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  description: string | null;
  thumbnailColor: string;
  category: { name: string } | null;
  instructor: { id: string; name: string } | null;
  _count: {
    modules: number;
    assignments: number;
    exams: number;
    enrollments: number;
  };
}

export function JoinCourseClient({ token }: JoinCourseClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");

  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [joinedCourse, setJoinedCourse] = useState<any>(null);
  const [courseInfo, setCourseInfo] = useState<Course | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(false);

  // Fetch course info if courseId is provided
  useEffect(() => {
    if (courseId) {
      fetchCourseInfo(courseId);
    }
  }, [courseId, token]);

  const fetchCourseInfo = async (id: string) => {
    setLoadingCourse(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setCourseInfo(result.data);
      } else {
        toast.error(result.message || "Gagal memuat informasi course");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memuat informasi course");
    } finally {
      setLoadingCourse(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!enrollmentCode.trim()) {
      toast.error("Kode enrollment wajib diisi");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/enroll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ enrollmentCode: enrollmentCode.trim().toUpperCase() }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setJoinedCourse(result.data);
        toast.success("Berhasil bergabung ke course!");
        setEnrollmentCode("");
      } else {
        toast.error(result.message || "Kode enrollment tidak valid");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat bergabung ke course");
    } finally {
      setLoading(false);
    }
  };

  const goToCourse = () => {
    if (joinedCourse?.courseId) {
      router.push(`/mahasiswa/courses/${joinedCourse.courseId}`);
    }
  };

  const joinAnother = () => {
    setJoinedCourse(null);
    setCourseInfo(null);
    setEnrollmentCode("");
    router.push("/mahasiswa/courses/join");
  };

  const browseCourses = () => {
    router.push("/mahasiswa/courses/available");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {!joinedCourse ? (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="font-display text-2xl">Gabung Course</CardTitle>
              <CardDescription>
                Masukkan kode enrollment yang diberikan dosen untuk bergabung ke course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {courseInfo && (
                <div className="mb-6 p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{courseInfo.name}</p>
                      <p className="text-xs text-muted-foreground">{courseInfo.code}</p>
                      {courseInfo.instructor && (
                        <p className="text-xs text-muted-foreground">Instructor: {courseInfo.instructor.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="enrollmentCode">Kode Enrollment</Label>
                  <Input
                    id="enrollmentCode"
                    value={enrollmentCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnrollmentCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: WEB2025"
                    disabled={loading}
                    maxLength={10}
                    className="text-center text-lg font-mono tracking-wider"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Kode enrollment bersifat case-insensitive
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Memproses..." : "Gabung Course"}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={browseCourses}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse Available Courses
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => router.push("/mahasiswa/courses")}
                >
                  Back to My Courses
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="font-display text-2xl">Berhasil Bergabung!</CardTitle>
              <CardDescription>
                Anda telah berhasil bergabung ke course
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold text-lg">{joinedCourse.courseName}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={joinAnother}
                >
                  Gabung Course Lain
                </Button>
                <Button
                  className="flex-1"
                  onClick={goToCourse}
                >
                  Buka Course
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
