import { assetUrl } from "../data/projects";

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

  async unlock() {
    if (!this.context) this.context = new AudioContext();
    if (this.context.state === "suspended") await this.context.resume();
    this.ready = true;
  }

  play(name: string, restart = true) {
    if (!this.ready || this.muted) return;
    const sound = this.sounds[name];
    if (!sound) return;
    if (restart) sound.currentTime = 0;
    void sound.play().catch(() => undefined);
  }

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

  toggle() {
    this.muted = !this.muted;
    Object.values(this.sounds).forEach((sound) => {
      sound.muted = this.muted;
    });
    return this.muted;
  }
}
