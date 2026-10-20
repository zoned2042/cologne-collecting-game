/* Sillage — synthesized sound effects and showroom music (Web Audio, no files). */
const SFX = (() => {
  let ctx = null, master = null, sfxBus = null, musicBus = null, verb = null;
  let sfxOn = true, musicOn = true;
  let music = null;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? 0.9 : 0; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    verb = ctx.createConvolver(); verb.buffer = impulse(2.8, 2.2);
    const verbGain = ctx.createGain(); verbGain.gain.value = 0.35;
    verb.connect(verbGain); verbGain.connect(master);
    return ctx;
  }

  function impulse(seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function noiseBuffer(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function tone(freq, start, dur, { type = 'sine', vol = 0.2, attack = 0.005, wet = 0.3, dest } = {}) {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(dest || sfxBus);
    if (wet > 0) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(verb); }
    o.start(start); o.stop(start + dur + 0.05);
    return o;
  }

  const play = {
    click() { const t = ctx.currentTime; tone(880, t, 0.06, { type: 'triangle', vol: 0.08, wet: 0 }); },
    tab() { const t = ctx.currentTime; tone(520, t, 0.08, { type: 'sine', vol: 0.07, wet: 0.1 }); tone(780, t + 0.03, 0.1, { vol: 0.05, wet: 0.1 }); },
    // Glass bottle clink: inharmonic partials with fast decay.
    clink() {
      const t = ctx.currentTime;
      [2380, 3710, 5160, 6890].forEach((f, i) => tone(f * (0.98 + Math.random() * 0.04), t, 0.9 - i * 0.15, { vol: 0.07 / (i + 1), wet: 0.5 }));
    },
    // Atomizer: band-passed noise with a pump transient.
    spray() {
      const t = ctx.currentTime;
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.8);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(5200, t); bp.frequency.exponentialRampToValueAtTime(2600, t + 0.6); bp.Q.value = 0.7;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500;
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(sfxBus);
      const w = ctx.createGain(); w.gain.value = 0.2; g.connect(w); w.connect(verb);
      src.start(t); src.stop(t + 0.8);
      tone(180, t, 0.05, { type: 'square', vol: 0.05, wet: 0 });
    },
    // Register: two bells and a drawer thunk.
    buy() {
      const t = ctx.currentTime;
      tone(1318.5, t, 0.5, { type: 'triangle', vol: 0.12 });
      tone(1975.5, t + 0.08, 0.7, { type: 'triangle', vol: 0.1 });
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.2);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.25, t + 0.18); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      src.connect(lp); lp.connect(g); g.connect(sfxBus); src.start(t + 0.18);
      setTimeout(() => play.clink(), 260);
    },
    coins() { const t = ctx.currentTime; for (let i = 0; i < 5; i++) tone(2000 + Math.random() * 1500, t + i * 0.045, 0.18, { type: 'triangle', vol: 0.05, wet: 0.2 }); },
    sell() { const t = ctx.currentTime; tone(987.8, t, 0.3, { type: 'triangle', vol: 0.1 }); tone(659.3, t + 0.1, 0.4, { type: 'triangle', vol: 0.1 }); },
    good() { const t = ctx.currentTime; [523.3, 659.3, 784].forEach((f, i) => tone(f, t + i * 0.06, 0.35, { type: 'triangle', vol: 0.1 })); },
    perfect() { const t = ctx.currentTime; [523.3, 659.3, 784, 1046.5, 1318.5].forEach((f, i) => tone(f, t + i * 0.055, 0.5, { type: 'triangle', vol: 0.1 })); },
    miss() { const t = ctx.currentTime; tone(220, t, 0.25, { type: 'sawtooth', vol: 0.06, wet: 0 }); tone(165, t + 0.1, 0.3, { type: 'sawtooth', vol: 0.05, wet: 0 }); },
    error() { const t = ctx.currentTime; tone(140, t, 0.18, { type: 'square', vol: 0.06, wet: 0 }); },
    unlock() {
      const t = ctx.currentTime;
      [392, 523.3, 659.3, 784, 1046.5, 1568].forEach((f, i) => tone(f, t + i * 0.09, 1.1, { type: 'sine', vol: 0.09, wet: 0.6 }));
    },
    whoosh() {
      const t = ctx.currentTime;
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(1.2);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 0.5); bp.frequency.exponentialRampToValueAtTime(500, t + 1.1);
      const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      src.connect(bp); bp.connect(g); g.connect(sfxBus); src.start(t); src.stop(t + 1.2);
    },
    gavel() { const t = ctx.currentTime; tone(120, t, 0.2, { type: 'square', vol: 0.12, wet: 0.3 }); tone(90, t + 0.02, 0.25, { vol: 0.15, wet: 0.3 }); },
    // Box landing on velvet: a soft low thump.
    thud() {
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
      g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.4);
      const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.15);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
      const ng = ctx.createGain(); ng.gain.setValueAtTime(0.25, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      src.connect(lp); lp.connect(ng); ng.connect(sfxBus); src.start(t);
    },
    // Lid coming off a snug box: a short suction pop.
    lidpop() {
      const t = ctx.currentTime;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.12);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.2);
    },
    // Tissue paper: a cluster of short crinkles.
    rustle() {
      const t = ctx.currentTime;
      for (let i = 0; i < 9; i++) {
        const st = t + Math.random() * 0.55;
        const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.08);
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2500 + Math.random() * 4000; bp.Q.value = 1.5;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, st); g.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.1, st + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, st + 0.05 + Math.random() * 0.05);
        src.connect(bp); bp.connect(g); g.connect(sfxBus); src.start(st);
      }
    },
    // Sparkles: a quick glittering run.
    shimmer() {
      const t = ctx.currentTime;
      for (let i = 0; i < 14; i++) tone(2093 * Math.pow(2, (i % 7) / 7 + Math.floor(i / 7) * 0.5), t + i * 0.035, 0.6, { type: 'triangle', vol: 0.035, wet: 0.8 });
    },
    tick() { const t = ctx.currentTime; tone(1600, t, 0.03, { type: 'square', vol: 0.03, wet: 0 }); },
    reveal() {
      const t = ctx.currentTime;
      tone(196, t, 2.2, { type: 'sine', vol: 0.08, attack: 0.3, wet: 0.8 });
      tone(293.7, t + 0.1, 2.2, { type: 'sine', vol: 0.06, attack: 0.3, wet: 0.8 });
      tone(1174.7, t + 0.35, 1.6, { type: 'triangle', vol: 0.04, wet: 0.9 });
    },
  };

  // Slow ambient pad: four chords, detuned saws through a breathing low-pass.
  function startMusic() {
    if (!ctx || music) return;
    const chords = [[146.8, 220, 277.2, 329.6], [130.8, 196, 246.9, 329.6], [110, 164.8, 220, 261.6], [123.5, 185, 246.9, 293.7]];
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = 0.6;
    const lfo = ctx.createOscillator(); const lfoG = ctx.createGain(); lfo.frequency.value = 0.07; lfoG.gain.value = 450;
    lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
    const out = ctx.createGain(); out.gain.value = 0.5; lp.connect(out); out.connect(musicBus);
    const w = ctx.createGain(); w.gain.value = 0.5; out.connect(w); w.connect(verb);
    let step = 0; const len = 7;
    const voices = [];
    function schedule() {
      const t = ctx.currentTime + 0.05;
      const ch = chords[step % chords.length];
      ch.forEach((f, i) => {
        for (const det of [-6, 6]) {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.type = i === 0 ? 'triangle' : 'sawtooth'; o.frequency.value = f; o.detune.value = det;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 2.5); g.gain.linearRampToValueAtTime(0.025, t + len - 1); g.gain.linearRampToValueAtTime(0, t + len + 1.5);
          o.connect(g); g.connect(lp); o.start(t); o.stop(t + len + 1.6);
          voices.push(o);
        }
      });
      // A sparse bell melody over the pad.
      const bell = ch[2] * 4 * (Math.random() < 0.5 ? 1 : 1.5);
      tone(bell, t + 1.5 + Math.random() * 2, 2.5, { type: 'sine', vol: 0.025, wet: 0.9, dest: musicBus });
      step++;
    }
    schedule();
    const iv = setInterval(schedule, len * 1000);
    music = { iv, lfo, out };
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(musicOn ? 0.9 : 0, ctx.currentTime + 2);
  }

  function stopMusic() {
    if (!ctx || !music) return;
    const m = music; music = null;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    setTimeout(() => { clearInterval(m.iv); try { m.lfo.stop(); m.out.disconnect(); } catch (e) { /* already stopped */ } }, 1400);
  }

  return {
    unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); },
    play(name) {
      if (!sfxOn) return;
      const c = ensure(); if (!c || !play[name]) return;
      if (c.state === 'suspended') c.resume();
      try { play[name](); } catch (e) { /* audio is optional */ }
    },
    setSfx(on) { sfxOn = on; if (sfxBus) sfxBus.gain.value = on ? 0.9 : 0; },
    setMusic(on) {
      musicOn = on;
      if (!ctx) return;
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.linearRampToValueAtTime(on && music ? 0.9 : 0, ctx.currentTime + 0.6);
    },
    startMusic() { ensure(); startMusic(); },
    stopMusic,
  };
})();
