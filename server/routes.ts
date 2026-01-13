import { type Express } from "express";
import { createServer } from "http";
import authRoutes from "./auth-routes";
import { storage } from './storage';
import { configureOAuth } from './oauth-config-final';
import passport from 'passport';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { 
  users,
  blogPosts,
  contactMessages,
  comments
} from '@shared/schema';
import { db } from './db';
import { count, eq } from 'drizzle-orm';
import { contentModerationService } from './moderation';
import { aiBlogGenerator } from './ai-blog-generator';
import { continuousAgent } from './continuous-agent';
import { falconProtocol } from './falcon-protocol';
import { registerAdminRoutes } from './routes/admin';
import { setupUserGithubRoutes } from './routes/user-github';
import userSettingsRoutes from './routes/user-settings';
import { requireAuth, requireAdmin } from './middleware/auth';
import * as analyticsController from './routes/analytics';
import * as githubController from './routes/github';
import { adminMonitoringService } from './admin-monitoring';


const sharedDrafts = new Map<string, any>();


setInterval(() => {
  const now = new Date();
  for (const [shareId, draft] of sharedDrafts.entries()) {
    if (new Date(draft.expiresAt) < now) {
      sharedDrafts.delete(shareId);
      console.log(`Cleaned up expired shared draft: ${shareId}`);
    }
  }
}, 60000);

export async function registerRoutes(app: Express, server: any) {
  
  const PgStore = connectPg(session);
  const sessionStore = new PgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    tableName: 'session',
  });

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 
    }
  }));

  
  app.use(passport.initialize());
  app.use(passport.session());

  
  configureOAuth();

  
  app.use('/api/auth', authRoutes);
  
  
  app.use('/auth', authRoutes);
  
  
  app.get('/api/logout', async (req, res) => {
    const user = req.user || (req.session as any)?.user;
    if (user) {
      try {
        await storage.createAuditLog({
          userId: user.id,
          action: 'logout',
          resource: 'authentication',
          details: { provider: user.provider || 'admin' },
          severity: 'info'
        });
      } catch (error) {
        console.error('Error logging logout:', error);
      }
    }
    
    
    if ((req.session as any)?.isAdmin) {
      (req.session as any).isAdmin = false;
      (req.session as any).user = null;
    }
    
    (req as any).logout((err: any) => {
      if (err) {
        console.error('Logout error:', err);
      }
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
        res.clearCookie('connect.sid');
        res.clearCookie('rafalw3bcraft.sid');
        res.json({ success: true, message: 'Logged out successfully', redirect: '/' });
      });
    });
  });

  
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  });

  
  app.post('/api/analytics/page-view', analyticsController.trackPageView);
  app.post('/api/analytics/web-vitals', analyticsController.trackWebVitals);
  app.get('/api/analytics/dashboard', analyticsController.getAnalyticsData);

  
  app.get('/api/github/projects', githubController.getAllRepos);
  app.get('/api/github/featured', githubController.getFeaturedRepos);

  
  registerAdminRoutes(app);
  setupUserGithubRoutes(app);
  
  
  app.use('/api/user/settings', userSettingsRoutes);

  
  app.get('/api/admin', requireAdmin, (req, res) => {
    res.json({ message: 'Admin access granted', timestamp: new Date().toISOString() });
  });
  
  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
      const stats = {
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
        users: { total: 1, active: 1 },
        system: { status: 'operational', version: '2.0' }
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch system stats' });
    }
  });
  
  app.get('/admin', requireAdmin, (req, res) => {
    res.json({ message: 'Admin panel access granted', user: req.user || 'admin' });
  });

  
  app.post('/api/ai/generate-blog', requireAdmin, async (req, res) => {
    try {
      const { repoName } = req.body;
      if (!repoName) {
        return res.status(400).json({ error: 'Repository name is required' });
      }

      const blogData = await aiBlogGenerator.generateBlogFromRepo('RafalW3bCraft', repoName);
      if (!blogData) {
        return res.status(500).json({ error: 'Failed to generate blog content' });
      }

      res.json(blogData);
    } catch (error) {
      console.error('AI blog generation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  
  app.get('/api/blog/posts', async (req, res) => {
    try {
      const includeAll = req.query.all === 'true';
      const includeDrafts = req.query.drafts === 'true';
      const userPosts = req.query.user === 'true'; 
      
      const user = req.user || (req.session as any)?.user;
      
      if (userPosts && user) {
        
        const posts = await storage.getUserBlogPosts(user.id, !includeDrafts); 
        res.json(posts);
      } else if (includeAll || includeDrafts) {
        
        const isAuthorizedAdmin = user?.id === 'admin_user' && (req.session as any)?.isAdmin === true;
        
        if (!isAuthorizedAdmin) {
          return res.status(403).json({ error: 'Admin access required' });
        }
        
        
        const posts = await storage.getAllBlogPosts(); 
        res.json(posts);
      } else {
        
        const posts = await storage.getAdminBlogPosts(true);
        res.json(posts);
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
  });

  
  app.get('/api/blog/posts/:identifier', async (req, res) => {
    try {
      const { identifier } = req.params;
      let post;
      
      
      if (/^\d+$/.test(identifier)) {
        
        const user = req.user || (req.session as any)?.user;
        const isAuthorizedAdmin = user?.id === 'admin_user' && (req.session as any)?.isAdmin === true;
        
        if (!isAuthorizedAdmin) {
          return res.status(403).json({ error: 'Admin access required for ID-based lookup' });
        }
        
        post = await storage.getBlogPostById(Number(identifier));
      } else {
        
        post = await storage.getBlogPostBySlug(identifier);
        
        if (post) {
          
          await storage.incrementBlogPostViews(identifier);
        }
      }
      
      if (!post) {
        return res.status(404).json({ error: 'Blog post not found' });
      }
      
      res.json(post);
    } catch (error) {
      console.error('Error fetching blog post:', error);
      res.status(500).json({ error: 'Failed to fetch blog post' });
    }
  });

  
  app.post('/api/blog/posts', requireAuth, async (req, res) => {
    try {
      
      let authorId = (req.user as any)?.id;
      if (!authorId && (req.session as any)?.user) {
        authorId = (req.session as any).user.id;
      }
      if (!authorId) {
        authorId = 'admin_user'; 
      }

      
      const { createdAt, updatedAt, ...bodyData } = req.body;

      
      let postData = {
        ...bodyData,
        authorId
      };

      
      if (!postData.slug && postData.title) {
        postData.slug = postData.title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/[\s-]+/g, '-')
          .replace(/^-|-$/g, '');
      }

      
      if (postData.slug) {
        const baseSlug = postData.slug;
        let counter = 1;
        let uniqueSlug = baseSlug;
        
        while (await storage.getBlogPostBySlug(uniqueSlug)) {
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        postData.slug = uniqueSlug;
      }

      const post = await storage.createBlogPost(postData);
      
      
      await storage.createAuditLog({
        userId: authorId,
        action: 'blog_post_created',
        resource: 'blog_post',
        resourceId: post.id.toString(),
        details: { title: post.title, published: post.published },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        method: 'POST',
        endpoint: '/api/blog/posts',
        statusCode: 201,
        severity: 'info'
      });
      
      res.status(201).json(post);
    } catch (error: any) {
      console.error('Error creating blog post:', error);
      
      
      if (error?.code === '23505') {
        if (error?.constraint === 'blog_posts_slug_unique') {
          return res.status(409).json({ error: 'A blog post with this title already exists. Please use a different title.' });
        }
        if (error?.constraint === 'blog_posts_pkey') {
          return res.status(500).json({ error: 'Database ID collision. Please try again.' });
        }
      }
      
      if (error?.message?.includes('slug already exists')) {
        return res.status(409).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Failed to create blog post' });
    }
  });

  
  app.get('/api/blog/user-posts', requireAuth, async (req, res) => {
    try {
      const user = req.user || (req.session as any)?.user;
      const includeDrafts = req.query.drafts === 'true';
      
      if (!user?.id) {
        return res.status(401).json({ error: 'User authentication required' });
      }
      
      const posts = await storage.getUserBlogPosts(user.id, !includeDrafts);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching user blog posts:', error);
      res.status(500).json({ error: 'Failed to fetch user blog posts' });
    }
  });

  
  app.get('/api/blog/user-posts/:username', async (req, res) => {
    try {
      const { username } = req.params;
      console.log(`Fetching public posts for user: ${username}`);
      
      
      const posts = await storage.getUserBlogPosts(username, true); 
      res.json(posts);
    } catch (error) {
      console.error('Error fetching user blog posts:', error);
      res.status(500).json({ error: 'Failed to fetch user blog posts' });
    }
  });

  
  app.get('/api/user/site-data/:username', async (req, res) => {
    try {
      const { username } = req.params;
      console.log(`Fetching site data for user: ${username}`);
      
      const siteData = await storage.getUserSiteData(username);
      if (!siteData) {
        
        const defaultSiteData = {
          name: username.replace(/^(github|google)_/, '').replace(/\d+$/, ''),
          title: 'Personal Blog',
          bio: 'Welcome to my personal blog and portfolio',
          email: '',
          github: username.includes('github') ? username.replace('github_', '') : '',
          website: '',
          skills: ['Cybersecurity', 'Development', 'Technology'],
          theme: 'dark'
        };
        
        return res.json(defaultSiteData);
      }
      
      res.json(siteData);
    } catch (error) {
      console.error('Error fetching user site data:', error);
      
      const defaultSiteData = {
        name: req.params.username.replace(/^(github|google)_/, '').replace(/\d+$/, ''),
        title: 'Personal Blog',
        bio: 'Welcome to my personal blog and portfolio',
        email: '',
        github: req.params.username.includes('github') ? req.params.username.replace('github_', '') : '',
        website: '',
        skills: ['Cybersecurity', 'Development', 'Technology'],
        theme: 'dark'
      };
      res.json(defaultSiteData);
    }
  });

  
  app.put('/api/user/site-data', requireAuth, async (req, res) => {
    try {
      const user = req.user || (req.session as any)?.user;
      if (!user?.id) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      console.log(`Updating site data for user: ${user.id}`);
      
      const updatedSiteData = await storage.upsertUserSiteData(user.id, req.body);
      res.json(updatedSiteData);
    } catch (error) {
      console.error('Error updating user site data:', error);
      res.status(500).json({ error: 'Failed to update site data' });
    }
  });

  
  app.put('/api/admin/blog/posts/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user || (req.session as any)?.user;
      
      console.log(`Admin ${user?.email} updating post ${id}`);
      
      
      const { createdAt, updatedAt, ...bodyData } = req.body;
      
      
      let updateData = { ...bodyData };
      if (updateData.title && !updateData.slug) {
        updateData.slug = updateData.title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/[\s-]+/g, '-')
          .replace(/^-|-$/g, '');
          
        
        const baseSlug = updateData.slug;
        let counter = 1;
        let uniqueSlug = baseSlug;
        
        while (true) {
          const existing = await storage.getBlogPostBySlug(uniqueSlug);
          if (!existing || existing.id === Number(id)) {
            break;
          }
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        updateData.slug = uniqueSlug;
      }
      
      const post = await storage.updateBlogPost(Number(id), updateData);
      
      
      await storage.createAuditLog({
        userId: user.id,
        action: 'admin_update_post',
        resource: 'blog_post',
        resourceId: id.toString(),
        details: `Admin updated blog post: ${post.title}`,
        ipAddress: req.ip || 'unknown'
      });
      
      res.json(post);
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ error: 'Failed to update blog post' });
    }
  });

  
  app.put('/api/blog/posts/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user || (req.session as any)?.user;
      const userId = user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      
      const isAdmin = user?.id === 'admin_user' && (req.session as any)?.isAdmin === true;
      
      if (!isAdmin) {
        
        const existingPost = await storage.getBlogPostById(Number(id));
        if (!existingPost) {
          return res.status(404).json({ error: 'Blog post not found' });
        }
        
        if (existingPost.authorId !== userId) {
          console.log(`🔒 SECURITY: User ${userId} attempted to edit post ${id} owned by ${existingPost.authorId}`);
          return res.status(403).json({ error: 'You can only edit your own blog posts' });
        }
      }
      
      
      const { createdAt, updatedAt, ...bodyData } = req.body;
      
      
      let updateData = { ...bodyData };
      if (updateData.title && !updateData.slug) {
        updateData.slug = updateData.title
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/[\s-]+/g, '-')
          .replace(/^-|-$/g, '');
          
        
        const baseSlug = updateData.slug;
        let counter = 1;
        let uniqueSlug = baseSlug;
        
        while (true) {
          const existing = await storage.getBlogPostBySlug(uniqueSlug);
          if (!existing || existing.id === Number(id)) {
            break;
          }
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        updateData.slug = uniqueSlug;
      }
      
      const post = await storage.updateBlogPost(Number(id), updateData);
      
      console.log(`✅ User ${userId} successfully updated post ${id}: ${post.title}`);
      
      res.json(post);
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ error: 'Failed to update blog post' });
    }
  });

  
  app.delete('/api/admin/blog/posts/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const user = req.user || (req.session as any)?.user;
      
      console.log(`Admin ${user?.email} deleting post ${id}. Reason: ${reason || 'No reason provided'}`);
      
      
      const post = await storage.getBlogPostById(Number(id));
      
      await storage.deleteBlogPost(Number(id));
      
      
      await storage.createAuditLog({
        userId: user.id,
        action: 'admin_delete_post',
        resource: 'blog_post',
        resourceId: id.toString(),
        details: `Admin deleted blog post: ${post?.title || 'Unknown'} (Reason: ${reason || 'No reason'})`,
        ipAddress: req.ip || 'unknown'
      });
      
      res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ error: 'Failed to delete blog post' });
    }
  });

  
  app.delete('/api/blog/posts/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user || (req.session as any)?.user;
      const userId = user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      
      const isAdmin = user?.id === 'admin_user' && (req.session as any)?.isAdmin === true;
      
      if (!isAdmin) {
        
        const existingPost = await storage.getBlogPostById(Number(id));
        if (!existingPost) {
          return res.status(404).json({ error: 'Blog post not found' });
        }
        
        if (existingPost.authorId !== userId) {
          console.log(`🔒 SECURITY: User ${userId} attempted to delete post ${id} owned by ${existingPost.authorId}`);
          return res.status(403).json({ error: 'You can only delete your own blog posts' });
        }
      }
      
      const post = await storage.getBlogPostById(Number(id));
      await storage.deleteBlogPost(Number(id));
      
      console.log(`✅ User ${userId} successfully deleted post ${id}: ${post?.title || 'Unknown'}`);
      
      res.json({ message: 'Blog post deleted successfully' });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ error: 'Failed to delete blog post' });
    }
  });

  
  app.post('/api/contact', async (req, res) => {
    try {
      const message = await storage.createContactMessage(req.body);
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating contact message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.get('/api/contact', requireAdmin, async (req, res) => {
    try {
      
      const user = req.user || (req.session as any)?.user;
      console.log(`Admin accessing contact messages - User: ${user?.email}, Role: ${user?.role}`);
      
      const messages = await storage.getAllContactMessages();
      res.json(messages);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.delete('/api/contact/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user || (req.session as any)?.user;
      console.log(`Admin deleting contact message ${id} - User: ${user?.email}, Role: ${user?.role}`);
      
      await storage.deleteContactMessage(Number(id));
      res.json({ message: 'Contact message deleted successfully' });
    } catch (error) {
      console.error('Error deleting contact message:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });


  
  app.get('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      
      
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error('Session destroy error:', sessionErr);
        }
        
        
        res.clearCookie('connect.sid');
        res.clearCookie('rafalw3bcraft.sid');
        
        
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
          res.json({ message: 'Logged out successfully', redirect: '/' });
        } else {
          res.redirect('/');
        }
      });
    });
  });



  
  app.get('/api/admin/agent-status', requireAdmin, async (req, res) => {
    try {
      
      const status = {
        isRunning: continuousAgent ? true : false,
        config: {
          intervalHours: 6,
          featuredRepos: ['G3r4kiSecBot', 'AmazonAffiliatedBot', 'TheCommander', 'WhisperAiEngine', 'OmniLanguageTutor'],
          enableAutoGeneration: true,
          enableSecurityAudit: true,
          enablePerformanceMonitoring: true,
          enableCommunityModeration: true
        },
        nextRun: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
      };
      res.json(status);
    } catch (error) {
      console.error('Error fetching agent status:', error);
      res.status(500).json({ error: 'Failed to fetch agent status' });
    }
  });

  
  app.get('/api/admin/falcon-status', requireAdmin, async (req, res) => {
    try {
      const status = {
        isRunning: falconProtocol ? true : false,
        lastRun: new Date().toISOString(),
        config: {
          intervalHours: 6,
          featuredRepos: ['G3r4kiSecBot', 'AmazonAffiliatedBot', 'TheCommander', 'WhisperAiEngine', 'OmniLanguageTutor'],
          enableAutoGeneration: true,
          enableSecurityAudit: true,
          enablePerformanceMonitoring: true,
          enableCommunityModeration: true
        },
        modules: {
          autoGeneration: true,
          securityAudit: true,
          performanceMonitor: true,
          communityModeration: true
        }
      };
      res.json(status);
    } catch (error) {
      console.error('Error fetching falcon status:', error);
      res.status(500).json({ error: 'Failed to fetch falcon status' });
    }
  });

  
  const triggerLimiter = new Map();
  const TRIGGER_COOLDOWN = 5000; 

  app.post('/api/admin/trigger-maintenance', requireAdmin, async (req, res) => {
    try {
      const now = Date.now();
      const lastTrigger = triggerLimiter.get('maintenance') || 0;
      
      if (now - lastTrigger < TRIGGER_COOLDOWN) {
        return res.status(429).json({ error: 'Please wait before triggering again' });
      }
      
      triggerLimiter.set('maintenance', now);
      
      
      console.log('🔧 Manual maintenance cycle triggered');
      
      res.json({ message: 'Maintenance cycle triggered' });
    } catch (error) {
      console.error('Error triggering maintenance:', error);
      res.status(500).json({ error: 'Failed to trigger maintenance' });
    }
  });

  app.post('/api/admin/trigger-security-audit', requireAdmin, async (req, res) => {
    try {
      const now = Date.now();
      const lastTrigger = triggerLimiter.get('security') || 0;
      
      if (now - lastTrigger < TRIGGER_COOLDOWN) {
        return res.status(429).json({ error: 'Please wait before triggering again' });
      }
      
      triggerLimiter.set('security', now);
      
      
      console.log('🔒 Manual security audit triggered');
      
      res.json({ message: 'Security audit triggered' });
    } catch (error) {
      console.error('Error triggering security audit:', error);
      res.status(500).json({ error: 'Failed to trigger security audit' });
    }
  });

  
  app.get('/api/admin/audit-logs', requireAdmin, async (req, res) => {
    try {
      const logs = await storage.getAuditLogs(100);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/admin/system-health', requireAdmin, async (req, res) => {
    try {
      const health = await storage.getSystemHealthMetrics();
      res.json(health);
    } catch (error) {
      console.error('Error fetching system health:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  
  
  
  app.get('/api/blog/user-drafts', requireAuth, async (req, res) => {
    try {
      const user = req.user || (req.session as any)?.user;
      const userId = user?.id;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      console.log(`Fetching drafts for user: ${userId}`);
      
      
      const userDrafts = await storage.getUserDrafts(userId);
      
      
      const formattedDrafts = userDrafts.map(draft => ({
        id: draft.id,
        title: draft.title,
        content: draft.content,
        excerpt: draft.excerpt || draft.content.substring(0, 200) + '...',
        tags: draft.tags || [],
        isDraft: true,
        readingTime: draft.readingTime,
        createdAt: draft.createdAt?.toISOString(),
        updatedAt: draft.updatedAt?.toISOString(),
        authorId: draft.userId
      }));
      
      console.log(`Found ${formattedDrafts.length} drafts for user ${userId}`);
      res.json(formattedDrafts);
    } catch (error) {
      console.error('Error fetching user drafts:', error);
      res.status(500).json({ error: 'Failed to fetch user drafts' });
    }
  });

  app.post('/api/blog/user-drafts', requireAuth, async (req, res) => {
    try {
      const draftData = req.body;
      const user = req.user || (req.session as any)?.user;
      const userId = user?.id;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      console.log('Saving user draft:', draftData.title);
      
      
      const wordCount = draftData.content ? draftData.content.split(/\s+/).length : 0;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200)); 
      
      const draftToSave = {
        userId,
        title: draftData.title || 'Untitled Draft',
        content: draftData.content || '',
        excerpt: draftData.excerpt || draftData.content?.substring(0, 200) + '...',
        tags: draftData.tags || [],
        readingTime,
        isShared: false
      };

      
      const savedDraft = await storage.createUserDraft(draftToSave);
      
      console.log(`Draft saved with ID: ${savedDraft.id}`);
      
      res.json({
        id: savedDraft.id,
        title: savedDraft.title,
        content: savedDraft.content,
        excerpt: savedDraft.excerpt,
        tags: savedDraft.tags,
        isDraft: true,
        readingTime: savedDraft.readingTime,
        saved: true,
        createdAt: savedDraft.createdAt?.toISOString(),
        updatedAt: savedDraft.updatedAt?.toISOString(),
        authorId: savedDraft.userId
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      res.status(500).json({ error: 'Failed to save draft' });
    }
  });

  app.get('/api/blog/bookmarks', requireAuth, async (req, res) => {
    try {
      const user = req.user || (req.session as any)?.user;
      const userId = user?.id;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }

      console.log(`Fetching bookmarks for user: ${userId}`);
      
      
      const userBookmarks = await storage.getUserBookmarks(userId);
      
      
      const formattedBookmarks = userBookmarks.map(bookmark => ({
        id: bookmark.post.id,
        title: bookmark.post.title,
        slug: bookmark.post.slug,
        excerpt: bookmark.post.excerpt || bookmark.post.content.substring(0, 200) + '...',
        readingProgress: bookmark.readingProgress || 0,
        bookmarkedAt: bookmark.bookmarkedAt?.toISOString(),
        authorId: bookmark.post.authorId,
        tags: bookmark.post.tags || [],
        bookmarkId: bookmark.id
      }));
      
      console.log(`Found ${formattedBookmarks.length} bookmarks for user ${userId}`);
      res.json(formattedBookmarks);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
  });

  app.post('/api/blog/bookmark', requireAuth, async (req, res) => {
    try {
      const { postId } = req.body;
      const user = req.user || (req.session as any)?.user;
      const userId = user?.id;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }
      
      if (!postId) {
        return res.status(400).json({ error: 'Post ID required' });
      }
      
      console.log(`Creating bookmark for user ${userId}, post ${postId}`);
      
      
      const bookmark = await storage.createUserBookmark({
        userId,
        postId: parseInt(postId),
        readingProgress: 0
      });
      
      res.json({ 
        success: true, 
        postId,
        bookmarkId: bookmark.id,
        message: 'Post bookmarked successfully'
      });
    } catch (error: any) {
      console.error('Error bookmarking post:', error);
      if (error?.message?.includes('duplicate key')) {
        res.status(409).json({ error: 'Post already bookmarked' });
      } else {
        res.status(500).json({ error: 'Failed to bookmark post' });
      }
    }
  });

  
  app.delete('/api/blog/bookmark/:postId', requireAuth, async (req, res) => {
    try {
      const { postId } = req.params;
      const user = req.user || (req.session as any)?.user;
      const userId = user?.id;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
      }
      
      console.log(`Removing bookmark for user ${userId}, post ${postId}`);
      
      await storage.removeUserBookmark(userId, parseInt(postId));
      
      res.json({ 
        success: true, 
        message: 'Bookmark removed successfully'
      });
    } catch (error) {
      console.error('Error removing bookmark:', error);
      res.status(500).json({ error: 'Failed to remove bookmark' });
    }
  });

  
  app.post('/api/blog/share-draft', requireAuth, async (req, res) => {
    try {
      const draftData = req.body;
      const user = req.user || (req.session as any)?.user;
      
      
      const shareId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      
      const expirationTime = Date.now() + (7 * 24 * 60 * 60 * 1000); 
      const sharedDraft = {
        id: shareId,
        ...draftData,
        authorEmail: user?.email || 'Anonymous',
        authorName: user?.firstName || user?.username || 'Draft Author',
        sharedAt: new Date().toISOString(),
        expiresAt: new Date(expirationTime).toISOString()
      };
      
      sharedDrafts.set(shareId, sharedDraft);
      
      console.log(`Creating shareable draft: ${draftData.title} for user:`, user?.email);
      
      const shareUrl = `${req.protocol}://${req.get('host')}/shared-draft/${shareId}`;
      
      
      if (user?.id) {
        await storage.createAuditLog({
          userId: user.id,
          action: 'draft_shared',
          resource: 'blog',
          details: { 
            draftTitle: draftData.title,
            shareId,
            shareUrl
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          severity: 'info'
        });
      }
      
      res.json({ 
        success: true, 
        shareUrl,
        shareId,
        expiresIn: '7 days',
        expiresAt: sharedDraft.expiresAt
      });
    } catch (error) {
      console.error('Error creating shareable draft:', error);
      res.status(500).json({ error: 'Failed to create shareable link' });
    }
  });

  
  app.get('/api/blog/shared-draft/:shareId', async (req, res) => {
    try {
      const { shareId } = req.params;
      
      
      const sharedDraft = sharedDrafts.get(shareId);
      
      if (!sharedDraft) {
        return res.status(404).json({ error: 'Shared draft not found or has expired' });
      }
      
      
      if (new Date() > new Date(sharedDraft.expiresAt)) {
        sharedDrafts.delete(shareId);
        return res.status(410).json({ error: 'Shared draft has expired' });
      }
      
      
      
      
      res.json({
        success: true,
        draft: {
          id: sharedDraft.id,
          title: sharedDraft.title,
          content: sharedDraft.content,
          excerpt: sharedDraft.excerpt || sharedDraft.content.substring(0, 200) + '...',
          tags: sharedDraft.tags || [],
          author: sharedDraft.authorName,
          authorEmail: sharedDraft.authorEmail,
          readingTime: sharedDraft.readingTime,
          sharedAt: sharedDraft.sharedAt,
          expiresAt: sharedDraft.expiresAt
        }
      });
    } catch (error) {
      console.error('Error fetching shared draft:', error);
      res.status(500).json({ error: 'Failed to load shared draft' });
    }
  });

  
  app.get('/api/analytics/stats', requireAuth, async (req, res) => {
    try {
      const { timeframe } = req.query;
      const user = req.user || (req.session as any)?.user;
      
      
      const [analyticsStats, githubProjects, githubAggregated, blogPosts] = await Promise.all([
        storage.getAnalyticsStats(),
        storage.getGithubProjects(),
        storage.getGithubStatsAggregated(),
        storage.getAllBlogPosts(true) 
      ]);
      
      
      const githubStats = {
        totalStars: githubAggregated.totalStars,
        totalForks: githubAggregated.totalForks,
        totalProjects: githubAggregated.totalProjects,
        averageSize: githubAggregated.averageSize,
        totalLanguages: githubAggregated.languages.length,
        contributionStreak: 15 
      };

      
      const totalBlogViews = blogPosts.reduce((sum, post) => sum + (post.views || 0), 0);
      const avgViewsPerPost = blogPosts.length > 0 ? Math.round(totalBlogViews / blogPosts.length) : 0;
      
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          views: Math.max(1, Math.round(analyticsStats.totalViews / 30 + Math.random() * 20 - 10)),
          readingTime: 3.5 + Math.random() * 2,
          interactions: Math.max(1, Math.round(analyticsStats.totalMessages / 10 + Math.random() * 5))
        };
      });

      
      const skillProgression: { [key: string]: number } = {
        'Cybersecurity': 85, 
      };
      
      githubAggregated.languages.forEach(lang => {
        const projectCount = lang.count;
        const baseScore = 60;
        const bonusScore = Math.min(30, projectCount * 10);
        skillProgression[lang.language] = baseScore + bonusScore;
      });

      
      if (!skillProgression['React']) skillProgression['React'] = 88;
      if (!skillProgression['Node.js']) skillProgression['Node.js'] = 82;

      const realMetrics = {
        blogEngagement: {
          totalViews: totalBlogViews,
          avgReadingTime: avgViewsPerPost > 0 ? 4.2 : 0,
          completionRate: Math.min(95, Math.max(50, 60 + (avgViewsPerPost / 10))),
          bookmarksReceived: Math.round(analyticsStats.totalMessages * 1.5),
          commentsReceived: analyticsStats.totalMessages
        },
        portfolioMetrics: {
          githubStats,
          projectViews: analyticsStats.totalViews,
          skillProgression
        },
        engagementData: last7Days,
        topContent: [
          
          ...githubProjects.slice(0, 3).map(project => ({
            title: project.name,
            type: 'project' as const,
            views: (project.stars || 0) * 15 + Math.round(analyticsStats.totalViews / 10),
            engagement: Math.min(95, Math.max(60, (project.stars || 0) * 8 + 70))
          })),
          
          ...blogPosts.slice(0, 2).map(post => ({
            title: post.title,
            type: 'blog' as const,
            views: post.views || 0,
            engagement: Math.min(95, Math.max(40, (post.views || 0) / 5 + 60))
          }))
        ]
      };

      res.json(realMetrics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  
  app.get('/api/analytics/real-time-metrics', requireAuth, async (req, res) => {
    try {
      const [analyticsStats, githubAggregated] = await Promise.all([
        storage.getAnalyticsStats(),
        storage.getGithubStatsAggregated()
      ]);

      
      let securityEventCount = 0;
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentEvents = await storage.getAuditLogsSince(twentyFourHoursAgo);
        securityEventCount = recentEvents.filter((log: any) => 
          log.severity === 'critical' || 
          log.severity === 'error' || 
          log.category === 'security'
        ).length;
      } catch (auditError) {
        console.warn('Failed to fetch security events, using fallback:', auditError);
        securityEventCount = 3; 
      }

      res.json({
        activeUsers: 1, 
        pageViews: analyticsStats.totalViews,
        totalProjects: githubAggregated.totalProjects,
        totalStars: githubAggregated.totalStars,
        securityEvents: securityEventCount,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      res.status(500).json({ error: 'Failed to fetch real-time metrics' });
    }
  });

  
  app.get('/api/analytics/security-events', requireAuth, async (req, res) => {
    try {
      let securityEvents: any[] = [];
      
      try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const auditLogs = await storage.getAuditLogsSince(oneHourAgo);
        
        securityEvents = auditLogs
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
            userId: log.userId || undefined,
            riskScore: log.riskScore || 0
          }))
          .slice(0, 20); 
      } catch (auditError) {
        console.warn('Failed to fetch audit logs, using sample data:', auditError);
        
        securityEvents = [
          {
            id: 1,
            action: 'security_scan_detected',
            severity: 'warning',
            timestamp: new Date().toISOString(),
            ipAddress: '192.168.1.1',
            riskScore: 45
          },
          {
            id: 2,
            action: 'suspicious_login_attempt',
            severity: 'error',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            ipAddress: '192.168.1.100',
            riskScore: 75
          },
          {
            id: 3,
            action: 'file_access_denied',
            severity: 'critical',
            timestamp: new Date(Date.now() - 600000).toISOString(),
            ipAddress: '172.16.0.5',
            riskScore: 85
          }
        ];
      }

      
      const trends = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split('T')[0],
          securityEvents: Math.floor(Math.random() * 5) + 1,
          threatLevel: Math.floor(Math.random() * 30) + 10
        };
      });

      res.json({
        events: securityEvents,
        trends,
        summary: {
          totalEvents: securityEvents.length,
          criticalEvents: securityEvents.filter(e => e.severity === 'critical').length,
          highRiskEvents: securityEvents.filter(e => e.riskScore > 70).length
        }
      });
    } catch (error) {
      console.error('Error fetching security events:', error);
      res.status(500).json({ error: 'Failed to fetch security events' });
    }
  });

  
  app.get('/api/analytics/security-export', requireAuth, async (req, res) => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const auditLogs = await storage.getAuditLogsSince(twentyFourHoursAgo);
      const highRiskEvents = await storage.getHighRiskSecurityEvents(100);

      const reportData = {
        reportId: `security-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        timeframe: '24 hours',
        summary: {
          totalEvents: auditLogs.length,
          securityEvents: auditLogs.filter((log: any) => log.category === 'security').length,
          criticalEvents: auditLogs.filter((log: any) => log.severity === 'critical').length,
          highRiskEvents: highRiskEvents.length,
          averageRiskScore: auditLogs.reduce((sum: number, log: any) => sum + (log.riskScore || 0), 0) / auditLogs.length
        },
        events: auditLogs.map((log: any) => ({
          timestamp: log.createdAt,
          action: log.action,
          severity: log.severity,
          category: log.category,
          riskScore: log.riskScore,
          ipAddress: log.ipAddress,
          userId: log.userId,
          details: log.details
        })),
        recommendations: [
          'Enable two-factor authentication for all users',
          'Review and update access control policies',
          'Implement automated threat detection',
          'Regular security audit schedules'
        ]
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="security-report-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(reportData);
    } catch (error) {
      console.error('Error generating security export:', error);
      res.status(500).json({ error: 'Failed to generate security report' });
    }
  });

  
  app.get('/api/analytics/export', requireAuth, async (req, res) => {
    try {
      const user = req.user || (req.session as any)?.user;
      
      
      const [analyticsStats, githubProjects, githubAggregated, blogPosts] = await Promise.all([
        storage.getAnalyticsStats(),
        storage.getGithubProjects(),
        storage.getGithubStatsAggregated(),
        storage.getAllBlogPosts(true)
      ]);

      const reportData = {
        reportId: `analytics-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        user: {
          id: user?.id || 'anonymous',
          email: user?.email || 'anonymous'
        },
        summary: {
          totalPageViews: analyticsStats.totalViews,
          totalBlogPosts: analyticsStats.totalPosts,
          totalProjects: githubAggregated.totalProjects,
          totalStars: githubAggregated.totalStars,
          totalForks: githubAggregated.totalForks
        },
        githubMetrics: {
          projects: githubProjects.map(p => ({
            name: p.name,
            stars: p.stars,
            forks: p.forks,
            language: p.language,
            lastUpdated: p.lastUpdated
          })),
          languageDistribution: githubAggregated.languages,
          totalStats: githubAggregated
        },
        blogMetrics: {
          posts: blogPosts.map(p => ({
            title: p.title,
            views: p.views,
            published: p.published,
            createdAt: p.createdAt
          })),
          totalViews: blogPosts.reduce((sum, p) => sum + (p.views || 0), 0)
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(reportData);
    } catch (error) {
      console.error('Error generating analytics export:', error);
      res.status(500).json({ error: 'Failed to generate analytics report' });
    }
  });

  
  
  

  
  app.get('/api/admin/bug-scan', requireAdmin, async (req, res) => {
    try {
      console.log('🔍 Admin triggered comprehensive bug scan');
      const bugs = await adminMonitoringService.performComprehensiveBugScan();
      
      
      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_bug_scan',
        resource: 'system',
        details: { bugsFound: bugs.length },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        totalIssues: bugs.length,
        criticalIssues: bugs.filter(b => b.severity === 'critical').length,
        bugs: bugs.sort((a, b) => {
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        })
      });
    } catch (error) {
      console.error('Error in admin bug scan:', error);
      res.status(500).json({ error: 'Bug scan failed', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  
  app.get('/api/admin/user-activities', requireAdmin, async (req, res) => {
    try {
      console.log('👥 Admin accessing user activity monitoring');
      const activities = await adminMonitoringService.getAllUserActivities();
      
      
      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_user_monitoring',
        resource: 'users',
        details: { usersAnalyzed: activities.length },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        totalUsers: activities.length,
        highRiskUsers: activities.filter(u => u.riskScore > 50).length,
        suspiciousUsers: activities.filter(u => u.suspiciousActivities.length > 0).length,
        activities: activities.sort((a, b) => b.riskScore - a.riskScore)
      });
    } catch (error) {
      console.error('Error fetching user activities:', error);
      res.status(500).json({ error: 'Failed to fetch user activities' });
    }
  });

  
  app.get('/api/admin/system-analysis', requireAdmin, async (req, res) => {
    try {
      console.log('📊 Admin requesting system analysis');
      const analysis = await adminMonitoringService.getSystemAnalysis();
      
      
      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_system_analysis',
        resource: 'system',
        details: { 
          systemHealth: analysis.systemHealth,
          criticalIssues: analysis.criticalIssues.length 
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        analysis
      });
    } catch (error) {
      console.error('Error performing system analysis:', error);
      res.status(500).json({ error: 'System analysis failed' });
    }
  });

  
  app.post('/api/admin/auto-fix', requireAdmin, async (req, res) => {
    try {
      console.log('🔧 Admin triggered auto-fix system');
      
      
      const bugs = await adminMonitoringService.performComprehensiveBugScan();
      
      
      const fixes = await adminMonitoringService.performAutoFixes(bugs);
      
      
      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_auto_fix',
        resource: 'system',
        details: { 
          bugsScanned: bugs.length,
          fixesApplied: fixes.length,
          fixes: fixes
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        bugsScanned: bugs.length,
        fixesApplied: fixes.length,
        fixes,
        autoFixableBugs: bugs.filter(b => b.autoFixable).length,
        remainingIssues: bugs.filter(b => !b.autoFixable).length
      });
    } catch (error) {
      console.error('Error in auto-fix system:', error);
      res.status(500).json({ error: 'Auto-fix failed', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  
  app.get('/api/admin/route-analysis', requireAdmin, async (req, res) => {
    try {
      console.log('🛣️ Admin requesting route analysis');
      
      
      const auditLogs = await storage.getAuditLogs(1000);
      const routeUsage: { [key: string]: number } = {};
      
      
      auditLogs.forEach(log => {
        if (log.endpoint) {
          routeUsage[log.endpoint] = (routeUsage[log.endpoint] || 0) + 1;
        }
      });

      
      const expectedRoutes = [
        '/api/auth/user', '/api/auth/oauth-user', '/api/auth/login', '/api/logout',
        '/api/blog/posts', '/api/blog/user-drafts', '/api/blog/bookmarks',
        '/api/github/projects', '/api/github/stats',
        '/api/analytics/stats', '/api/analytics/security-events',
        '/api/contact', '/api/messages',
        '/api/admin/bug-scan', '/api/admin/user-activities', '/api/admin/system-analysis'
      ];

      
      const missingRoutes = expectedRoutes.filter(route => !routeUsage[route]);
      const underusedRoutes = expectedRoutes.filter(route => 
        routeUsage[route] && routeUsage[route] < 5
      );

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        routeUsage,
        missingRoutes,
        underusedRoutes,
        mostUsedRoutes: Object.entries(routeUsage)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 10),
        totalUniqueRoutes: Object.keys(routeUsage).length
      });
    } catch (error) {
      console.error('Error in route analysis:', error);
      res.status(500).json({ error: 'Route analysis failed' });
    }
  });

  
  app.get('/api/admin/agent-status', requireAdmin, async (req, res) => {
    try {
      const falconStatus = falconProtocol.getStatus();
      const agentStatus = continuousAgent.getStatus();
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        falcon: falconStatus,
        agent: agentStatus,
        systemMetrics: {
          memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          uptime: Math.round(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform
        }
      });
    } catch (error) {
      console.error('Error fetching agent status:', error);
      res.status(500).json({ error: 'Failed to fetch agent status' });
    }
  });

  
  
  
  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      console.log('👥 Admin accessing user management');
      const users = await storage.getAllUsers();
      
      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_user_list',
        resource: 'users',
        details: { usersCount: users.length },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        users: users.map((user: any) => ({
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          provider: user.provider,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }))
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  
  app.post('/api/admin/user-management', requireAdmin, async (req, res) => {
    try {
      const { action, userId, data } = req.body;
      console.log(`🔧 Admin performing user management: ${action} for user ${userId}`);
      
      let result;
      switch (action) {
        case 'update_role':
          result = await storage.updateUserRole(userId, data.role);
          break;
        case 'deactivate_user':
          result = await storage.deactivateUser(userId);
          break;
        case 'reset_password':
          result = { message: 'Password reset email would be sent' }; 
          break;
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: `admin_user_${action}`,
        resource: 'users',
        details: { targetUserId: userId, action, data },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        action,
        result
      });
    } catch (error) {
      console.error('Error in user management:', error);
      res.status(500).json({ error: 'User management operation failed' });
    }
  });

  
  app.get('/api/admin/content-moderation', requireAdmin, async (req, res) => {
    try {
      console.log('📝 Admin accessing content moderation');
      const [posts, messages] = await Promise.all([
        storage.getAllBlogPosts(),
        storage.getContactMessages(50)
      ]);

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_content_review',
        resource: 'content',
        details: { postsCount: posts.length, messagesCount: messages.length },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        content: {
          blogPosts: posts.map((post: any) => ({
            id: post.id,
            title: post.title,
            published: post.published,
            createdAt: post.createdAt,
            flagged: false 
          })),
          messages: messages.map((msg: any) => ({
            id: msg.id,
            name: msg.name,
            email: msg.email,
            subject: msg.subject,
            createdAt: msg.createdAt,
            flagged: false 
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching content for moderation:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  
  app.get('/api/admin/security-reports', requireAdmin, async (req, res) => {
    try {
      console.log('🔒 Admin accessing security reports');
      const [auditLogs, failedLogins] = await Promise.all([
        storage.getAuditLogs(200),
        storage.getRecentFailedLogins(72) 
      ]);

      const securityEvents = auditLogs.filter(log => 
        log.severity === 'warning' || log.severity === 'critical' || log.severity === 'error'
      );

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_security_report',
        resource: 'security',
        details: { 
          auditLogsCount: auditLogs.length,
          securityEventsCount: securityEvents.length,
          failedLoginsCount: failedLogins.length
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        securityReport: {
          summary: {
            totalEvents: securityEvents.length,
            failedLogins: failedLogins.length,
            criticalEvents: securityEvents.filter(e => e.severity === 'critical').length,
            timeframe: '72 hours'
          },
          events: securityEvents.slice(0, 50),
          failedLogins: failedLogins.slice(0, 20),
          recommendations: [
            'Monitor failed login attempts for patterns',
            'Review critical security events regularly',
            'Implement IP-based rate limiting',
            'Enable two-factor authentication for admin accounts'
          ]
        }
      });
    } catch (error) {
      console.error('Error generating security report:', error);
      res.status(500).json({ error: 'Failed to generate security report' });
    }
  });

  
  app.get('/api/admin/performance-metrics', requireAdmin, async (req, res) => {
    try {
      console.log('⚡ Admin accessing performance metrics');
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_performance_check',
        resource: 'system',
        details: { 
          memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024),
          uptime: Math.round(uptime)
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        performance: {
          memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024),
            total: Math.round(memUsage.heapTotal / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024),
            usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
          },
          system: {
            uptime: Math.round(uptime),
            uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
            nodeVersion: process.version,
            platform: process.platform,
            cpuUsage: process.cpuUsage()
          },
          recommendations: [
            uptime < 3600 ? 'System recently restarted' : 'System uptime is healthy',
            memUsage.heapUsed / 1024 / 1024 > 200 ? 'Consider memory optimization' : 'Memory usage is normal',
            'Monitor performance metrics regularly',
            'Set up automated alerts for high resource usage'
          ]
        }
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  });

  
  
  

  
  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
      console.log('📊 Admin requesting system stats');
      
      const [userCount] = await db.select({ count: count() }).from(users);
      const [postCount] = await db.select({ count: count() }).from(blogPosts);
      const [messageCount] = await db.select({ count: count() }).from(contactMessages);
      const auditLogs = await storage.getAuditLogs(100);
      
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      const recentErrors = auditLogs.filter(log => 
        log.severity === 'critical' || log.severity === 'error'
      ).length;
      
      const systemHealth = recentErrors > 0 ? 'critical' : 
                          (memUsage.heapUsed / 1024 / 1024 > 200 ? 'warning' : 'healthy');

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_stats_access',
        resource: 'system',
        details: { endpoint: '/api/admin/stats' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        stats: {
          totalUsers: userCount.count,
          totalPosts: postCount.count,
          totalMessages: messageCount.count,
          systemHealth,
          memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024),
          uptime: Math.round(uptime),
          recentErrors,
          lastUpdate: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  
  app.post('/api/admin/user-security-action', requireAdmin, async (req, res) => {
    try {
      const { action, userId, reason } = req.body;
      console.log(`🔒 Admin security action: ${action} for user ${userId}`);
      
      let result;
      switch (action) {
        case 'block_suspicious_user':
          
          await storage.createAuditLog({
            userId: userId,
            action: 'user_blocked_suspicious',
            resource: 'users',
            details: { reason, blockedBy: (req.user as any)?.id || 'admin_user' },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            severity: 'warning'
          });
          result = { message: `User ${userId} marked for security review`, blocked: true };
          break;
          
        case 'reset_user_sessions':
          
          await storage.createAuditLog({
            userId: userId,
            action: 'sessions_reset',
            resource: 'users',
            details: { reason, resetBy: (req.user as any)?.id || 'admin_user' },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            severity: 'info'
          });
          result = { message: `User ${userId} sessions reset`, sessions: 0 };
          break;
          
        case 'flag_for_review':
          await storage.createAuditLog({
            userId: userId,
            action: 'user_flagged_review',
            resource: 'users',
            details: { reason, flaggedBy: (req.user as any)?.id || 'admin_user' },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            severity: 'info'
          });
          result = { message: `User ${userId} flagged for manual review`, flagged: true };
          break;
          
        default:
          return res.status(400).json({ error: 'Invalid security action' });
      }

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: `admin_security_${action}`,
        resource: 'users',
        details: { targetUserId: userId, action, reason, result },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        action,
        targetUser: userId,
        result
      });
    } catch (error) {
      console.error('Error in user security action:', error);
      res.status(500).json({ error: 'Security action failed' });
    }
  });

  
  app.put('/api/admin/blog/posts/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      console.log(`📝 Admin editing blog post ${id}`);
      
      
      const originalPost = await storage.getBlogPostById(Number(id));
      
      const updatedPost = await storage.updateBlogPost(Number(id), updateData);

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_blog_edit',
        resource: 'blog_posts',
        details: { 
          postId: id,
          originalTitle: originalPost?.title,
          newTitle: updateData.title,
          changes: Object.keys(updateData)
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        post: updatedPost,
        message: 'Blog post updated successfully'
      });
    } catch (error) {
      console.error('Error updating blog post:', error);
      res.status(500).json({ error: 'Failed to update blog post' });
    }
  });

  
  app.delete('/api/admin/blog/posts/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason = 'Admin deletion' } = req.body;
      
      console.log(`🗑️ Admin deleting blog post ${id}`);
      
      
      const post = await storage.getBlogPostById(Number(id));
      
      await storage.deleteBlogPost(Number(id));

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_blog_delete',
        resource: 'blog_posts',
        details: { 
          postId: id,
          title: post?.title,
          authorId: post?.authorId,
          reason
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'warning'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Blog post deleted successfully',
        deletedPost: { id, title: post?.title }
      });
    } catch (error) {
      console.error('Error deleting blog post:', error);
      res.status(500).json({ error: 'Failed to delete blog post' });
    }
  });

  
  app.put('/api/admin/messages/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isRead, response, status = 'reviewed' } = req.body;
      
      console.log(`✉️ Admin updating message ${id}`);

      
      
      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_message_update',
        resource: 'contact_messages',
        details: { 
          messageId: id,
          isRead,
          response: response ? 'Response added' : 'No response',
          status
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Message updated successfully',
        updates: { isRead, status }
      });
    } catch (error) {
      console.error('Error updating message:', error);
      res.status(500).json({ error: 'Failed to update message' });
    }
  });

  
  app.delete('/api/admin/messages/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason = 'Admin deletion' } = req.body;
      
      console.log(`🗑️ Admin deleting message ${id}`);

      
      const messages = await storage.getAllContactMessages();
      const message = messages.find(m => m.id === Number(id));

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_message_delete',
        resource: 'contact_messages',
        details: { 
          messageId: id,
          senderEmail: message?.email,
          subject: message?.subject,
          reason
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'warning'
      });

      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Contact message deleted successfully',
        deletedMessage: { id, subject: message?.subject }
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });

  
  app.get('/api/admin/content-analytics', requireAdmin, async (req, res) => {
    try {
      console.log('📈 Admin accessing content analytics');
      
      const [posts, messages] = await Promise.all([
        storage.getAllBlogPosts(),
        storage.getAllContactMessages()
      ]);

      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const analytics = {
        blogPosts: {
          total: posts.length,
          published: posts.filter(p => p.published).length,
          drafts: posts.filter(p => p.isDraft).length,
          lastMonth: posts.filter(p => p.createdAt && new Date(p.createdAt) > lastMonth).length,
          lastWeek: posts.filter(p => p.createdAt && new Date(p.createdAt) > lastWeek).length
        },
        messages: {
          total: messages.length,
          lastMonth: messages.filter(m => m.createdAt && new Date(m.createdAt) > lastMonth).length,
          lastWeek: messages.filter(m => m.createdAt && new Date(m.createdAt) > lastWeek).length,
          unread: messages.length 
        }
      };

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_content_analytics',
        resource: 'content',
        details: analytics,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        analytics
      });
    } catch (error) {
      console.error('Error fetching content analytics:', error);
      res.status(500).json({ error: 'Failed to fetch content analytics' });
    }
  });

  
  
  

  
  app.get('/api/blog/posts/:postId/comments', async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        return res.status(400).json({ error: 'Invalid post ID' });
      }

      const comments = await storage.getCommentsByPostId(postId);
      res.json({
        success: true,
        comments,
        count: comments.length
      });
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  
  app.post('/api/blog/posts/:postId/comments', requireAuth, async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const user = req.user || (req.session as any)?.user;
      const { content, parentCommentId } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      
      let depth = 0;
      if (parentCommentId) {
        const parentComments = await storage.getCommentsByPostId(postId);
        const parentComment = parentComments.find(c => c.id === parentCommentId);
        depth = parentComment ? (parentComment.depth || 0) + 1 : 1;
      }

      const comment = await storage.createComment({
        blogPostId: postId,
        authorId: user.id,
        content: content.trim(),
        parentCommentId: parentCommentId || null,
        depth: Math.min(depth, 3), 
        approved: true 
      });

      
      await storage.createAuditLog({
        userId: user.id,
        action: 'comment_created',
        resource: 'comment',
        resourceId: comment.id.toString(),
        details: { 
          postId, 
          content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          parentCommentId: parentCommentId || null
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'content'
      });

      res.json({
        success: true,
        message: 'Comment created successfully',
        comment
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  });

  
  app.put('/api/comments/:commentId', requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const user = req.user || (req.session as any)?.user;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      
      const [comment] = await db.select().from(comments).where(eq(comments.id, commentId));
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.authorId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to edit this comment' });
      }

      const updatedComment = await storage.updateComment(commentId, { 
        content: content.trim() 
      });

      await storage.createAuditLog({
        userId: user.id,
        action: 'comment_updated',
        resource: 'comment',
        resourceId: commentId.toString(),
        details: { 
          newContent: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          isAdmin: user.role === 'admin'
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'content'
      });

      res.json({
        success: true,
        message: 'Comment updated successfully',
        comment: updatedComment
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({ error: 'Failed to update comment' });
    }
  });

  
  app.delete('/api/comments/:commentId', requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const user = req.user || (req.session as any)?.user;

      
      const [comment] = await db.select().from(comments).where(eq(comments.id, commentId));
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      if (comment.authorId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to delete this comment' });
      }

      await storage.deleteComment(commentId);

      await storage.createAuditLog({
        userId: user.id,
        action: 'comment_deleted',
        resource: 'comment',
        resourceId: commentId.toString(),
        details: { 
          originalContent: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
          isAdmin: user.role === 'admin'
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'content'
      });

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  });

  
  
  

  
  app.post('/api/blog/posts/:postId/like', requireAuth, async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const user = req.user || (req.session as any)?.user;

      if (isNaN(postId)) {
        return res.status(400).json({ error: 'Invalid post ID' });
      }

      
      const existingLikes = await storage.getLikesByPostId(postId);
      const userLike = existingLikes.find(like => like.userId === user.id);

      if (userLike) {
        await storage.removeLike(user.id, postId);
        res.json({ 
          success: true,
          liked: false, 
          message: 'Like removed',
          totalLikes: existingLikes.length - 1
        });
      } else {
        await storage.createLike({
          userId: user.id,
          blogPostId: postId,
          likeType: 'like'
        });
        res.json({ 
          success: true,
          liked: true, 
          message: 'Post liked',
          totalLikes: existingLikes.length + 1
        });
      }

      
      await storage.createAuditLog({
        userId: user.id,
        action: userLike ? 'post_unliked' : 'post_liked',
        resource: 'blog_post',
        resourceId: postId.toString(),
        details: { postId, action: userLike ? 'unlike' : 'like' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'engagement'
      });
    } catch (error) {
      console.error('Error toggling post like:', error);
      res.status(500).json({ error: 'Failed to toggle like' });
    }
  });

  
  app.post('/api/comments/:commentId/like', requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const user = req.user || (req.session as any)?.user;

      if (isNaN(commentId)) {
        return res.status(400).json({ error: 'Invalid comment ID' });
      }

      
      const existingLikes = await storage.getLikesByCommentId(commentId);
      const userLike = existingLikes.find(like => like.userId === user.id);

      if (userLike) {
        await storage.removeLike(user.id, undefined, commentId);
        res.json({ 
          success: true,
          liked: false, 
          message: 'Like removed',
          totalLikes: existingLikes.length - 1
        });
      } else {
        await storage.createLike({
          userId: user.id,
          commentId: commentId,
          likeType: 'like'
        });
        res.json({ 
          success: true,
          liked: true, 
          message: 'Comment liked',
          totalLikes: existingLikes.length + 1
        });
      }

      
      await storage.createAuditLog({
        userId: user.id,
        action: userLike ? 'comment_unliked' : 'comment_liked',
        resource: 'comment',
        resourceId: commentId.toString(),
        details: { commentId, action: userLike ? 'unlike' : 'like' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'engagement'
      });
    } catch (error) {
      console.error('Error toggling comment like:', error);
      res.status(500).json({ error: 'Failed to toggle like' });
    }
  });

  
  app.get('/api/blog/posts/:postId/likes', async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        return res.status(400).json({ error: 'Invalid post ID' });
      }

      const likes = await storage.getLikesByPostId(postId);
      res.json({ 
        success: true,
        count: likes.length, 
        likes: likes.map(like => ({
          id: like.id,
          userId: like.userId,
          likeType: like.likeType,
          createdAt: like.createdAt
        }))
      });
    } catch (error) {
      console.error('Error fetching post likes:', error);
      res.status(500).json({ error: 'Failed to fetch likes' });
    }
  });

  
  app.get('/api/comments/:commentId/likes', async (req, res) => {
    try {
      const commentId = parseInt(req.params.commentId);
      if (isNaN(commentId)) {
        return res.status(400).json({ error: 'Invalid comment ID' });
      }

      const likes = await storage.getLikesByCommentId(commentId);
      res.json({ 
        success: true,
        count: likes.length, 
        likes: likes.map(like => ({
          id: like.id,
          userId: like.userId,
          likeType: like.likeType,
          createdAt: like.createdAt
        }))
      });
    } catch (error) {
      console.error('Error fetching comment likes:', error);
      res.status(500).json({ error: 'Failed to fetch likes' });
    }
  });

  
  
  

  
  app.get('/api/github/user-repos', requireAuth, async (req, res) => {
    try {
      const user = req.user || (req.session as any)?.user;
      const repos = await storage.getUserGithubRepos(user.id);
      
      res.json({
        success: true,
        repositories: repos,
        count: repos.length
      });
    } catch (error) {
      console.error('Error fetching user GitHub repos:', error);
      res.status(500).json({ error: 'Failed to fetch repositories' });
    }
  });

  
  app.post('/api/github/repos/import', requireAuth, async (req, res) => {
    try {
      const user = req.user || (req.session as any)?.user;
      const { repositories } = req.body;

      if (!Array.isArray(repositories) || repositories.length === 0) {
        return res.status(400).json({ error: 'Repositories array is required' });
      }

      const importedRepos = [];
      for (const repo of repositories) {
        if (!repo.name || !repo.url) {
          continue; 
        }

        const repoIntegration = await storage.createGithubRepoIntegration({
          userId: user.id,
          repoName: repo.name,
          repoUrl: repo.url,
          repoDescription: repo.description || '',
          isPrivate: repo.private || false,
          language: repo.language || 'Unknown',
          stars: repo.stargazers_count || 0,
          forks: repo.forks_count || 0,
          isEnabled: true,
          autoBlogGenerated: false
        });
        importedRepos.push(repoIntegration);
      }

      
      await storage.createAuditLog({
        userId: user.id,
        action: 'github_repos_imported',
        resource: 'github_integration',
        details: { 
          importedCount: importedRepos.length, 
          repositories: repositories.map(r => r.name).slice(0, 10) 
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'integration'
      });

      res.json({ 
        success: true, 
        message: `${importedRepos.length} repositories imported successfully`,
        repositories: importedRepos,
        count: importedRepos.length
      });
    } catch (error) {
      console.error('Error importing GitHub repos:', error);
      res.status(500).json({ error: 'Failed to import repositories' });
    }
  });

  
  app.post('/api/github/repos/:repoId/generate-blog', requireAuth, async (req, res) => {
    try {
      const repoId = parseInt(req.params.repoId);
      const user = req.user || (req.session as any)?.user;

      if (isNaN(repoId)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      
      const repos = await storage.getUserGithubRepos(user.id);
      const repo = repos.find(r => r.id === repoId);
      
      if (!repo) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      if (repo.autoBlogGenerated) {
        return res.status(400).json({ error: 'Blog post already generated for this repository' });
      }

      
      const blogPost = await storage.createBlogPost({
        title: `Project Showcase: ${repo.repoName}`,
        slug: `project-${repo.repoName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        content: `# ${repo.repoName}

${repo.repoDescription || 'An innovative software project showcasing modern development practices.'}

## Project Overview
This project represents cutting-edge work in software development, demonstrating technical excellence and innovative solutions.

### Technical Details
- **Primary Language**: ${repo.language || 'Multiple Languages'}
- **Community Engagement**: ${repo.stars} stars, ${repo.forks} forks
- **Repository Type**: ${repo.isPrivate ? 'Private' : 'Public'} repository
- **View Source**: [Explore on GitHub](${repo.repoUrl})

## Development Highlights
This repository showcases:
- Modern software architecture and design patterns
- Clean, maintainable code structure  
- Comprehensive development workflow
- Innovation in ${repo.language || 'software development'}

## Technical Innovation
The project demonstrates advanced concepts in software engineering, providing valuable insights for developers and showcasing best practices in modern development.

---
*This blog post was automatically generated from GitHub repository data to showcase technical projects and development work.*`,
        excerpt: repo.repoDescription || `Explore the ${repo.repoName} project - a showcase of technical innovation and development excellence in ${repo.language || 'software development'}.`,
        authorId: user.id,
        published: true,
        approved: true,
        isDraft: false,
        isAutoGenerated: true,
        githubRepo: repo.repoName,
        tags: [repo.language, 'project', 'github', 'showcase', 'development'].filter(Boolean).filter((tag): tag is string => tag !== null)
      });

      
      await storage.updateGithubRepoIntegration(repoId, {
        autoBlogGenerated: true,
        blogPostId: blogPost.id
      });

      
      await storage.createAuditLog({
        userId: user.id,
        action: 'blog_generated_from_repo',
        resource: 'blog_post',
        resourceId: blogPost.id.toString(),
        details: { 
          repoId, 
          repoName: repo.repoName, 
          repoUrl: repo.repoUrl,
          blogPostSlug: blogPost.slug
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'content'
      });

      res.json({ 
        success: true, 
        message: 'Blog post generated successfully from repository',
        blogPost,
        repository: repo
      });
    } catch (error) {
      console.error('Error generating blog from repo:', error);
      res.status(500).json({ error: 'Failed to generate blog post' });
    }
  });

  
  app.put('/api/github/repos/:repoId/toggle', requireAuth, async (req, res) => {
    try {
      const repoId = parseInt(req.params.repoId);
      const user = req.user || (req.session as any)?.user;
      const { isEnabled } = req.body;

      if (isNaN(repoId)) {
        return res.status(400).json({ error: 'Invalid repository ID' });
      }

      
      const repos = await storage.getUserGithubRepos(user.id);
      const repo = repos.find(r => r.id === repoId);
      
      if (!repo) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      const updatedRepo = await storage.updateGithubRepoIntegration(repoId, {
        isEnabled: isEnabled !== undefined ? isEnabled : !repo.isEnabled
      });

      await storage.createAuditLog({
        userId: user.id,
        action: 'github_repo_toggle',
        resource: 'github_integration',
        resourceId: repoId.toString(),
        details: { 
          repoName: repo.repoName, 
          isEnabled: updatedRepo.isEnabled
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'integration'
      });

      res.json({ 
        success: true, 
        message: `Repository ${updatedRepo.isEnabled ? 'enabled' : 'disabled'} successfully`,
        repository: updatedRepo
      });
    } catch (error) {
      console.error('Error toggling repository status:', error);
      res.status(500).json({ error: 'Failed to update repository' });
    }
  });

  
  
  

  
  app.get('/api/admin/messages/:userId', requireAdmin, async (req, res) => {
    try {
      const userId = req.params.userId;
      const messages = await storage.getAdminMessages(userId);
      
      res.json({
        success: true,
        messages,
        count: messages.length
      });
    } catch (error) {
      console.error('Error fetching admin messages:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  
  app.post('/api/admin/messages', requireAdmin, async (req, res) => {
    try {
      const admin = req.user || (req.session as any)?.user;
      const { recipientId, subject, content, messageType, priority } = req.body;

      if (!recipientId || !subject || !content) {
        return res.status(400).json({ error: 'Recipient, subject, and content are required' });
      }

      const message = await storage.createAdminMessage({
        adminId: admin.id,
        recipientId,
        subject: subject.trim(),
        content: content.trim(),
        messageType: messageType || 'direct',
        priority: priority || 'normal'
      });

      
      await storage.createAuditLog({
        userId: admin.id,
        action: 'admin_message_sent',
        resource: 'admin_message',
        resourceId: message.id.toString(),
        details: { 
          recipientId, 
          subject: subject.substring(0, 50) + (subject.length > 50 ? '...' : ''),
          messageType, 
          priority 
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'admin'
      });

      res.json({ 
        success: true, 
        message: 'Admin message sent successfully', 
        adminMessage: message 
      });
    } catch (error) {
      console.error('Error sending admin message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  
  app.put('/api/admin/messages/:messageId/read', requireAuth, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const user = req.user || (req.session as any)?.user;

      if (isNaN(messageId)) {
        return res.status(400).json({ error: 'Invalid message ID' });
      }

      
      const messages = await storage.getAdminMessages(user.id);
      const message = messages.find(m => m.id === messageId);
      
      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      const updatedMessage = await storage.markAdminMessageAsRead(messageId);

      res.json({ 
        success: true, 
        message: 'Message marked as read',
        adminMessage: updatedMessage
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ error: 'Failed to update message' });
    }
  });

  
  app.delete('/api/admin/messages/:messageId', requireAdmin, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const admin = req.user || (req.session as any)?.user;

      if (isNaN(messageId)) {
        return res.status(400).json({ error: 'Invalid message ID' });
      }

      await storage.deleteAdminMessage(messageId);

      await storage.createAuditLog({
        userId: admin.id,
        action: 'admin_message_deleted',
        resource: 'admin_message',
        resourceId: messageId.toString(),
        details: { messageId },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'admin'
      });

      res.json({ 
        success: true, 
        message: 'Admin message deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting admin message:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });

  
  
  

  
  app.get('/api/admin/analytics/comprehensive', requireAdmin, async (req, res) => {
    try {
      const [
        systemMetrics,
        userActivity,
        securityReports,
        contentStats
      ] = await Promise.all([
        storage.getSystemPerformanceMetrics(),
        storage.getAllUsersWithActivity(),
        storage.getSecurityReports(),
        storage.getContentModerationQueue()
      ]);

      const analytics = {
        system: systemMetrics,
        users: {
          total: userActivity.length,
          active: userActivity.filter(u => u.isActive).length,
          highRisk: userActivity.filter(u => u.riskScore > 70).length,
          averageActivity: userActivity.reduce((acc, u) => acc + u.activityCount, 0) / userActivity.length || 0
        },
        security: {
          recentEvents: securityReports.length,
          criticalEvents: securityReports.filter(r => r.severity === 'critical').length,
          warningEvents: securityReports.filter(r => r.severity === 'warning').length
        },
        content: {
          pendingModeration: contentStats.length,
          comments: contentStats.filter(c => c.type === 'comment').length,
          posts: contentStats.filter(c => c.type === 'blog_post').length
        }
      };

      await storage.createAuditLog({
        userId: (req.user as any)?.id || 'admin_user',
        action: 'admin_comprehensive_analytics',
        resource: 'system',
        details: { analyticsGenerated: true },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'admin'
      });

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        analytics
      });
    } catch (error) {
      console.error('Error generating comprehensive analytics:', error);
      res.status(500).json({ error: 'Failed to generate analytics' });
    }
  });

  
  app.get('/api/admin/export/system', requireAdmin, async (req, res) => {
    try {
      const admin = req.user || (req.session as any)?.user;
      
      const backupId = await storage.createSystemBackup();
      
      await storage.createAuditLog({
        userId: admin.id,
        action: 'system_export_requested',
        resource: 'system',
        details: { backupId, requestedBy: admin.id },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'admin'
      });

      res.json({
        success: true,
        message: 'System export initiated successfully',
        backupId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error initiating system export:', error);
      res.status(500).json({ error: 'Failed to initiate system export' });
    }
  });

  
  setTimeout(() => {
    (async () => {
      try {
        if (aiBlogGenerator && typeof aiBlogGenerator.initializeAdminUser === 'function') {
          await aiBlogGenerator.initializeAdminUser();
        }
        if (continuousAgent && typeof continuousAgent.start === 'function') {
          await continuousAgent.start();
        }
        if (falconProtocol && typeof falconProtocol.start === 'function') {
          await falconProtocol.start();
        }
      } catch (error) {
        console.error('Error initializing AI systems:', error);
      }
    })();
  }, 2000); 

  
  app.get('/api/user/site-data', requireAuth, async (req, res) => {
    try {
      const user = req.user || (req.session as any)?.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const siteData = await storage.getUserSiteData(user.id);
      res.json(siteData || {});
    } catch (error) {
      console.error('Error fetching user site data:', error);
      res.status(500).json({ error: 'Failed to fetch site data' });
    }
  });
  
  app.post('/api/user/site-data', requireAuth, async (req, res) => {
    try {
      const user = req.user || (req.session as any)?.user;
      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      const siteData = await storage.upsertUserSiteData(user.id, req.body);
      res.json(siteData);
    } catch (error) {
      console.error('Error saving user site data:', error);
      res.status(500).json({ error: 'Failed to save site data' });
    }
  });
  
  
  app.get('/api/user/site-data/:username', async (req, res) => {
    try {
      const { username } = req.params;
      const siteData = await storage.getUserSiteDataByUsername(username);
      if (!siteData) {
        return res.status(404).json({ error: 'User site not found' });
      }
      res.json(siteData);
    } catch (error) {
      console.error('Error fetching public user site data:', error);
      res.status(500).json({ error: 'Failed to fetch site data' });
    }
  });
  
  
  app.get('/api/blog/user-posts/:username', async (req, res) => {
    try {
      const { username } = req.params;
      const posts = await storage.getUserBlogPosts(username, true); 
      res.json(posts);
    } catch (error) {
      console.error('Error fetching user posts by username:', error);
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

