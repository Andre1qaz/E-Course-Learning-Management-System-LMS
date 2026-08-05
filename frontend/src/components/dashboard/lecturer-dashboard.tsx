"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
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
        toast.error("Gagal memuat statistik dashboard");
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
      color: "text-semantic-blue",
      bgColor: "bg-semantic-blue-light",
    },
    {
      title: "Total Mahasiswa",
      value: stats?.totalStudents || 0,
      icon: Users,
      color: "text-semantic-green",
      bgColor: "bg-semantic-green-light",
    },
    {
      title: "Assignment Aktif",
      value: stats?.activeAssignments || 0,
      icon: FileText,
      color: "text-semantic-orange",
      bgColor: "bg-semantic-orange-light",
    },
    {
      title: "Assignment Belum Dinilai",
      value: stats?.ungradedAssignments || 0,
      icon: ClipboardCheck,
      color: "text-semantic-red",
      bgColor: "bg-semantic-red-light",
    },
    {
      title: "Quiz Berlangsung",
      value: stats?.ongoingQuizzes || 0,
      icon: Clock,
      color: "text-semantic-purple",
      bgColor: "bg-semantic-purple-light",
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="icon-lg" />
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
