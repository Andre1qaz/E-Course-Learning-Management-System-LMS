import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SettingsPage } from "@/components/settings/settings-page";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Pengaturan" }]}
      >
        <SettingsPage />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
