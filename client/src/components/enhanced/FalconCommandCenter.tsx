import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, Shield, Activity, Zap, Brain, Bot, 
  AlertTriangle, CheckCircle, Clock, RefreshCw,
  MessageSquare, FileText, Users, Database
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { audioService } from '@/lib/audioService';
import { apiRequest } from '@/lib/queryClient';
import AIBlogWriter from './AIBlogWriter';
import { FalconProtocolPanel } from './FalconProtocolPanel';

interface AgentStatus {
  isRunning: boolean;
  config: {
    intervalHours: number;
    featuredRepos: string[];
    enableAutoGeneration: boolean;
    enableSecurityAudit: boolean;
  };
  nextRun: string | null;
}

export function FalconCommandCenter() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  
  const { data: agentStatus, isLoading: statusLoading } = useQuery<AgentStatus>({
    queryKey: ['/api/admin/agent-status'],
    enabled: isAuthenticated && user?.role === 'admin',
    refetchInterval: 30000, 
  });

  
  const maintenanceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/trigger-maintenance');
    },
    onSuccess: () => {
      toast({
        title: 'Maintenance Initiated',
        description: 'Full system maintenance cycle started',
      });
      audioService.playSuccessSound();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agent-status'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Maintenance Failed',
        description: error.message || 'Failed to trigger maintenance',
        variant: 'destructive',
      });
      audioService.playErrorSound();
    },
  });

  
  const securityAuditMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/trigger-security-audit');
    },
    onSuccess: () => {
      toast({
        title: 'Security Audit Started',
        description: 'Comprehensive security audit initiated',
      });
      audioService.playSuccessSound();
    },
    onError: (error: any) => {
      toast({
        title: 'Security Audit Failed',
        description: error.message || 'Failed to trigger security audit',
        variant: 'destructive',
      });
      audioService.playErrorSound();
    },
  });

  
  const blogGenerationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/ai/generate-all-blogs');
    },
    onSuccess: () => {
      toast({
        title: 'Blog Generation Started',
        description: 'AI blog generation for all repositories initiated',
      });
      audioService.playSuccessSound();
    },
    onError: (error: any) => {
      toast({
        title: 'Blog Generation Failed',
        description: error.message || 'Failed to trigger blog generation',
        variant: 'destructive',
      });
      audioService.playErrorSound();
    },
  });

  if (!isAuthenticated || (user as any)?.role !== 'admin') {
    return (
      <Card className="bg-zinc-900/90 border-red-500/30">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-zinc-400">Falcon Command Center requires admin privileges</p>
        </CardContent>
      </Card>
    );
  }

  const systemStats = [
    { 
      label: 'Agent Status', 
      value: agentStatus?.isRunning ? 'Active' : 'Inactive',
      icon: agentStatus?.isRunning ? CheckCircle : AlertTriangle,
      color: agentStatus?.isRunning ? 'text-green-400' : 'text-red-400'
    },
    { 
      label: 'Repositories', 
      value: agentStatus?.config?.featuredRepos?.length || '0',
      icon: Database,
      color: 'text-cyan-400'
    },
    { 
      label: 'Auto-Generation', 
      value: agentStatus?.config?.enableAutoGeneration ? 'Enabled' : 'Disabled',
      icon: Brain,
      color: agentStatus?.config?.enableAutoGeneration ? 'text-green-400' : 'text-orange-400'
    },
    { 
      label: 'Security Audit', 
      value: agentStatus?.config?.enableSecurityAudit ? 'Active' : 'Inactive',
      icon: Shield,
      color: agentStatus?.config?.enableSecurityAudit ? 'text-green-400' : 'text-red-400'
    },
  ];

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            <span className="text-gold-accent">Falcon's</span> Command Center
          </h1>
          <p className="text-zinc-400">Supreme continuous enhancement system</p>
        </div>
        <Badge variant="outline" className="border-gold-accent/50 text-gold-accent text-lg px-4 py-2">
          <Crown className="h-5 w-5 mr-2" />
          Supreme Control
        </Badge>
      </div>

      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {systemStats.map((stat, index) => (
          <Card key={index} className="bg-zinc-900/90 border-cyan-500/30">
            <CardContent className="p-4 text-center">
              <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
              <div className="text-lg font-bold text-white">{stat.value}</div>
              <div className="text-zinc-400 text-sm">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-zinc-800 border-cyan-500/30">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <Activity className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="falcon-protocol" className="data-[state=active]:bg-gold-accent data-[state=active]:text-matrix-black">
            <Shield className="h-4 w-4 mr-2" />
            Falcon Protocol
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <Zap className="h-4 w-4 mr-2" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <Brain className="h-4 w-4 mr-2" />
            Content AI
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/90 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {statusLoading ? (
                  <div className="text-center py-4 text-zinc-400">Loading status...</div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-300">Continuous Agent</span>
                        <Badge variant={agentStatus?.isRunning ? "default" : "destructive"}>
                          {agentStatus?.isRunning ? 'Running' : 'Stopped'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-300">Check Interval</span>
                        <span className="text-white">{agentStatus?.config?.intervalHours || 0}h</span>
                      </div>
                      {agentStatus?.nextRun && (
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-300">Next Run</span>
                          <span className="text-white">
                            {new Date(agentStatus.nextRun).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/90 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Monitored Repositories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {agentStatus?.config?.featuredRepos?.map((repo, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-zinc-300">{repo}</span>
                    </div>
                  )) || (
                    <div className="text-zinc-400 text-center py-4">Loading repositories...</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/90 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  System Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-zinc-300 text-sm">
                  Trigger comprehensive system maintenance including repository updates, 
                  performance optimization, and database cleanup.
                </p>
                <Button
                  onClick={() => maintenanceMutation.mutate()}
                  disabled={maintenanceMutation.isPending}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {maintenanceMutation.isPending ? 'Running...' : 'Start Full Maintenance'}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/90 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Automated Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300">Repository Sync</span>
                  <Badge variant="outline" className="border-green-500/50 text-green-400">
                    Every {agentStatus?.config?.intervalHours || 6}h
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300">Performance Audit</span>
                  <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                    Continuous
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300">Database Cleanup</span>
                  <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                    Weekly
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="falcon-protocol" className="space-y-6">
          <FalconProtocolPanel />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <AIBlogWriter />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-zinc-900/90 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-zinc-300 text-sm">
                Run comprehensive security audits including threat detection, 
                access pattern analysis, and content moderation review.
              </p>
              <Button
                onClick={() => securityAuditMutation.mutate()}
                disabled={securityAuditMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <Shield className="h-4 w-4 mr-2" />
                {securityAuditMutation.isPending ? 'Auditing...' : 'Start Security Audit'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FalconCommandCenter;