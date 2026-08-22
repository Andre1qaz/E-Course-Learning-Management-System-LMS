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
    <Card className="p-5 bg-secondary/70 border-border">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">
          Event Mendatang ({days} Hari ke Depan)
        </h3>
        <Badge variant="secondary" className="ml-auto">
          {events.length} event
        </Badge>
      </div>
      <div className="space-y-3">
        {events.map((event) => {
          const catInfo = getCategoryInfo(event.category);
          return (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-colors cursor-pointer gap-3"
              onClick={() => onEventClick?.(event)}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${catInfo.bgClass}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate mb-1 text-foreground">{event.title}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${catInfo.lightBgClass} ${catInfo.textClass}`}>
                      {catInfo.label}
                    </span>
                    {event.course && (
                      <p className="text-xs text-muted-foreground truncate">
                        {event.course.code} - {event.course.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 min-w-[90px]">
                <p className="text-sm font-medium text-primary whitespace-nowrap">
                  {new Date(event.startDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
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
