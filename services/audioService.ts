


// A simple synthesizer to generate SFX and BGM without external files
class AudioService {
  private ctx: AudioContext | null = null;
  private bgmInterval: number | null = null;
  private isMuted: boolean = false;
  private isNightmareMode: boolean = false;

  constructor() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }
  }

  public init() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    }
    return this.isMuted;
  }

  public setNightmareMode(active: boolean) {
      this.isNightmareMode = active;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.1, startTime: number = 0) {
    if (!this.ctx || this.isMuted) return;
    
    const t = startTime || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    
    // In nightmare mode, detune slightly for dissonance and drop pitch
    let finalFreq = freq;
    if (this.isNightmareMode) {
        finalFreq = freq * 0.8; // Lower pitch
        osc.detune.setValueAtTime((Math.random() - 0.5) * 100, t); // Random detune
    }

    osc.frequency.setValueAtTime(finalFreq, t);
    
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    
    // Add distortion in nightmare mode
    if (this.isNightmareMode) {
        const shaper = this.ctx.createWaveShaper();
        // Simple distortion curve
        const curve = new Float32Array(44100);
        for (let i = 0; i < 44100; i++) {
            const x = (i * 2) / 44100 - 1;
            curve[i] = (Math.PI + 50) * x / (Math.PI + 50 * Math.abs(x));
        }
        shaper.curve = curve;
        osc.connect(shaper);
        shaper.connect(gain);
    } else {
        osc.connect(gain);
    }
    
    gain.connect(this.ctx.destination);
    
    osc.start(t);
    osc.stop(t + duration);
  }

  public playClick() {
    if (!this.ctx || this.isMuted) return;
    this.init(); // Ensure context is running on click
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Subtle high-pitch blip
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);

    gain.gain.setValueAtTime(0.05, t); // Quiet volume
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playJump() {
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playDeath() {
    if (!this.ctx || this.isMuted) return;
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    noise.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  public playWin() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Victory fanfare
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        this.playTone(freq, 'square', 0.4, 0.1, now + i * 0.1);
    });
  }

  public playNightmareTease() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Unsettling reverse-like sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, now);
    osc.frequency.linearRampToValueAtTime(20, now + 0.5); // Drop pitch
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);

    // Filter for muffled effect
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playNightmareActive() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Sudden loud glitched noise
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public startBGM(levelId: number) {
    if (!this.ctx || this.bgmInterval || this.isMuted) return;
    this.isNightmareMode = false; // Reset on start
    
    let step = 0;
    // Faster tempo for higher levels
    const currentTempo = 130 + (levelId * 10);
    const interval = (60 / currentTempo) * 1000 / 4; // 16th notes

    // Melodies per level
    let bassLine: number[] = [];
    let leadLine: number[] = [];

    if (levelId === 1) {
        // C Major energetic
        bassLine = [65, 0, 65, 0, 73, 0, 87, 0, 65, 65, 0, 65, 98, 0, 87, 0];
        leadLine = [523, 0, 0, 523, 659, 0, 523, 0, 784, 0, 0, 659, 523, 0, 0, 0];
    } else if (levelId === 2) {
        // F Minor Synthwave
        bassLine = [87, 87, 0, 87, 103, 0, 77, 77, 87, 87, 0, 87, 65, 0, 77, 0];
        leadLine = [698, 0, 698, 0, 830, 0, 0, 698, 0, 622, 0, 0, 698, 0, 830, 0];
    } else if (levelId === 3) {
        // Fast/Complex
        bassLine = [110, 0, 110, 110, 123, 0, 130, 0, 98, 0, 98, 98, 110, 0, 123, 0];
        leadLine = [880, 0, 0, 880, 987, 0, 1174, 0, 880, 0, 783, 0, 659, 0, 783, 0];
    } else {
        // Level 4 (Ship): Driving D&B style
        bassLine = [55, 0, 0, 0, 55, 0, 65, 0, 55, 0, 0, 0, 49, 0, 49, 0];
        leadLine = [440, 659, 0, 440, 0, 659, 0, 880, 0, 659, 440, 0, 330, 0, 0, 0];
    }

    this.bgmInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted) return;

      const now = this.ctx.currentTime;

      // Kick (Every beat) - Heavier/distorted in Nightmare
      if (step % 4 === 0) {
        this.playTone(this.isNightmareMode ? 60 : 100, 'sine', 0.1, 0.3, now);
      }
      
      // Snare/Clap (Every other beat)
      if (step % 8 === 4) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = this.isNightmareMode ? 'sawtooth' : 'triangle';
          osc.frequency.setValueAtTime(this.isNightmareMode ? 100 : 150, now);
          gain.gain.setValueAtTime(0.1, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
      }

      // Hi-hat (Every off beat)
      if (step % 2 === 0) {
         const osc = this.ctx.createOscillator();
         const gain = this.ctx.createGain();
         osc.type = 'sawtooth';
         osc.frequency.value = 8000 + (Math.random() * 1000);
         gain.gain.setValueAtTime(0.03, now);
         gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
         osc.connect(gain);
         gain.connect(this.ctx.destination);
         osc.start(now);
         osc.stop(now + 0.05);
      }

      // Bass
      const bassNote = bassLine[step % bassLine.length];
      if (bassNote > 0) {
         this.playTone(bassNote, 'sawtooth', 0.2, 0.2, now);
      }

      // Lead (Simple arp)
      if (step % 2 === 0) {
        const leadNote = leadLine[Math.floor(step / 2) % leadLine.length];
        if (leadNote > 0) {
            this.playTone(leadNote, this.isNightmareMode ? 'sawtooth' : 'square', 0.1, 0.05, now);
        }
      }
      
      step++;
    }, interval);
  }

  public stopBGM() {
    this.isNightmareMode = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const audioService = new AudioService();
