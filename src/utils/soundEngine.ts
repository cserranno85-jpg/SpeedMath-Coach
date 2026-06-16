// Web Audio API sound effects engine for SpeedMath Coach.
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastPlayedAt: Record<string, number> = {};

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

  private canPlay(name: string, minimumGapMs = 32) {
    const now = Date.now();
    const last = this.lastPlayedAt[name] ?? 0;
    if (now - last < minimumGapMs) return false;
    this.lastPlayedAt[name] = now;
    return true;
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
    if (!this.canPlay('click', 42)) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.055);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.055, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.start(now);
      osc.stop(now + 0.075);
    } catch (e) {
      console.warn('Audio click failed to play:', e);
    }
  }

  // 2. Rising pleasant synth chord for correct mathematical answers
  public playCorrect() {
    if (this.isMuted) return;
    if (!this.canPlay('correct', 72)) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      
      const notes = [587.33, 739.99, 987.77];
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = idx === 2 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        
        gain.gain.setValueAtTime(0, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.05 + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.26);
        
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.3);
      });
    } catch (e) {
      console.warn('Audio correct sound failed:', e);
    }
  }

  // 3. Falling sad buzzer for incorrect answers
  public playIncorrect() {
    if (this.isMuted) return;
    if (!this.canPlay('incorrect', 110)) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.type = 'triangle';
      osc2.type = 'sine';
      
      osc1.frequency.setValueAtTime(174.61, now);
      osc1.frequency.linearRampToValueAtTime(110, now + 0.18);
      
      osc2.frequency.setValueAtTime(130.81, now);
      osc2.frequency.linearRampToValueAtTime(98, now + 0.18);
      
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.085, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      
      osc1.start(now);
      osc2.start(now);
      
      osc1.stop(now + 0.24);
      osc2.stop(now + 0.24);
    } catch (e) {
      console.warn('Audio incorrect sound failed:', e);
    }
  }

  // 4. High-fidelity triumphant golden chime for unlock achievements
  public playAchievement() {
    if (this.isMuted) return;
    if (!this.canPlay('achievement', 220)) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      
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
        gain.gain.linearRampToValueAtTime(0.095, now + i * 0.07 + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.34);
        
        osc.start(now + i * 0.07);
        subOsc.start(now + i * 0.07);
        
        osc.stop(now + i * 0.07 + 0.38);
        subOsc.stop(now + i * 0.07 + 0.38);
      });
    } catch (e) {
      console.warn('Audio achievement sound failed:', e);
    }
  }

  // 5. Icy freezing sweep sound for Time Freeze power-up
  public playFreeze() {
    if (this.isMuted) return;
    if (!this.canPlay('freeze', 180)) return;
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
    if (!this.canPlay('hint', 140)) return;
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
    if (!this.canPlay('countdown', 250)) return;
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
      gain.gain.linearRampToValueAtTime(0.09, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      
      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio countdown tick failed:', e);
    }
  }

  public playStart() {
    if (this.isMuted) return;
    if (!this.canPlay('start', 180)) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.075, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {
      console.warn('Audio start sound failed:', e);
    }
  }

  public playGameOver() {
    if (this.isMuted) return;
    if (!this.canPlay('gameover', 240)) return;
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const notes = [659.25, 493.88, 392.0];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.075);
        gain.gain.setValueAtTime(0, now + idx * 0.075);
        gain.gain.linearRampToValueAtTime(0.07, now + idx * 0.075 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.075 + 0.32);

        osc.start(now + idx * 0.075);
        osc.stop(now + idx * 0.075 + 0.35);
      });
    } catch (e) {
      console.warn('Audio game over sound failed:', e);
    }
  }
}

export const sounds = new SoundEngine();
