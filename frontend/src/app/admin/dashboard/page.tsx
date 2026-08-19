import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[{ label: "Dashboard" }]}
      >
        <AdminDashboard />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
