import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { UserSiteData, BlogPost } from '@shared/types';
import { 
  Calendar, 
  Clock, 
  Eye, 
  Search, 
  Tag, 
  User, 
  Github, 
  Mail, 
  Globe,
  ArrowRight,
  Settings
} from 'lucide-react';

export function UserBlog() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  
  const pathParts = window.location.pathname.split('/');
  const username = pathParts[pathParts.length - 1];

  const { data: siteData } = useQuery({
    queryKey: ['user-site-data', username],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/user/site-data/${username}`);
        if (!response.ok) throw new Error('Site data not found');
        return response.json();
      } catch (error) {
        return null;
      }
    }
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ['user-blog-posts', username],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/blog/user-posts/${username}`);
        if (!response.ok) throw new Error('Posts not found');
        return response.json();
      } catch (error) {
        return [];
      }
    }
  });

  const filteredPosts = userPosts.filter((post: BlogPost) =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!siteData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading user blog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      <header className="border-b border-zinc-700 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{siteData.name || username}</h1>
                <p className="text-zinc-400 text-sm">{siteData.title || 'Cybersecurity Professional'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {siteData.github && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={`https://github.com/${siteData.github}`} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {siteData.email && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={`mailto:${siteData.email}`}>
                    <Mail className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {siteData.website && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={siteData.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            CYBER SECURITY BLOG
          </h2>
          <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
            {siteData.bio || 'Deep dives into cybersecurity, threat analysis, and security research'}
          </p>
          
          {siteData.skills && siteData.skills.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {siteData.skills.map((skill: string, index: number) => (
                <Badge key={index} variant="outline" className="text-cyan-400 border-cyan-400">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-6 pb-8">
        <div className="container mx-auto">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
            <Input
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-600 text-white placeholder-zinc-400"
            />
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="container mx-auto">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-zinc-800/50 rounded-full p-8 w-32 h-32 mx-auto mb-8 flex items-center justify-center">
                <User className="h-16 w-16 text-zinc-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No Posts Yet</h3>
              <p className="text-zinc-400 mb-8">This user hasn't published any blog posts yet.</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post: BlogPost) => (
                <Card 
                  key={post.id} 
                  className="bg-zinc-800/50 border-zinc-700 hover:border-cyan-500/50 hover:bg-zinc-800/70 transition-all duration-300 cursor-pointer group"
                  onClick={() => setLocation(`/blog/post/${post.slug}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-sm text-zinc-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(post.createdAt)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-zinc-400">
                        <div className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {post.views || 0}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {post.readingTime || 1} min
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-white group-hover:text-cyan-300 transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-cyan-400 hover:text-cyan-300 p-0 h-auto font-semibold"
                    >
                      READ MORE
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-zinc-700 bg-zinc-900/50 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-zinc-400">
            © 2025 {siteData.name || username}. Powered by RafalW3bCraft Cybersecurity Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}