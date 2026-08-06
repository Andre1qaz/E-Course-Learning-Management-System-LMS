import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SettingsPage } from "@/components/settings/settings-page";

export default async function DosenSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[{ label: "Dashboard", href: "/dosen/dashboard" }, { label: "Pengaturan" }]}
      >
        <SettingsPage />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
