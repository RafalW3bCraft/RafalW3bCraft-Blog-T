import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Github, Mail, Shield, User, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Login() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  const [adminLoading, setAdminLoading] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const successParam = urlParams.get('success');
    
    if (errorParam) {
      switch (errorParam) {
        case 'auth_failed':
          setError('Authentication failed. Please try again.');
          break;
        case 'callback_failed':
          setError('Authentication callback failed. Please try again.');
          break;
        case 'access_denied':
          setError('Access denied. Please grant the necessary permissions.');
          break;
        default:
          setError('An authentication error occurred. Please try again.');
      }
      
      window.history.replaceState(null, document.title, '/login');
    }
    
    if (successParam) {
      setSuccess('Successfully logged in! Redirecting to dashboard...');
      setTimeout(() => setLocation('/dashboard'), 2000);
    }
  }, [setLocation]);

  useEffect(() => {
    if (isAuthenticated && user) {
      setLocation('/dashboard');
    }
  }, [isAuthenticated, user, setLocation]);

  const handleGoogleLogin = () => {
    setError(null);
    window.location.href = '/auth/google';
  };

  const handleGithubLogin = () => {
    setError(null);
    window.location.href = '/auth/github';
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminCredentials),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Admin login successful! Redirecting to dashboard...');
        setTimeout(() => setLocation('/admin'), 1500);
      } else {
        setError(data.error || 'Admin login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setAdminLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-matrix-black via-zinc-900 to-matrix-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-matrix-black via-zinc-900 to-matrix-black flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <p className="text-white text-lg">Already logged in. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-matrix-black via-zinc-900 to-matrix-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to <span className="text-neon-cyan">RafalW3bCraft</span>
          </h1>
          <p className="text-zinc-400">
            Sign in to access your cybersecurity dashboard
          </p>
        </div>

        <Card className="bg-zinc-900/90 border-cyan-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-cyan-400 text-xl">
              Choose Your Login Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            
            {success && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-400">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            
            <div className="flex space-x-2 mb-4">
              <Button
                onClick={() => setShowAdminForm(false)}
                variant={!showAdminForm ? "default" : "outline"}
                className={`flex-1 ${!showAdminForm ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-cyan-500 text-cyan-400'}`}
              >
                OAuth Login
              </Button>
              <Button
                onClick={() => setShowAdminForm(true)}
                variant={showAdminForm ? "default" : "outline"}
                className={`flex-1 ${showAdminForm ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-500 text-purple-400'}`}
              >
                <Lock className="h-4 w-4 mr-2" />
                Admin Login
              </Button>
            </div>

            {!showAdminForm ? (
              
              <div className="space-y-3">
                <Button
                  onClick={handleGoogleLogin}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg flex items-center justify-center gap-3"
                >
                  <Mail className="h-5 w-5" />
                  Continue with Google
                </Button>

                <Button
                  onClick={handleGithubLogin}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 text-lg flex items-center justify-center gap-3"
                >
                  <Github className="h-5 w-5" />
                  Continue with GitHub
                </Button>
              </div>
            ) : (
              
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-zinc-300">Admin Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={adminCredentials.username}
                    onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                    className="bg-zinc-800 border-zinc-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300">Admin Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={adminCredentials.password}
                    onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                    className="bg-zinc-800 border-zinc-600 text-white"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={adminLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg"
                >
                  {adminLoading ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      Admin Login
                    </>
                  )}
                </Button>
              </form>
            )}

            
            <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-cyan-400" />
                Secure Authentication
              </h3>
              <ul className="text-zinc-400 text-sm space-y-1">
                <li>• OAuth 2.0 secure authentication</li>
                <li>• No passwords to remember</li>
                <li>• Automatic account creation</li>
                <li>• Enterprise-grade security</li>
              </ul>
            </div>

            
            <div className="mt-4 p-4 bg-cyan-900/20 rounded-lg border border-cyan-500/30">
              <h3 className="text-cyan-400 font-semibold mb-2 flex items-center gap-2">
                <User className="h-4 w-4" />
                Access Levels
              </h3>
              <div className="text-zinc-300 text-sm space-y-1">
                <div>• <span className="text-green-400">Regular Users</span>: Dashboard, Blog access</div>
                <div>• <span className="text-purple-400">Admin Users</span>: Full system access</div>
              </div>
            </div>

            
            <div className="text-center pt-4">
              <p className="text-zinc-500 text-sm">
                By signing in, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}