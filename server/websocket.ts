import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { db } from './db';
import { messages, users, insertMessageSchema } from '@shared/schema';
import { moderationService } from './moderation';
import { eq, or, and, isNull, inArray } from 'drizzle-orm';

export class WebSocketService {
  private io: SocketServer;
  private userSockets = new Map<string, string>(); // userId -> socketId

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
      // Client connected - tracked via monitoring

      // Handle user authentication and registration
      socket.on('authenticate', async (data: { userId: string, token?: string }) => {
        try {
          // Verify user exists in database
          const user = await db.select().from(users).where(eq(users.id, data.userId)).limit(1);
          if (user.length === 0) {
            socket.emit('auth_error', { message: 'User not found' });
            return;
          }

          // Store user socket mapping
          this.userSockets.set(data.userId, socket.id);
          socket.userId = data.userId;
          
          // Join user to their personal room
          socket.join(`user_${data.userId}`);
          
          // If admin, join admin room
          if (user[0].role === 'admin') {
            socket.join('admin_room');
          }

          socket.emit('authenticated', { 
            success: true, 
            userId: data.userId,
            role: user[0].role 
          });

          // User authenticated successfully
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication failed' });
        }
      });

      // Handle sending messages
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

          // Moderate content before sending
          const moderationResult = await moderationService.moderateContent(
            data.content,
            'message',
            0, // Will be updated after insert
            socket.userId,
            true // Use AI moderation
          );

          if (!moderationResult.isAllowed) {
            socket.emit('message_blocked', {
              reason: moderationResult.reason,
              action: moderationResult.action
            });
            return;
          }

          // Insert message to database
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

          // Send to recipient or room
          const messageWithSender = {
            ...insertedMessage,
            senderName: await this.getUserName(socket.userId),
            senderAvatar: await this.getUserAvatar(socket.userId)
          };

          if (data.recipientId) {
            // Direct message
            this.io.to(`user_${data.recipientId}`).emit('new_message', messageWithSender);
            // Send confirmation to sender
            socket.emit('message_sent', messageWithSender);
          } else if (data.roomId) {
            // Room message
            this.io.to(data.roomId).emit('new_message', messageWithSender);
          } else {
            // Message to admin (default behavior)
            this.io.to('admin_room').emit('new_message', messageWithSender);
            socket.emit('message_sent', messageWithSender);
          }

          console.log(`Message sent from ${socket.userId} to ${data.recipientId || data.roomId || 'admin'}`);
        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('message_error', { message: 'Failed to send message' });
        }
      });

      // Handle marking messages as read
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

      // Handle joining rooms
      socket.on('join_room', (data: { roomId: string }) => {
        socket.join(data.roomId);
        socket.emit('joined_room', { roomId: data.roomId });
        console.log(`User ${socket.userId} joined room ${data.roomId}`);
      });

      // Handle leaving rooms
      socket.on('leave_room', (data: { roomId: string }) => {
        socket.leave(data.roomId);
        socket.emit('left_room', { roomId: data.roomId });
        console.log(`User ${socket.userId} left room ${data.roomId}`);
      });

      // Handle getting chat history
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
            // Direct messages between two users
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
            // Room messages
            whereConditions = [eq(messages.roomId, data.roomId)];
          } else {
            // Admin messages
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

      // Handle disconnect
      socket.on('disconnect', () => {
        if (socket.userId) {
          this.userSockets.delete(socket.userId);
          console.log(`User ${socket.userId} disconnected`);
        }
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Helper methods
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

  // Public methods for sending notifications
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

// Add userId property to Socket type
declare module 'socket.io' {
  interface Socket {
    userId?: string;
  }
}