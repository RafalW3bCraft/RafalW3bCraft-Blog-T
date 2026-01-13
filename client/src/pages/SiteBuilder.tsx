import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { UserSiteData } from '@shared/types';
import { 
  Settings, 
  Eye, 
  Save, 
  Plus, 
  X, 
  User, 
  Globe, 
  Palette,
  ExternalLink
} from 'lucide-react';

export function SiteBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newSkill, setNewSkill] = useState('');
  
  const { data: siteData, isLoading } = useQuery({
    queryKey: ['user-site-data'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/user/site-data');
      return res.json();
    }
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/auth/user');
      return res.json();
    }
  });

  const [formData, setFormData] = useState<UserSiteData>({
    name: '',
    title: '',
    bio: '',
    email: '',
    github: '',
    website: '',
    skills: [],
    theme: 'cybersecurity'
  });

  React.useEffect(() => {
    if (siteData) {
      setFormData({
        name: siteData.name || '',
        title: siteData.title || '',
        bio: siteData.bio || '',
        email: siteData.email || '',
        github: siteData.github || '',
        website: siteData.website || '',
        skills: siteData.skills || [],
        theme: siteData.theme || 'cybersecurity'
      });
    }
  }, [siteData]);

  const saveSiteDataMutation = useMutation({
    mutationFn: async (data: UserSiteData) => {
      const res = await apiRequest('POST', '/api/user/site-data', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Site Updated!',
        description: 'Your personal site has been updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['user-site-data'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update site data',
        variant: 'destructive',
      });
    },
  });

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSave = () => {
    saveSiteDataMutation.mutate(formData);
  };

  const getUserSiteUrl = () => {
    if (!currentUser) return '';
    
    const username = currentUser.id.replace(/[^a-zA-Z0-9]/g, '');
    return `${window.location.origin}/blog/${username}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading site builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Site Builder
            </h1>
            <p className="text-zinc-300 text-lg">
              Customize your personal cybersecurity blog and portfolio site
            </p>
            
            {currentUser && (
              <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-sm text-cyan-300 mb-2">Your site will be available at:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-cyan-200 bg-zinc-800/50 px-3 py-1 rounded">
                    {getUserSiteUrl()}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(getUserSiteUrl(), '_blank')}
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Full Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Professional Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Cybersecurity Analyst, Penetration Tester"
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Bio/About
                  </label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell visitors about yourself and your expertise..."
                    className="bg-zinc-700 border-zinc-600 text-white h-24"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="your.email@example.com"
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Social & Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    GitHub Username
                  </label>
                  <Input
                    value={formData.github}
                    onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
                    placeholder="yourusername"
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Website/Portfolio
                  </label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yoursite.com"
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Skills & Expertise
                  </label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill..."
                      className="bg-zinc-700 border-zinc-600 text-white flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    />
                    <Button
                      onClick={addSkill}
                      size="sm"
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs flex items-center gap-1"
                      >
                        {skill}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-red-400"
                          onClick={() => removeSkill(skill)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Theme
                  </label>
                  <select
                    value={formData.theme}
                    onChange={(e) => setFormData(prev => ({ ...prev, theme: e.target.value }))}
                    className="w-full bg-zinc-700 border border-zinc-600 text-white rounded-md px-3 py-2"
                  >
                    <option value="cybersecurity">Cybersecurity (Blue/Cyan)</option>
                    <option value="hacker">Hacker (Green Matrix)</option>
                    <option value="professional">Professional (Clean)</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center gap-4 mt-8">
            <Button
              onClick={handleSave}
              disabled={saveSiteDataMutation.isPending || !formData.name || !formData.title}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveSiteDataMutation.isPending ? 'Saving...' : 'Save Site'}
            </Button>
            
            <Button
              onClick={() => window.open(getUserSiteUrl(), '_blank')}
              variant="outline"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              disabled={!currentUser}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Site
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}