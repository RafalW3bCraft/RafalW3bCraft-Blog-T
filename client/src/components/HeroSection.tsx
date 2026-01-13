import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Terminal, Eye, FileText } from "lucide-react";

export function HeroSection() {
  const [typedText, setTypedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const fullText = "ELITE CYBER ANALYST";

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText((prev) => prev + fullText[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, fullText]);

  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center relative pt-16"
    >
      <div className="max-w-4xl mx-auto text-center px-4 z-10">
        <div className="terminal-window p-8 mb-8">
          
          <div className="flex items-center mb-6">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-gray-400 text-sm ml-4 font-mono">
              terminal@cyberanalyst:~$
            </span>
          </div>

          
          <div className="text-left">
            <p className="text-neon-green font-mono text-lg mb-2">
              <span className="text-gray-400">$</span> whoami
            </p>

            <h1 className="font-cyber text-4xl md:text-6xl font-bold mb-4">
              <span className="text-neon-cyan">🔱 </span>
              <span className="text-gold-accent animate-pulse-neon">
                RafalW3bCraft
              </span>
            </h1>

            <p className="text-cyber-purple text-xl md:text-2xl mb-4 font-cyber">
              "Turbulentiam amplectere, supra vola"
            </p>

            <p className="text-gray-300 text-lg md:text-xl mb-6 font-mono">
              Cyber Engineering • App Innovation • Strategic Defense Solutions •
              Full-Stack Development
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#services">
                <Button className="cyber-button px-8 py-3 rounded font-mono">
                  <Terminal className="mr-2" size={20} />
                  View Services
                </Button>
              </a>

              <a href="#contact">
                <Button
                  variant="outline"
                  className="px-8 py-3 border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black transition-all duration-300 rounded font-mono bg-transparent"
                >
                  <Eye className="mr-2" size={20} />
                  Contact Now
                </Button>
              </a>

              <Link href="/blog">
                <Button
                  variant="outline"
                  className="px-8 py-3 border-2 border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-white transition-all duration-300 rounded font-mono bg-transparent"
                >
                  <FileText className="mr-2" size={20} />
                  GitHub Projects
                </Button>
              </Link>
            </div>

            
            <div className="mt-8 p-4 border border-cyber-gray rounded-lg bg-matrix-black/30">
              <p className="text-gray-400 font-mono text-sm mb-4">
                Open Access Portfolio:
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="/blog">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto px-6 py-2 border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-300 rounded font-mono bg-transparent"
                  >
                    📖 Read Blog Posts
                  </Button>
                </a>
                <a href="#contact">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto px-6 py-2 border border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white transition-all duration-300 rounded font-mono bg-transparent"
                  >
                    📧 Contact Services
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>

        
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="glass-morphism p-4 rounded-lg">
            <div className="text-2xl font-bold text-neon-cyan font-cyber">
              Field-Crafted Expertise
            </div>
            <div className="text-sm text-gray-400 font-mono">
              Seasoned Experience
            </div>
          </div>
          <div className="glass-morphism p-4 rounded-lg">
            <div className="text-2xl font-bold text-neon-green font-cyber">
              Hands-On Specialist
            </div>
            <div className="text-sm text-gray-400 font-mono">
              Security Audits
            </div>
          </div>
          <div className="glass-morphism p-4 rounded-lg">
            <div className="text-2xl font-bold text-cyber-purple font-cyber">
              24/7
            </div>
            <div className="text-sm text-gray-400 font-mono">
              Threat Monitoring
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
