class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.06, delay = 0): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playCorrectGuess(): void {
    this.tone(587.33, 0.14, 'triangle', 0.08, 0);
    this.tone(880, 0.22, 'triangle', 0.08, 0.09);
  }

  public playRoundStart(): void {
    this.tone(440, 0.12, 'sine', 0.05, 0);
    this.tone(554.37, 0.16, 'sine', 0.05, 0.08);
  }

  public playRoundEnd(): void {
    this.tone(523.25, 0.14, 'sine', 0.05, 0);
    this.tone(392, 0.2, 'sine', 0.05, 0.1);
  }

  public playGameOver(): void {
    this.tone(523.25, 0.15, 'triangle', 0.07, 0);
    this.tone(659.25, 0.15, 'triangle', 0.07, 0.11);
    this.tone(783.99, 0.28, 'triangle', 0.08, 0.22);
  }

  public playTick(): void {
    this.tone(760, 0.05, 'sine', 0.03, 0);
  }
}

export const soundEngine = new SoundEngine();
