import { MatrixRain } from '@/components/MatrixRain';
import { CyberNavigation } from '@/components/CyberNavigation';
import { HeroSection } from '@/components/HeroSection';
import { AboutSection } from '@/components/AboutSection';
import { ServicesSection } from '@/components/ServicesSection';
import { BlogPreviewSection } from '@/components/BlogPreviewSection';
import { ProjectsSection } from '@/components/ProjectsSection';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ContactSection } from '@/components/ContactSection';

export default function Landing() {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="min-h-screen matrix-bg">
        <MatrixRain />
        <CyberNavigation />
      
      <main className="relative z-10">
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <ProjectsSection />
        <BlogPreviewSection />
        <ContactSection />
      </main>

      
      <footer className="bg-matrix-black border-t border-cyber-gray py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-neon-cyan text-xl">🔱</span>
                <span className="font-cyber text-xl font-bold text-neon-cyan">RafalW3bCraft</span>
              </div>
              <p className="text-gray-400 font-mono text-sm">
                Forging Future-Ready Cyber Solutions. Secure. Smart. Sovereign.
                <br />Cyber Engineering • App Innovation • Strategic Defense
              </p>
            </div>
            <div>
              <h4 className="font-cyber text-neon-green mb-4">Quick Links</h4>
              <nav className="space-y-2">
                <a href="#home" className="block text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-mono text-sm">Home</a>
                <a href="#about" className="block text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-mono text-sm">About</a>
                <a href="#services" className="block text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-mono text-sm">Services</a>
                <a href="#projects" className="block text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-mono text-sm">Projects</a>
                <a href="/blog" className="block text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-mono text-sm">Blog</a>
                <a href="#contact" className="block text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-mono text-sm">Contact</a>
              </nav>
            </div>
            <div>
              <h4 className="font-cyber text-neon-green mb-4">Connect</h4>
              <div className="space-y-2">
                <a href="https://github.com/RafalW3bCraft" target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-mono text-sm">
                  • GitHub
                </a>
                <a href="https://t.me/RafalW3bCraft" target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-mono text-sm">
                  • Telegram
                </a>
                <a href="https://x.com/RafalW3bCraft" target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-mono text-sm">
                  • Twitter/X
                </a>
                <a href="https://www.reddit.com/user/Geraki_init/" target="_blank" rel="noopener noreferrer" className="block text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-mono text-sm">
                  • Reddit
                </a>
                <a href="mailto:thewhitefalcon13@proton.me" className="block text-gray-400 hover:text-neon-cyan transition-colors duration-300 font-mono text-sm">
                  • Email
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-cyber text-neon-green mb-4">Security Protocols</h4>
              <div className="space-y-2 text-gray-400 font-mono text-sm">
                <div>• End-to-end encryption</div>
                <div>• Zero-log policy</div>
                <div>• PGP verified communications</div>
                <div>• OPSEC compliant</div>
              </div>
            </div>
          </div>
          <div className="border-t border-cyber-gray mt-12 pt-8 text-center">
            <p className="text-gray-400 font-mono text-sm">
              © 2025 RafalW3bCraft. All rights reserved.{' '}
              <span className="text-neon-cyan">Secure. Smart. Sovereign.</span>
            </p>
          </div>
        </div>
      </footer>
      </div>
    </ThemeProvider>
  );
}
