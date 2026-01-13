import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Heart, 
  Shield, 
  Github,
  Trash2,
  CheckCircle,
  Clock,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';

interface NotificationSettings {
  emailNotifications: boolean;
  blogCommentNotifications: boolean;
  blogLikeNotifications: boolean;
  securityAlerts: boolean;
  githubSyncNotifications: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  emailFrequency: 'immediate' | 'daily' | 'weekly' | 'never';
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

interface NotificationHistory {
  id: string;
  type: 'email' | 'system' | 'security' | 'blog' | 'github';
  title: string;
  message: string;
  isRead: boolean;
  timestamp: string;
  action?: {
    label: string;
    url: string;
  };
}

export function UserNotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);

  
  const { data: settings, isLoading } = useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/user/notifications/settings');
      if (!response.ok) throw new Error('Failed to fetch notification settings');
      const data = await response.json();
      return data as NotificationSettings;
    },
    enabled: !!user?.id
  });

  
  const { data: history } = useQuery({
    queryKey: ['notification-history', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/user/notifications/history');
      if (!response.ok) throw new Error('Failed to fetch notification history');
      const data = await response.json();
      return data as NotificationHistory[];
    },
    enabled: !!user?.id && showHistory
  });

  
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationSettings>) => {
      const response = await fetch('/api/user/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update notification settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Notification settings updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Update failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/user/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
    }
  });

  
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/user/notifications/clear', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to clear notifications');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'All notifications cleared' });
      queryClient.invalidateQueries({ queryKey: ['notification-history'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to clear notifications', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean | string) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4 text-blue-600" />;
      case 'system': return <Settings className="h-4 w-4 text-gray-600" />;
      case 'security': return <Shield className="h-4 w-4 text-red-600" />;
      case 'blog': return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'github': return <Github className="h-4 w-4 text-purple-600" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getUnreadCount = () => {
    return history?.filter(notification => !notification.isRead).length || 0;
  };

  if (isLoading) {
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
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Email Notifications</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings?.emailNotifications ?? true}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="security-alerts">Security Alerts</Label>
                    <p className="text-sm text-gray-600">
                      Important security notifications
                    </p>
                  </div>
                  <Switch
                    id="security-alerts"
                    checked={settings?.securityAlerts ?? true}
                    onCheckedChange={(checked) => handleSettingChange('securityAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="system-updates">System Updates</Label>
                    <p className="text-sm text-gray-600">
                      Platform updates and maintenance
                    </p>
                  </div>
                  <Switch
                    id="system-updates"
                    checked={settings?.systemUpdates ?? true}
                    onCheckedChange={(checked) => handleSettingChange('systemUpdates', checked)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Activity Notifications</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="blog-comments">Blog Comments</Label>
                    <p className="text-sm text-gray-600">
                      New comments on your posts
                    </p>
                  </div>
                  <Switch
                    id="blog-comments"
                    checked={settings?.blogCommentNotifications ?? true}
                    onCheckedChange={(checked) => handleSettingChange('blogCommentNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="blog-likes">Blog Likes</Label>
                    <p className="text-sm text-gray-600">
                      Likes on your blog posts
                    </p>
                  </div>
                  <Switch
                    id="blog-likes"
                    checked={settings?.blogLikeNotifications ?? true}
                    onCheckedChange={(checked) => handleSettingChange('blogLikeNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="github-sync">GitHub Sync</Label>
                    <p className="text-sm text-gray-600">
                      Repository synchronization updates
                    </p>
                  </div>
                  <Switch
                    id="github-sync"
                    checked={settings?.githubSyncNotifications ?? true}
                    onCheckedChange={(checked) => handleSettingChange('githubSyncNotifications', checked)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Frequency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email-frequency">Notification Frequency</Label>
              <Select
                value={settings?.emailFrequency || 'immediate'}
                onValueChange={(value) => handleSettingChange('emailFrequency', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="daily">Daily Digest</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-digest">Weekly Digest</Label>
                <p className="text-sm text-gray-600">
                  Summary of your activity
                </p>
              </div>
              <Switch
                id="weekly-digest"
                checked={settings?.weeklyDigest ?? false}
                onCheckedChange={(checked) => handleSettingChange('weeklyDigest', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settings?.quietHoursEnabled ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            Quiet Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
              <p className="text-sm text-gray-600">
                Pause non-urgent notifications during specified hours
              </p>
            </div>
            <Switch
              id="quiet-hours"
              checked={settings?.quietHoursEnabled ?? false}
              onCheckedChange={(checked) => handleSettingChange('quietHoursEnabled', checked)}
            />
          </div>
          
          {settings?.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="quiet-start">Start Time</Label>
                <input
                  id="quiet-start"
                  type="time"
                  value={settings?.quietHoursStart || '22:00'}
                  onChange={(e) => handleSettingChange('quietHoursStart', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="quiet-end">End Time</Label>
                <input
                  id="quiet-end"
                  type="time"
                  value={settings?.quietHoursEnd || '08:00'}
                  onChange={(e) => handleSettingChange('quietHoursEnd', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Notifications
              {getUnreadCount() > 0 && (
                <Badge variant="destructive">{getUnreadCount()}</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Hide' : 'View'} History
              </Button>
              {showHistory && history && history.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => clearAllMutation.mutate()}
                  disabled={clearAllMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        {showHistory && (
          <CardContent>
            <div className="space-y-3">
              {history && history.length > 0 ? (
                history.slice(0, 15).map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`flex items-start gap-3 p-3 border rounded-lg ${!notification.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${!notification.isRead ? 'text-blue-900' : ''}`}>
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <Badge variant="outline" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>
                        <div className="flex gap-2">
                          {notification.action && (
                            <Button variant="link" size="sm" asChild>
                              <a href={notification.action.url} target="_blank" rel="noopener noreferrer">
                                {notification.action.label}
                              </a>
                            </Button>
                          )}
                          {!notification.isRead && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}