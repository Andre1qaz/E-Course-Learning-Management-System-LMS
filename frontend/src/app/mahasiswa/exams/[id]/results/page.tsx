import { auth } from "@/auth";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export default async function ExamResultsRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "MAHASISWA") redirect("/403");

  let attemptId: string | null = null;

  try {
    const response = await fetch(`${API_URL}/exams/${id}`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });
    const result = await response.json();
    attemptId = result?.data?.myAttempt?.id ?? null;
  } catch {
    attemptId = null;
  }

  if (attemptId) {
    redirect(`/mahasiswa/exams/${id}/results/${attemptId}`);
  }

  redirect(`/mahasiswa/exams/${id}`);
}
