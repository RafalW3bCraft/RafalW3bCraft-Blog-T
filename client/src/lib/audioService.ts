

export class AudioService {
  private static instance: AudioService;
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private hasPlayedThisSession: Set<string> = new Set();

  private constructor() {
    
    this.initializeAudioContext();
  }

  static getInstance(): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService();
    }
    return AudioService.instance;
  }

  private initializeAudioContext() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new AudioContext();
      
      
      const resumeContext = () => {
        if (this.audioContext?.state === 'suspended') {
          this.audioContext.resume();
        }
        document.removeEventListener('click', resumeContext);
        document.removeEventListener('keydown', resumeContext);
      };
      
      document.addEventListener('click', resumeContext);
      document.addEventListener('keydown', resumeContext);
    }
  }

  async playFalconRising(userId?: string): Promise<void> {
    if (!this.isEnabled || this.hasPlayedThisSession.has('rising')) return;
    
    try {
      
      if (userId) {
        const sessionId = this.getSessionId();
        const response = await fetch('/api/audio/check-played?' + new URLSearchParams({
          audioType: 'falcon-rising',
          sessionId
        }));
        
        if (response.ok) {
          const { hasPlayed } = await response.json();
          if (hasPlayed) {

            return;
          }
        }
      }

      await this.playAudio('/audio/falcon-rising.mp3', 0.7);
      this.hasPlayedThisSession.add('rising');

      
      if (userId) {
        await this.logAudioPlay('falcon-rising');
      }
    } catch (error) {
      
      this.playNotificationSound(440, 0.2, 0.3); 
    }
  }

  async playFalconCry(): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      await this.playAudio('/audio/falcon-cry.mp3', 0.6);
    } catch (error) {
      
      this.playNotificationSound(330, 0.3, 0.5); 
    }
  }

  private async playAudio(src: string, volume: number = 0.5): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(src);
      audio.volume = volume;
      
      audio.onloadeddata = () => {
        audio.play()
          .then(() => resolve())
          .catch(reject);
      };
      
      audio.onerror = () => reject(new Error(`Failed to load ${src}`));
    });
  }

  private playNotificationSound(frequency: number, duration: number, volume: number = 0.3): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  
  async playMatrixSound(): Promise<void> {
    if (!this.isEnabled) return;
    this.playNotificationSound(800, 0.1, 0.1);
  }

  async playHackingSound(): Promise<void> {
    if (!this.isEnabled) return;
    
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.playNotificationSound(1000 + i * 200, 0.05, 0.15), i * 100);
    }
  }

  async playSuccessSound(): Promise<void> {
    if (!this.isEnabled) return;
    this.playNotificationSound(660, 0.2, 0.2); 
  }

  async playErrorSound(): Promise<void> {
    if (!this.isEnabled) return;
    this.playNotificationSound(220, 0.4, 0.2); 
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem('falcon-audio-enabled', enabled.toString());
  }

  isAudioEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('falcon-audio-enabled');
    return saved !== null ? saved === 'true' : true;
  }

  resetSessionSounds(): void {
    this.hasPlayedThisSession.clear();
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('falcon-session-id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('falcon-session-id', sessionId);
    }
    return sessionId;
  }

  private async logAudioPlay(audioType: string): Promise<void> {
    try {
      const sessionId = this.getSessionId();
      await fetch('/api/audio/log-play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioType,
          sessionId
        })
      });
    } catch (error) {
      console.error('Failed to log audio play:', error);
    }
  }
}

export const audioService = AudioService.getInstance();