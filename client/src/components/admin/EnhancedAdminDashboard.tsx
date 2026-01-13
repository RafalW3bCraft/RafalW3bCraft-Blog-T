

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import AdminContentManager from './AdminContentManager';
import AdminUserSecurityManager from './AdminUserSecurityManager';
import { UserActivity } from '@shared/types';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Activity,
  Bug,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Database,
  Server,
  Route,
  Settings,
  Play,
  RefreshCw,
  Download,
  Eye,
  UserCheck,
  AlertCircle
} from 'lucide-react';

interface BugScanResult {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'function_error' | 'missing_route' | 'missing_function' | 'performance' | 'security';
  description: string;
  location: string;
  fixRecommendation: string;
  autoFixable: boolean;
}

interface SystemAnalysis {
  totalUsers: number;
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  memoryUsage: number;
  uptime: number;
  criticalIssues: BugScanResult[];
  performanceMetrics: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  };
}

export function EnhancedAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [scanInProgress, setScanInProgress] = useState(false);
  const queryClient = useQueryClient();

  
  const { data: bugScanResults, isLoading: bugScanLoading, refetch: refetchBugScan } = useQuery<{
    success: boolean;
    totalIssues: number;
    criticalIssues: number;
    bugs: BugScanResult[];
  }>({
    queryKey: ['/api/admin/bug-scan'],
    enabled: false 
  });

  const { data: userActivities, isLoading: userActivitiesLoading } = useQuery<{
    success: boolean;
    totalUsers: number;
    highRiskUsers: number;
    suspiciousUsers: number;
    activities: UserActivity[];
  }>({
    queryKey: ['/api/admin/user-activities'],
    refetchInterval: 60000 
  });

  const { data: systemAnalysis, isLoading: systemAnalysisLoading } = useQuery<{
    success: boolean;
    analysis: SystemAnalysis;
  }>({
    queryKey: ['/api/admin/system-analysis'],
    refetchInterval: 30000 
  });

  const { data: routeAnalysis, isLoading: routeAnalysisLoading } = useQuery<{
    success: boolean;
    routeUsage: { [key: string]: number };
    missingRoutes: string[];
    underusedRoutes: string[];
    mostUsedRoutes: [string, number][];
  }>({
    queryKey: ['/api/admin/route-analysis'],
    refetchInterval: 300000 
  });

  
  const autoFixMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/auto-fix', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Auto-fix failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bug-scan'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/system-analysis'] });
    }
  });

  
  const triggerBugScan = async () => {
    setScanInProgress(true);
    try {
      await refetchBugScan();
    } finally {
      setScanInProgress(false);
    }
  };

  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-100';
      case 'high': return 'text-orange-500 bg-orange-100';
      case 'medium': return 'text-yellow-500 bg-yellow-100';
      case 'low': return 'text-blue-500 bg-blue-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 40) return 'text-orange-500';
    if (score >= 20) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="p-6 space-y-6 bg-matrix-black min-h-screen">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-cyber text-neon-cyan">FALCON ADMIN COMMAND CENTER</h1>
          <p className="text-gray-400 font-mono">Advanced system monitoring and administration</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={triggerBugScan}
            disabled={scanInProgress}
            className="cyber-button"
          >
            {scanInProgress ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Bug className="h-4 w-4 mr-2" />}
            {scanInProgress ? 'Scanning...' : 'Run Bug Scan'}
          </Button>
          <Button
            onClick={() => autoFixMutation.mutate()}
            disabled={autoFixMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {autoFixMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Auto-Fix
          </Button>
        </div>
      </div>

      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="terminal-window border-neon-cyan">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">System Health</p>
                <p className={`text-lg font-bold ${
                  systemAnalysis?.analysis.systemHealth === 'healthy' ? 'text-green-400' :
                  systemAnalysis?.analysis.systemHealth === 'warning' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {systemAnalysis?.analysis.systemHealth?.toUpperCase() || 'LOADING'}
                </p>
              </div>
              <Shield className={`h-8 w-8 ${
                systemAnalysis?.analysis.systemHealth === 'healthy' ? 'text-green-400' :
                systemAnalysis?.analysis.systemHealth === 'warning' ? 'text-yellow-400' : 'text-red-400'
              }`} />
            </div>
          </CardContent>
        </Card>

        <Card className="terminal-window border-neon-purple">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <p className="text-lg font-bold text-neon-purple">
                  {userActivities?.totalUsers || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-neon-purple" />
            </div>
          </CardContent>
        </Card>

        <Card className="terminal-window border-neon-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Critical Issues</p>
                <p className="text-lg font-bold text-red-400">
                  {bugScanResults?.criticalIssues || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="terminal-window border-cyber-yellow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Memory Usage</p>
                <p className="text-lg font-bold text-cyber-yellow">
                  {systemAnalysis?.analysis.memoryUsage ? `${Math.round(systemAnalysis.analysis.memoryUsage)}MB` : 'N/A'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-cyber-yellow" />
            </div>
          </CardContent>
        </Card>
      </div>

      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bugs">Bug Analysis</TabsTrigger>
          <TabsTrigger value="users">User Monitor</TabsTrigger>
          <TabsTrigger value="content">Content Mgmt</TabsTrigger>
          <TabsTrigger value="routes">Route Analysis</TabsTrigger>
          <TabsTrigger value="system">System Status</TabsTrigger>
        </TabsList>

        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <Card className="terminal-window">
              <CardHeader>
                <CardTitle className="text-neon-cyan flex items-center">
                  <Bug className="h-5 w-5 mr-2" />
                  Bug Scan Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bugScanResults ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Total Issues</span>
                      <Badge variant="outline">{bugScanResults.totalIssues}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Critical Issues</span>
                      <Badge className="bg-red-600">{bugScanResults.criticalIssues}</Badge>
                    </div>
                    <Progress 
                      value={bugScanResults.criticalIssues === 0 ? 100 : (bugScanResults.totalIssues - bugScanResults.criticalIssues) / bugScanResults.totalIssues * 100} 
                      className="w-full"
                    />
                  </div>
                ) : (
                  <p className="text-gray-400">No recent bug scan data. Click "Run Bug Scan" to analyze.</p>
                )}
              </CardContent>
            </Card>

            
            <Card className="terminal-window">
              <CardHeader>
                <CardTitle className="text-neon-purple flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  User Activity Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userActivities ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Total Users</span>
                      <Badge variant="outline">{userActivities.totalUsers}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>High Risk Users</span>
                      <Badge className="bg-orange-600">{userActivities.highRiskUsers}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Suspicious Activity</span>
                      <Badge className="bg-red-600">{userActivities.suspiciousUsers}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse">Loading user data...</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        
        <TabsContent value="bugs" className="space-y-4">
          <Card className="terminal-window">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Comprehensive Bug Analysis
              </CardTitle>
              <CardDescription>
                System-wide bug detection and analysis with auto-fix recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bugScanLoading || scanInProgress ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-neon-cyan" />
                  <p className="text-gray-400">Performing comprehensive system scan...</p>
                </div>
              ) : bugScanResults && bugScanResults.bugs.length > 0 ? (
                <div className="space-y-4">
                  {bugScanResults.bugs.map((bug, index) => (
                    <Alert key={index} className="border-gray-700">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getSeverityColor(bug.severity)}>
                                {bug.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">{bug.category}</Badge>
                              {bug.autoFixable && (
                                <Badge className="bg-green-600">AUTO-FIXABLE</Badge>
                              )}
                            </div>
                            <p className="font-medium">{bug.description}</p>
                            <p className="text-sm text-gray-400 mt-1">Location: {bug.location}</p>
                            <p className="text-sm text-blue-400 mt-2">💡 {bug.fixRecommendation}</p>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <p className="text-green-400 font-semibold">No critical issues detected!</p>
                  <p className="text-gray-400">System is running optimally.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        
        <TabsContent value="users" className="space-y-4">
          <AdminUserSecurityManager />
        </TabsContent>

        
        <TabsContent value="content" className="space-y-4">
          <AdminContentManager />
        </TabsContent>

        
        <TabsContent value="routes" className="space-y-4">
          <Card className="terminal-window">
            <CardHeader>
              <CardTitle className="text-neon-green flex items-center">
                <Route className="h-5 w-5 mr-2" />
                API Route Analysis
              </CardTitle>
              <CardDescription>
                Monitor API endpoint usage and identify missing or underused routes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {routeAnalysisLoading ? (
                <div className="animate-pulse">Analyzing routes...</div>
              ) : routeAnalysis ? (
                <div className="space-y-6">
                  
                  {routeAnalysis.missingRoutes.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-400 mb-3">Missing Routes ({routeAnalysis.missingRoutes.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {routeAnalysis.missingRoutes.map((route, index) => (
                          <Badge key={index} variant="destructive" className="justify-start">
                            {route}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  
                  <div>
                    <h4 className="font-semibold text-green-400 mb-3">Most Used Routes</h4>
                    <div className="space-y-2">
                      {routeAnalysis.mostUsedRoutes.slice(0, 5).map(([route, count], index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                          <span className="font-mono text-sm">{route}</span>
                          <Badge variant="outline">{count} hits</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  
                  {routeAnalysis.underusedRoutes.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-yellow-400 mb-3">Underused Routes ({routeAnalysis.underusedRoutes.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {routeAnalysis.underusedRoutes.map((route, index) => (
                          <Badge key={index} className="bg-yellow-600 justify-start">
                            {route}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No route analysis data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        
        <TabsContent value="system" className="space-y-4">
          <Card className="terminal-window">
            <CardHeader>
              <CardTitle className="text-neon-cyan flex items-center">
                <Server className="h-5 w-5 mr-2" />
                System Health & Performance
              </CardTitle>
              <CardDescription>
                Detailed system metrics and performance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {systemAnalysisLoading ? (
                <div className="animate-pulse">Loading system analysis...</div>
              ) : systemAnalysis ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white">System Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Memory Usage:</span>
                        <span className="text-cyan-400">{Math.round(systemAnalysis.analysis.memoryUsage)}MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uptime:</span>
                        <span className="text-green-400">{Math.round(systemAnalysis.analysis.uptime / 3600)}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Users:</span>
                        <span className="text-blue-400">{systemAnalysis.analysis.totalUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Users:</span>
                        <span className="text-purple-400">{systemAnalysis.analysis.activeUsers}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-white">Performance Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Avg Response Time:</span>
                        <span className="text-yellow-400">{systemAnalysis.analysis.performanceMetrics.avgResponseTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Error Rate:</span>
                        <span className="text-red-400">{(systemAnalysis.analysis.performanceMetrics.errorRate * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Throughput:</span>
                        <span className="text-green-400">{systemAnalysis.analysis.performanceMetrics.throughput}/min</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No system analysis data available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}