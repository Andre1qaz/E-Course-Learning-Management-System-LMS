"use client";

import { CoursesClient as SharedCoursesClient } from "@/components/courses/courses-client";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface MahasiswaCoursesClientProps {
  token: string;
}

export function MahasiswaCoursesClient({ token }: MahasiswaCoursesClientProps) {
  const router = useRouter();

  return (
    <div>
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Course Saya</h1>
          <p className="text-muted-foreground">Kelola course yang Anda ikuti</p>
        </div>
        <Button
          onClick={() => router.push("/mahasiswa/courses/available")}
          variant="outline"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Browse Available Courses
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Courses List */}
      <SharedCoursesClient
        token={token}
        role="MAHASISWA"
        basePath="/mahasiswa"
        title=""
        subtitle=""
        emptyStateMessage="Anda belum bergabung dengan course apapun"
        hideHeader={true}
      />
    </div>
  );
}
