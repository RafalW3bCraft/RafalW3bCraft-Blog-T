import { Badge } from '@/components/ui/badge';

const skills = [
  
  'JavaScript', 'React', 'HTML5', 'CSS3', 'Python', 'Node.js', 'Next.js', 'Tailwind', 'Redux', 'Bootstrap', 'Sass',

  
  'AI/ML', 'TensorFlow', 'Numpy', 'Pandas', 'Jupyter',

  
  'Kali Linux', 'Burp Suite', 'SQLmap', 'Nmap', 'Frida', 'OSINT', 'Security Testing', 'Linux', 'Bash', 'Debian',

  
  'Docker', 'Kubernetes', 'Nginx', 'Express', 'MySQL', 'PostgreSQL', 'SQLite', 'MongoDB', 'PHP',

  
  'Android', 'Android Studio', 'Telegram Bots', 'Android Dev',

  
  'Amazon Web Services', 'NGINX',

  
  'Git', 'NPM', 'VSCode', 'Pycharm', 'JetBrains', 'Babel',

  
  'Solana',

  
  'Canva', 'D3.js', 'CodePen',

  
  'Go', 'jQuery'
];


export function AboutSection() {
  return (
    <section id="about" className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-cyber text-3xl md:text-4xl font-bold text-center mb-12">
          <span className="text-neon-cyan">&lt;</span>ABOUT<span className="text-neon-cyan">/&gt;</span>
        </h2>

        
        <div className="space-y-12">
          
          <div className="glass-morphism p-8 rounded-lg">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">⚙️</span>
              <h3 className="font-cyber text-2xl text-neon-cyan">2022: Foundation</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Started deep diving into Linux, ethical hacking, OSINT, and reverse engineering.
              Built foundational cybersecurity knowledge with a focus on <strong className="text-neon-green">"Learning with Excellance."</strong>
            </p>
          </div>

          
          <div className="glass-morphism p-8 rounded-lg">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🧠</span>
              <h3 className="font-cyber text-2xl text-gold-accent">2023: Experimental Phase</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Created first custom security tools: crawlers, payload injectors, auto-exploiters.
              Experimented with Python for scripting automation and open-source contributions.
            </p>
            <div className="text-sm text-gray-400 font-mono">
              Gained mastery in: <span className="text-neon-cyan">sqlmap, nmap, ffuf, burp</span>
            </div>
          </div>

          
          <div className="glass-morphism p-8 rounded-lg">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🧠</span>
              <h3 className="font-cyber text-2xl text-cyber-purple">2024: Engineering Intelligence</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Specialized in combining <strong className="text-neon-green">AI + cybersecurity + app development</strong>
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <div>• <span className="text-neon-cyan">AI-Powered SQLi Hunter</span></div>
              <div>• <span className="text-neon-cyan">Telegram Security Bot</span></div>
              <div>• <span className="text-neon-cyan">Multilingual Learning App</span></div>
            </div>
          </div>

          
          <div className="glass-morphism p-8 rounded-lg border-2 border-neon-cyan">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🚀</span>
              <h3 className="font-cyber text-2xl text-neon-green">2025: Operational Supremacy</h3>
            </div>
            <p className="text-gray-300 mb-4">
              Full-stack portfolio with cutting-edge projects and system recovery expertise.
            </p>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2 text-gray-300">
                <div>• <span className="text-neon-cyan">G3r4ki</span>: Offensive AI Red Team Framework</div>
                <div>• <span className="text-neon-cyan">G3SPY</span>: Child-Parent Surveillance App</div>
                <div>• <span className="text-neon-cyan">Solana Trading Bot</span></div>
              </div>
              <div className="space-y-2 text-gray-300">
                <div>• <span className="text-neon-cyan">Telegram SaaS</span>: Link Scanning & Security</div>
                <div>• <span className="text-gold-accent">EFI/GRUB/GPU Recovery</span> via low-level Linux</div>
                <div>• <span className="text-cyber-purple">Next.js Portfolio</span> with MDX & Analytics</div>
              </div>
            </div>
          </div>
        </div>

        
        <div className="mt-12">
          <div className="glass-morphism p-8 rounded-lg">
            <h3 className="font-cyber text-xl text-neon-green mb-6">Tech Arsenal & Specializations</h3>
            
            
            <div className="flex flex-wrap gap-3">
              {skills.map((skill, index) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className={`px-3 py-1 text-sm rounded font-mono transition-colors duration-300 ${
                    index % 4 === 0
                      ? 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-matrix-black'
                      : index % 4 === 1
                      ? 'border-neon-green text-neon-green hover:bg-neon-green hover:text-matrix-black'
                      : index % 4 === 2
                      ? 'border-cyber-purple text-cyber-purple hover:bg-cyber-purple hover:text-white'
                      : 'border-gold-accent text-gold-accent hover:bg-gold-accent hover:text-matrix-black'
                  }`}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
