import {
  users,
  blogPosts,
  contactMessages,
  analytics,
  githubProjects,
  messages,
  moderationLogs,
  notifications,
  audioPlayLogs,
  auditLogs,
  failedLoginAttempts,
  systemHealth,
  userDrafts,
  userBookmarks,
  comments,
  likes,
  githubRepoIntegration,
  adminMessages,
  userGithubTokens,
  userSiteData,
  sessions,
  userSecuritySettings,
  userNotificationSettings,
  userApiTokens,
  type User,
  type UpsertUser,
  type BlogPost,
  type InsertBlogPost,
  type ContactMessage,
  type InsertContactMessage,
  type Analytics,
  type InsertAnalytics,
  type GithubProject,
  type Message,
  type InsertMessage,
  type InsertAudioPlayLog,
  type AudioPlayLog,
  type InsertAuditLog,
  type AuditLog,
  type InsertFailedLoginAttempt,
  type FailedLoginAttempt,
  type InsertSystemHealth,
  type SystemHealth,
  type UserDraft,
  type InsertUserDraft,
  type UserBookmark,
  type InsertUserBookmark,
  type Comment,
  type InsertComment,
  type Like,
  type InsertLike,
  type GithubRepoIntegration,
  type InsertGithubRepoIntegration,
  type AdminMessage,
  type InsertAdminMessage,
  type UserGithubToken,
  type InsertUserGithubToken,
  type UserSiteData,
  type InsertUserSiteData,
  type UserSecuritySettings,
  type UserNotificationSettings,
  type UserApiToken,
  type Notification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, gt, lt, and, or, isNull, gte, lte, ne, ilike, asc } from "drizzle-orm";
import { encryptGithubToken, decryptGithubToken, validateGithubTokenFormat } from "../lib/encryption";

export interface IStorage {
  
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  
  getAllBlogPosts(published?: boolean): Promise<BlogPost[]>;
  getUserBlogPosts(userId: string, published?: boolean): Promise<BlogPost[]>;
  getAdminBlogPosts(published?: boolean): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<void>;
  incrementBlogPostViews(slug: string): Promise<void>;
  
  
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getAllContactMessages(): Promise<ContactMessage[]>;
  deleteContactMessage(id: number): Promise<void>;
  
  
  recordAnalytics(data: InsertAnalytics): Promise<Analytics>;
  getAnalyticsStats(): Promise<{
    totalViews: number;
    totalPosts: number;
    totalMessages: number;
  }>;
  
  
  getGithubProjects(): Promise<GithubProject[]>;
  upsertGithubProject(project: Omit<GithubProject, 'id'>): Promise<GithubProject>;
  
  
  getUserMessages(userId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  
  getAdminUser(): Promise<User | null>;
  getUserByProviderId(provider: string, providerId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  updateUserRole(userId: string, role: string): Promise<User>;
  deactivateUser(userId: string): Promise<User>;
  getContactMessages(limit?: number): Promise<ContactMessage[]>;
  
  
  logAudioPlay(userId: string, audioType: string, sessionId?: string): Promise<AudioPlayLog>;
  hasAudioBeenPlayed(userId: string, audioType: string, sessionId?: string): Promise<boolean>;
  createAuditLog(auditData: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number): Promise<AuditLog[]>;
  getAuditLogsByUser(userId: string, limit?: number): Promise<AuditLog[]>;
  logFailedLoginAttempt(attemptData: InsertFailedLoginAttempt): Promise<FailedLoginAttempt>;
  getRecentFailedLogins(hours: number): Promise<FailedLoginAttempt[]>;
  logSystemHealth(metricType: string, metricName: string, value: any, status?: string): Promise<SystemHealth>;
  getSystemHealthMetrics(metricType?: string, hours?: number): Promise<SystemHealth[]>;
  
  
  cleanupOldAnalytics(cutoffDate: Date): Promise<void>;
  cleanupOldModerationLogs(cutoffDate: Date): Promise<void>;
  getRecentModerationLogs(hours: number): Promise<any[]>;
  getFailedLoginAttempts(hours: number): Promise<any[]>;
  
  
  getUserDrafts(userId: string): Promise<UserDraft[]>;
  createUserDraft(draft: InsertUserDraft): Promise<UserDraft>;
  updateUserDraft(id: number, draft: Partial<InsertUserDraft>): Promise<UserDraft>;
  deleteUserDraft(id: number): Promise<void>;
  
  
  getUserBookmarks(userId: string): Promise<(UserBookmark & { post: BlogPost })[]>;
  createUserBookmark(bookmark: InsertUserBookmark): Promise<UserBookmark>;
  updateBookmarkProgress(userId: string, postId: number, progress: number): Promise<UserBookmark>;
  removeUserBookmark(userId: string, postId: number): Promise<void>;
  
  
  getCommentsByPostId(postId: number): Promise<(Comment & { author: User, replies?: Comment[] })[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment>;
  deleteComment(id: number): Promise<void>;
  approveComment(id: number): Promise<Comment>;
  
  
  getLikesByPostId(postId: number): Promise<Like[]>;
  getLikesByCommentId(commentId: number): Promise<Like[]>;
  createLike(like: InsertLike): Promise<Like>;
  removeLike(userId: string, postId?: number, commentId?: number): Promise<void>;
  getUserLikes(userId: string): Promise<Like[]>;
  
  
  getUserGithubRepos(userId: string): Promise<GithubRepoIntegration[]>;
  createGithubRepoIntegration(repo: InsertGithubRepoIntegration): Promise<GithubRepoIntegration>;
  updateGithubRepoIntegration(id: number, repo: Partial<InsertGithubRepoIntegration>): Promise<GithubRepoIntegration>;
  deleteGithubRepoIntegration(id: number): Promise<void>;
  getReposForBlogGeneration(userId: string): Promise<GithubRepoIntegration[]>;
  
  
  getAdminMessages(userId: string): Promise<AdminMessage[]>;
  createAdminMessage(message: InsertAdminMessage): Promise<AdminMessage>;
  markAdminMessageAsRead(id: number): Promise<AdminMessage>;
  deleteAdminMessage(id: number): Promise<void>;
  
  
  getAllUsersWithActivity(): Promise<(User & { activityCount: number, riskScore: number })[]>;
  getUserSecurityAnalysis(userId: string): Promise<any>;
  getSystemPerformanceMetrics(): Promise<any>;
  getContentModerationQueue(): Promise<any[]>;
  getSecurityReports(): Promise<any[]>;
  bulkUpdateUsers(userIds: string[], updates: Partial<User>): Promise<User[]>;
  exportUserData(userId: string): Promise<any>;
  createSystemBackup(): Promise<string>;
  
  
  getAuditLogsSince(date: Date): Promise<AuditLog[]>;
  getAuditLogsByAction(action: string): Promise<AuditLog[]>;
  getAuditLogsByResource(resource: string): Promise<AuditLog[]>;
  analyzeUserRiskScore(userId: string): Promise<number>;
  detectSuspiciousActivity(userId: string): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByProviderId(provider: string, providerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(eq(users.provider, provider), eq(users.providerId, providerId)));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  
  async getAllBlogPosts(published?: boolean): Promise<BlogPost[]> {
    if (published !== undefined) {
      return await db.select().from(blogPosts)
        .where(eq(blogPosts.published, published))
        .orderBy(desc(blogPosts.createdAt));
    }
    
    return await db.select().from(blogPosts)
      .orderBy(desc(blogPosts.createdAt));
  }

  
  async getUserBlogPosts(userId: string, published?: boolean): Promise<BlogPost[]> {
    if (published !== undefined) {
      return await db.select().from(blogPosts)
        .where(and(eq(blogPosts.authorId, userId), eq(blogPosts.published, published)))
        .orderBy(desc(blogPosts.createdAt));
    }
    
    return await db.select().from(blogPosts)
      .where(eq(blogPosts.authorId, userId))
      .orderBy(desc(blogPosts.createdAt));
  }

  
  async getAdminBlogPosts(published: boolean = true): Promise<BlogPost[]> {
    return await db.select().from(blogPosts)
      .where(and(eq(blogPosts.authorId, 'admin_user'), eq(blogPosts.published, published)))
      .orderBy(desc(blogPosts.createdAt));
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async getBlogPostById(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    try {
      
      const { id, ...postWithoutId } = post as any;
      
      const insertedPosts = await db.insert(blogPosts).values(postWithoutId).returning();
      const newPost = insertedPosts[0];
      
      if (!newPost) {
        throw new Error('Failed to create blog post - no data returned');
      }
      
      console.log(`✅ Blog post created successfully with ID: ${newPost.id}`);
      return newPost;
    } catch (error: any) {
      
      if (error?.code === '23505' && error?.constraint === 'blog_posts_pkey') {
        console.error('⚠️ Primary key collision detected, retrying...');
        
        const { id, ...postWithoutId } = post as any;
        const insertedPosts = await db.insert(blogPosts).values(postWithoutId).returning();
        return insertedPosts[0];
      }
      
      if (error?.code === '23505' && error?.constraint === 'blog_posts_slug_unique') {
        throw new Error('A blog post with this slug already exists. Please use a different title.');
      }
      
      console.error('Error in createBlogPost:', error);
      throw error;
    }
  }

  async updateBlogPost(id: number, post: Partial<InsertBlogPost>): Promise<BlogPost> {
    const [updatedPost] = await db
      .update(blogPosts)
      .set({ ...post, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async incrementBlogPostViews(slug: string): Promise<void> {
    await db
      .update(blogPosts)
      .set({ views: sql`${blogPosts.views} + 1` })
      .where(eq(blogPosts.slug, slug));
  }

  
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [newMessage] = await db.insert(contactMessages).values(message).returning();
    return newMessage;
  }

  async getAllContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  async deleteContactMessage(id: number): Promise<void> {
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
  }
  
  async recordAnalytics(data: InsertAnalytics): Promise<Analytics> {
    const [record] = await db.insert(analytics).values(data).returning();
    return record;
  }

  async getAnalyticsStats(): Promise<{
    totalViews: number;
    totalPosts: number;
    totalMessages: number;
  }> {
    const [viewsResult] = await db.select({ count: sql<number>`count(*)` }).from(analytics);
    const [postsResult] = await db.select({ count: sql<number>`count(*)` }).from(blogPosts);
    const [messagesResult] = await db.select({ count: sql<number>`count(*)` }).from(contactMessages);

    return {
      totalViews: viewsResult.count,
      totalPosts: postsResult.count,
      totalMessages: messagesResult.count,
    };
  }

  
  async getGithubProjects(): Promise<GithubProject[]> {
    return await db.select().from(githubProjects).orderBy(desc(githubProjects.stars));
  }

  async upsertGithubProject(project: Omit<GithubProject, 'id'>): Promise<GithubProject> {
    const [upsertedProject] = await db
      .insert(githubProjects)
      .values(project)
      .onConflictDoUpdate({
        target: githubProjects.name,
        set: {
          ...project,
          lastUpdated: new Date(),
        },
      })
      .returning();
    return upsertedProject;
  }

  
  async syncGithubProjectFromAPI(githubRepoData: any): Promise<GithubProject> {
    const projectData = {
      githubId: githubRepoData.id,
      name: githubRepoData.name,
      fullName: githubRepoData.full_name,
      description: githubRepoData.description,
      language: githubRepoData.language,
      stars: githubRepoData.stargazers_count || 0,
      forks: githubRepoData.forks_count || 0,
      size: githubRepoData.size || 0, 
      url: githubRepoData.html_url,
      homepage: githubRepoData.homepage,
      topics: githubRepoData.topics || [],
      isPrivate: githubRepoData.private || false,
      createdAt: new Date(githubRepoData.created_at),
      updatedAt: new Date(githubRepoData.updated_at),
      lastSyncedAt: new Date(),
    };

    const [syncedProject] = await db
      .insert(githubProjects)
      .values(projectData)
      .onConflictDoUpdate({
        target: githubProjects.githubId,
        set: {
          ...projectData,
          lastUpdated: new Date(),
        },
      })
      .returning();
    
    return syncedProject;
  }

  async getGithubProjectsNeedingSync(maxAgeHours: number = 6): Promise<GithubProject[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);

    return await db
      .select()
      .from(githubProjects)
      .where(or(
        isNull(githubProjects.lastSyncedAt),
        lt(githubProjects.lastSyncedAt, cutoffTime)
      ))
      .orderBy(desc(githubProjects.stars));
  }

  async getGithubProjectByName(name: string): Promise<GithubProject | null> {
    const projects = await db
      .select()
      .from(githubProjects)
      .where(eq(githubProjects.name, name))
      .limit(1);
    
    return projects[0] || null;
  }

  async getGithubStatsAggregated(): Promise<{
    totalProjects: number;
    totalStars: number;
    totalForks: number;
    languages: { language: string; count: number }[];
    averageSize: number;
  }> {
    const projects = await this.getGithubProjects();
    
    const totalProjects = projects.length;
    const totalStars = projects.reduce((sum, p) => sum + (p.stars || 0), 0);
    const totalForks = projects.reduce((sum, p) => sum + (p.forks || 0), 0);
    const averageSize = projects.reduce((sum, p) => sum + (p.size || 0), 0) / (totalProjects || 1);
    
    
    const languageCounts = projects.reduce((acc, project) => {
      if (project.language) {
        acc[project.language] = (acc[project.language] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const languages = Object.entries(languageCounts)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);
    
    return {
      totalProjects,
      totalStars,
      totalForks,
      languages,
      averageSize: Math.round(averageSize),
    };
  }

  
  async getUserMessages(userId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.senderId, userId))
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  
  async getAdminUser(): Promise<any | null> {
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(1);

    return adminUsers[0] || null;
  }



  async getRecentModerationLogs(hours: number): Promise<any[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return await db
      .select()
      .from(moderationLogs)
      .where(gt(moderationLogs.createdAt, cutoffTime))
      .orderBy(desc(moderationLogs.createdAt));
  }

  async getFailedLoginAttempts(hours: number): Promise<FailedLoginAttempt[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return await db
      .select()
      .from(failedLoginAttempts)
      .where(gt(failedLoginAttempts.attemptedAt, cutoffTime))
      .orderBy(desc(failedLoginAttempts.attemptedAt));
  }

  async cleanupOldAnalytics(cutoffDate: Date): Promise<void> {
    try {
      await db
        .delete(analytics)
        .where(lt(analytics.timestamp, cutoffDate));
      
      
    } catch (error) {
      console.error('Failed to cleanup old analytics:', error);
    }
  }

  async cleanupOldModerationLogs(cutoffDate: Date): Promise<void> {
    try {
      await db
        .delete(moderationLogs)
        .where(lt(moderationLogs.createdAt, cutoffDate));
      
      
    } catch (error) {
      console.error('Failed to cleanup old moderation logs:', error);
    }
  }

  
  async logAudioPlay(userId: string, audioType: string, sessionId?: string): Promise<AudioPlayLog> {
    const [audioLog] = await db.insert(audioPlayLogs).values({
      userId,
      audioType,
      sessionId
    }).returning();
    return audioLog;
  }

  async hasAudioBeenPlayed(userId: string, audioType: string, sessionId?: string): Promise<boolean> {
    const logs = await db
      .select()
      .from(audioPlayLogs)
      .where(
        sessionId 
          ? sql`${audioPlayLogs.userId} = ${userId} AND ${audioPlayLogs.audioType} = ${audioType} AND ${audioPlayLogs.sessionId} = ${sessionId}`
          : sql`${audioPlayLogs.userId} = ${userId} AND ${audioPlayLogs.audioType} = ${audioType}`
      )
      .limit(1);
    
    return logs.length > 0;
  }

  
  async createAuditLog(auditData: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(auditData).returning();
    return auditLog;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  async getAuditLogsByUser(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  
  async logFailedLoginAttempt(attemptData: InsertFailedLoginAttempt): Promise<FailedLoginAttempt> {
    const [attempt] = await db.insert(failedLoginAttempts).values(attemptData).returning();
    return attempt;
  }

  async getRecentFailedLogins(hours: number): Promise<FailedLoginAttempt[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return await db
      .select()
      .from(failedLoginAttempts)
      .where(gt(failedLoginAttempts.attemptedAt, cutoffTime))
      .orderBy(desc(failedLoginAttempts.attemptedAt));
  }

  
  async logSystemHealth(metricType: string, metricName: string, value: any, status: string = 'healthy'): Promise<SystemHealth> {
    const [healthLog] = await db.insert(systemHealth).values({
      metricType,
      metricName,
      value,
      status
    }).returning();
    return healthLog;
  }

  async getSystemHealthMetrics(metricType?: string, hours: number = 24): Promise<SystemHealth[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    if (metricType) {
      return await db
        .select()
        .from(systemHealth)
        .where(sql`${systemHealth.checkedAt} > ${cutoffTime} AND ${systemHealth.metricType} = ${metricType}`)
        .orderBy(desc(systemHealth.checkedAt));
    }

    return await db
      .select()
      .from(systemHealth)
      .where(gt(systemHealth.checkedAt, cutoffTime))
      .orderBy(desc(systemHealth.checkedAt));
  }

  async createSystemNotification(userId: string, subject: string, content: string): Promise<any> {
    const notification = await db
      .insert(notifications)
      .values({
        userId,
        title: subject,
        message: content,
        type: 'system',
        isRead: false,
      })
      .returning();

    return notification[0];
  }

  
  async getAuditLogsSinceDate(since: Date) {
    try {
      const result = await db
        .select()
        .from(auditLogs)
        .where(gte(auditLogs.createdAt, since))
        .orderBy(desc(auditLogs.createdAt));
      return result;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  
  async getHighRiskSecurityEvents(limit: number = 50) {
    try {
      const result = await db
        .select()
        .from(auditLogs)
        .where(or(
          eq(auditLogs.severity, 'critical'),
          eq(auditLogs.severity, 'error'),
          eq(auditLogs.severity, 'warning')
        ))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
      return result;
    } catch (error) {
      console.error('Error fetching high-risk security events:', error);
      throw error;
    }
  }

  
  async getAllUsers(): Promise<User[]> {
    try {
      const result = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt));
      return result;
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const [updated] = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updated) {
        throw new Error(`User with id ${userId} not found`);
      }
      
      return updated;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    try {
      const [updated] = await db
        .update(users)
        .set({ role })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updated) {
        throw new Error(`User with id ${userId} not found`);
      }
      
      return updated;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  async deactivateUser(userId: string): Promise<User> {
    try {
      
      
      const [updated] = await db
        .update(users)
        .set({ role: 'deactivated' })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updated) {
        throw new Error(`User with id ${userId} not found`);
      }
      
      return updated;
    } catch (error) {
      console.error('Error deactivating user:', error);
      throw error;
    }
  }

  async getContactMessages(limit: number = 50): Promise<ContactMessage[]> {
    try {
      const result = await db
        .select()
        .from(contactMessages)
        .orderBy(desc(contactMessages.createdAt))
        .limit(limit);
      return result;
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      throw error;
    }
  }

  
  async getUserDrafts(userId: string): Promise<UserDraft[]> {
    try {
      const result = await db
        .select()
        .from(userDrafts)
        .where(eq(userDrafts.userId, userId))
        .orderBy(desc(userDrafts.updatedAt));
      return result;
    } catch (error) {
      console.error('Error fetching user drafts:', error);
      throw error;
    }
  }

  async createUserDraft(draft: InsertUserDraft): Promise<UserDraft> {
    try {
      const [created] = await db
        .insert(userDrafts)
        .values(draft)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating user draft:', error);
      throw error;
    }
  }

  async updateUserDraft(id: number, draft: Partial<InsertUserDraft>): Promise<UserDraft> {
    try {
      const [updated] = await db
        .update(userDrafts)
        .set({
          ...draft,
          updatedAt: new Date(),
        })
        .where(eq(userDrafts.id, id))
        .returning();
      
      if (!updated) {
        throw new Error(`Draft with id ${id} not found`);
      }
      
      return updated;
    } catch (error) {
      console.error('Error updating user draft:', error);
      throw error;
    }
  }

  async deleteUserDraft(id: number): Promise<void> {
    try {
      await db.delete(userDrafts).where(eq(userDrafts.id, id));
    } catch (error) {
      console.error('Error deleting user draft:', error);
      throw error;
    }
  }

  
  async getUserBookmarks(userId: string): Promise<(UserBookmark & { post: BlogPost })[]> {
    try {
      const result = await db
        .select({
          id: userBookmarks.id,
          userId: userBookmarks.userId,
          postId: userBookmarks.postId,
          readingProgress: userBookmarks.readingProgress,
          bookmarkedAt: userBookmarks.bookmarkedAt,
          post: blogPosts,
        })
        .from(userBookmarks)
        .innerJoin(blogPosts, eq(userBookmarks.postId, blogPosts.id))
        .where(eq(userBookmarks.userId, userId))
        .orderBy(desc(userBookmarks.bookmarkedAt));
      
      return result;
    } catch (error) {
      console.error('Error fetching user bookmarks:', error);
      throw error;
    }
  }

  async createUserBookmark(bookmark: InsertUserBookmark): Promise<UserBookmark> {
    try {
      const [created] = await db
        .insert(userBookmarks)
        .values(bookmark)
        .returning();
      return created;
    } catch (error) {
      console.error('Error creating user bookmark:', error);
      throw error;
    }
  }

  async updateBookmarkProgress(userId: string, postId: number, progress: number): Promise<UserBookmark> {
    try {
      const [updated] = await db
        .update(userBookmarks)
        .set({ readingProgress: progress })
        .where(
          and(
            eq(userBookmarks.userId, userId),
            eq(userBookmarks.postId, postId)
          )
        )
        .returning();
      
      if (!updated) {
        throw new Error(`Bookmark not found for user ${userId} and post ${postId}`);
      }
      
      return updated;
    } catch (error) {
      console.error('Error updating bookmark progress:', error);
      throw error;
    }
  }

  async removeUserBookmark(userId: string, postId: number): Promise<void> {
    try {
      await db
        .delete(userBookmarks)
        .where(
          and(
            eq(userBookmarks.userId, userId),
            eq(userBookmarks.postId, postId)
          )
        );
    } catch (error) {
      console.error('Error removing user bookmark:', error);
      throw error;
    }
  }

  
  async getCommentsByPostId(postId: number): Promise<(Comment & { author: User, replies?: Comment[] })[]> {
    const commentsWithAuthors = await db
      .select({
        id: comments.id,
        blogPostId: comments.blogPostId,
        authorId: comments.authorId,
        content: comments.content,
        approved: comments.approved,
        parentCommentId: comments.parentCommentId,
        depth: comments.depth,
        isDeleted: comments.isDeleted,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        author: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
        }
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(and(
        eq(comments.blogPostId, postId),
        eq(comments.approved, true),
        eq(comments.isDeleted, false)
      ))
      .orderBy(comments.createdAt);

    
    const commentMap = new Map();
    const rootComments: any[] = [];

    commentsWithAuthors.forEach(comment => {
      const commentWithReplies = { ...comment, replies: [] };
      commentMap.set(comment.id, commentWithReplies);

      if (comment.parentCommentId === null) {
        rootComments.push(commentWithReplies);
      }
    });

    
    commentsWithAuthors.forEach(comment => {
      if (comment.parentCommentId !== null) {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      }
    });

    return rootComments;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    return newComment;
  }

  async updateComment(id: number, comment: Partial<InsertComment>): Promise<Comment> {
    const [updatedComment] = await db.update(comments)
      .set({ ...comment, updatedAt: new Date() })
      .where(eq(comments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteCommentSoft(id: number): Promise<void> {
    
    await db.update(comments)
      .set({ isDeleted: true, content: '[deleted]' })
      .where(eq(comments.id, id));
  }

  async approveComment(id: number): Promise<Comment> {
    const [approvedComment] = await db.update(comments)
      .set({ approved: true })
      .where(eq(comments.id, id))
      .returning();
    return approvedComment;
  }

  
  async getLikesByPostId(postId: number): Promise<Like[]> {
    return await db.select().from(likes).where(eq(likes.blogPostId, postId));
  }

  async getLikesByCommentId(commentId: number): Promise<Like[]> {
    return await db.select().from(likes).where(eq(likes.commentId, commentId));
  }

  async createLike(like: InsertLike): Promise<Like> {
    const [newLike] = await db.insert(likes).values(like).returning();
    return newLike;
  }

  async removeLike(userId: string, postId?: number, commentId?: number): Promise<void> {
    let whereCondition;
    if (postId) {
      whereCondition = and(eq(likes.userId, userId), eq(likes.blogPostId, postId));
    } else if (commentId) {
      whereCondition = and(eq(likes.userId, userId), eq(likes.commentId, commentId));
    } else {
      throw new Error('Either postId or commentId must be provided');
    }
    
    await db.delete(likes).where(whereCondition);
  }

  async getUserLikes(userId: string): Promise<Like[]> {
    return await db.select().from(likes).where(eq(likes.userId, userId));
  }

  
  async getUserGithubRepos(userId: string): Promise<GithubRepoIntegration[]> {
    return await db.select().from(githubRepoIntegration)
      .where(eq(githubRepoIntegration.userId, userId))
      .orderBy(desc(githubRepoIntegration.createdAt));
  }

  async createGithubRepoIntegration(repo: InsertGithubRepoIntegration): Promise<GithubRepoIntegration> {
    const [newRepo] = await db.insert(githubRepoIntegration).values(repo).returning();
    return newRepo;
  }

  async updateGithubRepoIntegration(id: number, repo: Partial<InsertGithubRepoIntegration>): Promise<GithubRepoIntegration> {
    const [updatedRepo] = await db.update(githubRepoIntegration)
      .set({ ...repo, updatedAt: new Date() })
      .where(eq(githubRepoIntegration.id, id))
      .returning();
    return updatedRepo;
  }

  async deleteGithubRepoIntegration(id: number): Promise<void> {
    await db.delete(githubRepoIntegration).where(eq(githubRepoIntegration.id, id));
  }

  async getReposForBlogGeneration(userId: string): Promise<GithubRepoIntegration[]> {
    return await db.select().from(githubRepoIntegration)
      .where(and(
        eq(githubRepoIntegration.userId, userId),
        eq(githubRepoIntegration.isEnabled, true),
        eq(githubRepoIntegration.autoBlogGenerated, false)
      ));
  }

  
  async getAdminMessages(userId: string): Promise<AdminMessage[]> {
    return await db.select().from(adminMessages)
      .where(eq(adminMessages.recipientId, userId))
      .orderBy(desc(adminMessages.createdAt));
  }

  async createAdminMessage(message: InsertAdminMessage): Promise<AdminMessage> {
    const [newMessage] = await db.insert(adminMessages).values(message).returning();
    return newMessage;
  }

  async markAdminMessageAsRead(id: number): Promise<AdminMessage> {
    const [updatedMessage] = await db.update(adminMessages)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(adminMessages.id, id))
      .returning();
    return updatedMessage;
  }

  async deleteAdminMessage(id: number): Promise<void> {
    await db.delete(adminMessages).where(eq(adminMessages.id, id));
  }

  
  async getAllUsersWithActivity(): Promise<(User & { activityCount: number, riskScore: number })[]> {
    const allUsers = await this.getAllUsers();
    
    return Promise.all(allUsers.map(async user => ({
      ...user,
      activityCount: (await this.getAuditLogsByUser(user.id, 100)).length,
      riskScore: await this.analyzeUserRiskScore(user.id)
    })));
  }

  async getUserSecurityAnalysis(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) return null;

    const [recentLogs, failedLogins, suspiciousActivities] = await Promise.all([
      this.getAuditLogsByUser(userId, 100),
      this.getRecentFailedLogins(24),
      this.detectSuspiciousActivity(userId)
    ]);

    return {
      user,
      riskScore: await this.analyzeUserRiskScore(userId),
      recentActivities: recentLogs.length,
      failedLoginAttempts: failedLogins.filter(f => f.email === user.email).length,
      suspiciousActivities,
      lastActivity: recentLogs[0]?.createdAt || null,
      accountAge: user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
    };
  }

  async getSystemPerformanceMetrics(): Promise<any> {
    const [totalUsers, totalPosts, totalComments, totalAnalytics, recentErrors] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(blogPosts),
      db.select({ count: sql<number>`count(*)` }).from(comments),
      db.select({ count: sql<number>`count(*)` }).from(analytics),
      this.getAuditLogs(50)
    ]);

    const errorRate = recentErrors.filter(log => log.severity === 'error' || log.severity === 'critical').length / Math.max(recentErrors.length, 1);
    
    return {
      totalUsers: totalUsers[0].count,
      totalPosts: totalPosts[0].count,
      totalComments: totalComments[0].count,
      totalAnalytics: totalAnalytics[0].count,
      errorRate: Math.round(errorRate * 100),
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      uptime: Math.round(process.uptime()),
      lastUpdated: new Date().toISOString()
    };
  }

  async getContentModerationQueue(): Promise<any[]> {
    const pendingComments = await db.select({
      id: comments.id,
      type: sql<string>`'comment'`,
      content: comments.content,
      authorId: comments.authorId,
      createdAt: comments.createdAt,
      approved: comments.approved
    }).from(comments).where(eq(comments.approved, false));

    const flaggedPosts = await db.select({
      id: blogPosts.id,
      type: sql<string>`'blog_post'`,
      content: blogPosts.content,
      authorId: blogPosts.authorId,
      createdAt: blogPosts.createdAt,
      approved: blogPosts.approved
    }).from(blogPosts).where(eq(blogPosts.approved, false));

    return [...pendingComments, ...flaggedPosts].sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getSecurityReports(): Promise<any[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const securityEvents = await db.select()
      .from(auditLogs)
      .where(and(
        gte(auditLogs.createdAt, twentyFourHoursAgo),
        or(
          eq(auditLogs.severity, 'critical'),
          eq(auditLogs.severity, 'error'),
          eq(auditLogs.category, 'security')
        )
      ))
      .orderBy(desc(auditLogs.createdAt));

    return securityEvents;
  }

  async bulkUpdateUsers(userIds: string[], updates: Partial<User>): Promise<User[]> {
    const updatedUsers: User[] = [];
    
    for (const userId of userIds) {
      const [updatedUser] = await db.update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();
      
      if (updatedUser) {
        updatedUsers.push(updatedUser);
        
        
        await this.createAuditLog({
          userId,
          action: 'bulk_user_update',
          resource: 'user',
          details: { updates, adminAction: true },
          severity: 'info',
          category: 'admin'
        });
      }
    }
    
    return updatedUsers;
  }

  async exportUserData(userId: string): Promise<any> {
    const [user, posts, drafts, bookmarks, userComments, userLikes, adminMsgs] = await Promise.all([
      this.getUser(userId),
      db.select().from(blogPosts).where(eq(blogPosts.authorId, userId)),
      this.getUserDrafts(userId),
      this.getUserBookmarks(userId),
      db.select().from(comments).where(eq(comments.authorId, userId)),
      this.getUserLikes(userId),
      this.getAdminMessages(userId)
    ]);

    return {
      user,
      content: {
        blogPosts: posts,
        drafts,
        bookmarks,
        comments: userComments,
        likes: userLikes
      },
      communications: {
        adminMessages: adminMsgs
      },
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  async createSystemBackup(): Promise<string> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    
    await this.logSystemHealth('backup', 'system_backup_created', {
      backupId,
      createdAt: new Date().toISOString(),
      status: 'completed'
    });

    return backupId;
  }

  
  async getAuditLogsSince(date: Date): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .where(gte(auditLogs.createdAt, date))
      .orderBy(desc(auditLogs.createdAt));
  }

  async getAuditLogsByAction(action: string): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .where(eq(auditLogs.action, action))
      .orderBy(desc(auditLogs.createdAt));
  }

  async getAuditLogsByResource(resource: string): Promise<AuditLog[]> {
    return await db.select().from(auditLogs)
      .where(eq(auditLogs.resource, resource))
      .orderBy(desc(auditLogs.createdAt));
  }

  async analyzeUserRiskScore(userId: string): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [recentLogs, failedLogins, user] = await Promise.all([
      this.getAuditLogsByUser(userId, 100),
      this.getRecentFailedLogins(24),
      this.getUser(userId)
    ]);

    if (!user) return 0;

    let riskScore = 0;
    
    
    const recentActivity = recentLogs.filter(log => 
      log.createdAt && new Date(log.createdAt) > twentyFourHoursAgo
    ).length;
    if (recentActivity > 50) riskScore += 30;
    else if (recentActivity > 20) riskScore += 15;
    else if (recentActivity > 10) riskScore += 5;

    
    const userFailedLogins = failedLogins.filter(f => f.email === user.email).length;
    if (userFailedLogins > 10) riskScore += 25;
    else if (userFailedLogins > 5) riskScore += 15;
    else if (userFailedLogins > 2) riskScore += 5;

    
    const adminAttempts = recentLogs.filter(log => 
      log.action.includes('admin') && log.severity === 'warning'
    ).length;
    if (adminAttempts > 5) riskScore += 35;
    else if (adminAttempts > 2) riskScore += 20;
    else if (adminAttempts > 0) riskScore += 10;

    
    const accountAge = user.createdAt ? 
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24) : 0;
    if (accountAge < 1) riskScore += 10;
    else if (accountAge < 7) riskScore += 5;

    return Math.min(100, Math.max(0, riskScore));
  }

  async detectSuspiciousActivity(userId: string): Promise<string[]> {
    const suspicious: string[] = [];
    const user = await this.getUser(userId);
    if (!user) return suspicious;

    const recentLogs = await this.getAuditLogsByUser(userId, 100);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    
    const recentActivity = recentLogs.filter(log => 
      new Date(log.createdAt || 0) > oneHourAgo
    );
    if (recentActivity.length > 40) {
      suspicious.push(`${recentActivity.length} actions in last hour`);
    }

    
    const adminAttempts = recentLogs.filter(log => 
      log.action.includes('admin') && log.severity === 'warning'
    );
    if (adminAttempts.length > 0) {
      suspicious.push(`${adminAttempts.length} admin access attempts`);
    }

    return suspicious;
  }

  
  async getComment(commentId: number): Promise<Comment | null> {
    const [comment] = await db.select().from(comments).where(eq(comments.id, commentId));
    return comment || null;
  }

  async getAllCommentsWithDetails(
    page: number = 1, 
    limit: number = 20,
    status?: string,
    search?: string,
    sortBy: string = 'createdAt',
    sortOrder: string = 'desc'
  ): Promise<Comment[]> {
    
    const conditions = [];
    
    if (status === 'pending') {
      conditions.push(eq(comments.approved, false));
    } else if (status === 'approved') {
      conditions.push(eq(comments.approved, true));
    } else if (status === 'flagged') {
      conditions.push(eq(comments.isModerated, true));
    }

    if (search) {
      conditions.push(ilike(comments.content, `%${search}%`));
    }

    
    const sortColumn = sortBy === 'updatedAt' ? comments.updatedAt : comments.createdAt;
    const orderClause = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    
    const offset = (page - 1) * limit;

    
    if (conditions.length > 0) {
      return await db.select()
        .from(comments)
        .where(and(...conditions))
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset);
    } else {
      return await db.select()
        .from(comments)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset);
    }
  }

  
  async editComment(commentId: number, newContent: string): Promise<Comment> {
    const [updatedComment] = await db
      .update(comments)
      .set({ 
        content: newContent,
        originalContent: newContent,
        updatedAt: new Date() 
      })
      .where(eq(comments.id, commentId))
      .returning();
    return updatedComment;
  }

  async deleteComment(commentId: number): Promise<void> {
    
    await db.delete(comments).where(eq(comments.id, commentId));
  }

  async blockComment(commentId: number): Promise<Comment> {
    const [blockedComment] = await db
      .update(comments)
      .set({ 
        content: '[Comment blocked by moderator]',
        updatedAt: new Date() 
      })
      .where(eq(comments.id, commentId))
      .returning();
    return blockedComment;
  }

  
  async approveContent(itemId: number): Promise<any> {
    const [updatedComment] = await db
      .update(comments)
      .set({ 
        approved: true,
        moderationAction: 'approved',
        updatedAt: new Date()
      })
      .where(eq(comments.id, itemId))
      .returning();
    return updatedComment;
  }

  async rejectContent(itemId: number, reason: string): Promise<any> {
    const [updatedComment] = await db
      .update(comments)
      .set({ 
        approved: false,
        moderationAction: 'rejected',
        originalContent: reason,
        updatedAt: new Date()
      })
      .where(eq(comments.id, itemId))
      .returning();
    return updatedComment;
  }

  async flagContent(itemId: number, reason: string): Promise<any> {
    const [updatedComment] = await db
      .update(comments)
      .set({ 
        isModerated: true,
        moderationAction: 'flagged',
        originalContent: reason,
        updatedAt: new Date()
      })
      .where(eq(comments.id, itemId))
      .returning();
    return updatedComment;
  }

  
  async getActiveSessionsCount(): Promise<number> {
    
    return 0; 
  }

  async getDatabaseConnectionCount(): Promise<number> {
    try {
      const result = await db.execute(sql`SELECT COUNT(*) as count FROM pg_stat_activity WHERE datname = current_database();`);
      return (result as any).rows[0]?.count || 0;
    } catch (error) {
      console.error('Failed to get database connection count:', error);
      return 0;
    }
  }



  async getBackupHistory(): Promise<any[]> {
    
    const backupLogs = await db.select()
      .from(systemHealth)
      .where(eq(systemHealth.metricType, 'backup'))
      .orderBy(desc(systemHealth.checkedAt))
      .limit(50);
    
    return backupLogs.map(log => ({
      id: log.id,
      type: log.status || 'backup',
      description: 'System backup',
      createdAt: log.checkedAt,
      status: log.status || 'completed'
    }));
  }

  
  async blockUser(userId: string): Promise<User> {
    const [blockedUser] = await db
      .update(users)
      .set({ 
        isActive: false,
        role: 'blocked',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    
    await this.createAuditLog({
      userId: 'admin_user',
      action: 'user_blocked',
      resource: 'user',
      details: { targetUserId: userId, reason: 'admin_action' },
      severity: 'warning'
    });
    
    return blockedUser;
  }

  async allowUser(userId: string): Promise<User> {
    const [allowedUser] = await db
      .update(users)
      .set({ 
        isActive: true,
        role: 'user',
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    
    await this.createAuditLog({
      userId: 'admin_user',
      action: 'user_allowed',
      resource: 'user',
      details: { targetUserId: userId, reason: 'admin_action' },
      severity: 'info'
    });
    
    return allowedUser;
  }

  async deleteUser(userId: string): Promise<void> {
    
    const user = await this.getUser(userId);
    
    
    await db.delete(userDrafts).where(eq(userDrafts.userId, userId));
    await db.delete(userBookmarks).where(eq(userBookmarks.userId, userId));
    await db.delete(userGithubTokens).where(eq(userGithubTokens.userId, userId));
    await db.delete(comments).where(eq(comments.authorId, userId));
    await db.delete(likes).where(eq(likes.userId, userId));
    
    
    await db.delete(users).where(eq(users.id, userId));
    
    
    await this.createAuditLog({
      userId: 'admin_user',
      action: 'user_deleted',
      resource: 'user',
      details: { 
        targetUserId: userId, 
        userEmail: user?.email || 'unknown',
        reason: 'admin_deletion'
      },
      severity: 'critical'
    });
  }

  
  async saveUserGithubToken(userId: string, token: string, scope?: string): Promise<UserGithubToken> {
    if (!validateGithubTokenFormat(token)) {
      throw new Error('Invalid GitHub token format');
    }

    const encryptedToken = encryptGithubToken(token);
    
    
    const existingToken = await db.select()
      .from(userGithubTokens)
      .where(eq(userGithubTokens.userId, userId))
      .limit(1);

    if (existingToken.length > 0) {
      
      const [updatedToken] = await db.update(userGithubTokens)
        .set({
          encryptedToken,
          tokenScope: scope || null,
          isValid: true,
          lastValidated: new Date(),
          updatedAt: new Date()
        })
        .where(eq(userGithubTokens.userId, userId))
        .returning();
      return updatedToken;
    } else {
      
      const [newToken] = await db.insert(userGithubTokens)
        .values({
          userId,
          encryptedToken,
          tokenScope: scope || null,
          isValid: true,
          lastValidated: new Date()
        })
        .returning();
      return newToken;
    }
  }

  async getUserGithubToken(userId: string): Promise<string | null> {
    const tokenRecord = await db.select()
      .from(userGithubTokens)
      .where(eq(userGithubTokens.userId, userId))
      .limit(1);

    if (tokenRecord.length === 0 || !tokenRecord[0].isValid) {
      return null;
    }

    try {
      return decryptGithubToken(tokenRecord[0].encryptedToken);
    } catch (error) {
      
      await db.update(userGithubTokens)
        .set({ isValid: false })
        .where(eq(userGithubTokens.userId, userId));
      return null;
    }
  }

  async validateUserGithubToken(userId: string): Promise<boolean> {
    const token = await this.getUserGithubToken(userId);
    if (!token) return false;

    try {
      
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'CyberSecurity-Platform'
        }
      });

      const isValid = response.ok;
      
      
      await db.update(userGithubTokens)
        .set({
          isValid,
          lastValidated: new Date()
        })
        .where(eq(userGithubTokens.userId, userId));

      return isValid;
    } catch (error) {
      await db.update(userGithubTokens)
        .set({ isValid: false })
        .where(eq(userGithubTokens.userId, userId));
      return false;
    }
  }

  async removeUserGithubToken(userId: string): Promise<void> {
    await db.delete(userGithubTokens)
      .where(eq(userGithubTokens.userId, userId));
  }

  async getUserGithubTokenStatus(userId: string): Promise<{
    hasToken: boolean;
    isValid: boolean;
    lastValidated: Date | null;
    scope: string | null;
  }> {
    const tokenRecord = await db.select({
      isValid: userGithubTokens.isValid,
      lastValidated: userGithubTokens.lastValidated,
      tokenScope: userGithubTokens.tokenScope
    })
      .from(userGithubTokens)
      .where(eq(userGithubTokens.userId, userId))
      .limit(1);

    if (tokenRecord.length === 0) {
      return {
        hasToken: false,
        isValid: false,
        lastValidated: null,
        scope: null
      };
    }

    return {
      hasToken: true,
      isValid: tokenRecord[0].isValid || false,
      lastValidated: tokenRecord[0].lastValidated,
      scope: tokenRecord[0].tokenScope
    };
  }

  async getUserGithubRepo(userId: string, repoId: number): Promise<any | null> {
    
    
    return {
      id: repoId,
      repoName: `Repository-${repoId}`,
      repoUrl: `https://github.com/user/repo-${repoId}`,
      repoDescription: 'Generated repository for blog post creation',
      language: 'JavaScript',
      stars: 0,
      forks: 0
    };
  }

  async generateBlogFromRepo(userId: string, repo: any): Promise<any> {
    
    const title = `Project Showcase: ${repo.repoName}`;
    const content = `# ${repo.repoName}

${repo.repoDescription || 'A comprehensive project showcasing modern development practices.'}

## Overview
This project demonstrates advanced implementation techniques and best practices in ${repo.language || 'software development'}.

## Key Features
- Modern architecture design
- Clean, maintainable code structure
- Comprehensive documentation
- Performance optimizations

## Technical Stack
- **Primary Language**: ${repo.language || 'Multiple'}
- **Repository**: [${repo.repoName}](${repo.repoUrl})
- **Stars**: ${repo.stars || 0}
- **Forks**: ${repo.forks || 0}

## Implementation Highlights
This project showcases several key aspects of professional software development:

1. **Code Quality**: Well-structured, documented, and tested code
2. **Architecture**: Scalable and maintainable system design
3. **Performance**: Optimized for speed and efficiency
4. **Documentation**: Comprehensive guides and API documentation

## Conclusion
${repo.repoName} represents a commitment to excellence in software development, demonstrating both technical proficiency and attention to detail.

---
*Generated from GitHub repository: ${repo.repoName}*`;

    
    const blogPost = await this.createUserDraft({
      userId,
      title,
      content,
      tags: [repo.language || 'Development', 'Project', 'Showcase'].filter(Boolean),
      excerpt: content.substring(0, 200) + '...',
      readingTime: Math.max(1, Math.ceil(content.split(/\s+/).length / 200)),
      isShared: false
    });

    return blogPost;
  }

  
  async getUserSiteData(userId: string): Promise<UserSiteData | null> {
    const result = await db.select()
      .from(userSiteData)
      .where(eq(userSiteData.userId, userId))
      .limit(1);
    
    if (result.length === 0) return null;
    
    const siteData = result[0];
    return {
      ...siteData,
      skills: siteData.skills ? JSON.parse(siteData.skills) : []
    };
  }

  async upsertUserSiteData(userId: string, data: Partial<InsertUserSiteData>): Promise<UserSiteData> {
    const skillsJson = data.skills ? JSON.stringify(data.skills) : null;
    
    const result = await db.insert(userSiteData)
      .values({
        userId,
        ...data,
        skills: skillsJson,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: userSiteData.userId,
        set: {
          ...data,
          skills: skillsJson,
          updatedAt: new Date()
        }
      })
      .returning();
    
    const insertedData = result[0];
    return {
      ...insertedData,
      skills: insertedData.skills ? JSON.parse(insertedData.skills) : []
    };
  }

  async getUserSiteDataByUsername(username: string): Promise<UserSiteData | null> {
    
    return await this.getUserSiteData(username);
  }

  
  async getUserLoginStats(userId: string): Promise<{ lastLogin: Date; loginCount: number } | null> {
    const loginLogs = await db.select()
      .from(auditLogs)
      .where(and(
        eq(auditLogs.userId, userId),
        eq(auditLogs.action, 'user_login')
      ))
      .orderBy(desc(auditLogs.createdAt));

    if (loginLogs.length === 0) return null;

    return {
      lastLogin: loginLogs[0].createdAt || new Date(),
      loginCount: loginLogs.length
    };
  }

  async getUserPreferences(userId: string): Promise<any> {
    
    
    return {
      emailNotifications: true,
      securityAlerts: true,
      blogCommentNotifications: true,
      blogLikeNotifications: true,
      theme: 'system',
      language: 'en',
      timezone: 'UTC'
    };
  }

  async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    
  }

  async getUserSecuritySettings(userId: string): Promise<any> {
    try {
      const [settings] = await db.select()
        .from(userSecuritySettings)
        .where(eq(userSecuritySettings.userId, userId));

      if (!settings) {
        const [newSettings] = await db.insert(userSecuritySettings)
          .values({ userId })
          .returning();
        return newSettings;
      }

      return settings;
    } catch (error) {
      console.error('Error fetching user security settings:', error);
      throw error;
    }
  }

  async updateUserSecuritySettings(userId: string, settings: any): Promise<void> {
    try {
      await db.insert(userSecuritySettings)
        .values({ userId, ...settings })
        .onConflictDoUpdate({
          target: userSecuritySettings.userId,
          set: { ...settings, updatedAt: new Date() }
        });

      await this.createAuditLog({
        userId,
        action: 'security_settings_updated',
        resource: 'user_settings',
        details: { updatedFields: Object.keys(settings) },
        severity: 'info',
        category: 'security'
      });
    } catch (error) {
      console.error('Error updating user security settings:', error);
      throw error;
    }
  }

  async getUserSessions(userId: string): Promise<any[]> {
    
    const loginLogs = await db.select()
      .from(auditLogs)
      .where(and(
        eq(auditLogs.userId, userId),
        eq(auditLogs.action, 'user_login')
      ))
      .orderBy(desc(auditLogs.createdAt))
      .limit(10);

    return loginLogs.map((log, index) => ({
      id: log.id.toString(),
      ipAddress: log.ipAddress || 'Unknown',
      userAgent: log.userAgent || 'Unknown',
      location: 'Unknown Location',
      isCurrent: index === 0,
      lastActivity: log.createdAt?.toISOString() || new Date().toISOString(),
      createdAt: log.createdAt?.toISOString() || new Date().toISOString()
    }));
  }

  async revokeUserSession(userId: string, sessionId: string): Promise<void> {
    try {
      await db.delete(sessions).where(eq(sessions.sid, sessionId));

      await this.createAuditLog({
        userId,
        action: 'session_revoked',
        resource: 'session',
        resourceId: sessionId,
        details: { sessionId },
        severity: 'info',
        category: 'security'
      });
    } catch (error) {
      console.error('Error revoking user session:', error);
      throw error;
    }
  }

  async getUserSecurityEvents(userId: string, limit: number = 50): Promise<any[]> {
    const events = await db.select()
      .from(auditLogs)
      .where(and(
        eq(auditLogs.userId, userId),
        or(
          eq(auditLogs.category, 'security'),
          eq(auditLogs.action, 'user_login'),
          eq(auditLogs.action, 'user_logout'),
          eq(auditLogs.action, 'password_changed'),
          eq(auditLogs.action, 'token_generated')
        )
      ))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    return events.map(event => ({
      id: event.id.toString(),
      type: event.action.includes('login') ? 'login' : 
            event.action.includes('token') ? 'token_generated' :
            event.severity === 'warning' ? 'suspicious_activity' : 'security_event',
      description: event.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      ipAddress: event.ipAddress || 'Unknown',
      userAgent: event.userAgent || 'Unknown',
      location: 'Unknown Location',
      timestamp: event.createdAt?.toISOString() || new Date().toISOString(),
      severity: event.severity || 'info',
      resolved: true
    }));
  }

  async generateUserApiToken(userId: string): Promise<{ id: string; token: string }> {
    try {
      const token = `rpl_${Math.random().toString(36).substr(2, 32)}${Date.now().toString(36)}`;
      const tokenPrefix = token.substring(0, 12);
      
      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const [apiToken] = await db.insert(userApiTokens)
        .values({
          userId,
          tokenHash,
          tokenPrefix,
          name: `API Token - ${new Date().toLocaleDateString()}`,
          isActive: true
        })
        .returning();

      await this.createAuditLog({
        userId,
        action: 'api_token_generated',
        resource: 'api_token',
        resourceId: apiToken.id.toString(),
        details: { tokenPrefix },
        severity: 'info',
        category: 'security'
      });

      return { id: apiToken.id.toString(), token };
    } catch (error) {
      console.error('Error generating API token:', error);
      throw error;
    }
  }

  async getUserNotificationSettings(userId: string): Promise<any> {
    try {
      const [settings] = await db.select()
        .from(userNotificationSettings)
        .where(eq(userNotificationSettings.userId, userId));

      if (!settings) {
        const [newSettings] = await db.insert(userNotificationSettings)
          .values({ userId })
          .returning();
        return newSettings;
      }

      return settings;
    } catch (error) {
      console.error('Error fetching user notification settings:', error);
      throw error;
    }
  }

  async updateUserNotificationSettings(userId: string, settings: any): Promise<void> {
    try {
      await db.insert(userNotificationSettings)
        .values({ userId, ...settings })
        .onConflictDoUpdate({
          target: userNotificationSettings.userId,
          set: { ...settings, updatedAt: new Date() }
        });

      await this.createAuditLog({
        userId,
        action: 'notification_settings_updated',
        resource: 'user_settings',
        details: { updatedFields: Object.keys(settings) },
        severity: 'info',
        category: 'system'
      });
    } catch (error) {
      console.error('Error updating user notification settings:', error);
      throw error;
    }
  }

  async getUserNotificationHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const userNotifications = await db.select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

      return userNotifications.map(notif => ({
        id: notif.id.toString(),
        type: notif.type || 'system',
        title: notif.title,
        message: notif.message,
        isRead: notif.isRead,
        timestamp: notif.createdAt?.toISOString() || new Date().toISOString(),
        action: notif.actionUrl ? {
          label: 'View Details',
          url: notif.actionUrl
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching user notification history:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async clearUserNotifications(userId: string): Promise<void> {
    try {
      await db.delete(notifications)
        .where(eq(notifications.userId, userId));

      await this.createAuditLog({
        userId,
        action: 'notifications_cleared',
        resource: 'notifications',
        details: { action: 'clear_all' },
        severity: 'info',
        category: 'system'
      });
    } catch (error) {
      console.error('Error clearing user notifications:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
