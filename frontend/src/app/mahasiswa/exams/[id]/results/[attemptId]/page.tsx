import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ExamResultsClient } from "./exam-results-client";

export default async function ExamResultsPage({ params }: { params: { id: string; attemptId: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "MAHASISWA") redirect("/403");

  return (
    <AuthSessionProvider>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/mahasiswa/dashboard" },
          { label: "Courses", href: "/mahasiswa/courses" },
          { label: "Hasil Ujian" },
        ]}
      >
        <ExamResultsClient examId={params.id} attemptId={params.attemptId} token={session.accessToken} />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
