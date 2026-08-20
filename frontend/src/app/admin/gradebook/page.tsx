import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { GradebookClient } from "@/app/dosen/gradebook/gradebook-client";

export default async function AdminGradebookPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Gradebook" },
        ]}
      >
        <GradebookClient token={session.accessToken} isAdmin={true} />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
