/**
 * AI Blog Generator for Falcon's Mandate
 * Automatically generates blog posts from GitHub repositories
 */

import { Octokit } from '@octokit/rest';
import { db } from './db';
import { blogPosts, users, githubProjects } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

interface GitHubRepo {
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  url: string;
  readme?: string;
  recentCommits?: any[];
}

interface BlogPostData {
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  githubRepo: string;
}

export class AIBlogGenerator {
  private octokit: Octokit;
  private adminUserId: string | null = null;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.G_TOKEN,
    });
  }

  async initializeAdminUser(): Promise<void> {
    try {
      // First try to find existing admin user
      const admin = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
      if (admin.length > 0) {
        this.adminUserId = admin[0].id;
        console.log('✅ Admin user found:', admin[0].email);
        return;
      }

      // If no admin found, ensure 'system' user exists as fallback
      try {
        await db.insert(users).values({
          id: 'system',
          email: 'system@rafalw3bcraft.com',
          firstName: 'System',
          lastName: 'Administrator',
          role: 'admin',
          provider: 'system',
          providerId: 'system_auto',
        });
        this.adminUserId = 'system';
        console.log('✅ System admin user created for blog generation');
      } catch (insertError) {
        // If system user already exists, use it
        this.adminUserId = 'system';
        console.log('✅ Using existing system admin user for blog generation');
      }
    } catch (error) {
      console.error('Error finding/creating admin user:', error);
      this.adminUserId = 'system'; // fallback
    }
  }

  async generateBlogFromRepo(repoOwner: string, repoName: string): Promise<BlogPostData | null> {
    try {
      // Fetch repository data
      const { data: repo } = await this.octokit.repos.get({
        owner: repoOwner,
        repo: repoName,
      });

      // Fetch README
      let readme = '';
      try {
        const { data: readmeData } = await this.octokit.repos.getReadme({
          owner: repoOwner,
          repo: repoName,
        });
        readme = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      } catch {
        // README not found - proceeding without README content
      }

      // Fetch recent commits
      const { data: commits } = await this.octokit.repos.listCommits({
        owner: repoOwner,
        repo: repoName,
        per_page: 5,
      });

      const repoData: GitHubRepo = {
        name: repo.name,
        description: repo.description || '',
        language: repo.language || 'Unknown',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        url: repo.html_url,
        readme,
        recentCommits: commits,
      };

      return this.generateBlogContent(repoData);
    } catch (error) {
      console.error(`Error generating blog for ${repoName}:`, error);
      return null;
    }
  }

  private generateBlogContent(repo: GitHubRepo): BlogPostData {
    const isSecurityProject = this.isSecurityRelated(repo);
    const isAIProject = this.isAIRelated(repo);
    const isBotProject = this.isBotRelated(repo);

    let title: string;
    let content: string;
    let excerpt: string;
    let tags: string[] = [];

    // Generate title based on project type
    if (isSecurityProject) {
      title = `🛡️ ${repo.name}: Advanced Cybersecurity Engineering`;
      tags.push('cybersecurity', 'security', 'penetration-testing');
    } else if (isAIProject) {
      title = `🧠 ${repo.name}: AI-Powered Innovation`;
      tags.push('artificial-intelligence', 'machine-learning', 'automation');
    } else if (isBotProject) {
      title = `🤖 ${repo.name}: Intelligent Bot Development`;
      tags.push('bot-development', 'automation', 'telegram');
    } else {
      title = `⚡ ${repo.name}: Technical Deep Dive`;
      tags.push('development', 'programming');
    }

    // Add language tag
    if (repo.language) {
      tags.push(repo.language.toLowerCase());
    }

    // Generate excerpt
    excerpt = this.generateExcerpt(repo);

    // Generate comprehensive content
    content = this.generateMarkdownContent(repo, isSecurityProject, isAIProject, isBotProject);

    return {
      title,
      content,
      excerpt,
      tags,
      githubRepo: repo.name,
    };
  }

  private generateExcerpt(repo: GitHubRepo): string {
    if (repo.description) {
      return `${repo.description} Explore the technical implementation, security considerations, and practical applications of this ${repo.language} project.`;
    }
    
    return `Deep dive into ${repo.name}, a cutting-edge ${repo.language} project showcasing advanced development practices and innovative solutions in the cybersecurity domain.`;
  }

  private generateMarkdownContent(repo: GitHubRepo, isSec: boolean, isAI: boolean, isBot: boolean): string {
    let content = `# ${repo.name}: Technical Analysis & Implementation\n\n`;
    
    // Project overview
    content += `## 🎯 Project Overview\n\n`;
    content += `${repo.description || 'This project represents a significant advancement in modern software engineering.'}\n\n`;
    
    // Technical specifications
    content += `## 🔧 Technical Specifications\n\n`;
    content += `- **Primary Language**: ${repo.language}\n`;
    content += `- **Repository**: [${repo.name}](${repo.url})\n`;
    content += `- **Community Engagement**: ${repo.stars} stars, ${repo.forks} forks\n\n`;

    // Domain-specific content
    if (isSec) {
      content += `## 🛡️ Security Architecture\n\n`;
      content += `This project implements enterprise-grade security measures:\n\n`;
      content += `- **Threat Detection**: Advanced pattern recognition for identifying security vulnerabilities\n`;
      content += `- **Penetration Testing**: Automated reconnaissance and exploitation frameworks\n`;
      content += `- **Defense Mechanisms**: Multi-layered security controls and monitoring systems\n`;
      content += `- **Compliance**: Adherence to industry security standards and best practices\n\n`;
    }

    if (isAI) {
      content += `## 🧠 AI/ML Implementation\n\n`;
      content += `Key artificial intelligence components:\n\n`;
      content += `- **Machine Learning Models**: Custom-trained models for domain-specific tasks\n`;
      content += `- **Natural Language Processing**: Advanced text analysis and generation capabilities\n`;
      content += `- **Automated Decision Making**: Intelligent routing and response systems\n`;
      content += `- **Continuous Learning**: Adaptive algorithms that improve over time\n\n`;
    }

    if (isBot) {
      content += `## 🤖 Bot Framework Architecture\n\n`;
      content += `Intelligent automation features:\n\n`;
      content += `- **Multi-Platform Integration**: Seamless operation across communication channels\n`;
      content += `- **Command Processing**: Natural language understanding for user interactions\n`;
      content += `- **Task Automation**: Scheduled and event-driven automation workflows\n`;
      content += `- **User Management**: Role-based access control and permission systems\n\n`;
    }

    // Recent development activity
    if (repo.recentCommits && repo.recentCommits.length > 0) {
      content += `## 📈 Recent Development Activity\n\n`;
      content += `Latest commits showcase ongoing improvements:\n\n`;
      
      repo.recentCommits.slice(0, 3).forEach((commit, index) => {
        const date = new Date(commit.commit.author.date).toLocaleDateString();
        content += `${index + 1}. **${date}**: ${commit.commit.message}\n`;
      });
      content += `\n`;
    }

    // Implementation insights
    content += `## 💡 Implementation Insights\n\n`;
    content += `### Development Methodology\n\n`;
    content += `This project follows modern software engineering principles:\n\n`;
    content += `- **Modular Architecture**: Clean separation of concerns for maintainability\n`;
    content += `- **Security-First Design**: Security considerations integrated from the ground up\n`;
    content += `- **Performance Optimization**: Efficient algorithms and resource management\n`;
    content += `- **Scalability**: Designed to handle enterprise-level workloads\n\n`;

    // README integration
    if (repo.readme && repo.readme.length > 100) {
      content += `## 📚 Technical Documentation\n\n`;
      // Extract relevant sections from README (simplified)
      const readmeLines = repo.readme.split('\n').slice(0, 20);
      const relevantContent = readmeLines
        .filter(line => !line.startsWith('#') && line.trim().length > 10)
        .slice(0, 3)
        .join('\n\n');
      
      if (relevantContent) {
        content += `${relevantContent}\n\n`;
      }
    }

    // Practical applications
    content += `## 🚀 Practical Applications\n\n`;
    if (isSec) {
      content += `- **Enterprise Security**: Deploy in corporate environments for threat monitoring\n`;
      content += `- **Penetration Testing**: Use for authorized security assessments\n`;
      content += `- **Incident Response**: Integrate with SIEM systems for rapid threat response\n`;
    } else if (isAI) {
      content += `- **Business Automation**: Streamline repetitive tasks with intelligent processing\n`;
      content += `- **Data Analysis**: Extract insights from large datasets automatically\n`;
      content += `- **Customer Service**: Enhance user experience with AI-powered interactions\n`;
    } else if (isBot) {
      content += `- **Communication Automation**: Automate messaging and notification systems\n`;
      content += `- **Workflow Integration**: Connect with existing business processes\n`;
      content += `- **User Engagement**: Improve interaction through intelligent responses\n`;
    } else {
      content += `- **Development Workflows**: Integrate into existing development pipelines\n`;
      content += `- **Process Automation**: Streamline manual tasks and procedures\n`;
      content += `- **System Integration**: Connect with various platforms and services\n`;
    }

    content += `\n## 🔗 Resources\n\n`;
    content += `- **Source Code**: [GitHub Repository](${repo.url})\n`;
    content += `- **Documentation**: Comprehensive guides available in the repository\n`;
    content += `- **Community**: Contribute to ongoing development and improvements\n\n`;

    content += `---\n\n`;
    content += `*This analysis represents the current state of the project and may evolve as development continues. For the latest updates and detailed implementation guides, refer to the official repository.*`;

    return content;
  }

  private isSecurityRelated(repo: GitHubRepo): boolean {
    const securityKeywords = ['security', 'sec', 'pentest', 'hack', 'exploit', 'vuln', 'cyber', 'auth', 'encryption'];
    const text = `${repo.name} ${repo.description}`.toLowerCase();
    return securityKeywords.some(keyword => text.includes(keyword));
  }

  private isAIRelated(repo: GitHubRepo): boolean {
    const aiKeywords = ['ai', 'ml', 'machine', 'learning', 'neural', 'nlp', 'whisper', 'gpt', 'intelligence'];
    const text = `${repo.name} ${repo.description}`.toLowerCase();
    return aiKeywords.some(keyword => text.includes(keyword));
  }

  private isBotRelated(repo: GitHubRepo): boolean {
    const botKeywords = ['bot', 'telegram', 'discord', 'slack', 'automation', 'assistant', 'commander'];
    const text = `${repo.name} ${repo.description}`.toLowerCase();
    return botKeywords.some(keyword => text.includes(keyword));
  }

  async saveBlogPost(blogData: BlogPostData): Promise<void> {
    if (!this.adminUserId) {
      await this.initializeAdminUser();
      if (!this.adminUserId) return;
    }

    try {
      // Check if blog post already exists
      const existing = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.githubRepo, blogData.githubRepo))
        .limit(1);

      if (existing.length > 0) {
        console.log(`Blog post for ${blogData.githubRepo} already exists`);
        return;
      }

      // Generate base slug from title
      const baseSlug = blogData.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s-]+/g, '-')
        .replace(/^-|-$/g, '');

      // Ensure slug is unique
      let slug = baseSlug;
      let counter = 1;
      
      while (true) {
        const existingSlug = await db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.slug, slug))
          .limit(1);
          
        if (existingSlug.length === 0) {
          break; // Slug is unique
        }
        
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      await db.insert(blogPosts).values({
        title: blogData.title,
        slug,
        content: blogData.content,
        excerpt: blogData.excerpt,
        authorId: this.adminUserId,
        published: true,
        approved: true,
        isDraft: false,
        isAutoGenerated: true,
        tags: blogData.tags,
        githubRepo: blogData.githubRepo,
      });

      console.log(`✓ Generated blog post for ${blogData.githubRepo} with slug: ${slug}`);
    } catch (error) {
      console.error(`Error saving blog post for ${blogData.githubRepo}:`, error);
    }
  }

  async generateBlogsForFeaturedRepos(): Promise<void> {
    const featuredRepos = [
      'RafalW3bCraft/G3r4kiSecBot',
      'RafalW3bCraft/AmazonAffiliatedBot',
      'RafalW3bCraft/TheCommander',
      'RafalW3bCraft/WhisperAiEngine',
      'RafalW3bCraft/OmniLanguageTutor',
    ];

    console.log('🧠 AI Blog Generator: Starting automated blog generation...');

    for (const repoPath of featuredRepos) {
      const [owner, repo] = repoPath.split('/');
      try {
        const blogData = await this.generateBlogFromRepo(owner, repo);
        if (blogData) {
          await this.saveBlogPost(blogData);
        }
        // Rate limiting to avoid GitHub API limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to generate blog for ${repoPath}:`, error);
      }
    }

    console.log('✓ AI Blog Generator: Completed automated blog generation');
  }

  async schedulePeriodicGeneration(): Promise<void> {
    // Run every 12 hours
    setInterval(async () => {
      console.log('🔄 Running scheduled AI blog generation...');
      await this.generateBlogsForFeaturedRepos();
    }, 12 * 60 * 60 * 1000);
  }
}

export const aiBlogGenerator = new AIBlogGenerator();