import { Button } from '@/components/ui/button';
import { Shield, FileText, Github } from 'lucide-react';

export default function PublicNavButton() {
  return (
    <div className="flex gap-2">
      <Button
        onClick={() => window.location.href = '/blog'}
        variant="ghost"
        size="sm"
        className="text-cyan-400 hover:text-cyan-300"
      >
        <FileText className="w-4 h-4 mr-2" />
        Blog
      </Button>
      
      <Button
        onClick={() => window.location.href = 'https://github.com/RafalW3bCraft'}
        variant="ghost"
        size="sm"
        className="text-purple-400 hover:text-purple-300"
      >
        <Github className="w-4 h-4 mr-2" />
        GitHub
      </Button>
      
      <Button
        onClick={() => window.location.href = '#contact'}
        variant="outline"
        size="sm"
        className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
      >
        <Shield className="w-4 h-4 mr-2" />
        Contact
      </Button>
    </div>
  );
}