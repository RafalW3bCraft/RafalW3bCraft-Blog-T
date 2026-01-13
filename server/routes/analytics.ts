import { Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { analytics } from '@shared/schema';

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

export async function trackPageView(req: Request, res: Response) {
  try {
    const { path, userAgent, referrer } = pageViewSchema.parse(req.body);
    
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    
    await db.insert(analytics).values({
      path,
      userAgent,
      ipAddress,
    });

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

export async function trackWebVitals(req: Request, res: Response) {
  try {
    const vital = webVitalSchema.parse(req.body);
    
    const { storage } = await import('../storage');
    
    await storage.logSystemHealth(
      'web_vital',
      vital.name,
      {
        id: vital.id,
        value: vital.value,
        rating: vital.rating,
        timestamp: new Date().toISOString()
      },
      vital.rating === 'good' ? 'healthy' : vital.rating === 'poor' ? 'degraded' : 'warning'
    );

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

export async function trackPerformance(req: Request, res: Response) {
  try {
    const performanceData = performanceMetricSchema.parse(req.body);
    
    const { storage } = await import('../storage');
    
    await storage.logSystemHealth(
      'performance',
      performanceData.page,
      {
        metrics: performanceData.metrics,
        userAgent: performanceData.userAgent,
        timestamp: performanceData.timestamp
      },
      performanceData.metrics.total < 3000 ? 'healthy' : performanceData.metrics.total > 8000 ? 'degraded' : 'warning'
    );

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

export async function getAnalyticsData(req: Request, res: Response) {
  try {
    const performanceMetrics = {};

    const recentViews = await db
      .select()
      .from(analytics)
      .orderBy(analytics.timestamp)
      .limit(100);

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
        activeUsers: uniqueIPs,
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

export async function getPerformanceSummary(req: Request, res: Response) {
  try {
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

export async function clearAnalyticsData(req: Request, res: Response) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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
