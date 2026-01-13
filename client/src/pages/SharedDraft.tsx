import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Calendar, Share2, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface SharedDraftData {
  success: boolean;
  draft: {
    id: string;
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    author: string;
    authorEmail: string;
    readingTime: number;
    sharedAt: string;
    expiresAt: string;
  };
}

export function SharedDraft() {
  const { shareId } = useParams();

  const { data, isLoading, error } = useQuery<SharedDraftData>({
    queryKey: [`/api/blog/shared-draft/${shareId}`],
    enabled: !!shareId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-matrix-black text-matrix-green p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-4"></div>
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen bg-matrix-black text-matrix-green p-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="terminal-window border-red-500">
            <CardContent className="p-8">
              <h1 className="text-2xl font-cyber text-red-400 mb-4">
                Draft Not Found
              </h1>
              <p className="text-gray-400 mb-6">
                This shared draft may have expired or the link is invalid.
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="cyber-button"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { draft } = data;
  const timeUntilExpiry = Math.ceil((new Date(draft.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-matrix-black text-matrix-green p-8">
      <div className="max-w-4xl mx-auto">
        
        <Card className="terminal-window border-neon-cyan mb-8">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-cyan-600 text-white">
                <Share2 className="h-3 w-3 mr-1" />
                Shared Draft
              </Badge>
              <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                Expires in {timeUntilExpiry} day{timeUntilExpiry !== 1 ? 's' : ''}
              </Badge>
            </div>
            <CardTitle className="text-3xl font-cyber text-neon-cyan mb-4">
              {draft.title}
            </CardTitle>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                {draft.author}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(draft.sharedAt).toLocaleDateString()}
              </div>
              {draft.readingTime && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {draft.readingTime} min read
                </div>
              )}
            </div>
            {draft.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {draft.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="border-neon-green text-neon-green">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
        </Card>

        
        <Card className="terminal-window">
          <CardContent className="p-8">
            <div className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed">
              <ReactMarkdown>
                {draft.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        
        <Card className="terminal-window border-gray-700 mt-8">
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 text-sm mb-4">
              This draft was shared on {new Date(draft.sharedAt).toLocaleString()} and will expire on{' '}
              {new Date(draft.expiresAt).toLocaleString()}
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit RafalW3bCraft Portfolio
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SharedDraft;