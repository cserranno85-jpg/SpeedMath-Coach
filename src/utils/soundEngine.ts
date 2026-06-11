// Web Audio API sound effects engine for SpeedMath Coach.
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Load mute preference from localStorage safely
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('speedMathMuted');
      this.isMuted = storedMute === 'true';
    }
  }

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('speedMathMuted', String(muted));
  }

  public getMutedStatus(): boolean {
    return this.isMuted;
  }

  // 1. Snappier bubble pop/click sound for keypad entries and UI interactions
  public playClick() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn('Audio click failed to play:', e);
    }
  }

  // 2. Rising pleasant synth chord for correct mathematical answers
  public playCorrect() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      
      // Let's play an arpeggio chord of 3 notes (C5, E5, G5) sequentially for premium chime depth
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle'; // triangle is softer, warmer and more premium
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        
        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);
        
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.38);
      });
    } catch (e) {
      console.warn('Audio correct sound failed:', e);
    }
  }

  // 3. Falling sad buzzer for incorrect answers
  public playIncorrect() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      
      // Two detuned oscillators playing a minor chord falling downwards
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      
      // Buzzing frequency sliding downwards
      osc1.frequency.setValueAtTime(160, now);
      osc1.frequency.linearRampToValueAtTime(90, now + 0.3);
      
      osc2.frequency.setValueAtTime(155, now);
      osc2.frequency.linearRampToValueAtTime(85, now + 0.3);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc1.start(now);
      osc2.start(now);
      
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio incorrect sound failed:', e);
    }
  }

  // 4. High-fidelity triumphant golden chime for unlock achievements
  public playAchievement() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      
      // Let's synthesize an upbeat, sparkling major arpeggio scaling high: F5 -> A5 -> C6 -> F6
      const chain = [698.46, 880.00, 1046.50, 1396.91];
      
      chain.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        subOsc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        subOsc.type = 'triangle';
        
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        subOsc.frequency.setValueAtTime(freq / 2, now + i * 0.08); // sub-octave support
        
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.45);
        
        osc.start(now + i * 0.08);
        subOsc.start(now + i * 0.08);
        
        osc.stop(now + i * 0.08 + 0.5);
        subOsc.stop(now + i * 0.08 + 0.5);
      });
    } catch (e) {
      console.warn('Audio achievement sound failed:', e);
    }
  }

  // 5. Icy freezing sweep sound for Time Freeze power-up
  public playFreeze() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      // starts high and sweepy, then cools down
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.6);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      console.warn('Audio freeze sound failed:', e);
    }
  }

  // 6. Sparkling synth rising sound for Hint power-up
  public playHint() {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      // Whimsical swift pitch jump upward
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(987.77, now + 0.35); // B5
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio hint sound failed:', e);
    }
  }

  // 7. Dynamic countdown tick beep for the final 10 seconds of gameplay
  public playCountdownTick(secondsRemaining: number) {
    if (this.isMuted) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      
      // Pitch goes up as the clock ticks closer to 0!
      const pitch = secondsRemaining <= 3 ? 1200 : 800;
      const duration = secondsRemaining <= 3 ? 0.15 : 0.08;
      
      osc.frequency.setValueAtTime(pitch, now);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio countdown tick failed:', e);
    }
  }
}

export const sounds = new SoundEngine();
