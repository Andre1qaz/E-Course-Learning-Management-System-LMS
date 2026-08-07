"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

interface AvailableCoursesClientProps {
  token: string;
}

export function AvailableCoursesClient({ token }: AvailableCoursesClientProps) {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [joiningCourse, setJoiningCourse] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, [searchQuery]);

  const fetchCourses = async () => {
    try {
      const url = searchQuery
        ? `${process.env.NEXT_PUBLIC_API_URL}/courses/available?search=${encodeURIComponent(searchQuery)}`
        : `${process.env.NEXT_PUBLIC_API_URL}/courses/available`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setCourses(result.data);
      } else {
        toast.error(result.message || "Gagal memuat courses");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memuat courses");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    fetchCourses();
  };

  const handleJoin = async (courseId: string, enrollmentCode: string) => {
    setJoiningCourse(courseId);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/enroll`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ enrollmentCode }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Berhasil bergabung ke course!");
        // Refresh the available courses list
        fetchCourses();
      } else {
        toast.error(result.message || "Gagal bergabung ke course");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat bergabung ke course");
    } finally {
      setJoiningCourse(null);
    }
  };

  const goToEnroll = (courseId: string) => {
    router.push(`/mahasiswa/courses/join?courseId=${courseId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold">Available Courses</h1>
          <p className="text-muted-foreground">
            Browse and join courses that are available for enrollment
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by course name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </form>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="skeleton h-24 rounded-t-xl" />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">No Available Courses</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "No courses match your search"
                : "There are no courses available for enrollment at the moment"}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <div
                  className="h-24 flex items-center justify-center relative"
                  style={{ backgroundColor: course.thumbnailColor }}
                >
                  <BookOpen className="h-12 w-12 text-white/80" />
                  {course.category && (
                    <Badge className="absolute top-3 right-3 bg-white/20 text-white border-white/30">
                      {course.category.name}
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <span className="font-mono text-sm">{course.code}</span>
                    {course.instructor && (
                      <>
                        <span>•</span>
                        <span>{course.instructor.name}</span>
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      <span>{course._count.modules} modules</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{course._count.enrollments} enrolled</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => goToEnroll(course.id)}
                    disabled={joiningCourse === course.id}
                  >
                    {joiningCourse === course.id ? (
                      "Joining..."
                    ) : (
                      <>
                        Join Course
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
