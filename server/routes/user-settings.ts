import { Request, Response, Router } from 'express';
import { requireAuth } from '../routes';
import { storage } from '../storage';
// Import not needed as storage has createAuditLog method

const router = Router();

// User Profile Routes
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    // Get user profile with additional metadata
    const profile = await storage.getUserById(user.id);
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Get login statistics
    const loginStats = await storage.getUserLoginStats(user.id);
    
    const profileData = {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      displayName: profile.displayName,
      avatar: profile.avatar,
      bio: profile.bio,
      location: profile.location,
      website: profile.website,
      githubUrl: profile.githubUrl,
      twitterUrl: profile.twitterUrl,
      linkedinUrl: profile.linkedinUrl,
      createdAt: profile.createdAt,
      lastLogin: loginStats?.lastLogin || profile.createdAt,
      loginCount: loginStats?.loginCount || 1,
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
    const user = req.user!;
    const updates = req.body;

    // Validate updates
    const allowedFields = ['displayName', 'bio', 'location', 'website', 'twitterUrl', 'linkedinUrl'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Update user profile
    await storage.updateUser(user.id, filteredUpdates);

    // Create audit log
    await storage.createAuditLog({
      userId: user.id,
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

// User Preferences Routes
router.get('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    const preferences = await storage.getUserPreferences(user.id);
    
    res.json(preferences || {
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
    const user = req.user!;
    const updates = req.body;

    await storage.updateUserPreferences(user.id, updates);

    await storage.createAuditLog({
      userId: user.id,
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

// Security Settings Routes
router.get('/security/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    const securitySettings = await storage.getUserSecuritySettings(user.id);
    
    res.json(securitySettings || {
      twoFactorEnabled: false,
      sessionTimeout: 1440, // 24 hours in minutes
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
    const user = req.user!;
    const updates = req.body;

    await storage.updateUserSecuritySettings(user.id, updates);

    await storage.createAuditLog({
      userId: user.id,
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
    const user = req.user!;
    
    const sessions = await storage.getUserSessions(user.id);
    
    res.json(sessions || []);
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    res.status(500).json({ error: 'Failed to fetch user sessions' });
  }
});

router.delete('/security/sessions/:sessionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { sessionId } = req.params;

    await storage.revokeUserSession(user.id, sessionId);

    await storage.createAuditLog({
      userId: user.id,
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
    const user = req.user!;
    
    const events = await storage.getUserSecurityEvents(user.id);
    
    res.json(events || []);
  } catch (error) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

router.post('/security/generate-token', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    const token = await storage.generateUserApiToken(user.id);

    await storage.createAuditLog({
      userId: user.id,
      action: 'api_token_generated',
      resource: 'user_api_token',
      details: { tokenId: token.id },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'high',
      category: 'security'
    });

    res.json({ 
      success: true, 
      message: 'API token generated successfully',
      token: token.token 
    });
  } catch (error) {
    console.error('Error generating API token:', error);
    res.status(500).json({ error: 'Failed to generate API token' });
  }
});

// Notification Settings Routes
router.get('/notifications/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    
    const settings = await storage.getUserNotificationSettings(user.id);
    
    res.json(settings || {
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
    const user = req.user!;
    const updates = req.body;

    await storage.updateUserNotificationSettings(user.id, updates);

    await storage.createAuditLog({
      userId: user.id,
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
    const user = req.user!;
    
    const history = await storage.getUserNotificationHistory(user.id);
    
    res.json(history || []);
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
});

router.post('/notifications/:notificationId/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { notificationId } = req.params;

    await storage.markNotificationAsRead(user.id, notificationId);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.post('/notifications/clear', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user!;

    await storage.clearUserNotifications(user.id);

    await storage.createAuditLog({
      userId: user.id,
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