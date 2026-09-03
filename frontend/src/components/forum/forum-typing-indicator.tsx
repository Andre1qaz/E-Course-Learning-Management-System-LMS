'use client';

import { useForumRealtime } from '@/hooks/use-forum-realtime';
import { Badge } from '@/components/ui/badge';

interface ForumTypingIndicatorProps {
  token: string | null;
  threadId: string;
  currentUserId: string;
}

export function ForumTypingIndicator({ token, threadId, currentUserId }: ForumTypingIndicatorProps) {
  const { getTypingUsersForThread, isConnected } = useForumRealtime(token);
  const typingUsers = getTypingUsersForThread(threadId);

  // Filter out current user
  const otherTypingUsers = typingUsers.filter((user) => user.userId !== currentUserId);

  if (otherTypingUsers.length === 0) {
    return null;
  }

  const names = otherTypingUsers.map((user) => user.userName);
  const text = names.length === 1 
    ? `${names[0]} is typing...`
    : names.length === 2
    ? `${names[0]} and ${names[1]} are typing...`
    : `${names[0]} and ${names.length - 1} others are typing...`;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isConnected && (
        <Badge variant="outline" className="h-2 w-2 rounded-full bg-blue-500 p-0 animate-pulse" />
      )}
      <span>{text}</span>
    </div>
  );
}