import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  User, 
  Shield, 
  Activity, 
  Settings, 
  LogOut, 
  Mail,
  Github,
  Crown,
  Zap,
  Monitor,
  PenTool,
  Code,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Key,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Globe
} from 'lucide-react';
import { useLocation } from 'wouter';
import PersonalBlogWorkspace from '@/components/enhanced/PersonalBlogWorkspace';
import EnhancedPortfolioView from '@/components/enhanced/EnhancedPortfolioView';
import PersonalAnalyticsDashboard from '@/components/enhanced/PersonalAnalyticsDashboard';
import { SecurityMonitoringDashboard } from '@/components/enhanced/SecurityMonitoringDashboard';
import GitHubRepoManager from '@/components/enhanced/GitHubRepoManager';

interface GitHubTokenStatus {
  hasToken: boolean;
  isValid: boolean;
  lastValidated: string | null;
  scope: string | null;
}

export default function Dashboard() {
  const { user, isLoading, isAuthenticated, isAdmin, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  
  const [githubSettingsOpen, setGithubSettingsOpen] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<GitHubTokenStatus | null>(null);
  const [token, setToken] = useState('');
  const [scope, setScope] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenMessage, setTokenMessage] = useState('');
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    
    if (!isLoading && !isAuthenticated) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    
    if (isAuthenticated && user) {
      fetchTokenStatus();
    }
  }, [isAuthenticated, user]);

  const fetchTokenStatus = async () => {
    try {
      const response = await fetch('/api/user/github/status', {
        credentials: 'include'
      });
      if (response.ok) {
        const status = await response.json();
        setTokenStatus(status);
      }
    } catch (err) {
      console.error('Error fetching token status:', err);
    }
  };

  const saveToken = async () => {
    if (!token.trim()) {
      setTokenError('Please enter a GitHub token');
      return;
    }

    setTokenLoading(true);
    setTokenError('');
    setTokenMessage('');

    try {
      const response = await fetch('/api/user/github/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.trim(), scope: scope.trim() || undefined }),
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok) {
        setTokenMessage('Token saved securely');
        setToken('');
        setScope('');
        await fetchTokenStatus();
      } else {
        setTokenError(result.error || 'Failed to save token');
      }
    } catch (err) {
      setTokenError('Failed to save token');
    } finally {
      setTokenLoading(false);
    }
  };

  const removeToken = async () => {
    if (!confirm('Are you sure you want to remove your GitHub token?')) {
      return;
    }

    setTokenLoading(true);
    setTokenError('');
    setTokenMessage('');

    try {
      const response = await fetch('/api/user/github/token', {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok) {
        setTokenMessage('GitHub token removed successfully');
        await fetchTokenStatus();
      } else {
        setTokenError(result.error || 'Failed to remove token');
      }
    } catch (err) {
      setTokenError('Failed to remove token');
    } finally {
      setTokenLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-matrix-black via-zinc-900 to-matrix-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-matrix-black via-zinc-900 to-matrix-black flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg">Access denied. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-matrix-black via-zinc-900 to-matrix-black">
      
      <header className="border-b border-cyan-500/30 bg-zinc-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">
                <span className="text-neon-cyan">RafalW3bCraft</span> Dashboard
              </h1>
              {isAdmin && (
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-900/50 rounded-full">
                  <Crown className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-300 text-sm font-medium">Admin</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => {
                  const username = user?.id?.replace(/[^a-zA-Z0-9]/g, '') || 'user';
                  window.open(`/blog/${username}`, '_blank');
                }}
                variant="outline"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
              >
                <Monitor className="h-4 w-4 mr-2" />
                View Site
              </Button>
              <Button
                onClick={() => setLocation('/site-builder')}
                variant="outline"
                className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
              >
                <Settings className="h-4 w-4 mr-2" />
                Customize Site
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      
      <main className="container mx-auto px-4 py-8">
        
        <div className="mb-8">
          <Card className="bg-zinc-900/90 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 text-xl flex items-center gap-3">
                <Zap className="h-6 w-6" />
                Welcome to your Dashboard, {user.firstName || 'User'}!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 mb-4">
                Access granted to RafalW3bCraft cybersecurity platform. Your secure portal for 
                advanced cyber operations and portfolio management.
              </p>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-400">
                  Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'First time'}
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <Activity className="h-4 w-4" />
                  <span className="text-sm">System Online</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        
        <div className="mb-8">
          <Card className="bg-zinc-900/90 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400 flex items-center gap-2">
                <User className="h-5 w-5" />
                User Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                {user.profileImageUrl && (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="w-16 h-16 rounded-full border-2 border-cyan-500/50"
                  />
                )}
                
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-zinc-400 text-sm">Name</label>
                      <p className="text-white">
                        {user.firstName} {user.lastName || ''}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-zinc-400 text-sm">Email</label>
                      <p className="text-white flex items-center gap-2">
                        <Mail className="h-4 w-4 text-cyan-400" />
                        {user.email || 'Not provided'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-zinc-400 text-sm">Username</label>
                      <p className="text-white">{user.username || 'Not set'}</p>
                    </div>
                    
                    <div>
                      <label className="text-zinc-400 text-sm">Authentication Provider</label>
                      <p className="text-white flex items-center gap-2">
                        {user.provider === 'google' && <Mail className="h-4 w-4 text-red-400" />}
                        {user.provider === 'github' && <Github className="h-4 w-4 text-gray-400" />}
                        {user.provider || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  {user.bio && (
                    <div className="mt-4">
                      <label className="text-zinc-400 text-sm">Bio</label>
                      <p className="text-white mt-1">{user.bio}</p>
                    </div>
                  )}

                  
                  <div className="mt-6 pt-4 border-t border-cyan-500/20">
                    <Collapsible open={githubSettingsOpen} onOpenChange={setGithubSettingsOpen}>
                      <CollapsibleTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between p-0 text-cyan-400 hover:text-cyan-300"
                        >
                          <div className="flex items-center gap-2">
                            <Github className="h-4 w-4" />
                            <span className="font-medium">GitHub Token Management</span>
                          </div>
                          {githubSettingsOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="space-y-4 mt-4">
                        
                        {tokenStatus && (
                          <div className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                            <div className="flex items-center gap-2">
                              {tokenStatus.hasToken ? (
                                tokenStatus.isValid ? (
                                  <CheckCircle className="h-4 w-4 text-green-400" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-400" />
                                )
                              ) : (
                                <Key className="h-4 w-4 text-zinc-400" />
                              )}
                              <span className="text-sm font-medium text-white">
                                {tokenStatus.hasToken
                                  ? tokenStatus.isValid
                                    ? 'Token Active'
                                    : 'Token Invalid'
                                  : 'No Token'}
                              </span>
                            </div>
                            {tokenStatus.scope && (
                              <Badge variant="secondary" className="text-xs">
                                Scope: {tokenStatus.scope}
                              </Badge>
                            )}
                            {tokenStatus.lastValidated && (
                              <span className="text-xs text-zinc-400">
                                Last validated: {new Date(tokenStatus.lastValidated).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}

                        
                        {tokenMessage && (
                          <Alert className="border-green-500/30 bg-green-500/10">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <AlertDescription className="text-green-300">{tokenMessage}</AlertDescription>
                          </Alert>
                        )}

                        {tokenError && (
                          <Alert className="border-red-500/30 bg-red-500/10">
                            <XCircle className="h-4 w-4 text-red-400" />
                            <AlertDescription className="text-red-300">{tokenError}</AlertDescription>
                          </Alert>
                        )}

                        
                        {(!tokenStatus?.hasToken || !tokenStatus?.isValid) && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-zinc-300 mb-2">
                                GitHub Personal Access Token
                              </label>
                              <Input
                                type="password"
                                placeholder="ghp_... or github_pat_..."
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="bg-zinc-800 border-zinc-600 text-white placeholder-zinc-400 font-mono"
                              />
                              <p className="text-xs text-zinc-400 mt-1">
                                Generate at GitHub → Settings → Developer settings → Personal access tokens
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Token Scope (Optional)
                              </label>
                              <Input
                                placeholder="repo, user, workflow, etc."
                                value={scope}
                                onChange={(e) => setScope(e.target.value)}
                                className="bg-zinc-800 border-zinc-600 text-white placeholder-zinc-400"
                              />
                              <p className="text-xs text-zinc-400 mt-1">
                                Describe the permissions your token has
                              </p>
                            </div>

                            <Button 
                              onClick={saveToken} 
                              disabled={tokenLoading}
                              className="bg-cyan-600 hover:bg-cyan-700 text-white"
                            >
                              {tokenLoading ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Key className="h-4 w-4 mr-2" />
                              )}
                              Save Token
                            </Button>
                          </div>
                        )}

                        
                        {tokenStatus?.hasToken && (
                          <div className="flex gap-2">
                            <Button 
                              variant="destructive" 
                              onClick={removeToken} 
                              disabled={tokenLoading}
                              size="sm"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Token
                            </Button>
                          </div>
                        )}

                        
                        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                              <h4 className="text-sm font-medium text-orange-300">Security Notice</h4>
                              <p className="text-xs text-orange-200/80">
                                Your GitHub token is encrypted and stored securely. It's used only to access your repositories 
                                and perform authorized actions on your behalf. You can remove it at any time.
                              </p>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        
        <Tabs defaultValue="blog" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-zinc-800/50 border-zinc-700">
            <TabsTrigger value="blog" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
              <PenTool className="h-4 w-4 mr-2" />
              Blog Workspace
            </TabsTrigger>
            <TabsTrigger value="github" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <Github className="h-4 w-4 mr-2" />
              GitHub Repos
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              <Code className="h-4 w-4 mr-2" />
              Portfolio Projects
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics Dashboard
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              Security Monitor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blog" className="mt-6">
            <PersonalBlogWorkspace />
          </TabsContent>

          <TabsContent value="github" className="mt-6">
            <GitHubRepoManager />
          </TabsContent>

          <TabsContent value="portfolio" className="mt-6">
            <EnhancedPortfolioView />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <PersonalAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecurityMonitoringDashboard />
          </TabsContent>
        </Tabs>

        
        {isAdmin && (
          <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Admin Control Panel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-300 mb-6">
                Advanced administrative functions and system management tools.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  onClick={() => setLocation('/admin')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  System Admin
                </Button>
                
                <Button
                  onClick={() => setLocation('/settings')}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Security Center
                </Button>
                
                <Button
                  onClick={() => window.open('/api/analytics/stats', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  System Health
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}