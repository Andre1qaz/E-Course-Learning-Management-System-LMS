import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DosenExamsClient } from "./dosen-exams-client";

export default async function DosenExamsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "DOSEN" && session.user.role !== "ADMIN") redirect("/403");

  return (
    <AuthSessionProvider>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/dosen/dashboard" },
          { label: "Ujian" },
        ]}
      >
        <DosenExamsClient token={session.accessToken} />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
