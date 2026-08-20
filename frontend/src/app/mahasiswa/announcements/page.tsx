import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AnnouncementsList } from "@/components/announcements/announcements-list";

export default async function MahasiswaAnnouncementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[{ label: "Dashboard", href: "/mahasiswa/dashboard" }, { label: "Pengumuman" }]}
      >
        <div className="container mx-auto py-8">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Pengumuman</h1>
            <p className="text-muted-foreground">
              Lihat semua pengumuman terbaru dari sistem dan course Anda
            </p>
          </div>

          <AnnouncementsList basePath="/mahasiswa" />
        </div>
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
