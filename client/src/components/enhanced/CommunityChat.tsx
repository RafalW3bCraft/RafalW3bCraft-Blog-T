import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Users, AlertTriangle, MessageSquare, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { audioService } from '@/lib/audioService';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  id: number;
  senderId: string;
  recipientId?: string;
  content: string;
  originalContent?: string;
  isModerated: boolean;
  moderationAction?: string;
  roomId?: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    username: string;
    profileImageUrl?: string;
    role: string;
  };
}

interface CommunityRoomProps {
  roomId?: string;
  isPrivateMessage?: boolean;
  recipientId?: string;
}

export function CommunityChat({ roomId = 'general', isPrivateMessage = false, recipientId }: CommunityRoomProps) {
  const { user, isAuthenticated } = useAuth();
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: isPrivateMessage 
      ? ['/api/messages/private', recipientId] 
      : ['/api/messages/room', roomId],
    enabled: isAuthenticated,
    refetchInterval: 2000, 
  });

  
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; roomId?: string; recipientId?: string }) => {
      return apiRequest('POST', '/api/messages', data);
    },
    onSuccess: () => {
      setMessage('');
      audioService.playSuccessSound();
      queryClient.invalidateQueries({ 
        queryKey: isPrivateMessage 
          ? ['/api/messages/private', recipientId]
          : ['/api/messages/room', roomId]
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send message',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
      audioService.playErrorSound();
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || !isAuthenticated) return;

    sendMessageMutation.mutate({
      content: message.trim(),
      roomId: isPrivateMessage ? undefined : roomId,
      recipientId: isPrivateMessage ? recipientId : undefined,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isAuthenticated) {
    return (
      <Card className="bg-zinc-900/90 border-cyan-500/30">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Community Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-zinc-400 mb-4">Join the cybersecurity community</p>
          <Button 
            onClick={() => window.location.href = '/auth/login'}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            Login to Chat
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/90 border-cyan-500/30 h-96 flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-cyan-400 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          {isPrivateMessage ? 'Private Message' : `#${roomId}`}
          {!isPrivateMessage && (
            <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-400">
              <Users className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        
        <ScrollArea className="flex-1 px-4">
          {isLoading ? (
            <div className="text-center py-4 text-zinc-400">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-4 text-zinc-400">
              {isPrivateMessage ? 'Start a conversation' : 'Be the first to say something!'}
            </div>
          ) : (
            <div className="space-y-3 py-2">
              {messages.map((msg: Message) => (
                <div key={msg.id} className="group">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {msg.sender?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">
                          {msg.sender?.username || 'Anonymous'}
                        </span>
                        {msg.sender?.role === 'admin' && (
                          <Badge variant="outline" className="text-xs border-gold-accent/50 text-gold-accent">
                            Admin
                          </Badge>
                        )}
                        {msg.isModerated && (
                          <Badge variant="outline" className="text-xs border-orange-500/50 text-orange-400">
                            <Bot className="h-3 w-3 mr-1" />
                            AI Filtered
                          </Badge>
                        )}
                        <span className="text-xs text-zinc-500">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-300 bg-zinc-800/50 rounded-lg px-3 py-2 break-words">
                        {msg.content}
                      </div>
                      {msg.isModerated && msg.originalContent && msg.originalContent !== msg.content && (
                        <div className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Message was filtered by AI moderation
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        
        <div className="border-t border-zinc-700 p-4">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${isPrivateMessage ? 'privately' : `#${roomId}`}...`}
              className="flex-1 bg-zinc-800 border-zinc-600 text-white placeholder-zinc-400 resize-none min-h-[40px] max-h-[100px]"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-white self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-zinc-500 mt-2">
            Messages are filtered by AI for community safety. Press Enter to send.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CommunityChat;