import { Octokit } from '@octokit/rest';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  size: number;
  updated_at: string;
  created_at: string;
  topics: string[];
  homepage: string | null;
  private: boolean;
}

export interface GitHubStats {
  totalStars: number;
  totalForks: number;
  totalRepos: number;
  lastUpdated: string;
}

class GitHubService {
  private octokit: Octokit;
  private username = 'RafalW3bCraft';
  private cache = new Map<string, { data: any; expiry: number }>();
  private cacheTimeout = 15 * 60 * 1000;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  private getCacheKey(method: string, ...args: any[]): string {
    return `${method}:${args.join(':')}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.cacheTimeout,
    });
  }

  async getFeaturedRepos(): Promise<GitHubRepo[]> {
    const cacheKey = this.getCacheKey('featuredRepos');
    const cached = this.getFromCache<GitHubRepo[]>(cacheKey);
    if (cached) return cached;

    try {
      const featuredRepoNames = [
        'G3r4kiSecBot',
        'AmazonAffiliatedBot',
        'TheCommander',
        'WhisperAiEngine',
        'OmniLanguageTutor'
      ];

      const repos = await Promise.all(
        featuredRepoNames.map(async (repoName) => {
          try {
            const { data } = await this.octokit.repos.get({
              owner: this.username,
              repo: repoName,
            });
            return data as GitHubRepo;
          } catch (error) {
            console.warn(`Could not fetch repo ${repoName}:`, error);
            return null;
          }
        })
      );

      const validRepos = repos.filter((repo): repo is GitHubRepo => repo !== null);
      this.setCache(cacheKey, validRepos);
      return validRepos;
    } catch (error) {
      console.error('Error fetching featured repos:', error);
      return [];
    }
  }

  async getAllRepos(): Promise<GitHubRepo[]> {
    const cacheKey = this.getCacheKey('allRepos');
    const cached = this.getFromCache<GitHubRepo[]>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await this.octokit.repos.listForUser({
        username: this.username,
        type: 'owner',
        sort: 'updated',
        per_page: 100,
      });

      const repos = data as GitHubRepo[];
      this.setCache(cacheKey, repos);
      return repos;
    } catch (error) {
      console.error('Error fetching all repos:', error);
      return [];
    }
  }

  async getRepoDetails(repoName: string): Promise<GitHubRepo | null> {
    const cacheKey = this.getCacheKey('repoDetails', repoName);
    const cached = this.getFromCache<GitHubRepo>(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await this.octokit.repos.get({
        owner: this.username,
        repo: repoName,
      });

      const repo = data as GitHubRepo;
      this.setCache(cacheKey, repo);
      return repo;
    } catch (error) {
      console.error(`Error fetching repo ${repoName}:`, error);
      return null;
    }
  }

  async getRepository(repoName: string): Promise<GitHubRepo | null> {
    return await this.getRepoDetails(repoName);
  }

  async getGitHubStats(): Promise<GitHubStats> {
    const cacheKey = this.getCacheKey('githubStats');
    const cached = this.getFromCache<GitHubStats>(cacheKey);
    if (cached) return cached;

    try {
      const repos = await this.getAllRepos();
      
      const stats: GitHubStats = {
        totalStars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
        totalForks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
        totalRepos: repos.length,
        lastUpdated: repos.length > 0 
          ? repos.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0].updated_at
          : new Date().toISOString(),
      };

      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching GitHub stats:', error);
      return {
        totalStars: 0,
        totalForks: 0,
        totalRepos: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  async getRecentCommits(repoName: string, count: number = 5) {
    const cacheKey = this.getCacheKey('recentCommits', repoName, count);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await this.octokit.repos.listCommits({
        owner: this.username,
        repo: repoName,
        per_page: count,
      });

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching commits for ${repoName}:`, error);
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const githubService = new GitHubService();
