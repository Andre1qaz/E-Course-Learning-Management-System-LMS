"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  Bell,
  TrendingUp,
  Award,
  AlertCircle
} from "lucide-react";

interface StudentStats {
  totalCourses: number;
  incompleteAssignments: number;
  upcomingEvents: any[];
  recentAnnouncements: any[];
  averageGrade: number;
  averageProgress: number;
  unreadNotifications: number;
}

export function StudentDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!session?.accessToken) return;

      try {
        const response = await apiFetch<StudentStats>("/dashboard/student", {}, session.accessToken);
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch student stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [session?.accessToken]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="skeleton h-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "Course yang Diikuti",
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      color: "text-semantic-blue",
      bgColor: "bg-semantic-blue-light",
    },
    {
      title: "Assignment Belum Diselesaikan",
      value: stats?.incompleteAssignments || 0,
      icon: FileText,
      color: "text-semantic-orange",
      bgColor: "bg-semantic-orange-light",
    },
    {
      title: "Rata-rata Nilai",
      value: stats?.averageGrade ? stats.averageGrade.toFixed(1) : "0",
      icon: Award,
      color: "text-semantic-green",
      bgColor: "bg-semantic-green-light",
    },
    {
      title: "Progress Pembelajaran",
      value: stats?.averageProgress ? `${stats.averageProgress.toFixed(0)}%` : "0%",
      icon: TrendingUp,
      color: "text-semantic-purple",
      bgColor: "bg-semantic-purple-light",
    },
    {
      title: "Notifikasi",
      value: stats?.unreadNotifications || 0,
      icon: Bell,
      color: "text-semantic-red",
      bgColor: "bg-semantic-red-light",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Mahasiswa</h2>
        <p className="text-muted-foreground">
          Ringkasan pembelajaran dan aktivitas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-xl ${card.bgColor}`}>
                  <Icon className={`icon-md ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="icon-lg" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.upcomingEvents && stats.upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.startDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tidak ada event mendatang
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="icon-lg" />
              Pengumuman Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentAnnouncements && stats.recentAnnouncements.length > 0 ? (
              <div className="space-y-3">
                {stats.recentAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{announcement.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {announcement.author?.name}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(announcement.publishedAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tidak ada pengumuman terbaru
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
