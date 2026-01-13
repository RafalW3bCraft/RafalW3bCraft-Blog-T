import { Server as SocketIOServer } from 'socket.io';
import { storage } from './storage';

interface AnalyticsMetrics {
  activeUsers: number;
  pageViews: number;
  totalProjects: number;
  totalStars: number;
  securityEvents: number;
  lastUpdated: string;
}

interface SecurityEvent {
  id: number;
  action: string;
  severity: string;
  timestamp: string;
  ipAddress: string;
  userId?: string;
}

export class RealTimeAnalytics {
  private io: SocketIOServer;
  private updateInterval: NodeJS.Timeout | null = null;
  private securityMonitorInterval: NodeJS.Timeout | null = null;
  private activeUsers = new Set<string>();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
    this.startRealTimeUpdates();
    this.startSecurityMonitoring();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`📊 Real-time analytics client connected: ${socket.id}`);
      
      
      socket.on('user_active', (userId: string) => {
        this.activeUsers.add(userId);
        this.broadcastActiveUsers();
      });

      
      socket.on('request_analytics', async () => {
        const metrics = await this.getLatestMetrics();
        socket.emit('analytics_update', metrics);
      });

      
      socket.on('request_security_events', async () => {
        const events = await this.getRecentSecurityEvents();
        socket.emit('security_events', events);
      });

      socket.on('disconnect', () => {
        console.log(`📊 Analytics client disconnected: ${socket.id}`);
        
        this.cleanupInactiveUsers();
      });
    });
  }

  private startRealTimeUpdates() {
    
    this.updateInterval = setInterval(async () => {
      try {
        const metrics = await this.getLatestMetrics();
        this.io.emit('analytics_update', metrics);
      } catch (error) {
        console.error('Error broadcasting analytics update:', error);
      }
    }, 30000);
  }

  private startSecurityMonitoring() {
    
    this.securityMonitorInterval = setInterval(async () => {
      try {
        const events = await this.getRecentSecurityEvents();
        
        
        const criticalEvents = events.filter(event => 
          event.severity === 'critical' || event.severity === 'error'
        );

        if (criticalEvents.length > 0) {
          this.io.emit('security_alert', {
            message: `${criticalEvents.length} critical security event(s) detected`,
            events: criticalEvents,
            timestamp: new Date().toISOString()
          });
        }

        this.io.emit('security_events', events);
      } catch (error) {
        console.error('Error monitoring security events:', error);
      }
    }, 10000);
  }

  private async getLatestMetrics(): Promise<AnalyticsMetrics> {
    try {
      const [analyticsStats, githubAggregated, recentSecurityEvents] = await Promise.all([
        storage.getAnalyticsStats(),
        storage.getGithubStatsAggregated(),
        this.getSecurityEventCount()
      ]);

      return {
        activeUsers: this.activeUsers.size,
        pageViews: analyticsStats.totalViews,
        totalProjects: githubAggregated.totalProjects,
        totalStars: githubAggregated.totalStars,
        securityEvents: recentSecurityEvents,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting latest metrics:', error);
      return {
        activeUsers: this.activeUsers.size,
        pageViews: 0,
        totalProjects: 0,
        totalStars: 0,
        securityEvents: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  private async getRecentSecurityEvents(): Promise<SecurityEvent[]> {
    try {
      
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const auditLogs = await storage.getAuditLogsSince(oneHourAgo);
      
      return auditLogs
        .filter((log: any) => 
          log.severity === 'critical' || 
          log.severity === 'error' || 
          log.category === 'security' ||
          (log.riskScore && log.riskScore > 50)
        )
        .map((log: any) => ({
          id: log.id,
          action: log.action,
          severity: log.severity || 'info',
          timestamp: log.createdAt?.toISOString() || new Date().toISOString(),
          ipAddress: log.ipAddress || 'unknown',
          userId: log.userId || undefined
        }))
        .slice(0, 20); 
    } catch (error) {
      console.error('Error getting security events:', error);
      return [];
    }
  }

  private async getSecurityEventCount(): Promise<number> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const events = await storage.getAuditLogsSince(twentyFourHoursAgo);
      return events.filter((log: any) => 
        log.severity === 'critical' || 
        log.severity === 'error' || 
        log.category === 'security'
      ).length;
    } catch (error) {
      console.error('Error getting security event count:', error);
      return 0;
    }
  }

  private broadcastActiveUsers() {
    this.io.emit('active_users_update', {
      count: this.activeUsers.size,
      timestamp: new Date().toISOString()
    });
  }

  private cleanupInactiveUsers() {
    
    
    setTimeout(() => {
      this.activeUsers.clear();
    }, 5 * 60 * 1000); 
  }

  
  public triggerSecurityEvent(event: Partial<SecurityEvent>) {
    this.io.emit('security_alert', {
      message: `Security event: ${event.action}`,
      event,
      timestamp: new Date().toISOString()
    });
  }

  public triggerMetricsUpdate() {
    this.getLatestMetrics().then(metrics => {
      this.io.emit('analytics_update', metrics);
    });
  }

  public cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.securityMonitorInterval) {
      clearInterval(this.securityMonitorInterval);
    }
  }
}