"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Calendar, Plus, MoreVertical, Edit, Trash2, Copy, Move, Clock, FileText, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActivityCard } from "./activity-card";
import { EditActivityDialog } from "./edit-activity-dialog";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

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
  onDeleteWeek: () => void;
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
  onDeleteWeek,
  token,
  userRole,
  courseId,
}: WeekAccordionProps) {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [activities, setActivities] = useState<Activity[]>(week.activities);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !canEdit) return;

    const { source, destination } = result;

    if (source.index === destination.index) return;

    // Reorder activities locally
    const newActivities = Array.from(activities);
    const [reorderedActivity] = newActivities.splice(source.index, 1);
    newActivities.splice(destination.index, 0, reorderedActivity);

    // Update order values
    const updatedActivities = newActivities.map((activity, index) => ({
      ...activity,
      order: index,
    }));

    setActivities(updatedActivities);

    // Persist order to backend
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/activities/reorder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            activities: updatedActivities.map((a) => ({
              id: a.id,
              order: a.order,
            })),
          }),
        }
      );

      const apiResult = await response.json();

      if (apiResult.success) {
        toast.success("Activity order updated successfully");
        onActivityChange(); // Refresh parent component
      } else {
        toast.error(apiResult.message || "Failed to update activity order");
        // Revert on error
        setActivities(activities);
      }
    } catch (error) {
      toast.error("Failed to update activity order");
      // Revert on error
      setActivities(activities);
    }
  };

  // Update local activities when week.activities changes
  useEffect(() => {
    setActivities(week.activities);
  }, [week.activities]);

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
              <ChevronDown className="icon-md text-muted-foreground" />
            ) : (
              <ChevronRight className="icon-md text-muted-foreground" />
            )}
            <div>
              <CardTitle className="text-lg">
                Week {week.weekNumber}: {week.title}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="icon-sm" />
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
                  <MoreVertical className="icon-sm" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Edit className="mr-2 icon-sm" />
                  Edit Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Copy className="mr-2 icon-sm" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }} className="text-destructive">
                  <Trash2 className="mr-2 icon-sm" />
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
                  <FileText className="icon-sm" />
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
                              <Clock className="icon-xs" />
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
                              Buka Ujian
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
              <DragDropContext onDragEnd={handleDragEnd}>
                <>
                  {canEdit ? (
                    <Droppable droppableId="activities">
                      {(provided: any) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                          {publishedActivities.map((activity, index) => (
                            <Draggable
                              key={activity.id}
                              draggableId={activity.id}
                              index={index}
                              isDragDisabled={!canEdit}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`${snapshot.isDragging ? "opacity-50" : ""}`}
                                >
                                  <div className="flex items-start gap-2">
                                    {canEdit && (
                                      <div
                                        {...provided.dragHandleProps}
                                        className="mt-4 cursor-grab active:cursor-grabbing"
                                      >
                                        <GripVertical className="icon-md text-muted-foreground" />
                                      </div>
                                    )}
                                    <div className="flex-1">
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
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
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
                    </>
                  )}
                  {canEdit && draftActivities.length > 0 && (
                    <>
                      <div className="text-sm text-muted-foreground font-medium mt-4 mb-2">
                        Draft ({draftActivities.length})
                      </div>
                      <Droppable droppableId="draft-activities">
                        {(provided: any) => (
                          <div {...provided.droppableProps} ref={provided.innerRef}>
                            {draftActivities.map((activity, index) => (
                              <Draggable
                                key={activity.id}
                                draggableId={`draft-${activity.id}`}
                                index={index}
                                isDragDisabled={!canEdit}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`${snapshot.isDragging ? "opacity-50" : ""}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="mt-4 cursor-grab active:cursor-grabbing"
                                      >
                                        <GripVertical className="icon-md text-muted-foreground" />
                                      </div>
                                      <div className="flex-1">
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
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </>
                  )}
                </>
              </DragDropContext>
            )}
            {canEdit && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={onAddActivity}
              >
                <Plus className="mr-2 icon-sm" />
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

      {/* Delete Week Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Week?</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus Week {week.weekNumber}: {week.title}? Tindakan ini tidak dapat dibatalkan dan semua aktivitas dalam week ini juga akan dihapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                setShowDeleteDialog(false);
                onDeleteWeek();
              }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
