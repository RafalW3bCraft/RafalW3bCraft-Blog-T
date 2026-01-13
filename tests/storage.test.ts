import { storage } from '../server/storage';

describe('Storage Layer', () => {
  describe('User Operations', () => {
    test('should create and retrieve user', async () => {
      const userData = {
        id: 'test-storage-user',
        username: 'storagetest',
        email: 'storage@test.com',
        role: 'user' as const,
        provider: 'test',
        providerId: 'storage-test'
      };

      const user = await storage.upsertUser(userData);
      expect(user.id).toBe(userData.id);
      expect(user.role).toBe('user');

      const retrievedUser = await storage.getUser(userData.id);
      expect(retrievedUser?.id).toBe(userData.id);
    });
  });

  describe('Audit Logging', () => {
    test('should create and retrieve audit logs', async () => {
      const auditData = {
        userId: 'test-user',
        action: 'test_action',
        resource: 'test_resource',
        details: { test: true },
        severity: 'info' as const
      };

      const auditLog = await storage.createAuditLog(auditData);
      expect(auditLog.action).toBe('test_action');
      expect(auditLog.severity).toBe('info');

      const logs = await storage.getAuditLogs(10);
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe('System Health', () => {
    test('should log and retrieve system health metrics', async () => {
      const healthData = await storage.logSystemHealth(
        'test_metric',
        'test_name',
        { value: 100 },
        'healthy'
      );

      expect(healthData.metricType).toBe('test_metric');
      expect(healthData.status).toBe('healthy');

      const metrics = await storage.getSystemHealthMetrics('test_metric', 1);
      expect(Array.isArray(metrics)).toBe(true);
    });
  });

  describe('Blog Operations', () => {
    test('should handle blog post operations', async () => {
      const blogData = {
        title: 'Test Blog Post',
        slug: 'test-blog-post-' + Date.now(),
        content: 'This is test content',
        authorId: 'test-user',
        published: false
      };

      const post = await storage.createBlogPost(blogData);
      expect(post.title).toBe(blogData.title);
      expect(post.published).toBe(false);

      const retrievedPost = await storage.getBlogPostBySlug(blogData.slug);
      expect(retrievedPost?.slug).toBe(blogData.slug);
    });
  });
});