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
  
  // Allow both DOSEN and ADMIN to access this page
  if (session.user.role !== "DOSEN" && session.user.role !== "ADMIN") redirect("/403");

  // Dynamic breadcrumbs based on role
  const isDashboard = session.user.role === "ADMIN";
  const dashboardPath = isDashboard ? "/admin/dashboard" : "/dosen/dashboard";
  const coursesPath = isDashboard ? "/admin/courses" : "/dosen/courses";
  const courseDetailPath = isDashboard ? `/admin/courses/${id}` : `/dosen/courses/${id}`;

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
    redirect(coursesPath);
  }

  const assignment = assignmentResult.data;

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: dashboardPath },
          { label: "Courses", href: coursesPath },
          { label: "Course Detail", href: courseDetailPath },
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
