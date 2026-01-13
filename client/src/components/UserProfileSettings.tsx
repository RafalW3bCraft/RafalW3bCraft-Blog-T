import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Link, 
  Github, 
  Globe,
  Edit,
  Save,
  X,
  Shield,
  Activity
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  githubUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  createdAt: string;
  lastLogin: string;
  loginCount: number;
  role: string;
  isActive: boolean;
}

interface UserPreferences {
  emailNotifications: boolean;
  securityAlerts: boolean;
  blogCommentNotifications: boolean;
  blogLikeNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
}

export function UserProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/user/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      return data as UserProfile;
    },
    enabled: !!user?.id
  });

  const { data: preferences } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/user/preferences');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      const data = await response.json();
      return data as UserPreferences;
    },
    enabled: !!user?.id
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Profile updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Update failed', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  });

  const handleEdit = () => {
    setEditForm({
      displayName: profile?.displayName || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      website: profile?.website || '',
      twitterUrl: profile?.twitterUrl || '',
      linkedinUrl: profile?.linkedinUrl || ''
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editForm) {
      updateProfileMutation.mutate(editForm);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(undefined);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar} alt={profile?.displayName || profile?.email} />
              <AvatarFallback className="text-lg">
                {(profile?.displayName || profile?.email || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={editForm?.displayName || ''}
                        onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                        placeholder="Your display name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editForm?.location || ''}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                        placeholder="City, Country"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={editForm?.bio || ''}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={editForm?.website || ''}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="twitter">Twitter/X URL</Label>
                      <Input
                        id="twitter"
                        type="url"
                        value={editForm?.twitterUrl || ''}
                        onChange={(e) => setEditForm({ ...editForm, twitterUrl: e.target.value })}
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="linkedin">LinkedIn URL</Label>
                    <Input
                      id="linkedin"
                      type="url"
                      value={editForm?.linkedinUrl || ''}
                      onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {profile?.displayName || profile?.email}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {profile?.email}
                    </div>
                  </div>

                  {profile?.bio && (
                    <p className="text-gray-700">{profile.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {profile?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </div>
                    )}
                    {profile?.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                    {profile?.githubUrl && (
                      <div className="flex items-center gap-1">
                        <Github className="h-4 w-4" />
                        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline">
                          GitHub
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={profile?.isActive ? 'default' : 'secondary'}>
                      {profile?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {profile?.role}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Account Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Calendar className="h-4 w-4" />
                Member Since
              </div>
              <p className="text-sm font-medium">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <Activity className="h-4 w-4" />
                Last Login
              </div>
              <p className="text-sm font-medium">
                {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700 mb-1">
                <Shield className="h-4 w-4" />
                Login Count
              </div>
              <p className="text-sm font-medium">
                {profile?.loginCount || 0} times
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>OAuth Authentication:</strong> Your account is managed through your OAuth provider.
            </p>
            <p className="text-xs text-gray-600">
              To update your email, name, or avatar, please visit your OAuth provider's settings 
              (Google/GitHub) and the changes will sync automatically on your next login.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}