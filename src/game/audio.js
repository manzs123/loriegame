// Web Audio API sound system — no external files needed.
// All functions are safe to call before user interaction (AudioContext is
// created lazily and resumed on first call).

let _ctx = null;
let _bgmNodes = null;
let _bgmGain = null;
let _bgmRunning = false;

function getCtx() {
  try {
    if (!_ctx) {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_ctx.state === 'suspended') {
      _ctx.resume().catch(() => {});
    }
    return _ctx;
  } catch (e) {
    return null;
  }
}

// ---- BGM ---------------------------------------------------------------

export function startBGM() {
  try {
    if (_bgmRunning) return;
    const ctx = getCtx();
    if (!ctx) return;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.06;
    masterGain.connect(ctx.destination);
    _bgmGain = masterGain;

    // Two detuned sines for a beating drone effect (55 Hz + 55.8 Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 55;
    const g1 = ctx.createGain();
    g1.gain.value = 0.5;
    osc1.connect(g1);
    g1.connect(masterGain);
    osc1.start();

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 55.8;
    const g2 = ctx.createGain();
    g2.gain.value = 0.5;
    osc2.connect(g2);
    g2.connect(masterGain);
    osc2.start();

    // Filtered sawtooth at 110 Hz for atmosphere
    const osc3 = ctx.createOscillator();
    osc3.type = 'sawtooth';
    osc3.frequency.value = 110;
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 300;
    lpf.Q.value = 2;
    const g3 = ctx.createGain();
    g3.gain.value = 0.08;
    osc3.connect(lpf);
    lpf.connect(g3);
    g3.connect(masterGain);
    osc3.start();

    _bgmNodes = [osc1, osc2, osc3, g1, g2, g3, lpf, masterGain];
    _bgmRunning = true;
  } catch (e) {
    // Ignore — audio not available yet
  }
}

export function stopBGM() {
  try {
    if (!_bgmRunning || !_bgmNodes) return;
    _bgmNodes.forEach(n => {
      try { if (n.stop) n.stop(); } catch (_) {}
      try { n.disconnect(); } catch (_) {}
    });
    _bgmNodes = null;
    _bgmGain = null;
    _bgmRunning = false;
  } catch (e) {}
}

export function setBGMTense(tense) {
  try {
    if (!_bgmGain) return;
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    _bgmGain.gain.cancelScheduledValues(now);
    _bgmGain.gain.linearRampToValueAtTime(tense ? 0.14 : 0.06, now + 1.0);
  } catch (e) {}
}

// ---- SFX helpers -------------------------------------------------------

function playTone(opts) {
  // opts: { type, freq, duration, gainValue, fadeOut, delay }
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.value = opts.freq || 440;
    g.gain.value = opts.gainValue || 0.2;
    osc.connect(g);
    g.connect(ctx.destination);
    const start = ctx.currentTime + (opts.delay || 0);
    const end = start + (opts.duration || 0.15);
    osc.start(start);
    if (opts.fadeOut !== false) {
      g.gain.setValueAtTime(opts.gainValue || 0.2, start);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
    }
    osc.stop(end + 0.01);
  } catch (e) {}
}

// ---- SFX ---------------------------------------------------------------

export function sfxKill() {
  // Sharp descending sawtooth
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);
    g.gain.setValueAtTime(0.25, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {}
}

export function sfxSkill() {
  // Rising two-tone sine
  playTone({ type: 'sine', freq: 520, duration: 0.12, gainValue: 0.18, delay: 0 });
  playTone({ type: 'sine', freq: 780, duration: 0.14, gainValue: 0.18, delay: 0.1 });
}

export function sfxBodyFound() {
  // 3-pulse alarm
  for (let i = 0; i < 3; i++) {
    playTone({ type: 'square', freq: 380, duration: 0.1, gainValue: 0.15, delay: i * 0.18 });
    playTone({ type: 'square', freq: 220, duration: 0.08, gainValue: 0.12, delay: i * 0.18 + 0.1 });
  }
}

export function sfxSabotage() {
  // Power-down descending
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.8);
    g.gain.setValueAtTime(0.22, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.85);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.9);
  } catch (e) {}
}

export function sfxVote() {
  // Soft click
  playTone({ type: 'sine', freq: 900, duration: 0.06, gainValue: 0.10 });
}

export function sfxEjection() {
  // Dramatic 5-note descending sequence
  const notes = [880, 740, 622, 494, 330];
  notes.forEach((freq, i) => {
    playTone({ type: 'sine', freq, duration: 0.25, gainValue: 0.20, delay: i * 0.22 });
  });
}

export function sfxVoteStart() {
  // 3-note rising alert
  const notes = [330, 440, 660];
  notes.forEach((freq, i) => {
    playTone({ type: 'square', freq, duration: 0.12, gainValue: 0.14, delay: i * 0.15 });
  });
}
