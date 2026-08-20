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
  const [eventColor, setEventColor] = useState<string>("#3B82F6");

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
        courseId: eventCourseId && eventCourseId.trim() !== '' ? eventCourseId : undefined,
        color: eventColor,
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

  const getEventTypeColor = (type: string, color?: string) => {
    if (color) {
      return {
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}40`,
      };
    }
    switch (type) {
      case "DEADLINE":
        return "bg-semantic-red/10 text-semantic-red border-semantic-red/20";
      case "PERSONAL_NOTE":
        return "bg-semantic-blue/10 text-semantic-blue border-semantic-blue/20";
      case "ANNOUNCEMENT":
        return "bg-semantic-amber/10 text-semantic-amber border-semantic-amber/20";
      default:
        return "bg-muted/10 text-muted-foreground border-border/20";
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "DEADLINE":
        return <AlertCircle className="icon-sm" />;
      case "PERSONAL_NOTE":
        return <CalendarIcon className="icon-sm" />;
      case "ANNOUNCEMENT":
        return <Clock className="icon-sm" />;
      default:
        return <CalendarIcon className="icon-sm" />;
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Calendar Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <h2 className="text-lg md:text-xl lg:text-2xl font-display font-bold">
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
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
            <ChevronLeft className="icon-md" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
            <ChevronRight className="icon-md" />
          </Button>
          <div className="flex items-center gap-1 border rounded-xl p-1">
            <Button
              variant={viewMode === "monthly" ? "default" : "ghost"}
              size="sm"
              className="text-xs md:text-sm"
              onClick={() => setViewMode("monthly")}
            >
              <span className="hidden sm:inline">Bulanan</span>
              <span className="sm:hidden">Bulan</span>
            </Button>
            <Button
              variant={viewMode === "weekly" ? "default" : "ghost"}
              size="sm"
              className="text-xs md:text-sm"
              onClick={() => setViewMode("weekly")}
            >
              <span className="hidden sm:inline">Mingguan</span>
              <span className="sm:hidden">Minggu</span>
            </Button>
            <Button
              variant={viewMode === "daily" ? "default" : "ghost"}
              size="sm"
              className="text-xs md:text-sm"
              onClick={() => setViewMode("daily")}
            >
              <span className="hidden sm:inline">Harian</span>
              <span className="sm:hidden">Hari</span>
            </Button>
          </div>
          {canCreate && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="icon-md mr-2" />
                  <span className="hidden sm:inline">Buat Event</span>
                  <span className="sm:hidden">Buat</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md w-[95%]">
                <DialogHeader>
                  <DialogTitle className="text-base md:text-lg">Buat Event Baru</DialogTitle>
                  <p className="text-sm text-muted-foreground">Event ini akan otomatis ditampilkan di kalender dan pengumuman</p>
                </DialogHeader>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm">Judul *</Label>
                    <Input id="title" name="title" required placeholder="Masukkan judul event" className="text-sm" />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-sm">Deskripsi</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Deskripsi event (opsional)"
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="startDate" className="text-sm">Tanggal *</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      required
                      defaultValue={selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type" className="text-sm">Tipe Event</Label>
                    <Select value={eventType} onValueChange={(value) => setEventType(value as typeof eventType)}>
                      <SelectTrigger className="text-sm">
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
                      <Label htmlFor="courseId" className="text-sm">Course (Opsional)</Label>
                      <Select value={eventCourseId} onValueChange={setEventCourseId}>
                        <SelectTrigger className="text-sm">
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
                  <div>
                    <Label htmlFor="color" className="text-sm">Warna Event</Label>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {[
                        { value: "#3B82F6", label: "Blue" },
                        { value: "#22C55E", label: "Green" },
                        { value: "#F97316", label: "Orange" },
                        { value: "#6366F1", label: "Indigo" },
                        { value: "#EF4444", label: "Red" },
                        { value: "#14B8A6", label: "Teal" },
                      ].map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setEventColor(color.value)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            eventColor === color.value
                              ? "border-ring scale-110"
                              : "border-border hover:border-ring"
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="text-sm">
                      Batal
                    </Button>
                    <Button type="submit" className="text-sm">Simpan</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="p-4 md:p-6">
        {viewMode === "monthly" ? (
          <>
            <div className="hidden sm:grid grid-cols-7 gap-2 mb-4">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={index} className="hidden sm:block h-32 rounded-xl bg-muted/20" />;
                }

                const dayEvents = getEventsForDate(date);
                const isToday = date.toDateString() === today.toDateString();
                const isSelected = selectedDate?.toDateString() === date.toDateString();

                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      "min-h-20 sm:h-32 rounded-xl border p-2 cursor-pointer transition-all hover:border-accent/50",
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
                        <Badge variant="secondary" className="text-xs hidden sm:inline">
                          Hari Ini
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 overflow-y-auto max-h-16 sm:max-h-24">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          className={cn(
                            "text-xs p-1.5 rounded border truncate cursor-pointer hover:opacity-80",
                            typeof getEventTypeColor(event.type, event.color) === 'object' 
                              ? '' 
                              : getEventTypeColor(event.type, event.color)
                          )}
                          style={typeof getEventTypeColor(event.type, event.color) === 'object' ? getEventTypeColor(event.type, event.color) : undefined}
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
          </>
        ) : viewMode === "weekly" ? (
          <div className="space-y-4">
            <div className="hidden sm:grid grid-cols-7 gap-2 mb-4">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
              {days.map((date, index) => {
                if (!date) return null;
                const dayEvents = getEventsForDate(date);
                const isToday = date.toDateString() === today.toDateString();
                const isSelected = selectedDate?.toDateString() === date.toDateString();

                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={cn(
                      "min-h-40 sm:min-h-64 rounded-xl border p-3 cursor-pointer transition-all hover:border-accent/50",
                      isToday && "bg-accent/5 border-accent/30",
                      isSelected && "ring-2 ring-accent",
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        "text-sm font-medium",
                        isToday && "text-accent font-bold"
                      )}>
                        {date.getDate()}
                      </span>
                      {isToday && (
                        <Badge variant="secondary" className="text-xs hidden sm:inline">
                          Hari Ini
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 overflow-y-auto max-h-32 sm:max-h-48">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          className={cn(
                            "text-xs p-2 rounded border cursor-pointer hover:opacity-80",
                            typeof getEventTypeColor(event.type, event.color) === 'object' 
                              ? '' 
                              : getEventTypeColor(event.type, event.color)
                          )}
                          style={typeof getEventTypeColor(event.type, event.color) === 'object' ? getEventTypeColor(event.type, event.color) : undefined}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {getEventTypeIcon(event.type)}
                            <span className="font-medium truncate">{event.title}</span>
                          </div>
                          {event.startTime && (
                            <div className="text-xs text-muted-foreground">
                              {event.startTime}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-semibold">
                {currentDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              {currentDate.toDateString() === today.toDateString() && (
                <Badge variant="secondary">Hari Ini</Badge>
              )}
            </div>
            <div className="space-y-3">
              {days.map((date, index) => {
                if (!date) return null;
                const dayEvents = getEventsForDate(date);

                return (
                  <div key={index}>
                    {dayEvents.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        Tidak ada event pada hari ini
                      </div>
                    ) : (
                      dayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={cn(
                            "p-3 md:p-4 rounded-xl border cursor-pointer transition-all hover:border-accent/50 mb-3",
                            typeof getEventTypeColor(event.type, event.color) === 'object' 
                              ? '' 
                              : getEventTypeColor(event.type, event.color)
                          )}
                          style={typeof getEventTypeColor(event.type, event.color) === 'object' ? getEventTypeColor(event.type, event.color) : undefined}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              {getEventTypeIcon(event.type)}
                              <span className="font-medium text-sm md:text-base">{event.title}</span>
                            </div>
                            {event.startTime && (
                              <Badge variant="outline" className="text-xs">
                                {event.startTime} {event.endTime ? `- ${event.endTime}` : ''}
                              </Badge>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-xs md:text-sm text-muted-foreground mb-2">{event.description}</p>
                          )}
                          {event.location && (
                            <div className="text-xs text-muted-foreground mb-1">
                              📍 {event.location}
                            </div>
                          )}
                          {event.isOnline && event.meetingLink && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                              🔗 {event.meetingLink}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Event View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md w-[95%] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Detail Event</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Judul</Label>
                <p className="font-medium text-sm md:text-base">{selectedEvent.title}</p>
              </div>
              <div>
                <Label className="text-sm">Tanggal</Label>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {new Date(selectedEvent.startDate).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div>
                <Label className="text-sm">Tipe</Label>
                <Badge 
                  className={cn(
                    "text-xs",
                    typeof getEventTypeColor(selectedEvent.type, selectedEvent.color) === 'object' 
                      ? '' 
                      : getEventTypeColor(selectedEvent.type, selectedEvent.color)
                  )}
                  style={typeof getEventTypeColor(selectedEvent.type, selectedEvent.color) === 'object' ? getEventTypeColor(selectedEvent.type, selectedEvent.color) : undefined}
                >
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
                  <Label className="text-sm">Deskripsi</Label>
                  <p className="text-xs md:text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.location && (
                <div>
                  <Label className="text-sm">Lokasi</Label>
                  <p className="text-xs md:text-sm text-muted-foreground">{selectedEvent.location}</p>
                </div>
              )}
              {selectedEvent.isOnline && selectedEvent.meetingLink && (
                <div>
                  <Label className="text-sm">Tautan Meeting</Label>
                  <a
                    href={selectedEvent.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                  >
                    {selectedEvent.meetingLink}
                  </a>
                </div>
              )}
              {selectedEvent.startTime && (
                <div>
                  <Label className="text-sm">Waktu</Label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {selectedEvent.startTime} {selectedEvent.endTime ? `- ${selectedEvent.endTime}` : ''}
                  </p>
                </div>
              )}
              {selectedEvent.attachments && Array.isArray(selectedEvent.attachments) && selectedEvent.attachments.length > 0 && (
                <div>
                  <Label className="text-sm">Lampiran</Label>
                  <div className="space-y-2">
                    {selectedEvent.attachments.map((attachment: any, index: number) => (
                      <a
                        key={index}
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        📎 {attachment.fileName}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {selectedEvent.course && (
                <div>
                  <Label className="text-sm">Course</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${selectedEvent.course.thumbnailColor || 'bg-muted'}`}
                    />
                    <p className="text-xs md:text-sm font-medium">
                      {selectedEvent.course.code} - {selectedEvent.course.name}
                    </p>
                  </div>
                </div>
              )}
              {selectedEvent.relatedActivityId && selectedEvent.relatedActivityType && (
                <div>
                  <Label className="text-sm">Link ke Aktivitas</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs md:text-sm w-full sm:w-auto"
                    onClick={() => {
                      const basePath = userRole === 'ADMIN' ? '/admin' : userRole === 'DOSEN' ? '/dosen' : '/mahasiswa';
                      let link = '';
                      if (selectedEvent.relatedActivityType === 'ASSIGNMENT') {
                        link = `${basePath}/courses/${selectedEvent.courseId}/assignments/${selectedEvent.relatedActivityId}`;
                      } else if (selectedEvent.relatedActivityType === 'EXAM') {
                        link = `${basePath}/courses/${selectedEvent.courseId}/exams/${selectedEvent.relatedActivityId}`;
                      } else if (selectedEvent.relatedActivityType === 'MODULE') {
                        link = `${basePath}/courses/${selectedEvent.courseId}/modules/${selectedEvent.relatedActivityId}`;
                      }
                      if (link) window.location.href = link;
                    }}
                  >
                    Buka {selectedEvent.relatedActivityType === 'ASSIGNMENT' ? 'Tugas' : selectedEvent.relatedActivityType === 'EXAM' ? 'Ujian' : 'Materi'}
                  </Button>
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="text-xs md:text-sm w-full sm:w-auto">
                  Tutup
                </Button>
                {onEventTogglePublish && (userRole === "ADMIN" || (userRole === "DOSEN" && selectedEvent.courseId)) && (
                  <Button variant={selectedEvent.isPublished ? "outline" : "default"} onClick={async () => {
                    await onEventTogglePublish(selectedEvent.id);
                    setIsViewDialogOpen(false);
                  }} className="text-xs md:text-sm w-full sm:w-auto">
                    {selectedEvent.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                )}
                {onEventEdit && (selectedEvent.userId || (userRole === "DOSEN" && selectedEvent.courseId) || userRole === "ADMIN") && (
                  <Button variant="default" onClick={() => {
                    setIsViewDialogOpen(false);
                    onEventEdit(selectedEvent);
                  }} className="text-xs md:text-sm w-full sm:w-auto">
                    Edit
                  </Button>
                )}
                {(selectedEvent.userId || (userRole === "DOSEN" && selectedEvent.courseId) || userRole === "ADMIN") && (
                  <Button variant="destructive" onClick={handleDeleteEvent} className="text-xs md:text-sm w-full sm:w-auto">
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
