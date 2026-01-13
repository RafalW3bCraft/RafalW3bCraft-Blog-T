

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, Shield, Zap, Brain, Bot, 
  AlertTriangle, CheckCircle, Settings,
  Database, Activity, FileText, Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface FalconStatus {
  isRunning: boolean;
  config: {
    intervalHours: number;
    enableAutoGeneration: boolean;
    enableSecurityAudit: boolean;
    enablePerformanceMonitoring: boolean;
    enableCommunityModeration: boolean;
    featuredRepos: string[];
  };
  nextRun: string | null;
}

interface SystemHealth {
  id: number;
  metricType: string;
  metricName: string;
  value: any;
  status: string;
  checkedAt: string;
}

interface AuditLog {
  id: number;
  userId: string | null;
  action: string;
  resource: string;
  details: any;
  severity: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export function FalconProtocolPanel() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('status');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  
  const { data: falconStatus, isLoading: statusLoading } = useQuery<FalconStatus>({
    queryKey: ['/api/admin/falcon-status'],
    enabled: isAuthenticated && user?.role === 'admin',
    refetchInterval: 30000,
  });

  
  const { data: healthMetrics, isLoading: healthLoading } = useQuery<SystemHealth[]>({
    queryKey: ['/api/admin/system-health'],
    enabled: isAuthenticated && user?.role === 'admin',
    refetchInterval: 60000,
  });

  
  const { data: auditLogs, isLoading: auditLoading } = useQuery<AuditLog[]>({
    queryKey: ['/api/admin/audit-logs'],
    enabled: isAuthenticated && user?.role === 'admin',
    refetchInterval: 30000,
  });

  
  const configMutation = useMutation({
    mutationFn: async (config: Partial<FalconStatus['config']>) => {
      return apiRequest('POST', '/api/admin/falcon-config', { config });
    },
    onSuccess: () => {
      toast({ title: "Configuration updated", description: "Falcon Protocol settings have been updated." });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/falcon-status'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update configuration.", variant: "destructive" });
    },
  });

  
  const triggerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/falcon-trigger');
    },
    onSuccess: () => {
      toast({ title: "Enhancement cycle triggered", description: "Falcon Protocol is running enhancement cycle." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to trigger enhancement cycle.", variant: "destructive" });
    },
  });

  if (!isAuthenticated || (user as any)?.role !== 'admin') {
    return (
      <Card className="bg-zinc-900/90 border-red-500/50">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-mono">Access Denied - Admin Only</p>
        </CardContent>
      </Card>
    );
  }

  const updateConfig = (key: keyof FalconStatus['config'], value: any) => {
    if (falconStatus?.config) {
      const newConfig = { ...falconStatus.config, [key]: value };
      configMutation.mutate(newConfig);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-8 w-8 text-gold-accent" />
          <div>
            <h2 className="text-2xl font-cyber text-gold-accent">Falcon Protocol v∞</h2>
            <p className="text-gray-400 font-mono text-sm">Supreme System Control</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={falconStatus?.isRunning ? "default" : "secondary"} className="font-mono">
            {falconStatus?.isRunning ? "ACTIVE" : "INACTIVE"}
          </Badge>
          <Button
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending}
            className="bg-gold-accent hover:bg-gold-accent/80 text-matrix-black font-mono"
          >
            <Zap className="h-4 w-4 mr-2" />
            Trigger Enhancement
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-zinc-800 border-cyan-500/30">
          <TabsTrigger value="status" className="data-[state=active]:bg-gold-accent data-[state=active]:text-matrix-black">
            <Activity className="h-4 w-4 mr-2" />
            Status
          </TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Database className="h-4 w-4 mr-2" />
            System Health
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Shield className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        
        <TabsContent value="status" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/90 border-gold-accent/30">
              <CardHeader>
                <CardTitle className="text-gold-accent flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Protocol Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-mono">Running:</span>
                  <Badge variant={falconStatus?.isRunning ? "default" : "secondary"}>
                    {falconStatus?.isRunning ? "YES" : "NO"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-mono">Interval:</span>
                  <span className="text-cyan-400 font-mono">{falconStatus?.config?.intervalHours || 0}h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-mono">Next Run:</span>
                  <span className="text-green-400 font-mono text-sm">
                    {falconStatus?.nextRun ? new Date(falconStatus.nextRun).toLocaleTimeString() : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/90 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Enhancement Modules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-mono text-sm">Auto Generation:</span>
                  <CheckCircle className={`h-4 w-4 ${falconStatus?.config?.enableAutoGeneration ? 'text-green-400' : 'text-gray-500'}`} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-mono text-sm">Security Audit:</span>
                  <CheckCircle className={`h-4 w-4 ${falconStatus?.config?.enableSecurityAudit ? 'text-green-400' : 'text-gray-500'}`} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-mono text-sm">Performance Monitor:</span>
                  <CheckCircle className={`h-4 w-4 ${falconStatus?.config?.enablePerformanceMonitoring ? 'text-green-400' : 'text-gray-500'}`} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-mono text-sm">Community Moderation:</span>
                  <CheckCircle className={`h-4 w-4 ${falconStatus?.config?.enableCommunityModeration ? 'text-green-400' : 'text-gray-500'}`} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        
        <TabsContent value="config" className="mt-6">
          <Card className="bg-zinc-900/90 border-cyan-500/30">
            <CardHeader>
              <CardTitle className="text-cyan-400">Protocol Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300 font-mono text-sm">Auto Generation</label>
                    <Switch
                      checked={falconStatus?.config?.enableAutoGeneration || false}
                      onCheckedChange={(checked) => updateConfig('enableAutoGeneration', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300 font-mono text-sm">Security Audit</label>
                    <Switch
                      checked={falconStatus?.config?.enableSecurityAudit || false}
                      onCheckedChange={(checked) => updateConfig('enableSecurityAudit', checked)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300 font-mono text-sm">Performance Monitoring</label>
                    <Switch
                      checked={falconStatus?.config?.enablePerformanceMonitoring || false}
                      onCheckedChange={(checked) => updateConfig('enablePerformanceMonitoring', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-gray-300 font-mono text-sm">Community Moderation</label>
                    <Switch
                      checked={falconStatus?.config?.enableCommunityModeration || false}
                      onCheckedChange={(checked) => updateConfig('enableCommunityModeration', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        
        <TabsContent value="health" className="mt-6">
          <div className="space-y-4">
            {healthLoading ? (
              <Card className="bg-zinc-900/90 border-cyan-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              healthMetrics?.map((metric) => (
                <Card key={metric.id} className="bg-zinc-900/90 border-cyan-500/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-cyan-400 text-sm font-mono">
                        {metric.metricType.toUpperCase()} - {metric.metricName}
                      </CardTitle>
                      <Badge variant={metric.status === 'healthy' ? 'default' : 'destructive'}>
                        {metric.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-300 font-mono text-sm">
                      <pre>{JSON.stringify(metric.value, null, 2)}</pre>
                    </div>
                    <div className="text-gray-500 text-xs mt-2">
                      {new Date(metric.checkedAt).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        
        <TabsContent value="audit" className="mt-6">
          <div className="space-y-2">
            {auditLoading ? (
              <Card className="bg-zinc-900/90 border-purple-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              auditLogs?.map((log) => (
                <Card key={log.id} className="bg-zinc-900/90 border-purple-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          log.severity === 'critical' ? 'destructive' : 
                          log.severity === 'warning' ? 'secondary' : 'default'
                        }>
                          {log.severity.toUpperCase()}
                        </Badge>
                        <span className="text-cyan-400 font-mono text-sm">{log.action}</span>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-gray-300 font-mono text-sm">
                      Resource: {log.resource} | IP: {log.ipAddress}
                    </div>
                    {log.details && (
                      <div className="text-gray-400 text-xs mt-2 font-mono">
                        {JSON.stringify(log.details)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}