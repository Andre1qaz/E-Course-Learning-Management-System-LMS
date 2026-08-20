import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FileManager } from "@/components/private-files/file-manager";

export default async function AdminStoragePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Storage" },
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
