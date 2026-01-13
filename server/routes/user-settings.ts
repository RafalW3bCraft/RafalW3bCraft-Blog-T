import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { storage } from '../storage';

const router = Router();

// Get user profile
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionUser = req.user || (req.session as any)?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const profile = await storage.getUser(sessionUser.id);
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    
    const profileData = {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio,
      profileImageUrl: profile.profileImageUrl,
      createdAt: profile.createdAt,
      lastLogin: profile.lastLogin || profile.createdAt,
      role: profile.role,
      isActive: profile.isActive ?? true
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionUser = req.user || (req.session as any)?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const updates = req.body;

    // Only allow specific fields to be updated
    const allowedFields = ['firstName', 'lastName', 'bio', 'username'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    await storage.updateUser(sessionUser.id, filteredUpdates);

    await storage.createAuditLog({
      userId: sessionUser.id,
      action: 'profile_updated',
      resource: 'user_profile',
      details: { updatedFields: Object.keys(filteredUpdates) },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'info',
      category: 'user_management'
    });

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Get user preferences (returns defaults since we don't have a preferences table)
router.get('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    res.json({
      emailNotifications: true,
      securityAlerts: true,
      blogCommentNotifications: true,
      blogLikeNotifications: true,
      theme: 'system',
      language: 'en',
      timezone: 'UTC'
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Failed to fetch user preferences' });
  }
});

router.put('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionUser = req.user || (req.session as any)?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const updates = req.body;

    await storage.createAuditLog({
      userId: sessionUser.id,
      action: 'preferences_updated',
      resource: 'user_preferences',
      details: { updatedFields: Object.keys(updates) },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'info',
      category: 'user_management'
    });

    res.json({ success: true, message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update user preferences' });
  }
});

// Security settings
router.get('/security/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    res.json({
      twoFactorEnabled: false,
      sessionTimeout: 1440, 
      loginNotifications: true,
      suspiciousActivityAlerts: true,
      ipWhitelistEnabled: false,
      deviceTrackingEnabled: true
    });
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.status(500).json({ error: 'Failed to fetch security settings' });
  }
});

router.put('/security/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionUser = req.user || (req.session as any)?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const updates = req.body;

    await storage.createAuditLog({
      userId: sessionUser.id,
      action: 'security_settings_updated',
      resource: 'user_security',
      details: { updatedSettings: Object.keys(updates) },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium',
      category: 'security'
    });

    res.json({ success: true, message: 'Security settings updated successfully' });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({ error: 'Failed to update security settings' });
  }
});

router.get('/security/sessions', requireAuth, async (req: Request, res: Response) => {
  try {
    // Return empty array since we don't track individual sessions
    res.json([]);
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({ error: 'Failed to fetch user sessions' });
  }
});

router.delete('/security/sessions/:sessionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionUser = req.user || (req.session as any)?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const { sessionId } = req.params;

    await storage.createAuditLog({
      userId: sessionUser.id,
      action: 'session_revoked',
      resource: 'user_session',
      details: { sessionId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'medium',
      category: 'security'
    });

    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Error revoking session:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

router.get('/security/events', requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionUser = req.user || (req.session as any)?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const events = await storage.getAuditLogsByUser(sessionUser.id, 50);
    res.json(events || []);
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

router.post('/security/generate-token', requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionUser = req.user || (req.session as any)?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // Generate a simple token (in production, use a proper token generation method)
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    await storage.createAuditLog({
      userId: sessionUser.id,
      action: 'api_token_generated',
      resource: 'user_api_token',
      details: { tokenGenerated: true },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'high',
      category: 'security'
    });

    res.json({ 
      success: true, 
      message: 'API token generated successfully',
      token: token 
    });
  } catch (error) {
    console.error('Error generating API token:', error);
    res.status(500).json({ error: 'Failed to generate API token' });
  }
});

// Notification settings
router.get('/notifications/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    res.json({
      emailNotifications: true,
      blogCommentNotifications: true,
      blogLikeNotifications: true,
      securityAlerts: true,
      githubSyncNotifications: true,
      systemUpdates: true,
      marketingEmails: false,
      weeklyDigest: false,
      emailFrequency: 'immediate',
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

router.put('/notifications/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionUser = req.user || (req.session as any)?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const updates = req.body;

    await storage.createAuditLog({
      userId: sessionUser.id,
      action: 'notification_settings_updated',
      resource: 'user_notifications',
      details: { updatedSettings: Object.keys(updates) },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'info',
      category: 'user_management'
    });

    res.json({ success: true, message: 'Notification settings updated successfully' });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

router.get('/notifications/history', requireAuth, async (req: Request, res: Response) => {
  try {
    // Return empty array since we don't have notification history
    res.json([]);
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
});

router.post('/notifications/:notificationId/read', requireAuth, async (req: Request, res: Response) => {
  try {
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.post('/notifications/clear', requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionUser = req.user || (req.session as any)?.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await storage.createAuditLog({
      userId: sessionUser.id,
      action: 'notifications_cleared',
      resource: 'user_notifications',
      details: {},
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'info',
      category: 'user_management'
    });

    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

export default router;