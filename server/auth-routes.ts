import { Router } from 'express';
import passport from 'passport';
import { storage } from './storage';
import { generalAuthLimiter } from '../lib/security';

const router = Router();

router.use(generalAuthLimiter);

router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=auth_failed' }),
  async (req, res) => {
    try {
      await storage.createAuditLog({
        userId: (req.user as any).id,
        action: 'oauth_login_success',
        resource: 'authentication',
        details: { provider: 'google' },
        severity: 'info'
      });
      
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect('/login?error=callback_failed');
    }
  }
);

router.get('/github', passport.authenticate('github', { 
  scope: ['user:email'] 
}));

router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login?error=auth_failed' }),
  async (req, res) => {
    try {
      await storage.createAuditLog({
        userId: (req.user as any).id,
        action: 'oauth_login_success',
        resource: 'authentication',
        details: { provider: 'github' },
        severity: 'info'
      });
      
      res.redirect('/dashboard');
    } catch (error) {
      console.error('GitHub auth callback error:', error);
      res.redirect('/login?error=callback_failed');
    }
  }
);

router.get('/user', async (req, res) => {
  const user = req.user || (req.session as any)?.user;
  const isAdmin = (req.session as any)?.isAdmin;
  const isAuthenticated = req.isAuthenticated() || !!user || !!isAdmin;
  
  if (!isAuthenticated) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    if (isAdmin && user) {
      const dbUser = await storage.getUser(user.id);
      if (dbUser) {
        return res.json({
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          username: dbUser.username,
          profileImageUrl: dbUser.profileImageUrl,
          role: dbUser.role,
          provider: dbUser.provider,
          lastLogin: new Date().toISOString(),
          isAdmin: true
        });
      }
      
      return res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
        provider: user.provider,
        lastLogin: new Date().toISOString(),
        isAdmin: true
      });
    }
    
    if (req.user) {
      const userId = (req.user as any).id;
      const dbUser = await storage.getUser(userId);
      
      if (!dbUser) {
        console.warn(`Database user not found for OAuth user: ${userId}`);
        return res.status(404).json({ message: 'User profile not found' });
      }
      
      try {
        await storage.upsertUser({
          ...dbUser,
          lastLogin: new Date()
        });
      } catch (updateError) {
        console.warn('Failed to update last login:', updateError);
      }
      
      const userRole = dbUser.role || 'user';
      
      return res.json({
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        username: dbUser.username,
        profileImageUrl: dbUser.profileImageUrl,
        role: userRole,
        provider: dbUser.provider,
        lastLogin: new Date().toISOString(),
        isAdmin: false,
        authenticated: true
      });
    }

    if (user && !req.user) {
      return res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
        provider: user.provider,
        lastLogin: new Date().toISOString(),
        isAdmin: !!isAdmin
      });
    }

    console.warn('Authentication state mismatch detected - authenticated but no user data');
    return res.status(401).json({ message: 'Authentication state invalid' });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error during user fetch' });
  }
});

const handleLogout = async (req: any, res: any) => {
  const user = req.user || (req.session as any)?.user;
  if (user) {
    try {
      await storage.createAuditLog({
        userId: user.id,
        action: 'logout',
        resource: 'authentication',
        details: { provider: user.provider || 'admin' },
        severity: 'info'
      });
    } catch (error) {
      console.error('Error logging logout:', error);
    }
  }
  
  if ((req.session as any)?.isAdmin) {
    (req.session as any).isAdmin = false;
    (req.session as any).user = null;
  }
  
  req.logout((err: any) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ message: 'Session cleanup failed' });
      }
      res.clearCookie('connect.sid');
      res.clearCookie('rafalw3bcraft.sid');
      res.json({ success: true, message: 'Logged out successfully', redirect: '/' });
    });
  });
};

router.post('/logout', handleLogout);
router.get('/logout', handleLogout);

router.get('/oauth-user', async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: 'Not authenticated via OAuth' });
    }

    const userId = (req.user as any).id;
    const dbUser = await storage.getUser(userId);
    
    if (!dbUser) {
      console.warn(`OAuth user not found in database: ${userId}`);
      return res.status(404).json({ message: 'OAuth user profile not found' });
    }

    res.json({
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      username: dbUser.username,
      profileImageUrl: dbUser.profileImageUrl,
      role: dbUser.role,
      provider: dbUser.provider,
      isOAuthUser: true,
      authenticated: true,
      lastLogin: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error validating OAuth user:', error);
    res.status(500).json({ message: 'OAuth validation error' });
  }
});

export default router;
