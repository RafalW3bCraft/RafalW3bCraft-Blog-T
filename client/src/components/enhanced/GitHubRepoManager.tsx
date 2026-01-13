import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Github, 
  Star, 
  GitFork, 
  Eye, 
  Plus, 
  Settings, 
  Trash2,
  RefreshCw,
  Link as LinkIcon,
  Code,
  BookOpen,
  Clock
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface GitHubRepo {
  id: number;
  userId: string;
  repoName: string;
  repoUrl: string;
  repoDescription: string;
  isPrivate: boolean;
  language: string;
  stars: number;
  forks: number;
  isEnabled: boolean;
  autoBlogGenerated: boolean;
  blogPostId?: number;
  createdAt: string;
  updatedAt: string;
}

interface GitHubCredentials {
  clientId: string;
  clientSecret: string;
  personalToken: string;
}

export function GitHubRepoManager() {
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [credentials, setCredentials] = useState<GitHubCredentials>({
    clientId: '',
    clientSecret: '',
    personalToken: ''
  });
  const [repoUrlToImport, setRepoUrlToImport] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  
  const { data: repoData, isLoading } = useQuery({
    queryKey: ['user-github-repos'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/github/user-repos');
      return res.json();
    }
  });

  
  const userRepos = repoData?.repositories || [];

  
  const importRepoMutation = useMutation({
    mutationFn: async (repoData: any) => {
      const res = await apiRequest('POST', '/api/github/repos/import', { repositories: [repoData] });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Repository Imported',
        description: 'Repository has been added to your workspace',
      });
      queryClient.invalidateQueries({ queryKey: ['user-github-repos'] });
      setShowImportDialog(false);
      setRepoUrlToImport('');
    },
    onError: (error: any) => {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import repository',
        variant: 'destructive',
      });
    },
  });

  
  const toggleRepoMutation = useMutation({
    mutationFn: async ({ repoId, isEnabled }: { repoId: number; isEnabled: boolean }) => {
      const res = await apiRequest('PUT', `/api/github/repos/${repoId}/toggle`, { isEnabled });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Repository Updated',
        description: 'Repository status has been updated',
      });
      queryClient.invalidateQueries({ queryKey: ['user-github-repos'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update repository',
        variant: 'destructive',
      });
    },
  });

  
  const generateBlogMutation = useMutation({
    mutationFn: async (repoId: number) => {
      const res = await apiRequest('POST', `/api/github/repos/${repoId}/generate-blog`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Blog Generated!',
        description: 'Blog post has been generated from repository',
      });
      queryClient.invalidateQueries({ queryKey: ['user-github-repos'] });
      queryClient.invalidateQueries({ queryKey: ['user-drafts'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate blog post',
        variant: 'destructive',
      });
    },
  });

  const handleImportFromUrl = () => {
    if (!repoUrlToImport.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a GitHub repository URL',
        variant: 'destructive',
      });
      return;
    }

    
    const urlParts = repoUrlToImport.replace('https://github.com/', '').split('/');
    if (urlParts.length < 2) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid GitHub repository URL',
        variant: 'destructive',
      });
      return;
    }

    const [owner, repoName] = urlParts;
    const repoData = {
      name: repoName,
      full_name: `${owner}/${repoName}`,
      url: repoUrlToImport,
      description: 'Imported repository',
      language: 'Unknown',
      stargazers_count: 0,
      forks_count: 0,
      private: false
    };

    importRepoMutation.mutate(repoData);
  };

  const handleToggleRepo = (repo: GitHubRepo) => {
    toggleRepoMutation.mutate({
      repoId: repo.id,
      isEnabled: !repo.isEnabled
    });
  };

  const handleGenerateBlog = (repo: GitHubRepo) => {
    generateBlogMutation.mutate(repo.id);
  };

  return (
    <Card className="bg-zinc-900/90 border-cyan-500/30 shadow-2xl">
      <CardHeader className="border-b border-zinc-700/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-cyan-400 flex items-center gap-2 text-xl">
            <Github className="h-6 w-6" />
            GitHub Repository Manager
          </CardTitle>
          <div className="flex gap-2">
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Import Repository
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-cyan-500/30">
                <DialogHeader>
                  <DialogTitle className="text-cyan-400">Import GitHub Repository</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-300 mb-2 block">
                      Repository URL
                    </label>
                    <Input
                      value={repoUrlToImport}
                      onChange={(e) => setRepoUrlToImport(e.target.value)}
                      placeholder="https://github.com/owner/repository"
                      className="bg-zinc-800/50 border-zinc-600 text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleImportFromUrl}
                      disabled={importRepoMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {importRepoMutation.isPending ? 'Importing...' : 'Import Repository'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowImportDialog(false)}
                      className="border-zinc-600 text-zinc-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
            <p className="text-zinc-400">Loading repositories...</p>
          </div>
        ) : userRepos.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <div className="bg-zinc-800/50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Github className="h-12 w-12 opacity-50" />
            </div>
            <h4 className="text-lg font-medium text-zinc-300 mb-2">No repositories yet</h4>
            <p className="text-sm">Import your GitHub repositories to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userRepos.map((repo: GitHubRepo) => (
              <Card key={repo.id} className="bg-zinc-800/30 border-zinc-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-zinc-100">{repo.repoName}</h3>
                        <Badge 
                          variant={repo.isEnabled ? "default" : "secondary"}
                          className={repo.isEnabled ? "bg-green-600" : "bg-zinc-600"}
                        >
                          {repo.isEnabled ? 'Active' : 'Disabled'}
                        </Badge>
                        {repo.autoBlogGenerated && (
                          <Badge variant="outline" className="border-cyan-400 text-cyan-400">
                            Blog Generated
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-zinc-400 mb-3">
                        {repo.repoDescription || 'No description available'}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          {repo.language}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {repo.stars}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="h-3 w-3" />
                          {repo.forks}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(repo.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(repo.repoUrl, '_blank')}
                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      >
                        <LinkIcon className="h-3 w-3" />
                      </Button>
                      
                      {repo.isEnabled && !repo.autoBlogGenerated && (
                        <Button
                          size="sm"
                          onClick={() => handleGenerateBlog(repo)}
                          disabled={generateBlogMutation.isPending}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          Generate Blog
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleRepo(repo)}
                        disabled={toggleRepoMutation.isPending}
                        className={`border-zinc-600 hover:bg-zinc-700 ${
                          repo.isEnabled ? 'text-red-400' : 'text-green-400'
                        }`}
                      >
                        {repo.isEnabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GitHubRepoManager;