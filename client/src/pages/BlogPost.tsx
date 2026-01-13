import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CyberNavigation } from '@/components/CyberNavigation';
import { MatrixRain } from '@/components/MatrixRain';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

import ReactMarkdown from 'react-markdown';
import { Calendar, Eye, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import type { BlogPost } from '@shared/schema';
import { useEffect } from 'react';
import CommentSection from '@/components/blog/CommentSection';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: ['/api/blog/posts', slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog/posts/${slug}`);
      if (!response.ok) {
        if (response.status === 404) {
          
          if (slug && slug.match(/^(github|google|admin)[\w\d]+$/)) {
            
            window.location.href = `/user/${slug}`;
            return null;
          }
          throw new Error('Post not found');
        }
        throw new Error('Failed to fetch post');
      }
      return response.json();
    },
    enabled: !!slug,
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest('DELETE', `/api/blog/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      toast({
        title: 'Post Deleted',
        description: 'The blog post has been successfully deleted.',
      });
      
      window.location.href = '/blog';
    },
    onError: (error) => {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete post',
        variant: 'destructive',
      });
    },
  });

  
  useEffect(() => {
    if (post) {
      document.title = `${post.title} - CyberAnalyst`;
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen matrix-bg">
        <MatrixRain />
        <CyberNavigation />
        <main className="relative z-10 pt-20">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="terminal-window p-8 animate-pulse">
              <div className="h-8 bg-gray-600 rounded mb-4"></div>
              <div className="h-4 bg-gray-600 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-600 rounded"></div>
                <div className="h-4 bg-gray-600 rounded"></div>
                <div className="h-4 bg-gray-600 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen matrix-bg">
        <MatrixRain />
        <CyberNavigation />
        <main className="relative z-10 pt-20">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="terminal-window p-8 text-center">
              <div className="text-neon-green font-mono text-lg mb-4">
                <span className="text-gray-400">$</span> cat blog/{slug}.mdx
              </div>
              <p className="text-red-400 font-mono mb-6">
                ERROR: Post not found or access denied
              </p>
              <Link href="/blog">
                <Button className="cyber-button px-6 py-3 rounded font-mono">
                  <ArrowLeft className="mr-2" size={16} />
                  Back to Blog
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleDeletePost = () => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      deletePostMutation.mutate(post.id);
    }
  };

  return (
    <div className="min-h-screen matrix-bg">
      <MatrixRain />
      <CyberNavigation />
      
      <main className="relative z-10 pt-20">
        <div className="max-w-4xl mx-auto px-4 py-12">
          
          <div className="mb-8">
            <Link href="/blog">
              <Button
                variant="outline"
                className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black transition-all duration-300 rounded font-mono"
              >
                <ArrowLeft className="mr-2" size={16} />
                Back to Blog
              </Button>
            </Link>
          </div>

          
          <article className="terminal-window p-8">
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-gray-400 text-sm ml-4 font-mono">{post.slug}.mdx</span>
              </div>
              
              {isAuthenticated && (isAdmin || (user && post.authorId === user.id)) && (
                <div className="flex items-center space-x-2">
                  <Link href={`/admin/edit-post/${post.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gold-accent text-gold-accent hover:bg-gold-accent hover:text-matrix-black font-mono"
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeletePost}
                    disabled={deletePostMutation.isPending}
                    className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono"
                  >
                    <Trash2 size={14} className="mr-1" />
                    {deletePostMutation.isPending ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              )}
            </div>

            
            <div className="flex items-center text-sm text-gray-400 mb-6 font-mono">
              <Calendar size={14} className="mr-2" />
              <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'No date'}</span>
              <span className="mx-3">•</span>
              <Eye size={14} className="mr-2" />
              <span>{post.views || 0} views</span>
              {!post.published && (
                <>
                  <span className="mx-3">•</span>
                  <Badge variant="outline" className="border-gold-accent text-gold-accent">
                    Draft
                  </Badge>
                </>
              )}
            </div>

            
            <h1 className="font-cyber text-3xl md:text-4xl font-bold text-neon-green mb-6">
              {post.title}
            </h1>

            
            {post.excerpt && (
              <div className="text-gray-300 text-lg mb-8 p-4 border-l-4 border-neon-cyan bg-cyber-gray/20 rounded">
                {post.excerpt}
              </div>
            )}

            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={`px-3 py-1 rounded font-mono ${
                      index % 4 === 0
                        ? 'border-neon-cyan text-neon-cyan'
                        : index % 4 === 1
                        ? 'border-neon-green text-neon-green'
                        : index % 4 === 2
                        ? 'border-cyber-purple text-cyber-purple'
                        : 'border-gold-accent text-gold-accent'
                    }`}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-white font-cyber text-2xl mb-4 mt-8 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-neon-cyan font-cyber text-xl mb-3 mt-6">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-neon-green font-cyber text-lg mb-2 mt-4">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-300 mb-4 leading-relaxed">
                      {children}
                    </p>
                  ),
                  code: ({ children }) => (
                    <code className="text-neon-green bg-cyber-gray px-2 py-1 rounded font-mono text-sm">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-matrix-black border border-neon-cyan rounded-lg p-4 overflow-x-auto mb-6 custom-scrollbar">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-neon-cyan pl-4 text-gray-400 italic mb-6 bg-cyber-gray/20 py-2 rounded-r">
                      {children}
                    </blockquote>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      className="text-neon-cyan hover:text-neon-green transition-colors duration-300 underline"
                      target={href?.startsWith('http') ? '_blank' : undefined}
                      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {children}
                    </a>
                  ),
                  ul: ({ children }) => (
                    <ul className="text-gray-300 mb-4 pl-6 space-y-2">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="text-gray-300 mb-4 pl-6 space-y-2">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="relative">
                      <span className="absolute -left-4 text-neon-cyan">•</span>
                      {children}
                    </li>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            
            <div className="mt-12 pt-8 border-t border-cyber-gray">
              <div className="flex items-center justify-between">
                <div className="text-gray-400 font-mono text-sm">
                  Last updated: {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString() : 'Never'}
                </div>
                <div className="flex items-center space-x-4">
                  <Link href="/blog">
                    <Button
                      variant="outline"
                      className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black transition-all duration-300 rounded font-mono"
                    >
                      More Posts
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button className="cyber-button px-4 py-2 rounded font-mono">
                      Get In Touch
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </article>

          
          <div className="mt-12">
            <CommentSection postId={post.id} postTitle={post.title} />
          </div>
        </div>
      </main>
    </div>
  );
}
