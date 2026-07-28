"use client";

import { CalendarEvent } from "@/lib/api";
import { getCategoryInfo } from "@/lib/calendar-constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface UpcomingEventsPanelProps {
  events: CalendarEvent[];
  days?: number;
  onEventClick?: (event: CalendarEvent) => void;
}

export function UpcomingEventsPanel({ events, days = 7, onEventClick }: UpcomingEventsPanelProps) {
  if (events.length === 0) return null;

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
          Event Mendatang ({days} Hari ke Depan)
        </h3>
        <Badge variant="secondary" className="ml-auto">
          {events.length} event
        </Badge>
      </div>
      <div className="space-y-2">
        {events.map((event) => {
          const catInfo = getCategoryInfo(event.category);
          return (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
              onClick={() => onEventClick?.(event)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: event.color || catInfo.color }}
                />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{event.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: catInfo.color, color: catInfo.color }}
                    >
                      {catInfo.label}
                    </Badge>
                    {event.course && (
                      <p className="text-xs text-muted-foreground truncate">
                        {event.course.code} - {event.course.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {new Date(event.startDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {event.startTime ||
                    event.timeRemaining ||
                    new Date(event.startDate).toLocaleDateString("id-ID", { weekday: "short" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
