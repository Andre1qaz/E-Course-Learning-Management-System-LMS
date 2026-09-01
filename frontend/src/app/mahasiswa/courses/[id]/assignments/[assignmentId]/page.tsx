import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StudentAssignmentDetail } from "@/components/assignments/student-assignment-detail";

export default async function StudentAssignmentPage({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const { id, assignmentId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "MAHASISWA") redirect("/403");

  // Fetch assignment details
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
    redirect("/mahasiswa/courses");
  }

  const assignment = assignmentResult.data;

  // Fetch student's submission
  const submissionResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/assignments/${assignmentId}/my-submission`,
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    }
  );

  const submissionResult = await submissionResponse.json();
  const submission = submissionResult.success ? submissionResult.data : null;

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/mahasiswa/dashboard" },
          { label: "Courses", href: "/mahasiswa/courses" },
          { label: "Course Detail", href: `/mahasiswa/courses/${id}` },
          { label: "Assignment" },
        ]}
      >
        <StudentAssignmentDetail
          assignment={assignment}
          submission={submission}
          courseId={id}
          token={session.accessToken}
        />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
