/**
 * Owns all audio playback for the experience: preloaded UI/voice-line clips
 * plus a synthesized click generated via the Web Audio API.
 */
import { assetUrl } from "../data/projects";

/**
 * Manages both sample-based sound effects (HTMLAudioElement) and a
 * procedurally synthesized tick sound (raw AudioContext oscillator). Playback
 * stays inert until `unlock()` has run, since browsers block audio (and
 * AudioContext creation/resume) until triggered by a user gesture.
 */
export class SoundSystem {
  private muted = false;
  private ready = false;
  private context: AudioContext | null = null;
  private sounds: Record<string, HTMLAudioElement> = {};
  private readonly levels: Record<string, number> = {
    "core-ready": 0.28,
    transform: 0.26,
    transformation: 0.24,
    "power-down": 0.2,
    recharged: 0.2,
  };

  constructor() {
    Object.keys(this.levels).forEach((name) => {
      const audio = new Audio(assetUrl(`audio/${name}.mp3`));
      audio.preload = name === "core-ready" || name === "transform" ? "auto" : "metadata";
      audio.volume = this.levels[name];
      this.sounds[name] = audio;
    });
  }

  /**
   * Creates/resumes the AudioContext and marks the system ready to play.
   * Must be called from within a user gesture handler (e.g. the boot button
   * click) — browsers refuse to start or resume an AudioContext otherwise,
   * so `play()`/`tick()` are no-ops until this has run.
   */
  async unlock() {
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === "suspended") await this.context.resume();
    this.ready = true;
  }

  /** Plays a preloaded named clip (see `levels` for the available names). */
  play(name: string, restart = true) {
    if (!this.ready || this.muted) return;
    const sound = this.sounds[name];
    if (!sound) return;
    if (restart) sound.currentTime = 0;
    void sound.play().catch(() => undefined);
  }

  /**
   * Plays a short synthesized click via a raw oscillator/gain node rather
   * than an audio file, since this fires continuously during drag/rotate
   * interactions and needs near-zero latency plus a variable pitch tied to
   * interaction `strength` — not practical with a fixed audio sample.
   */
  tick(strength = 1) {
    if (!this.ready || this.muted || !this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(190 + strength * 45, now);
    oscillator.frequency.exponentialRampToValueAtTime(95, now + 0.035);
    gain.gain.setValueAtTime(0.018, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }

  /** Flips global mute, applying it to all preloaded clips; returns the new muted state. */
  toggle() {
    this.muted = !this.muted;
    Object.values(this.sounds).forEach((sound) => {
      sound.muted = this.muted;
    });
    return this.muted;
  }
}
