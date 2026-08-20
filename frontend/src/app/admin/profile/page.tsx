import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProfilePage } from "@/components/profile/profile-page";

export default async function AdminProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Profil" }]}
      >
        <ProfilePage />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
