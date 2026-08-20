import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AdminAnnouncementsClient } from "./admin-announcements-client";

export default async function AdminAnnouncementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Pengumuman Global" }]}
      >
        <AdminAnnouncementsClient token={session.accessToken} />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
