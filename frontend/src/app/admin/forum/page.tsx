import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ForumClient } from "@/components/forum/forum-client";

export default async function AdminForumPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/403");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Forum" },
        ]}
      >
        <ForumClient
          role="ADMIN"
          token={session.accessToken}
          userId={session.user.id}
        />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
