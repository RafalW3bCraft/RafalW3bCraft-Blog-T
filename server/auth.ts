import type { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import { configureOAuth } from './oauth-config-final';
import { validateAdminCredentials } from './admin-credentials';
import { storage } from './storage';
import { adminLoginLimiter, oauthLimiter } from '../lib/security';

interface AuthenticatedRequest extends Request {
  user?: any;
  session: any;
}

// Validate session secret in production
const sessionSecret = process.env.SESSION_SECRET;
if (process.env.NODE_ENV === 'production' && !sessionSecret) {
  throw new Error('SESSION_SECRET must be set in production environment');
}

const sessionConfig = {
  secret: sessionSecret || 'fallback-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax' as const
  },
  name: 'rafalw3bcraft.sid'
};

export function setupAuth(app: Express) {
  app.use(session(sessionConfig));
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  configureOAuth();
  
  app.post('/api/auth/admin-login', adminLoginLimiter, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username and password are required' 
        });
      }
      
      const isValid = validateAdminCredentials(username, password);
      
      if (!isValid) {
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
      
      let adminUser;
      try {
        adminUser = await storage.getUser('admin_user');
        if (!adminUser) {
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
      
      (req as any).session.user = adminUser;
      (req as any).session.isAdmin = true;
      
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

export function getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  req.user = req.user || req.session?.user || null;
  next();
}

export function isAuthenticated(req: AuthenticatedRequest): boolean {
  return req.isAuthenticated() || !!req.session?.user;
}

export function isAdmin(req: AuthenticatedRequest): boolean {
  const user = req.user || req.session?.user;
  const isAdminSession = req.session?.isAdmin;
  
  return user?.id === 'admin_user' && isAdminSession === true;
}
