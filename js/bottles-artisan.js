/* Sillage — artisan and niche houses, modelled from reference photos:
 * Le Labo, Diptyque, Frédéric Malle, Serge Lutens, Memo, Mancera, Montale,
 * Acqua di Parma, Penhaligon's, Ex Nihilo, Tiziana Terenzi, BDK, Bond No. 9 and
 * Jo Malone. Each house pours its line into one bottle, so every house is a
 * template and each fragrance passes its own juice, glass, cap and label.
 */
(() => {
  const B = BottleCraft.tools;
  const { kit, box, cyl, sphere, lathe, merge, gradient, glass, solid, fin, paint, Q, S, profile } = B;
  const T = () => B.T;

  /* ---------- painting helpers ---------- */
  const MONO = '"Courier New", Courier, "Liberation Mono", "DejaVu Sans Mono", monospace';
  // Typewriter text (Le Labo labels); x is the left edge unless align is given.
  function mono(P, s, x, y, size, color, o = {}) {
    const g = P.g; let px = size * P.H;
    g.save();
    const set = () => { g.font = `${o.weight || 400} ${px}px ${MONO}`; };
    set(); let w = g.measureText(s).width; const maxW = (o.maxW || 0.9) * P.W;
    if (w > maxW) { px *= maxW / w; set(); w = g.measureText(s).width; }
    g.fillStyle = color; g.textBaseline = 'middle';
    g.fillText(s, x * P.W - (o.align === 'center' ? w / 2 : 0), y * P.H);
    g.restore();
  }
  // Characters spaced evenly around an ellipse (Diptyque's oval band).
  function ringText(P, s, cx, cy, rx, ry, size, color, start = -Math.PI / 2) {
    const g = P.g, ch = [...s], n = ch.length;
    g.save(); g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `500 ${size * P.H}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
    for (let i = 0; i < n; i++) {
      const t = start + (i / n) * Math.PI * 2;
      const x = (cx + rx * Math.cos(t)) * P.W, y = (cy + ry * Math.sin(t)) * P.H;
      g.save(); g.translate(x, y); g.rotate(t + Math.PI / 2); g.fillText(ch[i], 0, 0); g.restore();
    }
    g.restore();
  }
  const rnd = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
  // Loose pen hatching for the engraved-looking Diptyque centres.
  function hatch(P, ink, n, x0, y0, w, h, seed = 1, lw = 0.006) {
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd(i + seed) * w, y = y0 + rnd(i + seed + 50) * h, a = rnd(i + seed + 90) * Math.PI, l = 0.03 + rnd(i + seed + 130) * 0.08;
      P.line(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l * 0.8, ink, lw);
    }
  }
  const lines = (P, rows) => rows.forEach(([s, y, sz, c, o]) => P.text(s, (o && o.x) != null ? o.x : 0.5, y, sz, c, o || {}));
  const unlit = (hex, op = 0.9) => new (T().MeshBasicMaterial)({ color: B.C(hex), transparent: true, opacity: op, depthWrite: false });

  /* ---------- Le Labo: round lab bottle, brushed cap, typed paper label ---------- */
  const LL = [[0, 0], [0.18, 0], [0.19, 0.012], [0.19, 0.5], [0.186, 0.535], [0.172, 0.568], [0.146, 0.596], [0.108, 0.616], [0.072, 0.624], [0, 0.624]];
  const lelabo = (o) => (item) => Q({
    body: 'lathe', pts: LL, w: 0.38, h: 0.624, d: 0.38, juice: o.juice, level: 0.86, inset: 0.93, jop: o.jop || 0.84,
    art: { wrap: true, r: 0.193, arc: 2.2, h: 0.27, y: 0.31, draw: (P) => {
      P.rect(0, 0, 1, 1, 'rgba(232,226,208,0.94)');
      const ink = '#111111';
      mono(P, o.title || item.name.toUpperCase(), 0.07, 0.12, 0.17, ink, { weight: 700, maxW: 0.8 });
      mono(P, (o.ml || '100ml 3,4') + ' FL.OZ.', 0.07, 0.25, 0.07, ink, { weight: 700 });
      mono(P, 'eau de parfum / vaporisateur', 0.07, 0.35, 0.07, ink, { weight: 700 });
      mono(P, 'natural spray', 0.07, 0.44, 0.07, ink, { weight: 700 });
      P.line(0.07, 0.5, 0.93, 0.5, 'rgba(40,40,40,0.35)', 0.005);
      mono(P, 'Compounded: ' + (o.where || 'in our lab'), 0.07, 0.58, 0.068, ink, { weight: 700 });
      mono(P, o.fresh || 'Fresh:  12 months after first spray', 0.07, 0.68, 0.068, ink, { weight: 700 });
      P.line(0.07, 0.76, 0.93, 0.76, 'rgba(40,40,40,0.25)', 0.004);
      mono(P, 'hand made · LE LABO · 233 Elizabeth Street, New York', 0.07, 0.83, 0.035, ink);
      mono(P, 'Le Labo Paris · 6 rue de Bourbon le Château, 75006', 0.07, 0.9, 0.035, ink);
    } },
    cap: [{ s: 'cyl', r: 0.086, h: 0.215, color: '#c4c7cb', metal: 1, rough: 0.38, coat: 0 }],
  });

  /* ---------- Diptyque: flat oval flacon with the oval cut-out label ---------- */
  function dipLabel(P, o) {
    P.ellipse(0.5, 0.5, 0.49, 0.49, 0, '#0d0d0d');
    P.ellipse(0.5, 0.5, 0.36, 0.385, 0, '#f4f2ec');
    ringText(P, '34 boulevard saint germain diptyque 34 boulevard saint germain paris5e ', 0.5, 0.5, 0.425, 0.44, 0.042, '#f2f2f2', -Math.PI * 0.62);
    P.g.save(); P.g.beginPath(); P.g.ellipse(0.5 * P.W, 0.5 * P.H, 0.345 * P.W, 0.37 * P.H, 0, 0, Math.PI * 2); P.g.clip();
    P.rect(0, 0, 1, 1, o.bg || '#f4f2ec');
    hatch(P, o.hatch || 'rgba(20,20,20,0.55)', o.n || 70, 0.18, 0.15, 0.64, 0.7, o.seed || 3, 0.005);
    if (o.draw) o.draw(P);
    const ls = o.letters, n = ls.length, sz = o.size || 0.16;
    ls.forEach((s, i) => P.text(s, 0.5, 0.5 + (i - (n - 1) / 2) * sz * 1.02, sz, o.ink || '#111111', { font: 'roman', weight: 700, track: 0.05, maxW: 0.62, shadow: o.glow }));
    P.g.restore();
    P.ellipse(0.5, 0.5, 0.36, 0.385, 0, 'rgba(0,0,0,0)');
    P.g.save(); P.g.strokeStyle = '#0d0d0d'; P.g.lineWidth = 0.012 * P.H; P.g.beginPath(); P.g.ellipse(0.5 * P.W, 0.5 * P.H, 0.352 * P.W, 0.377 * P.H, 0, 0, Math.PI * 2); P.g.stroke(); P.g.restore();
  }
  const diptyque = (o) => S({
    body: 'pillow', w: 0.52, h: 0.6, d: 0.2, ex: 0.55, ey: 0.58, juice: o.juice, level: 0.88, inset: 0.9, jop: o.jop || 0.84,
    art: { w: 0.4, h: 0.45, y: 0.3, z: 0.1, draw: (P) => dipLabel(P, o) },
    cap: [
      { s: 'cyl', r: 0.13, h: 0.02, dy: -0.03, color: '#0c0c0c', rough: 0.2 },
      { s: 'cyl', r: 0.088, h: 0.025, dy: -0.03, fin: 'chrome' },
      { s: 'cyl', r: 0.084, h: 0.215, dy: -0.03, color: '#0b0b0b', rough: 0.22 },
    ],
    top: 0.56,
  });

  /* ---------- Frédéric Malle: clear block, black band, red title, big black cap ---------- */
  const malle = (o) => (item) => Q({
    w: 0.454, h: 0.59, d: 0.3, r: 0.02, juice: o.juice, level: 0.83, inset: 0.95, jop: o.jop || 0.92,
    art: { w: 0.456, h: 0.2, y: 0.34, z: 0.152, draw: (P) => {
      P.rect(0, 0, 1, 1, '#141414');
      P.text(o.nose, 0.5, 0.17, 0.15, '#eeeeee', { font: 'serif', italic: true });
      const t = (o.title || item.name.toUpperCase()).split('\n');
      if (t.length > 1) { P.text(t[0], 0.5, 0.37, 0.16, '#e22a20', { font: 'helv', weight: 500, maxW: 0.92 }); P.text(t[1], 0.5, 0.53, 0.16, '#e22a20', { font: 'helv', weight: 500, maxW: 0.92 }); }
      else P.text(t[0], 0.5, 0.44, 0.2, '#e22a20', { font: 'helv', weight: 500, maxW: 0.92 });
      P.text('EDITIONS DE PARFUMS', 0.5, 0.72, 0.075, '#eeeeee', { font: 'helv' });
      P.text('FREDERIC MALLE', 0.5, 0.84, 0.11, '#eeeeee', { font: 'helv', weight: 500 });
    } },
    cap: [{ s: 'cyl', r: 0.163, h: 0.25, color: '#0c0c0c', rough: 0.16, seg: 56 }],
  });

  /* ---------- Serge Lutens: the tall bell-jar with a dark ball stopper ---------- */
  const lutens = (o) => (item) => Q({
    w: 0.31, h: 0.7, d: 0.15, r: 0.01, juice: o.juice, level: 0.94, inset: 0.92, jop: o.jop || 0.94,
    art: { w: 0.22, h: 0.3, y: 0.46, draw: (P) => {
      const bg = o.dark ? '#0c0c0c' : '#efe7d6', ink = o.dark ? '#f2f2f2' : '#1c1814';
      P.rect(0, 0, 1, 1, bg); P.frame(0.06, 0.05, 0.88, 0.9, ink, 0.008); P.frame(0.09, 0.075, 0.82, 0.85, ink, 0.003);
      if (o.nameFirst) { P.text(item.name.toUpperCase(), 0.5, 0.22, 0.1, ink, { font: 'roman', weight: 700, maxW: 0.78 }); P.text('SERGE LUTENS', 0.5, 0.34, 0.09, ink, { font: 'roman', weight: 700, maxW: 0.78 }); }
      else { P.text('SERGE LUTENS', 0.5, 0.2, 0.085, ink, { font: 'roman', weight: 700, maxW: 0.74 }); P.text(o.title || item.name, 0.5, 0.33, 0.1, ink, { font: 'serif', italic: true, weight: 600, maxW: 0.8 }); }
      // the house's small temple logo
      P.rect(0.4, 0.74, 0.2, 0.012, ink); for (let i = 0; i < 4; i++) P.rect(0.41 + i * 0.05, 0.756, 0.025, 0.05, ink); P.rect(0.4, 0.81, 0.2, 0.012, ink);
      P.text('PARIS', 0.5, 0.86, 0.03, ink, { font: 'roman', track: 0.2 });
    } },
    cap: [
      { s: 'cyl', r: 0.05, h: 0.03, glass: '#ffffff', op: 0.35 },
      { s: 'cyl', r: 0.062, h: 0.012, color: '#6e6a66', metal: 0.8, rough: 0.35, coat: 0 },
      { s: 'sphere', r: 0.06, color: '#46413e', metal: 0.85, rough: 0.38, coat: 0 },
    ],
  });

  /* ---------- Memo Paris: charcoal flacon, gold-leaf travel art, tall gold cap ---------- */
  const goldInk = (P, a = 1) => { const g = P.g.createLinearGradient(0, 0, P.W, P.H); g.addColorStop(0, `rgba(240,214,150,${a})`); g.addColorStop(0.5, `rgba(196,154,84,${a})`); g.addColorStop(1, `rgba(236,206,140,${a})`); return g; };
  function memoCartouche(P, name, y = 0.86, bg = '#e9d9a8', ink = '#2a2216') {
    P.rect(0.14, y - 0.09, 0.72, 0.19, bg, 0.02); P.frame(0.16, y - 0.08, 0.68, 0.17, '#9a7a3a', 0.005);
    P.text('MEMO', 0.5, y - 0.045, 0.06, '#a87a2e', { font: 'roman', weight: 700, track: 0.05 });
    P.text('PARIS', 0.5, y - 0.01, 0.018, '#5a4a2a', { font: 'roman', track: 0.3 });
    P.text(name.toUpperCase(), 0.5, y + 0.03, 0.036, ink, { font: 'helv', weight: 800, maxW: 0.64 });
    P.text('EAU DE PARFUM', 0.5, y + 0.065, 0.02, ink, { font: 'helv', weight: 600, track: 0.1 });
  }
  const memo = (o) => (item) => Q({
    w: 0.31, h: 0.67, d: 0.17, r: 0.03, solid: o.body || '#2c2b2d', rough: 0.45, coat: 0.4, env: 1,
    art: { w: o.pw || 0.24, h: o.ph || 0.47, y: o.py || 0.38, draw: (P) => {
      P.rect(0, 0, 1, 1, o.panel || '#3a3226');
      const g = P.g.createRadialGradient(0.5 * P.W, 0.35 * P.H, 0, 0.5 * P.W, 0.35 * P.H, 0.7 * P.H);
      g.addColorStop(0, o.glowIn || 'rgba(186,142,70,1)'); g.addColorStop(1, o.glowOut || 'rgba(70,52,26,1)'); P.g.fillStyle = g; P.g.fillRect(0, 0, P.W, P.H);
      if (o.draw) o.draw(P);
      memoCartouche(P, o.title || item.name, o.cy || 0.86, o.cbg, o.cink);
    } },
    cap: [{ s: 'cyl', r: 0.06, h: 0.015, color: '#d6b26a', metal: 1, rough: 0.22, coat: 0 }, { s: 'cyl', r: 0.056, h: 0.19, color: '#dcb978', metal: 1, rough: 0.2, coat: 0 }],
  });
  // Gold-leaf vignettes for each Cuir Nomade.
  const leopard = (P) => {
    const ink = '#3b2c14'; P.circle(0.5, 0.3, 0.2, 'rgba(255,236,180,0.5)');
    P.path([[0.15, 0.42], [0.35, 0.33], [0.6, 0.32], [0.78, 0.26], [0.86, 0.3], [0.8, 0.36], [0.64, 0.4], [0.5, 0.46], [0.3, 0.5]], '#c99a4a');
    for (let i = 0; i < 26; i++) P.circle(0.25 + rnd(i) * 0.55, 0.33 + rnd(i + 9) * 0.13, 0.008, ink);
    P.line(0.35, 0.45, 0.28, 0.56, '#c99a4a', 0.025); P.line(0.62, 0.4, 0.7, 0.5, '#c99a4a', 0.025);
    for (let i = 0; i < 14; i++) P.line(0.08 + i * 0.06, 0.65, 0.12 + i * 0.06, 0.58 - rnd(i) * 0.1, 'rgba(70,52,22,0.6)', 0.006);
  };
  const flora = (P) => { for (let i = 0; i < 7; i++) { const x = 0.2 + rnd(i) * 0.6, y = 0.15 + rnd(i + 3) * 0.5; for (let j = 0; j < 6; j++) P.ellipse(x, y, 0.06, 0.02, j * Math.PI / 6, 'rgba(70,50,20,0.55)'); P.circle(x, y, 0.012, '#3a2a10'); } for (let i = 0; i < 18; i++) P.line(0.1 + rnd(i + 20) * 0.8, 0.05 + rnd(i + 30) * 0.65, 0.1 + rnd(i + 40) * 0.8, 0.05 + rnd(i + 50) * 0.65, 'rgba(60,44,18,0.4)', 0.004); };
  const tuscany = (P) => { P.path([[0, 0.5], [0.3, 0.38], [0.6, 0.45], [1, 0.33], [1, 0.75], [0, 0.75]], 'rgba(90,70,36,0.55)'); for (let i = 0; i < 7; i++) { const x = 0.15 + i * 0.12; P.ellipse(x, 0.38 + (i % 3) * 0.03, 0.018, 0.08, 0, '#3a2c14'); } for (let i = 0; i < 10; i++) P.line(0, 0.55 + i * 0.022, 1, 0.5 + i * 0.026, 'rgba(60,44,18,0.4)', 0.004); };
  const rose = (P) => { for (let i = 0; i < 9; i++) P.circle(0.5, 0.36, 0.2 - i * 0.02, i % 2 ? 'rgba(240,214,150,0.9)' : 'rgba(110,80,36,0.7)'); for (let i = 0; i < 8; i++) P.ellipse(0.5 + Math.cos(i * 0.8) * 0.2, 0.36 + Math.sin(i * 0.8) * 0.15, 0.08, 0.035, i * 0.8, 'rgba(90,64,26,0.5)'); };
  const desert = (P) => { P.circle(0.5, 0.3, 0.1, 'rgba(255,240,200,0.9)'); P.path([[0, 0.55], [0.2, 0.48], [0.45, 0.52], [0.7, 0.45], [1, 0.5], [1, 0.76], [0, 0.76]], 'rgba(70,52,24,0.75)'); for (let i = 0; i < 5; i++) P.ellipse(0.15 + i * 0.18, 0.62, 0.05, 0.012, 0, 'rgba(250,230,180,0.6)'); P.rect(0, 0.0, 1, 0.12, 'rgba(60,46,24,0.5)'); };
  const lalibela = (P) => {
    const g = P.g.createLinearGradient(0, 0, 0, P.H); g.addColorStop(0, '#d88a58'); g.addColorStop(1, '#eebc90'); P.g.fillStyle = g; P.g.fillRect(0, 0, P.W, P.H * 0.92);
    for (let y = 0; y < 0.9; y += 0.05) for (let x = 0; x < 1.05; x += 0.14) P.path([[x, y], [x + 0.07, y + 0.025], [x, y + 0.05], [x - 0.07, y + 0.025]], 'rgba(255,240,226,0.45)', false, 0.004);
    for (const [x, y] of [[0.3, 0.42], [0.72, 0.6], [0.5, 0.72], [0.2, 0.8], [0.8, 0.82]]) for (let i = 0; i < 4; i++) P.line(x, y, x + Math.cos(i * Math.PI / 4) * 0.06, y + Math.sin(i * Math.PI / 4) * 0.035, '#8ab4c0', 0.008);
    P.rect(0, 0.92, 1, 0.08, '#1c1a1a');
    P.text('LALIBELA', 0.5, 0.66, 0.032, '#3a2a1a', { font: 'roman', weight: 700 }); P.text('EAU DE PARFUM', 0.5, 0.69, 0.012, '#3a2a1a', { font: 'helv', track: 0.15 });
    P.text('MEMO', 0.5, 0.725, 0.03, '#3a2a1a', { font: 'roman', weight: 700 }); P.text('Fleurs Bohèmes', 0.5, 0.86, 0.016, '#3a2a1a', { font: 'serif', italic: true });
  };
  const inle = (P) => {
    P.rect(0, 0, 1, 1, '#e2c4bc');
    for (let i = 0; i < 8; i++) { const x = rnd(i + 2) * 0.9, y = 0.08 + rnd(i + 7) * 0.5; for (let j = 0; j < 4; j++) P.circle(x + j * 0.05, y - (j % 2) * 0.02, 0.05, 'rgba(214,176,108,0.85)'); }
    P.rect(0.2, 0.5, 0.6, 0.02, 'rgba(214,176,108,0.85)');
  };

  /* ---------- Mancera: tall round flacon, printed M monogram, banded cap ---------- */
  const MC = [[0, 0], [0.158, 0], [0.176, 0.012], [0.183, 0.04], [0.183, 0.15], [0.183, 0.3], [0.183, 0.45], [0.183, 0.62], [0.176, 0.645], [0.156, 0.665], [0.118, 0.68], [0.086, 0.686], [0, 0.686]];
  const mLogo = (P, x, y, s, c) => P.path([[x - s, y + s * 0.5], [x - s, y - s * 0.5], [x - s * 0.55, y - s * 0.5], [x, y + s * 0.05], [x + s * 0.55, y - s * 0.5], [x + s, y - s * 0.5], [x + s, y + s * 0.5], [x + s * 0.65, y + s * 0.5], [x + s * 0.65, y - s * 0.05], [x, y + s * 0.5], [x - s * 0.65, y - s * 0.05], [x - s * 0.65, y + s * 0.5]], c);
  const mancera = (o) => (item) => {
    const ink = o.ink || '#141414';
    const sp = { body: 'lathe', pts: MC, w: 0.366, h: 0.686, d: 0.366, seg: 56 };
    if (o.solid) Object.assign(sp, { solid: '#ffffff', grad: o.solid, gc: o.gc || 1, metal: o.metal || 0, rough: o.rough || 0.15, coat: o.metal ? 0.2 : 0.8, env: o.metal ? 2 : 1.2 });
    else Object.assign(sp, { juice: o.juice, level: 0.88, inset: 0.95, jop: o.jop || 0.82 });
    const t = (o.title || item.name.toUpperCase()).split('\n');
    sp.art = { wrap: true, r: 0.186, arc: 1.5, h: 0.56, y: 0.33, draw: (P) => {
      if (o.band) P.rect(0.32, 0, 0.36, 1, o.band);
      if (o.frame) { P.rect(0.16, 0.08, 0.68, 0.36, '#fbfaf6'); P.frame(0.18, 0.09, 0.64, 0.34, '#1a1a1a', 0.005); }
      if (o.emblem) o.emblem(P);
      const ly = o.frame ? 0.29 : 0.15;
      mLogo(P, 0.5, ly, 0.045, o.logo || ink);
      P.text('MANCERA', 0.5, ly + 0.06, 0.045, o.logo || ink, { font: 'helv', weight: 800, track: 0.1 });
      P.text('PARIS', 0.5, ly + 0.095, 0.02, o.logo || ink, { font: 'helv', weight: 600, track: 0.3 });
      const ty = o.frame ? 0.15 : 0.49;
      t.forEach((s, i) => P.text(s, 0.5, ty + i * 0.065, o.tsz || 0.06, o.tink || ink, { font: 'helv', weight: 700, track: 0.04, maxW: 0.6 }));
      P.text('EAU DE PARFUM', 0.5, 0.75, 0.03, ink, { font: 'helv', weight: 600, track: 0.08 });
      P.text('4 Fl.oz', 0.36, 0.84, 0.018, ink, { font: 'helv' }); P.text('120 ML', 0.64, 0.84, 0.018, ink, { font: 'helv' });
    } };
    const capMat = o.cap === 'gold' ? { color: '#d8b56a', metal: 1, rough: 0.22, coat: 0 } : { color: '#101010', rough: 0.15 };
    const ring = o.cap === 'gold' || o.ring === 'gold' ? { color: '#d8b56a', metal: 1, rough: 0.22, coat: 0 } : { fin: 'chrome' };
    sp.cap = [Object.assign({ s: 'cyl', r: 0.088, h: 0.035 }, ring), Object.assign({ s: 'cyl', r: 0.086, h: 0.14 }, capMat), Object.assign({ s: 'cyl', r: 0.08, h: 0.012 }, ring)];
    return Q(sp);
  };

  /* ---------- Montale: aluminium flask, gold pump and the hanging star medallion ---------- */
  const MT = [[0, 0], [0.128, 0], [0.137, 0.01], [0.137, 0.15], [0.137, 0.3], [0.137, 0.45], [0.137, 0.585], [0.132, 0.61], [0.115, 0.635], [0.08, 0.652], [0.042, 0.66], [0, 0.66]];
  const star8 = (r, y, x, z, depth) => {
    const t = T(), sh = new t.Shape();
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, rr = i % 2 ? r * 0.72 : r; const px = Math.sin(a) * rr, py = Math.cos(a) * rr; i ? sh.lineTo(px, py) : sh.moveTo(px, py); }
    const g = new t.ExtrudeGeometry(sh, { depth, bevelEnabled: false }); g.translate(x, y, z - depth / 2); return g;
  };
  const goldMat = () => solid({ color: '#d9b25e', metal: 1, rough: 0.25, coat: 0, env: 2.4 });
  const montale = (o) => (item) => Q({
    body: 'lathe', pts: MT, w: 0.274, h: 0.66, d: 0.274, seg: 56,
    solid: '#ffffff', grad: o.grad, gc: o.gc || 1, metal: o.metal != null ? o.metal : 0.55, rough: o.rough || 0.32, coat: 0.5, env: 1.6,
    art: { wrap: true, r: 0.14, arc: 1.6, h: 0.58, y: 0.31, draw: (P) => {
      if (o.draw) o.draw(P);
      const ink = o.ink || '#d8b46a';
      P.path([[0.5, 0.17], [0.58, 0.22], [0.5, 0.27], [0.42, 0.22]], ink, false, 0.006);
      P.frame(0.46, 0.197, 0.08, 0.046, ink, 0.004);
      P.text('M', 0.5, 0.22, 0.036, ink, { font: 'roman', weight: 700 });
      P.text('MONTALE', 0.5, 0.31, 0.055, o.word || '#e6e6e6', { font: 'helv', weight: 800, track: 0.04, maxW: 0.66 });
      P.text('PARIS', 0.5, 0.342, 0.018, o.word || '#e6e6e6', { font: 'helv', weight: 600, track: 0.3 });
      P.rect(0.26, 0.85, 0.48, 0.075, o.plate || '#0c0c0c'); P.frame(0.27, 0.856, 0.46, 0.063, ink, 0.004);
      P.text(item.name.toUpperCase(), 0.5, 0.88, 0.026, o.plateInk || '#f0f0f0', { font: 'helv', weight: 800, maxW: 0.42 });
      P.text('EAU DE PARFUM', 0.5, 0.905, 0.011, o.plateInk || '#f0f0f0', { font: 'helv', track: 0.1 });
      P.text('100ML', 0.3, 0.955, 0.012, o.word || '#e6e6e6', { font: 'helv' }); P.text('3.4 Fl.oz', 0.7, 0.955, 0.012, o.word || '#e6e6e6', { font: 'helv' });
    } },
    cap: [{ s: 'cyl', r: 0.05, h: 0.075, color: '#d9b25e', metal: 1, rough: 0.22, coat: 0 }, { s: 'cyl', r: 0.03, h: 0.02, fin: 'silver' }, { s: 'cyl', r: 0.034, h: 0.045, color: '#d9b25e', metal: 1, rough: 0.22, coat: 0 }],
    extra: [(k) => {
      const gm = goldMat();
      const arm = box(0.12, 0.012, 0.012, 0.004, 0.71); arm.translate(0.09, 0, 0); k.part(arm, gm);
      k.part(cyl(0.004, 0.004, 0.05, 0.665, 6, 0.145, 0), gm);
      k.part(star8(0.045, 0.62, 0.145, 0, 0.012), gm);
    }],
    top: 0.66,
  });
  // Gold horse head with a flowing mane (Arabians Tonka).
  const horse = (P) => {
    const c = '#c9a050';
    P.path([[0.36, 0.8], [0.38, 0.62], [0.44, 0.5], [0.5, 0.44], [0.53, 0.4], [0.56, 0.43], [0.62, 0.5], [0.68, 0.58], [0.66, 0.62], [0.6, 0.6], [0.55, 0.58], [0.52, 0.66], [0.54, 0.8]], c);
    for (let i = 0; i < 12; i++) P.path([[0.46 - i * 0.008, 0.46 + i * 0.026], [0.3 - i * 0.01, 0.5 + i * 0.03], [0.4 - i * 0.005, 0.52 + i * 0.026]], i % 2 ? '#e8cc80' : '#a8803a');
    P.circle(0.56, 0.48, 0.006, '#141414');
  };

  /* ---------- Acqua di Parma: Art Deco Colonia and the blue Blu Mediterraneo ---------- */
  const ADP = [[0, 0], [0.198, 0], [0.204, 0.012], [0.232, 0.6], [0.23, 0.616], [0.21, 0.622], [0.09, 0.628], [0, 0.628]];
  const BLU = [[0, 0], [0.196, 0], [0.202, 0.012], [0.224, 0.58], [0.218, 0.598], [0.19, 0.61], [0.09, 0.616], [0, 0.616]];
  const crest = (P, x, y, s, c) => { P.ellipse(x, y, s * 0.6, s, 0, c); P.ellipse(x, y, s * 0.42, s * 0.75, 0, '#ffffff'); P.path([[x - s * 0.3, y - s * 0.5], [x + s * 0.3, y - s * 0.5], [x + s * 0.3, y + s * 0.2], [x, y + s * 0.55], [x - s * 0.3, y + s * 0.2]], c); P.rect(x - s * 0.5, y - s * 1.2, s, s * 0.35, c); };
  const colonia = (o) => (item) => Q({
    body: 'lathe', pts: ADP, w: 0.464, h: 0.628, d: 0.464, seg: 64, juice: o.juice, level: 0.9, inset: 0.94, jop: 0.88,
    art: { wrap: true, r: 0.232, arc: 1.4, h: 0.43, y: 0.32, draw: (P) => {
      P.rect(0, 0, 1, 1, o.labelBg || '#f7f6f1');
      lines(P, [['ACQUA', 0.13, 0.1, '#1a1a1a', { font: 'helv', weight: 500, track: 0.12 }], ['DI', 0.23, 0.06, '#1a1a1a', { font: 'helv', weight: 500, track: 0.12 }], ['PARMA', 0.33, 0.1, '#1a1a1a', { font: 'helv', weight: 500, track: 0.12 }],
        [o.sub, 0.47, 0.045, '#1a1a1a', { font: 'helv', track: 0.12 }], ['EAU DE COLOGNE', 0.9, 0.035, '#1a1a1a', { font: 'helv', track: 0.08 }]]);
      crest(P, 0.5, 0.68, 0.075, '#2a2a2a');
    } },
    cap: [{ s: 'cyl', r: 0.08, h: 0.02, glass: '#ffffff', op: 0.4 }, Object.assign({ s: 'cyl', r: 0.128, rb: 0.104, h: 0.2, seg: 48 }, o.cap), Object.assign({ s: 'cyl', r: 0.1, rb: 0.128, h: 0.012 }, o.cap)],
  });
  const blu = (o) => (item) => Q({
    body: 'lathe', pts: BLU, w: 0.448, h: 0.616, d: 0.448, seg: 64, solid: '#ffffff', grad: ['#0a34a2', '#1c62d6'], gc: 0.9, rough: 0.08, coat: 0.6, env: 1.1,
    art: { wrap: true, r: 0.226, arc: 1.38, h: 0.43, y: 0.31, draw: (P) => {
      P.rect(0, 0, 1, 1, '#f8f8f6');
      const b = '#1d3f9a';
      lines(P, [['ACQUA', 0.12, 0.1, b, { font: 'helv', weight: 500, track: 0.12 }], ['DI', 0.21, 0.06, b, { font: 'helv', weight: 500 }], ['PARMA', 0.3, 0.1, b, { font: 'helv', weight: 500, track: 0.12 }],
        ['Blu Mediterraneo', 0.43, 0.085, b, { font: 'serif', italic: true }]]);
      crest(P, 0.5, 0.6, 0.06, b);
      const [a, c] = o.title; P.text(a, 0.5, 0.79, 0.075, o.ink, { font: 'helv', weight: 500, maxW: 0.8 }); P.text(c, 0.5, 0.88, 0.075, o.ink, { font: 'helv', weight: 500, maxW: 0.8 });
    } },
    cap: [{ s: 'cyl', r: 0.07, h: 0.02, color: '#1a4fc8', rough: 0.1 }, { s: 'cyl', r: 0.128, rb: 0.112, h: 0.21, color: '#1b4fd2', rough: 0.08, coat: 1, seg: 56 }],
  });

  /* ---------- Penhaligon's: apothecary bottle with a ribbon bow and glass ball stopper ---------- */
  const PH = [[0, 0], [0.145, 0], [0.153, 0.012], [0.175, 0.52], [0.172, 0.54], [0.158, 0.565], [0.125, 0.588], [0.075, 0.602], [0.05, 0.606], [0, 0.606]];
  function bow(k, y, color, knot) {
    const m = solid({ color, rough: 0.6, coat: 0.1 });
    for (const sx of [-1, 1]) {
      const w = box(0.16, 0.035, 0.1, 0.012, -0.05); w.rotateZ(sx * 0.2); w.translate(sx * 0.095, y, 0.055); k.part(w, m);
      const tail = box(0.05, 0.03, 0.08, 0.008, -0.08); tail.rotateZ(-sx * 0.35); tail.translate(sx * 0.03, y - 0.03, 0.06); k.part(tail, m);
    }
    k.part(box(0.055, 0.04, 0.075, 0.01, y - 0.0375).translate(0, 0, 0.065), solid({ color: knot || color, rough: 0.6, coat: 0.1 }));
  }
  const penhaligon = (o) => (item) => {
    const k = kit();
    const geo = lathe(PH, 0, 1, 56);
    k.glassBody(geo, glass({ tint: o.frost || '#ffffff', op: o.frost ? 0.75 : 0.16 }), null);
    if (o.juice) { const jg = geo.clone(); jg.scale(0.93, 0.86, 0.93); jg.translate(0, 0.02, 0); k.part(jg, unlit(o.juice, o.jop || 0.8), 1); }
    k.wrap(0.178, 0.3, 0.27, 1.5, paint(1.5 * 0.178, 0.3, o.label), {});
    k.part(cyl(0.062, 0.062, 0.06, 0.6, 32), goldMat());
    bow(k, 0.72, o.bow, o.knot);
    k.part(cyl(0.035, 0.045, 0.1, 0.66, 24), glass({ op: 0.4 }));
    k.part(cyl(0.05, 0.03, 0.02, 0.76, 24), glass({ op: 0.45 }));
    k.part(sphere(0.066, 0.845), glass({ tint: o.stopper || '#ffffff', op: 0.6, env: 3.4 }));
    k.top(0.6);
    return k.done();
  };
  // Shield labels.
  const shield = (bg, rim, draw) => (P) => {
    P.path([[0.12, 0.02], [0.88, 0.02], [0.88, 0.62], [0.5, 0.98], [0.12, 0.62]], rim);
    P.path([[0.14, 0.04], [0.86, 0.04], [0.86, 0.61], [0.5, 0.95], [0.14, 0.61]], bg);
    draw(P);
  };
  const crowns = (P, c, y = 0.13) => { for (const x of [0.33, 0.67]) { P.path([[x - 0.06, y + 0.04], [x - 0.06, y - 0.02], [x - 0.03, y + 0.01], [x, y - 0.04], [x + 0.03, y + 0.01], [x + 0.06, y - 0.02], [x + 0.06, y + 0.04]], c); P.circle(x, y + 0.08, 0.035, c); } };
  const halfetiLabel = shield('#151515', '#c9a45a', (P) => { crowns(P, '#c9a45a'); lines(P, [["PENHALIGON'S", 0.37, 0.075, '#e8dcc0', { font: 'roman', weight: 600 }], ['EST. LONDON 1870', 0.45, 0.03, '#c9a45a', { font: 'roman' }], ['HALFETI', 0.58, 0.12, '#c8202a', { font: 'roman', weight: 700 }], ['EAU DE PARFUM', 0.69, 0.035, '#e8dcc0', { font: 'roman', track: 0.1 }]]); P.circle(0.5, 0.85, 0.04, '#9a1520'); });
  const endymionLabel = (P) => {
    P.path([[0.3, 0.06], [0.7, 0.06], [0.82, 0.3], [0.82, 0.8], [0.5, 0.96], [0.18, 0.8], [0.18, 0.3]], '#1e2a5a');
    P.path([[0.32, 0.09], [0.68, 0.09], [0.79, 0.31], [0.79, 0.79], [0.5, 0.93], [0.21, 0.79], [0.21, 0.31]], '#f6f6f2');
    P.circle(0.5, 0.2, 0.07, '#1e2a5a');
    lines(P, [["PENHALIGON'S", 0.38, 0.05, '#1e2a5a', { font: 'roman', weight: 600 }], ['ENDYMION', 0.52, 0.08, '#1e2a5a', { font: 'roman', weight: 700 }], ['COLOGNE', 0.62, 0.04, '#1e2a5a', { font: 'roman', track: 0.15 }], ['EST. 1870', 0.76, 0.03, '#1e2a5a', { font: 'roman' }]]);
  };
  const babylonLabel = (P) => {
    P.rect(0.05, 0.02, 0.9, 0.96, '#2c5a3a'); P.rect(0.09, 0.06, 0.82, 0.88, '#b0202a');
    for (let i = 0; i < 40; i++) P.circle(0.12 + rnd(i) * 0.76, 0.1 + rnd(i + 40) * 0.8, 0.012, i % 2 ? '#e8c060' : '#1c4a8a');
    P.rect(0.16, 0.35, 0.68, 0.3, '#f0e2b8'); P.frame(0.17, 0.36, 0.66, 0.28, '#b0202a', 0.006);
    lines(P, [["PENHALIGON'S", 0.43, 0.06, '#7a1018', { font: 'roman', weight: 700 }], ['BABYLON', 0.55, 0.09, '#b0202a', { font: 'roman', weight: 700 }]]);
  };
  const juniperLabel = (P) => {
    crowns(P, '#b8bcc2', 0.12);
    lines(P, [["PENHALIGON'S", 0.34, 0.08, '#2a2a2e', { font: 'roman', weight: 700 }], ['JUNIPER', 0.5, 0.13, '#3a3c40', { font: 'helv', weight: 700 }], ['SLING', 0.64, 0.12, '#3a3c40', { font: 'helv', weight: 700 }], ['EAU DE TOILETTE', 0.78, 0.035, '#6a6c70', { font: 'roman', track: 0.1 }]]);
  };
  const sartorialLabel = (P) => {
    P.rect(0.1, 0.04, 0.8, 0.92, '#1a1a1a'); P.frame(0.13, 0.07, 0.74, 0.86, '#c9a45a', 0.008);
    crowns(P, '#c9a45a', 0.14);
    lines(P, [['SARTORIAL', 0.4, 0.1, '#c9a45a', { font: 'roman', weight: 700 }], ['EAU DE TOILETTE', 0.5, 0.035, '#c9a45a', { font: 'roman', track: 0.1 }], ["PENHALIGON'S", 0.64, 0.07, '#e8dcc0', { font: 'roman' }], ['LONDON', 0.72, 0.035, '#c9a45a', { font: 'roman', track: 0.2 }], ['1870', 0.82, 0.04, '#c9a45a', { font: 'roman' }]]);
  };
  // Portraits: The Tragedy of Lord George — smoked olive glass under a gold stag's head.
  const lordGeorge = () => {
    const k = kit(), t = T();
    const pts = [[0, 0], [0.112, 0], [0.12, 0.012], [0.134, 0.4], [0.13, 0.425], [0.11, 0.45], [0.078, 0.466], [0.062, 0.47], [0, 0.47]];
    const geo = lathe(pts, 0, 1, 56);
    k.glassBody(geo, glass({ op: 0.16 }), null);
    const jg = gradient(lathe([[0, 0], [0.112, 0], [0.12, 0.012], [0.124, 0.1], [0.127, 0.2], [0.13, 0.3], [0.134, 0.4], [0.13, 0.425], [0.11, 0.45], [0.078, 0.466], [0.062, 0.47], [0, 0.47]], 0, 1, 56), '#aeaa7c', '#262008', 0.35); jg.scale(0.97, 0.95, 0.97); jg.translate(0, 0.01, 0);
    k.part(jg, new t.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.88, depthWrite: false }), 1);
    k.flat(0.13, 0.24, 0, 0.22, 0.128, paint(0.13, 0.24, (P) => {
      P.rect(0, 0, 1, 1, '#f7f5ef'); P.frame(0.06, 0.04, 0.88, 0.92, '#2a2a2a', 0.006);
      lines(P, [['PORTRAITS', 0.1, 0.055, '#2a2a2a', { font: 'roman' }], ["PENHALIGON'S", 0.16, 0.06, '#2a2a2a', { font: 'roman', weight: 700 }], ['THE TRAGEDY OF', 0.86, 0.04, '#2a2a2a', { font: 'helv', weight: 700 }], ['LORD GEORGE', 0.92, 0.055, '#2a2a2a', { font: 'helv', weight: 700 }]]);
    }));
    const gm = solid({ color: '#d8b56a', metal: 1, rough: 0.2, coat: 0, env: 2.6 });
    k.part(cyl(0.07, 0.07, 0.05, 0.47, 32), gm);
    // neck, head and muzzle
    const neck = cyl(0.055, 0.075, 0.18, 0, 24); neck.rotateZ(-0.12); neck.translate(0, 0.52, 0); k.part(neck, gm);
    const head = sphere(0.078, 0.0, 1, 1.05, 0.95); head.translate(0.025, 0.74, 0); k.part(head, gm);
    const muz = cyl(0.032, 0.058, 0.13, -0.065, 20); muz.rotateZ(-1.15); muz.rotateY(-0.5); muz.translate(0.1, 0.71, 0.03); k.part(muz, gm);
    for (const sx of [-1, 1]) {
      const ear = sphere(0.035, 0, 0.5, 1.2, 0.3); ear.rotateZ(sx * 1.0); ear.translate(sx * 0.07, 0.77, 0); k.part(ear, gm);
      const V = t.Vector3;
      const beam = new t.CatmullRomCurve3([new V(sx * 0.03, 0.78, 0), new V(sx * 0.07, 0.85, -0.01), new V(sx * 0.1, 0.94, 0), new V(sx * 0.11, 1.02, 0.02)]);
      k.part(new t.TubeGeometry(beam, 20, 0.011, 8), gm);
      for (const [a, b, c] of [[0.86, 0.15, 0.9], [0.92, 0.16, 0.99], [0.97, 0.07, 1.06], [0.83, 0.02, 0.9]]) {
        const f = beam.getPoint((a - 0.78) / 0.24);
        const tine = new t.CatmullRomCurve3([f, new V(f.x + sx * (b - Math.abs(f.x)) * 0.6, (f.y + c) / 2, 0.01), new V(sx * b, c, 0.02)]);
        k.part(new t.TubeGeometry(tine, 10, 0.007, 6), gm);
      }
    }
    k.top(0.47);
    return k.done();
  };

  /* ---------- Ex Nihilo: heavy block, gold chevron-cut cap ---------- */
  const exNihilo = (o) => (item) => Q(Object.assign({ w: 0.35, h: 0.61, d: 0.2, r: 0.015 }, o.body, {
    art: [{ w: o.fullArt ? 0.35 : 0.3, h: o.fullArt ? 0.61 : 0.5, y: o.fullArt ? 0.305 : 0.33, draw: (P) => {
      if (o.draw) o.draw(P);
      const ink = o.ink || '#9a9a9a';
      P.frame(0.18, 0.16, 0.64, 0.08, ink, 0.006); P.text('EX NIHILO', 0.5, 0.2, 0.055, ink, { font: 'roman', weight: 600, track: 0.05, maxW: 0.6 });
      P.text('PARIS', 0.5, 0.28, 0.024, ink, { font: 'roman', weight: 600, track: 0.2 });
      const t = item.name.toUpperCase().split(' '), mid = Math.ceil(t.length / 2);
      if (o.plate) { P.rect(0.22, 0.4, 0.56, 0.2, o.plate); P.frame(0.24, 0.41, 0.52, 0.18, ink, 0.003); }
      P.text(t.slice(0, mid).join(' '), 0.5, 0.455, 0.055, o.tink || ink, { font: 'helv', weight: 600, track: 0.06, maxW: 0.52 });
      P.text(t.slice(mid).join(' '), 0.5, 0.52, 0.055, o.tink || ink, { font: 'helv', weight: 600, track: 0.06, maxW: 0.52 });
      P.text('EAU DE PARFUM', 0.5, 0.575, 0.02, o.tink || ink, { font: 'helv', weight: 600, track: 0.15 });
    } }, { w: 0.2, h: 0.17, y: 0.61 + 0.06 + 0.09, z: 0.081, draw: (P) => {
      P.rect(0, 0, 1, 1, '#d9b56c');
      for (let r = 0; r < 6; r++) for (let i = 0; i < 6; i++) { const x = i / 5, y = 0.08 + r * 0.16; P.path([[x - 0.1, y], [x, y + 0.08], [x + 0.1, y]], 'rgba(120,88,36,0.55)', false, 0.02); }
    } }],
    cap: [{ s: 'cyl', r: 0.085, h: 0.06, color: '#d9b56c', metal: 1, rough: 0.22, coat: 0 }, { s: 'box', w: 0.2, d: 0.16, h: 0.18, rr: 0.01, color: '#d9b56c', metal: 1, rough: 0.28, coat: 0 }],
  }));

  /* ---------- Tiziana Terenzi: squat drum with a huge cap ---------- */
  const tt = (o) => (item) => Q({
    body: 'cyl', w: 0.51, h: 0.47, d: 0.51, seg: 64,
    solid: o.gold ? '#d8b56a' : '#f2f1ee', metal: o.gold ? 1 : 0, rough: o.gold ? 0.18 : 0.55, coat: o.gold ? 0 : 0.2, env: o.gold ? 2.4 : 1,
    art: [{ wrap: true, r: 0.258, arc: 1.4, h: 0.16, y: 0.25, draw: (P) => {
      P.rect(0, 0, 1, 1, o.gold ? '#141414' : '#f6f2ea'); if (!o.gold) P.frame(0.02, 0.04, 0.96, 0.92, '#e2d6bc', 0.02);
      P.text(o.title || item.name, 0.5, 0.4, 0.36, '#b8873a', { font: 'sans', weight: 600 });
      P.text('Tiziana Terenzi', 0.5, 0.76, 0.22, '#b8873a', { font: 'serif', italic: true, weight: 600 });
    } }],
    cap: [{ s: 'cyl', r: 0.116, h: 0.05, color: '#d8b56a', metal: 1, rough: 0.2, coat: 0 },
      o.gold ? { s: 'cyl', r: 0.258, h: 0.32, color: '#1a1716', rough: 0.55, coat: 0.2, seg: 64 } : { s: 'cyl', r: 0.258, h: 0.32, color: '#e8cc98', metal: 0.85, rough: 0.3, coat: 0.3, seg: 64 }],
    extra: [(k) => {
      if (o.gold) return;
      const lid = new (T().CircleGeometry)(0.25, 48); lid.rotateX(-Math.PI / 2); lid.translate(0, 0.842, 0);
      k.part(lid, new (T().MeshStandardMaterial)({ map: paint(0.5, 0.5, (P) => {
        P.circle(0.5, 0.5, 0.5, '#efe9df');
        for (let i = 0; i < 4; i++) P.circle(0.5, 0.5, 0.45 - i * 0.1, '#c9a35c', 0.006);
        for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; P.line(0.5 + Math.cos(a) * 0.15, 0.5 + Math.sin(a) * 0.15, 0.5 + Math.cos(a) * 0.45, 0.5 + Math.sin(a) * 0.45, 'rgba(201,163,92,0.6)', 0.004); }
      }), roughness: 0.5, metalness: 0.2 }));
    }],
    top: 0.47,
  });

  /* ---------- BDK: clear block, side-wrapped white label, black arched cap ---------- */
  const archCap = (k, y, w, h, d, mat) => {
    const r = w / 2, pts = [[-r, 0], [r, 0], [r, h * 0.55], [r * 0.82, h * 0.86], [r * 0.45, h], [-r * 0.45, h], [-r * 0.82, h * 0.86], [-r, h * 0.55]];
    const g = profile(pts, d, 0.05); g.translate(0, y, 0); k.part(g, mat);
  };
  const bdk = (o) => (item) => Q(Object.assign({ w: 0.34, h: 0.59, d: 0.22, r: 0.012 }, o.solid ? { solid: '#ffffff', grad: o.solid, rough: 0.1, coat: 1, env: 1.2 } : { juice: o.juice, level: 0.92, inset: 0.94, jop: o.jop || 0.8 }, {
    art: { w: 0.18, h: 0.25, x: 0.08, y: 0.32, draw: (P) => {
      P.rect(0, 0, 1, 1, '#fbfbf9');
      const t = item.name.toUpperCase().split(' '), mid = Math.ceil(t.length / 2);
      if (t.length === 3) P.text(t.join(' '), 0.45, 0.42, 0.085, '#1a1a1a', { font: 'helv', weight: 700, maxW: 0.8 });
      else { P.text(t[0], 0.45, 0.36, 0.1, '#1a1a1a', { font: 'helv', weight: 700, maxW: 0.8 }); P.text(t.slice(1).join(' '), 0.45, 0.47, 0.1, '#1a1a1a', { font: 'helv', weight: 700, maxW: 0.8 }); }
      P.text('EAU DE PARFUM', 0.45, 0.6, 0.045, '#1a1a1a', { font: 'helv', weight: 600 }); P.text('100 ml · 3.4 fl. oz.', 0.45, 0.66, 0.035, '#1a1a1a', { font: 'helv' });
    } },
    cap: [{ s: 'cyl', r: 0.07, h: 0.04, glass: '#ffffff', op: 0.3 }],
    extra: [(k) => archCap(k, 0.63, 0.29, 0.22, 0.22, solid({ color: '#0d0d0d', rough: 0.14 })),
      (k) => { const side = paint(0.08, 0.25, (P) => P.rect(0, 0, 1, 1, '#fbfbf9')); const p = new (T().PlaneGeometry)(0.08, 0.25); p.rotateY(Math.PI / 2); p.translate(0.173, 0.32, 0.07); k.part(p, new (T().MeshStandardMaterial)({ map: side, roughness: 0.5 }), 4); }],
    top: 0.63,
  }));

  /* ---------- Bond No. 9: the five-point star bottle ---------- */
  const BOND_R = [[0.305, 0], [0.29, 0.06], [0.262, 0.14], [0.232, 0.225], [0.224, 0.27], [0.232, 0.33], [0.258, 0.41], [0.29, 0.485], [0.305, 0.52], [0.298, 0.54], [0.2, 0.554], [0.12, 0.575], [0.08, 0.6]];
  const BOND = [...BOND_R.map(([x, y]) => [x, y]), ...BOND_R.slice().reverse().map(([x, y]) => [-x, y])];
  function bondClip(P) {
    const g = P.g; g.beginPath();
    BOND.forEach(([x, y], i) => { const px = (x / 0.62 + 0.5) * P.W, py = (1 - y / 0.6) * P.H; i ? g.lineTo(px, py) : g.moveTo(px, py); });
    g.closePath(); g.clip();
  }
  const medallion = (P, x, y, r, ring, bg, ink, name) => {
    P.circle(x, y, r, ring); P.circle(x, y, r * 0.93, bg); P.circle(x, y, r * 0.88, ink, 0.006); P.circle(x, y, r * 0.55, ink, 0.006);
    ringText(P, `${name} • BOND NO.9 • `, x, y, r * 0.72 * P.H / P.W, r * 0.72, r * 0.22, ink, -Math.PI * 0.95);
    P.text('NYC', x, y, r * 0.42, ink, { font: 'helv', weight: 800 });
  };
  const bond = (o) => (item) => {
    const k = kit();
    const geo = profile(BOND, 0.17, 0.035);
    k.solidBody(geo, solid({ color: o.body, rough: 0.12, coat: 1, env: 1.2 }));
    k.flat(0.62, 0.6, 0, 0.3, 0.086, paint(0.62, 0.6, (P) => {
      P.g.save(); bondClip(P); o.draw(P); P.g.restore();
    }));
    k.part(cyl(0.065, 0.075, 0.04, 0.6, 32), glass({ tint: o.body, op: 0.7 }));
    k.part(cyl(0.045, 0.045, 0.06, 0.64, 24), goldMat());
    const capMat = solid({ color: o.cap || o.body, rough: 0.12, coat: 1 });
    const stem = profile([[-0.07, 0], [0.07, 0], [0.11, 0.03], [0.17, 0.04], [0.17, 0.085], [-0.17, 0.085], [-0.17, 0.04], [-0.11, 0.03]], 0.1, 0.012);
    stem.translate(0, 0.7, 0); k.part(stem, capMat);
    k.top(0.65);
    return k.done();
  };
  const sunburst = (P) => {
    P.rect(0, 0, 1, 1, '#2ab07a');
    for (let i = 0; i < 48; i++) { const a = i * Math.PI / 24; P.path([[0.5, 0.52], [0.5 + Math.cos(a) * 0.9, 0.52 + Math.sin(a) * 0.9], [0.5 + Math.cos(a + 0.07) * 0.9, 0.52 + Math.sin(a + 0.07) * 0.9]], i % 3 === 0 ? '#7a3aa0' : i % 3 === 1 ? '#c8e050' : '#5a8a3a'); }
    P.g.save(); P.g.globalCompositeOperation = 'destination-out'; P.path([[0, 0], [1, 0], [1, 0.12], [0, 0.12]], '#000'); P.g.restore();
    P.rect(0, 0, 1, 0.1, '#2ab07a');
    medallion(P, 0.5, 0.52, 0.16, '#d8b45e', '#6a2a9a', '#e8d070', 'BLEECKER ST.');
  };
  const greenwich = (P) => { P.rect(0, 0, 1, 1, '#06625c'); medallion(P, 0.5, 0.56, 0.2, '#d8b45e', '#06625c', '#e6c45a', 'GREENWICH VILLAGE'); };
  const skyline = (P) => {
    const g = P.g.createLinearGradient(0, 0, 0, P.H); g.addColorStop(0, '#1438a8'); g.addColorStop(1, '#2a5ae0'); P.g.fillStyle = g; P.g.fillRect(0, 0, P.W, P.H);
    const cols = ['#e83a3a', '#f0c030', '#30b0e0', '#40c060', '#a050d0', '#f07020', '#e8e8e8'];
    for (let i = 0; i < 14; i++) { const x = 0.12 + i * 0.055, h = 0.25 + rnd(i) * 0.45; for (let j = 0; j < 12; j++) { const y = 1 - (j + 1) * 0.045; if (1 - y > h) break; P.rect(x, y, 0.045, 0.038, cols[(i * 3 + j) % cols.length]); } }
    medallion(P, 0.74, 0.8, 0.09, '#d8b45e', '#1438a8', '#f0f0f0', 'NEW YORK NIGHTS');
  };
  const tokens = (P) => { P.rect(0, 0, 1, 1, '#0b0b0b'); for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) { const x = 0.06 + c * 0.11 + (r % 2) * 0.055, y = 0.1 + r * 0.1; P.circle(x, y, 0.042, '#c9a04a', 0.008); P.text('NYC', x, y, 0.025, '#d8b45e', { font: 'helv', weight: 800 }); } };

  /* ---------- Jo Malone: tall square bottle, silver mushroom cap ---------- */
  const JM_CAP = [[0, 0], [0.1, 0], [0.106, 0.02], [0.118, 0.07], [0.12, 0.095], [0.108, 0.125], [0.075, 0.145], [0, 0.152]];
  const joMalone = (o) => (item) => {
    const t = o.title.split('\n');
    const sp = { w: 0.36, h: 0.67, d: 0.24, r: 0.012 };
    if (o.intense) Object.assign(sp, { solid: o.intense === true ? '#2d211b' : o.intense, rough: 0.12, coat: 1, env: 1.1 });
    else Object.assign(sp, { juice: o.juice, level: 0.9, inset: 0.94, jop: o.jop || 0.75 });
    sp.art = o.intense ? { w: 0.3, h: 0.6, y: 0.33, draw: (P) => {
      const c = '#d8c9b2';
      lines(P, [['JO MALONE', 0.4, 0.055, c, { font: 'roman', weight: 600, track: 0.22, maxW: 0.8 }], ['LONDON', 0.455, 0.026, c, { font: 'roman', weight: 600, track: 0.3 }]]);
      t.forEach((s, i) => P.text(s, 0.5, 0.76 + i * 0.05, 0.04, c, { font: 'roman', weight: 600, track: 0.15, maxW: 0.76 }));
      P.text('COLOGNE INTENSE', 0.5, 0.77 + t.length * 0.05, 0.028, c, { font: 'roman', weight: 600, track: 0.15 });
    } } : { w: 0.27, h: 0.33, y: 0.4, draw: (P) => {
      P.rect(0, 0, 1, 1, '#f3efe4'); P.frame(0.04, 0.04, 0.92, 0.92, '#4a4a4a', 0.006);
      lines(P, [['JO MALONE', 0.17, 0.085, '#1a1a1a', { font: 'roman', weight: 600, track: 0.15, maxW: 0.84 }], ['LONDON', 0.25, 0.04, '#1a1a1a', { font: 'roman', weight: 600, track: 0.3 }]]);
      P.rect(0.43, 0.36, 0.14, 0.12, '#1a1a1a'); P.text('JM', 0.5, 0.42, 0.06, '#f3efe4', { font: 'serif', italic: true });
      t.forEach((s, i) => P.text(s, 0.5, 0.62 + i * 0.09, 0.075, '#1a1a1a', { font: 'roman', weight: 600, track: 0.1, maxW: 0.84 }));
      P.text('COLOGNE', 0.5, 0.64 + t.length * 0.09, 0.045, '#1a1a1a', { font: 'roman', weight: 600, track: 0.2 });
    } };
    sp.cap = [{ s: 'cyl', r: 0.088, h: 0.035, color: '#cfcbc4', metal: 1, rough: 0.2, coat: 0 }, { s: 'lathe', pts: JM_CAP, color: '#d9d5ce', metal: 1, rough: 0.16, coat: 0 }];
    return Q(sp);
  };

  BottleCraft.add({
    /* Le Labo */
    'lelabo|Santal 33': lelabo({ juice: '#e4e0b8', ml: '100ml 3,4' }),
    'lelabo|Another 13': lelabo({ juice: '#efeee8', jop: 0.5 }),
    'lelabo|Bergamote 22': lelabo({ juice: '#e8e2a8' }),
    'lelabo|Thé Noir 29': lelabo({ juice: '#efeee8', jop: 0.5 }),
    'lelabo|Rose 31': lelabo({ juice: '#ecdcc0', where: 'in Liberty', fresh: 'Fresh until: 21/03/2013' }),
    'lelabo|Oud 27': lelabo({ juice: '#c8901e', jop: 0.85, where: 'in Barneys NY', fresh: 'For:  Michelle' }),
    'lelabo|Patchouli 24': lelabo({ juice: '#ebe0a4', where: 'in Liberty' }),
    'lelabo|Vetiver 46': lelabo({ juice: '#ebe4b4' }),
    'lelabo|Lys 41': lelabo({ juice: '#ece4a8' }),
    'lelabo|Matcha 26': lelabo({ juice: '#efefe8', jop: 0.5, title: 'THÉ MATCHA 26' }),
    'lelabo|Tabac 28': lelabo({ juice: '#8a4a1c', jop: 0.9, where: 'in New York City' }),

    /* Diptyque */
    'diptyque|Tam Dao': diptyque({ juice: '#c6dcae', letters: ['TA M', 'DAO'], size: 0.2 }),
    'diptyque|Philosykos': diptyque({ juice: '#d0e2bc', letters: ['PHILOSYKOS'], size: 0.075, n: 50 }),
    'diptyque|Do Son': diptyque({ juice: '#d6e2c4', letters: ['DO', 'SON'], size: 0.2 }),
    'diptyque|Orphéon': diptyque({ juice: '#f2f2ee', jop: 0.5, bg: '#101010', hatch: 'rgba(240,240,240,0.35)', ink: '#f4f4f4', letters: ['OR', 'PHE', 'ON'], size: 0.17 }),
    'diptyque|Fleur de Peau': diptyque({ juice: '#f2f2ee', jop: 0.5, bg: '#1a1a1a', hatch: 'rgba(240,240,240,0.4)', ink: '#f4f4f4', letters: ['FLEUR', 'DE', 'PEAU'], size: 0.14 }),
    'diptyque|Oud Palao': diptyque({ juice: '#e2c86a', jop: 0.75, letters: ['OUD', 'PALAO'], size: 0.15, n: 110 }),
    'diptyque|Eau Duelle': diptyque({ juice: '#e8dc8a', jop: 0.85, letters: ['EAU', 'DUELLE'], size: 0.12, draw: (P) => { P.path([[0.15, 0.62], [0.35, 0.52], [0.55, 0.58], [0.85, 0.5], [0.85, 0.9], [0.15, 0.9]], 'rgba(20,20,20,0.35)'); } }),

    /* Frédéric Malle */
    'malle|Portrait of a Lady': malle({ juice: '#e8c232', nose: 'Dominique Ropion' }),
    'malle|Musc Ravageur': malle({ juice: '#e4ae18', nose: 'Maurice Roucel' }),
    'malle|Géranium pour Monsieur': malle({ juice: '#efebe2', jop: 0.55, nose: 'Dominique Ropion', title: 'GERANIUM\nPOUR MONSIEUR' }),
    'malle|French Lover': malle({ juice: '#eac636', nose: 'Pierre Bourdon' }),
    'malle|Vétiver Extraordinaire': malle({ juice: '#ecd03c', nose: 'Dominique Ropion', title: 'VETIVER\nEXTRAORDINAIRE' }),
    'malle|Carnal Flower': malle({ juice: '#e2b424', nose: 'Dominique Ropion' }),
    'malle|Monsieur.': malle({ juice: '#ecdc8c', nose: 'Bruno Jovanovic', title: 'MONSIEUR.' }),

    /* Serge Lutens */
    'lutens|Ambre Sultan': lutens({ juice: '#e4820c', nameFirst: true }),
    'lutens|Chergui': lutens({ juice: '#5e0a0c' }),
    'lutens|Daim Blond': lutens({ juice: '#7a5c1c', nameFirst: true, dark: true }),
    'lutens|La Fille de Berlin': lutens({ juice: '#c40f2c', title: 'La fille de Berlin' }),
    'lutens|Féminité du Bois': lutens({ juice: '#ead8e0', jop: 0.75, title: 'Féminité du bois' }),

    /* Memo Paris */
    'memo|African Leather': memo({ draw: leopard }),
    'memo|Irish Leather': memo({ draw: flora, glowIn: 'rgba(200,160,90,1)' }),
    'memo|Italian Leather': memo({ draw: tuscany, glowIn: 'rgba(190,160,110,1)', glowOut: 'rgba(84,70,48,1)' }),
    'memo|French Leather': memo({ draw: rose }),
    'memo|Marfa': memo({ draw: desert, glowIn: 'rgba(214,176,110,1)' }),
    'memo|Lalibela': memo({ body: '#1c1a1a', pw: 0.3, ph: 0.6, py: 0.33, draw: lalibela, cy: 2 }),
    'memo|Inlé': memo({ body: '#c09890', pw: 0.24, ph: 0.47, glowIn: 'rgba(232,206,198,1)', glowOut: 'rgba(214,186,178,1)', draw: inle }),

    /* Mancera */
    'mancera|Cedrat Boisé': mancera({ juice: '#ece6c8', title: 'CEDRAT\nBOISE' }),
    'mancera|Red Tobacco': mancera({ solid: ['#2a0204', '#760610'], gc: 0.8, ring: 'gold', ink: '#e8c060', logo: '#e8c060', tink: '#e01818', title: 'RED\nTOBACCO', emblem: (P) => { P.rect(0.32, 0.08, 0.36, 0.62, '#0c0c0c'); P.path([[0.5, 0.18], [0.58, 0.3], [0.5, 0.42], [0.42, 0.3]], '#d8a040'); } }),
    'mancera|Instant Crush': mancera({ solid: ['#a88a46', '#ead9a0'], metal: 0.85, rough: 0.2, cap: 'gold', ink: '#2a2214', logo: '#2a2214', tink: '#c02020', title: 'INSTANT\nCRUSH' }),
    'mancera|Roses Vanille': mancera({ juice: '#ead998', title: 'ROSES\nVANILLE' }),
    'mancera|Aoud Lemon Mint': mancera({ solid: ['#a8dcf4', '#0a3c96'], gc: 0.5, cap: 'gold', band: 'rgba(214,176,96,0.92)', ink: '#2a2214', logo: '#2a2214', title: 'AOUD\nLEMON MINT' }),
    'mancera|Hindu Kush': mancera({ juice: '#ece4c4', frame: true, title: 'HINDU KUSH', tsz: 0.05 }),

    /* Montale */
    'montale|Intense Café': montale({ grad: ['#4a0a3a', '#8a1a68'] }),
    'montale|Arabians Tonka': montale({ grad: ['#0a0a0a', '#1a1a1a'], metal: 0.3, draw: horse }),
    'montale|Black Aoud': montale({ grad: ['#080808', '#1a1a1a'], metal: 0.3 }),
    'montale|Starry Nights': montale({ grad: ['#f2648c', '#0a0a0a'], gc: 0.42, metal: 0.4 }),
    'montale|Chocolate Greedy': montale({ grad: ['#c8ccd0', '#e8ecf0'], metal: 0.9, rough: 0.25, word: '#1a1a1a', ink: '#8a6a2a' }),
    'montale|Aoud Forest': montale({ grad: ['#3a1a0c', '#7a4424'] }),

    /* Acqua di Parma */
    'adp|Colonia': colonia({ juice: '#dcdc6e', sub: 'COLONIA', cap: { color: '#142a1e', rough: 0.2, coat: 1 } }),
    'adp|Colonia Intensa': colonia({ juice: '#d4ac3e', sub: 'COLONIA INTENSA', labelBg: '#d9bfae', cap: { color: '#b98a6c', metal: 1, rough: 0.3, coat: 0 } }),
    'adp|Fico di Amalfi': blu({ title: ['FICO', 'di AMALFI'], ink: '#d02a3a' }),
    'adp|Arancia di Capri': blu({ title: ['ARANCIA', 'di CAPRI'], ink: '#e2601a' }),
    'adp|Mirto di Panarea': blu({ title: ['MIRTO', 'di PANAREA'], ink: '#7a1a3a' }),

    /* Penhaligon's */
    'penhaligons|Halfeti': penhaligon({ juice: '#ecebd8', jop: 0.8, bow: '#9cc49a', label: halfetiLabel }),
    'penhaligons|The Tragedy of Lord George': lordGeorge,
    'penhaligons|Endymion': penhaligon({ juice: '#f2f2ee', jop: 0.5, bow: '#1a2450', label: endymionLabel }),
    'penhaligons|Babylon': penhaligon({ juice: '#e6b45a', jop: 0.85, bow: '#2a6a3a', knot: '#b0202a', label: babylonLabel }),
    'penhaligons|Juniper Sling': penhaligon({ frost: '#eef0f2', bow: '#c8ccd2', label: juniperLabel }),
    'penhaligons|Sartorial': penhaligon({ juice: '#e8c838', jop: 0.85, bow: '#6a6a6e', label: sartorialLabel }),

    /* Ex Nihilo */
    'exnihilo|Fleur Narcotique': exNihilo({ body: { juice: '#f2f0ea', jop: 0.5, level: 0.92, inset: 0.92 }, plate: '#fbfbf9', tink: '#5a5a5a' }),
    'exnihilo|Blue Talisman': exNihilo({ body: { solid: '#16307e', rough: 0.1, coat: 0.8, env: 1.1 }, fullArt: true, ink: '#e8eef8', draw: (P) => { const g = P.g.createLinearGradient(0, 0, 0, P.H); g.addColorStop(0, 'rgba(20,46,126,0)'); g.addColorStop(0.55, 'rgba(60,100,180,0.4)'); g.addColorStop(1, 'rgba(220,232,246,1)'); P.g.fillStyle = g; P.g.fillRect(0, 0, P.W, P.H); for (const [a, b, c, d] of [[0.15, 0.35, 0.3, 0.12], [0.62, 0.62, 0.95, 0.4], [0.7, 0.75, 0.7, 0.95], [0.1, 0.8, 0.45, 0.7]]) P.line(a, b, c, d, 'rgba(230,238,250,0.8)', 0.004); } }),
    'exnihilo|Lust in Paradise': exNihilo({ body: { juice: '#f2ae9e', jop: 0.88, level: 0.92, inset: 0.92 }, ink: '#c8a060', plate: 'rgba(250,236,230,0.7)' }),

    /* Tiziana Terenzi */
    'tt|Kirke': tt({ gold: true, title: 'Kirkè' }),
    'tt|Orion': tt({}),
    'tt|Andromeda': tt({}),
    'tt|Cassiopea': tt({}),

    /* BDK */
    'bdk|Gris Charnel': bdk({ juice: '#dcdcdc', jop: 0.5 }),
    'bdk|Rouge Smoking': bdk({ juice: '#c4140e', jop: 0.9 }),
    'bdk|Pas Ce Soir': bdk({ juice: '#dcd66a', jop: 0.85 }),

    /* Bond No. 9 */
    'bond|Bleecker Street': bond({ body: '#28b07c', cap: '#7a3aa8', draw: sunburst }),
    'bond|Greenwich Village': bond({ body: '#086a64', draw: greenwich }),
    'bond|New York Nights': bond({ body: '#1d48c0', cap: '#2a5ae0', draw: skyline }),
    'bond|Wall Street': bond({ body: '#0b0b0b', draw: tokens }),

    /* Jo Malone */
    'jomalone|Wood Sage & Sea Salt': joMalone({ juice: '#f1f1ea', jop: 0.5, title: 'WOOD SAGE\n& SEA SALT' }),
    'jomalone|English Pear & Freesia': joMalone({ juice: '#f1ecd6', jop: 0.55, title: 'ENGLISH PEAR\n& FREESIA' }),
    'jomalone|Oud & Bergamot': joMalone({ intense: true, title: 'OUD\n& BERGAMOT' }),
    'jomalone|Myrrh & Tonka': joMalone({ intense: true, title: 'MYRRH\n& TONKA' }),
    'jomalone|Velvet Rose & Oud': joMalone({ intense: '#2a1c26', title: 'VELVET ROSE\n& OUD' }),
    'jomalone|Lime Basil & Mandarin': joMalone({ juice: '#e4dc84', jop: 0.85, title: 'LIME BASIL\n& MANDARIN' }),
  });
})();
