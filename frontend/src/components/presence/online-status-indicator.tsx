'use client';

import { usePresenceRealtime } from '@/hooks/use-presence-realtime';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface OnlineStatusIndicatorProps {
  token: string | null;
  userId: string;
  userName: string;
  userAvatar?: string;
  showLabel?: boolean;
}

export function OnlineStatusIndicator({
  token,
  userId,
  userName,
  userAvatar,
  showLabel = false,
}: OnlineStatusIndicatorProps) {
  const { isUserOnline } = usePresenceRealtime(token);
  const isOnline = isUserOnline(userId);

  return (
    <div className="relative inline-flex items-center">
      <Avatar className={showLabel ? 'h-8 w-8' : 'h-6 w-6'}>
        {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
        <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      {isOnline && (
        <Badge
          variant="secondary"
          className="absolute -bottom-0 -right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background p-0"
        />
      )}
      {showLabel && (
        <span className="ml-2 text-sm text-muted-foreground">
          {userName} {isOnline && <span className="text-green-500">(Online)</span>}
        </span>
      )}
    </div>
  );
}