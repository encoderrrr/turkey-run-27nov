// Gobble Run — every sound is synthesised with WebAudio: no audio files,
// no network, just oscillators and filtered noise. The context is created
// lazily on the first player gesture, so the title screen stays silent
// until the player starts the run.

const MELODY = [
  // A sleepy autumn pluck, looped under the run (note, beats).
  ['E4', 1], ['G4', 1], ['A4', 1], ['G4', 1],
  ['E4', 1], ['D4', 1], ['C4', 2],
  ['D4', 1], ['E4', 1], ['G4', 1], ['A4', 1],
  ['G4', 1], ['E4', 1], ['D4', 2],
  ['C4', 1], ['D4', 1], ['E4', 1], ['D4', 1],
  ['C4', 2], ['D4', 1], ['E4', 2],
];

const NOTE_FREQ = {
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
};

export class SoundBank {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicOn = false;
  }

  // Called from the first key press or click; browsers need a gesture.
  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    this.context = new Ctor();
    this.master = this.context.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.context.destination);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  tone(freq, seconds, type = 'sine', volume = 0.2, when = 0, slideTo = null) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  noise(seconds, filterFreq, volume = 0.2, when = 0, sweepTo = null) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + when;
    const length = Math.max(1, Math.floor(this.context.sampleRate * seconds));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, t0);
    if (sweepTo !== null) filter.frequency.exponentialRampToValueAtTime(sweepTo, t0 + seconds);
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    source.connect(filter).connect(gain).connect(this.master);
    source.start(t0);
  }

  // The turkey's signature: five quick descending clucks.
  gobble() {
    [620, 540, 470, 410, 360].forEach((freq, i) => {
      this.tone(freq, 0.09, 'square', 0.12, i * 0.07, freq * 0.7);
    });
  }

  jump() {
    this.tone(280, 0.16, 'triangle', 0.22, 0, 620);
  }

  flap() {
    this.noise(0.12, 900, 0.1);
  }

  thud() {
    this.tone(90, 0.25, 'sine', 0.35, 0, 45);
    this.noise(0.15, 300, 0.2);
  }

  knifeWhoosh() {
    this.noise(0.35, 2400, 0.16, 0, 500);
  }

  ovenSizzle() {
    this.noise(0.5, 5200, 0.07);
    this.tone(140, 0.4, 'sawtooth', 0.05, 0, 90);
  }

  pickup() {
    this.tone(880, 0.09, 'sine', 0.2);
    this.tone(1318, 0.14, 'sine', 0.18, 0.07);
  }

  feather() {
    [523, 659, 784, 1046].forEach((freq, i) => {
      this.tone(freq, 0.12, 'triangle', 0.16, i * 0.06);
    });
  }

  farmerShout() {
    this.tone(180, 0.3, 'sawtooth', 0.16, 0, 90);
    this.tone(140, 0.3, 'sawtooth', 0.14, 0.12, 70);
  }

  winFanfare() {
    const notes = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5'];
    notes.forEach((note, i) => {
      this.tone(NOTE_FREQ[note], 0.35, 'triangle', 0.22, i * 0.11);
    });
    this.gobble();
  }

  caughtSting() {
    ['A4', 'G4', 'E4', 'C4'].forEach((note, i) => {
      this.tone(NOTE_FREQ[note], 0.4, 'sawtooth', 0.14, i * 0.22);
    });
  }

  startMusic() {
    if (!this.context || this.musicOn) return;
    this.musicOn = true;
    this.musicStep = 0;
    const beat = 0.32;
    const playStep = () => {
      if (!this.musicOn) return;
      const [note, beats] = MELODY[this.musicStep % MELODY.length];
      this.tone(NOTE_FREQ[note], beat * beats * 0.9, 'triangle', 0.07);
      this.musicStep += 1;
      this.musicTimer = window.setTimeout(playStep, beat * beats * 1000);
    };
    playStep();
  }

  stopMusic() {
    this.musicOn = false;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
