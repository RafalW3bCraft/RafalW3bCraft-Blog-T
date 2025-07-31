import type { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import { configureOAuth } from './oauth-config-final';
import { validateAdminCredentials } from './admin-credentials';
import { storage } from './storage';

// Enhanced request interface
interface AuthenticatedRequest extends Request {
  user?: any;
  session: any;
}

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  name: 'rafalw3bcraft.sid'
};

// Rate limiting for admin login
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many admin login attempts. Please try again later.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});

// Rate limiting for OAuth attempts
export const oauthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    error: 'Too many OAuth attempts. Please try again later.',
    retryAfter: 15 * 60 * 1000
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Setup authentication system
export function setupAuth(app: Express) {
  // Configure session middleware
  app.use(session(sessionConfig));
  
  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure OAuth strategies - SECURE VERSION  
  configureOAuth();
  
  // Apply rate limiting to OAuth routes (handled by auth-routes.ts)
  
  // Admin login route (separate from OAuth)  
  app.post('/api/auth/admin-login', adminLoginLimiter, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username and password are required' 
        });
      }
      
      // Validate admin credentials
      const isValid = validateAdminCredentials(username, password);
      
      if (!isValid) {
        // Log failed admin login attempt
        await storage.logFailedLoginAttempt({
          email: username,
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent'),
          provider: 'admin'
        });
        
        await storage.createAuditLog({
          userId: null,
          action: 'admin_login_failed',
          resource: 'admin',
          details: { username, ip: req.ip },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          severity: 'warning'
        });
        
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid admin credentials' 
        });
      }
      
      // Create or get admin user record
      let adminUser;
      try {
        adminUser = await storage.getUser('admin_user');
        if (!adminUser) {
          // Create admin user record in database
          adminUser = await storage.upsertUser({
            id: 'admin_user',
            username,
            email: null,
            firstName: 'System',
            lastName: 'Administrator',
            role: 'admin',
            provider: 'admin',
            providerId: 'admin_user',
            isActive: true,
            lastLogin: new Date()
          });
        } else {
          // Update last login
          adminUser = await storage.upsertUser({
            ...adminUser,
            lastLogin: new Date()
          });
        }
      } catch (error) {
        console.error('Error creating/updating admin user:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create admin session' 
        });
      }
      
      // Store in session
      (req as any).session.user = adminUser;
      (req as any).session.isAdmin = true;
      
      // Log successful admin login
      await storage.createAuditLog({
        userId: adminUser.id,
        action: 'admin_login_success',
        resource: 'admin',
        details: { username, ip: req.ip },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });
      
      res.json({ 
        success: true, 
        redirect: '/admin',
        user: adminUser
      });
      
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  });
  
  // Logout route
  app.post('/auth/logout', (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || req.session?.user?.id;
    
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      
      req.session.destroy((sessionErr: any) => {
        if (sessionErr) {
          console.error('Session destruction error:', sessionErr);
        }
        
        // Log logout event
        if (userId) {
          storage.createAuditLog({
            userId,
            action: 'logout',
            resource: 'user',
            details: { ip: req.ip },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            severity: 'info'
          }).catch(console.error);
        }
        
        res.clearCookie('rafalw3bcraft.sid');
        res.json({ success: true, redirect: '/' });
      });
    });
  });
}

// Middleware to check if user is authenticated
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = req.user || req.session?.user;
  const isAdmin = req.session?.isAdmin;
  
  if (req.isAuthenticated() || user || isAdmin) {
    return next();
  }
  
  // For API routes, return JSON error
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ 
      error: 'Authentication required',
      redirectTo: '/login'
    });
  }
  
  // For web routes, redirect to login
  res.redirect('/login');
}

// Middleware to check if user is admin - SECURITY: Only ADMIN_USERNAME/ADMIN_PASSWORD grant access
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = req.user || req.session?.user;
  const isAdminSession = req.session?.isAdmin;
  
  // SECURITY: All hardcoded admin emails removed - only ADMIN_USERNAME/ADMIN_PASSWORD grant access
  
  if (!user) {
    console.warn(`Admin access attempt without authentication - IP: ${req.ip}, Path: ${req.path}`);
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        redirectTo: '/login'
      });
    }
    return res.redirect('/login');
  }
  
  // SECURITY: Only admin_user (authenticated via ADMIN_USERNAME/ADMIN_PASSWORD) can access admin functions
  const isAuthorizedAdmin = user?.id === 'admin_user' && isAdminSession === true;
  
  if (!isAuthorizedAdmin) {
    // Log unauthorized admin access attempt with enhanced details
    console.warn(`SECURITY ALERT: Unauthorized admin access attempt - User: ${user?.email || user?.id}, Role: ${user?.role}, IP: ${req.ip}, Path: ${req.path}`);
    
    storage.createAuditLog({
      userId: user?.id || 'unknown',
      action: 'admin_access_denied',
      resource: 'admin',
      details: { 
        userEmail: user?.email || 'unknown',
        userRole: user?.role || 'none', 
        path: req.path,
        reason: 'only_admin_credentials_allowed',
        userType: user?.provider || 'unknown',
        securityNote: 'only_ADMIN_USERNAME_ADMIN_PASSWORD_allowed'
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      severity: 'warning'
    }).catch(console.error);
    
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ 
        error: 'Admin privileges required',
        redirectTo: '/dashboard'
      });
    }
    return res.redirect('/dashboard');
  }
  
  // Log successful admin access
  console.log(`Admin access granted - User: ${user.email}, Path: ${req.path}`);
  return next();
}

// Middleware to get current user info
export function getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  req.user = req.user || req.session?.user || null;
  next();
}

// Utility function to check if user is authenticated
export function isAuthenticated(req: AuthenticatedRequest): boolean {
  return req.isAuthenticated() || !!req.session?.user;
}

// Utility function to check if user is admin - SECURITY: Only ADMIN_USERNAME/ADMIN_PASSWORD grant access
export function isAdmin(req: AuthenticatedRequest): boolean {
  const user = req.user || req.session?.user;
  const isAdminSession = req.session?.isAdmin;
  
  // SECURITY: Only admin_user (authenticated via ADMIN_USERNAME/ADMIN_PASSWORD) can access admin functions
  return user?.id === 'admin_user' && isAdminSession === true;
}