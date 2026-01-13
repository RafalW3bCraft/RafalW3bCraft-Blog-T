import { useState, useEffect } from 'react';
import { UserManagement } from '@/components/admin/UserManagement';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  LogOut, 
  Users, 
  Activity,
  Database,
  Eye,
  Clock,
  Server,
  AlertTriangle,
  CheckCircle2,
  Settings,
  FileText,
  BarChart3
} from 'lucide-react';

export default function AdminPanel() {
  const { user, isLoading, isAuthenticated, isAdmin, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [systemStats, setSystemStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState<string>('dashboard');

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, isAdmin, setLocation]);

  useEffect(() => {
    if (isAdmin) {
      fetchSystemStats();
    }
  }, [isAdmin]);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-blue-400">Loading admin panel...</div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null; 
  }

  
  if (currentView === 'users') {
    return <UserManagement onClose={() => setCurrentView('dashboard')} />;
  }

  const stats = [
    { label: 'System Status', value: 'Operational', icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Active Sessions', value: '1', icon: Users, color: 'text-blue-400' },
    { label: 'System Uptime', value: systemStats?.uptime || 'Loading...', icon: Clock, color: 'text-purple-400' },
    { label: 'Database Status', value: 'Connected', icon: Database, color: 'text-green-400' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-600/20 border border-red-500/30 rounded-lg">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Admin Command Center
              </h1>
              <p className="text-gray-400 mt-1">
                Falcon Protocol Administrative Interface
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setLocation('/dashboard')}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              User Dashboard
            </Button>
            
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-red-600 text-red-300 hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        
        <Alert className="bg-red-900/20 border-red-500/30">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200">
            <strong>Security Notice:</strong> You are accessing the administrative interface. 
            All actions are logged and monitored. Unauthorized access attempts will be reported.
          </AlertDescription>
        </Alert>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <p className="text-lg font-semibold text-gray-200">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-400" />
                User Management
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-300 hover:text-gray-100"
                onClick={() => setCurrentView('users')}
              >
                <Eye className="w-4 h-4 mr-2" />
                View All Users
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-300 hover:text-gray-100"
                onClick={() => setCurrentView('permissions')}
              >
                <Settings className="w-4 h-4 mr-2" />
                User Permissions
              </Button>
            </CardContent>
          </Card>

          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-400" />
                System Monitoring
              </CardTitle>
              <CardDescription className="text-gray-400">
                Monitor system performance and health
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-300 hover:text-gray-100"
                onClick={fetchSystemStats}
                disabled={loading}
              >
                <Server className="w-4 h-4 mr-2" />
                {loading ? 'Refreshing...' : 'System Health'}
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-300 hover:text-gray-100"
                disabled
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Performance Metrics
              </Button>
            </CardContent>
          </Card>

          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-purple-400" />
                Content Management
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage blog posts and content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-300 hover:text-gray-100"
                onClick={() => setLocation('/admin/posts')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Manage Blog Posts
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-gray-300 hover:text-gray-100"
                onClick={() => setLocation('/admin/new-post')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Create New Post
              </Button>
            </CardContent>
          </Card>
        </div>

        
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-400" />
              Administrative Session Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div>
                  <label className="text-sm text-gray-400">Admin User</label>
                  <p className="text-gray-200 font-mono">{user?.username || 'falcon_admin'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Access Level</label>
                  <Badge className="bg-red-600/20 text-red-300 border-red-500/30">
                    <Shield className="w-3 h-3 mr-1" />
                    Super Administrator
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-sm text-gray-400">Session Type</label>
                  <p className="text-gray-200">Administrative Login</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Login Time</label>
                  <p className="text-gray-200 text-sm">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <div className="text-center pt-4">
          <p className="text-xs text-gray-500 font-mono">
            RafalW3bCraft Admin Panel v2.0 | Falcon Protocol Active | All Actions Audited
          </p>
        </div>
      </div>
    </div>
  );
}