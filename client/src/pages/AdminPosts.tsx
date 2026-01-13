import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { MatrixRain } from "@/components/MatrixRain";
import { CyberNavigation } from "@/components/CyberNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Plus, Eye, Calendar, User } from "lucide-react";
import { BlogPost } from "@shared/types";

export default function AdminPosts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      toast({
        title: "Access Denied",
        description: !isAuthenticated ? "Authentication required" : "Admin privileges required",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = !isAuthenticated ? "/api/login" : "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isAdmin, isLoading, toast]);

  
  const { data: posts, isLoading: postsLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/posts'],
    queryFn: async () => {
      const response = await fetch('/api/blog/posts?all=true', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },
    enabled: isAuthenticated && isAdmin,
  });

  
  const deletePostMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/admin/blog/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Admin deletion via posts management' })
      });
      if (!response.ok) throw new Error('Failed to delete post');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog/posts'] });
      toast({
        title: "Success",
        description: "Blog post deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete blog post",
        variant: "destructive",
      });
    },
  });

  if (isLoading || postsLoading) {
    return (
      <div className="min-h-screen matrix-bg">
        <MatrixRain />
        <CyberNavigation />
        <main className="relative z-10 pt-20">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="terminal-window p-8 text-center">
              <div className="text-neon-green font-mono text-lg mb-4 animate-pulse">
                <span className="text-gray-400">$</span> {isLoading ? 'authenticating user...' : 'loading posts...'}
              </div>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen matrix-bg">
        <MatrixRain />
        <CyberNavigation />
        <main className="relative z-10 pt-20">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="terminal-window p-8 text-center">
              <div className="text-red-400 font-mono text-lg mb-4">
                <span className="text-gray-400">$</span> ACCESS DENIED
              </div>
              <p className="text-gray-400 font-mono mb-6">
                {!isAuthenticated 
                  ? "Authentication required to access posts management."
                  : "Admin privileges required to access posts management."
                }
              </p>
              <a
                href={!isAuthenticated ? "/api/login" : "/"}
                className="cyber-button px-6 py-3 rounded font-mono inline-block"
              >
                {!isAuthenticated ? "LOGIN" : "GO HOME"}
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen matrix-bg">
      <MatrixRain />
      <CyberNavigation />
      <main className="relative z-10 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="terminal-window p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-cyber text-3xl font-bold text-neon-cyan mb-2">
                  <span className="text-gray-400">$</span> manage_posts --admin
                </h1>
                <p className="text-gray-400 font-mono">
                  Total posts: {posts?.length || 0}
                </p>
              </div>
              <div className="flex gap-4">
                <Link href="/admin">
                  <Button variant="outline" className="font-mono">
                    ← BACK TO ADMIN
                  </Button>
                </Link>
                <Link href="/admin/new-post">
                  <Button className="cyber-button font-mono">
                    <Plus className="w-4 h-4 mr-2" />
                    NEW POST
                  </Button>
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              {posts && posts.length > 0 ? (
                posts.map((post) => (
                  <Card key={post.id} className="terminal-window border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg text-neon-cyan">
                              {post.title}
                            </h3>
                            <Badge
                              variant={post.published ? "default" : "secondary"}
                              className={`font-mono text-xs ${
                                post.published 
                                  ? "bg-neon-green/20 text-neon-green border-neon-green" 
                                  : "bg-gray-600 text-gray-300 border-gray-500"
                              }`}
                            >
                              {post.published ? "PUBLISHED" : "DRAFT"}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center gap-6 text-xs text-gray-500 font-mono">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(post.createdAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {post.views} views
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {post.authorId || 'Unknown'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {post.published && (
                            <Link href={`/blog/${post.slug}`}>
                              <Button size="sm" variant="outline" className="text-xs">
                                <Eye className="w-3 h-3 mr-1" />
                                VIEW
                              </Button>
                            </Link>
                          )}
                          <Link href={`/admin/edit-post/${post.id}`}>
                            <Button size="sm" variant="outline" className="text-xs">
                              <Edit className="w-3 h-3 mr-1" />
                              EDIT
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
                                deletePostMutation.mutate(post.id);
                              }
                            }}
                            disabled={deletePostMutation.isPending}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            DELETE
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="terminal-window">
                  <CardContent className="p-12 text-center">
                    <div className="text-gray-400 font-mono mb-4">
                      <span className="text-gray-500">$</span> no_posts_found
                    </div>
                    <p className="text-gray-500 mb-6">
                      No blog posts have been created yet.
                    </p>
                    <Link href="/admin/new-post">
                      <Button className="cyber-button font-mono">
                        <Plus className="w-4 h-4 mr-2" />
                        CREATE FIRST POST
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}