import { githubService } from '../lib/github-api';
import { aiBlogGenerator } from './ai-blog-generator';
import { storage } from './storage';

interface ContinuousAgentConfig {
  intervalHours: number;
  featuredRepos: string[];
  enableAutoGeneration: boolean;
  enableSecurityAudit: boolean;
}

class ContinuousAgent {
  private config: ContinuousAgentConfig;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.config = {
      intervalHours: 6,
      featuredRepos: [], // Load from GitHub API dynamically
      enableAutoGeneration: true,
      enableSecurityAudit: true,
    };
  }

  async start() {
    if (this.isRunning) {
      console.log('🤖 Continuous Agent already running');
      return;
    }

    // Starting Continuous Enhancement Agent...
    this.isRunning = true;

    // Initial run
    await this.executeMaintenanceLoop();

    // Schedule periodic runs
    this.intervalId = setInterval(async () => {
      await this.executeMaintenanceLoop();
    }, this.config.intervalHours * 60 * 60 * 1000);

    // Continuous Agent activated with 6h intervals
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🤖 Continuous Agent stopped');
  }

  private async executeMaintenanceLoop() {
    // Starting maintenance loop...
    
    try {
      // 1. Update GitHub repository data
      await this.updateRepositoryData();

      // 2. Generate new blog content if needed
      if (this.config.enableAutoGeneration) {
        await this.generateContentUpdates();
      }

      // 3. Performance audit
      await this.performanceAudit();

      // 4. Security audit
      if (this.config.enableSecurityAudit) {
        await this.securityAudit();
      }

      // 5. Database cleanup
      await this.databaseMaintenance();

      console.log('✓ Maintenance loop completed successfully');
    } catch (error) {
      console.error('❌ Maintenance loop failed:', error);
      await this.notifyAdmin('Maintenance Loop Error', error);
    }
  }

  private async updateRepositoryData() {
    console.log('📊 Updating repository data...');
    
    try {
      const repoUpdates = await Promise.allSettled(
        this.config.featuredRepos.map(async (repoName) => {
          const repoData = await githubService.getRepository(repoName);
          const commits = await githubService.getRecentCommits(repoName, 5);
          
          return {
            name: repoName,
            data: repoData,
            recentCommits: commits,
            lastUpdated: new Date().toISOString()
          };
        })
      );

      const successful = repoUpdates.filter(result => result.status === 'fulfilled');
      console.log(`✓ Updated ${successful.length}/${this.config.featuredRepos.length} repositories`);
      
      return successful.map(result => (result as PromiseFulfilledResult<any>).value);
    } catch (error) {
      console.error('Failed to update repository data:', error);
      throw error;
    }
  }

  private async generateContentUpdates() {
    console.log('✍️ Checking for content generation opportunities...');
    
    try {
      // Check if any repos have new commits since last blog generation
      const adminUser = await storage.getAdminUser();
      if (!adminUser) {
        console.log('No admin user found for content generation');
        return;
      }

      // Generate blogs for repos with recent activity
      await aiBlogGenerator.generateBlogsForFeaturedRepos();
      console.log('✓ Content generation check completed');
    } catch (error) {
      console.error('Content generation failed:', error);
    }
  }

  private async performanceAudit() {
    console.log('⚡ Running performance audit...');
    
    try {
      // Basic performance monitoring without external dependencies
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // Log memory usage if high
      if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
        console.warn('⚠️ High memory usage detected');
        await this.notifyAdmin('Memory Alert', `Memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
      }

      console.log(`✓ Performance audit completed - Uptime: ${Math.round(uptime)}s, Memory: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
    } catch (error) {
      console.error('Performance audit failed:', error);
    }
  }

  private async securityAudit() {
    console.log('🔒 Running security audit...');
    
    try {
      // Check for suspicious activity patterns
      const recentModerationLogs = await storage.getRecentModerationLogs(24); // Last 24 hours
      const failedLogins = await storage.getFailedLoginAttempts(24);

      if (recentModerationLogs.length > 50) {
        await this.notifyAdmin('High Moderation Activity', 
          `${recentModerationLogs.length} moderation actions in last 24h`);
      }

      if (failedLogins.length > 20) {
        await this.notifyAdmin('Suspicious Login Activity', 
          `${failedLogins.length} failed login attempts in last 24h`);
      }

      console.log('✓ Security audit completed');
    } catch (error) {
      console.error('Security audit failed:', error);
    }
  }

  private async databaseMaintenance() {
    console.log('🗄️ Running database maintenance...');
    
    try {
      // Clean up old analytics data (keep last 90 days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);
      
      await storage.cleanupOldAnalytics(cutoffDate);
      
      // Clean up old moderation logs (keep last 30 days)
      const moderationCutoff = new Date();
      moderationCutoff.setDate(moderationCutoff.getDate() - 30);
      
      await storage.cleanupOldModerationLogs(moderationCutoff);

      console.log('✓ Database maintenance completed');
    } catch (error) {
      console.error('Database maintenance failed:', error);
    }
  }

  private async notifyAdmin(subject: string, details: any) {
    console.log(`📧 Admin notification: ${subject}`, details);
    
    try {
      const adminUser = await storage.getAdminUser();
      if (adminUser) {
        await storage.createSystemNotification(adminUser.id, subject, String(details));
      }
    } catch (error) {
      console.error('Failed to notify admin:', error);
    }
  }

  // Manual trigger methods
  async triggerContentGeneration() {
    console.log('🔄 Manual content generation triggered');
    await this.generateContentUpdates();
  }

  async triggerSecurityAudit() {
    console.log('🔄 Manual security audit triggered');
    await this.securityAudit();
  }

  async triggerFullMaintenance() {
    console.log('🔄 Manual full maintenance triggered');
    await this.executeMaintenanceLoop();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      config: this.config,
      nextRun: this.intervalId ? new Date(Date.now() + this.config.intervalHours * 60 * 60 * 1000) : null
    };
  }
}

export const continuousAgent = new ContinuousAgent();