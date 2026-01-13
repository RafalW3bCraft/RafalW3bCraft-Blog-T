import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CyberNavigation } from '@/components/CyberNavigation';
import { MatrixRain } from '@/components/MatrixRain';
import { BlogEditor } from '@/components/BlogEditor';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import type { BlogPost } from '@shared/schema';

export default function AdminBlogEditor() {
  const { id } = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const isEditing = !!id && id !== 'new';

  
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

  
  const { data: post, isLoading: postLoading, error: postError } = useQuery<BlogPost>({
    queryKey: ['/api/blog/posts', id],
    queryFn: async () => {
      const response = await fetch(`/api/blog/posts/${id}`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch post: ${response.status} - ${errorText}`);
      }
      return response.json();
    },
    enabled: isEditing && isAuthenticated && isAdmin,
    retry: (failureCount, error) => {
      
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  if (isLoading || (isEditing && postLoading)) {
    return (
      <div className="min-h-screen matrix-bg">
        <MatrixRain />
        <CyberNavigation />
        <main className="relative z-10 pt-20">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="terminal-window p-8 text-center">
              <div className="text-neon-green font-mono text-lg mb-4 animate-pulse">
                <span className="text-gray-400">$</span> {isLoading ? 'authenticating user...' : 'loading post...'}
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

  
  if (isEditing && postError) {
    return (
      <div className="min-h-screen matrix-bg">
        <MatrixRain />
        <CyberNavigation />
        <main className="relative z-10 pt-20">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="terminal-window p-8 text-center">
              <div className="text-red-400 font-mono text-lg mb-4">
                <span className="text-gray-400">$</span> ERROR: Post not found
              </div>
              <p className="text-gray-400 font-mono mb-6">
                The blog post you're trying to edit could not be found or you don't have permission to access it.
              </p>
              <Link href="/admin/posts">
                <Button className="cyber-button px-6 py-3 rounded font-mono">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Posts
                </Button>
              </Link>
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
                  ? "Authentication required to access blog editor."
                  : "Admin privileges required to access blog editor."
                }
              </p>
              <a
                href={!isAuthenticated ? "/api/login" : "/"}
                className="cyber-button px-6 py-3 rounded font-mono inline-block"
              >
                {!isAuthenticated ? "AUTHENTICATE" : "RETURN HOME"}
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isEditing && !post) {
    return (
      <div className="min-h-screen matrix-bg">
        <MatrixRain />
        <CyberNavigation />
        <main className="relative z-10 pt-20">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="terminal-window p-8 text-center">
              <div className="text-red-400 font-mono text-lg mb-4">
                <span className="text-gray-400">$</span> ERROR: Post not found
              </div>
              <Link href="/admin">
                <Button className="cyber-button px-6 py-3 rounded font-mono">
                  <ArrowLeft className="mr-2" size={16} />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleSave = () => {
    
    setTimeout(() => {
      setLocation('/admin/posts');
    }, 1000);
  };

  return (
    <div className="min-h-screen matrix-bg">
      <MatrixRain />
      <CyberNavigation />
      
      <main className="relative z-10">
        
        <div className="pt-20 px-4">
          <div className="max-w-7xl mx-auto mb-4">
            <Link href="/admin">
              <Button
                variant="outline"
                className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black transition-all duration-300 rounded font-mono"
              >
                <ArrowLeft className="mr-2" size={16} />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        <BlogEditor
          initialData={isEditing ? {
            id: post?.id,
            title: post?.title || '',
            slug: post?.slug || '',
            content: post?.content || '',
            excerpt: post?.excerpt || '',
            published: post?.published || false,
            tags: post?.tags || [],
          } : undefined}
          onSave={handleSave}
          isEditing={isEditing}
        />
      </main>
    </div>
  );
}
