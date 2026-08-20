import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CourseDetailClient } from "@/components/course-detail/course-detail-client";

export default async function MahasiswaCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "MAHASISWA") redirect("/403");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/mahasiswa/dashboard" },
          { label: "Courses", href: "/mahasiswa/courses" },
          { label: "Course Detail" },
        ]}
      >
        <CourseDetailClient
          courseId={id}
          token={session.accessToken}
          userRole={session.user.role}
        />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
