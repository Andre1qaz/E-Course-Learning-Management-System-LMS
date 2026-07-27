"use client";

import { useState, useEffect } from "react";
import { CalendarView } from "@/components/calendar/calendar-view";
import { CalendarEvent, getCalendarEvents, createCalendarEvent, deleteCalendarEvent, getUpcomingEvents, EventCategory } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { AlertCircle, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Heuristic #1: Visibility of System Status — loading states and error handling
// Heuristic #6: Recognition Rather Than Recall — clear upcoming deadlines section

interface CalendarClientProps {
  role: string;
  token: string;
  userId: string;
}

const EVENT_CATEGORIES: { value: EventCategory; label: string; color: string }[] = [
  { value: "PERKULIAHAN", label: "Perkuliahan", color: "#1a365d" },
  { value: "MATERI_BARU", label: "Materi Baru", color: "#2d6a4f" },
  { value: "ASSIGNMENT", label: "Assignment", color: "#f4a261" },
  { value: "QUIZ", label: "Quiz", color: "#e07a5f" },
  { value: "UTS", label: "UTS", color: "#e07a5f" },
  { value: "UAS", label: "UAS", color: "#c1121f" },
  { value: "SEMINAR", label: "Seminar", color: "#457b9d" },
  { value: "PROJECT", label: "Project", color: "#1d3557" },
  { value: "MEETING", label: "Meeting", color: "#6c757d" },
  { value: "DEADLINE", label: "Deadline", color: "#f4a261" },
  { value: "PENGUMUMAN_AKADEMIK", label: "Pengumuman Akademik", color: "#1a365d" },
];

export function CalendarClient({ role, token, userId }: CalendarClientProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

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

  const handleCreateEvent = async (data: any) => {
    await createCalendarEvent(token, data);
    await fetchEvents();
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteCalendarEvent(token, eventId);
    await fetchEvents();
  };

  const getCategoryInfo = (category: EventCategory) => {
    return EVENT_CATEGORIES.find(c => c.value === category) || EVENT_CATEGORIES[10];
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Kalender Akademik</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as EventCategory | "ALL")}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kategori</SelectItem>
              {EVENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: event.color || catInfo.color }}
                    />
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs" style={{ borderColor: catInfo.color, color: catInfo.color }}>
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
        events={events}
        onEventCreate={handleCreateEvent}
        onEventDelete={handleDeleteEvent}
        canCreate={false}
        userRole={role}
        courses={[]}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
    </div>
  );
}
