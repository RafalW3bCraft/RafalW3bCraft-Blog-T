import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { 
  Github, 
  ExternalLink, 
  Star, 
  GitFork, 
  Code, 
  Filter,
  Search,
  Calendar,
  TrendingUp,
  Eye,
  Download
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Repository {
  id: number;
  name: string;
  description: string;
  language: string;
  stars: number;
  forks: number;
  url: string;
  lastUpdated: string;
  topics: string[];
  size: number;
  isPrivate: boolean;
  demoUrl?: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface RepositoryStats {
  totalRepos: number;
  languages: { [key: string]: number };
  totalStars: number;
  totalForks: number;
  mostActiveRepo: string;
}

export function EnhancedPortfolioView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'stars' | 'updated' | 'name'>('stars');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  
  const { data: repositories = [], isLoading } = useQuery({
    queryKey: ['user-repositories'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/github/projects');
      return res.json();
    }
  });

  
  const { data: repoStats } = useQuery({
    queryKey: ['repo-statistics'],
    queryFn: async () => {
      const repos = await apiRequest('GET', '/api/github/projects');
      const repoData = await repos.json();
      
      
      const totalRepos = repoData.length;
      const totalStars = repoData.reduce((sum: number, repo: any) => sum + (repo.stars || 0), 0);
      const totalForks = repoData.reduce((sum: number, repo: any) => sum + (repo.forks || 0), 0);
      
      const languages: { [key: string]: number } = {};
      repoData.forEach((repo: any) => {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
      });
      
      return {
        totalRepos,
        totalStars,
        totalForks,
        languages
      };
    }
  });

  
  const filteredRepos = repositories
    .filter((repo: Repository) => {
      const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (repo.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLanguage = selectedLanguage === 'all' || repo.language === selectedLanguage;
      const matchesComplexity = selectedComplexity === 'all' || repo.complexity === selectedComplexity;
      
      return matchesSearch && matchesLanguage && matchesComplexity;
    })
    .sort((a: Repository, b: Repository) => {
      switch (sortBy) {
        case 'stars':
          return b.stars - a.stars;
        case 'updated':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'JavaScript': 'bg-yellow-500',
      'TypeScript': 'bg-blue-500',
      'Python': 'bg-green-500',
      'Java': 'bg-orange-500',
      'C++': 'bg-blue-600',
      'Go': 'bg-cyan-500',
      'Rust': 'bg-orange-600',
      'PHP': 'bg-purple-500',
      'Ruby': 'bg-red-500',
      'Shell': 'bg-gray-500',
    };
    return colors[language] || 'bg-gray-400';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Beginner': return 'text-green-400 border-green-400';
      case 'Intermediate': return 'text-yellow-400 border-yellow-400';
      case 'Advanced': return 'text-red-400 border-red-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-zinc-900/90 border-cyan-500/30">
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading portfolio projects...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      
      {repoStats && (
        <Card className="bg-zinc-900/90 border-cyan-500/30">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Portfolio Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{repoStats.totalRepos}</div>
                <div className="text-sm text-zinc-400">Repositories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{repoStats.totalStars}</div>
                <div className="text-sm text-zinc-400">Total Stars</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{repoStats.totalForks}</div>
                <div className="text-sm text-zinc-400">Total Forks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{Object.keys(repoStats.languages).length}</div>
                <div className="text-sm text-zinc-400">Languages</div>
              </div>
            </div>
            
            
            <div className="mt-6">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Language Distribution</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(repoStats.languages).map(([language, count]) => (
                  <Badge
                    key={language}
                    className={`${getLanguageColor(language)} text-white`}
                  >
                    {language} ({count as number})
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      
      <Card className="bg-zinc-900/90 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Code className="h-5 w-5" />
            Portfolio Projects
            <Badge variant="outline" className="ml-2">
              {filteredRepos.length} projects
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-600 text-white"
                />
              </div>
            </div>

            
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-48 bg-zinc-800 border-zinc-600 text-white">
                <SelectValue placeholder="Filter by language" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-600">
                <SelectItem value="all">All Languages</SelectItem>
                {repoStats && Object.keys(repoStats.languages).map((language) => (
                  <SelectItem key={language} value={language}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            
            <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
              <SelectTrigger className="w-48 bg-zinc-800 border-zinc-600 text-white">
                <SelectValue placeholder="Filter by complexity" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-600">
                <SelectItem value="all">All Complexity</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-48 bg-zinc-800 border-zinc-600 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-600">
                <SelectItem value="stars">Most Stars</SelectItem>
                <SelectItem value="updated">Recently Updated</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredRepos.map((repo: Repository) => (
              <Card key={repo.id} className="bg-zinc-800 border-zinc-700 hover:border-cyan-500/50 transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-white text-lg group-hover:text-cyan-400 transition-colors">
                      {repo.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      {repo.demoUrl && (
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                        <Github className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-zinc-400 text-sm line-clamp-3">{repo.description}</p>
                  
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getLanguageColor(repo.language)}`}></div>
                    <span className="text-sm text-zinc-300">{repo.language}</span>
                    <Badge variant="outline" className={`text-xs ${getComplexityColor(repo.complexity)}`}>
                      {repo.complexity}
                    </Badge>
                  </div>

                  
                  {repo.topics && repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {repo.topics.slice(0, 3).map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs bg-zinc-700 text-zinc-300">
                          {topic}
                        </Badge>
                      ))}
                      {repo.topics.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-zinc-700 text-zinc-300">
                          +{repo.topics.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {repo.stars}
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork className="h-4 w-4" />
                        {repo.forks}
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {repo.size && !isNaN(repo.size) ? Math.round(repo.size / 1024) : 0}KB
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(repo.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRepos.length === 0 && (
            <div className="text-center py-12 text-zinc-400">
              <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No projects found</p>
              <p className="text-sm">Try adjusting your search filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EnhancedPortfolioView;