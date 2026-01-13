import { storage } from '../storage';

/**
 * Middleware to verify user authentication
 * Checks for authenticated user via Passport, session, or custom session properties
 */
export function requireAuth(req: any, res: any, next: any) {
  const user = req.user || req.session?.user;
  const isAdmin = req.session?.isAdmin;
  const isAuthenticated = req.isAuthenticated() || !!user || !!isAdmin;

  if (isAuthenticated) {
    return next();
  }

  // For API routes, return JSON error
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // For web routes, redirect to login
  res.redirect('/login');
}

/**
 * Middleware to verify admin access
 * Ensures user is authenticated and has admin privileges
 */
export function requireAdmin(req: any, res: any, next: any) {
  const user = req.user || req.session?.user;
  const isAdminSession = req.session?.isAdmin;
  const isAuthenticated = req.isAuthenticated() || !!user || !!isAdminSession;

  if (!isAuthenticated) {
    console.warn(`Admin access attempt without authentication - IP: ${req.ip}`);
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    return res.redirect('/login');
  }

  // Check for admin credentials
  const isAuthorizedAdmin = user?.id === 'admin_user' && isAdminSession === true;

  if (!isAuthorizedAdmin) {
    console.warn(`Unauthorized admin access attempt - User: ${user?.email || user?.id}, Role: ${user?.role}, IP: ${req.ip}, Path: ${req.path}`);

    // Log security event
    if (typeof storage !== 'undefined') {
      storage.createAuditLog({
        userId: user?.id || 'unknown',
        action: 'admin_access_denied',
        resource: 'admin',
        details: {
          userEmail: user?.email || 'unknown',
          userRole: user?.role || 'none',
          path: req.path,
          reason: 'only_admin_credentials_allowed',
          isAdminSession: isAdminSession,
          userId: user?.id
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'warning'
      }).catch(console.error);
    }

    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    return res.redirect('/dashboard');
  }

  return next();
}
