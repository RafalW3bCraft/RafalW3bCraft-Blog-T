import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { db } from './db';
import { messages, users, insertMessageSchema } from '@shared/schema';
import { moderationService } from './moderation';
import { eq, or, and, isNull, inArray } from 'drizzle-orm';

export class WebSocketService {
  private io: SocketServer;
  private userSockets = new Map<string, string>();

  constructor(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ["https://*.replit.app", "https://*.replit.dev"]
          : ["http://localhost:3000", "http://localhost:5173"],
        credentials: true
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      socket.on('authenticate', async (data: { userId: string, token?: string }) => {
        try {
          const user = await db.select().from(users).where(eq(users.id, data.userId)).limit(1);
          if (user.length === 0) {
            socket.emit('auth_error', { message: 'User not found' });
            return;
          }

          if (!user[0].isActive) {
            socket.emit('auth_error', { 
              message: 'Account is inactive or blocked',
              reason: 'inactive_account'
            });
            console.warn(`WebSocket authentication rejected for inactive user: ${data.userId}`);
            return;
          }

          this.userSockets.set(data.userId, socket.id);
          socket.userId = data.userId;

          socket.join(`user_${data.userId}`);

          if (user[0].role === 'admin') {
            socket.join('admin_room');
          }

          socket.emit('authenticated', { 
            success: true, 
            userId: data.userId,
            role: user[0].role 
          });

        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      socket.on('send_message', async (data: {
        recipientId?: string;
        content: string;
        roomId?: string;
        messageType?: string;
      }) => {
        try {
          if (!socket.userId) {
            socket.emit('message_error', { message: 'Not authenticated' });
            return;
          }

          const moderationResult = await moderationService.moderateContent(
            data.content,
            'message',
            0,
            socket.userId,
            true
          );

          if (!moderationResult.isAllowed) {
            socket.emit('message_blocked', {
              reason: moderationResult.reason,
              action: moderationResult.action
            });
            return;
          }

          const messageData = {
            senderId: socket.userId,
            recipientId: data.recipientId || null,
            content: moderationResult.moderatedContent || data.content,
            originalContent: moderationResult.moderatedContent ? data.content : null,
            isModerated: !!moderationResult.moderatedContent,
            moderationAction: moderationResult.action,
            roomId: data.roomId || null,
            messageType: data.messageType || 'text',
            isRead: false
          };

          const [insertedMessage] = await db.insert(messages).values(messageData).returning();

          const messageWithSender = {
            ...insertedMessage,
            senderName: await this.getUserName(socket.userId),
            senderAvatar: await this.getUserAvatar(socket.userId)
          };

          if (data.recipientId) {
            this.io.to(`user_${data.recipientId}`).emit('new_message', messageWithSender);
            socket.emit('message_sent', messageWithSender);
          } else if (data.roomId) {
            this.io.to(data.roomId).emit('new_message', messageWithSender);
          } else {
            this.io.to('admin_room').emit('new_message', messageWithSender);
            socket.emit('message_sent', messageWithSender);
          }

          console.log(`Message sent from ${socket.userId} to ${data.recipientId || data.roomId || 'admin'}`);
        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('message_error', { message: 'Failed to send message' });
        }
      });

      socket.on('mark_read', async (data: { messageIds: number[] }) => {
        try {
          if (!socket.userId) return;

          await db.update(messages)
            .set({ isRead: true })
            .where(
              and(
                eq(messages.recipientId, socket.userId),
                inArray(messages.id, data.messageIds)
              )
            );

          socket.emit('messages_marked_read', { messageIds: data.messageIds });
        } catch (error) {
          console.error('Mark read error:', error);
        }
      });

      socket.on('join_room', (data: { roomId: string }) => {
        socket.join(data.roomId);
        socket.emit('joined_room', { roomId: data.roomId });
        console.log(`User ${socket.userId} joined room ${data.roomId}`);
      });

      socket.on('leave_room', (data: { roomId: string }) => {
        socket.leave(data.roomId);
        socket.emit('left_room', { roomId: data.roomId });
        console.log(`User ${socket.userId} left room ${data.roomId}`);
      });

      socket.on('get_chat_history', async (data: { 
        recipientId?: string; 
        roomId?: string; 
        limit?: number; 
        offset?: number;
      }) => {
        try {
          if (!socket.userId) return;

          const limit = data.limit || 50;
          const offset = data.offset || 0;

          let whereConditions: any[] = [];

          if (data.recipientId) {
            whereConditions = [
              or(
                and(
                  eq(messages.senderId, socket.userId),
                  eq(messages.recipientId, data.recipientId)
                ),
                and(
                  eq(messages.senderId, data.recipientId),
                  eq(messages.recipientId, socket.userId)
                )
              )
            ];
          } else if (data.roomId) {
            whereConditions = [eq(messages.roomId, data.roomId)];
          } else {
            whereConditions = [
              or(
                and(
                  eq(messages.senderId, socket.userId),
                  isNull(messages.recipientId)
                ),
                eq(messages.recipientId, socket.userId)
              )
            ];
          }

          const query = db.select({
            id: messages.id,
            senderId: messages.senderId,
            recipientId: messages.recipientId,
            content: messages.content,
            messageType: messages.messageType,
            isRead: messages.isRead,
            createdAt: messages.createdAt,
            senderName: users.firstName,
            senderAvatar: users.profileImageUrl
          })
          .from(messages)
          .leftJoin(users, eq(messages.senderId, users.id))
          .where(and(...whereConditions))
          .limit(limit)
          .offset(offset);

          const chatHistory = await query;
          socket.emit('chat_history', chatHistory);
        } catch (error) {
          console.error('Get chat history error:', error);
          socket.emit('chat_error', { message: 'Failed to load chat history' });
        }
      });

      socket.on('disconnect', () => {
        if (socket.userId) {
          this.userSockets.delete(socket.userId);
          console.log(`User ${socket.userId} disconnected`);
        }
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  private async getUserName(userId: string): Promise<string> {
    try {
      const user = await db.select({
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username
      }).from(users).where(eq(users.id, userId)).limit(1);
      
      if (user.length === 0) return 'Unknown User';
      
      const u = user[0];
      return u.firstName && u.lastName 
        ? `${u.firstName} ${u.lastName}`
        : u.username || 'Unknown User';
    } catch (error) {
      return 'Unknown User';
    }
  }

  private async getUserAvatar(userId: string): Promise<string | null> {
    try {
      const user = await db.select({
        profileImageUrl: users.profileImageUrl
      }).from(users).where(eq(users.id, userId)).limit(1);
      
      return user.length > 0 ? user[0].profileImageUrl : null;
    } catch (error) {
      return null;
    }
  }

  public sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
    }
  }

  public sendToAdmins(event: string, data: any) {
    this.io.to('admin_room').emit(event, data);
  }

  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }
}

declare module 'socket.io' {
  interface Socket {
    userId?: string;
  }
}
