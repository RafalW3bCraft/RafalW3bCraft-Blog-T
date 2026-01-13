import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Shield, Bot, Zap, Crown, Github, Mail, ExternalLink } from 'lucide-react';

export default function Community() {
  const communityStats = [
    { label: 'Active Members', value: '247', icon: Users },
    { label: 'Messages Today', value: '1,204', icon: MessageSquare },
    { label: 'AI Filtered', value: '18', icon: Bot },
    { label: 'Admin Actions', value: '3', icon: Shield },
  ];

  const features = [
    {
      icon: MessageSquare,
      title: 'Real-time Chat Rooms',
      description: 'Engage in specialized cybersecurity discussions across multiple channels',
      color: 'text-cyan-400'
    },
    {
      icon: Bot,
      title: 'AI-Moderated Discussions',
      description: 'Smart content moderation ensuring productive conversations',
      color: 'text-purple-400'
    },
    {
      icon: Shield,
      title: 'Cybersecurity Insights',
      description: 'Latest threat intelligence and security research updates',
      color: 'text-green-400'
    },
    {
      icon: Zap,
      title: 'Exclusive GitHub Access',
      description: 'Private repositories and early access to security tools',
      color: 'text-yellow-400'
    },
    {
      icon: Users,
      title: 'Expert Community',
      description: 'Network with cybersecurity professionals and researchers',
      color: 'text-blue-400'
    },
    {
      icon: Crown,
      title: 'Premium Content',
      description: 'Advanced tutorials, research papers, and exclusive resources',
      color: 'text-gold-accent'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-matrix-black via-zinc-900 to-matrix-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              <span className="text-neon-cyan">Falcon's</span> Community
            </h1>
            <p className="text-zinc-400 text-xl max-w-2xl mx-auto">
              Join the elite cybersecurity community. Share knowledge, collaborate on cutting-edge projects, and advance the field of cybersecurity together.
            </p>
          </div>

          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {communityStats.map((stat, index) => (
              <Card key={index} className="bg-zinc-900/90 border-cyan-500/30 hover:border-cyan-500/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <stat.icon className="h-8 w-8 text-cyan-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-zinc-400 text-sm">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="bg-zinc-900/90 border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-105">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    <CardTitle className="text-white text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mb-12">
            <Card className="bg-zinc-900/90 border-cyan-500/30 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-cyan-400 text-2xl">Ready to Join?</CardTitle>
              </CardHeader>
              <CardContent className="py-8">
                <p className="text-zinc-300 mb-6 text-lg">
                  Connect with RafalW3bCraft and become part of the cybersecurity revolution. Get exclusive access to tools, research, and a network of security experts.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => window.location.href = '/contact'}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 text-lg"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Get in Touch
                  </Button>
                  <Button 
                    onClick={() => window.open('https://github.com/RafalW3bCraft', '_blank')}
                    variant="outline"
                    className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-8 py-3 text-lg"
                  >
                    <Github className="h-5 w-5 mr-2" />
                    View GitHub
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <h3 className="text-white font-semibold mb-4">Connect on Social Media</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => window.open('https://t.me/RafalW3bCraft', '_blank')}
                variant="outline"
                size="sm"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Telegram
              </Button>
              <Button
                onClick={() => window.open('https://twitter.com/RafalW3bCraft', '_blank')}
                variant="outline"
                size="sm"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Twitter/X
              </Button>
              <Button
                onClick={() => window.open('https://reddit.com/u/Geraki_init', '_blank')}
                variant="outline"
                size="sm"
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Reddit
              </Button>
            </div>
            <p className="text-zinc-500 text-sm mt-6">
              Community features are continuously evolving. Stay connected for real-time updates on new tools and collaboration opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}