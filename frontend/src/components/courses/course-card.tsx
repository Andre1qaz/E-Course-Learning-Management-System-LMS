import Link from "next/link";
import { BookOpen, Users, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getBackgroundFillProps } from "@/lib/utils";

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
  onDelete?: (id: string) => void | Promise<void>;
  onEdit?: (id: string) => void | Promise<void>;
  canEdit?: boolean;
}

// Heuristic #21: Motivation to Learn — course card with progress bar
export function CourseCard({
  id,
  name,
  code,
  thumbnailColor,
  category,
  instructor,
  progress,
  href,
  stats,
  onDelete,
  onEdit,
  canEdit = false,
}: CourseCardProps) {
  const progressValue = progress ?? 0;
  const isComplete = progressValue >= 100;
  const thumbnailFill = getBackgroundFillProps(thumbnailColor, "bg-primary");

  return (
    <div className="group relative">
      <Link href={href} className="block">
        <article
          className={cn(
            "relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all duration-300",
            "hover:shadow-lg hover:-translate-y-0.5",
          )}
        >
          <div
            className={cn(
              "h-20 md:h-24 px-4 md:px-5 py-3 md:py-4 text-white relative",
              thumbnailFill.className,
            )}
            style={thumbnailFill.style}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10">
              <p className="text-xs font-medium opacity-90 drop-shadow-md">{code}</p>
              <h3 className="font-display mt-1 text-base md:text-lg font-bold leading-tight line-clamp-2 drop-shadow-md">
                {name}
              </h3>
            </div>
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

      {canEdit && (
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(id); }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={(e) => { e.preventDefault(); onDelete(id); }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
