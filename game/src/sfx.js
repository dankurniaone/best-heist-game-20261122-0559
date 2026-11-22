// Sound: every effect is synthesized with WebAudio, so the game ships no
// audio files. A tiny helper plays short tones; the game calls it by name.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type = 'sine', gain = 0.08, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  pickup() {
    this.tone(660, 0.09, 'sine', 0.07);
    setTimeout(() => this.tone(990, 0.12, 'sine', 0.07), 70);
  }

  diamond() {
    this.tone(523, 0.1, 'triangle', 0.08);
    setTimeout(() => this.tone(784, 0.1, 'triangle', 0.08), 90);
    setTimeout(() => this.tone(1046, 0.18, 'triangle', 0.08), 180);
  }

  vault() {
    this.tone(220, 0.25, 'square', 0.05, 440);
    setTimeout(() => this.tone(440, 0.15, 'square', 0.05), 220);
  }

  spotted() {
    this.tone(880, 0.12, 'square', 0.06, 660);
  }

  caught() {
    this.tone(330, 0.3, 'sawtooth', 0.07, 110);
    setTimeout(() => this.tone(165, 0.4, 'sawtooth', 0.07, 82), 200);
  }

  smoke() {
    this.tone(300, 0.25, 'sine', 0.05, 120);
  }

  emp() {
    this.tone(1200, 0.2, 'sawtooth', 0.05, 200);
  }

  clear() {
    this.tone(392, 0.12, 'triangle', 0.08);
    setTimeout(() => this.tone(523, 0.12, 'triangle', 0.08), 110);
    setTimeout(() => this.tone(659, 0.2, 'triangle', 0.08), 220);
  }

  click() {
    this.tone(1200, 0.04, 'square', 0.04);
  }
}
