import Link from "next/link";
import { BookOpen, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  id: string;
  name: string;
  code: string;
  thumbnailColor: string;
  category?: { name: string } | null;
  instructor?: { name: string } | null;
  progress?: number;
  href: string;
  stats?: {
    modules?: number;
    assignments?: number;
    exams?: number;
    enrollments?: number;
  };
}

// Heuristic #21: Motivation to Learn — course card with progress bar
export function CourseCard({
  name,
  code,
  thumbnailColor,
  category,
  instructor,
  progress,
  href,
  stats,
}: CourseCardProps) {
  const progressValue = progress ?? 0;
  const isComplete = progressValue >= 100;

  return (
    <Link href={href} className="group block">
      <article
        className={cn(
          "relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300",
          "hover:shadow-lg hover:-translate-y-0.5",
        )}
      >
        <div
          className={`h-20 md:h-24 px-4 md:px-5 py-3 md:py-4 text-white ${thumbnailColor}`}
        >
          <p className="text-xs font-medium opacity-80">{code}</p>
          <h3 className="font-display mt-1 text-base md:text-lg font-bold leading-tight line-clamp-2">
            {name}
          </h3>
        </div>

        <div className="p-3 md:p-4 space-y-2 md:space-y-3">
          {category && (
            <span className="inline-block rounded-full bg-secondary px-2 md:px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {category.name}
            </span>
          )}

          {instructor && (
            <p className="text-xs text-muted-foreground">
              Dosen: {instructor.name}
            </p>
          )}

          {stats && (
            <div className="flex gap-3 md:gap-4 text-xs text-muted-foreground">
              {stats.modules !== undefined && (
                <span className="flex items-center gap-1">
                  <BookOpen className="size-3" />
                  {stats.modules} Modul
                </span>
              )}
              {stats.enrollments !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="size-3" />
                  {stats.enrollments} Mahasiswa
                </span>
              )}
            </div>
          )}

          {progress !== undefined && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span
                  className={cn(
                    "font-semibold",
                    isComplete ? "text-success" : "text-accent",
                  )}
                >
                  {progressValue}%
                  {isComplete && " ✓"}
                </span>
              </div>
              <Progress value={progressValue} className="h-1.5 md:h-2" />
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
