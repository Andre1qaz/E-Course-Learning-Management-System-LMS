"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar, ChevronDown, ChevronRight, Plus, Settings, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { WeekAccordion } from "./week-accordion";
import { AddActivityDialog } from "./add-activity-dialog";
import { CreateWeekDialog } from "./create-week-dialog";
import { AnnouncementsList } from "@/components/announcements/announcements-list";
import { CreateAnnouncementDialog } from "@/components/announcements/create-announcement-dialog";

interface Week {
  id: string;
  weekNumber: number;
  title: string;
  startDate: string;
  endDate: string;
  order: number;
  activities: Activity[];
  exams?: Exam[];
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  deadline: string;
  duration: number;
  isPublished: boolean;
  _count: {
    questions: number;
    attempts: number;
  };
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  metadata: any;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CourseDetailClientProps {
  courseId: string;
  token: string;
  userRole: string;
}

export function CourseDetailClient({ courseId, token, userRole }: CourseDetailClientProps) {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showCreateWeek, setShowCreateWeek] = useState(false);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  const canEdit = userRole === "ADMIN" || userRole === "DOSEN";

  useEffect(() => {
    fetchWeeks();
    fetchAllExams();
  }, [courseId]);

  const fetchWeeks = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}/weeks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setWeeks(result.data);
      } else {
        toast.error(result.message || "Gagal memuat weeks");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memuat weeks");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllExams = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/exams/course/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setAllExams(result.data);
      }
    } catch (error) {
      console.error("Terjadi kesalahan saat memuat exams");
    }
  };

  const toggleWeek = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };

  const handleAddActivity = (weekId: string) => {
    setSelectedWeekId(weekId);
    setShowAddActivity(true);
  };

  const handleActivityCreated = () => {
    setShowAddActivity(false);
    setSelectedWeekId(null);
    fetchWeeks();
    fetchAllExams();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="space-y-6">
        {/* Course Announcements */}
        <div className="flex items-center justify-between">
          <AnnouncementsList courseId={courseId} basePath="" limit={5} />
          {canEdit && (
            <Button className="gap-2" onClick={() => setShowCreateAnnouncement(true)}>
              <Plus className="h-4 w-4" />
              Buat Pengumuman
            </Button>
          )}
        </div>

        {/* Empty State */}
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">Belum ada week</h3>
          <p className="text-muted-foreground mb-4">
            {canEdit ? "Mulai dengan membuat week pertama" : "Belum ada materi pembelajaran"}
          </p>
          {canEdit && (
            <Button onClick={() => setShowCreateWeek(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Buat Week
            </Button>
          )}
        </div>

        {showCreateWeek && (
          <CreateWeekDialog
            open={showCreateWeek}
            onOpenChange={setShowCreateWeek}
            courseId={courseId}
            token={token}
            onSuccess={fetchWeeks}
          />
        )}

        {showCreateAnnouncement && (
          <CreateAnnouncementDialog
            open={showCreateAnnouncement}
            onOpenChange={setShowCreateAnnouncement}
            token={token}
            courseId={courseId}
            userRole={userRole}
            onSuccess={() => {
              setShowCreateAnnouncement(false);
              window.location.reload();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Announcements */}
      <div className="flex items-center justify-between">
        <AnnouncementsList courseId={courseId} basePath="" limit={5} />
        {canEdit && (
          <Button className="gap-2" onClick={() => setShowCreateAnnouncement(true)}>
            <Plus className="h-4 w-4" />
            Buat Pengumuman
          </Button>
        )}
      </div>

      {/* Course Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Materi Pembelajaran</h2>
          {canEdit && (
            <Button className="gap-2" onClick={() => setShowCreateWeek(true)}>
              <Plus className="h-4 w-4" />
              Buat Week
            </Button>
          )}
        </div>
        {weeks.map((week) => (
          <WeekAccordion
            key={week.id}
            week={week}
            isExpanded={expandedWeeks.has(week.weekNumber)}
            onToggle={() => toggleWeek(week.weekNumber)}
            canEdit={canEdit}
            onAddActivity={() => handleAddActivity(week.id)}
            onActivityChange={() => {
              fetchWeeks();
              fetchAllExams();
            }}
            token={token}
            userRole={userRole}
            courseId={courseId}
          />
        ))}
      </div>

      {/* All Course Exams Section */}
      {allExams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Semua Ujian Course</h2>
            {canEdit && (
              <Button className="gap-2" asChild>
                <a href={userRole === "ADMIN" ? `/admin/exams` : `/dosen/exams`}>
                  <Plus className="h-4 w-4" />
                  Kelola Ujian
                </a>
              </Button>
            )}
          </div>
          <div className="grid gap-4">
            {allExams.map((exam) => (
              <Card key={exam.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{exam.title}</h4>
                        {!exam.isPublished && (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </div>
                      {exam.description && (
                        <p className="text-sm text-muted-foreground mb-2">{exam.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="icon-xs" />
                          <span>{exam.duration} menit</span>
                        </div>
                        <span>{exam._count.questions} soal</span>
                        <span>{formatDate(exam.startTime)}</span>
                      </div>
                    </div>
                    {userRole === "MAHASISWA" && exam.isPublished && (
                      <Button
                        size="sm"
                        asChild
                      >
                        <a href={`/mahasiswa/exams/${exam.id}`}>
                          Buka Ujian
                        </a>
                      </Button>
                    )}
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a href={userRole === "ADMIN" ? `/admin/exams/${exam.id}/questions` : `/dosen/exams/${exam.id}/questions`}>
                          Kelola Soal
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {showAddActivity && selectedWeekId && (
        <AddActivityDialog
          open={showAddActivity}
          onOpenChange={setShowAddActivity}
          weekId={selectedWeekId}
          token={token}
          courseId={courseId}
          onSuccess={handleActivityCreated}
        />
      )}

      {showCreateWeek && (
        <CreateWeekDialog
          open={showCreateWeek}
          onOpenChange={setShowCreateWeek}
          courseId={courseId}
          token={token}
          onSuccess={fetchWeeks}
        />
      )}

      {showCreateAnnouncement && (
        <CreateAnnouncementDialog
          open={showCreateAnnouncement}
          onOpenChange={setShowCreateAnnouncement}
          token={token}
          courseId={courseId}
          userRole={userRole}
          onSuccess={() => {
            setShowCreateAnnouncement(false);
            // Refresh announcements by reloading the component
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
