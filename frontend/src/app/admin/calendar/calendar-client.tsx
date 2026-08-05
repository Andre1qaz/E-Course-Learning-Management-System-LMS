"use client";

import { useState, useEffect } from "react";
import { CalendarView } from "@/components/calendar/calendar-view";
import { CalendarEvent, getCalendarEvents, createCalendarEvent, deleteCalendarEvent, updateCalendarEvent, toggleEventPublish, getUpcomingEvents, EventCategory, EventTargetAudience, getCourses } from "@/lib/api";
import { getCategoryInfo, EVENT_CATEGORIES } from "@/lib/calendar-constants";
import { Card } from "@/components/ui/card";
import { AlertCircle, Clock, Calendar as CalendarIcon, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CalendarClientProps {
  role: string;
  token: string;
  userId: string;
}

export function CalendarClient({ role, token, userId }: CalendarClientProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "ALL">("ALL");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    isOnline: false,
    meetingLink: "",
    category: "PENGUMUMAN_AKADEMIK" as EventCategory,
    courseId: "",
    targetAudience: "COURSE_STUDENTS" as EventTargetAudience,
    attachments: "",
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = selectedCategory !== "ALL" ? { category: selectedCategory } : undefined;
      const [eventsData, upcomingData, coursesData] = await Promise.all([
        getCalendarEvents(token, filters),
        getUpcomingEvents(token, 7),
        getCourses(token),
      ]);
      setEvents(eventsData.data || []);
      setUpcomingEvents(upcomingData.data || []);
      setCourses(
        (coursesData.data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          code: c.code,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat kalender");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [token, selectedCategory]);

  const handleCreateEvent = async (data: any) => {
    await createCalendarEvent(token, data);
    await fetchEvents();
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteCalendarEvent(token, eventId);
    await fetchEvents();
  };

  const handleUpdateEvent = async (eventId: string, data: any) => {
    await updateCalendarEvent(token, eventId, data);
    await fetchEvents();
  };

  const handleTogglePublish = async (eventId: string) => {
    await toggleEventPublish(token, eventId);
    await fetchEvents();
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || "",
      startDate: event.startDate.split('T')[0],
      startTime: event.startTime || "",
      endDate: event.endDate ? event.endDate.split('T')[0] : "",
      endTime: event.endTime || "",
      location: event.location || "",
      isOnline: event.isOnline,
      meetingLink: event.meetingLink || "",
      category: event.category,
      courseId: event.courseId || "",
      targetAudience: event.targetAudience,
      attachments: event.attachments ? JSON.stringify(event.attachments) : "",
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateNewEvent = async () => {
    await createCalendarEvent(token, {
      ...newEvent,
      startDate: newEvent.startDate,
      endDate: newEvent.endDate || undefined,
      startTime: newEvent.startTime || undefined,
      endTime: newEvent.endTime || undefined,
      isPublished: true,
      attachments: newEvent.attachments ? (() => {
        try {
          return JSON.parse(newEvent.attachments);
        } catch (e) {
          toast.error("Format JSON tidak valid untuk lampiran");
          return undefined;
        }
      })() : undefined,
    });
    setIsCreateDialogOpen(false);
    setNewEvent({
      title: "",
      description: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      location: "",
      isOnline: false,
      meetingLink: "",
      category: "PENGUMUMAN_AKADEMIK",
      courseId: "",
      targetAudience: "COURSE_STUDENTS",
      attachments: "",
    });
    await fetchEvents();
  };

  const handleUpdateExistingEvent = async () => {
    if (!editingEvent) return;
    await updateCalendarEvent(token, editingEvent.id, {
      ...newEvent,
      startDate: newEvent.startDate,
      endDate: newEvent.endDate || undefined,
      startTime: newEvent.startTime || undefined,
      endTime: newEvent.endTime || undefined,
      attachments: newEvent.attachments ? (() => {
        try {
          return JSON.parse(newEvent.attachments);
        } catch (e) {
          toast.error("Format JSON tidak valid untuk lampiran");
          return undefined;
        }
      })() : undefined,
    });
    setIsEditDialogOpen(false);
    setEditingEvent(null);
    setNewEvent({
      title: "",
      description: "",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      location: "",
      isOnline: false,
      meetingLink: "",
      category: "PENGUMUMAN_AKADEMIK",
      courseId: "",
      targetAudience: "COURSE_STUDENTS",
      attachments: "",
    });
    await fetchEvents();
  };



  const filteredEvents = events.filter(event => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        event.title.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query)) ||
        (event.course && (event.course.name.toLowerCase().includes(query) || event.course.code.toLowerCase().includes(query)))
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-destructive/50">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Gagal memuat kalender</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Kalender Akademik</h1>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari event..."
              className="pl-9 w-[200px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as EventCategory | "ALL")}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kategori</SelectItem>
              {EVENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${cat.bgClass}`} />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Buat Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Buat Event Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Judul Event</Label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Masukkan judul event"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select value={newEvent.category} onValueChange={(value) => {
                      setNewEvent({ ...newEvent, category: value as EventCategory });
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${cat.bgClass}`} />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Masukkan deskripsi event"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <Input
                      type="date"
                      value={newEvent.startDate}
                      onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Waktu Mulai</Label>
                    <Input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Selesai (Opsional)</Label>
                    <Input
                      type="date"
                      value={newEvent.endDate}
                      onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Waktu Selesai (Opsional)</Label>
                    <Input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lokasi</Label>
                  <Input
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Masukkan lokasi event"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isOnline"
                      checked={newEvent.isOnline}
                      onChange={(e) => setNewEvent({ ...newEvent, isOnline: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="isOnline">Event Online</Label>
                  </div>
                </div>
                {newEvent.isOnline && (
                  <div className="space-y-2">
                    <Label>Tautan Meeting</Label>
                    <Input
                      value={newEvent.meetingLink}
                      onChange={(e) => setNewEvent({ ...newEvent, meetingLink: e.target.value })}
                      placeholder="Masukkan tautan meeting (Zoom, Google Meet, dll)"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Course (Opsional)</Label>
                  <Select value={newEvent.courseId} onValueChange={(value) => setNewEvent({ ...newEvent, courseId: value })}>
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
                {newEvent.courseId && (
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select value={newEvent.targetAudience} onValueChange={(value) => setNewEvent({ ...newEvent, targetAudience: value as EventTargetAudience })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COURSE_STUDENTS">Mahasiswa Course Ini</SelectItem>
                        <SelectItem value="ALL_STUDENTS">Semua Mahasiswa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Lampiran (Opsional - JSON format)</Label>
                  <Textarea
                    value={newEvent.attachments}
                    onChange={(e) => setNewEvent({ ...newEvent, attachments: e.target.value })}
                    placeholder='{"fileName": "document.pdf", "fileUrl": "https://..."}'
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleCreateNewEvent}>
                    Buat Event
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Event Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <title>Edit Event</title>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Judul Event</Label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Masukkan judul event"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select value={newEvent.category} onValueChange={(value) => {
                      setNewEvent({ ...newEvent, category: value as EventCategory });
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${cat.bgClass}`} />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Deskripsi</Label>
                  <Textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Masukkan deskripsi event"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <Input
                      type="date"
                      value={newEvent.startDate}
                      onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Waktu Mulai</Label>
                    <Input
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tanggal Selesai (Opsional)</Label>
                    <Input
                      type="date"
                      value={newEvent.endDate}
                      onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Waktu Selesai (Opsional)</Label>
                    <Input
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Lokasi</Label>
                  <Input
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Masukkan lokasi event"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isOnlineEdit"
                      checked={newEvent.isOnline}
                      onChange={(e) => setNewEvent({ ...newEvent, isOnline: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="isOnlineEdit">Event Online</Label>
                  </div>
                </div>
                {newEvent.isOnline && (
                  <div className="space-y-2">
                    <Label>Tautan Meeting</Label>
                    <Input
                      value={newEvent.meetingLink}
                      onChange={(e) => setNewEvent({ ...newEvent, meetingLink: e.target.value })}
                      placeholder="Masukkan tautan meeting (Zoom, Google Meet, dll)"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Course (Opsional)</Label>
                  <Select value={newEvent.courseId} onValueChange={(value) => setNewEvent({ ...newEvent, courseId: value })}>
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
                {newEvent.courseId && (
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select value={newEvent.targetAudience} onValueChange={(value) => setNewEvent({ ...newEvent, targetAudience: value as EventTargetAudience })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="COURSE_STUDENTS">Mahasiswa Course Ini</SelectItem>
                        <SelectItem value="ALL_STUDENTS">Semua Mahasiswa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Lampiran (Opsional - JSON format)</Label>
                  <Textarea
                    value={newEvent.attachments}
                    onChange={(e) => setNewEvent({ ...newEvent, attachments: e.target.value })}
                    placeholder='{"fileName": "document.pdf", "fileUrl": "https://..."}'
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleUpdateExistingEvent}>
                    Simpan Perubahan
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              Event Mendatang (7 Hari ke Depan)
            </h3>
            <Badge variant="secondary" className="ml-auto">
              {upcomingEvents.length} event
            </Badge>
          </div>
          <div className="space-y-2">
            {upcomingEvents.map((event) => {
              const catInfo = getCategoryInfo(event.category);
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-blue-100 dark:border-blue-800"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${catInfo.bgClass}`}
                    />
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${catInfo.textClass}`}>
                          {catInfo.label}
                        </Badge>
                        {event.course && (
                          <p className="text-xs text-muted-foreground">
                            {event.course.code} - {event.course.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {new Date(event.startDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {event.timeRemaining || new Date(event.startDate).toLocaleDateString("id-ID", { weekday: "short" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Calendar */}
      <CalendarView
        events={filteredEvents}
        onEventCreate={handleCreateEvent}
        onEventDelete={handleDeleteEvent}
        onEventUpdate={handleUpdateEvent}
        onEventEdit={handleEditEvent}
        onEventTogglePublish={handleTogglePublish}
        canCreate={true}
        userRole={role}
        courses={courses}
      />
    </div>
  );
}
