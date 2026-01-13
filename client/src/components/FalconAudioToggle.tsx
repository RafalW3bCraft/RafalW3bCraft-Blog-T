import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { audioService } from '../lib/audioService';

export function FalconAudioToggle() {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    setIsEnabled(audioService.isAudioEnabled());
  }, []);

  const toggleAudio = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    audioService.setEnabled(newState);
    
    if (newState) {
      audioService.playSuccessSound();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleAudio}
      className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
      title={isEnabled ? 'Disable Falcon Audio' : 'Enable Falcon Audio'}
    >
      {isEnabled ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
    </Button>
  );
}