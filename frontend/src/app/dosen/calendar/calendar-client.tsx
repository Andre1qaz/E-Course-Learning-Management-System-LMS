"use client";

import { useState, useEffect } from "react";
import { CalendarView } from "@/components/calendar/calendar-view";
import { UpcomingEventsPanel } from "@/components/calendar/upcoming-events-panel";
import { CalendarEvent, getCalendarEvents, createCalendarEvent, deleteCalendarEvent, updateCalendarEvent, toggleEventPublish, getUpcomingEvents, EventCategory, EventTargetAudience, getCourses, createAnnouncement } from "@/lib/api";
import { AlertCircle, Calendar as CalendarIcon, Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CategoryNativeSelect, CourseNativeSelect } from "@/components/calendar/calendar-selects";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// Heuristic #1: Visibility of System Status — loading states and error handling
// Heuristic #6: Recognition Rather Than Recall — clear upcoming deadlines section

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
    category: "PERKULIAHAN" as EventCategory,
    type: "ANNOUNCEMENT" as CalendarEvent["type"],
    courseId: "",
    targetAudience: "COURSE_STUDENTS" as EventTargetAudience,
    attachments: "",
    color: "#3B82F6",
  });

  const colorOptions = [
    { value: "#3B82F6", label: "Deep Navy" },
    { value: "#22C55E", label: "Forest Green" },
    { value: "#F97316", label: "Coral" },
    { value: "#6366F1", label: "Steel Blue" },
    { value: "#EF4444", label: "Red" },
    { value: "#14B8A6", label: "Sky Blue" },
    { value: "#F59E0B", label: "Amber" },
    { value: "#8B5CF6", label: "Purple" },
  ];

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
      type: event.type,
      courseId: event.courseId || "",
      targetAudience: event.targetAudience,
      attachments: event.attachments && Array.isArray(event.attachments) && event.attachments.length > 0
        ? event.attachments[0].fileUrl
        : "",
      color: event.color || "#3B82F6",
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateNewEvent = async () => {
    try {
      // Handle attachments as URL string
      const attachments = newEvent.attachments && newEvent.attachments.trim() !== ''
        ? [{
            fileName: "attachment",
            fileUrl: newEvent.attachments.trim(),
            fileSize: 0,
            mimeType: "text/plain",
          }]
        : undefined;

      // Create calendar event
      await createCalendarEvent(token, {
        ...newEvent,
        startDate: newEvent.startDate,
        endDate: newEvent.endDate || undefined,
        startTime: newEvent.startTime || undefined,
        endTime: newEvent.endTime || undefined,
        isPublished: true,
        attachments: attachments,
        color: newEvent.color,
      });

      // Create announcement with the same data
      await createAnnouncement(token, {
        title: newEvent.title,
        content: newEvent.description,
        priority: "NORMAL",
        isPublished: true,
        validFrom: newEvent.startDate,
        validUntil: newEvent.endDate || undefined,
        courseId: newEvent.courseId || undefined,
        attachments: attachments?.map((file) => ({
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          fileSize: String(file.fileSize),
        })),
      });

      toast.success("Event dan pengumuman berhasil dibuat");
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
        category: "PERKULIAHAN",
        type: "ANNOUNCEMENT",
        courseId: "",
        targetAudience: "COURSE_STUDENTS",
        attachments: "",
        color: "#3B82F6",
      });
      await fetchEvents();
    } catch (error) {
      toast.error("Gagal membuat event dan pengumuman");
    }
  };

  const handleUpdateExistingEvent = async () => {
    if (!editingEvent) return;
    
    // Handle attachments as URL string
    const attachments = newEvent.attachments && newEvent.attachments.trim() !== ''
      ? [{
          fileName: "attachment",
          fileUrl: newEvent.attachments.trim(),
          fileSize: 0,
          mimeType: "text/plain",
        }]
      : undefined;
    
    await updateCalendarEvent(token, editingEvent.id, {
      ...newEvent,
      startDate: newEvent.startDate,
      endDate: newEvent.endDate || undefined,
      startTime: newEvent.startTime || undefined,
      endTime: newEvent.endTime || undefined,
      attachments: attachments,
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
      category: "PERKULIAHAN",
      type: "ANNOUNCEMENT",
      courseId: "",
      targetAudience: "COURSE_STUDENTS",
      attachments: "",
      color: "#3B82F6",
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
          <CategoryNativeSelect
            className="w-full sm:w-[220px]"
            includeAll
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value as EventCategory | "ALL")}
          />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Buat Event & Pengumuman
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Buat Event Baru</DialogTitle>
                <p className="text-sm text-muted-foreground">Event ini akan otomatis ditampilkan di kalender dan pengumuman</p>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Judul Event</Label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Masukkan judul event"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-category">Kategori</Label>
                    <CategoryNativeSelect
                      id="create-category"
                      value={newEvent.category}
                      onChange={(value) => setNewEvent({ ...newEvent, category: value as EventCategory })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-type">Tipe Event</Label>
                  <NativeSelect
                    id="create-type"
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as CalendarEvent["type"] })}
                  >
                    <option value="ANNOUNCEMENT">Pengumuman</option>
                    <option value="DEADLINE">Deadline</option>
                    <option value="PERSONAL_NOTE">Catatan Pribadi</option>
                  </NativeSelect>
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
                  <CourseNativeSelect
                    value={newEvent.courseId}
                    onChange={(value) => setNewEvent({ ...newEvent, courseId: value })}
                    courses={courses}
                  />
                </div>
                {newEvent.courseId && (
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <NativeSelect
                      value={newEvent.targetAudience}
                      onChange={(e) => setNewEvent({ ...newEvent, targetAudience: e.target.value as EventTargetAudience })}
                    >
                      <option value="COURSE_STUDENTS">Mahasiswa Course Ini</option>
                      <option value="ALL_STUDENTS">Semua Mahasiswa</option>
                    </NativeSelect>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Lampiran (Opsional)</Label>
                  <div className="space-y-2">
                    <Input
                      value={newEvent.attachments}
                      onChange={(e) => setNewEvent({ ...newEvent, attachments: e.target.value })}
                      placeholder="Masukkan URL lampiran (contoh: https://drive.google.com/...)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Masukkan URL untuk lampiran seperti Google Drive, Dropbox, atau link file lainnya
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Warna Event</Label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, color: option.value })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          newEvent.color === option.value
                            ? "border-primary ring-2 ring-primary ring-offset-2 scale-110"
                            : "border-border hover:scale-105"
                        }`}
                        style={{ backgroundColor: option.value }}
                        title={option.label}
                        aria-label={`Pilih warna ${option.label}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Warna yang dipilih: {colorOptions.find(opt => opt.value === newEvent.color)?.label || 'Default'}
                  </p>
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <CategoryNativeSelect
                      value={newEvent.category}
                      onChange={(value) => setNewEvent({ ...newEvent, category: value as EventCategory })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipe Event</Label>
                  <NativeSelect
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as CalendarEvent["type"] })}
                  >
                    <option value="ANNOUNCEMENT">Pengumuman</option>
                    <option value="DEADLINE">Deadline</option>
                    <option value="PERSONAL_NOTE">Catatan Pribadi</option>
                  </NativeSelect>
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
                  <CourseNativeSelect
                    value={newEvent.courseId}
                    onChange={(value) => setNewEvent({ ...newEvent, courseId: value })}
                    courses={courses}
                  />
                </div>
                {newEvent.courseId && (
                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <NativeSelect
                      value={newEvent.targetAudience}
                      onChange={(e) => setNewEvent({ ...newEvent, targetAudience: e.target.value as EventTargetAudience })}
                    >
                      <option value="COURSE_STUDENTS">Mahasiswa Course Ini</option>
                      <option value="ALL_STUDENTS">Semua Mahasiswa</option>
                    </NativeSelect>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Lampiran (Opsional)</Label>
                  <div className="space-y-2">
                    <Input
                      value={newEvent.attachments}
                      onChange={(e) => setNewEvent({ ...newEvent, attachments: e.target.value })}
                      placeholder="Masukkan URL lampiran (contoh: https://drive.google.com/...)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Masukkan URL untuk lampiran seperti Google Drive, Dropbox, atau link file lainnya
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Warna Event</Label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, color: option.value })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          newEvent.color === option.value
                            ? "border-primary ring-2 ring-primary ring-offset-2 scale-110"
                            : "border-border hover:scale-105"
                        }`}
                        style={{ backgroundColor: option.value }}
                        title={option.label}
                        aria-label={`Pilih warna ${option.label}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Warna yang dipilih: {colorOptions.find(opt => opt.value === newEvent.color)?.label || 'Default'}
                  </p>
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

      <UpcomingEventsPanel events={upcomingEvents} onEventClick={handleEditEvent} />

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
