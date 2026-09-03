import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AnnouncementDetail } from "@/components/announcements/announcement-detail";

export default async function AdminAnnouncementDetailPage({
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
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Pengumuman Global", href: "/admin/announcements" },
          { label: "Detail Pengumuman" },
        ]}
      >
        <div className="container mx-auto py-8">
          <AnnouncementDetail
            announcementId={id}
            token={session.accessToken}
            basePath="/admin"
            canEdit={session.user.role === "ADMIN"}
            canDelete={session.user.role === "ADMIN"}
          />
        </div>
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
