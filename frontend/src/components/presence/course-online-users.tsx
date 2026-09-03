'use client';

import { usePresenceRealtime } from '@/hooks/use-presence-realtime';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface CourseOnlineUsersProps {
  token: string | null;
  courseId: string;
  currentUserId?: string;
}

export function CourseOnlineUsers({ token, courseId, currentUserId }: CourseOnlineUsersProps) {
  const { getOnlineUsersInCourse, isConnected } = usePresenceRealtime(token);
  const onlineUsers = getOnlineUsersInCourse(courseId);

  const otherUsers = onlineUsers.filter((user) => user.id !== currentUserId);

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4" />
        <h3 className="text-sm font-medium">Online Users</h3>
        {isConnected && (
          <Badge variant="outline" className="ml-auto">
            Live
          </Badge>
        )}
      </div>
      {otherUsers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No other users online</p>
      ) : (
        <div className="space-y-2">
          {otherUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{user.name}</span>
              <Badge variant="secondary" className="h-2 w-2 rounded-full bg-green-500 p-0 ml-auto" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}