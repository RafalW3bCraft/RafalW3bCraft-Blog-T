import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CyberNavigation } from '@/components/CyberNavigation';
import { MatrixRain } from '@/components/MatrixRain';
import { AdminDashboard } from '@/components/AdminDashboard';
import { EnhancedAdminDashboard } from '@/components/admin/EnhancedAdminDashboard';

export default function Admin() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  
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

  if (isLoading) {
    return (
      <div className="min-h-screen matrix-bg">
        <MatrixRain />
        <CyberNavigation />
        <main className="relative z-10 pt-20">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="terminal-window p-8 text-center">
              <div className="text-neon-green font-mono text-lg mb-4 animate-pulse">
                <span className="text-gray-400">$</span> authenticating user...
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
                  ? "Authentication required to access admin panel."
                  : "Admin privileges required to access this area."
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

  return (
    <div className="min-h-screen matrix-bg">
      <MatrixRain />
      <CyberNavigation />
      
      <main className="relative z-10">
        <EnhancedAdminDashboard />
      </main>
    </div>
  );
}
