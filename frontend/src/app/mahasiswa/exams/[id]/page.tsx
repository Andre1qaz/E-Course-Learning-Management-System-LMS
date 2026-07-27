import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ExamTakingClient } from "./exam-taking-client";

export default async function ExamTakingPage({ params }: { params: { id: string } }) {
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
          { label: "Ujian" },
        ]}
      >
        <ExamTakingClient examId={params.id} token={session.accessToken} />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
