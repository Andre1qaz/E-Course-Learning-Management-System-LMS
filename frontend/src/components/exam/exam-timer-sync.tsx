'use client';

import { useState, useEffect } from 'react';
import { useExamTimerRealtime } from '@/hooks/use-exam-timer-realtime';
import { Badge } from '@/components/ui/badge';
import { Clock, Users } from 'lucide-react';

interface ExamTimerSyncProps {
  token: string | null;
  examId: string;
  initialRemainingSeconds: number;
  examDuration: number;
  onTimeUp?: () => void;
}

export function ExamTimerSync({
  token,
  examId,
  initialRemainingSeconds,
  examDuration,
  onTimeUp,
}: ExamTimerSyncProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds);
  const { timerData, examUpdates, isConnected, syncTimer } = useExamTimerRealtime(token, examId);

  // Update local timer when sync received
  useEffect(() => {
    if (timerData && timerData.examId === examId) {
      setRemainingSeconds(timerData.remainingSeconds);
    }
  }, [timerData, examId]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeUp]);

  // Sync timer every 10 seconds
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (isConnected && remainingSeconds > 0) {
        syncTimer(remainingSeconds);
      }
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [isConnected, remainingSeconds, syncTimer]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (remainingSeconds <= 60) return 'text-red-500';
    if (remainingSeconds <= 300) return 'text-orange-500';
    return 'text-green-500';
  };

  const getProgressPercentage = () => {
    return ((examDuration * 60 - remainingSeconds) / (examDuration * 60)) * 100;
  };

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <h3 className="text-sm font-medium">Exam Timer</h3>
        </div>
        {isConnected && (
          <Badge variant="outline">
            Synced
          </Badge>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="text-3xl font-bold font-mono text-center">
          <span className={getTimeColor()}>{formatTime(remainingSeconds)}</span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-1000"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>

        {/* Active users count */}
        {examUpdates.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{examUpdates.length} users actively taking this exam</span>
          </div>
        )}

        {/* Recent activity */}
        {examUpdates.length > 0 && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Recent activity:</span> Last submission{' '}
            {formatDistanceToNow(new Date(examUpdates[0].submittedAt))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  return `${Math.floor(diffInSeconds / 3600)}h ago`;
}