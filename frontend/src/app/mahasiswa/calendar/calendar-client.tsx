"use client";

import { useState, useEffect } from "react";
import { CalendarView } from "@/components/calendar/calendar-view";
import { UpcomingEventsPanel } from "@/components/calendar/upcoming-events-panel";
import { CalendarEvent, getCalendarEvents, createCalendarEvent, deleteCalendarEvent, getUpcomingEvents, EventCategory } from "@/lib/api";
import { getCategoryInfo } from "@/lib/calendar-constants";
import { Card } from "@/components/ui/card";
import { AlertCircle, Calendar as CalendarIcon, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategoryNativeSelect } from "@/components/calendar/calendar-selects";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = selectedCategory !== "ALL" ? { category: selectedCategory } : undefined;
      const [eventsData, upcomingData] = await Promise.all([
        getCalendarEvents(token, filters),
        getUpcomingEvents(token, 7),
      ]);
      setEvents(eventsData.data || []);
      setUpcomingEvents(upcomingData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat kalender");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [token, selectedCategory]);

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

  const handleCreateEvent = async (data: any) => {
    await createCalendarEvent(token, data);
    await fetchEvents();
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteCalendarEvent(token, eventId);
    await fetchEvents();
  };

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
        </div>
      </div>

      <UpcomingEventsPanel
        events={upcomingEvents}
        onEventClick={(event) => {
          setSelectedEvent(event);
          setIsViewDialogOpen(true);
        }}
      />

      {/* Calendar */}
      <CalendarView
        events={filteredEvents}
        onEventCreate={handleCreateEvent}
        onEventDelete={handleDeleteEvent}
        canCreate={false}
        userRole={role}
        courses={[]}
      />

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
                <Label className="text-sm">Kategori</Label>
                <Badge className="text-xs">
                  {getCategoryInfo(selectedEvent.category).label}
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
              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="text-xs md:text-sm">
                  Tutup
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
