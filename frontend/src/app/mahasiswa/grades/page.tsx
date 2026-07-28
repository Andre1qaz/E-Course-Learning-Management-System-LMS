import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MyGradesClient } from "./my-grades-client";

export default async function MahasiswaGradesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/mahasiswa/dashboard" },
          { label: "Nilai Saya" },
        ]}
      >
        <MyGradesClient token={session.accessToken} />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
