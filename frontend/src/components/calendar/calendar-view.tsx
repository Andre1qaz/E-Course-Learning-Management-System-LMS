"use client";

import { useState, useEffect } from "react";
import { CalendarEvent } from "@/lib/api";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Heuristic #1: Visibility of System Status — clear calendar view with event indicators
// Heuristic #6: Recognition Rather Than Recall — intuitive month navigation
// Heuristic #8: Aesthetic and Minimalist Design — clean calendar grid

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventCreate?: (data: {
    title: string;
    description?: string;
    startDate: string;
    type: "DEADLINE" | "PERSONAL_NOTE" | "ANNOUNCEMENT";
    courseId?: string;
  }) => Promise<void>;
  onEventUpdate?: (eventId: string, data: any) => Promise<void>;
  onEventDelete?: (eventId: string) => Promise<void>;
  onEventEdit?: (event: CalendarEvent) => void;
  onEventTogglePublish?: (eventId: string) => Promise<void>;
  canCreate?: boolean;
  userRole?: string;
  courses?: { id: string; name: string; code: string }[];
}

export function CalendarView({
  events,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onEventEdit,
  onEventTogglePublish,
  canCreate = true,
  userRole,
  courses = [],
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [eventType, setEventType] = useState<"DEADLINE" | "PERSONAL_NOTE" | "ANNOUNCEMENT">("PERSONAL_NOTE");
  const [viewMode, setViewMode] = useState<"monthly" | "weekly" | "daily">("monthly");
  const [eventCourseId, setEventCourseId] = useState<string>("");

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getDaysInWeek = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(current.setDate(diff));
    const days: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const getDaysInDay = (date: Date) => {
    return [new Date(date)];
  };

  const getEventsForDate = (date: Date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => {
      const eventDate = new Date(event.startDate).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (viewMode === "monthly") {
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
      } else if (viewMode === "weekly") {
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
      } else {
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsCreateDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsViewDialogOpen(true);
  };

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const startDate = formData.get("startDate") as string;

    if (!title || !startDate) {
      toast.error("Judul dan tanggal wajib diisi");
      return;
    }

    try {
      await onEventCreate?.({
        title,
        description,
        startDate,
        type: eventType,
        courseId: eventCourseId || undefined,
      });
      setIsCreateDialogOpen(false);
      toast.success("Event berhasil dibuat");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal membuat event");
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      await onEventDelete?.(selectedEvent.id);
      setIsViewDialogOpen(false);
      toast.success("Event berhasil dihapus");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus event");
    }
  };

  const days = viewMode === "monthly" ? getDaysInMonth(currentDate) : viewMode === "weekly" ? getDaysInWeek(currentDate) : getDaysInDay(currentDate);
  const today = new Date();
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "DEADLINE":
        return "bg-red-500/10 text-red-700 border-red-500/20";
      case "PERSONAL_NOTE":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "ANNOUNCEMENT":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "DEADLINE":
        return <AlertCircle className="h-3 w-3" />;
      case "PERSONAL_NOTE":
        return <CalendarIcon className="h-3 w-3" />;
      case "ANNOUNCEMENT":
        return <Clock className="h-3 w-3" />;
      default:
        return <CalendarIcon className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-display font-bold">
            {viewMode === "monthly"
              ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : viewMode === "weekly"
              ? `Minggu ke-${Math.ceil(currentDate.getDate() / 7)} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `${currentDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`
            }
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hari Ini
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("monthly")}
            >
              Bulanan
            </Button>
            <Button
              variant={viewMode === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("weekly")}
            >
              Mingguan
            </Button>
            <Button
              variant={viewMode === "daily" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("daily")}
            >
              Harian
            </Button>
          </div>
          {canCreate && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Event Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Judul *</Label>
                    <Input id="title" name="title" required placeholder="Masukkan judul event" />
                  </div>
                  <div>
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Deskripsi event (opsional)"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate">Tanggal *</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      required
                      defaultValue={selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Tipe Event</Label>
                    <Select value={eventType} onValueChange={(value) => setEventType(value as typeof eventType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERSONAL_NOTE">Catatan Pribadi</SelectItem>
                        <SelectItem value="DEADLINE">Deadline</SelectItem>
                        <SelectItem value="ANNOUNCEMENT">Pengumuman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(userRole === "DOSEN" || userRole === "ADMIN") && courses.length > 0 && (
                    <div>
                      <Label htmlFor="courseId">Course (Opsional)</Label>
                      <Select value={eventCourseId} onValueChange={setEventCourseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih course" />
                        </SelectTrigger>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.code} - {course.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit">Simpan</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="h-32 rounded-lg bg-muted/20" />;
            }

            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();

            return (
              <div
                key={index}
                onClick={() => handleDateClick(date)}
                className={cn(
                  "h-32 rounded-lg border p-2 cursor-pointer transition-all hover:border-accent/50",
                  isToday && "bg-accent/5 border-accent/30",
                  isSelected && "ring-2 ring-accent",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-medium",
                    isToday && "text-accent font-bold"
                  )}>
                    {date.getDate()}
                  </span>
                  {isToday && (
                    <Badge variant="secondary" className="text-xs">
                      Hari Ini
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 overflow-y-auto max-h-24">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                      className={cn(
                        "text-xs p-1.5 rounded border truncate cursor-pointer hover:opacity-80",
                        getEventTypeColor(event.type)
                      )}
                    >
                      <div className="flex items-center gap-1">
                        {getEventTypeIcon(event.type)}
                        <span className="truncate">{event.title}</span>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayEvents.length - 3} lagi
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Event View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Event</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <Label>Judul</Label>
                <p className="font-medium">{selectedEvent.title}</p>
              </div>
              <div>
                <Label>Tanggal</Label>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedEvent.startDate).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <Label>Tipe</Label>
                <Badge className={getEventTypeColor(selectedEvent.type)}>
                  {getEventTypeIcon(selectedEvent.type)}
                  <span className="ml-1">
                    {selectedEvent.type === "DEADLINE" && "Deadline"}
                    {selectedEvent.type === "PERSONAL_NOTE" && "Catatan Pribadi"}
                    {selectedEvent.type === "ANNOUNCEMENT" && "Pengumuman"}
                  </span>
                </Badge>
              </div>
              {selectedEvent.description && (
                <div>
                  <Label>Deskripsi</Label>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.location && (
                <div>
                  <Label>Lokasi</Label>
                  <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
                </div>
              )}
              {selectedEvent.isOnline && selectedEvent.meetingLink && (
                <div>
                  <Label>Tautan Meeting</Label>
                  <a
                    href={selectedEvent.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {selectedEvent.meetingLink}
                  </a>
                </div>
              )}
              {selectedEvent.startTime && (
                <div>
                  <Label>Waktu</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.startTime} {selectedEvent.endTime ? `- ${selectedEvent.endTime}` : ''}
                  </p>
                </div>
              )}
              {selectedEvent.attachments && Array.isArray(selectedEvent.attachments) && selectedEvent.attachments.length > 0 && (
                <div>
                  <Label>Lampiran</Label>
                  <div className="space-y-2">
                    {selectedEvent.attachments.map((attachment: any, index: number) => (
                      <a
                        key={index}
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        📎 {attachment.fileName}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {selectedEvent.course && (
                <div>
                  <Label>Course</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedEvent.course.thumbnailColor }}
                    />
                    <p className="text-sm font-medium">
                      {selectedEvent.course.code} - {selectedEvent.course.name}
                    </p>
                  </div>
                </div>
              )}
              {selectedEvent.relatedActivityId && selectedEvent.relatedActivityType && (
                <div>
                  <Label>Link ke Aktivitas</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      let link = '';
                      if (selectedEvent.relatedActivityType === 'ASSIGNMENT') {
                        link = `/mahasiswa/courses/${selectedEvent.courseId}/assignments/${selectedEvent.relatedActivityId}`;
                      } else if (selectedEvent.relatedActivityType === 'EXAM') {
                        link = `/mahasiswa/courses/${selectedEvent.courseId}/exams/${selectedEvent.relatedActivityId}`;
                      } else if (selectedEvent.relatedActivityType === 'MODULE') {
                        link = `/mahasiswa/courses/${selectedEvent.courseId}/modules/${selectedEvent.relatedActivityId}`;
                      }
                      if (link) window.location.href = link;
                    }}
                  >
                    Buka {selectedEvent.relatedActivityType === 'ASSIGNMENT' ? 'Tugas' : selectedEvent.relatedActivityType === 'EXAM' ? 'Ujian' : 'Materi'}
                  </Button>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Tutup
                </Button>
                {onEventTogglePublish && (userRole === "ADMIN" || (userRole === "DOSEN" && selectedEvent.courseId)) && (
                  <Button variant={selectedEvent.isPublished ? "outline" : "default"} onClick={async () => {
                    await onEventTogglePublish(selectedEvent.id);
                    setIsViewDialogOpen(false);
                  }}>
                    {selectedEvent.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                )}
                {onEventEdit && (selectedEvent.userId || (userRole === "DOSEN" && selectedEvent.courseId) || userRole === "ADMIN") && (
                  <Button variant="default" onClick={() => {
                    setIsViewDialogOpen(false);
                    onEventEdit(selectedEvent);
                  }}>
                    Edit
                  </Button>
                )}
                {(selectedEvent.userId || (userRole === "DOSEN" && selectedEvent.courseId) || userRole === "ADMIN") && (
                  <Button variant="destructive" onClick={handleDeleteEvent}>
                    Hapus
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
