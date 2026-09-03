import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@WSGateway({
  cors: {
    origin: [
      process.env.FRONTEND_URL ?? 'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3002',
      'http://127.0.0.1:3002',
    ],
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth.token ||
        client.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Connection rejected: No token provided');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, name: true },
      });

      if (!user) {
        this.logger.warn('Connection rejected: User not found');
        client.disconnect();
        return;
      }

      client.userId = user.id;
      client.userRole = user.role;

      // Add user to online users
      this.addOnlineUser(user.id, client.id);

      // Join user's personal room for notifications
      await client.join(`user:${user.id}`);

      // Join course rooms for courses user is enrolled in or teaching
      const enrollments = await this.prisma.enrollment.findMany({
        where: { userId: user.id },
        select: { courseId: true },
      });

      const instructedCourses = await this.prisma.course.findMany({
        where: { instructorId: user.id },
        select: { id: true },
      });

      const courseIds = [
        ...enrollments.map((e) => e.courseId),
        ...instructedCourses.map((c) => c.id),
      ];

      for (const courseId of courseIds) {
        await client.join(`course:${courseId}`);
      }

      this.logger.log(
        `User ${user.name} (${user.id}) connected. Socket ID: ${client.id}`,
      );

      // Broadcast user online status
      this.server.emit('user:online', {
        userId: user.id,
        userName: user.name,
        timestamp: new Date(),
      });

      // Send confirmation to client
      client.emit('connected', {
        userId: user.id,
        userRole: user.role,
        onlineUsers: Array.from(this.onlineUsers.keys()),
      });
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.removeOnlineUser(client.userId, client.id);

      this.logger.log(
        `User ${client.userId} disconnected. Socket ID: ${client.id}`,
      );

      // Broadcast user offline status if no more connections
      if (!this.onlineUsers.has(client.userId)) {
        this.server.emit('user:offline', {
          userId: client.userId,
          timestamp: new Date(),
        });
      }
    }
  }

  private addOnlineUser(userId: string, socketId: string) {
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)!.add(socketId);
  }

  private removeOnlineUser(userId: string, socketId: string) {
    const userSockets = this.onlineUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.onlineUsers.delete(userId);
      }
    }
  }

  // Notification methods
  sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  sendBulkNotifications(userIds: string[], notification: any) {
    userIds.forEach((userId) => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  // Forum methods
  sendForumReply(threadId: string, reply: any) {
    this.server.emit('forum:reply', {
      threadId,
      reply,
      timestamp: new Date(),
    });
  }

  sendNewThread(courseId: string, thread: any) {
    this.server.to(`course:${courseId}`).emit('forum:new_thread', {
      courseId,
      thread,
      timestamp: new Date(),
    });
  }

  // Exam timer methods
  syncExamTimer(examId: string, timerData: any) {
    this.server.emit('exam:timer_sync', {
      examId,
      ...timerData,
      timestamp: new Date(),
    });
  }

  sendExamUpdate(examId: string, update: any) {
    this.server.emit('exam:update', {
      examId,
      ...update,
      timestamp: new Date(),
    });
  }

  // Presence methods
  broadcastTyping(threadId: string, userId: string, userName: string) {
    this.server.emit('forum:typing', {
      threadId,
      userId,
      userName,
      timestamp: new Date(),
    });
  }

  // Course-specific methods
  sendCourseUpdate(courseId: string, update: any) {
    this.server.to(`course:${courseId}`).emit('course:update', {
      courseId,
      ...update,
      timestamp: new Date(),
    });
  }

  // Chat methods
  sendChatMessage(courseId: string, message: any) {
    this.server.to(`course:${courseId}`).emit('chat:message', {
      courseId,
      ...message,
      timestamp: new Date(),
    });
  }

  // Client-side event handlers
  @SubscribeMessage('join:course')
  async handleJoinCourse(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { courseId: string },
  ) {
    if (client.userId && data.courseId) {
      await client.join(`course:${data.courseId}`);
      this.logger.log(`User ${client.userId} joined course ${data.courseId}`);

      // Send current online users in course
      const courseEnrollments = await this.prisma.enrollment.findMany({
        where: { courseId: data.courseId },
        include: { user: { select: { id: true, name: true } } },
      });

      const onlineUserIds = Array.from(this.onlineUsers.keys());
      const onlineUsersInCourse = courseEnrollments
        .filter((e) => onlineUserIds.includes(e.userId))
        .map((e) => ({
          id: e.user.id,
          name: e.user.name,
        }));

      client.emit('course:users', {
        courseId: data.courseId,
        onlineUsers: onlineUsersInCourse,
      });
    }
  }

  @SubscribeMessage('leave:course')
  async handleLeaveCourse(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { courseId: string },
  ) {
    if (client.userId && data.courseId) {
      await client.leave(`course:${data.courseId}`);
      this.logger.log(`User ${client.userId} left course ${data.courseId}`);
    }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string },
  ) {
    if (client.userId && data.threadId) {
      this.broadcastTyping(data.threadId, client.userId, client.userId);
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { threadId: string },
  ) {
    if (client.userId && data.threadId) {
      this.server.emit('forum:typing_stop', {
        threadId: data.threadId,
        userId: client.userId,
      });
    }
  }

  @SubscribeMessage('exam:heartbeat')
  handleExamHeartbeat(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { examId: string; remainingTime: number },
  ) {
    if (client.userId && data.examId) {
      // Broadcast to other users taking the same exam
      this.server.emit('exam:heartbeat', {
        examId: data.examId,
        userId: client.userId,
        remainingTime: data.remainingTime,
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: new Date() });
  }
}
