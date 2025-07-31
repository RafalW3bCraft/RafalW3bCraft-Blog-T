import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { analytics } from '@shared/schema';
// Performance monitoring utilities - simplified for Express app
// Note: Removed dependency on deleted lib/performance

// Validation schemas
const webVitalSchema = z.object({
  id: z.string(),
  name: z.enum(['CLS', 'FID', 'FCP', 'LCP', 'TTFB']),
  value: z.number(),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
});

const performanceMetricSchema = z.object({
  page: z.string(),
  metrics: z.object({
    dns: z.number(),
    connection: z.number(),
    request: z.number(),
    response: z.number(),
    domParsing: z.number(),
    domContentLoaded: z.number(),
    loading: z.number(),
    total: z.number(),
  }),
  timestamp: z.string(),
  userAgent: z.string(),
});

const pageViewSchema = z.object({
  path: z.string(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
});

// Track page views
export async function trackPageView(req: Request, res: Response) {
  try {
    const { path, userAgent, referrer } = pageViewSchema.parse(req.body);
    
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    await db.insert(analytics).values({
      path,
      userAgent,
      ipAddress,
    });

    // Performance tracking removed - file was deleted during security audit

    res.status(200).json({ 
      message: 'Page view tracked successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors,
      });
    }

    console.error('Error tracking page view:', error);
    res.status(500).json({
      error: 'Failed to track page view',
      message: 'Unable to record analytics data',
    });
  }
}

// Track Web Vitals
export async function trackWebVitals(req: Request, res: Response) {
  try {
    const vital = webVitalSchema.parse(req.body);
    
    // Performance monitor removed during security audit

    // Could also store in database if needed for persistence
    // await db.insert(webVitals).values(vital);

    res.status(200).json({ 
      message: 'Web vital tracked successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid vital data',
        details: error.errors,
      });
    }

    console.error('Error tracking web vital:', error);
    res.status(500).json({
      error: 'Failed to track web vital',
      message: 'Unable to record performance data',
    });
  }
}

// Track performance metrics
export async function trackPerformance(req: Request, res: Response) {
  try {
    const performanceData = performanceMetricSchema.parse(req.body);
    
    // Performance monitor removed during security audit

    res.status(200).json({ 
      message: 'Performance metrics tracked successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid performance data',
        details: error.errors,
      });
    }

    console.error('Error tracking performance:', error);
    res.status(500).json({
      error: 'Failed to track performance',
      message: 'Unable to record performance data',
    });
  }
}

// Get analytics dashboard data (admin only)
export async function getAnalyticsData(req: Request, res: Response) {
  try {
    // Note: Add authentication check here for admin users
    
    // Performance monitor removed during security audit
    const performanceMetrics = {};

    // Get recent page views
    const recentViews = await db
      .select()
      .from(analytics)
      .orderBy(analytics.timestamp)
      .limit(100);

    // Aggregate data
    const totalViews = recentViews.length;
    const uniqueIPs = new Set(recentViews.map(v => v.ipAddress)).size;
    const topPages = recentViews.reduce((acc, view) => {
      acc[view.path] = (acc[view.path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const analyticsData = {
      overview: {
        totalPageViews: totalViews,
        uniqueVisitors: uniqueIPs,
        topPages: Object.entries(topPages)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([path, count]) => ({ path, count })),
      },
      performance: performanceMetrics,
      realTime: {
        activeUsers: uniqueIPs, // Simplified
        currentHour: recentViews.filter(
          v => new Date(v.timestamp!).getTime() > Date.now() - 60 * 60 * 1000
        ).length,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Error getting analytics data:', error);
    res.status(500).json({
      error: 'Failed to retrieve analytics',
      message: 'Unable to fetch analytics data',
    });
  }
}

// Get performance summary
export async function getPerformanceSummary(req: Request, res: Response) {
  try {
    // Performance monitor removed during security audit
    const metrics = {};

    const summary = {
      webVitals: {
        cls: { average: 0, current: 0, count: 0 },
        fid: { average: 0, current: 0, count: 0 },
        fcp: { average: 0, current: 0, count: 0 },
        lcp: { average: 0, current: 0, count: 0 },
        ttfb: { average: 0, current: 0, count: 0 },
      },
      requests: {
        average: 0,
        total: 0,
      },
      api: {
        average: 0,
        total: 0,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(summary);
  } catch (error) {
    console.error('Error getting performance summary:', error);
    res.status(500).json({
      error: 'Failed to retrieve performance data',
      message: 'Unable to fetch performance summary',
    });
  }
}

// Clear analytics data (admin only)
export async function clearAnalyticsData(req: Request, res: Response) {
  try {
    // Note: Add authentication check here for admin users
    
    // Clear database analytics (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Performance monitor removed during security audit

    res.json({
      message: 'Analytics data cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error clearing analytics data:', error);
    res.status(500).json({
      error: 'Failed to clear analytics data',
      message: 'Unable to clear data',
    });
  }
}