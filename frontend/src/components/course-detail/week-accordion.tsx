"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Calendar, Plus, MoreVertical, Edit, Trash2, Copy, Move, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ActivityCard } from "./activity-card";
import { EditActivityDialog } from "./edit-activity-dialog";
import { toast } from "sonner";

interface Week {
  id: string;
  weekNumber: number;
  title: string;
  startDate: string;
  endDate: string;
  order: number;
  activities: Activity[];
  exams?: Exam[];
}

interface Exam {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  deadline: string;
  duration: number;
  isPublished: boolean;
  _count: {
    questions: number;
    attempts: number;
  };
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  metadata: any;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WeekAccordionProps {
  week: Week;
  isExpanded: boolean;
  onToggle: () => void;
  canEdit: boolean;
  onAddActivity: () => void;
  onActivityChange: () => void;
  token: string;
  userRole: string;
  courseId: string;
}

export function WeekAccordion({
  week,
  isExpanded,
  onToggle,
  canEdit,
  onAddActivity,
  onActivityChange,
  token,
  userRole,
  courseId,
}: WeekAccordionProps) {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
  };



  const publishedActivities = week.activities.filter((a) => a.status === "PUBLISHED");
  const draftActivities = week.activities.filter((a) => a.status === "DRAFT");
  const publishedExams = week.exams?.filter((e) => e.isPublished) || [];
  const draftExams = week.exams?.filter((e) => !e.isPublished) || [];

  const getExamStatusBadge = (exam: Exam) => {
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.deadline);

    if (!exam.isPublished) {
      return <Badge variant="secondary">Draft</Badge>;
    } else if (now < start) {
      return <Badge variant="outline">Akan Datang</Badge>;
    } else if (now >= start && now <= end) {
      return <Badge className="bg-success/10 text-success">Sedang Berlangsung</Badge>;
    } else {
      return <Badge variant="secondary">Selesai</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-lg">
                Week {week.weekNumber}: {week.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(week.startDate)} - {formatDate(week.endDate)}
                </span>
                {week.activities.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {week.activities.length} aktivitas
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3 mt-4">
            {/* Exams Section */}
            {publishedExams.length > 0 && (
              <>
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <FileText className="h-4 w-4" />
                  <span>Ujian ({publishedExams.length})</span>
                </div>
                {publishedExams.map((exam) => (
                  <Card key={exam.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{exam.title}</h4>
                            {getExamStatusBadge(exam)}
                          </div>
                          {exam.description && (
                            <p className="text-sm text-muted-foreground mb-2">{exam.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{exam.duration} menit</span>
                            </div>
                            <span>{exam._count.questions} soal</span>
                            <span>{formatDate(exam.startTime)}</span>
                          </div>
                        </div>
                        {userRole === "MAHASISWA" && (
                          <Button
                            size="sm"
                            asChild
                          >
                            <a href={`/mahasiswa/exams/${exam.id}`}>
                              Mulai Ujian
                            </a>
                          </Button>
                        )}
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a href={`/admin/exams/${exam.id}/questions`}>
                              Kelola Soal
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {/* Activities Section */}
            {publishedActivities.length === 0 && draftActivities.length === 0 && publishedExams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada aktivitas atau ujian di week ini
              </div>
            ) : (
              <>
                {publishedActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    weekId={week.id}
                    canEdit={canEdit}
                    onEdit={() => handleEditActivity(activity)}
                    token={token}
                    userRole={userRole}
                    onChange={onActivityChange}
                    courseId={courseId}
                  />
                ))}
                {canEdit && draftActivities.length > 0 && (
                  <>
                    <div className="text-sm text-muted-foreground font-medium mt-4 mb-2">
                      Draft ({draftActivities.length})
                    </div>
                    {draftActivities.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        weekId={week.id}
                        canEdit={canEdit}
                        onEdit={() => handleEditActivity(activity)}
                        token={token}
                        userRole={userRole}
                        onChange={onActivityChange}
                        courseId={courseId}
                      />
                    ))}
                  </>
                )}
              </>
            )}
            {canEdit && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={onAddActivity}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Activity
              </Button>
            )}
          </div>
        </CardContent>
      )}
      
      {/* Edit Activity Dialog */}
      <EditActivityDialog
        open={!!editingActivity}
        onOpenChange={(open) => !open && setEditingActivity(null)}
        weekId={week.id}
        activity={editingActivity}
        token={token}
        courseId={courseId}
        onSuccess={onActivityChange}
      />
    </Card>
  );
}
