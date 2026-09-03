import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AnnouncementDetail } from "@/components/announcements/announcement-detail";

export default async function DosenAnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  
  const { id } = await params;

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/dosen/dashboard" },
          { label: "Pengumuman", href: "/dosen/announcements" },
          { label: "Detail Pengumuman" },
        ]}
      >
        <div className="container mx-auto py-8">
          <AnnouncementDetail
            announcementId={id}
            token={session.accessToken}
            basePath="/dosen"
            canEdit={session.user.role === "DOSEN"}
            canDelete={session.user.role === "DOSEN"}
          />
        </div>
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
