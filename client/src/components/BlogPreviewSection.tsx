import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { Calendar, Eye, ArrowRight } from 'lucide-react';
import type { BlogPost } from '@shared/schema';

export function BlogPreviewSection() {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/posts'],
    queryFn: async () => {
      const response = await fetch('/api/blog/posts?published=true');
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },
  });

  const featuredPosts = posts?.slice(0, 3) || [];

  const getCategoryColor = (index: number) => {
    const colors = ['neon-cyan', 'cyber-purple', 'gold-accent', 'neon-green'];
    return colors[index % colors.length];
  };

  return (
    <section id="blog" className="py-20 bg-gradient-to-b from-transparent to-dark-gray">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-cyber text-3xl md:text-4xl font-bold text-center mb-12">
          <span className="text-neon-cyan">CYBER</span>{' '}
          <span className="text-neon-green">BLOG</span>
        </h2>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-morphism p-6 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-600 rounded mb-3"></div>
                <div className="h-6 bg-gray-600 rounded mb-3"></div>
                <div className="h-16 bg-gray-600 rounded mb-4"></div>
                <div className="h-4 bg-gray-600 rounded"></div>
              </div>
            ))}
          </div>
        ) : featuredPosts.length === 0 ? (
          <div className="terminal-window p-8 text-center">
            <div className="text-neon-green font-mono text-lg mb-4">
              <span className="text-gray-400">$</span> ls blog/posts
            </div>
            <p className="text-gray-400 font-mono">No posts found. Check back soon for cyber security insights!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {featuredPosts.map((post, index) => (
              <article
                key={post.id}
                className={`glass-morphism p-6 rounded-lg hover:border-${getCategoryColor(index)} transition-all duration-300 group`}
              >
                <div className="flex items-center text-sm text-gray-400 mb-3 font-mono">
                  <Calendar size={14} className="mr-2" />
                  <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'No date'}</span>
                  <span className="mx-2">•</span>
                  <Badge
                    variant="secondary"
                    className={`px-2 py-1 bg-${getCategoryColor(index)} text-matrix-black rounded text-xs`}
                  >
                    Security
                  </Badge>
                </div>

                <h3 className="font-cyber text-xl text-neon-green mb-3 group-hover:text-gold-accent transition-colors duration-300">
                  {post.title}
                </h3>

                <p className="text-gray-300 mb-4 line-clamp-3">
                  {post.excerpt || post.content.substring(0, 120) + '...'}
                </p>

                <div className="flex items-center justify-between">
                  <Link href={`/blog/${post.slug}`}>
                    <Button
                      variant="link"
                      className="text-neon-cyan hover:text-gold-accent transition-colors duration-300 font-mono p-0"
                    >
                      READ_MORE <ArrowRight className="ml-1" size={14} />
                    </Button>
                  </Link>
                  
                  <div className="flex items-center text-sm text-gray-400 font-mono">
                    <Eye size={14} className="mr-1" />
                    <span>{post.views || 0}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/blog">
            <Button className="cyber-button px-8 py-3 rounded font-mono">
              View All Posts
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
