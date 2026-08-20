import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FileManager } from "@/components/private-files/file-manager";

export default async function MahasiswaStoragePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/mahasiswa/dashboard" },
          { label: "File Pribadi" },
        ]}
      >
        <FileManager
          token={session.accessToken}
          userId={session.user.id}
        />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
