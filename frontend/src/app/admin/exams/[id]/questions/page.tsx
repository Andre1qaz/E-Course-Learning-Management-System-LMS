import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ExamQuestionsClient } from "./exam-questions-client";

export default async function ExamQuestionsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Semua Ujian", href: "/admin/exams" },
          { label: "Kelola Soal" },
        ]}
      >
        <ExamQuestionsClient examId={params.id} token={session.accessToken} />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
