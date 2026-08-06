import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MahasiswaExamsClient } from "./mahasiswa-exams-client";

export default async function MahasiswaExamsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "MAHASISWA") redirect("/403");

  return (
    <AuthSessionProvider>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/mahasiswa/dashboard" },
          { label: "Ujian" },
        ]}
      >
        <MahasiswaExamsClient token={session.accessToken} />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
