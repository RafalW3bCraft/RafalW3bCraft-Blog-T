import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

export interface AuditEvent {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  duration?: number;
  category?: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  riskScore?: number;
}


function calculateRiskScore(event: AuditEvent): number {
  let score = 0;

  
  const actionScores = {
    'login': 10,
    'logout': 5,
    'failed_login': 25,
    'password_change': 15,
    'admin_access': 30,
    'data_export': 20,
    'user_creation': 15,
    'user_deletion': 40,
    'system_config_change': 35,
    'security_audit': 10,
    'file_upload': 15,
    'database_query': 10
  };

  score += actionScores[event.action as keyof typeof actionScores] || 5;

  
  if (event.action.includes('admin') || event.endpoint?.includes('/admin')) {
    score += 20;
  }

  
  if (event.statusCode && event.statusCode >= 400) {
    score += 15;
  }

  
  if (event.severity === 'critical') {
    score += 30;
  } else if (event.severity === 'error') {
    score += 20;
  } else if (event.severity === 'warning') {
    score += 10;
  }

  
  return Math.min(score, 100);
}


function determineSeverity(event: AuditEvent): 'info' | 'warning' | 'error' | 'critical' {
  if (event.action === 'failed_login' && event.statusCode === 401) {
    return 'warning';
  }
  
  if (event.action.includes('delete') || event.action.includes('admin')) {
    return 'warning';
  }

  if (event.statusCode && event.statusCode >= 500) {
    return 'error';
  }

  if (event.statusCode && event.statusCode >= 400) {
    return 'warning';
  }

  return 'info';
}


function determineCategory(event: AuditEvent): string {
  if (event.action.includes('login') || event.action.includes('auth')) {
    return 'authentication';
  }
  
  if (event.action.includes('admin') || event.action.includes('system')) {
    return 'administration';
  }
  
  if (event.action.includes('export') || event.action.includes('download')) {
    return 'data_access';
  }
  
  if (event.action.includes('security') || event.action.includes('audit')) {
    return 'security';
  }
  
  return 'general';
}

export async function logAuthEvent(
  userId: string | undefined,
  action: string,
  req: Request,
  res?: Response,
  details?: any
) {
  const event: AuditEvent = {
    userId,
    action,
    details,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    sessionId: req.sessionID,
    method: req.method,
    endpoint: req.originalUrl
  };

  if (res) {
    event.statusCode = res.statusCode;
  }

  event.severity = determineSeverity(event);
  event.category = determineCategory(event);
  event.riskScore = calculateRiskScore(event);

  try {
    await storage.createAuditLog({
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      details: event.details,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      sessionId: event.sessionId,
      method: event.method,
      endpoint: event.endpoint,
      statusCode: event.statusCode,
      duration: event.duration,
      category: event.category,
      severity: event.severity,
      riskScore: event.riskScore
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export async function logSecurityEvent(
  action: string,
  req: Request,
  severity: 'info' | 'warning' | 'error' | 'critical' = 'warning',
  details?: any
) {
  const event: AuditEvent = {
    action,
    details,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    sessionId: req.sessionID,
    method: req.method,
    endpoint: req.originalUrl,
    severity,
    category: 'security'
  };

  event.riskScore = calculateRiskScore(event);

  try {
    await storage.createAuditLog({
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      details: event.details,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      sessionId: event.sessionId,
      method: event.method,
      endpoint: event.endpoint,
      statusCode: event.statusCode,
      duration: event.duration,
      category: event.category,
      severity: event.severity,
      riskScore: event.riskScore
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

export async function logDataEvent(
  userId: string | undefined,
  action: string,
  resource: string,
  resourceId: string,
  req: Request,
  details?: any
) {
  const event: AuditEvent = {
    userId,
    action,
    resource,
    resourceId,
    details,
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    sessionId: req.sessionID,
    method: req.method,
    endpoint: req.originalUrl,
    category: 'data_access'
  };

  event.severity = determineSeverity(event);
  event.riskScore = calculateRiskScore(event);

  try {
    await storage.createAuditLog({
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      details: event.details,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      sessionId: event.sessionId,
      method: event.method,
      endpoint: event.endpoint,
      statusCode: event.statusCode,
      duration: event.duration,
      category: event.category,
      severity: event.severity,
      riskScore: event.riskScore
    });
  } catch (error) {
    console.error('Failed to log data event:', error);
  }
}


export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const user = (req as any).user || (req.session as any)?.user;
    
    await logAuthEvent(
      user?.id,
      `http_${req.method.toLowerCase()}`,
      req,
      res,
      {
        endpoint: req.originalUrl,
        duration,
        userAgent: req.get('User-Agent')
      }
    );
  });

  next();
}