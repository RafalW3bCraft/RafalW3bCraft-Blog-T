import { Request } from 'express';
import { storage } from '../storage';
import { InsertAuditLog } from '@shared/schema';

/**
 * Helper function to log audit events with common request context
 * Reduces boilerplate for audit logging across routes
 */
export async function logAuditEvent(
  req: Request,
  action: string,
  resource: string,
  details?: Record<string, any>,
  severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
): Promise<void> {
  try {
    const user = (req.user as any) || (req.session as any)?.user;
    
    const auditData: InsertAuditLog = {
      userId: user?.id || 'unknown',
      action,
      resource,
      details: details || {},
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.path,
      severity,
    };

    await storage.createAuditLog(auditData);
  } catch (error) {
    console.error(`Failed to log audit event [${action}]:`, error);
  }
}

/**
 * Helper function to log security-related events
 */
export async function logSecurityEvent(
  req: Request,
  action: string,
  details?: Record<string, any>
): Promise<void> {
  return logAuditEvent(req, action, 'security', details, 'warning');
}

/**
 * Helper function to log data access events
 */
export async function logDataAccessEvent(
  req: Request,
  resource: string,
  action: string,
  details?: Record<string, any>
): Promise<void> {
  return logAuditEvent(req, action, resource, details, 'info');
}

/**
 * Helper function to log admin events
 */
export async function logAdminEvent(
  req: Request,
  action: string,
  details?: Record<string, any>
): Promise<void> {
  return logAuditEvent(req, action, 'admin', details, 'info');
}
