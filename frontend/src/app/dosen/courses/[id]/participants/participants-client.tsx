"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ParticipantsManager } from "@/components/courses/participants-manager";
import { EnrollmentKeyManager } from "@/components/courses/enrollment-key-manager";
import { getCourse } from "@/lib/api";

interface ParticipantsManagerClientProps {
  courseId: string;
  token: string;
}

// Heuristic #6: Recognition Rather Than Recall — clear navigation and context
export function ParticipantsManagerClient({ courseId, token }: ParticipantsManagerClientProps) {
  const router = useRouter();
  const [courseName, setCourseName] = useState("");
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [enrollmentEnabled, setEnrollmentEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseInfo();
  }, [courseId, token]);

  const loadCourseInfo = async () => {
    try {
      setLoading(true);
      const response = await getCourse(token, courseId);
      setCourseName(response.data.name);
      setEnrollmentCode(response.data.enrollmentCode);
      setEnrollmentEnabled(response.data.enrollmentEnabled);
    } catch (error) {
      toast.error("Gagal memuat informasi course");
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollmentKeyUpdate = (newCode: string, newEnabled: boolean) => {
    setEnrollmentCode(newCode);
    setEnrollmentEnabled(newEnabled);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">Kelola Peserta</h1>
          <p className="text-muted-foreground">{courseName}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <EnrollmentKeyManager
          token={token}
          courseId={courseId}
          currentCode={enrollmentCode}
          currentEnabled={enrollmentEnabled}
          onUpdate={handleEnrollmentKeyUpdate}
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Statistik Peserta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Total Peserta</p>
                <p className="text-2xl font-bold">-</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Status Enrollment</p>
                <p className="text-lg font-semibold">
                  {enrollmentEnabled ? "Aktif" : "Nonaktif"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ParticipantsManager
        token={token}
        courseId={courseId}
        courseName={courseName}
      />
    </div>
  );
}
