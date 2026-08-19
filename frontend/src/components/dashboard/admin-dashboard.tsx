"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { 
  BookOpen, 
  Users, 
  UserCheck, 
  FileText, 
  ClipboardList, 
  Activity,
  TrendingUp,
  Clock
} from "lucide-react";

interface AdminStats {
  totalCourses: number;
  totalStudents: number;
  totalLecturers: number;
  totalAssignments: number;
  totalQuizzes: number;
  activeCourses: number;
  activeUsers: number;
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

export function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!session?.accessToken) {
        console.log("No access token available");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching admin stats with token:", session.accessToken.substring(0, 20) + "...");
        const response = await apiFetch<AdminStats>("/dashboard/admin", {}, session.accessToken);
        console.log("Admin stats response:", response);
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        // Don't show toast error for now - dashboard stats are loading successfully
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [session?.accessToken]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
      title: "Total Course",
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
      title: "Total Dosen",
      value: stats?.totalLecturers || 0,
      icon: UserCheck,
      color: "text-semantic-purple",
      bgColor: "bg-semantic-purple-light",
    },
    {
      title: "Total Assignment",
      value: stats?.totalAssignments || 0,
      icon: FileText,
      color: "text-semantic-orange",
      bgColor: "bg-semantic-orange-light",
    },
    {
      title: "Total Quiz",
      value: stats?.totalQuizzes || 0,
      icon: ClipboardList,
      color: "text-semantic-red",
      bgColor: "bg-semantic-red-light",
    },
    {
      title: "Course Aktif",
      value: stats?.activeCourses || 0,
      icon: TrendingUp,
      color: "text-semantic-teal",
      bgColor: "bg-semantic-teal-light",
    },
    {
      title: "Pengguna Aktif",
      value: stats?.activeUsers || 0,
      icon: Activity,
      color: "text-semantic-indigo",
      bgColor: "bg-semantic-indigo-light",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard Administrator</h2>
        <p className="text-muted-foreground">
          Ringkasan statistik dan aktivitas sistem
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <Clock className="icon-lg" />
            Aktivitas Terbaru
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
