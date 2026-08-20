import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MahasiswaCoursesClient } from "./mahasiswa-courses-client";

export default async function MahasiswaCoursesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "MAHASISWA") redirect("/403");

  return (
    <AuthSessionProvider session={session}>
      <DashboardLayout
        user={session.user}
        breadcrumbs={[
          { label: "Dashboard", href: "/mahasiswa/dashboard" },
          { label: "Courses" },
        ]}
      >
        <MahasiswaCoursesClient token={session.accessToken} />
      </DashboardLayout>
    </AuthSessionProvider>
  );
}
