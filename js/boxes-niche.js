/* Sillage — retail boxes for the niche houses: Tom Ford, Parfums de Marly, Byredo,
 * Maison Francis Kurkdjian, Clive Christian, Xerjoff, Baccarat, Kilian, Roja,
 * Amouage, Initio and Nishane. Positions follow the notes taken from photos of
 * the real boxes: y from the top of the face, cap heights as a fraction of H.
 */
(() => {
  const { prop, tx, rnd, stipple, brushed, pinstripe, waves, fullBg, seal } = BoxCraft.lib;

  /* ---------- shared drawing helpers ---------- */
  const ax = (P) => P.H / P.W; // converts a height-unit length to width units
  // Diagonal cross-hatch emboss (Tom Ford lids, Kilian weave).
  function hatch(P, col, n = 90, lw = 0.0009) { const a = ax(P); for (let i = -n; i <= 2 * n; i++) { P.line(i / n, 0, i / n + a, 1, col, lw); P.line(i / n, 0, i / n - a, 1, col, lw); } }
  function weave(P, col, n = 140) { for (let i = 0; i < n; i++) { P.line(0, i / n, 1, i / n, col, 0.0008); P.line(i / n, 0, i / n, 1, col, 0.0008 * ax(P)); } }
  // Text rotated to read bottom-to-top, centred on (x, y).
  function vtx(P, s, x, y, cap, col, font, o = {}) {
    const g = P.g; g.save(); g.translate(x * P.W, y * P.H); g.rotate(-Math.PI / 2); g.translate(-x * P.W, -y * P.H);
    tx(P, s, y, cap, col, font, Object.assign({ x }, o)); g.restore();
  }
  // Outlined (inline) display caps.
  function otext(P, s, y, size, col, lw, track = 0.12) {
    const g = P.g, px = size * P.H; g.save(); g.font = `500 ${px}px Jost, Futura, "Century Gothic", sans-serif`;
    const ws = [...s].map((c) => g.measureText(c).width), tw = ws.reduce((a, b) => a + b, 0) + track * px * (s.length - 1);
    let x = P.W / 2 - tw / 2; g.strokeStyle = col; g.lineWidth = lw * P.H; g.textBaseline = 'middle';
    [...s].forEach((c, i) => { g.strokeText(c, x, y * P.H); x += ws[i] + track * px; }); g.restore();
  }
  // Irregular paint blob (radius r in height units; sx/sy stretch).
  function blob(P, x, y, r, col, seed = 1, sx = 1, sy = 1) {
    const a = ax(P), pts = [];
    for (let i = 0; i < 28; i++) { const t = (i / 28) * Math.PI * 2, k = 1 + 0.22 * Math.sin(3 * t + seed) + 0.14 * Math.sin(5 * t + seed * 2.3) + 0.08 * Math.sin(9 * t + seed * 4.1); pts.push([x + Math.cos(t) * r * k * a * sx, y + Math.sin(t) * r * k * sy]); }
    P.path(pts, col);
  }
  // A slightly bowed brush stroke.
  function stroke(P, x1, y1, x2, y2, col, w, bow = 0.04) {
    const g = P.g; g.save(); g.strokeStyle = col; g.lineWidth = w * P.H; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1 * P.W, y1 * P.H);
    g.quadraticCurveTo(((x1 + x2) / 2 + bow) * P.W, ((y1 + y2) / 2 - bow) * P.H, x2 * P.W, y2 * P.H); g.stroke(); g.restore();
  }
  const diamond = (P, x, y, hw, hh, col, lw) => P.path([[x, y - hh], [x + hw, y], [x, y + hh], [x - hw, y]], col, !lw, lw);
  function crown(P, x, y, s, col) {
    const a = ax(P) * s;
    P.path([[x - 0.9 * a, y], [x - a, y - 0.7 * s], [x - 0.5 * a, y - 0.35 * s], [x, y - 0.9 * s], [x + 0.5 * a, y - 0.35 * s], [x + a, y - 0.7 * s], [x + 0.9 * a, y]], col);
    [-1, 0, 1].forEach((k) => P.circle(x + k * a * (k ? 1 : 0), y - (k ? 0.78 : 1.0) * s, 0.12 * s, col));
  }
  // Rearing horse facing right inside the box (x0, y0, w, h); flip mirrors it.
  const HORSE = [[0.62, 0.02], [0.74, 0], [0.9, 0.1], [0.98, 0.2], [0.92, 0.24], [0.8, 0.2], [0.74, 0.3], [0.82, 0.36], [0.98, 0.44], [0.96, 0.5], [0.84, 0.46], [0.86, 0.56], [0.8, 0.58], [0.7, 0.46], [0.62, 0.56], [0.5, 0.64], [0.52, 0.82], [0.64, 0.96], [0.56, 1], [0.42, 0.84], [0.38, 0.72], [0.3, 0.8], [0.34, 0.96], [0.26, 0.98], [0.2, 0.78], [0.24, 0.66], [0.12, 0.7], [0.02, 0.86], [0.04, 0.7], [0.18, 0.56], [0.32, 0.48], [0.46, 0.3], [0.56, 0.1]];
  const horse = (P, x0, y0, w, h, col, flip) => P.path(HORSE.map(([px, py]) => [x0 + w * (flip ? 1 - px : px), y0 + h * py]), col);

  /* ---------- Tom Ford ---------- */
  const tfLines = (n) => { const w = n.toUpperCase().split(' '); return w.length < 2 ? [w[0]] : [w[0], w.slice(1).join(' ')]; };
  // Private Blend: textured lid over a short base band, label plate low on the front.
  const tfPB = (o) => (item, fit) => Object.assign(prop(fit, 0.55, 0.36), {
    lid: 0.87, paper: { color: o.lid, rough: o.metal ? 0.35 : 0.7, metal: o.metal || 0 }, lining: o.collar || '#c9ccd0',
    front: (P) => {
      fullBg(P, o.lid); hatch(P, o.grain || 'rgba(255,255,255,0.05)');
      P.rect(0, 0.868, 1, 0.012, o.collar || '#c9ccd0');
      P.rect(0.28, 0.575, 0.44, 0.235, o.plate); if (o.plateEdge) P.frame(0.285, 0.58, 0.43, 0.225, o.plateEdge, 0.002);
      const L = o.lines || tfLines(item.name), ink = o.ink;
      tx(P, 'TOM FORD', 0.613, 0.019, ink, 'helv', { weight: 500, maxW: 0.38 });
      L.forEach((l, i) => tx(P, l, (L.length > 1 ? 0.655 : 0.67) + i * 0.031, 0.02, ink, 'helv', { weight: 700, maxW: 0.38 }));
      tx(P, 'EAU DE PARFUM', 0.735, 0.013, ink, 'helv', { maxW: 0.38 }); tx(P, '100 ML', 0.76, 0.013, ink, 'helv');
      const b = o.band || o.plate;
      tx(P, 'EAU DE PARFUM', 0.905, 0.0105, b, 'helv'); tx(P, 'VAPORISATEUR SPRAY', 0.93, 0.0105, b, 'helv'); tx(P, '3.4 FL. OZ./OZ. LIQ./100 ml ℮', 0.958, 0.0105, b, 'helv', { maxW: 0.7 });
    },
    top: (P) => { fullBg(P, o.lid); hatch(P, o.grain || 'rgba(255,255,255,0.05)', 40); tx(P, 'TOM FORD', 0.5, 0.07, o.topInk || 'rgba(255,255,255,0.35)', 'helv'); },
  });
  // Signature line: a plain carton with a small plate in the lower half.
  const tfSig = (o) => (item, fit) => Object.assign(prop(fit, 0.6, 0.4), {
    open: 'flap', paper: { color: o.paper, rough: o.metal ? 0.3 : 0.6, metal: o.metal || 0 },
    front: (P) => {
      fullBg(P, o.paper);
      if (o.tex === 'stripe') { for (let i = 0; i < 80; i++) P.rect(i / 80, 0, 0.5 / 80, 1, '#1a1712'); }
      if (o.tex === 'rhomb') hatch(P, 'rgba(255,255,255,0.07)', 70, 0.0012);
      if (o.tex === 'brushed') { pinstripe(P, 'rgba(120,120,125,0.25)', 120); brushed(P, 'rgba(255,255,255,0.25)', 60); }
      if (o.tex === 'grain') pinstripe(P, 'rgba(255,255,255,0.04)', 160);
      const ink = o.ink, L = o.lines || [item.name.replace('Tom Ford ', '').toUpperCase()];
      if (o.plate) { P.rect(0.31, 0.44, 0.38, 0.26, o.plate); if (o.plateEdge) P.frame(0.31, 0.44, 0.38, 0.26, o.plateEdge, 0.002); }
      tx(P, 'TOM FORD', 0.55, 0.023, ink, 'helv', { weight: 600, maxW: 0.36 });
      L.forEach((l, i) => tx(P, l, 0.59 + i * 0.037, 0.023, ink, 'helv', { weight: 600, maxW: 0.36 }));
      if (o.plate) tx(P, o.conc || 'EAU DE PARFUM', 0.665, 0.0135, ink, 'helv');
      const b = o.foot || ink;
      tx(P, o.conc || 'EAU DE PARFUM', 0.87, 0.012, b, 'helv'); tx(P, 'VAPORISATEUR SPRAY', 0.893, 0.012, b, 'helv'); tx(P, '3.4 FL. OZ./OZ. LIQ./100 ml ℮', 0.918, 0.012, b, 'helv', { maxW: 0.7 });
    },
  });
  const noirExtreme = (item, fit) => Object.assign(prop(fit, 0.6, 0.4), {
    open: 'flap', paper: { color: '#c9a65c', rough: 0.3, metal: 0.6 },
    front: (P) => {
      fullBg(P, '#a8884a'); for (let i = 0; i < 64; i++) P.rect(i / 64 + 0.003, 0, 0.6 / 64, 1, '#100e0a');
      P.rect(0.27, 0.505, 0.46, 0.1, '#d4b46c'); tx(P, 'TOM FORD', 0.53, 0.026, '#111', 'helv', { weight: 600, maxW: 0.44 }); tx(P, 'NOIR', 0.577, 0.026, '#111', 'helv', { weight: 600 });
      P.rect(0.29, 0.77, 0.42, 0.175, '#d4b46c'); tx(P, 'EXTREME', 0.8, 0.022, '#111', 'helv', { weight: 600 }); tx(P, 'PARFUM', 0.83, 0.016, '#111', 'helv', { weight: 700 });
      tx(P, 'VAPORISATEUR SPRAY', 0.87, 0.011, '#111', 'helv'); tx(P, '3.4 FL. OZ./OZ. LIQ./100 ml ℮', 0.91, 0.011, '#111', 'helv', { maxW: 0.38 });
    },
  });

  /* ---------- Parfums de Marly ---------- */
  function marlyCrest(P, col, bg) {
    horse(P, 0.29, 0.17, 0.17, 0.16, col); horse(P, 0.54, 0.17, 0.17, 0.16, col, true);
    P.path([[0.27, 0.335], [0.73, 0.335], [0.71, 0.352], [0.73, 0.37], [0.27, 0.37], [0.29, 0.352]], col);
    const sh = [[0.445, 0.275], [0.555, 0.275], [0.56, 0.33], [0.5, 0.405], [0.44, 0.33]];
    P.path(sh, col); P.path(sh.map(([x, y]) => [0.5 + (x - 0.5) * 0.8, 0.31 + (y - 0.31) * 0.8]), bg);
    tx(P, '1743', 0.305, 0.011, col, 'roman', { weight: 600 });
  }
  const pdm = (o) => (item, fit) => Object.assign(prop(fit, 0.62, 0.36), {
    lid: o.band ? 0.87 : 0.9, paper: { color: o.c, rough: o.metal ? 0.3 : 0.65, metal: o.metal || 0 }, lining: o.c,
    front: (P) => {
      fullBg(P, o.c); if (o.metal) brushed(P, 'rgba(255,255,255,0.12)', 120);
      if (o.stripes) pinstripe(P, 'rgba(230,230,230,0.55)', 32);
      if (o.rule) P.frame(0.035, 0.025, 0.93, 0.95, o.foil, 0.0015);
      const f = o.foil || '#d9dadc', nm = o.name || item.name.toUpperCase();
      marlyCrest(P, f, o.c);
      tx(P, 'PARFUMS de MARLY', 0.46, 0.017, f, 'roman', { track: 0.12, maxW: 0.66 }); tx(P, 'PARIS', 0.49, 0.011, f, 'roman', { track: 0.1 });
      if (o.band) {
        if (o.panel) P.rect(0.25, 0.58, 0.5, 0.08, o.panel); else tx(P, nm, 0.62, 0.032, o.name2 || '#f2f2f2', 'roman', { track: 0.04, maxW: 0.84 });
        tx(P, '125ml', 0.83, 0.014, f, 'roman', { x: 0.14 }); tx(P, '4.2fl.Oz', 0.83, 0.014, f, 'roman', { x: 0.84 });
        P.rect(0, 0.868, 1, 0.004, 'rgba(0,0,0,0.35)'); tx(P, o.band, 0.935, 0.016, '#f2f2f2', 'roman', { track: 0.06 });
      } else {
        tx(P, nm, 0.73, 0.032, o.name2 || f, 'roman', { track: 0.06, maxW: 0.8 });
        tx(P, 'EAU DE PARFUM', 0.79, 0.0105, f, 'sans', { track: 0.12 });
        tx(P, '125 ml', 0.94, 0.014, f, 'roman', { x: 0.13 }); tx(P, '4.2 fl.Oz', 0.94, 0.014, f, 'roman', { x: 0.84 });
      }
    },
    top: (P) => { fullBg(P, o.c); tx(P, 'PARFUMS de MARLY', 0.5, 0.06, o.foil || '#d9dadc', 'roman', { track: 0.1, maxW: 0.8 }); },
  });

  /* ---------- Byredo: one white landscape box for every fragrance ---------- */
  const byredo = (item, fit) => Object.assign(prop(fit, 1.3, 0.75), {
    lid: 0.9, paper: { color: '#f7f7f5', rough: 0.9 }, lining: '#ffffff',
    front: (P) => {
      fullBg(P, '#f7f7f5'); const e = 'rgba(0,0,0,0.045)';
      for (let i = 0; i < 70; i++) P.line(i / 70, 0, i / 70, 1, e, 0.0012);
      for (let r = 0; r < 9; r++) for (let c = 0; c < 14; c++) { const x = (c + 0.5) / 14, y = (r + 0.5) / 9; P.path([[x - 0.02, y - 0.03], [x, y], [x + 0.02, y - 0.03]], 'rgba(0,0,0,0.05)', false, 0.002); }
      P.rect(0.21, 0.23, 0.59, 0.53, '#f8f8f6'); P.frame(0.21, 0.23, 0.59, 0.53, 'rgba(0,0,0,0.05)', 0.002);
      tx(P, 'BYREDO', 0.3, 0.03, '#111', 'sans', { weight: 400, track: 0.2 });
      tx(P, item.name.toUpperCase(), 0.46, 0.05, '#111', 'sans', { weight: 400, track: 0.08, maxW: 0.5 });
      tx(P, 'EAU DE PARFUM', 0.61, 0.024, '#111', 'sans', { weight: 400, track: 0.08 });
      tx(P, 'VAPORISATEUR NATURAL SPRAY', 0.65, 0.011, '#111', 'sans', { weight: 400, track: 0.05 });
      tx(P, '℮100ML 3.3 FL.OZ', 0.7, 0.024, 'rgba(0,0,0,0.07)', 'sans', { weight: 500 });
    },
    top: (P) => { fullBg(P, '#f7f7f5'); P.path([[0.42, 0.25], [0.47, 0.25], [0.47, 0.72], [0.42, 0.78]], '#111'); P.g.save(); P.g.fillStyle = '#111'; P.g.beginPath(); P.g.ellipse(0.53 * P.W, 0.37 * P.H, 0.05 * P.W, 0.12 * P.H, 0, -Math.PI / 2, Math.PI / 2); P.g.ellipse(0.53 * P.W, 0.62 * P.H, 0.06 * P.W, 0.14 * P.H, 0, -Math.PI / 2, Math.PI / 2); P.g.fill(); P.g.restore(); P.rect(0.5, 0.31, 0.025, 0.4, '#f7f7f5'); },
  });

  /* ---------- Maison Francis Kurkdjian ---------- */
  const mfkHouse = (P, ink, x = 0.08, y = 0.073, cap = 0.026) => ['Maison', 'Francis Kurkdjian', 'Paris'].forEach((s, i) => tx(P, s, y + i * 0.05, cap, ink, 'serif', { x, align: 'left', weight: 400, maxW: 0.7 }));
  function mfkSide(P) {
    fullBg(P, '#f7f6f3'); const g = '#c49a52';
    [0.08, 0.11, 0.14, 0.17, 0.2].forEach((x) => P.line(x, 0.15, x, 0.85, g, 0.0012)); P.rect(0.05, 0.1, 0.2, 0.012, g); P.rect(0.05, 0.86, 0.22, 0.01, g);
    P.frame(0.32, 0.12, 0.6, 0.78, '#333', 0.0012); P.frame(0.35, 0.14, 0.54, 0.16, '#333', 0.001); P.frame(0.35, 0.32, 0.54, 0.46, '#333', 0.001);
    for (let i = 0; i < 4; i++) P.path([[0.5 + i * 0.09, 0.4], [0.56 + i * 0.09, 0.4], [0.58 + i * 0.09, 0.46], [0.48 + i * 0.09, 0.46]], i % 2 ? '#3a2a1e' : '#8a6a3a');
    for (let i = 0; i < 18; i++) P.circle(0.52 + 0.3 * Math.sin(i / 3), 0.48 + i * 0.012, 0.003, '#3a2a1e');
    P.rect(0.35, 0.8, 0.54, 0.07, 'rgba(196,154,82,0.25)'); tx(P, 'B', 0.835, 0.03, '#7a1b2b', 'serif', { x: 0.55, italic: true });
  }
  const mfk = (o) => (item, fit) => Object.assign(prop(fit, 0.6, 0.4), {
    open: 'flap', paper: { color: o.paper, rough: o.gloss ? 0.35 : 0.8 }, lining: '#e3dbe8',
    front: (P) => {
      fullBg(P, o.paper); stipple(P, o.speck || 'rgba(0,0,0,0.035)', 1800, 0.0008);
      if (o.panel) {
        const g = P.g.createLinearGradient(0.15 * P.W, 0, 0.85 * P.W, 0); o.panel.forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
        P.g.fillStyle = g; P.g.fillRect(0.15 * P.W, 0.08 * P.H, 0.7 * P.W, 0.37 * P.H);
        mfkHouse(P, o.pink || '#ffffff', 0.2, 0.12, 0.02);
        tx(P, o.n1 || item.name, 0.3, 0.024, o.pink || '#ffffff', 'serif', { x: 0.8, align: 'right', italic: !!o.n2, weight: 400, maxW: 0.55 });
        if (o.n2) tx(P, o.n2, 0.34, 0.018, o.pink || '#ffffff', 'serif', { x: 0.8, align: 'right', weight: 400 });
        tx(P, o.conc || 'Eau de parfum', 0.4, 0.017, o.pink || '#ffffff', 'serif', { weight: 600 });
        tx(P, '70 ml ℮', 0.96, 0.011, '#9a9a9a', 'serif', { x: 0.12, weight: 400 }); tx(P, '2.4 fl.oz.', 0.96, 0.011, '#9a9a9a', 'serif', { x: 0.86, weight: 400 });
        return;
      }
      mfkHouse(P, o.house);
      tx(P, o.n1, 0.375, 0.04, o.name, 'serif', { x: 0.92, align: 'right', italic: true, weight: 400, maxW: 0.6 });
      tx(P, o.n2, 0.428, 0.026, o.name, 'serif', { x: 0.92, align: 'right', weight: 400 });
      tx(P, o.conc || 'Eau de parfum', 0.9, 0.019, o.house, 'serif', { weight: 700 });
      tx(P, '70 ml', 0.975, 0.011, o.emb || 'rgba(0,0,0,0.06)', 'serif', { x: 0.1 }); tx(P, '2.4 fl.oz', 0.975, 0.011, o.emb || 'rgba(0,0,0,0.06)', 'serif', { x: 0.88 });
    },
    sideArt: o.side ? mfkSide : undefined,
    top: (P) => { fullBg(P, o.paper); P.frame(0.43, 0.38, 0.14, 0.24, o.house || '#b08a4a', 0.012); tx(P, 'KK', 0.5, 0.08, o.house || '#b08a4a', 'serif', { track: -0.2 }); },
  });

  /* ---------- Clive Christian ---------- */
  function cliveEmblem(P, kind, g, bg) {
    if (kind === '1872') {
      P.circle(0.5, 0.36, 0.035, g); P.circle(0.5, 0.36, 0.022, bg); P.circle(0.5, 0.36, 0.012, g);
      P.ellipse(0.42, 0.39, 0.07, 0.022, -0.3, g); P.line(0.6, 0.31, 0.57, 0.43, g, 0.006);
      tx(P, '1872', 0.5, 0.075, g, 'serif', { weight: 700, maxW: 0.5 });
    } else if (kind === 'X') {
      crown(P, 0.5, 0.36, 0.04, g); tx(P, 'X', 0.47, 0.11, g, 'serif', { weight: 600 });
      [[0.3, 0.47], [0.7, 0.47]].forEach(([x, y]) => P.circle(x, y, 0.02, g, 0.003));
    } else if (kind === 'No1') {
      crown(P, 0.5, 0.37, 0.04, g); tx(P, 'No', 0.47, 0.035, g, 'serif', { x: 0.38, weight: 600 }); tx(P, '1', 0.47, 0.1, g, 'serif', { x: 0.57, weight: 600 });
      P.line(0.3, 0.57, 0.7, 0.57, g, 0.002);
    } else {
      P.frame(0.29, 0.3, 0.42, 0.31, g, 0.004);
      for (let i = 0; i < 14; i++) P.circle(0.32 + rnd(i) * 0.36, 0.32 + rnd(i + 50) * 0.27, 0.015 + rnd(i + 9) * 0.02, g, 0.0018);
      tx(P, kind, 0.455, 0.12, g, 'serif', { weight: 600 });
    }
  }
  const clive = (o) => (item, fit) => Object.assign(prop(fit, 0.72, 0.4), {
    open: 'flap', paper: { color: o.c, rough: o.metal ? 0.3 : 0.45, metal: o.metal || 0 }, lining: '#111111',
    front: (P) => {
      const g = o.g || '#d4ae52'; fullBg(P, o.c); if (o.metal) brushed(P, 'rgba(255,255,255,0.1)', 120);
      P.frame(0.03, 0.022, 0.94, 0.956, g, 0.0015);
      tx(P, 'CLIVE CHRISTIAN', 0.205, 0.025, g, 'sans', { track: 0.12, maxW: 0.6 });
      cliveEmblem(P, o.em, g, o.c);
      tx(P, o.coll, 0.69, 0.0135, g, 'sans', { track: 0.2, maxW: 0.5 });
      P.line(0.26, 0.72, 0.74, 0.72, g, 0.0012); P.line(0.26, 0.84, 0.74, 0.84, g, 0.0012);
      o.desc.forEach((l, i) => tx(P, l, 0.748 + i * 0.03, 0.0095, g, 'sans', { track: 0.08, maxW: 0.48 }));
      tx(P, '100 ml ℮', 0.93, 0.014, g, 'sans', { x: 0.13 }); tx(P, 'PERFUME SPRAY', 0.93, 0.01, g, 'sans', { track: 0.15 }); tx(P, '3.4 U.S. fl.oz', 0.93, 0.012, g, 'sans', { x: 0.86 });
    },
  });
  function cliveArms(P, g) {
    crown(P, 0.5, 0.2, 0.04, g);
    P.path([[0.4, 0.24], [0.6, 0.24], [0.6, 0.36], [0.5, 0.45], [0.4, 0.36]], g, false, 0.004);
    P.line(0.5, 0.24, 0.5, 0.44, g, 0.003); P.line(0.4, 0.33, 0.6, 0.33, g, 0.003);
    [[0.45, 0.285], [0.55, 0.285], [0.45, 0.375], [0.55, 0.38]].forEach(([x, y]) => P.circle(x, y, 0.016, g));
    [[0.3, 1], [0.7, -1]].forEach(([x, s]) => { P.ellipse(x, 0.33, 0.07, 0.085, s * 0.25, g); P.circle(x + s * 0.01, 0.24, 0.025, g); P.line(x - s * 0.08, 0.27, x - s * 0.16, 0.22, g, 0.005); });
    P.path([[0.24, 0.47], [0.38, 0.5], [0.62, 0.5], [0.76, 0.47], [0.76, 0.5], [0.62, 0.53], [0.38, 0.53], [0.24, 0.5]], g);
  }
  const cliveChest = (item, fit) => Object.assign(prop(fit, 0.8, 0.62), {
    lid: 0.3, paper: { color: '#0c0c0c', rough: 0.15, metal: 0.1 }, lining: { color: '#f2ead6', rough: 0.4 },
    front: (P) => {
      fullBg(P, '#0c0c0c'); const g = '#d9b45e'; P.frame(0.04, 0.03, 0.92, 0.94, g, 0.003); P.frame(0.06, 0.05, 0.88, 0.9, g, 0.0012);
      cliveArms(P, g); tx(P, 'CLIVE CHRISTIAN', 0.66, 0.028, g, 'sans', { track: 0.12, maxW: 0.6 });
      tx(P, 'No1 IMPERIAL MAJESTY', 0.74, 0.016, g, 'serif', { track: 0.1, maxW: 0.6 });
    },
    top: (P) => { fullBg(P, '#0c0c0c'); P.frame(0.05, 0.05, 0.9, 0.9, '#d9b45e', 0.006); tx(P, 'CLIVE CHRISTIAN', 0.5, 0.08, '#d9b45e', 'sans', { track: 0.12, maxW: 0.7 }); },
  });
  const CO = 'ORIGINAL COLLECTION', CP = 'PRIVATE COLLECTION';

  /* ---------- Xerjoff ---------- */
  function bigX(P, band, edge) {
    const T = [[0.04, -0.02], [0.4, -0.02], [1.02, 1.02], [0.64, 1.02]], t = [[0.74, -0.02], [0.88, -0.02], [0.32, 1.02], [0.18, 1.02]];
    P.path(T, band); P.path(t, band);
    const sh = (pts, d) => pts.map(([x, y]) => [x + d, y]);
    P.path(sh(T, 0.025), edge, false, 0.002); P.path(sh(t, -0.02), edge, false, 0.002);
  }
  const xLogo = (P, y, cap, c1, c2) => { tx(P, 'X', y, cap, c2, 'serif', { italic: true, weight: 600, x: 0.505 }); tx(P, 'X', y, cap, c1, 'serif', { italic: true, weight: 400 }); };
  const xerjoff = (o) => (item, fit) => Object.assign(prop(fit, 0.6, 0.42), {
    open: 'flap', paper: { color: o.c, rough: 0.55 }, lining: o.lining || o.c,
    front: (P) => {
      const g = o.g || '#c9a24a'; fullBg(P, o.c);
      if (o.kind === 'jtc' || o.kind === 'stars') {
        if (o.kind === 'stars') { stipple(P, 'rgba(0,0,0,0.08)', 2500, 0.001); P.rect(0.07, 0.045, 0.86, 0.91, o.field); stipple(P, 'rgba(255,255,255,0.06)', 2500, 0.0009); }
        P.frame(0.05, 0.035, 0.9, 0.93, g, 0.0018); P.frame(0.075, 0.053, 0.85, 0.894, g, 0.0012);
        vtx(P, 'XERJOFF', 0.5, 0.53, 0.14, g, 'sans', { weight: 500, track: 0.08, maxW: 0.66 * ax(P) });
        vtx(P, '3.4 FL.OZ.', 0.86, 0.12, 0.011, g, 'helv', { maxW: 0.2 * ax(P) }); vtx(P, '100ml ℮', 0.14, 0.88, 0.011, g, 'helv', { maxW: 0.2 * ax(P) });
        return;
      }
      if (o.kind === '1861') stipple(P, 'rgba(0,0,0,0.03)', 1500, 0.001);
      bigX(P, o.band, o.edge);
      P.frame(0.05, 0.035, 0.9, 0.93, g, 0.002); if (o.kind === '1861') P.frame(0.065, 0.045, 0.87, 0.91, g, 0.001);
      xLogo(P, 0.34, 0.1, o.x1 || '#ffffff', o.x2 || '#b8864a');
      tx(P, 'XERJOFF', 0.8, 0.03, o.ink || '#ffffff', 'sans', { weight: 500, track: 0.04 });
      tx(P, item.name.toUpperCase(), 0.84, 0.013, o.ink2 || o.ink || '#ffffff', 'sans', { weight: 500, track: 0.08 });
      tx(P, 'EAU DE PARFUM', 0.88, 0.008, o.ink2 || o.ink || '#ffffff', 'sans', { track: 0.12 });
      tx(P, '100 ml ℮', 0.94, 0.01, o.ink2 || o.ink || '#ffffff', 'sans', { x: 0.18 }); tx(P, '3.4 FL.OZ.', 0.94, 0.01, o.ink2 || o.ink || '#ffffff', 'sans', { x: 0.82 });
    },
    top: (P) => { fullBg(P, o.kind === 'stars' ? '#3a1d1a' : o.c); tx(P, 'XERJOFF', 0.5, 0.09, o.g || '#c9a24a', 'sans', { track: 0.1 }); },
  });

  /* ---------- Baccarat ---------- */
  const baccarat = (item, fit) => Object.assign(prop(fit, 0.92, 0.92), {
    lid: 0.9, paper: { color: '#921822', rough: 0.7 }, lining: { color: '#efe6d8', rough: 0.35 },
    front: (P) => {
      fullBg(P, '#921822'); stipple(P, 'rgba(0,0,0,0.08)', 2200, 0.0009); stipple(P, 'rgba(255,255,255,0.03)', 1500, 0.0009);
      tx(P, 'Baccarat', 0.5, 0.06, '#f2f2f2', 'serif', { italic: true, weight: 400, maxW: 0.5 });
      tx(P, 'LES LARMES SACRÉES DE THÈBES', 0.7, 0.014, '#f2f2f2', 'roman', { track: 0.1, maxW: 0.7 }); tx(P, 'PARFUM', 0.74, 0.011, '#f2f2f2', 'roman', { track: 0.2 });
    },
    top: (P) => { fullBg(P, '#921822'); tx(P, 'Baccarat', 0.5, 0.11, '#f2f2f2', 'serif', { italic: true, weight: 400, maxW: 0.5 }); },
  });

  /* ---------- Kilian: black textured box, gold-edged diamond ---------- */
  const KL = { "Angels' Share": ["ANGELS'", 'SHARE'], "Love, Don't Be Shy": ['LOVE,', "DON'T BE SHY"], 'Good Girl Gone Bad': ['GOOD GIRL', 'GONE BAD'], 'Apple Brandy on the Rocks': ['APPLE BRANDY', 'ON THE ROCKS'], 'Vodka on the Rocks': ['VODKA', 'ON THE ROCKS'] };
  const K100 = /Angels|Brandy|Old Fashioned|Vodka|Roses on Ice/;
  const kilian = (item, fit) => Object.assign(prop(fit, 0.72, 0.6), {
    lid: 0.8, paper: { color: '#2a2a28', rough: 0.85 }, lining: '#111111',
    front: (P) => {
      fullBg(P, '#2a2a28'); weave(P, 'rgba(0,0,0,0.25)', 160); weave(P, 'rgba(255,255,255,0.025)', 90);
      const hw = 0.39, hh = hw * P.W / P.H, cy = 0.43;
      diamond(P, 0.5, cy, hw + 0.01, hh + 0.01 * P.W / P.H, '#1c1c1b'); diamond(P, 0.5, cy, hw - 0.025, hh - 0.025 * P.W / P.H, '#c9b48a', 0.0018);
      const w = item.name.toUpperCase().split(' '), L = KL[item.name] || (w.length < 2 ? [w[0]] : [w[0], w.slice(1).join(' ')]);
      L.forEach((l, i) => tx(P, l, cy - 0.085 + i * 0.058 + (L.length < 2 ? 0.03 : 0), 0.036, '#f0f0f0', 'serif', { weight: 400, maxW: 0.5 }));
      tx(P, 'by', cy + 0.022, 0.011, '#f0f0f0', 'serif', { italic: true, weight: 400 });
      tx(P, 'Kilian', cy + 0.068, 0.045, '#f0f0f0', 'serif', { italic: true, weight: 400 });
      P.rect(0, 0.8, 1, 0.004, 'rgba(0,0,0,0.5)');
      const c = '#e9dcc0', ml = K100.test(item.name) ? '℮100 ml - 3.4 fl.oz.' : '℮50ml - 1.7fl.oz.';
      tx(P, 'EAU DE PARFUM', 0.86, 0.02, c, 'helv', { weight: 400, track: 0.08 }); tx(P, 'VAPORISATEUR SPRAY', 0.9, 0.013, c, 'helv', { weight: 400, track: 0.15 }); tx(P, ml, 0.945, 0.018, c, 'helv', { weight: 400, track: 0.08, maxW: 0.66 });
    },
    top: (P) => { fullBg(P, '#2a2a28'); weave(P, 'rgba(0,0,0,0.25)', 80); P.frame(0.38, 0.4, 0.24, 0.2, '#c9b48a', 0.008); tx(P, 'K', 0.5, 0.1, '#c9b48a', 'serif', { weight: 400 }); },
  });

  /* ---------- Roja ---------- */
  const roja = (o) => (item, fit) => Object.assign(prop(fit, o.rw || 0.68, 0.55), {
    lid: o.lid || 0.825, paper: { color: o.c, rough: o.rough || 0.8, metal: o.metal || 0 }, lining: o.lining || '#d9b778',
    front: (P) => {
      const g = o.g || '#d9b778'; fullBg(P, o.c); if (!o.gloss) pinstripe(P, o.lin || 'rgba(255,255,255,0.025)', 200);
      if (o.draw) o.draw(P, g);
      if (o.band !== false) { P.rect(0, 0.826, 1, 0.026, '#efcf9c'); P.rect(0, 0.848, 1, 0.004, 'rgba(0,0,0,0.25)'); tx(P, 'ROJA', 0.927, 0.03, g, 'sans', { track: 0.12 }); }
    },
    top: (P) => { fullBg(P, o.c); tx(P, 'ROJA', 0.5, 0.08, o.g || '#d9b778', 'sans', { track: 0.15 }); },
  });
  const rojaPH = (name) => roja({ c: '#373238', draw: (P, g) => { tx(P, name, 0.18, 0.026, g, 'sans', { weight: 400, track: 0.32 }); tx(P, 'EAU DE PARFUM', 0.215, 0.0105, g, 'sans', { track: 0.1 }); } });
  const burlington = (P, g) => {
    tx(P, '18', 0.235, 0.04, g, 'serif', { weight: 500 }); tx(P, 'BURLINGTON', 0.31, 0.022, g, 'serif', { weight: 500, track: 0.04 }); tx(P, '19', 0.39, 0.04, g, 'serif', { weight: 500 });
    const c = P.g; c.save(); c.beginPath(); c.rect(0, 0.6 * P.H, P.W, 0.226 * P.H); c.clip(); c.strokeStyle = g; c.lineWidth = 0.0015 * P.H;
    for (const cx of [0.28, 0.72]) for (let r = 0.06; r < 0.5; r += 0.05) { c.beginPath(); c.arc(cx * P.W, 1.02 * P.H, r * P.H, 0, Math.PI * 2); c.stroke(); }
    for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(0.5 * P.W, 1.05 * P.H); c.lineTo((i / 11) * P.W, 0.55 * P.H); c.stroke(); }
    c.restore();
    P.path([[0, 0.585], [0.06, 0.585], [0.11, 0.545], [0.4, 0.545], [0.5, 0.6], [0.6, 0.545], [0.89, 0.545], [0.94, 0.585], [1, 0.585], [1, 0.605], [0.94, 0.605], [0.89, 0.565], [0.6, 0.565], [0.5, 0.62], [0.4, 0.565], [0.11, 0.565], [0.06, 0.605], [0, 0.605]], g);
  };
  const isola = (P, g) => {
    for (let i = 0; i < 7; i++) P.circle(i / 6, 0.0, 0.07, 'rgba(0,0,0,0.04)', 0.002);
    tx(P, 'ISOLA BLU', 0.345, 0.024, g, 'sans', { weight: 500, track: 0.15 }); tx(P, 'PARFUM', 0.395, 0.018, g, 'sans', { weight: 400, track: 0.06 });
    P.path([[0, 0.62], [0.08, 0.63], [0.18, 0.67], [0.07, 0.645], [0, 0.635]], g); P.path([[1, 0.62], [0.92, 0.63], [0.82, 0.67], [0.93, 0.645], [1, 0.635]], g);
  };
  const apex = (P) => { otext(P, 'APEX', 0.25, 0.13, '#c8c8c8', 0.003, 0.08); tx(P, 'ROJA', 0.69, 0.06, '#c8c8c8', 'sans', { weight: 400, track: 0.12 }); tx(P, 'PARFUMS', 0.79, 0.014, '#c8c8c8', 'sans', { track: 0.4 }); };
  const cabinet = (crest) => roja({ c: '#0a0a0a', rw: 0.85, lid: 0.92, rough: 0.12, metal: 0.15, gloss: true, band: false, lining: '#0b0b0b', draw: (P, g) => {
    P.rect(0, 0, 1, 1, '#0a0a0a'); const gr = P.g.createLinearGradient(0, 0, P.W, 0); gr.addColorStop(0, 'rgba(255,255,255,0.08)'); gr.addColorStop(0.3, 'rgba(255,255,255,0)'); gr.addColorStop(0.8, 'rgba(255,255,255,0.05)'); P.g.fillStyle = gr; P.g.fillRect(0, 0, P.W, P.H);
    P.line(0.5, 0, 0.5, 0.92, 'rgba(255,255,255,0.18)', 0.003); P.frame(0.03, 0.02, 0.94, 0.9, 'rgba(255,255,255,0.08)', 0.002);
    if (crest) { P.frame(0.08, 0.06, 0.84, 0.82, g, 0.002); tx(P, 'ROJA', 0.42, 0.05, g, 'sans', { track: 0.15 }); tx(P, 'HAUTE LUXE', 0.5, 0.016, g, 'sans', { track: 0.25 }); }
    tx(P, 'R', 0.8, 0.055, g, 'serif', { italic: true, x: 0.8, weight: 400 }); P.path([[0.72, 0.83], [0.8, 0.8], [0.9, 0.84]], g, false, 0.003);
    P.rect(0, 0.92, 1, 0.08, '#050505');
  } });

  /* ---------- Amouage: an abstract painting with a small black label ---------- */
  function amArt(P, bg, ops) {
    fullBg(P, bg);
    for (const [k, c, ...a] of ops) {
      if (k === 'b') blob(P, a[0], a[1], a[2], c, a[3] || a[0] * 9 + a[1] * 5, a[4] || 1, a[5] || 1);
      else if (k === 's') stroke(P, a[0], a[1], a[2], a[3], c, a[4], a[5]);
      else if (k === 'c') P.circle(a[0], a[1], a[2], c);
      else if (k === 'g') { for (let i = 0; i < a[0]; i++) { const r = Math.sqrt(rnd(i + 31)) * a[3], t = rnd(i + 77) * 6.283; P.circle(a[1] + Math.cos(t) * r * ax(P), a[2] + Math.sin(t) * r, 0.0012 + rnd(i) * 0.0015, c); } }
    }
  }
  const amouage = (o) => (item, fit) => Object.assign(prop(fit, 1, 0.45), {
    lid: 0.85, paper: { color: o.side || o.bg, rough: 0.6 }, lining: { color: '#0c0c0c', rough: 0.9 },
    front: (P) => {
      amArt(P, o.bg, o.ops);
      const lab = o.taupe ? '#c9bdb0' : '#0d0d0d', ink = o.taupe ? '#1a1a1a' : '#f2f2f2', em = o.silver ? '#c8c8c8' : '#c9a45a';
      P.rect(0.34, 0.3, 0.33, 0.43, lab);
      tx(P, 'AMOUAGE', 0.42, 0.022, ink, 'sans', { weight: 500, track: 0.06, maxW: 0.28 });
      P.circle(0.505, 0.53, 0.02, em); for (let i = 0; i < 12; i++) { const t = (i / 12) * 6.283; P.circle(0.505 + Math.cos(t) * 0.025 * ax(P), 0.53 + Math.sin(t) * 0.025, 0.004, em); }
      tx(P, o.name || item.name.replace(/ Man$/, '').toUpperCase(), 0.61, 0.014, ink, 'sans', { weight: 400, track: 0.12, maxW: 0.28 });
      if (!o.taupe) tx(P, 'MAN', 0.69, 0.008, ink, 'sans', { weight: 600, track: 0.1 });
    },
    top: (P) => { amArt(P, o.bg, o.ops); P.rect(0.4, 0, 0.2, 0.08, '#111'); },
  });

  /* ---------- Initio ---------- */
  function arabesque(P, cy, hh, g) {
    const hw = hh * ax(P);
    for (const k of [1, 0.82, 0.55]) diamond(P, 0.5, cy, hw * k, hh * k, g, k === 1 ? 0.004 : 0.0025);
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const x = 0.5 + dx * hw, y = cy + dy * hh; P.circle(x, y, 0.012, g); P.circle(x + dx * 0.02 * ax(P), y + dy * 0.02, 0.006, g);
      for (const s of [-1, 1]) P.circle(0.5 + dx * hw * 0.62 + (dy ? s * hw * 0.25 : 0), cy + dy * hh * 0.62 + (dx ? s * hh * 0.25 : 0), 0.022, g, 0.003);
    }
    P.circle(0.47, cy, 0.04, g, 0.004); P.circle(0.53, cy, 0.04, g, 0.004); P.line(0.5, cy - 0.06, 0.5, cy + 0.06, g, 0.004);
  }
  function eye(P, cy, g) {
    for (let i = 0; i < 64; i++) { const t = (i / 64) * 6.283, r0 = 0.2, r1 = 0.26 + rnd(i) * 0.08; P.line(0.5 + Math.cos(t) * r0 * ax(P), cy + Math.sin(t) * r0, 0.5 + Math.cos(t) * r1 * ax(P), cy + Math.sin(t) * r1, g, 0.0012); }
    arabesque(P, cy, 0.19, g); P.ellipse(0.5, cy, 0.17, 0.036, 0, '#26262a');
    P.path([[0.34, cy], [0.42, cy - 0.04], [0.58, cy - 0.04], [0.66, cy], [0.58, cy + 0.04], [0.42, cy + 0.04]], g, false, 0.004);
    P.circle(0.5, cy, 0.026, g, 0.004); P.circle(0.5, cy, 0.01, g);
  }
  const initio = (o) => (item, fit) => Object.assign(prop(fit, 0.55, 0.4), {
    open: 'flap', paper: { color: o.c, rough: 0.8 }, lining: o.c,
    front: (P) => {
      const g = o.g || '#d8bd84'; fullBg(P, o.c);
      if (o.eye) eye(P, 0.36, g); else arabesque(P, 0.33, 0.19, g);
      tx(P, 'INITIO', 0.685, 0.033, g, 'roman', { weight: 500, track: 0.06 });
      if (o.eye) { P.rect(0.2, 0.755, 0.6, 0.032, g, 0.016); P.rect(0.205, 0.758, 0.59, 0.026, o.c, 0.013); }
      tx(P, item.name.toUpperCase(), 0.771, 0.0135, g, 'roman', { weight: 500, track: 0.04, maxW: 0.56 });
      tx(P, 'EAU DE PARFUM', 0.875, 0.009, g, 'roman', { weight: 600, track: 0.05 });
      tx(P, '℮ 90 ml', 0.945, 0.014, g, 'roman', { x: 0.17, weight: 400 }); tx(P, '3.04 fl.Oz', 0.945, 0.014, g, 'roman', { x: 0.81, weight: 400 });
    },
    top: (P) => { fullBg(P, o.c); tx(P, 'INITIO', 0.5, 0.1, o.g || '#d8bd84', 'roman'); },
  });

  /* ---------- Nishane ---------- */
  function lattice(P, x0, y0, x1, y1, bar, cell) {
    const W = P.W, H = P.H, seeds = [], nx = 7, ny = Math.round(7 * (y1 - y0) * H / ((x1 - x0) * W));
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) seeds.push([(x0 + (x1 - x0) * (i + 0.5 * (j % 2) + (rnd(i * 31 + j) - 0.5) * 0.6) / nx) * W, (y0 + (y1 - y0) * (j + (rnd(i + j * 17) - 0.5) * 0.6) / ny) * H]);
    P.rect(x0, y0, x1 - x0, y1 - y0, bar); P.g.save(); P.g.beginPath(); P.g.rect(x0 * W, y0 * H, (x1 - x0) * W, (y1 - y0) * H); P.g.clip(); P.g.fillStyle = cell;
    for (const s of seeds) {
      let poly = [[x0 * W - 50, y0 * H - 50], [x1 * W + 50, y0 * H - 50], [x1 * W + 50, y1 * H + 50], [x0 * W - 50, y1 * H + 50]];
      for (const t of seeds) {
        if (t === s) continue; const nx2 = t[0] - s[0], ny2 = t[1] - s[1], mx = (s[0] + t[0]) / 2, my = (s[1] + t[1]) / 2, f = (p) => (p[0] - mx) * nx2 + (p[1] - my) * ny2, out = [];
        poly.forEach((p, i) => { const q = poly[(i + 1) % poly.length], fp = f(p), fq = f(q); if (fp <= 0) out.push(p); if ((fp <= 0) !== (fq <= 0)) { const k = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]); } });
        poly = out; if (!poly.length) break;
      }
      if (poly.length < 3) continue; const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length, cy = poly.reduce((a, p) => a + p[1], 0) / poly.length, k = 0.74;
      P.g.beginPath(); poly.forEach((p, i) => { const x = cx + (p[0] - cx) * k, y = cy + (p[1] - cy) * k; if (i) P.g.lineTo(x, y); else P.g.moveTo(x, y); }); P.g.closePath(); P.g.fill();
    }
    P.g.restore();
  }
  function rider(P, x, y, s, col) { horse(P, x - s * 0.5 * ax(P), y - s * 0.3, s * ax(P), s * 0.75, col, false); P.ellipse(x + s * 0.02 * ax(P), y - s * 0.42, s * 0.1 * ax(P), s * 0.16, 0.2, col); P.circle(x + s * 0.05 * ax(P), y - s * 0.6, s * 0.06, col); }
  const nishane = (o) => (item, fit) => Object.assign(prop(fit, 0.85, 0.7), {
    open: 'flap', paper: { color: o.c, rough: 0.8 }, lining: o.c,
    front: (P) => {
      const g = o.g || '#e8d6a6', nm = item.name.toUpperCase(); fullBg(P, o.c);
      if (o.lattice) { lattice(P, 0.1, 0.055, 0.92, 0.885, '#262626', '#e8e8e8'); P.rect(0.28, 0.46, 0.44, 0.08, '#262626'); }
      else { const w = nm.split(' '), L = w.length > 2 ? [w.slice(0, 2).join(' '), w.slice(2).join(' ')] : [nm]; L.forEach((l, i) => tx(P, l, 0.07 + i * 0.045, 0.018, g, 'sans', { weight: 400, track: 0.04 })); }
      tx(P, 'NISHANE', 0.5, o.lattice ? 0.03 : 0.045, g, 'sans', { weight: 400, track: 0.1 });
      tx(P, 'Extrait de Parfum', 0.935, 0.016, g, 'sans', { weight: 400 });
    },
    sideArt: (P) => { fullBg(P, o.c); const g = o.g || '#e8d6a6'; tx(P, item.name.toUpperCase(), 0.07, 0.014, g, 'sans', { x: 0.15, align: 'left', weight: 400, maxW: 0.7 }); rider(P, 0.3, 0.5, 0.09, '#d4b26a'); tx(P, 'NISHANE', 0.94, 0.016, g, 'sans', { x: 0.15, align: 'left', weight: 400 }); },
  });

  /* ---------- registry ---------- */
  BoxCraft.add({
    /* Tom Ford — Private Blend */
    tomford: tfPB({ lid: '#2a2a2c', plate: '#d9b45e', ink: '#1a1a1a' }),
    'tomford|Oud Wood': tfPB({ lid: '#3c3c40', plate: '#232325', ink: '#e8e8e8', band: '#e8e8e8', collar: '#d8dadc', plateEdge: '#6a6a6e' }),
    'tomford|Tobacco Vanille': tfPB({ lid: '#2f241f', plate: '#e6c46d', ink: '#2a1a10', band: '#e6c46d', collar: '#e0bb62', topInk: '#a88a4a' }),
    'tomford|Lost Cherry': tfPB({ lid: '#560e18', plate: '#f3d9cf', ink: '#6a1520', band: '#f3d9cf', collar: '#f3e8d8', grain: 'rgba(255,255,255,0.07)' }),
    'tomford|Neroli Portofino': tfPB({ lid: '#0f6670', plate: '#d9b45e', ink: '#1a1a1a', band: '#e6c87a', collar: '#e6c87a', grain: 'rgba(255,255,255,0.03)' }),
    'tomford|Tuscan Leather': tfPB({ lid: '#4a2a20', plate: '#c9945a', ink: '#2a1610', band: '#c9945a', collar: '#c9a050' }),
    'tomford|Fucking Fabulous': tfPB({ lid: '#efefec', plate: '#151515', ink: '#efefec', band: '#151515', collar: '#c9ccd0', grain: 'rgba(0,0,0,0.05)', topInk: '#9a9a9a' }),
    'tomford|Costa Azzurra': tfPB({ lid: '#1e2c4e', plate: '#f2f0ea', ink: '#1e2c4e', band: '#f2f0ea', collar: '#d8dadc' }),
    'tomford|Soleil Blanc': tfPB({ lid: '#f3efe6', plate: '#c9a24a', ink: '#ffffff', band: '#a8843a', collar: '#e0bb62', grain: 'rgba(0,0,0,0.04)', topInk: '#c9a24a' }),
    'tomford|Bitter Peach': tfPB({ lid: '#e98a4a', plate: '#e8b48e', ink: '#5a2a14', band: '#fbe6d6', collar: '#e0b07a', grain: 'rgba(255,255,255,0.07)' }),
    'tomford|Tobacco Oud': tfPB({ lid: '#4a2e1c', plate: '#d6ad5c', ink: '#3a2414', band: '#d6ad5c', collar: '#d6ad5c' }),
    'tomford|Rose Prick': tfPB({ lid: '#e6a3b4', plate: '#fbeef0', ink: '#a03a5a', band: '#fbeef0', collar: '#f6dfe4', grain: 'rgba(255,255,255,0.08)' }),
    'tomford|Ébène Fumé': tfPB({ lid: '#141414', plate: '#0b0b0b', ink: '#b8b8b8', band: '#9a9a9a', collar: '#2a2a2a', plateEdge: '#3a3a3a' }),
    'tomford|Oud Minérale': tfPB({ lid: '#1a2624', plate: '#c4c6c8', ink: '#1a2624', band: '#c4c6c8', collar: '#d8dadc' }),
    'tomford|Electric Cherry': tfPB({ lid: '#c0182a', plate: '#f4c2cc', ink: '#8a1020', band: '#f4c2cc', collar: '#f3e8d8', grain: 'rgba(255,255,255,0.07)' }),
    'tomford|Vanilla Sex': tfPB({ lid: '#efd6c8', plate: '#fbf3ea', ink: '#7a4a3a', band: '#9a6a5a', collar: '#f6e6da', grain: 'rgba(0,0,0,0.04)', topInk: '#a07868' }),
    'tomford|Café Rose': tfPB({ lid: '#3a2420', plate: '#d9a08a', ink: '#3a2420', band: '#d9a08a', collar: '#d9a08a' }),
    'tomford|Noir de Noir': tfPB({ lid: '#121212', plate: '#d6b25a', ink: '#121212', band: '#d6b25a', collar: '#d6b25a' }),
    /* Tom Ford — Signature */
    'tomford|Noir Extreme': noirExtreme,
    'tomford|Noir': tfSig({ paper: '#111111', tex: 'grain', plate: '#d4b46c', ink: '#111', foot: '#d4b46c', conc: 'EAU DE PARFUM' }),
    'tomford|Ombré Leather': tfSig({ paper: '#1a1a1a', tex: 'rhomb', ink: '#f2f2f2' }),
    'tomford|Grey Vetiver': tfSig({ paper: '#9a9ca0', metal: 0.6, tex: 'brushed', plate: '#c4c6c8', plateEdge: '#9a9ca0', ink: '#2a2a2c', foot: '#2a2a2c' }),
    'tomford|Black Orchid': tfSig({ paper: '#16181c', tex: 'grain', plate: '#0b0b0d', ink: '#d6b46a', foot: '#d6b46a', conc: 'EAU DE TOILETTE' }),
    'tomford|Tom Ford for Men': tfSig({ paper: '#45291a', tex: 'grain', plate: '#efe6d2', ink: '#3a2414', foot: '#efe6d2', lines: ['FOR MEN'], conc: 'EAU DE TOILETTE' }),
    'tomford|Tom Ford for Men Extreme': tfSig({ paper: '#2e1c12', tex: 'grain', plate: '#e6d6b4', ink: '#2e1c12', foot: '#e6d6b4', lines: ['FOR MEN', 'EXTREME'], conc: 'EAU DE TOILETTE' }),
    'tomford|Beau de Jour': tfSig({ paper: '#5c6a78', tex: 'grain', plate: '#f2f2f0', ink: '#3a4652', foot: '#f2f2f0' }),

    /* Parfums de Marly */
    pdm: pdm({ c: '#2a3150' }),
    'pdm|Layton': pdm({ c: '#2a3150' }),
    'pdm|Layton Exclusif': pdm({ c: '#1d2742', band: 'EDITION ROYALE' }),
    'pdm|Pegasus': pdm({ c: '#22223f', name2: '#f2f2f2' }),
    'pdm|Pegasus Exclusif': pdm({ c: '#111111', stripes: true, band: 'ROYAL ESSENCE', panel: '#8a8c90' }),
    'pdm|Herod': pdm({ c: '#3a2e28' }),
    'pdm|Sedley': pdm({ c: '#8fb0cc', name2: '#ffffff' }),
    'pdm|Percival': pdm({ c: '#a7c4e0', name2: '#ffffff' }),
    'pdm|Greenley': pdm({ c: '#9cc9b2', name2: '#ffffff' }),
    'pdm|Carlisle': pdm({ c: '#23493c' }),
    'pdm|Kalan': pdm({ c: '#b8281e', metal: 0.45, rule: true, foil: '#e2e4e6' }),
    'pdm|Haltane': pdm({ c: '#8a5a3a' }),
    'pdm|Althaïr': pdm({ c: '#c77a35', name2: '#ffffff' }),
    'pdm|Godolphin': pdm({ c: '#b0894f', name2: '#ffffff' }),
    'pdm|Galloway': pdm({ c: '#e7dca0', foil: '#a8aaae', name2: '#8a8c90' }),
    'pdm|Oajan': pdm({ c: '#b5653a' }),
    'pdm|Darley': pdm({ c: '#4a5262' }),
    'pdm|Delina': pdm({ c: '#e9cfc9', foil: '#b4b6ba', name2: '#ffffff' }),
    'pdm|Valaya': pdm({ c: '#f2eee6', foil: '#a8aaae', name2: '#9a9ca0' }),

    /* Byredo */
    byredo,

    /* Maison Francis Kurkdjian */
    mfk: mfk({ paper: '#f7f6f3', panel: ['#9a7a3a', '#d9b866', '#a8843c'] }),
    'mfk|Baccarat Rouge 540': mfk({ paper: '#f7f6f3', house: '#b08a4a', name: '#6b1b2b', n1: 'Baccarat', n2: 'Rouge 540', side: true }),
    'mfk|Baccarat Rouge 540 Extrait': mfk({ paper: '#d0141c', gloss: true, speck: 'rgba(0,0,0,0.05)', house: '#d4af6a', name: '#d4af6a', n1: 'Baccarat', n2: 'Rouge 540', conc: 'Extrait de parfum', emb: 'rgba(255,255,255,0.1)' }),
    'mfk|Oud Satin Mood': mfk({ paper: '#3a2546', speck: 'rgba(255,255,255,0.03)', house: '#d4af6a', name: '#d4af6a', n1: 'satin mood', n2: 'OUD', emb: 'rgba(255,255,255,0.08)' }),
    'mfk|Oud Silk Mood': mfk({ paper: '#2b59a7', speck: 'rgba(255,255,255,0.03)', house: '#d4af6a', name: '#d4af6a', n1: 'silk mood', n2: 'OUD', emb: 'rgba(255,255,255,0.08)' }),
    'mfk|Aqua Universalis': mfk({ paper: '#f7f6f3', panel: ['#7a5a1e', '#d6b25e', '#8a6a2a'] }),
    'mfk|Grand Soir': mfk({ paper: '#f7f6f3', panel: ['#8a4a14', '#d98a3a', '#9a5a1e'] }),
    'mfk|Gentle Fluidity Gold': mfk({ paper: '#f7f6f3', panel: ['#9a7a3a', '#e0c070', '#a8843c'], n1: 'Gentle Fluidity', n2: 'Gold' }),
    'mfk|Gentle Fluidity Silver': mfk({ paper: '#f7f6f3', panel: ['#8a8c90', '#e2e4e6', '#9a9ca0'], n1: 'Gentle Fluidity', n2: 'Silver' }),
    'mfk|Petit Matin': mfk({ paper: '#f7f6f3', panel: ['#c8b46a', '#f0e2a0', '#c8b46a'], pink: '#6a5a2a' }),
    'mfk|Amyris Homme': mfk({ paper: '#f7f6f3', panel: ['#7a8ea0', '#c8d6e2', '#8a9cae'], conc: 'Eau de toilette' }),

    /* Clive Christian */
    clive: clive({ c: '#121212', em: 'X', coll: CO, desc: ['A TIMELESS BLEND OF RARE AND', 'PRECIOUS INGREDIENTS CRAFTED', 'IN THE TRADITION OF THE HOUSE'] }),
    'clive|1872 Masculine': clive({ c: '#19a05a', em: '1872', coll: CO, desc: ['FRESH CITRUS NOTES WITH AN INTENSELY', 'AROMATIC HEART OF CLARY SAGE TO CREATE', 'THE MASCULINE PERFUME OF THE PERFECT PAIR'] }),
    'clive|X Masculine': clive({ c: '#121212', em: 'X', coll: CO, desc: ['A SEDUCTIVE BLEND OF PINEAPPLE', 'AND CARDAMOM ON A WARM HEART', 'OF ORRIS, CEDAR AND VETIVER'] }),
    'clive|No.1 Masculine': clive({ c: '#efe8d8', g: '#b8923e', em: 'No1', coll: CO, desc: ['THE WORLD\'S MOST EXCLUSIVE PERFUME', 'LIME, CARDAMOM AND NUTMEG ON A', 'HEART OF SANDALWOOD AND VETIVER'] }),
    'clive|C Masculine': clive({ c: '#b97f6e', metal: 0.5, em: 'C', coll: CP, desc: ['A WARM SPICED ORIENTAL OF', 'CARDAMOM, INCENSE AND OUD', 'ON A BASE OF RICH LEATHER'] }),
    'clive|V Masculine': clive({ c: '#b97f6e', metal: 0.5, em: 'V', coll: CP, desc: ['A VIBRANT FOUGERE OF MANDARIN', 'AND BLACK PEPPER WITH CRISP', 'LAVENDER AND MOSSY WOODS'] }),
    'clive|Town & Country': clive({ c: '#b97f6e', metal: 0.5, em: 'T', coll: CP, desc: ['GREEN FLORAL ALIVE WITH AROMATIC', 'CHAMOMILE AND SCOTTISH HEATHER A JOURNEY', 'OF RUGGED COASTS AND HIGHLAND PEAKS'] }),
    'clive|Jump Up and Kiss Me Hedonistic': clive({ c: '#b97f6e', metal: 0.5, em: 'J', coll: CP, desc: ['A HEDONISTIC FLORAL OF TUBEROSE', 'AND JASMINE WRAPPED IN WARM', 'VANILLA AND CREAMY SANDALWOOD'] }),
    'clive|Matsukita': clive({ c: '#8a5446', metal: 0.5, em: 'M', coll: CP, desc: ['A SMOKY JAPANESE LEATHER OF', 'BIRCH TAR AND PINE NEEDLES OVER', 'A BED OF OUD AND AGARWOOD'] }),
    'clive|No.1 Imperial Majesty': cliveChest,

    /* Xerjoff */
    xerjoff: xerjoff({ kind: '1861', c: '#e6e4df', band: '#d6d3cc', edge: '#f4f3f0', g: '#b8955a', x1: '#5a2a5e', x2: '#b8864a', ink: '#8a7a5a', ink2: '#6a6a6a', lining: '#5a2a6a' }),
    'xerjoff|Naxos': xerjoff({ kind: '1861', c: '#e6e4df', band: '#d6d3cc', edge: '#f4f3f0', g: '#b8955a', x1: '#5a2a5e', x2: '#b8864a', ink: '#8a7a5a', ink2: '#6a6a6a', lining: '#4a2232' }),
    'xerjoff|Torino21': xerjoff({ kind: '1861', c: '#e6e4df', band: '#d6d3cc', edge: '#f4f3f0', g: '#b8955a', x1: '#1e2350', x2: '#b8864a', ink: '#8a7a5a', ink2: '#1e2350', lining: '#1e2350' }),
    'xerjoff|Mefisto': xerjoff({ kind: '1861', c: '#e6e4df', band: '#d6d3cc', edge: '#f4f3f0', g: '#b8955a', x1: '#4a7aa8', x2: '#b8864a', ink: '#8a7a5a', ink2: '#4a6a8a', lining: '#4a2232' }),
    'xerjoff|Accento': xerjoff({ c: '#5a2bd0', band: '#4a1eb0', edge: '#8a6ae8', x2: '#e8d4a0', ink: '#ffffff' }),
    'xerjoff|Erba Pura': xerjoff({ c: '#1a8fa3', band: '#137080', edge: '#4ab0c0', x2: '#b8864a', ink: '#f0d9a0', ink2: '#f2f2f2' }),
    'xerjoff|More Than Words': xerjoff({ kind: 'jtc', c: '#1e2350' }),
    'xerjoff|40 Knots': xerjoff({ kind: 'jtc', c: '#1e2350' }),
    'xerjoff|Alexandria II': xerjoff({ kind: 'stars', c: '#3a1d1a', field: '#a8724c', g: '#d9b56a' }),

    /* Baccarat */
    baccarat,

    /* Kilian */
    kilian,

    /* Roja */
    roja: rojaPH('ROJA'),
    'roja|Elysium Pour Homme': rojaPH('ELYSIUM'),
    'roja|Enigma Pour Homme': rojaPH('ENIGMA'),
    'roja|Danger Pour Homme': rojaPH('DANGER'),
    'roja|Burlington 1819': roja({ c: '#1d1d1f', draw: burlington }),
    'roja|Isola Blu': roja({ c: '#f7f6f2', lin: 'rgba(0,0,0,0.02)', draw: isola }),
    'roja|Apex': roja({ c: '#141414', rw: 0.9, lid: 0.95, band: false, g: '#c8c8c8', lining: '#141414', draw: apex }),
    'roja|Diaghilev': cabinet(false),
    'roja|Haute Luxe': cabinet(true),

    /* Amouage */
    amouage: amouage({ bg: '#2a1e3a', ops: [['b', '#4a3a6a', 0.2, 0.2, 0.25], ['b', '#c9a45a', 0.85, 0.8, 0.2], ['s', '#e6cf98', 0.1, 0.9, 0.9, 0.2, 0.01]] }),
    'amouage|Interlude Man': amouage({ bg: '#bdb7ae', side: '#c98226', ops: [['b', '#d9922e', 0.85, 0.4, 0.42], ['b', '#c98226', 0.8, 0.95, 0.3], ['b', '#9a8a7a', 0.25, 0.35, 0.18], ['c', '#e8b040', 0.8, 0.2, 0.045], ['c', '#e8b040', 0.93, 0.3, 0.035], ['b', '#f2f2ee', 0.45, 0.04, 0.05], ['s', '#2a2420', 0.05, 0.25, 0.2, 0.95, 0.035, -0.05], ['s', '#5a5048', 0.13, 0.15, 0.3, 0.95, 0.02, -0.05], ['b', '#2a4f7a', 0.3, 0.98, 0.18, 3, 1.5, 0.6], ['s', '#2a4f7a', 0.98, 0.42, 0.2, 0.8, 0.05], ['s', '#141414', 0.95, 0.5, 0.25, 0.86, 0.025], ['s', '#7a3a8a', 0.98, 0.47, 0.35, 0.8, 0.012], ['s', '#3a9a5a', 0.6, 0.15, 0.45, 0.3, 0.02], ['s', '#d84a2a', 0.9, 0.58, 0.3, 0.92, 0.012]] }),
    'amouage|Reflection Man': amouage({ bg: '#141414', silver: true, ops: [['g', 'rgba(255,255,255,0.35)', 2600, 0.5, 0.5, 0.75], ['b', '#6a6a6a', 0.3, 0.6, 0.32, 4, 1.4, 0.75], ['g', 'rgba(255,255,255,0.7)', 2200, 0.55, 0.55, 0.3], ['b', '#cfcfd4', 0.62, 0.55, 0.16, 5], ['b', '#b3a7c4', 0.48, 0.42, 0.12, 7], ['b', '#b3a7c4', 0.62, 0.8, 0.08, 2]] }),
    'amouage|Jubilation XXV': amouage({ bg: '#8f8a82', ops: [['b', '#e8e6e2', 0.28, 0.55, 0.32, 2, 1, 1.3], ['b', '#c7a252', 0.7, 0.18, 0.25, 5, 1.3, 0.8], ['b', '#d9c48a', 0.25, 0.42, 0.1, 3], ['g', '#c7a252', 900, 0.3, 0.45, 0.15], ['s', '#1a1a1a', 0.12, 0.3, 0.12, 0.6, 0.045, 0], ['s', '#2a2a2a', 0.6, 0.78, 0.62, 0.99, 0.08, 0], ['s', '#c7a252', 0.2, 0.75, 0.22, 0.95, 0.05, 0], ['b', '#5a5650', 0.95, 0.75, 0.18]] }),
    'amouage|Epic Man': amouage({ bg: '#101010', ops: [['b', '#4d6b2e', 0.62, 0.12, 0.12, 3, 1, 1.4], ['b', '#4d6b2e', 0.32, 0.78, 0.1, 5, 1.8, 0.6], ['b', '#3a5a22', 0.48, 0.95, 0.07, 2], ['b', '#e8e8e8', 0.17, 0.5, 0.07, 4, 0.8, 1.6], ['b', '#9a9a9a', 0.82, 0.62, 0.1, 6, 1, 1.5], ['b', '#d8d8d8', 0.84, 0.55, 0.05, 1]] }),
    'amouage|Guidance': amouage({ bg: '#e8dccb', taupe: true, ops: [['b', '#d9a99a', 0.25, 0.12, 0.25, 3, 1.2, 0.8], ['b', '#3a1a12', 0.1, 0.45, 0.2, 6, 0.8, 1.3], ['b', '#f0e6dc', 0.15, 0.5, 0.06, 2], ['b', '#6a2a1a', 0.58, 0.1, 0.17, 1], ['b', '#5a2418', 0.7, 0.9, 0.2, 4, 1.5, 0.8], ['b', '#c48a6a', 0.92, 0.55, 0.16, 2, 0.8, 1.5], ['b', '#9a4a2e', 0.85, 0.35, 0.06, 5], ['g', '#5a2418', 400, 0.3, 0.88, 0.12]] }),
    'amouage|Enclave': amouage({ bg: '#c9d6e2', taupe: true, ops: [['b', '#8aa4bc', 0.3, 0.3, 0.16, 2], ['s', '#2a5a7a', 0.2, 0.25, 0.25, 0.95, 0.06, 0.02], ['s', '#4a7a9a', 0.32, 0.3, 0.35, 0.95, 0.06, 0.02], ['b', '#6c7c88', 0.22, 0.75, 0.1, 4], ['b', '#8a4a2a', 0.5, 0.12, 0.05, 3], ['b', '#3a6a8a', 0.75, 0.75, 0.12, 5], ['b', '#b8925a', 0.8, 0.7, 0.06, 1], ['b', '#e8eef2', 0.75, 0.2, 0.15, 6]] }),
    'amouage|Purpose': amouage({ bg: '#5a6448', taupe: true, ops: [['b', '#7a8458', 0.8, 0.3, 0.25, 2], ['b', '#c69a4a', 0.15, 0.3, 0.15, 3], ['b', '#b0805a', 0.32, 0.15, 0.12, 4], ['b', '#141414', 0.68, 0.62, 0.18, 1, 1, 1.1], ['b', '#e6dcc7', 0.12, 0.6, 0.09, 5], ['b', '#4a3020', 0.3, 0.97, 0.2, 2, 1.6, 0.6], ['s', '#a8c890', 0.42, 0.65, 0.45, 0.98, 0.04, 0.02], ['s', '#d8e8c0', 0.46, 0.65, 0.49, 0.98, 0.006, 0.02]] }),
    'amouage|Beach Hut Man': amouage({ bg: '#1e3a33', name: 'BEACH HUT', ops: [['b', '#ececec', 0.15, 0.4, 0.07, 3, 0.8, 1.6], ['b', '#f2f2f2', 0.62, 0.08, 0.07, 2, 1.2, 1], ['b', '#ececec', 0.32, 0.9, 0.11, 5, 1.6, 0.7], ['b', '#bfbfbf', 0.72, 0.74, 0.11, 6, 1.4, 0.8], ['b', '#4a2a3a', 0.24, 0.6, 0.1, 4], ['b', '#3a2a30', 0.38, 0.25, 0.08, 1], ['b', '#c96a5a', 0.6, 0.62, 0.025, 2], ['s', '#ffffff', 0.3, 0.1, 0.32, 0.3, 0.003]] }),
    'amouage|Memoir Man': amouage({ bg: '#141414', silver: true, ops: [['b', '#d9d9d9', 0.28, 0.12, 0.08, 2, 2.4, 0.6], ['b', '#bfbfbf', 0.12, 0.45, 0.07, 5, 1.2, 0.8], ['b', '#e8e8e8', 0.8, 0.14, 0.05, 3, 1.4, 0.6], ['b', '#d9d9d9', 0.9, 0.5, 0.05, 4, 1.6, 0.5], ['s', '#d9d9d9', 0.38, 0.73, 0.9, 0.69, 0.008, 0.02], ['g', 'rgba(255,255,255,0.4)', 700, 0.3, 0.3, 0.2]] }),

    /* Initio */
    initio: initio({ c: '#26262a' }),
    'initio|Oud for Greatness': initio({ c: '#26262a', eye: true }),
    'initio|Absolute Aphrodisiac': initio({ c: '#26262a', g: '#c99a86' }),
    'initio|Side Effect': initio({ c: '#221828', g: '#e6d7b0' }),
    'initio|Psychedelic Love': initio({ c: '#221828', g: '#e6d7b0' }),
    'initio|High Frequency': initio({ c: '#221828', g: '#e6d7b0' }),
    'initio|Narcotic Delight': initio({ c: '#221828', g: '#e6d7b0' }),
    'initio|Atomic Rose': initio({ c: '#221828', g: '#d9a080' }),
    'initio|Rehab': initio({ c: '#f2f0ec', g: '#9a9ea2' }),
    'initio|Musk Therapy': initio({ c: '#f2f0ec', g: '#c8a45a' }),
    'initio|Paragon': initio({ c: '#f2f0ec', g: '#c98a6a' }),

    /* Nishane */
    nishane: nishane({ c: '#47389f' }),
    'nishane|Hacivat': nishane({ c: '#141414', lattice: true }),
    'nishane|Karagöz': nishane({ c: '#141414', lattice: true }),
    'nishane|Ani': nishane({ c: '#47389f' }),
    'nishane|Fan Your Flames': nishane({ c: '#01545f' }),
    'nishane|Hundred Silent Ways': nishane({ c: '#01545f' }),
    'nishane|Wulong Cha': nishane({ c: '#e6dcb8', g: '#c4a862' }),
    'nishane|Ege': nishane({ c: '#3a8fb0' }),
    'nishane|Tempfluo': nishane({ c: '#7a5a34' }),
  });
})();
