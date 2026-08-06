"use client";

import { CoursesClient as SharedCoursesClient } from "@/components/courses/courses-client";

interface MahasiswaCoursesClientProps {
  token: string;
}

export function MahasiswaCoursesClient({ token }: MahasiswaCoursesClientProps) {
  return (
    <SharedCoursesClient
      token={token}
      role="MAHASISWA"
      basePath="/mahasiswa"
      title="Course Saya"
      subtitle="Kelola course yang Anda ikuti"
      emptyStateMessage="Anda belum bergabung dengan course apapun"
    />
  );
}
