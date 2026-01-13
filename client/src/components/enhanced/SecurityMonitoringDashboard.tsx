import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Eye, 
  Clock,
  TrendingUp,
  Users,
  Download,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface SecurityEvent {
  id: number;
  action: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;
  ipAddress: string;
  userId?: string;
  riskScore?: number;
}

interface RealTimeMetrics {
  activeUsers: number;
  pageViews: number;
  totalProjects: number;
  totalStars: number;
  securityEvents: number;
  lastUpdated: string;
}

export function SecurityMonitoringDashboard() {
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  
  const { data: securityData, refetch } = useQuery({
    queryKey: ['security-monitoring'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/analytics/security-events');
      return res.json();
    },
    refetchInterval: 30000 
  });

  
  useEffect(() => {
    
    const interval = setInterval(async () => {
      try {
        const metricsRes = await apiRequest('GET', '/api/analytics/real-time-metrics');
        const metrics = await metricsRes.json();
        setRealTimeMetrics(metrics);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to fetch real-time metrics:', error);
        setIsConnected(false);
      }
    }, 5000); 

    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'error': return 'bg-red-400 text-white';
      case 'warning': return 'bg-yellow-500 text-black';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-blue-500';
    return 'text-green-500';
  };

  const exportSecurityReport = async () => {
    try {
      const response = await apiRequest('GET', '/api/analytics/security-export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export security report:', error);
    }
  };

  return (
    <div className="space-y-6">
      
      <Card className="bg-zinc-900/90 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Monitoring Dashboard
            <Badge variant={isConnected ? 'default' : 'destructive'} className="ml-2">
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {realTimeMetrics && (
              <>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{realTimeMetrics.activeUsers}</div>
                  <div className="text-sm text-zinc-400">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{realTimeMetrics.pageViews}</div>
                  <div className="text-sm text-zinc-400">Page Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{realTimeMetrics.totalProjects}</div>
                  <div className="text-sm text-zinc-400">Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{realTimeMetrics.totalStars}</div>
                  <div className="text-sm text-zinc-400">GitHub Stars</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{realTimeMetrics.securityEvents}</div>
                  <div className="text-sm text-zinc-400">Security Events (24h)</div>
                </div>
              </>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-zinc-400">
              Last updated: {realTimeMetrics?.lastUpdated ? 
                new Date(realTimeMetrics.lastUpdated).toLocaleTimeString() : 
                'Never'
              }
            </div>
            <div className="flex gap-2">
              <Button onClick={() => refetch()} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportSecurityReport} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      
      <Card className="bg-zinc-900/90 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {securityData?.events && securityData.events.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {securityData.events.map((event: SecurityEvent) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(event.severity)}>
                      {event.severity.toUpperCase()}
                    </Badge>
                    <div>
                      <div className="text-white font-medium">{event.action}</div>
                      <div className="text-sm text-zinc-400">
                        IP: {event.ipAddress} • {new Date(event.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {event.riskScore && (
                    <div className={`text-sm font-medium ${getRiskScoreColor(event.riskScore)}`}>
                      Risk: {event.riskScore}/100
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400">
              <Shield className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <p>No security events detected. System is secure.</p>
            </div>
          )}
        </CardContent>
      </Card>

      
      <Card className="bg-zinc-900/90 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Security Trends (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={securityData?.trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="securityEvents" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Security Events"
                />
                <Line 
                  type="monotone" 
                  dataKey="threatLevel" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  name="Threat Level"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}