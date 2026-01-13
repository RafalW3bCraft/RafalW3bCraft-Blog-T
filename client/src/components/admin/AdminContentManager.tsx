

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ContactMessage } from '@shared/schema';
import { 
  FileText, 
  Mail, 
  Edit, 
  Trash2, 
  Eye, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  MessageSquare,
  Settings,
  Ban,
  RefreshCw,
  Flag
} from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  content: string;
  published: boolean;
  isDraft: boolean;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

interface ContentAnalytics {
  blogPosts: {
    total: number;
    published: number;
    drafts: number;
    lastMonth: number;
    lastWeek: number;
  };
  messages: {
    total: number;
    lastMonth: number;
    lastWeek: number;
    unread: number;
  };
}

export function AdminContentManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [editingPost, setEditingPost] = useState(false);
  const queryClient = useQueryClient();

  
  const { data: analytics, isLoading: analyticsLoading } = useQuery<{
    success: boolean;
    analytics: ContentAnalytics;
  }>({
    queryKey: ['/api/admin/content-analytics'],
    refetchInterval: 60000 
  });

  
  const { data: blogPosts, isLoading: postsLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/posts'],
    refetchInterval: 30000
  });

  
  const { data: messages, isLoading: messagesLoading } = useQuery<ContactMessage[]>({
    queryKey: ['/api/contact'],
    refetchInterval: 30000
  });

  
  const editPostMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<BlogPost> }) => {
      const response = await fetch(`/api/admin/blog/posts/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data.updates)
      });
      if (!response.ok) throw new Error('Failed to update post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content-analytics'] });
      setEditingPost(false);
      setSelectedPost(null);
    }
  });

  
  const deletePostMutation = useMutation({
    mutationFn: async (data: { id: number; reason: string }) => {
      const response = await fetch(`/api/admin/blog/posts/${data.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: data.reason })
      });
      if (!response.ok) throw new Error('Failed to delete post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/content-analytics'] });
    }
  });

  
  const updateMessageMutation = useMutation({
    mutationFn: async (data: { id: number; updates: { isRead?: boolean; status?: string; response?: string } }) => {
      const response = await fetch(`/api/admin/messages/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data.updates)
      });
      if (!response.ok) throw new Error('Failed to update message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contact'] });
    }
  });

  
  const deleteMessageMutation = useMutation({
    mutationFn: async (data: { id: number; reason: string }) => {
      const response = await fetch(`/api/admin/messages/${data.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: data.reason })
      });
      if (!response.ok) throw new Error('Failed to delete message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contact'] });
    }
  });

  const handleEditPost = (post: BlogPost) => {
    setSelectedPost(post);
    setEditingPost(true);
  };

  const handleSavePost = () => {
    if (selectedPost) {
      editPostMutation.mutate({
        id: selectedPost.id,
        updates: {
          title: selectedPost.title,
          content: selectedPost.content,
          published: selectedPost.published
        }
      });
    }
  };

  const handleDeletePost = (post: BlogPost, reason: string) => {
    deletePostMutation.mutate({ id: post.id, reason });
  };

  const handleMarkMessageRead = (message: ContactMessage) => {
    updateMessageMutation.mutate({
      id: message.id,
      updates: { isRead: true, status: 'reviewed' }
    });
  };

  const handleDeleteMessage = (message: ContactMessage, reason: string) => {
    deleteMessageMutation.mutate({ id: message.id, reason });
  };

  return (
    <div className="space-y-6">
      <Card className="terminal-window">
        <CardHeader>
          <CardTitle className="text-neon-cyan flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Content Management Center
          </CardTitle>
          <CardDescription>
            Manage all blog posts, contact messages, and content analytics
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="blog-posts">Blog Posts</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="terminal-window">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neon-cyan">
                  {analytics?.analytics.blogPosts.total || 0}
                </div>
                <div className="text-xs text-gray-500">
                  {analytics?.analytics.blogPosts.published || 0} published
                </div>
              </CardContent>
            </Card>

            <Card className="terminal-window">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neon-green">
                  {analytics?.analytics.messages.total || 0}
                </div>
                <div className="text-xs text-gray-500">
                  {analytics?.analytics.messages.unread || 0} unread
                </div>
              </CardContent>
            </Card>

            <Card className="terminal-window">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">This Week</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">
                  {(analytics?.analytics.blogPosts.lastWeek || 0) + (analytics?.analytics.messages.lastWeek || 0)}
                </div>
                <div className="text-xs text-gray-500">
                  New content
                </div>
              </CardContent>
            </Card>

            <Card className="terminal-window">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Drafts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-400">
                  {analytics?.analytics.blogPosts.drafts || 0}
                </div>
                <div className="text-xs text-gray-500">
                  Unpublished
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert className="border-neon-cyan bg-neon-cyan/10">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Content management system active. All actions are logged for security audit.
            </AlertDescription>
          </Alert>
        </TabsContent>

        
        <TabsContent value="blog-posts" className="space-y-4">
          <Card className="terminal-window">
            <CardHeader>
              <CardTitle className="text-neon-cyan flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Blog Post Management
              </CardTitle>
              <CardDescription>
                Edit, delete, and manage all blog posts across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-neon-cyan" />
                  <p className="text-gray-400">Loading blog posts...</p>
                </div>
              ) : blogPosts && blogPosts.length > 0 ? (
                <div className="space-y-4">
                  {blogPosts.map((post) => (
                    <Card key={post.id} className="border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-100 mb-2">{post.title}</h3>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={post.published ? "default" : "secondary"}>
                                {post.published ? "Published" : "Draft"}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(post.createdAt).toLocaleDateString()}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-2">
                              {post.content?.substring(0, 150)}...
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPost(post)}
                              className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete Blog Post</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete "{post.title}"? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Reason for deletion:</label>
                                    <Textarea placeholder="Enter reason..." />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                                    <Button 
                                      variant="destructive" 
                                      onClick={() => handleDeletePost(post, "Admin deletion")}
                                    >
                                      Delete Post
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500">No blog posts found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        
        <TabsContent value="messages" className="space-y-4">
          <Card className="terminal-window">
            <CardHeader>
              <CardTitle className="text-neon-green flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Contact Message Management
              </CardTitle>
              <CardDescription>
                Review and manage contact form submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-neon-green" />
                  <p className="text-gray-400">Loading messages...</p>
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <Card key={message.id} className="border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-100">{message.subject}</h3>
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {message.createdAt ? new Date(message.createdAt).toLocaleDateString() : 'Unknown'}
                              </Badge>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">
                              From: {message.name} ({message.email})
                            </p>
                            <p className="text-gray-300 text-sm line-clamp-3">
                              {message.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkMessageRead(message)}
                              className="border-neon-green text-neon-green hover:bg-neon-green hover:text-matrix-black"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete Message</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this message from {message.name}?
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <label className="text-sm font-medium">Reason for deletion:</label>
                                    <Textarea placeholder="Enter reason..." />
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => {}}>Cancel</Button>
                                    <Button 
                                      variant="destructive" 
                                      onClick={() => handleDeleteMessage(message, "Admin deletion")}
                                    >
                                      Delete Message
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500">No messages found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        
        <TabsContent value="analytics" className="space-y-4">
          <Card className="terminal-window">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Content Analytics
              </CardTitle>
              <CardDescription>
                Detailed analytics and insights about content performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-400" />
                  <p className="text-gray-400">Loading analytics...</p>
                </div>
              ) : analytics?.analytics ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-4">Blog Posts</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                        <span className="text-gray-300">Total Posts</span>
                        <Badge variant="outline">{analytics.analytics.blogPosts.total}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                        <span className="text-gray-300">Published</span>
                        <Badge className="bg-green-600">{analytics.analytics.blogPosts.published}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                        <span className="text-gray-300">Drafts</span>
                        <Badge variant="secondary">{analytics.analytics.blogPosts.drafts}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                        <span className="text-gray-300">This Month</span>
                        <Badge className="bg-blue-600">{analytics.analytics.blogPosts.lastMonth}</Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-4">Contact Messages</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                        <span className="text-gray-300">Total Messages</span>
                        <Badge variant="outline">{analytics.analytics.messages.total}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                        <span className="text-gray-300">Unread</span>
                        <Badge className="bg-orange-600">{analytics.analytics.messages.unread}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                        <span className="text-gray-300">This Month</span>
                        <Badge className="bg-blue-600">{analytics.analytics.messages.lastMonth}</Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                        <span className="text-gray-300">This Week</span>
                        <Badge className="bg-purple-600">{analytics.analytics.messages.lastWeek}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-500">Analytics data unavailable</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      
      {editingPost && selectedPost && (
        <Dialog open={editingPost} onOpenChange={setEditingPost}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Blog Post</DialogTitle>
              <DialogDescription>
                Make changes to the blog post. All edits will be logged.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={selectedPost.title}
                  onChange={(e) => setSelectedPost({...selectedPost, title: e.target.value})}
                  placeholder="Post title..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={selectedPost.content}
                  onChange={(e) => setSelectedPost({...selectedPost, content: e.target.value})}
                  placeholder="Post content..."
                  rows={10}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedPost.published}
                  onChange={(e) => setSelectedPost({...selectedPost, published: e.target.checked})}
                />
                <label className="text-sm">Published</label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingPost(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePost} disabled={editPostMutation.isPending}>
                  {editPostMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default AdminContentManager;