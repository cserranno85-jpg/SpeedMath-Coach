export const SOUND_EVENT_NAMES = [
  'uiTap',
  'primaryTap',
  'keypadTap',
  'correct',
  'incorrect',
  'startRound',
  'endRound',
  'achievement',
  'resetConfirm',
  'timerWarning',
] as const;

export type SoundEventName = (typeof SOUND_EVENT_NAMES)[number];

type BrowserAudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

type SoundNote = {
  frequency: number;
  start: number;
  duration: number;
  volume: number;
  type?: OscillatorType;
  endFrequency?: number;
};

const MUTE_STORAGE_KEY = 'speedMathMuted';
const MASTER_VOLUME = 0.28;

const minGapMs: Record<SoundEventName, number> = {
  uiTap: 45,
  primaryTap: 90,
  keypadTap: 30,
  correct: 100,
  incorrect: 180,
  startRound: 450,
  endRound: 450,
  achievement: 700,
  resetConfirm: 500,
  timerWarning: 900,
};

const eventNotes: Record<SoundEventName, SoundNote[]> = {
  uiTap: [
    { frequency: 520, start: 0, duration: 0.055, volume: 0.12, type: 'triangle', endFrequency: 620 },
  ],
  primaryTap: [
    { frequency: 440, start: 0, duration: 0.08, volume: 0.1, type: 'sine', endFrequency: 660 },
    { frequency: 660, start: 0.045, duration: 0.11, volume: 0.08, type: 'triangle', endFrequency: 880 },
  ],
  keypadTap: [
    { frequency: 360, start: 0, duration: 0.045, volume: 0.09, type: 'sine', endFrequency: 430 },
  ],
  correct: [
    { frequency: 523.25, start: 0, duration: 0.16, volume: 0.12, type: 'triangle' },
    { frequency: 783.99, start: 0.08, duration: 0.18, volume: 0.11, type: 'sine' },
  ],
  incorrect: [
    { frequency: 196, start: 0, duration: 0.2, volume: 0.08, type: 'triangle', endFrequency: 155.56 },
  ],
  startRound: [
    { frequency: 392, start: 0, duration: 0.09, volume: 0.1, type: 'triangle' },
    { frequency: 493.88, start: 0.055, duration: 0.1, volume: 0.09, type: 'triangle' },
    { frequency: 659.25, start: 0.12, duration: 0.13, volume: 0.09, type: 'sine' },
  ],
  endRound: [
    { frequency: 659.25, start: 0, duration: 0.14, volume: 0.1, type: 'triangle' },
    { frequency: 523.25, start: 0.11, duration: 0.17, volume: 0.09, type: 'triangle' },
    { frequency: 392, start: 0.23, duration: 0.22, volume: 0.08, type: 'sine' },
  ],
  achievement: [
    { frequency: 523.25, start: 0, duration: 0.14, volume: 0.09, type: 'triangle' },
    { frequency: 659.25, start: 0.085, duration: 0.14, volume: 0.09, type: 'triangle' },
    { frequency: 783.99, start: 0.17, duration: 0.16, volume: 0.09, type: 'sine' },
    { frequency: 1046.5, start: 0.28, duration: 0.22, volume: 0.075, type: 'sine' },
  ],
  resetConfirm: [
    { frequency: 261.63, start: 0, duration: 0.18, volume: 0.075, type: 'triangle', endFrequency: 220 },
  ],
  timerWarning: [
    { frequency: 880, start: 0, duration: 0.055, volume: 0.045, type: 'sine' },
  ],
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted = false;
  private lastPlayedAt: Partial<Record<SoundEventName, number>> = {};
  private warnedUnavailable = false;

  constructor() {
    this.isMuted = this.readMutedPreference();
  }

  private readMutedPreference(): boolean {
    try {
      return typeof window !== 'undefined' && localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private getAudioContextConstructor(): typeof AudioContext | undefined {
    if (typeof window === 'undefined') return undefined;
    const audioWindow = window as BrowserAudioWindow;
    return audioWindow.AudioContext ?? audioWindow.webkitAudioContext;
  }

  private initContext(): AudioContext | null {
    if (this.isMuted) return null;

    try {
      const AudioContextConstructor = this.getAudioContextConstructor();
      if (!AudioContextConstructor) {
        if (!this.warnedUnavailable) {
          this.warnedUnavailable = true;
          console.info('Web Audio is unavailable; sound effects are disabled.');
        }
        return null;
      }

      if (!this.ctx) {
        this.ctx = new AudioContextConstructor();
      }

      if (this.ctx.state === 'suspended') {
        void this.ctx.resume().catch(() => undefined);
      }

      return this.ctx;
    } catch {
      return null;
    }
  }

  private canPlay(eventName: SoundEventName): boolean {
    this.isMuted = this.readMutedPreference();
    if (this.isMuted) return false;

    const now = Date.now();
    const previous = this.lastPlayedAt[eventName] ?? 0;
    if (now - previous < minGapMs[eventName]) return false;

    this.lastPlayedAt[eventName] = now;
    return true;
  }

  private playNote(ctx: AudioContext, note: SoundNote): void {
    const now = ctx.currentTime + note.start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = note.type ?? 'sine';
    osc.frequency.setValueAtTime(note.frequency, now);
    if (note.endFrequency) {
      osc.frequency.exponentialRampToValueAtTime(note.endFrequency, now + note.duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(note.volume * MASTER_VOLUME, now + Math.min(0.018, note.duration * 0.3));
    gain.gain.exponentialRampToValueAtTime(0.0001, now + note.duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + note.duration + 0.012);
  }

  public play(eventName: SoundEventName): void {
    if (!this.canPlay(eventName)) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;
      eventNotes[eventName].forEach((note) => this.playNote(ctx, note));
    } catch {
      // Sound effects are ornamental; never let audio errors affect training.
    }
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
    } catch {
      // Ignore storage failures; in-memory mute state still applies.
    }
  }

  public getMutedStatus(): boolean {
    this.isMuted = this.readMutedPreference();
    return this.isMuted;
  }

  public playClick(): void {
    this.play('uiTap');
  }

  public playCorrect(): void {
    this.play('correct');
  }

  public playIncorrect(): void {
    this.play('incorrect');
  }

  public playAchievement(): void {
    this.play('achievement');
  }

  public playCountdownTick(secondsRemaining: number): void {
    if (secondsRemaining > 0 && secondsRemaining <= 5) {
      this.play('timerWarning');
    }
  }
}

export const sounds = new SoundEngine();
