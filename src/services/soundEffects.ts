/**
 * Web Audio API Sound Effects Engine for RTG-SYSTEM
 * Zero external audio files, works offline, instant ultra-low latency response.
 * Completely guarded against iframe policy restrictions, missing context, and unhandled errors.
 */

import { safeStorage } from "../utils/storage";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      const savedMute = safeStorage.getItem("RTG_SOUND_MUTED");
      this.isMuted = savedMute === "true";
    } catch {
      this.isMuted = false;
    }
  }

  private getContext(): AudioContext | null {
    try {
      if (typeof window === "undefined") return null;
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      safeStorage.setItem("RTG_SOUND_MUTED", String(this.isMuted));
    } catch {}
    if (!this.isMuted) {
      this.playClick();
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Celestial / harmonic welcome chime for RTG-SYSTEM
   */
  public playWelcome(): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, idx) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);

          gain.gain.setValueAtTime(0, now + idx * 0.1);
          gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.1 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.85);
        } catch {}
      });
    } catch {}
  }

  /**
   * Crisp UI interaction click / tap
   */
  public playClick(): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  /**
   * POS Barcode scan beep
   */
  public playBeep(): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1760, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
    } catch {}
  }

  /**
   * Cash Register / Sale confirmed success chime
   */
  public playCashRegister(): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // First bell
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(987.77, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.36);

      // Second higher bell + chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1318.51, now + 0.08);
      gain2.gain.setValueAtTime(0.22, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.62);

      // Shimmer sparkle
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(1975.53, now + 0.14);
      gain3.gain.setValueAtTime(0.12, now + 0.14);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.14);
      osc3.stop(now + 0.46);
    } catch {}
  }

  /**
   * Return / Refund confirmation sound
   */
  public playReturn(): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.19);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(440, now + 0.12);
      gain2.gain.setValueAtTime(0.18, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.42);
    } catch {}
  }

  /**
   * Soft warning / delete tone
   */
  public playWarning(): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  /**
   * Action completed successfully chime
   */
  public playSuccess(): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [587.33, 880, 1174.66];

      notes.forEach((freq, idx) => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.42);
        } catch {}
      });
    } catch {}
  }

  /**
   * Print receipt mechanical sound
   */
  public playPrint(): void {
    try {
      if (this.isMuted) return;
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.linearRampToValueAtTime(1400, now + 0.07);
      osc.frequency.linearRampToValueAtTime(600, now + 0.14);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }
}

export const soundFx = new SoundEngine();
