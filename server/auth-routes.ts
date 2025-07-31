import { Router } from 'express';
import passport from 'passport';
import { storage } from './storage';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth routes - more lenient for development
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // increased limit for better UX
  message: 'Too many authentication attempts, try again later',
  skip: (req) => process.env.NODE_ENV === 'development' // Skip in development
});

// Apply rate limiting to auth routes
router.use(authLimiter);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=auth_failed' }),
  async (req, res) => {
    try {
      // Log successful login
      await storage.createAuditLog({
        userId: (req.user as any).id,
        action: 'oauth_login_success',
        resource: 'authentication',
        details: { provider: 'google' },
        severity: 'info'
      });
      
      // Redirect to dashboard after successful login
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect('/login?error=callback_failed');
    }
  }
);

// GitHub OAuth routes
router.get('/github', passport.authenticate('github', { 
  scope: ['user:email'] 
}));

router.get('/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login?error=auth_failed' }),
  async (req, res) => {
    try {
      // Log successful login
      await storage.createAuditLog({
        userId: (req.user as any).id,
        action: 'oauth_login_success',
        resource: 'authentication',
        details: { provider: 'github' },
        severity: 'info'
      });
      
      // Redirect to dashboard after successful login
      res.redirect('/dashboard');
    } catch (error) {
      console.error('GitHub auth callback error:', error);
      res.redirect('/login?error=callback_failed');
    }
  }
);

// Get current user - Enhanced with better error handling
router.get('/user', async (req, res) => {
  const user = req.user || (req.session as any)?.user;
  const isAdmin = (req.session as any)?.isAdmin;
  const isAuthenticated = req.isAuthenticated() || !!user || !!isAdmin;
  
  console.log('Auth check - User:', user?.email || user?.id, 'IsAdmin:', isAdmin, 'IsAuthenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    // Handle admin session user first
    if (isAdmin && user) {
      // Validate admin user exists in database
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
      
      // Fallback for admin session
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
    
    // Handle OAuth user - Enhanced validation
    if (req.user) {
      const userId = (req.user as any).id;
      const dbUser = await storage.getUser(userId);
      
      if (!dbUser) {
        console.warn(`Database user not found for OAuth user: ${userId}`);
        // Try to create user if not exists (recovery mechanism)
        return res.status(404).json({ message: 'User profile not found' });
      }
      
      // Update last login time
      try {
        await storage.upsertUser({
          ...dbUser,
          lastLogin: new Date()
        });
      } catch (updateError) {
        console.warn('Failed to update last login:', updateError);
      }
      
      const userRole = dbUser.role || 'user';
      console.log(`Auth check - User: ${dbUser.email} IsAdmin: false Role: ${userRole} IsAuthenticated: ${req.isAuthenticated()}`);
      
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

    // Handle session user without OAuth (admin sessions)
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

    // If we reach here, there's an authentication state mismatch
    console.warn('Authentication state mismatch detected - authenticated but no user data');
    return res.status(401).json({ message: 'Authentication state invalid' });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error during user fetch' });
  }
});

// Logout route - Handle both GET and POST for compatibility
const handleLogout = async (req: any, res: any) => {
  // Log for both OAuth and admin users
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
  
  // Clear admin session flags
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
      res.clearCookie('rafalw3bcraft.sid'); // Clear custom session cookie
      res.json({ success: true, message: 'Logged out successfully', redirect: '/' });
    });
  });
};

router.post('/logout', handleLogout);
router.get('/logout', handleLogout); // Add GET support for logout as well

// OAuth user route - separate endpoint for OAuth validation
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