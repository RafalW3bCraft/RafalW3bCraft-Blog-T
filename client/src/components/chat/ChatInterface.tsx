import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Shield, Users, Bot } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: number;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  isModerated: boolean;
  moderationAction?: string;
}

interface ChatInterfaceProps {
  user: {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  roomId?: string;
}

export default function ChatInterface({ user, roomId }: ChatInterfaceProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    
    const socketConnection = io(window.location.origin, {
      withCredentials: true,
    });

    socketConnection.on('connect', () => {
      setIsConnected(true);
      
      socketConnection.emit('authenticate', {
        userId: user.id,
      });
    });

    socketConnection.on('authenticated', () => {
      
      if (roomId) {
        socketConnection.emit('join_room', { roomId });
      }
      
      socketConnection.emit('get_chat_history', {
        roomId,
        limit: 50,
      });
    });

    socketConnection.on('chat_history', (history: Message[]) => {
      setMessages(history.reverse());
    });

    socketConnection.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socketConnection.on('message_sent', (message: Message) => {
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    });

    socketConnection.on('message_blocked', (data: { reason: string; action: string }) => {
      alert(`Message blocked: ${data.reason}`);
    });

    socketConnection.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, [user.id, roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!socket || !newMessage.trim()) return;

    setIsTyping(true);
    socket.emit('send_message', {
      content: newMessage,
      recipientId: roomId ? undefined : null, 
      roomId: roomId,
      messageType: 'text',
    });

    setTimeout(() => setIsTyping(false), 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-[600px] bg-zinc-900 border border-zinc-700 rounded-lg">
      
      <div className="flex items-center justify-between p-4 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          {roomId ? <Users className="w-5 h-5 text-cyan-400" /> : <Shield className="w-5 h-5 text-purple-400" />}
          <h3 className="text-white font-semibold">
            {roomId ? `Room: ${roomId}` : 'Admin Support'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-zinc-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.senderId === user.id ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.senderId !== user.id && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={message.senderAvatar} />
                  <AvatarFallback className="bg-purple-600 text-white text-sm">
                    {message.senderName?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.senderId === user.id
                    ? 'bg-cyan-600 text-white ml-auto'
                    : 'bg-zinc-700 text-white'
                }`}
              >
                {message.senderId !== user.id && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{message.senderName}</span>
                    {message.isModerated && (
                      <Badge variant="outline" className="text-xs">
                        <Bot className="w-3 h-3 mr-1" />
                        AI Moderated
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="text-sm">{message.content}</div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-70">
                    {formatTime(message.createdAt)}
                  </span>
                  {message.isModerated && message.moderationAction && (
                    <Badge variant="secondary" className="text-xs">
                      {message.moderationAction}
                    </Badge>
                  )}
                </div>
              </div>

              {message.senderId === user.id && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={user.profileImageUrl} />
                  <AvatarFallback className="bg-cyan-600 text-white text-sm">
                    {user.firstName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="bg-zinc-700 rounded-lg p-3 text-zinc-400 text-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      
      <div className="p-4 border-t border-zinc-700">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-cyan-400"
            disabled={!isConnected}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isConnected || !newMessage.trim()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
          <Bot className="w-3 h-3" />
          AI-powered moderation active • Messages are filtered for security
        </div>
      </div>
    </div>
  );
}