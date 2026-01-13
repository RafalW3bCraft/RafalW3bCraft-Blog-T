

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserActivity } from '@shared/types';
import { 
  Shield, 
  AlertTriangle, 
  Users, 
  Ban,
  RefreshCw,
  Flag,
  Eye,
  Settings,
  Clock,
  Activity,
  UserX,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export function AdminUserSecurityManager() {
  const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null);
  const [securityAction, setSecurityAction] = useState<string>('');
  const [actionReason, setActionReason] = useState<string>('');
  const queryClient = useQueryClient();

  
  const { data: userActivities, isLoading: activitiesLoading } = useQuery<{
    success: boolean;
    totalUsers: number;
    highRiskUsers: number;
    suspiciousUsers: number;
    activities: UserActivity[];
  }>({
    queryKey: ['/api/admin/user-activities'],
    refetchInterval: 30000 
  });

  
  const securityActionMutation = useMutation({
    mutationFn: async (data: { action: string; userId: string; reason: string }) => {
      const response = await fetch('/api/admin/user-security-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Security action failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-activities'] });
      setSelectedUser(null);
      setSecurityAction('');
      setActionReason('');
    }
  });

  const handleSecurityAction = () => {
    if (selectedUser && securityAction && actionReason.trim()) {
      securityActionMutation.mutate({
        action: securityAction,
        userId: selectedUser.userId,
        reason: actionReason.trim()
      });
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-500 bg-red-100';
    if (score >= 40) return 'text-orange-500 bg-orange-100';
    if (score >= 20) return 'text-yellow-500 bg-yellow-100';
    return 'text-green-500 bg-green-100';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return 'CRITICAL';
    if (score >= 40) return 'HIGH';
    if (score >= 20) return 'MEDIUM';
    return 'LOW';
  };

  const sortedUsers = userActivities?.activities.sort((a, b) => b.riskScore - a.riskScore) || [];
  const criticalUsers = sortedUsers.filter(u => u.riskScore >= 70);
  const highRiskUsers = sortedUsers.filter(u => u.riskScore >= 40 && u.riskScore < 70);
  const suspiciousUsers = sortedUsers.filter(u => u.suspiciousActivities.length > 0);

  return (
    <div className="space-y-6">
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="terminal-window border-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Critical Users</p>
                <p className="text-2xl font-bold text-red-400">
                  {criticalUsers.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="terminal-window border-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">High Risk Users</p>
                <p className="text-2xl font-bold text-orange-400">
                  {highRiskUsers.length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="terminal-window border-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Suspicious Activity</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {suspiciousUsers.length}
                </p>
              </div>
              <Flag className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="terminal-window border-neon-cyan">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-neon-cyan">
                  {userActivities?.totalUsers || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-neon-cyan" />
            </div>
          </CardContent>
        </Card>
      </div>

      
      {criticalUsers.length > 0 && (
        <Alert className="border-red-500 bg-red-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>SECURITY ALERT:</strong> {criticalUsers.length} users with critical risk scores detected. 
            Immediate review recommended.
          </AlertDescription>
        </Alert>
      )}

      
      <Card className="terminal-window">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            User Security Monitor
          </CardTitle>
          <CardDescription>
            Monitor user activities, risk scores, and take security actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-neon-cyan" />
              <p className="text-gray-400">Loading user security data...</p>
            </div>
          ) : sortedUsers.length > 0 ? (
            <div className="space-y-4">
              {sortedUsers.map((user) => (
                <Card key={user.userId} className={`border-gray-700 ${user.riskScore >= 70 ? 'border-red-500' : user.riskScore >= 40 ? 'border-orange-500' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-100">
                            {user.username || user.email}
                          </h3>
                          <Badge className={getRiskScoreColor(user.riskScore)}>
                            {getRiskLevel(user.riskScore)} ({user.riskScore}/100)
                          </Badge>
                          {user.suspiciousActivities.length > 0 && (
                            <Badge variant="destructive" className="animate-pulse">
                              <Flag className="h-3 w-3 mr-1" />
                              FLAGGED
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400 mb-3">
                          <div>
                            <Clock className="h-4 w-4 inline mr-1" />
                            Last login: {new Date(user.lastLogin).toLocaleDateString()}
                          </div>
                          <div>
                            <Activity className="h-4 w-4 inline mr-1" />
                            {user.totalSessions} sessions
                          </div>
                          <div>
                            Actions: {user.totalActions}
                          </div>
                          <div>
                            Blog Posts: {user.blogPosts} / Drafts: {user.drafts}
                          </div>
                        </div>

                        {user.suspiciousActivities.length > 0 && (
                          <div className="bg-red-900/20 border border-red-500/30 rounded p-3 mb-3">
                            <h4 className="text-red-400 font-medium mb-2 flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Suspicious Activities Detected:
                            </h4>
                            <ul className="text-sm text-gray-300 space-y-1">
                              {user.suspiciousActivities.map((activity, i) => (
                                <li key={i} className="flex items-center">
                                  <XCircle className="h-3 w-3 mr-2 text-red-400 flex-shrink-0" />
                                  {activity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {user.riskScore >= 40 && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                                className={`border-red-500 text-red-500 hover:bg-red-500 hover:text-white ${user.riskScore >= 70 ? 'animate-pulse' : ''}`}
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                Security Action
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="text-red-400">Security Action Required</DialogTitle>
                                <DialogDescription>
                                  User: {user.username || user.email} (Risk Score: {user.riskScore}/100)
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Security Action:</label>
                                  <select 
                                    className="w-full mt-1 p-2 bg-gray-800 border border-gray-600 rounded"
                                    value={securityAction}
                                    onChange={(e) => setSecurityAction(e.target.value)}
                                  >
                                    <option value="">Select action...</option>
                                    <option value="block_suspicious_user">Block Suspicious User</option>
                                    <option value="reset_user_sessions">Reset User Sessions</option>
                                    <option value="flag_for_review">Flag for Manual Review</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Reason:</label>
                                  <Textarea 
                                    placeholder="Enter detailed reason for security action..."
                                    value={actionReason}
                                    onChange={(e) => setActionReason(e.target.value)}
                                    rows={3}
                                  />
                                </div>
                                {user.suspiciousActivities.length > 0 && (
                                  <div className="bg-red-900/20 p-3 rounded">
                                    <h4 className="text-red-400 text-sm font-medium mb-2">Detected Issues:</h4>
                                    <ul className="text-xs text-gray-300 space-y-1">
                                      {user.suspiciousActivities.map((activity, i) => (
                                        <li key={i}>• {activity}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => {
                                    setSelectedUser(null);
                                    setSecurityAction('');
                                    setActionReason('');
                                  }}>
                                    Cancel
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    onClick={handleSecurityAction}
                                    disabled={!securityAction || !actionReason.trim() || securityActionMutation.isPending}
                                  >
                                    {securityActionMutation.isPending ? 'Processing...' : 'Execute Action'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-500">No user activity data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      
      <Card className="terminal-window border-neon-green">
        <CardHeader>
          <CardTitle className="text-neon-green flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="flex items-center text-gray-300">
              <Shield className="h-4 w-4 mr-2 text-neon-green" />
              Monitor users with risk scores above 40 regularly
            </p>
            <p className="flex items-center text-gray-300">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" />
              Investigate users with multiple admin access attempts
            </p>
            <p className="flex items-center text-gray-300">
              <Ban className="h-4 w-4 mr-2 text-red-400" />
              Consider blocking users with critical risk scores immediately
            </p>
            <p className="flex items-center text-gray-300">
              <RefreshCw className="h-4 w-4 mr-2 text-blue-400" />
              Reset sessions for users showing suspicious patterns
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminUserSecurityManager;