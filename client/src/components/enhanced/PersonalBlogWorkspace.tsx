import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  PenTool, 
  Save, 
  Eye, 
  BookmarkPlus, 
  Share2, 
  Clock, 
  TrendingUp,
  Plus,
  X,
  Send,
  CheckCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface UserBlogPost {
  id?: number;
  title: string;
  content: string;
  excerpt: string;
  tags: string[];
  isDraft: boolean;
  published?: boolean;
  readingTime?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface BookmarkedPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  readingProgress: number;
  bookmarkedAt: string;
}

export function PersonalBlogWorkspace() {
  const [currentPost, setCurrentPost] = useState<UserBlogPost>({
    title: '',
    content: '',
    excerpt: '',
    tags: [],
    isDraft: true
  });
  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState<'write' | 'drafts' | 'published' | 'bookmarks'>('write');
  const [showPreview, setShowPreview] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: userDrafts = [] } = useQuery({
    queryKey: ['user-drafts'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/blog/user-drafts');
      return res.json();
    }
  });

  const { data: bookmarkedPosts = [] } = useQuery({
    queryKey: ['bookmarked-posts'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/blog/bookmarks');
      return res.json();
    }
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ['user-posts'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/blog/user-posts');
      return res.json();
    }
  });

  const { data: topRepos = [] } = useQuery({
    queryKey: ['top-github-repos'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/github/projects');
      const repos = await res.json();
      
      return repos
        .sort((a: any, b: any) => (b.stargazers_count + b.watchers_count) - (a.stargazers_count + a.watchers_count))
        .slice(0, 5);
    }
  });

  const saveDraftMutation = useMutation({
    mutationFn: async (postData: UserBlogPost) => {
      const res = await apiRequest('POST', '/api/blog/user-drafts', postData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Draft Saved',
        description: 'Your blog post draft has been saved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['user-drafts'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Save Failed',
        description: error.message || 'Failed to save draft',
        variant: 'destructive',
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest('POST', '/api/blog/bookmark', { postId });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Post Bookmarked',
        description: 'Added to your reading list',
      });
      queryClient.invalidateQueries({ queryKey: ['bookmarked-posts'] });
    }
  });

  const generateBlogMutation = useMutation({
    mutationFn: async (repoId: number) => {
      const res = await apiRequest('POST', `/api/github/repos/${repoId}/generate-blog`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Blog Generated!',
        description: 'A new blog post has been created from the repository',
      });
      queryClient.invalidateQueries({ queryKey: ['user-drafts'] });
      setActiveTab('drafts');
    },
    onError: (error: any) => {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate blog post',
        variant: 'destructive',
      });
    },
  });

  const shareDraftMutation = useMutation({
    mutationFn: async (postData: UserBlogPost) => {
      const response = await fetch('/api/blog/share-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(postData),
      });

      if (!response.ok) throw new Error('Failed to create shareable link');
      return response.json();
    },
    onSuccess: (data) => {
      setShareableLink(data.shareUrl);
      navigator.clipboard.writeText(data.shareUrl);
      toast({
        title: 'Draft Shared Successfully!',
        description: `Shareable link copied to clipboard. Expires in 7 days.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Share Failed',
        description: error.message || 'Failed to create shareable link',
        variant: 'destructive',
      });
    }
  });

  
  const publishPostMutation = useMutation({
    mutationFn: async (postData: UserBlogPost) => {
      const publishData = {
        ...postData,
        published: true,
        isDraft: false,
        readingTime: calculateReadingTime(postData.content),
        excerpt: postData.excerpt || postData.content.substring(0, 200) + '...'
      };
      
      const res = await apiRequest('POST', '/api/blog/posts', publishData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Post Published!',
        description: 'Your blog post has been published successfully and is now live',
      });
      queryClient.invalidateQueries({ queryKey: ['user-drafts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      
      setCurrentPost({
        title: '',
        content: '',
        excerpt: '',
        tags: [],
        isDraft: true
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Publish Failed',
        description: error.message || 'Failed to publish post',
        variant: 'destructive',
      });
    },
  });

  const addTag = () => {
    if (newTag.trim() && !currentPost.tags.includes(newTag.trim())) {
      setCurrentPost(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCurrentPost(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const handleSaveDraft = () => {
    const postWithReadingTime = {
      ...currentPost,
      readingTime: calculateReadingTime(currentPost.content),
      excerpt: currentPost.excerpt || currentPost.content.substring(0, 200) + '...'
    };
    saveDraftMutation.mutate(postWithReadingTime);
  };

  const loadDraft = (draft: UserBlogPost) => {
    setCurrentPost(draft);
    setActiveTab('write');
  };

  const handlePreview = () => {
    if (!currentPost.title || !currentPost.content) {
      toast({
        title: 'Content Required',
        description: 'Please add title and content to preview your post',
        variant: 'destructive',
      });
      return;
    }
    setShowPreview(true);
  };

  const handleShareDraft = () => {
    if (!currentPost.title || !currentPost.content) {
      toast({
        title: 'Content Required',
        description: 'Please add title and content to share your draft',
        variant: 'destructive',
      });
      return;
    }

    shareDraftMutation.mutate(currentPost);
  };

  const handlePublish = () => {
    if (!currentPost.title || !currentPost.content) {
      toast({
        title: 'Content Required',
        description: 'Please add title and content to publish your post',
        variant: 'destructive',
      });
      return;
    }

    publishPostMutation.mutate(currentPost);
  };

  return (
    <Card className="bg-zinc-900/90 border-cyan-500/30 shadow-2xl">
      <CardHeader className="border-b border-zinc-700/50">
        <CardTitle className="text-cyan-400 flex items-center gap-2 text-xl">
          <PenTool className="h-6 w-6" />
          Personal Blog Workspace
        </CardTitle>
        
        
        <div className="flex gap-3 mt-6">
          <Button
            variant={activeTab === 'write' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('write')}
            className={`${
              activeTab === 'write' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500' 
                : 'bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 border-zinc-600'
            } transition-all duration-200`}
          >
            <PenTool className="h-4 w-4 mr-2" />
            Write
          </Button>
          <Button
            variant={activeTab === 'drafts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('drafts')}
            className={`${
              activeTab === 'drafts' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500' 
                : 'bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 border-zinc-600'
            } transition-all duration-200`}
          >
            <Save className="h-4 w-4 mr-2" />
            Drafts ({userDrafts.length})
          </Button>
          <Button
            variant={activeTab === 'published' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('published')}
            className={`${
              activeTab === 'published' 
                ? 'bg-green-600 hover:bg-green-700 text-white border-green-500' 
                : 'bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 border-zinc-600'
            } transition-all duration-200`}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Published ({userPosts.length})
          </Button>
          <Button
            variant={activeTab === 'bookmarks' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('bookmarks')}
            className={`${
              activeTab === 'bookmarks' 
                ? 'bg-orange-600 hover:bg-orange-700 text-white border-orange-500' 
                : 'bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300 border-zinc-600'
            } transition-all duration-200`}
          >
            <BookmarkPlus className="h-4 w-4 mr-2" />
            Bookmarks ({bookmarkedPosts.length})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {activeTab === 'write' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Create New Post</h3>
              {shareableLink && (
                <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                  Draft shared successfully!
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Post Title *
                  </label>
                  <Input
                    value={currentPost.title}
                    onChange={(e) => setCurrentPost(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter your blog post title..."
                    className="bg-zinc-800/50 border-zinc-600 text-white focus:border-purple-500 transition-colors"
                  />
                </div>

                
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Excerpt
                  </label>
                  <Textarea
                    value={currentPost.excerpt}
                    onChange={(e) => setCurrentPost(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief description of your post..."
                    className="bg-zinc-800/50 border-zinc-600 text-white h-20 focus:border-purple-500 transition-colors"
                  />
                </div>

                
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-3 flex-wrap min-h-[2rem]">
                    {currentPost.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-purple-900/50 text-purple-300 hover:bg-purple-800 transition-colors"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:text-red-400 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      className="bg-zinc-800/50 border-zinc-600 text-white focus:border-purple-500 transition-colors"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button 
                      onClick={addTag} 
                      size="sm" 
                      variant="outline"
                      className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              
              <div className="space-y-4">
                <Card className="bg-zinc-800/30 border-zinc-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-zinc-300">Post Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Reading Time</span>
                      <span className="text-sm text-cyan-400">
                        ~{currentPost.content ? calculateReadingTime(currentPost.content) : 0} min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Word Count</span>
                      <span className="text-sm text-cyan-400">
                        {currentPost.content ? currentPost.content.split(/\s+/).filter(w => w.length > 0).length : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Characters</span>
                      <span className="text-sm text-cyan-400">
                        {currentPost.content ? currentPost.content.length : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-zinc-400">Tags</span>
                      <span className="text-sm text-cyan-400">
                        {currentPost.tags.length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-2 block">
                Content (Markdown) *
              </label>
              <Textarea
                value={currentPost.content}
                onChange={(e) => setCurrentPost(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your blog content in Markdown...

# Sample Heading
Your content here with **bold** and *italic* text.

- List item 1
- List item 2

```code
// Code blocks supported
```"
                className="bg-zinc-800/50 border-zinc-600 text-white h-80 font-mono text-sm focus:border-purple-500 transition-colors resize-y"
              />
            </div>

            
            {shareableLink && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-300">Draft Shared Successfully</span>
                </div>
                <div className="bg-zinc-800/50 rounded p-3 break-all">
                  <code className="text-xs text-cyan-200">{shareableLink}</code>
                </div>
                <div className="flex items-center justify-between text-xs text-cyan-400">
                  <span>Link expires in 7 days</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(shareableLink);
                      toast({ title: 'Link copied to clipboard!' });
                    }}
                    className="h-6 px-2 text-cyan-400 hover:text-cyan-300"
                  >
                    Copy Again
                  </Button>
                </div>
              </div>
            )}

            
            <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-700">
              <Button
                onClick={handleSaveDraft}
                disabled={saveDraftMutation.isPending || !currentPost.title}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveDraftMutation.isPending ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                onClick={handlePublish}
                disabled={publishPostMutation.isPending || !currentPost.title || !currentPost.content}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                {publishPostMutation.isPending ? 'Publishing...' : 'Publish Post'}
              </Button>
              <Button
                onClick={handlePreview}
                variant="outline"
                disabled={!currentPost.title || !currentPost.content}
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleShareDraft}
                disabled={shareDraftMutation.isPending || !currentPost.title || !currentPost.content}
                variant="outline"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {shareDraftMutation.isPending ? 'Sharing...' : 'Share Draft'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'drafts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Your Drafts</h3>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                {userDrafts.length} draft{userDrafts.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {userDrafts.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <div className="bg-zinc-800/50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <PenTool className="h-12 w-12 opacity-50" />
                </div>
                <h4 className="text-lg font-medium text-zinc-300 mb-2">No drafts yet</h4>
                <p className="text-sm">Start writing to create your first draft!</p>
                <Button 
                  onClick={() => setActiveTab('write')} 
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Start Writing
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {userDrafts.map((draft: UserBlogPost) => (
                  <Card 
                    key={draft.id} 
                    className="bg-zinc-800/50 border-zinc-700 hover:border-blue-500/50 hover:bg-zinc-800/70 transition-all duration-200 cursor-pointer group"
                  >
                    <CardContent className="p-5" onClick={() => loadDraft(draft)}>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors text-lg">
                          {draft.title}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-zinc-400 bg-zinc-700/50 px-2 py-1 rounded">
                          <Clock className="h-3 w-3" />
                          {draft.readingTime || 1}m read
                        </div>
                      </div>
                      
                      <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{draft.excerpt}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          {draft.tags && draft.tags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-xs border-blue-500/30 text-blue-300 hover:bg-blue-500/10"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="text-xs text-zinc-500">
                          {draft.updatedAt ? new Date(draft.updatedAt).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'published' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Your Published Posts</h3>
              <Badge variant="outline" className="text-green-400 border-green-400">
                {userPosts.length} published post{userPosts.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {userPosts.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <div className="bg-zinc-800/50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 opacity-50" />
                </div>
                <h4 className="text-lg font-medium text-zinc-300 mb-2">No published posts yet</h4>
                <p className="text-sm">Your published blog posts will appear here in your personal blog area</p>
                <Button 
                  onClick={() => setActiveTab('write')} 
                  className="mt-4 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {userPosts.map((post: any) => (
                  <Card 
                    key={post.id} 
                    className="bg-zinc-800/50 border-zinc-700 hover:border-green-500/50 hover:bg-zinc-800/70 transition-all duration-200 group"
                  >
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-white group-hover:text-green-300 transition-colors text-lg">
                          {post.title}
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-sm text-zinc-400 bg-zinc-700/50 px-2 py-1 rounded">
                            <Eye className="h-3 w-3" />
                            {post.views || 0} views
                          </div>
                          <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                            Live
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          {post.tags && post.tags.map((tag: string) => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-xs border-green-500/30 text-green-300 hover:bg-green-500/10"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="text-xs text-zinc-500">
                          Published: {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                          onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Live
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-zinc-400 border-zinc-600 hover:bg-zinc-700"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Analytics
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Your Bookmarks</h3>
              <Badge variant="outline" className="text-orange-400 border-orange-400">
                {bookmarkedPosts.length} bookmark{bookmarkedPosts.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {bookmarkedPosts.length === 0 ? (
              <div className="text-center py-12 text-zinc-400">
                <div className="bg-zinc-800/50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <BookmarkPlus className="h-12 w-12 opacity-50" />
                </div>
                <h4 className="text-lg font-medium text-zinc-300 mb-2">No bookmarks yet</h4>
                <p className="text-sm">Save interesting posts for later reading!</p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-green-500 text-green-400 hover:bg-green-500/10"
                  size="sm"
                  disabled
                >
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  Browse Posts
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookmarkedPosts.map((bookmark: BookmarkedPost) => (
                  <Card 
                    key={bookmark.id} 
                    className="bg-zinc-800/50 border-zinc-700 hover:border-green-500/50 hover:bg-zinc-800/70 transition-all duration-200 group"
                  >
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-white group-hover:text-green-300 transition-colors text-lg">
                          {bookmark.title}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-green-400 bg-green-500/10 px-2 py-1 rounded">
                          <TrendingUp className="h-3 w-3" />
                          {bookmark.readingProgress}% read
                        </div>
                      </div>
                      
                      <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{bookmark.excerpt}</p>
                      
                      <div className="flex items-center justify-between">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-0 h-auto"
                        >
                          Continue Reading →
                        </Button>
                        
                        <div className="text-xs text-zinc-500">
                          Saved {new Date(bookmark.bookmarkedAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      
                      <div className="mt-3">
                        <div className="w-full bg-zinc-700 rounded-full h-1.5">
                          <div 
                            className="bg-green-500 h-1.5 rounded-full transition-all duration-300" 
                            style={{ width: `${bookmark.readingProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-zinc-900 border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="text-cyan-400">{currentPost.title}</DialogTitle>
          </DialogHeader>
          <div className="prose prose-invert max-w-none text-gray-300">
            <ReactMarkdown>
              {currentPost.content}
            </ReactMarkdown>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default PersonalBlogWorkspace;