import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DosenAnnouncementsClient } from "./dosen-announcements-client";

export default async function DosenAnnouncementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[{ label: "Dashboard", href: "/dosen/dashboard" }, { label: "Pengumuman" }]}
      >
        <DosenAnnouncementsClient token={session.accessToken} />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
