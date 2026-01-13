import { Request, Response } from 'express';
import { githubService } from '../../lib/github-api';
import { oauthLimiter } from '../../lib/security';
import { requireAdmin } from '../middleware/auth';
import { z } from 'zod';


const githubLimiter = oauthLimiter;


const repoParamsSchema = z.object({
  repo: z.string().min(1).max(100),
});


export async function getFeaturedRepos(req: Request, res: Response) {
  try {
    const repos = await githubService.getFeaturedRepos();
    
    
    const transformedRepos = repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      size: repo.size || 0,
      url: repo.html_url,
      lastUpdated: repo.updated_at,
      topics: repo.topics || [],
      homepage: repo.homepage,
      complexity: repo.stargazers_count > 10 ? 'advanced' : repo.stargazers_count > 5 ? 'intermediate' : 'beginner'
    }));

    res.json(transformedRepos);
  } catch (error) {
    console.error('Error fetching featured repos:', error);
    res.status(500).json({
      error: 'Failed to fetch GitHub repositories',
      message: 'Unable to retrieve repository data at this time',
    });
  }
}


export async function getAllRepos(req: Request, res: Response) {
  try {
    
    const repos = await githubService.getAllRepos();
    
    
    const { storage } = await import('../storage');
    const syncPromises = repos.map(repo => storage.syncGithubProjectFromAPI(repo));
    await Promise.allSettled(syncPromises);
    
    
    const transformedRepos = repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      size: repo.size || 0,
      url: repo.html_url,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      lastUpdated: repo.updated_at,
      topics: repo.topics || [],
      homepage: repo.homepage,
      isPrivate: (repo as any).private || false,
      complexity: repo.stargazers_count > 10 ? 'advanced' : repo.stargazers_count > 5 ? 'intermediate' : 'beginner'
    }));

    res.json(transformedRepos);
  } catch (error) {
    console.error('Error fetching all repos:', error);
    
    
    try {
      const { storage } = await import('../storage');
      const cachedRepos = await storage.getGithubProjects();
      const fallbackRepos = cachedRepos.map(repo => ({
        id: repo.githubId || repo.id,
        name: repo.name,
        fullName: repo.fullName,
        description: repo.description,
        language: repo.language,
        stars: repo.stars,
        forks: repo.forks,
        size: repo.size || 0,
        url: repo.url,
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt,
        lastUpdated: repo.lastUpdated,
        topics: repo.topics || [],
        homepage: repo.homepage,
        isPrivate: repo.isPrivate || false,
        complexity: (repo.stars || 0) > 10 ? 'advanced' : (repo.stars || 0) > 5 ? 'intermediate' : 'beginner'
      }));
      
      res.json(fallbackRepos);
    } catch (fallbackError) {
      console.error('Fallback to cached data also failed:', fallbackError);
      res.status(500).json({
        error: 'Failed to fetch GitHub repositories',
        message: 'Unable to retrieve repository data at this time',
      });
    }
  }
}


export async function getRepoDetails(req: Request, res: Response) {
  try {
    const { repo } = repoParamsSchema.parse(req.params);
    
    const repoData = await githubService.getRepoDetails(repo);
    
    if (!repoData) {
      return res.status(404).json({
        error: 'Repository not found',
        message: `Repository '${repo}' could not be found`,
      });
    }

    const transformedRepo = {
      id: repoData.id,
      name: repoData.name,
      fullName: repoData.full_name,
      description: repoData.description,
      language: repoData.language,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      url: repoData.html_url,
      createdAt: repoData.created_at,
      updatedAt: repoData.updated_at,
      topics: repoData.topics || [],
      homepage: repoData.homepage,
    };

    res.json(transformedRepo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: error.errors,
      });
    }

    console.error('Error fetching repo details:', error);
    res.status(500).json({
      error: 'Failed to fetch repository details',
      message: 'Unable to retrieve repository information at this time',
    });
  }
}


export async function getGitHubStats(req: Request, res: Response) {
  try {
    const stats = await githubService.getGitHubStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching GitHub stats:', error);
    res.status(500).json({
      error: 'Failed to fetch GitHub statistics',
      message: 'Unable to retrieve GitHub statistics at this time',
    });
  }
}


export async function getRecentCommits(req: Request, res: Response) {
  try {
    const { repo } = repoParamsSchema.parse(req.params);
    const count = parseInt(req.query.count as string) || 5;
    
    if (count < 1 || count > 20) {
      return res.status(400).json({
        error: 'Invalid count parameter',
        message: 'Count must be between 1 and 20',
      });
    }

    const commits = await githubService.getRecentCommits(repo, count);
    
    const transformedCommits = (commits as any[]).map((commit: any) => ({
      sha: commit.sha.substring(0, 7),
      message: commit.commit.message.split('\n')[0], 
      author: commit.commit.author.name,
      date: commit.commit.author.date,
      url: commit.html_url,
    }));

    res.json(transformedCommits);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request parameters',
        details: error.errors,
      });
    }

    console.error('Error fetching recent commits:', error);
    res.status(500).json({
      error: 'Failed to fetch recent commits',
      message: 'Unable to retrieve commit information at this time',
    });
  }
}


export const clearGitHubCache = [
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      githubService.clearCache();
      
      res.json({
        message: 'GitHub cache cleared successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error clearing GitHub cache:', error);
      res.status(500).json({
        error: 'Failed to clear cache',
        message: 'Unable to clear GitHub cache at this time',
      });
    }
  }
];


export const getCacheStats = [
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const stats = githubService.getCacheStats();
      
      res.json({
        cache: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
      res.status(500).json({
        error: 'Failed to get cache statistics',
        message: 'Unable to retrieve cache information at this time',
      });
    }
  }
];