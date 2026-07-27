import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ExamGradingClient } from "./exam-grading-client";

export default async function ExamGradingPage({ params }: { params: { id: string; attemptId: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "DOSEN") redirect("/403");

  return (
    <AuthSessionProvider>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Semua Ujian", href: "/admin/exams" },
          { label: "Penilaian" },
        ]}
      >
        <ExamGradingClient examId={params.id} attemptId={params.attemptId} token={session.accessToken} />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
