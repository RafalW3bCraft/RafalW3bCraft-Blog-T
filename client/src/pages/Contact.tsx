import { CyberNavigation } from '@/components/CyberNavigation';
import { MatrixRain } from '@/components/MatrixRain';
import { ContactSection } from '@/components/ContactSection';

export default function Contact() {
  return (
    <div className="min-h-screen matrix-bg">
      <MatrixRain />
      <CyberNavigation />
      
      <main className="relative z-10 pt-20">
        <div className="py-12">
          <ContactSection />
        </div>

        
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="terminal-window p-8">
              <div className="flex items-center mb-6">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-gray-400 text-sm ml-4 font-mono">contact-info.txt</span>
              </div>

              <div className="text-neon-green font-mono text-sm">
                <div className="mb-2">
                  <span className="text-gray-400">$</span> cat contact-info.txt
                </div>
                <div className="pl-4 space-y-3">
                  <div className="text-neon-cyan">
                    === SECURE COMMUNICATION CHANNELS ===
                  </div>
                  <div>
                    <span className="text-gold-accent">Primary Email:</span> contact@cyberanalyst.pro
                  </div>
                  <div>
                    <span className="text-gold-accent">PGP Fingerprint:</span> 1234 5678 90AB CDEF 1234 5678 90AB CDEF 12345678
                  </div>
                  <div>
                    <span className="text-gold-accent">Signal:</span> Available upon request
                  </div>
                  <div>
                    <span className="text-gold-accent">Keybase:</span> cyberanalyst_pro
                  </div>
                  <div className="mt-4 text-cyber-purple">
                    === RESPONSE TIMES ===
                  </div>
                  <div>
                    <span className="text-gold-accent">Emergency Security Issues:</span> &lt; 2 hours
                  </div>
                  <div>
                    <span className="text-gold-accent">General Inquiries:</span> &lt; 24 hours
                  </div>
                  <div>
                    <span className="text-gold-accent">Project Consultations:</span> &lt; 48 hours
                  </div>
                  <div className="mt-4 text-neon-cyan">
                    === SECURITY NOTICE ===
                  </div>
                  <div className="text-gray-300">
                    All communications are encrypted and logged for security purposes.
                    For sensitive matters, please use PGP encryption.
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-gray-400">$</span> 
                  <span className="animate-pulse ml-1">_</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      
      <footer className="bg-matrix-black border-t border-cyber-gray py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <i className="fas fa-terminal text-neon-cyan text-xl"></i>
              <span className="font-cyber text-xl font-bold text-neon-cyan">CYBERANALYST</span>
            </div>
            <p className="text-gray-400 font-mono text-sm">
              Secure communications. Professional cybersecurity services.{' '}
              <span className="text-neon-cyan">Always encrypted.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
