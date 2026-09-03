'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketOptions {
  enabled?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

interface WebSocketEvents {
  'notification:new': (data: any) => void;
  'forum:reply': (data: any) => void;
  'forum:new_thread': (data: any) => void;
  'forum:typing': (data: any) => void;
  'forum:typing_stop': (data: any) => void;
  'user:online': (data: any) => void;
  'user:offline': (data: any) => void;
  'exam:timer_sync': (data: any) => void;
  'exam:update': (data: any) => void;
  'exam:heartbeat': (data: any) => void;
  'course:update': (data: any) => void;
  'chat:message': (data: any) => void;
  'course:users': (data: any) => void;
  'connected': (data: any) => void;
  'pong': (data: any) => void;
}

export function useWebSocket(
  token: string | null,
  options: UseWebSocketOptions = {},
  eventHandlers?: Partial<WebSocketEvents>
) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { enabled = true, onConnect, onDisconnect, onError } = options;

  const connect = useCallback(() => {
    if (!token || !enabled) return;

    if (socketRef.current?.connected) {
      return;
    }

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      onConnect?.();
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      onDisconnect?.();
      console.log('WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      onError?.(error);
    });

    socket.on('connected', (data) => {
      if (data.onlineUsers) {
        setOnlineUsers(data.onlineUsers);
      }
    });

    socket.on('user:online', (data) => {
      setOnlineUsers((prev) => [...new Set([...prev, data.userId])]);
    });

    socket.on('user:offline', (data) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
    });

    // Register custom event handlers
    if (eventHandlers) {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socket.on(event, handler);
      });
    }

    // Start heartbeat
    heartbeatIntervalRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000); // Ping every 30 seconds
  }, [token, enabled, onConnect, onDisconnect, onError, eventHandlers]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    setIsConnected(false);
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const joinCourse = useCallback((courseId: string) => {
    emit('join:course', { courseId });
  }, [emit]);

  const leaveCourse = useCallback((courseId: string) => {
    emit('leave:course', { courseId });
  }, [emit]);

  const startTyping = useCallback((threadId: string) => {
    emit('typing:start', { threadId });
  }, [emit]);

  const stopTyping = useCallback((threadId: string) => {
    emit('typing:stop', { threadId });
  }, [emit]);

  const sendExamHeartbeat = useCallback((examId: string, remainingTime: number) => {
    emit('exam:heartbeat', { examId, remainingTime });
  }, [emit]);

  useEffect(() => {
    if (enabled && token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, token, connect, disconnect]);

  return {
    isConnected,
    onlineUsers,
    socket: socketRef.current,
    emit,
    joinCourse,
    leaveCourse,
    startTyping,
    stopTyping,
    sendExamHeartbeat,
  };
}