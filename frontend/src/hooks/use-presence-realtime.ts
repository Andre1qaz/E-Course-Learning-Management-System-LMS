'use client';

import { useState, useCallback } from 'react';
import { useWebSocket } from './use-websocket';

interface OnlineUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface CourseUsersData {
  courseId: string;
  onlineUsers: OnlineUser[];
}

export function usePresenceRealtime(token: string | null) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [courseUsers, setCourseUsers] = useState<Map<string, OnlineUser[]>>(new Map());

  const handleUserOnline = useCallback((data: { userId: string; userName: string }) => {
    setOnlineUsers((prev) => [...new Set([...prev, data.userId])]);
  }, []);

  const handleUserOffline = useCallback((data: { userId: string }) => {
    setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
  }, []);

  const handleCourseUsers = useCallback((data: CourseUsersData) => {
    setCourseUsers((prev) => {
      const updated = new Map(prev);
      updated.set(data.courseId, data.onlineUsers);
      return updated;
    });
  }, []);

  const { isConnected, joinCourse, leaveCourse } = useWebSocket(token, {}, {
    'user:online': handleUserOnline,
    'user:offline': handleUserOffline,
    'course:users': handleCourseUsers,
  });

  const isUserOnline = useCallback((userId: string) => {
    return onlineUsers.includes(userId);
  }, [onlineUsers]);

  const getOnlineUsersInCourse = useCallback((courseId: string) => {
    return courseUsers.get(courseId) || [];
  }, [courseUsers]);

  return {
    onlineUsers,
    courseUsers,
    isConnected,
    isUserOnline,
    getOnlineUsersInCourse,
    joinCourse,
    leaveCourse,
  };
}