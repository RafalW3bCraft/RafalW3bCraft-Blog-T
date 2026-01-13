import type { Express } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { validateGithubTokenFormat, redactToken } from "../../lib/encryption";

const githubTokenSchema = z.object({
  token: z.string().min(1, "GitHub token is required"),
  scope: z.string().optional()
});

export function setupUserGithubRoutes(app: Express) {
  app.get("/api/user/github/status", requireAuth, async (req, res) => {
    try {
      const user = req.user || (req.session as any)?.user;
      const userId = user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const status = await storage.getUserGithubTokenStatus(userId);
      
      await storage.createAuditLog({
        userId,
        action: "github_token_status_check",
        resource: "user_github_token",
        details: { hasToken: status.hasToken, isValid: status.isValid },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'user'
      });

      res.json(status);
    } catch (error) {
      console.error('Error getting GitHub token status:', error);
      res.status(500).json({ error: 'Failed to get GitHub token status' });
    }
  });

  app.post("/api/user/github/token", requireAuth, async (req, res) => {
    try {
      const { token, scope } = githubTokenSchema.parse(req.body);
      const user = req.user || (req.session as any)?.user;
      const userId = user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!validateGithubTokenFormat(token)) {
        return res.status(400).json({ 
          error: 'Invalid GitHub token format. Please provide a valid GitHub Personal Access Token (ghp_...) or Fine-grained token (github_pat_...)' 
        });
      }

      const savedToken = await storage.saveUserGithubToken(userId, token, scope);
      
      await storage.createAuditLog({
        userId,
        action: "github_token_saved",
        resource: "user_github_token",
        details: { 
          tokenId: savedToken.id,
          scope: scope || null,
          redactedToken: redactToken(token)
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'user'
      });

      res.json({ 
        success: true, 
        message: 'GitHub token saved successfully',
        tokenId: savedToken.id 
      });
    } catch (error) {
      console.error('Error saving GitHub token:', error);
      res.status(500).json({ error: 'Failed to save GitHub token' });
    }
  });

  app.post("/api/user/github/validate", requireAuth, async (req, res) => {
    try {
      const user = req.user || (req.session as any)?.user;
      const userId = user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const isValid = await storage.validateUserGithubToken(userId);
      
      await storage.createAuditLog({
        userId,
        action: "github_token_validated",
        resource: "user_github_token",
        details: { isValid },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'user'
      });

      res.json({ isValid });
    } catch (error) {
      console.error('Error validating GitHub token:', error);
      res.status(500).json({ error: 'Failed to validate GitHub token' });
    }
  });

  app.delete("/api/user/github/token", requireAuth, async (req, res) => {
    try {
      const user = req.user || (req.session as any)?.user;
      const userId = user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      await storage.removeUserGithubToken(userId);
      
      await storage.createAuditLog({
        userId,
        action: "github_token_removed",
        resource: "user_github_token",
        details: {},
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'user'
      });

      res.json({ success: true, message: 'GitHub token removed successfully' });
    } catch (error) {
      console.error('Error removing GitHub token:', error);
      res.status(500).json({ error: 'Failed to remove GitHub token' });
    }
  });

  app.post("/api/github/repos/:repoId/generate-blog", requireAuth, async (req, res) => {
    try {
      const user = req.user || (req.session as any)?.user;
      const userId = user?.id;
      const { repoId } = req.params;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const repo = await storage.getUserGithubRepo(userId, parseInt(repoId));
      if (!repo) {
        return res.status(404).json({ error: 'Repository not found' });
      }

      const blogPost = await storage.generateBlogFromRepo(userId, repo);

      await storage.createAuditLog({
        userId,
        action: "blog_generated_from_repo",
        resource: "blog_post",
        details: { 
          repoId: repo.id,
          repoName: repo.repoName,
          blogPostId: blogPost.id 
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'user'
      });

      res.json({ 
        success: true, 
        message: 'Blog post generated successfully',
        blogPost 
      });
    } catch (error) {
      console.error('Error generating blog from repository:', error);
      res.status(500).json({ error: 'Failed to generate blog post' });
    }
  });

  app.get("/api/user/github/repositories", requireAuth, async (req, res) => {
    try {
      const user = req.user || (req.session as any)?.user;
      const userId = user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const token = await storage.getUserGithubToken(userId);

      if (!token) {
        return res.status(400).json({ 
          error: 'No valid GitHub token found. Please add your GitHub token first.' 
        });
      }

      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'CyberSecurity-Platform',
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          await storage.removeUserGithubToken(userId);
          return res.status(401).json({ 
            error: 'GitHub token is invalid or expired. Please update your token.' 
          });
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repositories = await response.json();
      
      await storage.createAuditLog({
        userId,
        action: "github_repositories_fetched",
        resource: "user_github_token",
        details: { repositoryCount: repositories.length },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'info',
        category: 'user'
      });

      res.json(repositories);
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      res.status(500).json({ error: 'Failed to fetch GitHub repositories' });
    }
  });
}
