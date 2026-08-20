import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { LogsClient } from "./logs-client";

export default async function AdminLogsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Log Aktivitas" },
        ]}
      >
        <LogsClient token={session.accessToken} />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
