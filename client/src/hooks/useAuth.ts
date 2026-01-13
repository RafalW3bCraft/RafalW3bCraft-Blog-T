import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

interface AuthUser extends User {
  
  isAdmin?: boolean;
}

export function useAuth() {
  
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async (): Promise<AuthUser> => {
      
      let response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      
      if (!response.ok && response.status === 401) {
        response = await fetch('/api/auth/oauth-user', {
          credentials: 'include'
        });
      }
      
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      
      const userData = await response.json();
      return userData;
    },
    retry: (failureCount, error) => {
      
      return failureCount < 2 && !error.message.includes('authenticated');
    },
    staleTime: 5 * 60 * 1000, 
    gcTime: 10 * 60 * 1000, 
  });

  const isAuthenticated = !!user && !error;
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;

  const logout = async () => {
    try {
      
      let response = await fetch('/api/logout', {
        method: 'GET',
        credentials: 'include'
      });
      
      
      if (!response.ok) {
        response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        
        refetch();
        
        window.location.href = data.redirect || '/';
      } else {
        
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      
      window.location.href = '/';
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    logout,
    refetch,
    error
  };
}