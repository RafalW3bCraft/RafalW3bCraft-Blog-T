import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Github, Key, CheckCircle, XCircle, RefreshCw, Trash2, Shield } from 'lucide-react';

interface GitHubTokenStatus {
  hasToken: boolean;
  isValid: boolean;
  lastValidated: string | null;
  scope: string | null;
}

export function UserGithubSettings() {
  const [tokenStatus, setTokenStatus] = useState<GitHubTokenStatus | null>(null);
  const [token, setToken] = useState('');
  const [scope, setScope] = useState('');
  const [repositories, setRepositories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTokenStatus();
  }, []);

  const fetchTokenStatus = async () => {
    try {
      const response = await fetch('/api/user/github/status');
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
      setError('Please enter a GitHub token');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/user/github/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.trim(), scope: scope.trim() || undefined }),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('GitHub token saved successfully');
        setToken('');
        setScope('');
        await fetchTokenStatus();
      } else {
        setError(result.error || 'Failed to save token');
      }
    } catch (err) {
      setError('Failed to save token');
    } finally {
      setLoading(false);
    }
  };

  const validateToken = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/user/github/validate', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        if (result.isValid) {
          setMessage('Token is valid and working');
        } else {
          setError('Token is invalid or expired');
        }
        await fetchTokenStatus();
      } else {
        setError(result.error || 'Failed to validate token');
      }
    } catch (err) {
      setError('Failed to validate token');
    } finally {
      setLoading(false);
    }
  };

  const removeToken = async () => {
    if (!confirm('Are you sure you want to remove your GitHub token?')) {
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/user/github/token', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        setMessage('GitHub token removed successfully');
        setRepositories([]);
        await fetchTokenStatus();
      } else {
        setError(result.error || 'Failed to remove token');
      }
    } catch (err) {
      setError('Failed to remove token');
    } finally {
      setLoading(false);
    }
  };

  const fetchRepositories = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user/github/repositories');
      const result = await response.json();

      if (response.ok) {
        setRepositories(result);
        setMessage(`Fetched ${result.length} repositories`);
      } else {
        setError(result.error || 'Failed to fetch repositories');
      }
    } catch (err) {
      setError('Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Token Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {tokenStatus && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {tokenStatus.hasToken ? (
                  tokenStatus.isValid ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )
                ) : (
                  <Key className="h-5 w-5 text-gray-400" />
                )}
                <span className="font-medium">
                  {tokenStatus.hasToken
                    ? tokenStatus.isValid
                      ? 'Token Active'
                      : 'Token Invalid'
                    : 'No Token'}
                </span>
              </div>
              {tokenStatus.scope && (
                <Badge variant="secondary">
                  Scope: {tokenStatus.scope}
                </Badge>
              )}
              {tokenStatus.lastValidated && (
                <span className="text-sm text-gray-500">
                  Last validated: {new Date(tokenStatus.lastValidated).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          
          {message && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">
                GitHub Personal Access Token
              </label>
              <Input
                type="password"
                placeholder="ghp_... or github_pat_..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Generate a token at GitHub → Settings → Developer settings → Personal access tokens
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Token Scope (Optional)
              </label>
              <Input
                placeholder="repo, user, etc."
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Describe the permissions your token has
              </p>
            </div>
          </div>

          
          <div className="flex gap-2 flex-wrap">
            <Button onClick={saveToken} disabled={loading}>
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
              Save Token
            </Button>

            {tokenStatus?.hasToken && (
              <>
                <Button variant="outline" onClick={validateToken} disabled={loading}>
                  <Shield className="h-4 w-4 mr-2" />
                  Validate
                </Button>

                <Button variant="outline" onClick={fetchRepositories} disabled={loading}>
                  <Github className="h-4 w-4 mr-2" />
                  Load Repos
                </Button>

                <Button variant="destructive" onClick={removeToken} disabled={loading}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      
      {repositories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your GitHub Repositories ({repositories.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {repositories.map((repo) => (
                <div key={repo.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{repo.name}</h4>
                    {repo.description && (
                      <p className="text-sm text-gray-600">{repo.description}</p>
                    )}
                    <div className="flex gap-2 mt-1">
                      {repo.language && (
                        <Badge variant="secondary" className="text-xs">
                          {repo.language}
                        </Badge>
                      )}
                      {repo.private && (
                        <Badge variant="outline" className="text-xs">
                          Private
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>⭐ {repo.stargazers_count}</div>
                    <div>🍴 {repo.forks_count}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-orange-500 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-orange-800">Security Notice</h4>
              <p className="text-sm text-orange-700">
                Your GitHub token is encrypted and stored securely. It's used only to access your repositories 
                and perform authorized actions on your behalf. You can remove it at any time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}