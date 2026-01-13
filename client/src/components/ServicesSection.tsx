import { Shield, Bot, Smartphone, Database } from 'lucide-react';

const services = [
  {
    icon: Shield,
    title: '🔐 Cybersecurity Engineering',
    description: 'Web App Security Testing (OWASP Top 10, AI-based pentesting)',
    features: [
      'Red Team Tools (custom toolchain, automation)',
      'Secure App Design & Compliance Support',
      'Advanced Persistent Threat Detection'
    ],
    color: 'neon-cyan'
  },
  {
    icon: Smartphone,
    title: '🧬 App Development',
    description: 'AI-Powered Educational Platforms & Advanced Applications',
    features: [
      'AI-Powered Educational Platforms (e.g., Quranic Linguistics)',
      'Telegram SaaS Bots (monetized products)',
      'Android Surveillance + Monitoring Systems'
    ],
    color: 'neon-green'
  },
  {
    icon: Bot,
    title: '📡 Custom Bots & Automation',
    description: 'Intelligent automation solutions for diverse use cases',
    features: [
      'Solana Sniper Bots',
      'Telegram Affiliate Bots',
      'AI-based Link Analyzers + Phishing Detectors'
    ],
    color: 'cyber-purple'
  },
  {
    icon: Database,
    title: '⚔️ Offensive Security',
    description: 'Red team frameworks and penetration testing tools',
    features: [
      'G3r4ki: Offensive AI Red Team Framework',
      'Custom Payload Injectors & Auto-Exploiters',
      'System Recovery & Low-Level Linux Magic'
    ],
    color: 'gold-accent'
  }
];

export function ServicesSection() {
  return (
    <section id="services" className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-cyber text-3xl md:text-4xl font-bold text-center mb-12">
          <span className="text-neon-cyan">&lt;</span>SERVICES<span className="text-neon-cyan">/&gt;</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <div key={index} className="glass-morphism p-8 rounded-lg hover:border-2 hover:border-current transition-all duration-300 group">
                <div className={`flex items-center mb-6 text-${service.color}`}>
                  <IconComponent size={32} className="mr-4" />
                  <h3 className="font-cyber text-xl font-bold">{service.title}</h3>
                </div>
                
                <p className="text-gray-300 mb-6 text-lg">
                  {service.description}
                </p>
                
                <div className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      <span className={`text-${service.color} mr-3 text-sm`}>•</span>
                      <span className="text-gray-300 text-sm font-mono leading-relaxed">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                
                <div className="mt-6 pt-4 border-t border-cyber-gray">
                  <div className="text-xs font-mono text-gray-400">
                    <span className={`text-${service.color}`}>$</span> service --status active
                    <span className="animate-pulse ml-2">_</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        
        <div className="text-center mt-12">
          <div className="glass-morphism p-8 rounded-lg">
            <h3 className="font-cyber text-2xl text-neon-green mb-4">Ready to Secure Your Digital Assets?</h3>
            <p className="text-gray-300 mb-6 font-mono">
              Let's discuss your cybersecurity needs and build custom solutions.
            </p>
            <a href="#contact" className="cyber-button px-8 py-3 rounded font-mono inline-flex items-center">
              <Shield className="mr-2" size={20} />
              Start Security Assessment
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}