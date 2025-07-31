import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User } from '@shared/schema';

interface AuthUser extends User {
  // Add any additional client-side user properties if needed
  isAdmin?: boolean;
}

export function useAuth() {
  // Enhanced authentication query with fallback strategy
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async (): Promise<AuthUser> => {
      // Try primary auth endpoint first
      let response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      // If primary fails, try OAuth-specific endpoint
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
      // Only retry on network errors, not on auth failures
      return failureCount < 2 && !error.message.includes('authenticated');
    },
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const isAuthenticated = !!user && !error;
  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;

  const logout = async () => {
    try {
      // Try multiple logout endpoints for compatibility
      let response = await fetch('/api/logout', {
        method: 'GET',
        credentials: 'include'
      });
      
      // Fallback to auth logout endpoint
      if (!response.ok) {
        response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        // Invalidate the user query to update the UI
        refetch();
        // Redirect to home page as specified by server or default to home
        window.location.href = data.redirect || '/';
      } else {
        // Force redirect even if API call fails
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if API call fails
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