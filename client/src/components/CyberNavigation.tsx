import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { Menu, X, Terminal, Shield, Monitor } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { FalconAudioToggle } from './FalconAudioToggle';
import AuthButton from './enhanced/AuthButton';
import { useQuery } from '@tanstack/react-query';

export function CyberNavigation() {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  
  const { data: oauthUser } = useQuery({
    queryKey: ['/api/auth/oauth-user'],
    retry: false,
  });

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/blog', label: 'Blog' },
    { href: '/community', label: 'Community' },
  ];

  const isActive = (href: string) => {
    if (href === '/' && location === '/') return true;
    if (href !== '/' && location.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-morphism border-b border-neon-cyan/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer group">
              <span className="text-neon-cyan text-xl group-hover:text-neon-green transition-colors duration-300">🔱</span>
              <span className="font-cyber text-xl font-bold text-neon-cyan group-hover:text-neon-green transition-colors duration-300">
                RafalW3bCraft
              </span>
            </div>
          </Link>

          
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`transition-colors duration-300 font-mono ${
                    isActive(link.href)
                      ? 'text-neon-green'
                      : 'text-white hover:text-neon-cyan'
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
            
            <ThemeToggle />
            <FalconAudioToggle />
            
            
            {(oauthUser || isAuthenticated) ? (
              <div className="flex items-center space-x-4">
                
                <Link href="/dashboard">
                  <div className="flex items-center space-x-2 px-4 py-2 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black transition-all duration-300 rounded cursor-pointer">
                    <Monitor size={16} />
                    <span className="font-mono text-sm">Dashboard</span>
                  </div>
                </Link>
                
                
                <Link href="/settings">
                  <div className="flex items-center space-x-2 px-4 py-2 border border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-matrix-black transition-all duration-300 rounded cursor-pointer">
                    <Shield size={16} />
                    <span className="font-mono text-sm">Settings</span>
                  </div>
                </Link>
                
                {isAdmin && (
                  <Link href="/admin">
                    <div className="flex items-center space-x-2 px-4 py-2 border border-gold-accent text-gold-accent hover:bg-gold-accent hover:text-matrix-black transition-all duration-300 rounded cursor-pointer">
                      <Shield size={16} />
                      <span className="font-mono text-sm">Admin</span>
                    </div>
                  </Link>
                )}
                <a
                  href="/api/logout"
                  className="px-4 py-2 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black transition-all duration-300 rounded font-mono text-sm"
                >
                  Logout
                </a>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <a
                  href="/login"
                  className="px-4 py-2 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black transition-all duration-300 rounded font-mono text-sm"
                >
                  Login to Dashboard
                </a>
              </div>
            )}
          </div>

          
          <button
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-cyber-gray/50 py-4">
            <div className="space-y-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`block transition-colors duration-300 font-mono ${
                      isActive(link.href)
                        ? 'text-neon-green'
                        : 'text-white hover:text-neon-cyan'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
              
              {(oauthUser || isAuthenticated) ? (
                <div className="space-y-2">
                  
                  <Link href="/dashboard">
                    <div
                      className="flex items-center space-x-2 px-4 py-2 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black transition-all duration-300 rounded cursor-pointer w-fit"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Monitor size={16} />
                      <span className="font-mono text-sm">Dashboard</span>
                    </div>
                  </Link>
                  
                  <Link href="/settings">
                    <div
                      className="flex items-center space-x-2 px-4 py-2 border border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-matrix-black transition-all duration-300 rounded cursor-pointer w-fit"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Shield size={16} />
                      <span className="font-mono text-sm">Settings</span>
                    </div>
                  </Link>
                  
                  
                  {isAdmin && (
                    <Link href="/admin">
                      <div
                        className="flex items-center space-x-2 px-4 py-2 border border-gold-accent text-gold-accent hover:bg-gold-accent hover:text-matrix-black transition-all duration-300 rounded cursor-pointer w-fit"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Shield size={16} />
                        <span className="font-mono text-sm">Admin</span>
                      </div>
                    </Link>
                  )}
                  <a
                    href="/api/logout"
                    className="block px-4 py-2 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black transition-all duration-300 rounded font-mono text-sm w-fit"
                  >
                    Logout
                  </a>
                </div>
              ) : (
                <a
                  href="/api/login"
                  className="block px-4 py-2 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black transition-all duration-300 rounded font-mono text-sm w-fit"
                >
                  Admin Login
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
