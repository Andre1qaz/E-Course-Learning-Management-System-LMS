import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { QuestionBanksClient } from "./question-banks-client";

export default async function AdminQuestionBanksPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN" && session.user.role !== "DOSEN") redirect("/403");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Question Banks" },
        ]}
      >
        <QuestionBanksClient token={session.accessToken} userRole={session.user.role} />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
