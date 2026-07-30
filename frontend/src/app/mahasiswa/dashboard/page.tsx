import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";

export default async function MahasiswaDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[{ label: "Dashboard" }]}
      >
        <StudentDashboard />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
