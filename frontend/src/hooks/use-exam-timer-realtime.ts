'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './use-websocket';

interface ExamTimerData {
  examId: string;
  userId: string;
  remainingSeconds: number;
  examDuration: number;
  examDeadline: Date;
  examStartTime: Date;
  timestamp: Date;
}

interface ExamUpdateData {
  examId: string;
  attemptId: string;
  userId: string;
  status: string;
  totalScore?: number;
  submittedAt: Date;
  timestamp: Date;
}

export function useExamTimerRealtime(token: string | null, examId?: string) {
  const [timerData, setTimerData] = useState<ExamTimerData | null>(null);
  const [examUpdates, setExamUpdates] = useState<ExamUpdateData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleTimerSync = useCallback((data: ExamTimerData) => {
    if (!examId || data.examId === examId) {
      setTimerData(data);
    }
  }, [examId]);

  const handleExamUpdate = useCallback((data: ExamUpdateData) => {
    if (!examId || data.examId === examId) {
      setExamUpdates((prev) => [data, ...prev]);
    }
  }, [examId]);

  const { isConnected: wsConnected, sendExamHeartbeat } = useWebSocket(token, {}, {
    'exam:timer_sync': handleTimerSync,
    'exam:update': handleExamUpdate,
  });

  useEffect(() => {
    setIsConnected(wsConnected);
  }, [wsConnected]);

  const syncTimer = useCallback((remainingTime: number) => {
    if (examId && isConnected) {
      sendExamHeartbeat(examId, remainingTime);
    }
  }, [examId, isConnected, sendExamHeartbeat]);

  // Clear exam updates after 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setExamUpdates((prev) =>
        prev.filter((update) => now.getTime() - update.timestamp.getTime() < 5000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    timerData,
    examUpdates,
    isConnected,
    syncTimer,
  };
}