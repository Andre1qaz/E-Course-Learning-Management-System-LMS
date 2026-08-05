"use client";

import { CoursesClient as SharedCoursesClient } from "@/components/courses/courses-client";

interface CoursesClientProps {
  token: string;
}

export function CoursesClient({ token }: CoursesClientProps) {
  return (
    <SharedCoursesClient
      token={token}
      role="ADMIN"
      basePath="/admin"
      title="Semua Course"
      subtitle="Kelola semua course di platform"
      emptyStateMessage="Mulai dengan membuat course pertama"
    />
  );
}
