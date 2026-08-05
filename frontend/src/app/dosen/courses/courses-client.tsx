"use client";

import { CoursesClient as SharedCoursesClient } from "@/components/courses/courses-client";

interface CoursesClientProps {
  token: string;
}

export function CoursesClient({ token }: CoursesClientProps) {
  return (
    <SharedCoursesClient
      token={token}
      role="DOSEN"
      basePath="/dosen"
      title="Course Saya"
      subtitle="Kelola course yang Anda ampu"
      emptyStateMessage="Mulai dengan membuat course pertama Anda"
    />
  );
}
