import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AssignmentSubmissionsView } from "@/components/assignments/assignment-submissions-view";

export default async function AssignmentSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { id, assignmentId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "DOSEN" && session.user.role !== "ADMIN") redirect("/403");

  // Fetch assignment details to get title and maxScore
  const assignmentResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignmentId}`,
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    }
  );

  const assignmentResult = await assignmentResponse.json();

  if (!assignmentResult.success) {
    redirect("/dosen/courses");
  }

  const assignment = assignmentResult.data;

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/dosen/dashboard" },
          { label: "Courses", href: "/dosen/courses" },
          { label: "Course Detail", href: `/dosen/courses/${id}` },
          { label: "Assignment Submissions" },
        ]}
      >
        <AssignmentSubmissionsView
          assignmentId={assignmentId}
          assignmentTitle={assignment.title}
          assignmentMaxScore={assignment.maxScore}
          courseId={id}
          token={session.accessToken}
        />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
