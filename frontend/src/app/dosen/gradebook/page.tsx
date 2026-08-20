import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { GradebookClient } from "./gradebook-client";

export default async function DosenGradebookPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/dosen/dashboard" },
          { label: "Gradebook" },
        ]}
      >
        <GradebookClient token={session.accessToken} />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
