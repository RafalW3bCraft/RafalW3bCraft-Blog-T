import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Key,
  Eye,
  Download,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
  ipWhitelistEnabled: boolean;
  deviceTrackingEnabled: boolean;
}

interface LoginSession {
  id: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  isCurrent: boolean;
  lastActivity: string;
  createdAt: string;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'failed_login' | 'password_change' | 'suspicious_activity' | 'token_generated';
  description: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

export function UserSecuritySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSessions, setShowSessions] = useState(false);
  const [showSecurityEvents, setShowSecurityEvents] = useState(false);

  
  const { data: securitySettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['security-settings', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/user/security/settings');
      if (!response.ok) throw new Error('Failed to fetch security settings');
      const data = await response.json();
      return data as SecuritySettings;
    },
    enabled: !!user?.id
  });

  
  const { data: sessions } = useQuery({
    queryKey: ['user-sessions', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/user/security/sessions');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      return data as LoginSession[];
    },
    enabled: !!user?.id && showSessions
  });

  
  const { data: securityEvents } = useQuery({
    queryKey: ['security-events', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/user/security/events');
      if (!response.ok) throw new Error('Failed to fetch security events');
      const data = await response.json();
      return data as SecurityEvent[];
    },
    enabled: !!user?.id && showSecurityEvents
  });

  
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<SecuritySettings>) => {
      const response = await fetch('/api/user/security/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Failed to update security settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Security settings updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['security-settings'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Update failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/user/security/sessions/${sessionId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to revoke session');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Session revoked successfully' });
      queryClient.invalidateQueries({ queryKey: ['user-sessions'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to revoke session', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  
  const generateTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/user/security/generate-token', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to generate token');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: 'New API token generated', 
        description: 'Please copy and store it securely - it won\'t be shown again' 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Token generation failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  const handleSettingChange = (key: keyof SecuritySettings, value: boolean | number) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed_login': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'password_change': return <Key className="h-4 w-4 text-blue-600" />;
      case 'suspicious_activity': return <Eye className="h-4 w-4 text-orange-600" />;
      case 'token_generated': return <RefreshCw className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (settingsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Authentication</span>
              </div>
              <p className="text-sm text-green-700">
                OAuth secured via {user?.email?.includes('gmail') ? 'Google' : 'GitHub'}
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Key className="h-5 w-5" />
                <span className="font-medium">Encryption</span>
              </div>
              <p className="text-sm text-blue-700">
                AES-256-GCM for sensitive data
              </p>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700 mb-2">
                <Activity className="h-5 w-5" />
                <span className="font-medium">Monitoring</span>
              </div>
              <p className="text-sm text-purple-700">
                Real-time security logging
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader>
          <CardTitle>Security Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="login-notifications">Login Notifications</Label>
                <p className="text-sm text-gray-600">
                  Get notified when someone logs into your account
                </p>
              </div>
              <Switch
                id="login-notifications"
                checked={securitySettings?.loginNotifications ?? true}
                onCheckedChange={(checked) => handleSettingChange('loginNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="suspicious-alerts">Suspicious Activity Alerts</Label>
                <p className="text-sm text-gray-600">
                  Alert me about unusual account activity
                </p>
              </div>
              <Switch
                id="suspicious-alerts"
                checked={securitySettings?.suspiciousActivityAlerts ?? true}
                onCheckedChange={(checked) => handleSettingChange('suspiciousActivityAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="device-tracking">Device Tracking</Label>
                <p className="text-sm text-gray-600">
                  Track and monitor login devices
                </p>
              </div>
              <Switch
                id="device-tracking"
                checked={securitySettings?.deviceTrackingEnabled ?? true}
                onCheckedChange={(checked) => handleSettingChange('deviceTrackingEnabled', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Active Sessions
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSessions(!showSessions)}
            >
              {showSessions ? 'Hide' : 'View'} Sessions
            </Button>
          </CardTitle>
        </CardHeader>
        {showSessions && (
          <CardContent>
            <div className="space-y-3">
              {sessions?.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {session.userAgent.includes('Mobile') ? 
                        <Smartphone className="h-4 w-4" /> : 
                        <Monitor className="h-4 w-4" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {session.location || 'Unknown Location'}
                        </span>
                        {session.isCurrent && (
                          <Badge variant="default" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {session.ipAddress} • {new Date(session.lastActivity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => revokeSessionMutation.mutate(session.id)}
                      disabled={revokeSessionMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Security Activity
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSecurityEvents(!showSecurityEvents)}
            >
              {showSecurityEvents ? 'Hide' : 'View'} Events
            </Button>
          </CardTitle>
        </CardHeader>
        {showSecurityEvents && (
          <CardContent>
            <div className="space-y-3">
              {securityEvents?.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getEventIcon(event.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{event.description}</span>
                      <Badge className={getSeverityColor(event.severity)}>
                        {event.severity}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {event.ipAddress} • {event.location} • {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              API tokens provide programmatic access to your account. Keep them secure and never share them publicly.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => generateTokenMutation.mutate()}
              disabled={generateTokenMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {generateTokenMutation.isPending ? 'Generating...' : 'Generate New Token'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}