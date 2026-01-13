import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';

export const createRateLimit = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

export const apiLimiter = createRateLimit(15 * 60 * 1000, 100); 
export const strictAuthLimiter = createRateLimit(15 * 60 * 1000, 5);   
export const generalAuthLimiter = createRateLimit(15 * 60 * 1000, 50);
export const contactLimiter = createRateLimit(60 * 60 * 1000, 3); 
export const adminLoginLimiter = createRateLimit(15 * 60 * 1000, 5);
export const oauthLimiter = createRateLimit(15 * 60 * 1000, 10); 

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://vercel.live",
        "https://vitals.vercel-insights.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:",
      ],
      connectSrc: [
        "'self'",
        "https://api.github.com",
        "https://vitals.vercel-insights.com",
        "wss:",
      ],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

export const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://rafalw3bcraft.vercel.app', 'https://rafalw3bcraft.com']
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
  ],
};

export const compressionMiddleware = compression({
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024,
});

export const requestLogger = morgan('combined', {
  skip: (req: Request) => {
    return req.url === '/health' || 
           req.url.startsWith('/_next') || 
           req.url.startsWith('/static');
  },
});

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error occurred:', err);
  
  if (process.env.NODE_ENV === 'production') {
    console.error('[PRODUCTION ERROR]:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack }),
  });
};
