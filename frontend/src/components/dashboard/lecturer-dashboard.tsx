"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { 
  BookOpen, 
  Users, 
  FileText, 
  ClipboardCheck, 
  Clock,
  Activity
} from "lucide-react";

interface LecturerStats {
  totalCourses: number;
  totalStudents: number;
  activeAssignments: number;
  ungradedAssignments: number;
  ongoingQuizzes: number;
  recentActivities: Array<{
    id: string;
    action: string;
    entity: string;
    entityId: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export function LecturerDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<LecturerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!session?.accessToken) return;

      try {
        const response = await apiFetch<LecturerStats>("/dashboard/lecturer", {}, session.accessToken);
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch lecturer stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [session?.accessToken]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
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
      title: "Course yang Diajar",
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Mahasiswa",
      value: stats?.totalStudents || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Assignment Aktif",
      value: stats?.activeAssignments || 0,
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Assignment Belum Dinilai",
      value: stats?.ungradedAssignments || 0,
      icon: ClipboardCheck,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Quiz Berlangsung",
      value: stats?.ongoingQuizzes || 0,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Dosen</h2>
        <p className="text-muted-foreground">
          Ringkasan statistik dan aktivitas mengajar
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
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Aktivitas Terbaru pada Course
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentActivities && stats.recentActivities.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.entity} - {activity.user.name}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada aktivitas terbaru
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
