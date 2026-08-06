"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CourseCard } from "@/components/courses/course-card";
import { CourseFormDialog } from "@/components/courses/course-form-dialog";
import { toast } from "sonner";

interface Course {
  id: string;
  name: string;
  code: string;
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

interface CoursesClientProps {
  token: string;
  role: "ADMIN" | "DOSEN" | "MAHASISWA";
  basePath: string;
  title: string;
  subtitle: string;
  emptyStateMessage?: string;
}

export function CoursesClient({
  token,
  role,
  basePath,
  title,
  subtitle,
  emptyStateMessage
}: CoursesClientProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const canEdit = role === "ADMIN" || role === "DOSEN";
  const canCreate = role === "ADMIN" || role === "DOSEN";

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses?search=${searchQuery}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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

  const handleCourseCreated = () => {
    fetchCourses();
  };

  const handleCourseUpdated = () => {
    fetchCourses();
    setEditingCourse(null);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (role === "MAHASISWA") return; // Students cannot delete courses
    
    if (!confirm("Apakah Anda yakin ingin menghapus course ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Course berhasil dihapus");
        fetchCourses();
      } else {
        toast.error(result.message || "Gagal menghapus course");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menghapus course");
    }
  };

  const handleEditCourse = (courseId: string) => {
    if (role === "MAHASISWA") return; // Students cannot edit courses
    
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setEditingCourse(course);
    }
  };

  const getCourseHref = (courseId: string) => {
    return `${basePath}/courses/${courseId}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          {canCreate && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Buat Course Baru
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <form onSubmit={handleSearch} className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari course berdasarkan nama atau kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
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
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">Belum ada course</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Tidak ada course yang cocok dengan pencarian" : emptyStateMessage || "Mulai dengan membuat course pertama"}
            </p>
            {!searchQuery && canCreate && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Course Baru
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                name={course.name}
                code={course.code}
                thumbnailColor={course.thumbnailColor}
                category={course.category}
                instructor={course.instructor}
                href={getCourseHref(course.id)}
                stats={{
                  modules: course._count.modules,
                  assignments: course._count.assignments,
                  exams: course._count.exams,
                  enrollments: course._count.enrollments,
                }}
                canEdit={canEdit}
                onDelete={handleDeleteCourse}
                onEdit={handleEditCourse}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Course Dialog */}
      <CourseFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCourseCreated}
      />

      {/* Edit Course Dialog */}
      {editingCourse && (
        <CourseFormDialog
          open={!!editingCourse}
          onOpenChange={(open) => !open && setEditingCourse(null)}
          course={editingCourse}
          onSuccess={handleCourseUpdated}
        />
      )}
    </div>
  );
}