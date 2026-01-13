import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { 
  MessageSquare, 
  Heart, 
  Reply, 
  Clock, 
  User,
  ThumbsUp,
  Send,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Comment {
  id: number;
  content: string;
  authorId: string;
  author: {
    firstName: string;
    lastName?: string;
    email: string;
  };
  depth: number;
  parentCommentId?: number;
  createdAt: string;
  approved: boolean;
  replies?: Comment[];
}

interface Like {
  id: number;
  userId: string;
  likeType: string;
  createdAt: string;
}

interface CommentSectionProps {
  postId: number;
  postTitle: string;
}

export function CommentSection({ postId, postTitle }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState<Set<number>>(new Set());
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/blog/posts/${postId}/comments`);
      const data = await res.json();
      return data.comments || [];
    }
  });

  
  const { data: postLikes = { count: 0, likes: [] }, isLoading: likesLoading } = useQuery({
    queryKey: ['post-likes', postId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/blog/posts/${postId}/likes`);
      return res.json();
    }
  });

  
  const addCommentMutation = useMutation({
    mutationFn: async (commentData: { content: string; parentCommentId?: number }) => {
      const res = await apiRequest('POST', `/api/blog/posts/${postId}/comments`, commentData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Comment Added',
        description: 'Your comment has been posted successfully',
      });
      setNewComment('');
      setReplyContent('');
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Comment Failed',
        description: error.message || 'Failed to post comment',
        variant: 'destructive',
      });
    },
  });

  
  const likePostMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/blog/posts/${postId}/like`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-likes', postId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Like Failed',
        description: error.message || 'Failed to like post',
        variant: 'destructive',
      });
    },
  });

  
  const likeCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await apiRequest('POST', `/api/comments/${commentId}/like`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Like Failed',
        description: error.message || 'Failed to like comment',
        variant: 'destructive',
      });
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast({
        title: 'Content Required',
        description: 'Please enter a comment',
        variant: 'destructive',
      });
      return;
    }

    addCommentMutation.mutate({ content: newComment.trim() });
  };

  const handleAddReply = (parentId: number) => {
    if (!replyContent.trim()) {
      toast({
        title: 'Content Required',
        description: 'Please enter a reply',
        variant: 'destructive',
      });
      return;
    }

    addCommentMutation.mutate({ 
      content: replyContent.trim(), 
      parentCommentId: parentId 
    });
  };

  const handleLikePost = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please log in to like posts',
        variant: 'destructive',
      });
      return;
    }
    likePostMutation.mutate();
  };

  const handleLikeComment = (commentId: number) => {
    if (!isAuthenticated) {
      toast({
        title: 'Login Required',
        description: 'Please log in to like comments',
        variant: 'destructive',
      });
      return;
    }
    likeCommentMutation.mutate(commentId);
  };

  const toggleReplies = (commentId: number) => {
    setShowReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const isUserLikedPost = postLikes.likes?.some((like: Like) => like.userId === user?.id);

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l border-zinc-700 pl-4' : ''}`}>
      <Card className="bg-zinc-800/50 border-zinc-700 mb-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-zinc-200">
                  {comment.author.firstName} {comment.author.lastName || ''}
                </span>
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                {!comment.approved && (
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400 text-xs">
                    Pending
                  </Badge>
                )}
              </div>
              
              <p className="text-zinc-300 mb-3">{comment.content}</p>
              
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleLikeComment(comment.id)}
                  className="text-zinc-400 hover:text-red-400 p-1"
                >
                  <Heart className="h-4 w-4 mr-1" />
                  Like
                </Button>
                
                {isAuthenticated && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                    className="text-zinc-400 hover:text-cyan-400 p-1"
                  >
                    <Reply className="h-4 w-4 mr-1" />
                    Reply
                  </Button>
                )}
                
                {comment.replies && comment.replies.length > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleReplies(comment.id)}
                    className="text-zinc-400 hover:text-cyan-400 p-1"
                  >
                    {showReplies.has(comment.id) ? (
                      <ChevronUp className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    )}
                    {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </Button>
                )}
              </div>
              
              
              {replyingTo === comment.id && (
                <div className="mt-4 p-3 bg-zinc-900/50 rounded border border-zinc-700">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="bg-zinc-800/50 border-zinc-600 text-white mb-3"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddReply(comment.id)}
                      disabled={addCommentMutation.isPending}
                      className="bg-cyan-600 hover:bg-cyan-700"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}
                      className="border-zinc-600 text-zinc-300"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      
      {comment.replies && showReplies.has(comment.id) && (
        <div className="ml-4">
          {comment.replies.map(reply => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      
      <Card className="bg-zinc-900/90 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <ThumbsUp className="h-5 w-5" />
            Engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleLikePost}
              disabled={likePostMutation.isPending || !isAuthenticated}
              className={`flex items-center gap-2 ${
                isUserLikedPost 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              <Heart className={`h-4 w-4 ${isUserLikedPost ? 'fill-current' : ''}`} />
              {isUserLikedPost ? 'Liked' : 'Like Post'}
              <span className="bg-zinc-800 px-2 py-1 rounded text-sm">
                {postLikes.count || 0}
              </span>
            </Button>
            
            <div className="flex items-center gap-2 text-zinc-400">
              <MessageSquare className="h-4 w-4" />
              <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      
      <Card className="bg-zinc-900/90 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments ({comments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          
          {isAuthenticated ? (
            <div className="mb-6 p-4 bg-zinc-800/50 rounded border border-zinc-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={`Share your thoughts about "${postTitle}"...`}
                    className="bg-zinc-800/50 border-zinc-600 text-white mb-3"
                    rows={4}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={addCommentMutation.isPending || !newComment.trim()}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-zinc-800/30 rounded border border-zinc-700 text-center">
              <p className="text-zinc-400 mb-3">Please log in to join the discussion</p>
              <Button
                onClick={() => window.location.href = '/login'}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Login to Comment
              </Button>
            </div>
          )}

          
          {commentsLoading ? (
            <div className="text-center py-8 text-zinc-400">
              <MessageSquare className="h-8 w-8 mx-auto mb-4 opacity-50" />
              <p>Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <MessageSquare className="h-8 w-8 mx-auto mb-4 opacity-50" />
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: Comment) => renderComment(comment))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CommentSection;