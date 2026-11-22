// Tiny synthesized sound effects for The Marlowe Job (WebAudio, no assets).
// Every sound is a couple of oscillators with an envelope, created on first use
// (browsers only allow audio after a user gesture). Mute with M.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (err) {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  function tone(freq, at, dur, type, gain) {
    const ac = ensure();
    if (!ac || muted) return;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + at);
    amp.gain.setValueAtTime(0.0001, ac.currentTime + at);
    amp.gain.exponentialRampToValueAtTime(gain, ac.currentTime + at + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + at + dur);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start(ac.currentTime + at);
    osc.stop(ac.currentTime + at + dur + 0.05);
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    click() { tone(660, 0, 0.07, 'square', 0.05); },
    pickup() { tone(880, 0, 0.12, 'sine', 0.12); tone(1318, 0.09, 0.16, 'sine', 0.1); },
    diamond() {
      tone(1046, 0, 0.14, 'sine', 0.12);
      tone(1318, 0.1, 0.14, 'sine', 0.12);
      tone(1568, 0.2, 0.24, 'sine', 0.12);
    },
    spotted() { tone(520, 0, 0.14, 'square', 0.08); tone(780, 0.12, 0.2, 'square', 0.08); },
    alarm() { tone(392, 0, 0.18, 'sawtooth', 0.07); tone(392, 0.22, 0.18, 'sawtooth', 0.07); },
    caught() { tone(330, 0, 0.25, 'sawtooth', 0.1); tone(220, 0.2, 0.4, 'sawtooth', 0.1); },
    smoke() { tone(180, 0, 0.3, 'sine', 0.08); },
    emp() { tone(1200, 0, 0.1, 'square', 0.05); tone(300, 0.08, 0.2, 'square', 0.05); },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.12, 0.22, 'sine', 0.11));
    },
  };
}
