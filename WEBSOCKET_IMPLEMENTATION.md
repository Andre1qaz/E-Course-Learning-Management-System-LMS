# WebSocket/Real-time Features Implementation

This document describes the WebSocket/Real-time features that have been implemented in the E-Course Learning Management System.

## Overview

The following real-time features have been successfully implemented:

1. **Real-time Notifications** - WebSocket-based notifications for instant updates
2. **Live Collaboration** - Real-time forum replies and typing indicators
3. **Presence Detection** - User online status tracking
4. **Exam Timer Sync** - Real-time synchronization of exam timers

## Backend Implementation

### Dependencies Installed
- `@nestjs/websockets@^11.0.0` - NestJS WebSocket support
- `@nestjs/platform-socket.io@^11.0.0` - Socket.IO platform adapter
- `socket.io` - WebSocket library

### Files Created/Modified

#### 1. WebSocket Module (`backend/src/websocket/`)
- **`websocket.module.ts`** - WebSocket module configuration
- **`websocket.gateway.ts`** - Main WebSocket gateway handling all real-time events

#### 2. Integration with Existing Services
- **`notifications/notifications.service.ts`** - Integrated real-time notification sending
- **`notifications/notifications.module.ts`** - Added WebSocket module dependency
- **`forum/forum.service.ts`** - Integrated real-time forum updates
- **`forum/forum.module.ts`** - Added WebSocket module dependency
- **`exams/exams.service.ts`** - Integrated real-time exam timer sync
- **`exams/exams.module.ts`** - Added WebSocket module dependency

#### 3. App Module
- **`app.module.ts`** - Added WebSocketModule to imports

### WebSocket Gateway Features

The WebSocket gateway (`/realtime` namespace) implements:

#### Connection Management
- JWT authentication for secure connections
- Automatic room joining for user-specific and course-specific channels
- Online user tracking across multiple socket connections
- Heartbeat/ping-pong mechanism for connection health

#### Real-time Events

**Notifications:**
- `notification:new` - Sent when a new notification is created
- User-specific rooms (`user:{userId}`) for targeted notifications

**Forum:**
- `forum:reply` - Real-time forum reply updates
- `forum:new_thread` - New thread notifications
- `forum:typing` - Typing indicators
- `forum:typing_stop` - Stop typing indicators
- Course-specific rooms (`course:{courseId}`) for forum updates

**Presence:**
- `user:online` - User came online
- `user:offline` - User went offline
- `course:users` - Online users in a specific course

**Exam:**
- `exam:timer_sync` - Timer synchronization across users
- `exam:update` - Exam status updates (submission, grading)
- `exam:heartbeat` - User activity during exam

#### Client-to-Server Events
- `join:course` - Join a course-specific room
- `leave:course` - Leave a course-specific room
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator
- `exam:heartbeat` - Send exam timer heartbeat
- `ping` - Connection health check

## Frontend Implementation

### Dependencies Installed
- `socket.io-client` - WebSocket client library

### Custom Hooks Created

#### 1. `use-websocket.ts`
Core WebSocket hook that manages:
- Connection lifecycle (connect/disconnect)
- Authentication via JWT token
- Auto-reconnection with exponential backoff
- Event registration and handling
- Heartbeat mechanism
- Course room management

#### 2. `use-notifications-realtime.ts`
Specialized hook for notifications:
- Real-time notification reception
- Unread count tracking
- Mark as read functionality
- Toast notification integration

#### 3. `use-forum-realtime.ts`
Specialized hook for forum features:
- Real-time thread updates
- Reply notifications
- Typing indicators
- Automatic cleanup of stale typing indicators

#### 4. `use-exam-timer-realtime.ts`
Specialized hook for exam features:
- Timer synchronization
- Exam status updates
- Active user tracking
- Automatic cleanup of old updates

#### 5. `use-presence-realtime.ts`
Specialized hook for presence features:
- Online user tracking
- Course-specific user lists
- Online status checking

### UI Components Created

#### 1. Notification Components
- **`notification-toast.tsx`** - Toast notifications for new alerts
- **`notification-bell.tsx`** - Notification bell with unread count and dropdown

#### 2. Presence Components
- **`online-status-indicator.tsx`** - Individual user online status indicator
- **`course-online-users.tsx`** - Display online users in a course

#### 3. Forum Components
- **`forum-typing-indicator.tsx`** - Typing indicator for forum threads

#### 4. Exam Components
- **`exam-timer-sync.tsx`** - Synchronized exam timer with progress bar

## Usage Examples

### Backend - Sending Real-time Notifications

```typescript
// In your service
constructor(
  private prisma: PrismaService,
  private realtimeGateway: RealtimeGateway,
) {}

// Send notification to specific user
this.realtimeGateway.sendNotificationToUser(userId, notification);

// Send bulk notifications
this.realtimeGateway.sendBulkNotifications(userIds, notification);
```

### Frontend - Using Real-time Features

```typescript
// In your component
import { useNotificationsRealtime } from '@/hooks/use-notifications-realtime';
import { NotificationBell } from '@/components/notifications/notification-bell';

function MyComponent() {
  const { data: session } = useSession();
  const { notifications, unreadCount } = useNotificationsRealtime(session?.accessToken);

  return (
    <div>
      <NotificationBell token={session?.accessToken} />
      {/* Rest of your component */}
    </div>
  );
}
```

### Forum with Real-time Updates

```typescript
import { useForumRealtime } from '@/hooks/use-forum-realtime';
import { ForumTypingIndicator } from '@/components/forum/forum-typing-indicator';

function ForumThread({ threadId, token, currentUserId }) {
  const { startTyping, stopTyping } = useForumRealtime(token);

  const handleInputFocus = () => {
    startTyping(threadId);
  };

  const handleInputBlur = () => {
    stopTyping(threadId);
  };

  return (
    <div>
      <ForumTypingIndicator 
        token={token} 
        threadId={threadId} 
        currentUserId={currentUserId} 
      />
      <textarea 
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
      />
    </div>
  );
}
```

### Exam Timer Sync

```typescript
import { ExamTimerSync } from '@/components/exam/exam-timer-sync';

function ExamTaking({ examId, token, initialTime, duration }) {
  const handleTimeUp = () => {
    // Auto-submit exam
  };

  return (
    <ExamTimerSync
      token={token}
      examId={examId}
      initialRemainingSeconds={initialTime}
      examDuration={duration}
      onTimeUp={handleTimeUp}
    />
  );
}
```

## Environment Configuration

Make sure your backend `.env` file includes:

```env
# WebSocket/Socket.IO will use the same CORS settings as HTTP
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-secret-key
```

## Integration Points

### Where to Add Components

1. **Layout Components**: Add `<NotificationToast />` to your main layout
2. **Header/Navigation**: Add `<NotificationBell />` to your navigation bar
3. **Forum Pages**: Add `<ForumTypingIndicator />` to thread views
4. **Course Pages**: Add `<CourseOnlineUsers />` to course dashboards
5. **Exam Pages**: Add `<ExamTimerSync />` to exam taking interface

### Token Management

The WebSocket hooks require an authentication token. In Next.js with NextAuth:

```typescript
const { data: session } = useSession();
const token = session?.accessToken; // or session?.user?.token
```

## Security Considerations

1. **Authentication**: All WebSocket connections require valid JWT tokens
2. **Authorization**: Users can only join rooms for courses they're enrolled in
3. **Validation**: All events are validated on the server side
4. **Rate Limiting**: The existing NestJS throttler applies to WebSocket events

## Performance Considerations

1. **Heartbeat**: Ping every 30 seconds to maintain connection health
2. **Cleanup**: Automatic cleanup of stale typing indicators and old updates
3. **Room Management**: Efficient room-based messaging to avoid broadcasting to all users
4. **Reconnection**: Automatic reconnection with exponential backoff

## Testing Recommendations

1. **Connection Testing**: Test WebSocket connection establishment and reconnection
2. **Notification Testing**: Verify real-time notification delivery
3. **Forum Testing**: Test typing indicators and real-time replies
4. **Presence Testing**: Verify online status updates across multiple users
5. **Exam Testing**: Test timer synchronization between multiple users

## Troubleshooting

### Connection Issues
- Check that JWT tokens are valid and not expired
- Verify CORS settings in backend configuration
- Ensure WebSocket namespace (`/realtime`) is correctly configured

### Performance Issues
- Monitor memory usage with many online users
- Consider implementing Redis for horizontal scaling
- Review room management for efficient message routing

### Missing Updates
- Verify that services are injecting the RealtimeGateway
- Check that event handlers are properly registered
- Ensure users are in the correct rooms

## Future Enhancements

Potential improvements for the WebSocket implementation:

1. **Redis Adapter**: For horizontal scaling across multiple server instances
2. **Message Queue**: For reliable message delivery
3. **Compression**: Reduce bandwidth usage for large payloads
4. **Binary Data**: Support for file transfers via WebSocket
5. **Video/Audio**: Real-time communication features
6. **Whiteboard**: Collaborative drawing tools
7. **Screen Sharing**: For live teaching sessions

## Summary

The WebSocket implementation provides a comprehensive real-time communication layer for the LMS, enabling:

- ✅ Instant notifications without page refresh
- ✅ Live forum collaboration with typing indicators
- ✅ Real-time presence tracking across the platform
- ✅ Synchronized exam timers for fair testing
- ✅ Secure, authenticated WebSocket connections
- ✅ Efficient room-based message routing
- ✅ Automatic reconnection and error handling
- ✅ Comprehensive frontend hooks and components

All features are designed to integrate seamlessly with the existing codebase without breaking any current functionality.