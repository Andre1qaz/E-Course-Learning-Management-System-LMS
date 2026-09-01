import { QuizTakingClient } from "./quiz-taking-client";

export default async function QuizTakingPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  return (
    <div className="container mx-auto py-8">
      <QuizTakingClient courseId={id} quizId={quizId} />
    </div>
  );
}