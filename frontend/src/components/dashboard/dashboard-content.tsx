"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, Filter, Plus, BookOpen, Calendar as CalendarIcon, Clock, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/courses/course-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnouncementsList } from "@/components/announcements/announcements-list";
import { apiFetch, CalendarEvent, getUpcomingEvents } from "@/lib/api";
import { EventCategory } from "@/lib/api";

interface Course {
  id: string;
  name: string;
  code: string;
  thumbnailColor: string;
  category?: { name: string } | null;
  instructor?: { name: string } | null;
  progress?: number;
  _count?: {
    modules: number;
    assignments: number;
    exams: number;
    enrollments: number;
  };
}

interface DashboardContentProps {
  role: string;
  basePath: string;
  title: string;
  subtitle: string;
}

const EVENT_CATEGORIES: { value: EventCategory; label: string; color: string }[] = [
  { value: "PERKULIAHAN", label: "Perkuliahan", color: "#1a365d" },
  { value: "MATERI_BARU", label: "Materi Baru", color: "#2d6a4f" },
  { value: "ASSIGNMENT", label: "Assignment", color: "#f4a261" },
  { value: "QUIZ", label: "Quiz", color: "#e07a5f" },
  { value: "UTS", label: "UTS", color: "#e07a5f" },
  { value: "UAS", label: "UAS", color: "#c1121f" },
  { value: "SEMINAR", label: "Seminar", color: "#457b9d" },
  { value: "PROJECT", label: "Project", color: "#1d3557" },
  { value: "MEETING", label: "Meeting", color: "#6c757d" },
  { value: "DEADLINE", label: "Deadline", color: "#f4a261" },
  { value: "PENGUMUMAN_AKADEMIK", label: "Pengumuman Akademik", color: "#1a365d" },
];

export function DashboardContent({
  role,
  basePath,
  title,
  subtitle,
}: DashboardContentProps) {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    async function fetchData() {
      if (!session?.accessToken) return;

      try {
        const [coursesRes, eventsRes] = await Promise.all([
          apiFetch<Course[]>("/courses/dashboard", {}, session.accessToken),
          getUpcomingEvents(session.accessToken, 5),
        ]);
        setCourses(coursesRes.data ?? []);
        setUpcomingEvents(eventsRes.data ?? []);
      } catch {
        setCourses([]);
        setUpcomingEvents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session?.accessToken]);

  const categories = [
    ...new Set(courses.map((c) => c.category?.name).filter(Boolean)),
  ] as string[];

  const filtered = courses.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      categoryFilter === "all" || c.category?.name === categoryFilter;
    return matchSearch && matchCategory;
  });

  const grouped = categories.reduce(
    (acc, cat) => {
      acc[cat] = filtered.filter((c) => c.category?.name === cat);
      return acc;
    },
    {} as Record<string, Course[]>,
  );

  const uncategorized = filtered.filter((c) => !c.category);

  const getCategoryInfo = (category: EventCategory) => {
    return EVENT_CATEGORIES.find(c => c.value === category) || EVENT_CATEGORIES[10];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        {(role === "DOSEN" || role === "ADMIN") && (
          <Button className="gap-2" onClick={() => window.location.href = `${basePath}/courses`}>
            <Plus className="size-4" />
            Buat Course
          </Button>
        )}
        {role === "MAHASISWA" && (
          <Button className="gap-2" onClick={() => window.location.href = `${basePath}/courses/join`}>
            <Plus className="size-4" />
            Gabung Course
          </Button>
        )}
      </div>

      {/* Announcements Panel */}
      <AnnouncementsList basePath={basePath} limit={3} />

      {/* Upcoming Events Panel */}
      {upcomingEvents.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Event Mendatang
              </h3>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400" onClick={() => window.location.href = `${basePath}/calendar`}>
              Lihat Semua
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {upcomingEvents.slice(0, 3).map((event) => {
              const catInfo = getCategoryInfo(event.category);
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
                  onClick={() => window.location.href = `${basePath}/calendar`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: event.color || catInfo.color }}
                    />
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs" style={{ borderColor: catInfo.color, color: catInfo.color }}>
                          {catInfo.label}
                        </Badge>
                        {event.course && (
                          <p className="text-xs text-muted-foreground">
                            {event.course.code}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {new Date(event.startDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {event.timeRemaining || new Date(event.startDate).toLocaleDateString("id-ID", { weekday: "short" })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari course berdasarkan nama atau kode..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Semua Tahun Ajaran</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-48 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <BookOpen className="size-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-display text-lg font-semibold">Belum ada course</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {role === "MAHASISWA"
              ? "Gabung course menggunakan kode enrollment dari dosen Anda."
              : "Buat course pertama Anda untuk memulai."}
          </p>
        </div>
      ) : (
        <>
          {Object.entries(grouped).map(([cat, catCourses]) =>
            catCourses.length > 0 ? (
              <section key={cat}>
                <h2 className="font-display mb-4 text-lg font-semibold text-muted-foreground">
                  {cat}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {catCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      {...course}
                      href={`${basePath}/courses/${course.id}`}
                      stats={{
                        modules: course._count?.modules,
                        enrollments: course._count?.enrollments,
                      }}
                    />
                  ))}
                </div>
              </section>
            ) : null,
          )}
          {uncategorized.length > 0 && (
            <section>
              <h2 className="font-display mb-4 text-lg font-semibold text-muted-foreground">
                Lainnya
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {uncategorized.map((course) => (
                  <CourseCard
                    key={course.id}
                    {...course}
                    href={`${basePath}/courses/${course.id}`}
                    stats={{
                      modules: course._count?.modules,
                      enrollments: course._count?.enrollments,
                    }}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
