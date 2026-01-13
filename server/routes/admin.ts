import { type Express } from "express";
import { storage } from '../storage';
import { requireAdmin } from '../middleware/auth';
import { z } from 'zod';

const updateUserSchema = z.object({
  role: z.enum(['user', 'admin', 'moderator']).optional(),
  username: z.string().min(1).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional()
});

const bulkUserActionSchema = z.object({
  userIds: z.array(z.string()),
  action: z.enum(['activate', 'deactivate', 'delete', 'promote', 'demote']),
  reason: z.string().min(1)
});

const contentModerationSchema = z.object({
  action: z.enum(['approve', 'reject', 'flag']),
  reason: z.string().min(1).optional(),
  itemIds: z.array(z.number())
});

export function registerAdminRoutes(app: Express) {
  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const role = req.query.role as string;
      const status = req.query.status as string;

      const users = await storage.getAllUsersWithActivity();
      
      let filteredUsers = users;
      
      if (search) {
        filteredUsers = users.filter(user => 
          user.email?.toLowerCase().includes(search.toLowerCase()) ||
          user.username?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      if (role) {
        filteredUsers = filteredUsers.filter(user => user.role === role);
      }
      
      if (status) {
        const isActive = status === 'active';
        filteredUsers = filteredUsers.filter(user => user.isActive === isActive);
      }
      
      const offset = (page - 1) * limit;
      const paginatedUsers = filteredUsers.slice(offset, offset + limit);
      
      const usersWithRisk = await Promise.all(
        paginatedUsers.map(async (user) => {
          const riskScore = await storage.analyzeUserRiskScore(user.id);
          const suspiciousActivities = await storage.detectSuspiciousActivity(user.id);
          
          return {
            ...user,
            riskScore,
            suspiciousActivities
          };
        })
      );

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_users_viewed',
        resource: 'user_management',
        details: { page, limit, total: filteredUsers.length },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'admin'
      });

      res.json({
        success: true,
        users: usersWithRisk,
        pagination: {
          page,
          limit,
          total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/users/:userId', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      const [user, auditLogs, riskScore, suspiciousActivities] = await Promise.all([
        storage.getUser(userId),
        storage.getAuditLogsByUser(userId, 100),
        storage.analyzeUserRiskScore(userId),
        storage.detectSuspiciousActivity(userId)
      ]);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userDetails = {
        ...user,
        riskScore,
        suspiciousActivities,
        recentActivity: auditLogs.slice(0, 20)
      };

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_user_viewed',
        resource: 'user',
        resourceId: userId,
        details: { viewedUser: userId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'admin'
      });

      res.json({ success: true, user: userDetails });
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ error: 'Failed to fetch user details' });
    }
  });

  app.put('/api/admin/users/:userId', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const updateData = updateUserSchema.parse(req.body);
      const adminUser = req.user as any;

      const existingUser = await storage.getUser(userId);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (userId === adminUser?.id && updateData.role && updateData.role !== 'admin') {
        return res.status(400).json({ error: 'Cannot change your own admin role' });
      }

      const updatedUser = await storage.updateUser(userId, updateData);

      await storage.createAuditLog({
        userId: adminUser?.id || 'admin_user',
        action: 'admin_user_updated',
        resource: 'user',
        resourceId: userId,
        details: { 
          updatedFields: Object.keys(updateData),
          previousRole: existingUser.role,
          newRole: updateData.role 
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'warning',
        category: 'admin'
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  app.post('/api/admin/users/bulk', requireAdmin, async (req, res) => {
    try {
      const { userIds, action, reason } = bulkUserActionSchema.parse(req.body);
      const adminUser = req.user as any;
      
      const results = [];
      
      for (const userId of userIds) {
        try {
          let result;
          
          switch (action) {
            case 'activate':
              result = await storage.updateUser(userId, { isActive: true });
              break;
            case 'deactivate':
              result = await storage.updateUser(userId, { isActive: false });
              break;
            case 'delete':
              await storage.deleteUser(userId);
              result = { id: userId, deleted: true };
              break;
            case 'promote':
              result = await storage.updateUser(userId, { role: 'moderator' });
              break;
            case 'demote':
              result = await storage.updateUser(userId, { role: 'user' });
              break;
          }
          
          results.push({ userId, success: true, result });
        } catch (error) {
          results.push({ userId, success: false, error: (error as Error).message });
        }
      }

      await storage.createAuditLog({
        userId: adminUser?.id || 'admin_user',
        action: `admin_bulk_${action}`,
        resource: 'user_management',
        details: { 
          action,
          reason,
          userIds,
          results: results.map(r => ({ userId: r.userId, success: r.success }))
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'warning',
        category: 'admin'
      });

      res.json({ success: true, results });
    } catch (error) {
      console.error('Error in bulk user operation:', error);
      res.status(500).json({ error: 'Failed to perform bulk operation' });
    }
  });

  app.get('/api/admin/moderation/queue', requireAdmin, async (req, res) => {
    try {
      const type = req.query.type as string;
      const status = req.query.status as string;
      
      const moderationQueue = await storage.getContentModerationQueue();
      
      let filteredQueue = moderationQueue;
      
      if (type && type !== 'all') {
        filteredQueue = moderationQueue.filter(item => item.type === type);
      }
      
      if (status && status !== 'all') {
        filteredQueue = filteredQueue.filter(item => {
          if (status === 'pending') return !item.isModerated;
          if (status === 'flagged') return item.isFlagged;
          return true;
        });
      }

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_moderation_queue_viewed',
        resource: 'content_moderation',
        details: { type, status, count: filteredQueue.length },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'admin'
      });

      res.json({ success: true, queue: filteredQueue });
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      res.status(500).json({ error: 'Failed to fetch moderation queue' });
    }
  });

  app.post('/api/admin/moderation/action', requireAdmin, async (req, res) => {
    try {
      const { action, reason, itemIds } = contentModerationSchema.parse(req.body);
      const adminUser = req.user as any;
      
      const results = [];
      
      for (const itemId of itemIds) {
        try {
          let result;
          
          switch (action) {
            case 'approve':
              result = await storage.approveContent(itemId);
              break;
            case 'reject':
              result = await storage.rejectContent(itemId, reason || 'Rejected by admin');
              break;
            case 'flag':
              result = await storage.flagContent(itemId, reason || 'Flagged for review');
              break;
          }
          
          results.push({ itemId, success: true, result });
        } catch (error) {
          results.push({ itemId, success: false, error: (error as Error).message });
        }
      }

      await storage.createAuditLog({
        userId: adminUser?.id || 'admin_user',
        action: `admin_content_${action}`,
        resource: 'content_moderation',
        details: { 
          action,
          reason,
          itemIds,
          results: results.map(r => ({ itemId: r.itemId, success: r.success }))
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'admin'
      });

      res.json({ success: true, results });
    } catch (error) {
      console.error('Error moderating content:', error);
      res.status(500).json({ error: 'Failed to moderate content' });
    }
  });

  app.get('/api/admin/comments', requireAdmin, async (req, res) => {
    try {
      const { page = '1', limit = '20', status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const comments = await storage.getAllCommentsWithDetails(
        parseInt(page as string), 
        parseInt(limit as string),
        status as string,
        search as string,
        sortBy as string,
        sortOrder as string
      );

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_comments_viewed',
        resource: 'comment_management',
        details: { page, limit, status, search, count: comments.length },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'admin'
      });

      res.json({ success: true, comments });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  app.put('/api/admin/comments/:commentId', requireAdmin, async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const { content } = req.body;
      const adminUser = req.user as any;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Content is required' });
      }

      const originalComment = await storage.getComment(commentId);
      if (!originalComment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      const editedComment = await storage.editComment(commentId, content);

      await storage.createAuditLog({
        userId: adminUser?.id || 'admin_user',
        action: 'admin_comment_edited',
        resource: 'comment',
        resourceId: commentId.toString(),
        details: { 
          originalContent: originalComment.content,
          newContent: content,
          authorId: originalComment.authorId
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'warning',
        category: 'admin'
      });

      res.json({ success: true, comment: editedComment });
    } catch (error) {
      console.error('Error editing comment:', error);
      res.status(500).json({ error: 'Failed to edit comment' });
    }
  });

  app.delete('/api/admin/comments/:commentId', requireAdmin, async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const adminUser = req.user as any;

      const comment = await storage.getComment(commentId);
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      await storage.deleteComment(commentId);

      await storage.createAuditLog({
        userId: adminUser?.id || 'admin_user',
        action: 'admin_comment_deleted',
        resource: 'comment',
        resourceId: commentId.toString(),
        details: { 
          deletedContent: comment.content,
          authorId: comment.authorId,
          reason: 'Admin deletion'
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'warning',
        category: 'admin'
      });

      res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  });

  app.post('/api/admin/comments/:commentId/block', requireAdmin, async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const { reason } = req.body;
      const adminUser = req.user as any;

      const originalComment = await storage.getComment(commentId);
      if (!originalComment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      const blockedComment = await storage.blockComment(commentId);

      await storage.createAuditLog({
        userId: adminUser?.id || 'admin_user',
        action: 'admin_comment_blocked',
        resource: 'comment',
        resourceId: commentId.toString(),
        details: { 
          originalContent: originalComment.content,
          reason: reason || 'Blocked by admin',
          authorId: originalComment.authorId
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'warning',
        category: 'admin'
      });

      res.json({ success: true, comment: blockedComment });
    } catch (error) {
      console.error('Error blocking comment:', error);
      res.status(500).json({ error: 'Failed to block comment' });
    }
  });

  app.post('/api/admin/comments/bulk', requireAdmin, async (req, res) => {
    try {
      const { commentIds, action, reason } = req.body;
      const adminUser = req.user as any;

      if (!Array.isArray(commentIds) || commentIds.length === 0) {
        return res.status(400).json({ error: 'Comment IDs are required' });
      }

      const results = [];

      for (const commentId of commentIds) {
        try {
          let result;
          const comment = await storage.getComment(commentId);
          
          if (!comment) {
            results.push({ commentId, success: false, error: 'Comment not found' });
            continue;
          }

          switch (action) {
            case 'delete':
              await storage.deleteComment(commentId);
              result = { deleted: true };
              break;
            case 'block':
              result = await storage.blockComment(commentId);
              break;
            case 'approve':
              result = await storage.updateComment(commentId, { approved: true });
              break;
            default:
              throw new Error(`Unknown action: ${action}`);
          }

          results.push({ commentId, success: true, result });
        } catch (error) {
          results.push({ commentId, success: false, error: (error as Error).message });
        }
      }

      await storage.createAuditLog({
        userId: adminUser?.id || 'admin_user',
        action: `admin_bulk_comment_${action}`,
        resource: 'comment_management',
        details: { 
          action,
          reason: reason || 'Bulk admin action',
          commentIds,
          results: results.map(r => ({ commentId: r.commentId, success: r.success }))
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'warning',
        category: 'admin'
      });

      res.json({ success: true, results });
    } catch (error) {
      console.error('Error in bulk comment operation:', error);
      res.status(500).json({ error: 'Failed to perform bulk operation' });
    }
  });

  app.get('/api/admin/system/metrics', requireAdmin, async (req, res) => {
    try {
      const metrics = await storage.getSystemPerformanceMetrics();
      
      const realtimeMetrics = {
        ...metrics,
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        cpuUsage: process.cpuUsage(),
        activeSessions: await storage.getActiveSessionsCount(),
        databaseConnections: await storage.getDatabaseConnectionCount()
      };

      res.json({ success: true, metrics: realtimeMetrics });
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      res.status(500).json({ error: 'Failed to fetch system metrics' });
    }
  });

  app.get('/api/admin/security/reports', requireAdmin, async (req, res) => {
    try {
      const timeframe = req.query.timeframe as string || '24h';
      const severity = req.query.severity as string;
      
      const reports = await storage.getSecurityReports();
      
      const now = new Date();
      const hours = timeframe === '1h' ? 1 : timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 24;
      const since = new Date(now.getTime() - hours * 60 * 60 * 1000);
      
      let filteredReports = reports.filter(report => 
        new Date(report.timestamp) > since
      );
      
      if (severity) {
        filteredReports = filteredReports.filter(report => report.severity === severity);
      }

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_security_reports_viewed',
        resource: 'security',
        details: { timeframe, severity, count: filteredReports.length },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'admin'
      });

      res.json({ success: true, reports: filteredReports });
    } catch (error) {
      console.error('Error fetching security reports:', error);
      res.status(500).json({ error: 'Failed to fetch security reports' });
    }
  });

  app.post('/api/admin/backup/create', requireAdmin, async (req, res) => {
    try {
      const { type, description } = req.body;
      const adminUser = req.user as any;
      
      const backupId = await storage.createSystemBackup();

      await storage.createAuditLog({
        userId: adminUser?.id || 'admin_user',
        action: 'admin_backup_created',
        resource: 'system_backup',
        resourceId: backupId,
        details: { type, description, backupId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'admin'
      });

      res.json({ success: true, backupId, message: 'Backup created successfully' });
    } catch (error) {
      console.error('Error creating backup:', error);
      res.status(500).json({ error: 'Failed to create backup' });
    }
  });

  app.get('/api/admin/backup/history', requireAdmin, async (req, res) => {
    try {
      const backups = await storage.getBackupHistory();
      res.json({ success: true, backups });
    } catch (error) {
      console.error('Error fetching backup history:', error);
      res.status(500).json({ error: 'Failed to fetch backup history' });
    }
  });
}
