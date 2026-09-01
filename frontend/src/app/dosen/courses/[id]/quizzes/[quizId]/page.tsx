import { QuizReviewClient } from "./quiz-review-client";

export default async function QuizReviewPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  return (
    <div className="container mx-auto py-8">
      <QuizReviewClient courseId={id} quizId={quizId} />
    </div>
  );
}