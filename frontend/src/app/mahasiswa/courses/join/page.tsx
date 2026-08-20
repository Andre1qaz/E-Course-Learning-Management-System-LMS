import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuthSessionProvider } from "@/components/session-provider";
import { JoinCourseClient } from "./join-client";

export default async function JoinCoursePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AuthSessionProvider session={session}>
      <JoinCourseClient token={session.accessToken} />
    </AuthSessionProvider>
  );
}
