

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/types';
import { 
  Users, 
  Search, 
  Filter, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';

interface UserManagementProps {
  onClose: () => void;
}

export function UserManagement({ onClose }: UserManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', page, searchTerm, roleFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      return response.json();
    }
  });

  
  const bulkActionMutation = useMutation({
    mutationFn: async ({ userIds, action, reason }: { userIds: string[], action: string, reason: string }) => {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userIds, action, reason })
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk action');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUsers([]);
      toast({
        title: 'Success',
        description: 'Bulk action completed successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to perform bulk action',
        variant: 'destructive'
      });
    }
  });

  
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updateData }: { userId: string, updateData: any }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Success',
        description: 'User updated successfully'
      });
    }
  });

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select users to perform bulk action',
        variant: 'destructive'
      });
      return;
    }

    const reason = prompt(`Enter reason for ${action}:`);
    if (!reason) return;

    bulkActionMutation.mutate({ userIds: selectedUsers, action, reason });
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore >= 70) return 'bg-red-500/20 text-red-400 border-red-500';
    if (riskScore >= 40) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
    return 'bg-green-500/20 text-green-400 border-green-500';
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore >= 70) return 'HIGH RISK';
    if (riskScore >= 40) return 'MEDIUM RISK';
    return 'LOW RISK';
  };

  return (
    <div className="bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">User Management</h1>
              <p className="text-gray-400">Manage user accounts, permissions, and security</p>
            </div>
          </div>
          <Button 
            onClick={onClose}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            Back to Admin
          </Button>
        </div>

        
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2 flex-1 min-w-64">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search users by email or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-100"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        
        {selectedUsers.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-gray-300">
                  {selectedUsers.length} user(s) selected
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('activate')}
                    className="border-green-600 text-green-400 hover:bg-green-900/20"
                  >
                    <UserCheck className="w-4 h-4 mr-1" />
                    Activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('deactivate')}
                    className="border-yellow-600 text-yellow-400 hover:bg-yellow-900/20"
                  >
                    <UserX className="w-4 h-4 mr-1" />
                    Deactivate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('delete')}
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center justify-between">
              <span>Users ({usersData?.pagination?.total || 0})</span>
              <Badge variant="outline" className="text-gray-300">
                Page {page} of {usersData?.pagination?.totalPages || 1}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">Loading users...</div>
            ) : usersData?.users?.length > 0 ? (
              <div className="space-y-1">
                {usersData.users.map((user: User) => (
                  <div
                    key={user.id}
                    className={`flex items-center p-4 border-b border-gray-700 hover:bg-gray-800/30 transition-colors ${
                      selectedUsers.includes(user.id) ? 'bg-blue-900/20' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="mr-4 rounded border-gray-600 bg-gray-700"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div>
                          <div className="font-medium text-gray-100">{user.username || 'No username'}</div>
                          <div className="text-sm text-gray-400">{user.email}</div>
                        </div>
                        
                        <Badge
                          variant="outline"
                          className={user.role === 'admin' ? 'border-red-500 text-red-400' : 
                                   'border-blue-500 text-blue-400'}
                        >
                          {(user.role || 'user').toUpperCase()}
                        </Badge>
                        
                        <Badge
                          variant="outline"
                          className={user.isActive ? 'border-green-500 text-green-400' : 'border-gray-500 text-gray-400'}
                        >
                          {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                        
                        <Badge
                          variant="outline"
                          className={getRiskBadgeColor(user.riskScore ?? 0)}
                        >
                          {getRiskLabel(user.riskScore ?? 0)} ({user.riskScore ?? 0})
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                        <span>Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</span>
                        <span>Activity: {user.activityCount ?? 0} actions</span>
                      </div>
                      
                      {(user.suspiciousActivities?.length ?? 0) > 0 && (
                        <div className="mt-2 flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                          <span className="text-xs text-yellow-400">
                            {user.suspiciousActivities?.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateUserMutation.mutate({
                          userId: user.id,
                          updateData: { isActive: !user.isActive }
                        })}
                        className="text-gray-400 hover:text-gray-100"
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-gray-100"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-red-400"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400">
                No users found matching the current filters.
              </div>
            )}
          </CardContent>
        </Card>

        
        {usersData?.pagination && usersData.pagination.totalPages > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="border-gray-600 text-gray-300"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(usersData.pagination.totalPages, p + 1))}
              disabled={page === usersData.pagination.totalPages}
              className="border-gray-600 text-gray-300"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}