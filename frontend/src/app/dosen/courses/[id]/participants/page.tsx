import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ParticipantsManagerClient } from "./participants-client";

export default async function DosenCourseParticipantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "DOSEN" && session.user.role !== "ADMIN") redirect("/403");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/dosen/dashboard" },
          { label: "Courses", href: "/dosen/courses" },
          { label: "Course Detail", href: `/dosen/courses/${id}` },
          { label: "Peserta" },
        ]}
      >
        <ParticipantsManagerClient
          courseId={id}
          token={session.accessToken}
        />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
