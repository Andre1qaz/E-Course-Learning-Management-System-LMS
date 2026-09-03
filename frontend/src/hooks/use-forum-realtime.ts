'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './use-websocket';

interface ForumReply {
  id: string;
  threadId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  content: string;
  createdAt: Date;
  attachments?: any[];
}

interface ForumThread {
  id: string;
  courseId: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  title: string;
  content: string;
  createdAt: Date;
  replies: ForumReply[];
}

interface TypingUser {
  threadId: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

export function useForumRealtime(token: string | null) {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  const handleNewReply = useCallback((data: { threadId: string; reply: ForumReply }) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === data.threadId
          ? { ...thread, replies: [...thread.replies, data.reply] }
          : thread
      )
    );
  }, []);

  const handleNewThread = useCallback((data: { courseId: string; thread: ForumThread }) => {
    setThreads((prev) => [data.thread, ...prev]);
  }, []);

  const handleTypingStart = useCallback((data: TypingUser) => {
    setTypingUsers((prev) => {
      const filtered = prev.filter((t) => t.userId !== data.userId);
      return [...filtered, { ...data, timestamp: new Date() }];
    });
  }, []);

  const handleTypingStop = useCallback((data: { threadId: string; userId: string }) => {
    setTypingUsers((prev) => prev.filter((t) => t.userId !== data.userId));
  }, []);

  const { isConnected, startTyping, stopTyping } = useWebSocket(token, {}, {
    'forum:reply': handleNewReply,
    'forum:new_thread': handleNewThread,
    'forum:typing': handleTypingStart,
    'forum:typing_stop': handleTypingStop,
  });

  // Clean up typing users after 3 seconds of inactivity
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTypingUsers((prev) =>
        prev.filter((t) => now.getTime() - t.timestamp.getTime() < 3000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getTypingUsersForThread = useCallback((threadId: string) => {
    return typingUsers.filter((t) => t.threadId === threadId);
  }, [typingUsers]);

  return {
    threads,
    typingUsers,
    isConnected,
    startTyping,
    stopTyping,
    getTypingUsersForThread,
  };
}