import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CyberNavigation } from '@/components/CyberNavigation';
import { MatrixRain } from '@/components/MatrixRain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { 
  ArrowLeft, 
  Mail, 
  Clock, 
  User, 
  MessageSquare, 
  Trash2,
  Eye,
  CheckCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { ContactMessage } from '@shared/schema';

interface ContactMessageWithStatus extends ContactMessage {
  isRead?: boolean;
}

export default function AdminMessages() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
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

  
  const { data: messages, isLoading: messagesLoading, error } = useQuery<ContactMessageWithStatus[]>({
    queryKey: ['/api/contact'],
    queryFn: async () => {
      const response = await fetch('/api/contact', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
    enabled: isAuthenticated && isAdmin,
  });

  
  const deleteMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return apiRequest('DELETE', `/api/contact/${messageId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Message Deleted',
        description: 'Contact message has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contact'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete message',
        variant: 'destructive',
      });
    },
  });

  const formatDate = (date: string | Date | null) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleString();
  };

  const handleDeleteMessage = (messageId: number) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMutation.mutate(messageId);
    }
  };

  if (isLoading || messagesLoading) {
    return (
      <div className="min-h-screen matrix-bg">
        <MatrixRain />
        <CyberNavigation />
        <main className="relative z-10 pt-20">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="terminal-window p-8 text-center">
              <div className="text-neon-green font-mono text-lg mb-4 animate-pulse">
                <span className="text-gray-400">$</span> {isLoading ? 'authenticating user...' : 'loading messages...'}
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
                  ? "Authentication required to access messages."
                  : "Admin privileges required to access messages."
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

  if (error) {
    return (
      <div className="min-h-screen matrix-bg">
        <MatrixRain />
        <CyberNavigation />
        <main className="relative z-10 pt-20">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="terminal-window p-8 text-center">
              <div className="text-red-400 font-mono text-lg mb-4">
                <span className="text-gray-400">$</span> ERROR LOADING MESSAGES
              </div>
              <p className="text-gray-400 font-mono mb-6">
                Failed to fetch contact messages. Please try again.
              </p>
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

  return (
    <div className="min-h-screen matrix-bg">
      <MatrixRain />
      <CyberNavigation />
      
      <main className="relative z-10 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button variant="outline" className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black">
                  <ArrowLeft className="mr-2" size={16} />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="font-cyber text-3xl font-bold text-neon-cyan">
                  ADMIN MESSAGES
                </h1>
                <p className="text-gray-400 font-mono">
                  Manage contact form submissions
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-neon-green text-neon-green">
                <Mail className="mr-2" size={14} />
                {messages?.length || 0} Messages
              </Badge>
            </div>
          </div>

          
          {!messages || messages.length === 0 ? (
            <Card className="glass-morphism border-neon-cyan/20">
              <CardContent className="p-12 text-center">
                <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl text-white mb-2">No Messages</h3>
                <p className="text-gray-400">No contact messages have been received yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <Card key={message.id} className="glass-morphism border-neon-cyan/20 hover:border-neon-cyan/40 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-neon-cyan/20 rounded-full">
                          <User className="h-4 w-4 text-neon-cyan" />
                        </div>
                        <div>
                          <CardTitle className="text-white text-lg">
                            {message.name}
                          </CardTitle>
                          <p className="text-gray-400 text-sm">{message.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="border-gray-500 text-gray-400">
                          <Clock className="mr-1" size={12} />
                          {formatDate(message.createdAt)}
                        </Badge>
                        <Button
                          onClick={() => handleDeleteMessage(message.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-neon-green font-mono text-sm mb-2">Subject:</h4>
                        <p className="text-white font-medium">{message.subject}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-neon-green font-mono text-sm mb-2">Message:</h4>
                        <div className="bg-matrix-black/50 p-4 rounded border border-gray-700">
                          <p className="text-gray-300 whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}