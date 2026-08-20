import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CalendarClient } from "./calendar-client";

export default async function DosenCalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/dosen/dashboard" },
          { label: "Kalender" },
        ]}
      >
        <CalendarClient
          role="DOSEN"
          token={session.accessToken}
          userId={session.user.id}
        />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
