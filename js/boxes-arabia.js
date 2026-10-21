/* Sillage — retail boxes for the Middle-Eastern houses (Lattafa, Afnan, Rayhaan, Armaf, Rasasi,
 * The Spirit of Dubai), from photos of the real packaging. The ornament (damask, star lattice,
 * mosaics, gold frames) is drawn procedurally; y is measured from the top of the box face.
 */
(() => {
  const { prop, tx, rnd, stipple, brushed, pinstripe, waves, fullBg, seal } = BoxCraft.lib;
  const G = '#c9a24f', GOLD = ['#f3dc9a', '#c9a24f', '#8a6a2a', '#e6c87a'];

  /* ---------- drawing helpers ---------- */
  const ax = (P) => P.H / P.W;
  // Arabic (drawn whole so the letters join), script (italic serif) and spaced caps.
  const ar = (P, s, y, h, col, o = {}) => P.text(s, o.x != null ? o.x : 0.5, y, h * 1.45, col, Object.assign({ font: 'arabic', weight: 500, maxW: 0.8 }, o));
  const scr = (P, s, y, cap, col, o = {}) => tx(P, s, y, cap, col, 'serif', Object.assign({ italic: true, weight: 400 }, o));
  // Text at a transform (rotated or condensed): P.text at the origin of a moved context.
  function at(P, x, y, rot, sx, fn) { const g = P.g; g.save(); g.translate(x * P.W, y * P.H); if (rot) g.rotate(rot); if (sx !== 1) g.scale(sx, 1); fn(); g.restore(); }
  const vtext = (P, s, x, y, size, col, o = {}) => at(P, x, y, -Math.PI / 2, 1, () => P.text(s, 0, 0, size, col, Object.assign({ maxW: 9 }, o)));
  const ctext = (P, s, x, y, size, col, sx, o = {}) => at(P, x, y, 0, sx, () => P.text(s, 0, 0, size, col, Object.assign({ maxW: 9 }, o)));
  // Gradients in face fractions.
  function lin(P, x0, y0, x1, y1, stops) { const g = P.g.createLinearGradient(x0 * P.W, y0 * P.H, x1 * P.W, y1 * P.H); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; }
  function radial(P, x, y, r, stops) { const g = P.g.createRadialGradient(x * P.W, y * P.H, 0, x * P.W, y * P.H, r * P.H); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; }
  const box = (P, x, y, w, h, fill) => { P.g.fillStyle = fill; P.g.fillRect(x * P.W, y * P.H, w * P.W, h * P.H); };
  const foil = (P, x, y, w, h, st = GOLD) => box(P, x, y, w, h, lin(P, x, y, x + w, y + h, st));
  // Polygon helpers in height units around a centre (aspect corrected).
  const poly = (P, x, y, pts, col, fill = true, lw) => P.path(pts.map(([u, v]) => [x + u * ax(P), y + v]).concat(fill ? [] : [[x + pts[0][0] * ax(P), y + pts[0][1]]]), col, fill, lw);
  const starPts = (r, n = 8, k = 0.72, rot = Math.PI / 8) => Array.from({ length: n * 2 }, (_, i) => { const a = rot + (i * Math.PI) / n, q = i % 2 ? r * k : r; return [Math.cos(a) * q, Math.sin(a) * q]; });
  const sqPts = (h, a) => [[-h, -h], [h, -h], [h, h], [-h, h]].map(([u, v]) => [u * Math.cos(a) - v * Math.sin(a), u * Math.sin(a) + v * Math.cos(a)]);
  function clip(P, x, y, w, h, fn) { P.g.save(); P.g.beginPath(); P.g.rect(x * P.W, y * P.H, w * P.W, h * P.H); P.g.clip(); fn(); P.g.restore(); }
  function clipPoly(P, pts, fn) { const g = P.g; g.save(); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x * P.W, y * P.H) : g.moveTo(x * P.W, y * P.H))); g.closePath(); g.clip(); fn(); g.restore(); }

  // A damask palmette (leaf, curled scrolls, bud) and an all-over ogee repeat of it.
  function motif(P, x, y, s, col) {
    const a = ax(P), g = P.g;
    P.ellipse(x, y, s * 0.07 * a, s * 0.3, 0, col); P.circle(x, y - s * 0.4, s * 0.06, col);
    for (const d of [-1, 1]) {
      P.ellipse(x + d * s * 0.15 * a, y + s * 0.02, s * 0.05 * a, s * 0.22, d * 0.55, col);
      P.ellipse(x + d * s * 0.13 * a, y - s * 0.26, s * 0.035 * a, s * 0.12, -d * 0.7, col);
      g.save(); g.strokeStyle = col; g.lineWidth = s * 0.045 * P.H; g.beginPath();
      g.arc((x + d * s * 0.28 * a) * P.W, (y + s * 0.22) * P.H, s * 0.1 * P.H, d > 0 ? Math.PI : 0, d > 0 ? Math.PI * 2.5 : -Math.PI * 1.5, d < 0); g.stroke(); g.restore();
    }
  }
  function damask(P, col, s = 0.12, cw = 0.33, ch = 0.16, o = {}) {
    const lw = o.lw || s * 0.05;
    for (let c = -1; c * cw < 1.1; c++) for (const d of [-1, 1]) P.path(Array.from({ length: 61 }, (_, j) => { const y = j / 60 * 1.1 - 0.05; return [c * cw + cw / 2 + d * (cw / 2) * Math.cos((Math.PI * y) / ch), y]; }), col, false, lw);
    for (let r = -1; r * ch < 1.1; r++) for (let c = -1; c * cw < 1.1; c++) {
      motif(P, c * cw + cw / 2, r * ch + ch * 0.05, s, col);
      const x = c * cw, y = r * ch + ch / 2; P.circle(x + cw / 2, y, s * 0.06, col);
      for (let k = 0; k < 4; k++) P.ellipse(x + cw / 2 + Math.cos(k * Math.PI / 2) * s * 0.1 * ax(P), y + Math.sin(k * Math.PI / 2) * s * 0.1, s * 0.05 * ax(P), s * 0.03, k * Math.PI / 2, col);
    }
  }
  // Islamic 8-point star lattice: foil bands left between star-shaped holes.
  function lattice(P, band, hole, c = 0.11, o = {}) {
    if (band) fullBg(P, band);
    const a = ax(P), cw = c * a;
    for (let y = 0; y < 1 + c; y += c) for (let x = (o.x0 || 0); x < 1 + cw; x += cw) {
      poly(P, x, y, starPts(c * 0.4), hole);
      poly(P, x + cw / 2, y + c / 2, sqPts(c * 0.13, Math.PI / 4), hole);
      [[0.5, 0], [0, 0.5]].forEach(([u, v]) => P.ellipse(x + u * cw, y + v * c, (u ? 0.07 : 0.025) * c * a * 3, (v ? 0.07 : 0.025) * c * 3, 0, hole));
      if (o.line) poly(P, x, y, starPts(c * 0.47), o.line, false, 0.0018);
    }
  }
  // Pierced girih screen: thick foil bands (interlaced squares, stars and links) over the ground.
  function girih(P, ground, band, c = 0.12, o = {}) {
    if (ground) fullBg(P, ground);
    const a = ax(P), cw = c * a, lw = o.lw || c * 0.09;
    for (let y = 0; y < 1 + c; y += c) for (let x = (o.x0 || 0); x < 1 + cw; x += cw) {
      poly(P, x, y, sqPts(c * 0.27, 0), band, false, lw); poly(P, x, y, sqPts(c * 0.27, Math.PI / 4), band, false, lw);
      poly(P, x, y, starPts(c * 0.13), band);
      poly(P, x + cw / 2, y + c / 2, sqPts(c * 0.12, Math.PI / 4), band, false, lw);
      P.line(x + c * 0.38 * a, y, x + cw - c * 0.38 * a, y, band, lw); P.line(x, y + c * 0.38, x, y + c - c * 0.38, band, lw);
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([u, v]) => P.line(x + u * c * 0.27 * a, y + v * c * 0.27, x + u * c * 0.38 * a, y + v * c * 0.38, band, lw * 0.8));
    }
  }
  // Wood grain band.
  function wood(P, y0, y1, [base, light, dark], vertical) {
    box(P, vertical ? 0 : 0, y0, 1, y1 - y0, base);
    clip(P, 0, y0, 1, y1 - y0, () => {
      for (let i = 0; i < 90; i++) {
        const c = i % 3 ? light : dark, t = rnd(i * 3.1);
        if (vertical) P.path(Array.from({ length: 9 }, (_, j) => [t + Math.sin(j * 0.8 + i) * 0.006, y0 + (j / 8) * (y1 - y0)]), c, false, 0.001 + rnd(i) * 0.002);
        else P.path(Array.from({ length: 9 }, (_, j) => [j / 8, y0 + t * (y1 - y0) + Math.sin(j * 0.9 + i) * 0.002]), c, false, 0.0008 + rnd(i) * 0.0015);
      }
    });
  }
  // Flowing tone-on-tone calligraphy strokes.
  function callig(P, col, n = 9, lw = 0.02, seed = 1) {
    const g = P.g; g.save(); g.strokeStyle = col; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const r = (k) => rnd(seed * 31 + i * 7 + k);
      g.lineWidth = lw * P.H * (0.4 + r(1)); g.beginPath();
      g.moveTo(r(2) * P.W, r(3) * P.H);
      g.bezierCurveTo(r(4) * P.W, r(5) * P.H, r(6) * P.W, r(7) * P.H, r(8) * P.W, r(9) * P.H); g.stroke();
    }
    g.restore();
  }
  // Rounded Arabic-style medallion rosette (8-fold) at x, y.
  function rosette(P, x, y, r, col, lw = 0.002) {
    P.circle(x, y, r, col, lw); P.circle(x, y, r * 0.84, col, lw);
    poly(P, x, y, sqPts(r * 0.58, 0), col, false, lw); poly(P, x, y, sqPts(r * 0.58, Math.PI / 4), col, false, lw);
    poly(P, x, y, starPts(r * 0.34), col, false, lw); P.circle(x, y, r * 0.12, col);
    for (let i = 0; i < 16; i++) { const t = (i / 16) * Math.PI * 2; P.circle(x + Math.cos(t) * r * 0.92 * ax(P), y + Math.sin(t) * r * 0.92, r * 0.035, col); }
  }
  const beads = (P, x, y, w, h, n, r, col) => { for (let i = 0; i <= n; i++) { const t = i / n; [[x + w * t, y], [x + w * t, y + h]].forEach(([u, v]) => P.circle(u, v, r, col)); } const m = Math.round(n * h / w / ax(P)); for (let i = 0; i <= m; i++) { const t = i / m; [[x, y + h * t], [x + w, y + h * t]].forEach(([u, v]) => P.circle(u, v, r, col)); } };
  const rule = (P, y, w, col, lw = 0.002) => { P.line(0.5 - w / 2, y, 0.5 + w / 2, y, col, lw); P.circle(0.5 - w / 2, y, lw * 2.2, col); P.circle(0.5 + w / 2, y, lw * 2.2, col); };
  // Text set round a circle (seals).
  function ring(P, s, x, y, r, size, col, font = 'sans') { const ch = [...s], n = ch.length; ch.forEach((c, i) => { const t = -Math.PI / 2 + (i / n) * Math.PI * 2; at(P, x + Math.cos(t) * r * ax(P), y + Math.sin(t) * r, t + Math.PI / 2, 1, () => P.text(c, 0, 0, size, col, { font, weight: 600 })); }); }
  const lattafa = (P, y, cap, col) => tx(P, 'Lattafa', y, cap, col, 'sans', { weight: 300 });
  const carton = (o, fn) => (item, fit) => Object.assign(prop(fit, o.rw, o.rd), { open: 'flap', paper: { color: o.paper, rough: o.rough != null ? o.rough : 0.6, metal: o.metal || 0 }, lining: o.lining || '#141414' }, fn(item, fit));

  /* ================= LATTAFA ================= */
  // Khamrah: rigid lid over a wood-grain base, gold frame and two tilted squares.
  const khamrah = (o) => (item, fit) => Object.assign(prop(fit, 0.8, 0.62), {
    lid: 0.86, paper: { color: o.lid, rough: 0.85 }, lining: '#141414',
    front: (P) => {
      fullBg(P, o.lid); wood(P, 0.86, 1, o.wood);
      P.frame(0.07, 0.045, 0.86, 0.785, G, 0.006);
      [0.1, -0.07].forEach((a) => poly(P, 0.5, o.ey, sqPts(0.155, a), G, false, 0.0035));
      ar(P, 'خمرة', o.ey - 0.03, 0.065, G, { weight: 400 });
      tx(P, 'KHAMRAH', o.ey + 0.045, 0.016, G, 'sans', { weight: 700, track: 0.15 });
      if (o.sub) tx(P, o.sub, 0.62, 0.016, G, 'sans', { weight: 700, track: 0.25 });
      lattafa(P, o.ly, 0.02, G);
    },
    top: (P) => fullBg(P, o.lid),
  });
  // Asad: black carton, gold Greek-key lion medallion.
  const lionMedal = (P, x, y, r, col, dark) => {
    P.circle(x, y, r, lin(P, x - r, y - r, x + r, y + r, GOLD)); P.circle(x, y, r * 0.93, dark, 0.003);
    for (let i = 0; i < 28; i++) { const t = (i / 28) * Math.PI * 2, c = Math.cos(t) * ax(P), s = Math.sin(t); P.line(x + c * r * 0.76, y + s * r * 0.76, x + c * r * 0.9, y + s * r * 0.9, dark, 0.0025); P.line(x + c * r * 0.83, y + s * r * 0.83, x + Math.cos(t + 0.1) * ax(P) * r * 0.83, y + Math.sin(t + 0.1) * r * 0.83, dark, 0.0025); }
    P.circle(x, y, r * 0.73, dark, 0.003);
    for (let i = 0; i < 24; i++) { const t = (i / 24) * Math.PI * 2; P.line(x + Math.cos(t) * ax(P) * r * 0.35, y + Math.sin(t) * r * 0.35, x + Math.cos(t) * ax(P) * r * 0.62, y + Math.sin(t) * r * 0.62, dark, 0.002); }
    P.ellipse(x - r * 0.12 * ax(P), y - r * 0.05, r * 0.06 * ax(P), r * 0.03, 0, dark); P.ellipse(x + r * 0.12 * ax(P), y - r * 0.05, r * 0.06 * ax(P), r * 0.03, 0, dark);
    poly(P, x, y + r * 0.1, [[-0.06 * r, 0], [0.06 * r, 0], [0, 0.08 * r]], dark);
  };
  const asad = carton({ rw: 0.72, rd: 0.42, paper: '#222222', rough: 0.85 }, () => ({
    front: (P) => {
      fullBg(P, '#222222'); stipple(P, 'rgba(255,255,255,0.025)');
      tx(P, 'EAU DE PARFUM', 0.06, 0.012, '#c9a85a', 'sans', { track: 0.2 });
      tx(P, '100ml℮  NATURAL SPRAY · VAPORISATEUR  3.4FL.OZ', 0.09, 0.008, '#c9a85a', 'sans', { maxW: 0.8 });
      lionMedal(P, 0.5, 0.33, 0.15, '#d6bb74', '#3a2e14');
      ar(P, 'أسد', 0.65, 0.1, '#d6bb74', { weight: 700 });
      tx(P, 'ASAD', 0.77, 0.032, '#d6bb74', 'serif', { weight: 500, track: 0.06 });
      rule(P, 0.82, 0.45, '#c9a85a', 0.0018); lattafa(P, 0.9, 0.022, '#c9a85a');
    },
  }));
  // Bade'e Al Oud: framed acetate window showing the gold-diamond bottle.
  const badee = (o) => carton({ rw: 0.72, rd: 0.42, paper: o.paper, rough: 0.8 }, () => ({
    front: (P) => {
      fullBg(P, o.paper); const g = '#b8975a';
      P.frame(0.12, 0.09, 0.76, 0.79, g, 0.004); P.frame(0.145, 0.105, 0.71, 0.76, g, 0.0015); beads(P, 0.13, 0.097, 0.74, 0.776, 46, 0.0022, g);
      box(P, 0.17, 0.12, 0.66, 0.73, '#0b0b0c');
      P.rect(0.25, 0.3, 0.5, 0.52, '#18181a', 0.02); P.rect(0.38, 0.22, 0.24, 0.08, '#141416');
      const cx = 0.5, cy = 0.56; [0.13, 0.1, 0.07].forEach((h, i) => poly(P, cx, cy, sqPts(h, Math.PI / 4), i === 1 ? '#0c0c0c' : g, i !== 1));
      ar(P, 'بديع العود', cy - 0.012, 0.018, '#0c0c0c', { maxW: 0.16 });
      P.path([[0.17, 0.12], [0.36, 0.12], [0.17, 0.4]], 'rgba(255,255,255,0.06)');
      tx(P, o.top, 0.035, 0.014, g, 'serif', { weight: 600, track: 0.25 }); lattafa(P, 0.065, 0.011, g);
      ar(P, 'بديع العود', 0.912, 0.03, g); tx(P, "BADE'E AL OUD", 0.955, 0.013, g, 'serif', { weight: 600, track: 0.2 });
    },
  }));
  // Fakhar: embossed silver damask panel with a raised name plaque.
  const fakhar = carton({ rw: 0.7, rd: 0.42, paper: '#252523', rough: 0.8 }, () => ({
    front: (P) => {
      fullBg(P, '#252523'); foil(P, 0.06, 0.05, 0.88, 0.9, ['#cfcfcf', '#9a9a9a', '#c4c4c4', '#8a8a8a']);
      clip(P, 0.08, 0.07, 0.84, 0.86, () => { damask(P, 'rgba(60,60,60,0.5)', 0.16, 0.42, 0.24); at(P, -0.004, -0.003, 0, 1, () => damask(P, 'rgba(250,250,250,0.85)', 0.16, 0.42, 0.24)); });
      P.frame(0.075, 0.065, 0.85, 0.87, '#8a8a8a', 0.005); for (let i = 0; i < 60; i++) { const t = i / 60; P.line(0.07 + t * 0.86, 0.058, 0.075 + t * 0.86, 0.072, '#f4f4f4', 0.0015); P.line(0.07 + t * 0.86, 0.928, 0.075 + t * 0.86, 0.942, '#f4f4f4', 0.0015); }
      P.rect(0.29, 0.355, 0.42, 0.27, '#8e8e8e'); foil(P, 0.3, 0.36, 0.4, 0.26, ['#e8e8e8', '#c4c4c4', '#dcdcdc']); P.frame(0.315, 0.375, 0.37, 0.23, '#9a9a9a', 0.002);
      ar(P, 'فخر لطافة', 0.43, 0.04, '#8a8a8a', { maxW: 0.34 }); scr(P, 'Fakhar Lattafa', 0.5, 0.022, '#6a6a6a', { maxW: 0.34 }); lattafa(P, 0.56, 0.01, '#6a6a6a');
      P.rect(0.3, 0.845, 0.4, 0.035, '#a0a0a0', 0.01); tx(P, 'PRIDE OF LATTAFA', 0.863, 0.011, '#5a5a5a', 'serif', { weight: 600, track: 0.1 });
    },
  }));
  // Yara: pearly pink with white damask, tall silver Arabic and a round seal.
  const yara = carton({ rw: 0.59, rd: 0.4, paper: '#c48aa6', rough: 0.45, metal: 0.15 }, () => ({
    front: (P) => {
      fullBg(P, '#c48aa6'); box(P, 0, 0, 1, 0.86, radial(P, 0.5, 0.45, 0.6, ['#cc96b0', '#b07894']));
      clip(P, 0, 0, 1, 0.86, () => damask(P, 'rgba(255,255,255,0.4)', 0.14, 0.5, 0.22));
      box(P, 0, 0.86, 1, 0.14, '#d4b4c0'); for (let i = 0; i < 30; i++) P.line(i / 30, 0.86, i / 30 + 0.018, 0.86, '#b0a6aa', 0.002);
      foil(P, 0.68, 0.06, 0.22, 0.09, ['#d8d8d8', '#9a9a9a', '#e8e8e8', '#b0b0b0']);
      ar(P, 'يارا', 0.36, 0.14, '#8a8a8a', { weight: 300, maxW: 0.5 });
      tx(P, 'YARA', 0.585, 0.025, '#4a4a4a', 'serif', { weight: 700, track: 0.08 });
      P.circle(0.5, 0.725, 0.07, '#ecd6de'); P.circle(0.5, 0.725, 0.07, '#6a6a6a', 0.002); P.circle(0.5, 0.725, 0.045, '#6a6a6a', 0.002);
      ring(P, 'EAU DE PERFUME · NATURAL SPRAY · 100ML · 3.4 FL.OZ · ', 0.5, 0.725, 0.058, 0.009, '#6a6a6a');
      rosette(P, 0.5, 0.725, 0.035, '#6a6a6a', 0.0018); lattafa(P, 0.94, 0.018, '#7a7a7a');
    },
  }));
  // Raghba: gold board with stained-glass hexagon rosettes.
  function hexMosaic(P, y0, y1) {
    clip(P, 0, y0, 0.86, y1 - y0, () => {
      const r = 0.06, a = ax(P), cols = ['#8a2a1a', '#5a3a7a', '#d8bc80', '#c88a3a'];
      for (let row = 0, y = y0 - r; y < y1 + r; row++, y += r * 1.5) for (let x = (row % 2 ? r * 0.866 * a : 0); x < 1; x += r * 1.732 * a) {
        const hex = Array.from({ length: 6 }, (_, i) => [Math.cos(Math.PI / 6 + (i * Math.PI) / 3) * r * 0.96, Math.sin(Math.PI / 6 + (i * Math.PI) / 3) * r * 0.96]);
        poly(P, x, y, hex, '#b0802e'); poly(P, x, y, hex, '#9a7038', false, 0.003);
        for (let i = 0; i < 12; i++) { const t = (i * Math.PI) / 6; P.ellipse(x + Math.cos(t) * r * 0.55 * a, y + Math.sin(t) * r * 0.55, r * 0.24 * a, r * 0.1, t, cols[i % 2 ? 1 : 0]); }
        for (let i = 0; i < 6; i++) { const t = (i * Math.PI) / 3 + 0.5; P.ellipse(x + Math.cos(t) * r * 0.28 * a, y + Math.sin(t) * r * 0.28, r * 0.14 * a, r * 0.07, t, cols[2]); }
        P.circle(x, y, r * 0.18, cols[(row + 1) % 4]); P.circle(x, y, r * 0.08, '#e9cd8a');
      }
    });
  }
  const raghba = carton({ rw: 0.78, rd: 0.45, paper: '#e1c48f', rough: 0.35, metal: 0.45 }, () => ({
    front: (P) => {
      fullBg(P, '#b0802e'); hexMosaic(P, 0, 0.33); hexMosaic(P, 0.62, 1);
      box(P, 0, 0.33, 0.86, 0.29, lin(P, 0, 0.33, 0.86, 0.62, ['#e0bf78', '#b88a3e', '#dcb870']));
      box(P, 0.86, 0, 0.14, 1, '#924537'); P.rect(0.885, 0.04, 0.09, 0.24, '#c9a24f', 0.02); P.rect(0.9, 0.06, 0.06, 0.2, '#f1e3c2', 0.02);
      vtext(P, 'PERFUMED DEODORANT INSIDE  مزيل العرق في الداخل', 0.93, 0.64, 0.022, '#f1e3c2', { font: 'sans', weight: 600 });
      ar(P, 'رغبة', 0.42, 0.075, '#f4dc9a', { x: 0.43, weight: 700, shadow: 'rgba(90,60,10,0.6)' });
      tx(P, 'RAGHBA', 0.53, 0.018, '#f4dc9a', 'sans', { x: 0.43, track: 0.4 });
      tx(P, '℮100 ML     Eau De Parfum     3.4FL.OZ', 0.58, 0.009, '#7a3a2a', 'sans', { x: 0.43, maxW: 0.7 });
    },
  }));
  // Hayaati: tall black lid over a base, gloss-black hourglass arcs.
  const hayaati = (item, fit) => Object.assign(prop(fit, 0.55, 0.4), {
    lid: 0.77, paper: { color: '#1f1f1d', rough: 0.85 }, lining: '#111',
    front: (P) => {
      fullBg(P, '#1f1f1d'); const s = 'rgba(0,0,0,0.8)', h = 'rgba(255,255,255,0.16)';
      for (let k = 0; k < 9; k++) {
        const d = k * 0.012;
        [[0, 1], [1, -1]].forEach(([x0, dir]) => { P.path(Array.from({ length: 21 }, (_, j) => { const t = j / 20; return [x0 + dir * (0.05 + d + Math.sin(t * Math.PI) * 0.32), t * 0.77]; }), k % 2 ? h : s, false, 0.004); });
      }
      [0.2, 0.53].forEach((y) => { box(P, 0, y - 0.018, 1, 0.036, 'rgba(0,0,0,0.5)'); for (let i = 0; i < 18; i++) poly(P, (i + 0.5) / 18, y, sqPts(0.008, Math.PI / 4), h, false, 0.0015); });
      tx(P, 'HAYAATI', 0.12, 0.02, '#c8c8c8', 'serif', { weight: 600, track: 0.06 });
      ar(P, 'حياتي', 0.4, 0.07, '#c8c8c8', { weight: 300 }); lattafa(P, 0.6, 0.018, '#c8c8c8');
      box(P, 0, 0.768, 1, 0.006, '#c8c8c8'); tx(P, 'www.lattafa.com', 0.88, 0.008, '#e8e8e8', 'sans', { weight: 400 });
    },
  });
  // Qaed Al Fursan: copper-gold galloping horse over a rosette rule.
  function horse(P, x, y, s, col) {
    const a = ax(P), q = (u, v) => [x + u * s * a, y + v * s], L = (pts, w) => P.path(pts.map(([u, v]) => q(u, v)), col, false, w * s);
    P.ellipse(x, y, 0.3 * s * a, 0.13 * s, -0.08, col);
    P.path([q(0.15, -0.08), q(0.3, -0.3), q(0.42, -0.33), q(0.33, 0.02)], col);
    P.ellipse(x + 0.46 * s * a, y - 0.27 * s, 0.12 * s * a, 0.055 * s, 0.55, col);
    P.path([q(0.36, -0.36), q(0.37, -0.44), q(0.41, -0.35)], col);
    L([[0.24, 0.06], [0.42, 0.16], [0.56, 0.08]], 0.045); L([[0.2, 0.08], [0.32, 0.24], [0.46, 0.28]], 0.045);
    L([[-0.22, 0.06], [-0.42, 0.18], [-0.6, 0.16]], 0.05); L([[-0.18, 0.08], [-0.2, 0.28], [-0.1, 0.34]], 0.045);
    for (let i = 0; i < 5; i++) L([[0.32 - i * 0.03, -0.32 + i * 0.05], [0.1 - i * 0.05, -0.36 + i * 0.02], [-0.12 - i * 0.04, -0.3 + i * 0.03]], 0.018);
    L([[-0.28, -0.04], [-0.48, -0.12], [-0.66, -0.06], [-0.74, 0.04]], 0.04);
  }
  const qaed = carton({ rw: 0.75, rd: 0.4, paper: '#2b2a29', rough: 0.85 }, () => ({
    front: (P) => {
      fullBg(P, '#2b2a29');
      horse(P, 0.52, 0.29, 0.26, lin(P, 0.25, 0.13, 0.8, 0.43, ['#e3b06a', '#c08a4a', '#f0c88a', '#9a6a34']));
      P.line(0, 0.5, 1, 0.5, '#c9a24f', 0.002); [0.04, 0.96].forEach((x) => { P.circle(x, 0.5, 0.055, '#2b2a29'); rosette(P, x, 0.5, 0.055, '#c9a24f', 0.0018); });
      box(P, 0.16, 0.465, 0.68, 0.07, '#2b2a29');
      ar(P, 'قائد الفرسان', 0.49, 0.045, '#d4a95a', { maxW: 0.6 });
      tx(P, 'QAED AL FURSAN', 0.553, 0.016, '#d4a95a', 'sans', { track: 0.2 }); lattafa(P, 0.72, 0.02, '#d4a95a');
      foil(P, 0.18, 0.785, 0.64, 0.03, ['#e8c27a', '#c9a24f', '#f0d49a']); [0.17, 0.83].forEach((x) => P.circle(x, 0.8, 0.017, '#c9a24f', 0.003));
      tx(P, 'EAU DE PARFUM | NATURAL SPRAY | VAPORISATEUR', 0.8, 0.008, '#2b2a29', 'sans', { weight: 600, maxW: 0.6 });
      tx(P, '90ML℮', 0.88, 0.012, '#c9a24f', 'sans', { x: 0.3 }); tx(P, '3.04 FL.OZ.', 0.88, 0.012, '#c9a24f', 'sans', { x: 0.7 });
    },
  }));
  // Oud Mood: cream paper tube, gold arabesque lid band and a gold sash.
  const oudMood = (item, fit) => {
    const h = fit.h + 0.14;
    return {
      shape: 'round', r: h * 0.225, h, lid: h * 0.2, arc: 3.4,
      paper: { color: '#e8d8a8', rough: 0.45, metal: 0.05 }, lining: { color: '#efe2bd', rough: 0.8 }, topRim: 'gold',
      front: (P) => {
        fullBg(P, '#e8d8a8');
        clip(P, 0, 0, 1, 0.2, () => { box(P, 0, 0, 1, 0.2, '#efe2bd'); damask(P, '#b8902f', 0.07, 0.16, 0.1); });
        [0.02, 0.2, 0.22, 0.95].forEach((y) => box(P, 0, y - 0.004, 1, 0.008, '#c9a24f'));
        rosette(P, 0.5, 0.36, 0.06, '#c9a24f', 0.003);
        P.path([[0, 0.62], [1, 0.48], [1, 0.56], [0, 0.7]], lin(P, 0, 0.6, 1, 0.5, ['#a8823a', '#f2dc9a', '#c9a24f', '#f6e4b0']));
        scr(P, 'Oud Mood', 0.585, 0.035, '#3a2a14'); ar(P, 'عود مود', 0.7, 0.05, '#1a1a1a', { weight: 600 });
        lattafa(P, 0.8, 0.014, '#8a8a8a'); tx(P, 'EAU DE PARFUM', 0.84, 0.012, '#1a1a1a', 'sans', { track: 0.3 });
        tx(P, 'NATURAL SPRAY · VAPORISATEUR', 0.865, 0.007, '#1a1a1a', 'sans'); tx(P, '100ML℮  3.4 FL.OZ.', 0.89, 0.008, '#1a1a1a', 'sans');
      },
    };
  };
  // Ana Abiyedh: white embossed carton with a black top band and label.
  const anaAbiyedh = carton({ rw: 0.55, rd: 0.4, paper: '#f4f4f2', rough: 0.7, lining: '#f4f4f2' }, () => ({
    front: (P) => {
      fullBg(P, '#f4f4f2'); damask(P, 'rgba(0,0,0,0.035)', 0.14, 0.5, 0.22); callig(P, 'rgba(0,0,0,0.04)', 6, 0.02, 4);
      box(P, 0, 0, 1, 0.08, '#111111');
      box(P, 0.18, 0.4, 0.64, 0.1, '#111111');
      ar(P, 'انا الأبيض', 0.432, 0.03, '#ffffff', { maxW: 0.56 }); tx(P, 'ANA ABIYEDH', 0.478, 0.012, '#ffffff', 'serif', { track: 0.1 });
      lattafa(P, 0.87, 0.018, '#8a8a8a'); tx(P, 'EAU DE PARFUM  ℮60ML  2.0FL.OZ', 0.9, 0.007, '#9a9a9a', 'sans');
    },
    top: (P) => fullBg(P, '#111111'),
  }));

  /* ================= AFNAN ================= */
  // Afnan's calligraphic flame-leaf emblem.
  const afnanMark = (P, y, s, col) => { const a = ax(P), g = P.g; g.save(); g.strokeStyle = col; g.lineWidth = s * 0.09 * P.H; g.lineCap = 'round'; g.beginPath(); g.moveTo((0.5 - s * 0.35 * a) * P.W, (y + s * 0.45) * P.H); g.bezierCurveTo((0.5 - s * 0.6 * a) * P.W, (y - s * 0.2) * P.H, (0.5 + s * 0.1 * a) * P.W, (y - s * 0.5) * P.H, (0.5 + s * 0.45 * a) * P.W, (y - s * 0.6) * P.H); g.bezierCurveTo((0.5 + s * 0.3 * a) * P.W, (y - s * 0.1) * P.H, (0.5 + s * 0.1 * a) * P.W, (y + s * 0.3) * P.H, (0.5 - s * 0.35 * a) * P.W, (y + s * 0.45) * P.H); g.stroke(); g.beginPath(); g.moveTo((0.5 - s * 0.2 * a) * P.W, (y + s * 0.1) * P.H); g.quadraticCurveTo((0.5 + s * 0.1 * a) * P.W, (y - s * 0.05) * P.H, (0.5 + s * 0.3 * a) * P.W, (y - s * 0.4) * P.H); g.stroke(); g.restore(); };
  // The "9" family: giant condensed numeral on a ribbed board.
  const nine = (o) => carton({ rw: 0.62, rd: 0.38, paper: o.paper, rough: o.gloss ? 0.3 : 0.75 }, () => ({
    front: (P) => {
      fullBg(P, o.paper); if (o.bg) box(P, 0, 0, 1, 1, lin(P, 0, 0, 1, 1, o.bg));
      if (o.ribs !== false) { pinstripe(P, o.rib, 110); box(P, 0, 0, 1, 0.015, o.paper); box(P, 0, 0.985, 1, 0.015, o.paper); }
      ctext(P, '9', 0.5, 0.36, 0.72, o.ink, 0.5, { font: 'serif', weight: 800 });
      ctext(P, o.ap || 'pm', 0.46, 0.43, 0.06, o.ink, 0.6, { font: 'serif', weight: 700 });
      if (o.name) (o.nameFont === 'scr' ? scr : tx)(P, o.name, 0.66, o.nameCap || 0.016, o.nameInk || o.ink, o.nameFont === 'scr' ? undefined : (o.nameFont || 'sans'), { weight: 600, track: o.nameFont === 'scr' ? 0 : 0.15 });
      if (o.label) { P.rect(0.15, 0.8, 0.5, 0.11, o.label); if (o.labelLine) P.frame(0.16, 0.805, 0.48, 0.1, o.labelLine, 0.0015); }
      const lx = o.label ? 0.4 : 0.5;
      tx(P, 'AFNAN', 0.83, 0.02, o.text || o.ink, 'serif', { x: lx, weight: 500 });
      tx(P, o.conc || 'eau de parfum vaporisateur', 0.862, 0.009, o.text || o.ink, 'sans', { x: lx, weight: 400, maxW: 0.46 });
      tx(P, '℮100ml  3.4Fl.oz', 0.885, 0.009, o.text || o.ink, 'sans', { x: lx, weight: 400 });
    },
  }));
  // Supremacy: metallic embossed fleur-de-lis board with the ATS laurel crest.
  function fleur(P, x, y, s, col) { const a = ax(P); P.ellipse(x, y - s * 0.2, s * 0.12 * a, s * 0.38, 0, col); P.ellipse(x - s * 0.28 * a, y - s * 0.05, s * 0.1 * a, s * 0.28, -0.7, col); P.ellipse(x + s * 0.28 * a, y - s * 0.05, s * 0.1 * a, s * 0.28, 0.7, col); P.rect(x - s * 0.3 * a, y + s * 0.12, s * 0.6 * a, s * 0.1, col); P.ellipse(x, y + s * 0.4, s * 0.08 * a, s * 0.16, 0, col); }
  function crest(P, x, y, r, hi, lo) {
    const a = ax(P);
    [[lo, 0.004], [hi, 0]].forEach(([c, d]) => {
      for (const side of [-1, 1]) for (let i = 0; i < 11; i++) { const t = Math.PI / 2 + side * (0.35 + i * 0.22); P.ellipse(x + d + Math.cos(t) * r * a, y + d + Math.sin(t) * r, r * 0.09 * a, r * 0.2, t + side * 0.4, c); }
      at(P, x + d, y + d - r * 0.08, 0, 0.8, () => P.text('ATS', 0, 0, r * 1.05, c, { font: 'serif', italic: true, weight: 700 }));
      P.path([[x - r * 0.75 * a + d, y + r * 0.62 + d], [x + r * 0.75 * a + d, y + r * 0.62 + d], [x + r * 0.85 * a + d, y + r * 0.8 + d], [x - r * 0.85 * a + d, y + r * 0.8 + d]], c, false, 0.003);
    });
    tx(P, 'SUPREMACY', y + r * 0.71, r * 0.1, lo, 'serif', { x, track: 0.3, maxW: 0.5 });
  }
  const supremacy = (o) => carton({ rw: o.rw || 0.68, rd: o.rd || 0.4, paper: o.paper, rough: o.metal != null ? 0.75 : 0.35, metal: o.metal != null ? o.metal : 0.55 }, () => ({
    front: (P) => {
      fullBg(P, o.paper); if (o.bg) box(P, 0, 0, 1, 1, o.bg.r ? radial(P, o.bg.x, o.bg.y, o.bg.r, o.bg.c) : lin(P, ...o.bg.l, o.bg.c));
      if (o.brush) brushed(P, 'rgba(255,255,255,0.12)', 200);
      if (!o.collector) for (let r = 0; r < 9; r++) for (let c = 0; c < 5; c++) { const x = 0.1 + c * 0.2 + (r % 2 ? 0.1 : 0), y = 0.1 + r * 0.105; fleur(P, x + 0.003, y + 0.003, 0.035, o.lo); fleur(P, x, y, 0.035, o.hi); }
      if (o.collector) crest(P, 0.5, 0.3, 0.2, o.hi, o.lo); else crest(P, 0.68, 0.5, 0.26, o.hi, o.lo);
      const k = o.ink;
      if (o.layout === 'low') {
        tx(P, 'SUPREMACY', 0.8, 0.02, o.title || k, 'serif', { track: 0.5, maxW: 0.8 });
        if (o.name) scr(P, o.name, 0.85, 0.022, o.nameInk || k);
        tx(P, 'AFNAN', o.name ? 0.9 : 0.86, 0.02, k, 'serif');
      } else if (o.collector) {
        tx(P, 'SUPREMACY', 0.7, 0.02, k, 'serif', { track: 0.5, maxW: 0.8 }); tx(P, "COLLECTOR'S EDITION", 0.76, 0.016, k, 'sans', { weight: 700, track: 0.06 }); tx(P, 'AFNAN', 0.81, 0.018, k, 'serif');
      } else {
        tx(P, 'SUPREMACY', 0.045, 0.026, o.title || k, 'serif', { track: 0.55, maxW: 0.92 });
        if (o.name) (o.nameCaps ? tx : scr)(P, o.name, 0.1, 0.02, o.nameInk || k, 'serif', { track: o.nameCaps ? 0.3 : 0 });
        [['AFNAN', 0.83, 0.016, 'serif'], ['POUR HOMME', 0.86, 0.009, 'serif'], ['EAU DE PARFUM VAPORISATEUR', 0.89, 0.01, 'serif'], ['℮100ML 3.4 FL OZ', 0.92, 0.01, 'serif']].forEach(([s, y, c, f]) => tx(P, s, y, c, k, f, { x: 0.3, maxW: 0.52 }));
      }
    },
  }));
  // Turathi: damask lid box with a filigree lantern arch.
  const turathi = (o) => (item, fit) => Object.assign(prop(fit, 0.8, 0.45), {
    lid: 0.97, paper: { color: o.paper, rough: 0.7 }, lining: '#111',
    front: (P) => {
      fullBg(P, o.paper);
      if (o.moroccan) girih(P, null, o.pat, 0.09, { lw: 0.005 }); else { for (let i = -10; i < 20; i++) { P.line(i * 0.08, 0, i * 0.08 + 0.7, 1, o.pat, 0.0025); P.line(i * 0.08, 0, i * 0.08 - 0.7, 1, o.pat, 0.0025); } damask(P, o.pat, 0.045, 0.16, 0.1); }
      const x = 0.45, hw = 0.16, O = (s) => [[x - hw * s, 0.58], [x - hw * s, 0.28 + (1 - s) * 0.05], [x - hw * s * 0.55, 0.17 + (1 - s) * 0.07], [x, 0.1 + (1 - s) * 0.1], [x + hw * s * 0.55, 0.17 + (1 - s) * 0.07], [x + hw * s, 0.28 + (1 - s) * 0.05], [x + hw * s, 0.58]];
      P.path(O(1), o.archBg); clipPoly(P, O(1), () => { girih(P, null, o.fil, 0.06); });
      P.path(O(1), o.fil, false, 0.004); P.line(x, 0.1, x, 0.07, o.fil, 0.004); P.circle(x, 0.065, 0.007, o.fil);
      const inner = O(0.72).map(([u, v], i, a) => [u, i === 0 || i === a.length - 1 ? 0.43 : v]); P.path(inner, o.field); P.path(inner, o.fil, false, 0.002);
      ar(P, 'تراثي', 0.33, 0.04, o.arInk, { x, maxW: 0.2 }); tx(P, 'Turathi', 0.39, 0.012, o.arInk, 'serif', { x, weight: 500 });
      if (o.script) scr(P, o.script, 0.08, 0.024, o.ink, { x: 0.7 });
      afnanMark(P, 0.69, 0.05, o.ink); tx(P, 'AFNAN', 0.76, 0.018, o.ink, 'serif', { x });
      tx(P, '℮ 90ML', 0.88, 0.011, o.ink, 'serif', { x: 0.15 }); tx(P, 'Eau de Parfum', 0.88, 0.011, o.ink, 'serif', { x: 0.45 }); tx(P, '3.0 FL.OZ', 0.88, 0.011, o.ink, 'serif', { x: 0.75 });
    },
  });
  // Rare: squat lid box, a big petal rosette, silver band at the seam.
  const rare = (o) => (item, fit) => Object.assign(prop(fit, 0.95, 0.5), {
    lid: 0.58, paper: { color: o.paper, rough: 0.8 }, lining: '#111',
    front: (P) => {
      fullBg(P, o.paper); stipple(P, 'rgba(255,255,255,0.04)', 2000);
      if (o.diamond) for (let i = -20; i < 40; i++) { P.line(i * 0.05, 0, i * 0.05 + 0.5, 1, 'rgba(255,255,255,0.04)', 0.0015); P.line(i * 0.05, 0, i * 0.05 - 0.5, 1, 'rgba(255,255,255,0.04)', 0.0015); }
      const x = 0.5, y = 0.265, R = 0.19, a = ax(P);
      for (let i = 0; i < 8; i++) {
        const t = (i * Math.PI) / 4 - Math.PI / 2, c = Math.cos(t), s = Math.sin(t), n = [-s, c];
        const pts = [[0.3, 0], [0.5, 0.2], [0.8, 0.26], [1, 0.12], [1, -0.12], [0.8, -0.26], [0.5, -0.2]].map(([u, v]) => [x + (c * u + n[0] * v) * R * a, y + (s * u + n[1] * v) * R]);
        P.path(pts, lin(P, x + c * R * 0.1 * a, y + s * R * 0.1, x + c * R * a, y + s * R, o.petal)); P.path(pts.concat([pts[0]]), '#e8e8e8', false, 0.002);
      }
      poly(P, x, y, starPts(R * 0.62, 8, 0.8, 0), 'rgba(255,255,255,0.5)', false, 0.0015);
      P.circle(x, y, R * 0.36, o.paper); P.circle(x, y, R * 0.36, '#e8e8e8', 0.002);
      scr(P, 'Rare', y - 0.008, 0.022, '#ffffff', { x }); tx(P, o.sub, y + 0.03, 0.008, '#ffffff', 'serif', { x, track: 0.3 });
      box(P, 0, 0.565, 1, 0.025, lin(P, 0, 0.565, 0, 0.59, ['#e6e6e6', '#9a9a9a', '#d8d8d8']));
      afnanMark(P, 0.68, 0.045, '#e8e8e8'); tx(P, 'AFNAN', 0.74, 0.02, '#ffffff', 'serif');
      tx(P, o.conc, 0.86, 0.01, '#ffffff', 'serif', { track: 0.05 }); tx(P, '℮100ML  3.4 FL OZ', 0.9, 0.01, '#ffffff', 'serif');
    },
  });
  const modest = (item, fit) => Object.assign(prop(fit, 0.78, 0.4), {
    lid: 0.97, paper: { color: '#111111', rough: 0.85 }, lining: '#efe6d2',
    front: (P) => {
      fullBg(P, '#111111'); P.frame(0.05, 0.04, 0.9, 0.92, '#d8d8d8', 0.002); P.frame(0.065, 0.052, 0.87, 0.896, '#d8d8d8', 0.001);
      P.rect(0.3, 0.18, 0.4, 0.2, '#f8f8f6'); P.frame(0.31, 0.19, 0.38, 0.18, '#b8b8b8', 0.002);
      scr(P, 'Modest', 0.265, 0.035, '#111111', { weight: 600 }); tx(P, 'POUR HOMME', 0.33, 0.008, '#111111', 'serif', { track: 0.3 });
      tx(P, 'UNE', 0.48, 0.018, '#ffffff', 'serif', { track: 0.1 }); afnanMark(P, 0.6, 0.045, '#5a4a30');
      tx(P, 'AFNAN', 0.78, 0.022, '#ffffff', 'serif'); tx(P, 'EAU DE PARFUM VAPORISATEUR', 0.83, 0.008, '#ffffff', 'serif'); tx(P, '℮100ML 3.4 FL OZ', 0.86, 0.008, '#ffffff', 'serif');
    },
  });
  const mystique = carton({ rw: 0.62, rd: 0.38, paper: '#143f43', rough: 0.8 }, () => ({
    front: (P) => {
      fullBg(P, '#143f43'); box(P, 0, 0, 1, 1, radial(P, 0.5, 0.35, 0.45, ['#38662c', '#1d4a3c', '#143f43']));
      const cols = ['#e86a5a', '#f2a28a', '#b39ad8', '#f6c0b0', '#d9505a'], a = ax(P);
      for (let i = 0; i < 70; i++) {
        const side = i % 4, t = rnd(i + 1); let x, y;
        if (side === 0) { x = t; y = rnd(i + 2) * 0.1; } else if (side === 1) { x = t; y = 1 - rnd(i + 2) * 0.1; } else if (side === 2) { x = rnd(i + 2) * 0.16; y = t; } else { x = 1 - rnd(i + 2) * 0.16; y = t; }
        const r = 0.025 + rnd(i + 5) * 0.03;
        P.ellipse(x + r * 1.2 * a, y + r * 0.6, r * 0.5 * a, r * 1.2, rnd(i) * 3, '#3c7a3a');
        for (let k = 0; k < 5; k++) { const q = (k / 5) * Math.PI * 2 + i; P.ellipse(x + Math.cos(q) * r * 0.5 * a, y + Math.sin(q) * r * 0.5, r * 0.45 * a, r * 0.3, q, cols[i % 5]); }
        P.circle(x, y, r * 0.2, '#f6d26a');
      }
      scr(P, 'Mystique', 0.2, 0.03, '#d9b56a'); tx(P, 'BOUQUET', 0.26, 0.035, '#d9b56a', 'serif', { weight: 500 });
      afnanMark(P, 0.8, 0.035, '#d9b56a'); tx(P, 'AFNAN', 0.86, 0.016, '#d9b56a', 'serif'); tx(P, 'eau de parfum vaporisateur ℮80ml', 0.89, 0.008, '#d9b56a', 'sans');
    },
  }));

  /* ================= RAYHAAN ================= */
  const RY = (P, y, cap, col, o = {}) => tx(P, 'RAYHAAN', y, cap, col, 'serif', Object.assign({ weight: 600, track: 0.08 }, o));
  const ry = (fn) => carton({ rw: 0.78, rd: 0.4, paper: '#1a1a1a' }, fn);
  const ryC = (o, fn) => carton({ rw: 0.78, rd: 0.4, paper: o.paper || o.ground, rough: o.rough != null ? o.rough : 0.6, metal: o.metal || 0 }, fn);
  // Pierced star-lattice collection.
  const ryLattice = (o) => ryC(o, (item) => ({
    front: (P) => {
      girih(P, o.ground, Array.isArray(o.foil) ? lin(P, 0, 0, 1, 1, o.foil) : o.foil, 0.18, { x0: 0.04 });
      box(P, 0, 0, 0.04, 1, o.ground);
      P.rect(0.15, 0.45, 0.4, 0.13, o.cart, 0.015); if (o.cartLine) P.frame(0.16, 0.457, 0.38, 0.116, o.cartLine, 0.0015);
      RY(P, 0.5, 0.026, o.ink, { x: 0.35, maxW: 0.36 }); tx(P, item.name.replace('Rayhaan ', '').toUpperCase(), 0.54, 0.012, o.ink, 'serif', { x: 0.35, track: 0.15, weight: 600 });
    },
  }));
  // Gradient/painterly collection.
  const ryGrad = (o) => ryC({ paper: o.paper || o.grad[0] }, () => ({
    front: (P) => {
      box(P, 0, 0, 1, 1, lin(P, 0, 0, 0, 1, o.grad)); callig(P, o.callig || 'rgba(255,255,255,0.045)', 10, 0.03, o.seed || 2);
      if (o.draw) o.draw(P);
    },
  }));
  const goldLabel = (a, b) => (P) => {
    foil(P, 0.1, 0.25, 0.45, 0.37, ['#f0d27a', '#c9a24f', '#e8c870', '#b8902f']);
    tx(P, a, 0.32, 0.04, '#111', 'serif', { x: 0.325, maxW: 0.4, weight: 600 }); tx(P, 'POUR HOMME', 0.37, 0.008, '#111', 'serif', { x: 0.325, track: 0.2 });
    tx(P, b, 0.45, 0.014, '#111', 'serif', { x: 0.325, track: 0.15 }); RY(P, 0.55, 0.016, '#111', { x: 0.325 });
  };
  const vibe = (word) => (P) => { scr(P, word, 0.3, 0.05, '#e6c26a', { x: 0.4, weight: 600 }); ctext(P, 'VIBE', 0.42, 0.42, 0.17, '#e6c26a', 0.55, { font: 'sans', weight: 600 }); RY(P, 0.85, 0.03, '#e6c26a'); };
  // Engraved gold beast illustrations on black.
  function scrolls(P, col, n = 8) { const g = P.g; g.save(); g.strokeStyle = col; g.lineWidth = 0.006 * P.H; for (let i = 0; i < n; i++) { const x = rnd(i + 40) * P.W, y = (0.1 + rnd(i + 41) * 0.65) * P.H, r = (0.03 + rnd(i + 42) * 0.05) * P.H; g.beginPath(); for (let t = 0; t < 12; t += 0.2) g.lineTo(x + Math.cos(t) * r * (1 - t / 13), y + Math.sin(t) * r * (1 - t / 13)); g.stroke(); } g.restore(); }
  function beastHead(P, x, y, s, gold, dark, kind) {
    const a = ax(P);
    if (kind === 'lion' || kind === 'tiger') for (let i = 0; i < 200; i++) { const t = (i / 200) * Math.PI * 2, w = Math.sin(i * 1.7) * 0.25, r0 = s * 0.4, r1 = s * (0.85 + rnd(i) * 0.3); P.path([[x + Math.cos(t) * r0 * a, y + Math.sin(t) * r0], [x + Math.cos(t + w * 0.5) * (r0 + r1) / 2 * a, y + Math.sin(t + w * 0.5) * (r0 + r1) / 2], [x + Math.cos(t + w) * r1 * a, y + Math.sin(t + w) * r1]], i % 3 ? gold : dark, false, 0.008); }
    if (kind === 'wolf' || kind === 'tiger') { poly(P, x, y, [[-0.55 * s, -0.2 * s], [-0.45 * s, -0.95 * s], [-0.1 * s, -0.5 * s]], gold); poly(P, x, y, [[0.55 * s, -0.2 * s], [0.45 * s, -0.95 * s], [0.1 * s, -0.5 * s]], gold); }
    P.ellipse(x, y, s * 0.5 * a, s * (kind === 'wolf' ? 0.62 : 0.55), 0, gold);
    P.ellipse(x, y + s * 0.3, s * 0.25 * a, s * 0.22, 0, lin(P, x, y, x, y + s * 0.5, ['#f3dc9a', '#8a6a2a']));
    [-1, 1].forEach((d) => { P.ellipse(x + d * s * 0.2 * a, y - s * 0.08, s * 0.08 * a, s * 0.035, d * 0.3, dark); });
    poly(P, x, y + s * 0.18, [[-0.08 * s, 0], [0.08 * s, 0], [0, 0.08 * s]], dark);
    if (kind === 'tiger') for (let i = 0; i < 6; i++) P.line(x + (i % 2 ? -1 : 1) * s * 0.42 * a, y - s * 0.3 + i * s * 0.12, x + (i % 2 ? -1 : 1) * s * 0.18 * a, y - s * 0.25 + i * s * 0.12, dark, 0.004);
    for (let i = 0; i < 5; i++) P.line(x, y - s * 0.5 + i * 0.01, x, y - s * 0.2, dark, 0.002);
  }
  function pharaoh(P, x, y, s) {
    const a = ax(P), gold = lin(P, x - s * a, y - s, x + s * a, y + s, GOLD);
    poly(P, x, y, [[-0.35 * s, -0.75 * s], [0.35 * s, -0.75 * s], [0.75 * s, 0.6 * s], [-0.75 * s, 0.6 * s]], gold);
    for (let i = 0; i < 9; i++) { const v = -0.6 + i * 0.13; poly(P, x, y, [[-(0.38 + v * 0.3) * s, v * s], [(0.38 + v * 0.3) * s, v * s], [(0.4 + (v + 0.05) * 0.3) * s, (v + 0.05) * s], [-(0.4 + (v + 0.05) * 0.3) * s, (v + 0.05) * s]], '#1d2a4a'); }
    P.ellipse(x, y - s * 0.05, s * 0.3 * a, s * 0.42, 0, '#1d2a4a'); P.ellipse(x, y - s * 0.05, s * 0.26 * a, s * 0.38, 0, lin(P, x - s * 0.3 * a, y - s * 0.4, x + s * 0.3 * a, y + s * 0.3, ['#f6dc8a', '#d8a848', '#a87a2a'])); poly(P, x, y, [[-0.08 * s, 0.32 * s], [0.08 * s, 0.32 * s], [0.04 * s, 0.75 * s], [-0.04 * s, 0.75 * s]], gold);
    [-1, 1].forEach((d) => P.ellipse(x + d * s * 0.12 * a, y - s * 0.12, s * 0.07 * a, s * 0.025, 0, '#1a1a1a'));
    P.circle(x, y - s * 0.65, s * 0.06, '#1d2a4a');
  }
  const ryBeast = (draw) => ry(() => ({ front: (P) => { fullBg(P, '#1a1a1a'); stipple(P, 'rgba(255,255,255,0.03)'); draw(P); RY(P, 0.86, 0.034, '#c9a24f'); } }));
  // Leather collection.
  const ryLeather = (o) => ryC({ paper: o.paper, rough: 0.9 }, (item) => ({
    front: (P) => {
      fullBg(P, o.paper); stipple(P, o.dark, 4000, 0.002); stipple(P, 'rgba(255,255,255,0.07)', 2000, 0.0015);
      for (let i = 0; i < 50; i++) { const t = i / 50; [[0.04 + t * 0.92, 0.035, 0.04 + t * 0.92 + 0.009, 0.035], [0.04 + t * 0.92, 0.965, 0.04 + t * 0.92 + 0.009, 0.965]].forEach(([a1, b1, a2, b2]) => P.line(a1, b1, a2, b2, o.stitch, 0.002)); }
      for (let i = 0; i < 60; i++) { const t = i / 60; [0.04, 0.96].forEach((x) => P.line(x, 0.035 + t * 0.93, x, 0.035 + t * 0.93 + 0.007, o.stitch, 0.002)); }
      P.rect(0.15, 0.25, 0.7, 0.4, o.patch); P.frame(0.165, 0.26, 0.67, 0.38, o.dark, 0.002);
      RY(P, 0.33, 0.035, o.ink); tx(P, 'EAU DE PARFUM', 0.38, 0.008, o.ink, 'serif', { track: 0.2 });
      tx(P, item.name.toUpperCase(), 0.46, 0.02, o.ink, 'serif', { track: 0.15 }); tx(P, 'FOR HIM', 0.5, 0.008, o.ink, 'serif', { track: 0.2 });
      tx(P, 'LEATHER COLLECTION', 0.58, 0.008, o.ink, 'serif', { track: 0.2 });
    },
  }));
  const ryFor = (P, name, sub, ink, y = 0.3) => { RY(P, y, 0.035, ink); tx(P, 'EAU DE PARFUM', y + 0.045, 0.008, ink, 'serif', { track: 0.2 }); tx(P, name.toUpperCase(), y + 0.12, 0.02, ink, 'serif', { track: 0.12 }); tx(P, 'FOR HIM', y + 0.16, 0.008, ink, 'serif', { track: 0.2 }); tx(P, sub, y + 0.2, 0.008, ink, 'serif', { track: 0.2 }); };
  const ryAqua = (o) => ryC({ paper: o.paper }, (item) => ({
    front: (P) => {
      fullBg(P, o.paper); callig(P, o.callig, 10, 0.035, 5);
      if (o.label) { P.rect(0.15, 0.3, 0.6, 0.32, '#f6f6f4'); ryFor(P, item.name, 'AQUA COLLECTION', '#1a1a1a', 0.36); }
      else ryFor(P, item.name, 'AQUA COLLECTION', '#9fb0d6', 0.3);
      tx(P, '100ml', 0.94, 0.01, '#ffffff', 'sans', { x: 0.88 });
    },
  }));
  // Square-kufic maze (Imperia side face).
  function maze(P, col) { const n = 12, a = ax(P), c = 1 / n; for (let r = 0; r * c * a < 1.05; r++) for (let k = 0; k < n; k++) { const x = k * c, y = r * c / a * 1, h = c / a; const t = (r * 3 + k * 7) % 4; P.path([[x + c * 0.15, y + h * 0.15], [x + c * 0.85, y + h * 0.15], [x + c * 0.85, y + h * (t > 1 ? 0.85 : 0.5)], [x + c * (t % 2 ? 0.4 : 0.15), y + h * 0.85]], col, false, 0.004); } }
  const ryImperia = (o) => ryC({ paper: '#1f1f22' }, (item) => ({
    front: (P) => { fullBg(P, '#1f1f22'); P.frame(0.12, 0.12, 0.76, 0.6, o.ink, 0.002); ryFor(P, item.name, 'IMPERIAL COLLECTION', o.ink, 0.3); tx(P, '100ml', 0.94, 0.01, o.ink, 'sans', { x: 0.88 }); },
    sideArt: (P) => { fullBg(P, '#1f1f22'); maze(P, o.ink); },
  }));
  const ryWood = (o) => ryC({ paper: o.paper, rough: 0.9 }, (item) => ({
    front: (P) => { fullBg(P, o.paper); wood(P, 0, 1, [o.paper, 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0.12)'], true); callig(P, 'rgba(255,240,220,0.04)', 8, 0.03, 9); ryFor(P, item.name, 'WOOD COLLECTION', '#efe4d0', 0.3); },
  }));

  /* ================= ARMAF ================= */
  const cdn = (P, x, y, cap, col, o = {}) => tx(P, 'club de nuit', y, cap, col, 'sans', Object.assign({ x, weight: 300, track: 0.05 }, o));
  const specs = (P, x, y, col, conc = 'EAU DE PARFUM') => tx(P, `${conc} | VAPORISATEUR SPRAY | ℮105ML 3.6FL.OZ`, y, 0.006, col, 'sans', { x, weight: 500, maxW: 0.6 });
  const disc = (P, x, y, r, fill) => { P.circle(x, y, r, fill); P.circle(x + r * 0.55 * ax(P), y + r * 0.55, r * 0.09, '#ffffff'); P.circle(x + r * 0.55 * ax(P), y + r * 0.55, r * 0.05, '#d8e8f8'); };
  const clubNuit = (o) => carton({ rw: 0.62, rd: 0.4, paper: o.paper, rough: o.rough || 0.6, metal: o.metal || 0 }, () => ({
    front: (P) => { fullBg(P, o.paper); o.front(P); },
    sideArt: (P) => { fullBg(P, o.side || o.paper); if (o.sideArt) o.sideArt(P); vtext(P, 'club de nuit', 0.5, 0.5, 0.17, o.sideInk || 'rgba(255,255,255,0.08)', { font: 'sans', weight: 300 }); },
  }));
  function cracks(P, col, n = 26) { for (let i = 0; i < n; i++) { let x = rnd(i * 5), y = rnd(i * 5 + 1); const pts = [[x, y]]; for (let k = 0; k < 3; k++) { x += (rnd(i * 5 + k + 2) - 0.5) * 0.6; y += (rnd(i * 9 + k) - 0.5) * 0.3; pts.push([x, y]); } P.path(pts, col, false, 0.002); } }
  function spirals(P, col) { const g = P.g; g.save(); g.strokeStyle = col; g.lineWidth = 0.0015 * P.H; for (let i = 0; i < 7; i++) { g.beginPath(); for (let t = 0; t < 20; t += 0.1) g.lineTo((0.5 + Math.cos(t) * t * 0.04) * P.W, (0.5 + Math.sin(t) * t * 0.02 + i * 0.002) * P.H); g.stroke(); } for (let i = 0; i < 18; i++) P.line(rnd(i + 3), 0, rnd(i + 4), 1, col, 0.0012); g.restore(); }
  function camo(P, cols) { for (let i = 0; i < 90; i++) P.ellipse(rnd(i + 11), rnd(i + 12), 0.05 + rnd(i + 13) * 0.12, 0.02 + rnd(i + 14) * 0.05, rnd(i + 15) * 3, cols[i % cols.length]); }

  /* ================= RASASI ================= */
  const rasasiLogo = (P, y, size, col) => ar(P, 'الرصاصي', y, size, col, { weight: 700, maxW: 0.3 });
  function snakeskin(P, x, y, w, h, cols) { clip(P, x, y, w, h, () => { box(P, x, y, w, h, cols[0]); const s = 0.022, a = ax(P); for (let r = 0; r * s < h + s; r++) for (let c = 0; c * s * a * 1.4 < w + s; c++) { const px = x + c * s * a * 1.4 + (r % 2 ? s * a * 0.7 : 0), py = y + r * s * 0.8; poly(P, px, py, [[0, -s * 0.5], [s * 0.6, 0], [0, s * 0.5], [-s * 0.6, 0]], cols[1 + Math.floor(rnd(r * 31 + c) * (cols.length - 1))]); } }); }
  const hawas = (o) => carton({ rw: 0.8, rd: 0.4, paper: o.paper, rough: o.metal ? 0.35 : 0.85, metal: o.metal || 0 }, () => ({
    front: (P) => {
      fullBg(P, o.paper); if (o.grad) { box(P, 0, 0, 1, 1, lin(P, 0, 0, 0, 1, o.grad)); brushed(P, 'rgba(255,255,255,0.06)', 160); }
      snakeskin(P, 0.12, 0.1, 0.76, 0.37, o.skin); box(P, 0.3, 0.2, 0.4, 0.18, o.panel);
      ar(P, 'هوس', 0.25, 0.045, o.ink, { maxW: 0.3 }); tx(P, 'HAWAS', 0.31, 0.03, o.ink, 'sans', { weight: 400, track: 0.08 }); scr(P, 'For Him', 0.35, 0.008, o.ink);
      if (o.ice) tx(P, 'I C E', 0.55, 0.014, '#dfeaf4', 'sans', { track: 0.3 });
      [['℮100 ML', 0.15], ['EAU DE PARFUM', 0.5], ['3.38 FL OZ', 0.85]].forEach(([s, x]) => tx(P, s, 0.93, 0.007, o.foot, 'sans', { x, weight: 600 }));
    },
  }));

  /* ================= THE SPIRIT OF DUBAI ================= */
  const shumukh = (item, fit) => Object.assign(prop(fit, 0.55, 0.45), {
    lid: 0.9, paper: { color: '#111111', rough: 0.5 }, side: { color: '#111111', rough: 0.5 }, lining: { color: '#f4ecd8', rough: 0.4 },
    front: (P) => {
      fullBg(P, '#111111'); foil(P, 0, 0, 1, 1); box(P, 0.06, 0.04, 0.88, 0.92, '#111111');
      P.frame(0.09, 0.06, 0.82, 0.88, '#c9a24f', 0.0015); damask(P, 'rgba(201,162,79,0.07)', 0.08, 0.3, 0.13);
      tx(P, 'SHUMUKH', 0.35, 0.028, '#d8b866', 'serif', { weight: 600, track: 0.2 }); rule(P, 0.39, 0.4, '#c9a24f', 0.0015);
      scr(P, 'The Spirit of', 0.43, 0.018, '#d8b866'); scr(P, 'Dubai', 0.48, 0.04, '#d8b866', { weight: 600 });
      ar(P, 'شموخ', 0.58, 0.04, '#c9a24f'); tx(P, 'EAU DE PARFUM', 0.64, 0.01, '#c9a24f', 'serif', { track: 0.25 }); scr(P, 'by nabeel', 0.85, 0.014, '#c9a24f');
    },
  });

  BoxCraft.add({
    /* Lattafa */
    lattafa: carton({ rw: 0.72, rd: 0.42, paper: '#1e1e1e' }, (item) => ({ front: (P) => { fullBg(P, '#1e1e1e'); P.frame(0.07, 0.045, 0.86, 0.91, G, 0.005); rosette(P, 0.5, 0.33, 0.13, G, 0.003); tx(P, item.name.toUpperCase(), 0.6, 0.026, G, 'serif', { weight: 600, track: 0.12, maxW: 0.78 }); tx(P, 'EAU DE PARFUM', 0.66, 0.011, G, 'sans', { track: 0.25 }); lattafa(P, 0.86, 0.024, G); } })),
    'lattafa|Khamrah': khamrah({ lid: '#1e1e1e', wood: ['#cab6a1', '#d8c8b6', '#a8927c'], ey: 0.45, ly: 0.74 }),
    'lattafa|Khamrah Qahwa': khamrah({ lid: '#402c24', wood: ['#624c41', '#73594c', '#46352d'], ey: 0.38, ly: 0.7, sub: 'QAHWA' }),
    'lattafa|Asad': asad,
    "lattafa|Bade'e Al Oud Oud for Glory": badee({ paper: '#131315', top: 'OUD FOR GLORY' }),
    "lattafa|Bade'e Al Oud Amethyst": badee({ paper: '#43304a', top: 'AMETHYST' }),
    'lattafa|Fakhar Black': fakhar,
    'lattafa|Yara': yara,
    'lattafa|Raghba': raghba,
    'lattafa|Hayaati': hayaati,
    'lattafa|Qaed Al Fursan': qaed,
    'lattafa|Oud Mood': oudMood,
    'lattafa|Ana Abiyedh': anaAbiyedh,

    /* Afnan */
    afnan: supremacy({ paper: '#b4b4b4', hi: 'rgba(255,255,255,0.5)', lo: 'rgba(0,0,0,0.12)', ink: '#6d6d6d' }),
    'afnan|9pm': nine({ paper: '#1b1b1b', rib: 'rgba(255,255,255,0.09)', ink: '#f2f2f2', label: '#111111', labelLine: '#6a6a6a' }),
    'afnan|9pm Rebel': nine({ paper: '#5a5655', rib: 'rgba(0,0,0,0.12)', ink: '#b02a40', name: 'REBEL', label: '#4e4a49', text: '#2a2a2a' }),
    'afnan|9pm Elixir': nine({ paper: '#4a2622', rib: 'rgba(255,255,255,0.06)', ink: '#d9a85a', name: 'ELIXIR', nameFont: 'serif', label: '#7a3022', conc: 'parfum intense - natural spray vaporisateur' }),
    'afnan|9pm Night Out': nine({ paper: '#1c1c1c', rib: 'rgba(255,255,255,0.05)', ink: '#e3dccb', name: 'Night Out', nameFont: 'serif', label: '#2e2e2e', conc: 'extrait de parfum' }),
    'afnan|9am Dive': nine({ paper: '#3aa2c4', gloss: true, ribs: false, bg: ['#5ab4d2', '#3aa2c4', '#2a8cb0'], ink: '#a4b0b6', ap: 'am', name: 'Dive', nameFont: 'scr', nameCap: 0.022, text: '#3a6a7a' }),
    'afnan|Supremacy Silver': supremacy({ paper: '#b4b4b4', bg: { l: [0, 0, 1, 1], c: ['#c4c4c4', '#a8a8a8', '#bcbcbc'] }, hi: 'rgba(255,255,255,0.5)', lo: 'rgba(0,0,0,0.16)', ink: '#555555', brush: true }),
    'afnan|Supremacy Gold': supremacy({ paper: '#c8962e', bg: { l: [0, 0, 1, 1], c: ['#d4a43a', '#b8862a', '#cc9a34'] }, hi: 'rgba(255,240,190,0.45)', lo: 'rgba(130,80,10,0.22)', ink: '#b0401f' }),
    'afnan|Supremacy Not Only Intense': supremacy({ paper: '#5a5856', layout: 'low', bg: { x: 0.7, y: 0.35, r: 0.9, c: ['#a09c99', '#4a4846', '#131313'] }, hi: 'rgba(255,255,255,0.18)', lo: 'rgba(0,0,0,0.25)', ink: '#e8e8e8', name: 'not only intense', nameInk: '#c0262c' }),
    'afnan|Supremacy in Oud': supremacy({ paper: '#5e3a2e', layout: 'low', bg: { x: 0.65, y: 0.4, r: 0.8, c: ['#7a5040', '#5e3a2e', '#341c14'] }, hi: 'rgba(255,220,190,0.2)', lo: 'rgba(0,0,0,0.25)', ink: '#d8a94f', name: 'in Oud' }),
    'afnan|Supremacy in Heaven': supremacy({ paper: '#6f8c8e', bg: { l: [0, 0, 0.8, 0.8], c: ['#2a454c', '#55777c', '#6f8c8e', '#86a2a2'] }, brush: true, hi: 'rgba(255,255,255,0.3)', lo: 'rgba(0,20,40,0.2)', ink: '#1d3550', name: 'in Heaven' }),
    'afnan|Supremacy Incense': supremacy({ paper: '#1f3b40', bg: { l: [0, 0, 1, 1], c: ['#1f3b40', '#3a5a60', '#9aa8aa'] }, hi: 'rgba(255,255,255,0.15)', lo: 'rgba(0,0,0,0.25)', ink: '#d8dcdc', name: 'INCENSE', nameCaps: true }),
    'afnan|Supremacy Noir': supremacy({ paper: '#141414', metal: 0.2, hi: 'rgba(255,255,255,0.07)', lo: 'rgba(0,0,0,0.4)', ink: '#c8c8c8', name: 'NOIR', nameCaps: true }),
    "afnan|Supremacy Collector's Edition": supremacy({ rw: 0.75, rd: 0.42, paper: '#323738', metal: 0, collector: true, hi: '#454b4b', lo: 'rgba(0,0,0,0.3)', ink: '#ffffff' }),
    'afnan|Turathi Blue': turathi({ paper: '#25354f', pat: 'rgba(80,110,170,0.35)', fil: '#d8d2bf', archBg: '#25354f', field: '#efe9da', arInk: '#4a5a7a', ink: '#e8e8e8' }),
    'afnan|Turathi Brown': turathi({ paper: '#4e373d', pat: 'rgba(140,100,110,0.3)', fil: '#d9b45a', archBg: '#4e373d', field: '#e8d9a8', arInk: '#6a4a3a', ink: '#d9b45a' }),
    'afnan|Turathi Electric': turathi({ paper: '#5a9ab4', moroccan: true, pat: 'rgba(255,255,255,0.35)', fil: '#c8d0d8', archBg: '#111111', field: '#111111', arInk: '#d8dde2', ink: '#1d2d4a', script: 'electric' }),
    'afnan|Rare Carbon': rare({ paper: '#252525', petal: ['#d0d0d0', '#9a9a9a', '#5a5a5a'], sub: 'CARBON', conc: 'EAU DE PARFUM VAPORISATEUR' }),
    'afnan|Rare Reef': rare({ paper: '#253452', diamond: true, petal: ['#c8d4ee', '#7f97c8', '#3e5a98'], sub: 'REEF', conc: 'EXTRAIT DE PARFUM' }),
    'afnan|Modest Une pour Homme': modest,
    'afnan|Mystique Bouquet': mystique,

    /* Rayhaan */
    rayhaan: ryLattice({ ground: '#121212', foil: ['#f0d27a', '#c9a24f', '#e8c870', '#a8822f'], cart: '#d7b25a', ink: '#121212' }),
    'rayhaan|Rayhaan Elixir': ryLattice({ ground: '#121212', foil: ['#f0d27a', '#c9a24f', '#e8c870', '#a8822f'], cart: '#d7b25a', ink: '#121212', metal: 0.3 }),
    'rayhaan|Obsidian': ryLattice({ ground: '#1a1a1a', foil: '#2e2e2e', line: '#3a3a3a', cart: '#141414', cartLine: '#b8b8b8', ink: '#c8c8c8' }),
    'rayhaan|Aquatica': ryLattice({ ground: '#169c9e', foil: ['#d8dee2', '#98a4aa', '#c8d0d4'], cart: '#b8c2c6', ink: '#3a4a50', metal: 0.3 }),
    'rayhaan|Terra': ryLattice({ ground: '#1e3b2c', foil: ['#7a6a58', '#5a4a38', '#6b5a48'], cart: '#5a5048', ink: '#d8cfc0' }),
    'rayhaan|Crimson': ryLattice({ ground: '#121212', foil: ['#e8241a', '#a8100c', '#d81c14', '#80100a'], cart: '#c8180f', ink: '#1a0a0a', metal: 0.3 }),
    'rayhaan|Azul': ryLattice({ paper: '#ffffff', ground: '#ffffff', foil: '#1d3f9c', cart: '#ffffff', cartLine: '#1d3f9c', ink: '#1d3f9c' }),
    'rayhaan|Italia': ryC({ paper: '#dcdcda', rough: 0.4 }, () => ({ front: (P) => { fullBg(P, '#dcdcda'); for (let i = 0; i < 9; i++) { let x = rnd(i + 70), y = 0; const pts = [[x, y]]; while (y < 1) { x += (rnd(x * 50 + y * 90) - 0.5) * 0.12; y += 0.05; pts.push([x, y]); } P.path(pts, i % 3 ? 'rgba(120,120,120,0.45)' : 'rgba(90,90,90,0.6)', false, 0.002 + rnd(i) * 0.004); } tx(P, 'ITALIA', 0.3, 0.05, '#a8822a', 'serif', { weight: 500, track: 0.12 }); tx(P, 'POUR HOMME', 0.36, 0.008, '#a8a8a8', 'serif', { track: 0.25 }); RY(P, 0.8, 0.025, '#a8822a'); } })),
    'rayhaan|Pacific Aura': ryGrad({ grad: ['#1f3fbf', '#2a6ab0', '#2fb7a0'], draw: goldLabel('PACIFIC', 'AURA') }),
    'rayhaan|Pacific Aloha': ryGrad({ grad: ['#004255', '#813350', '#c85052'], seed: 3, draw: goldLabel('PACIFIC', 'ALOHA') }),
    'rayhaan|Tropical Vibe': ryGrad({ grad: ['#e0581a', '#d8401e', '#03a39a'], seed: 4, draw: vibe('Tropical') }),
    'rayhaan|Jungle Vibe': ryGrad({ grad: ['#27392d', '#27392d'], callig: 'rgba(0,0,0,0.1)', seed: 6, draw: vibe('Jungle') }),
    'rayhaan|Tonquin Giza': ryGrad({ grad: ['#9a2e22', '#86221c'], callig: 'rgba(0,0,0,0.08)', seed: 7, draw: (P) => { tx(P, 'TONQUIN', 0.3, 0.04, '#d8b05a', 'serif', { weight: 600, track: 0.08 }); tx(P, 'GIZA', 0.38, 0.04, '#d8b05a', 'serif', { weight: 600, track: 0.08 }); RY(P, 0.85, 0.03, '#d8b05a'); } }),
    'rayhaan|Nocturno Elixir': ryGrad({ grad: ['#03203f', '#03355d', '#1e6c8c'], callig: 'rgba(255,255,255,0.03)', draw: (P) => { tx(P, 'NOCTURNO', 0.18, 0.04, '#d8b05a', 'serif', { weight: 600, track: 0.06 }); tx(P, 'ELIXIR', 0.5, 0.014, '#d8b05a', 'serif', { weight: 600, track: 0.2 }); RY(P, 0.85, 0.04, '#d8b05a'); } }),
    'rayhaan|Valhalla': ryGrad({ grad: ['#111111', '#2a0a0c', '#d4141e'], callig: 'rgba(255,255,255,0.03)', draw: (P) => { RY(P, 0.12, 0.035, '#d8b05a'); const a = ax(P); for (const d of [-1, 1]) for (let i = 0; i < 9; i++) { const t = -0.25 + i * 0.14, L = 0.3 - i * 0.022; P.line(0.5 + d * 0.03 * a, 0.46, 0.5 + d * Math.cos(t) * L * a, 0.46 - Math.sin(t) * L, i % 2 ? '#c9a24f' : '#e6c87a', 0.012); } P.circle(0.5, 0.45, 0.04, '#c9a24f'); P.circle(0.5, 0.45, 0.025, '#2a0a0c'); tx(P, 'VALHALLA', 0.62, 0.025, '#d8b05a', 'serif', { weight: 600, track: 0.15 }); } }),
    'rayhaan|Lion': ryBeast((P) => { scrolls(P, '#8a7a5a', 10); beastHead(P, 0.5, 0.42, 0.26, lin(P, 0.3, 0.2, 0.7, 0.65, ['#a8884a', '#6a6050', '#9a7630']), '#2a2a2e', 'lion'); }),
    'rayhaan|Tiger Cal Cologne Edition': ryBeast((P) => { scrolls(P, '#a8823a', 12); beastHead(P, 0.5, 0.42, 0.2, lin(P, 0.3, 0.2, 0.7, 0.65, GOLD), '#1a1a1a', 'tiger'); }),
    'rayhaan|Wolf': ryBeast((P) => { P.circle(0.5, 0.4, 0.23, '#8a6a34', 0.006); P.circle(0.5, 0.4, 0.2, '#c9a24f', 0.002); for (let i = 0; i < 36; i++) { const t = (i / 36) * Math.PI * 2; P.circle(0.5 + Math.cos(t) * 0.215 * ax(P), 0.4 + Math.sin(t) * 0.215, 0.004, '#c9a24f'); } beastHead(P, 0.5, 0.42, 0.15, lin(P, 0.4, 0.3, 0.6, 0.55, ['#8a8a8a', '#3a3a3a', '#c9a24f']), '#111', 'wolf'); }),
    'rayhaan|Pharaoh': ryBeast((P) => { for (let r = 0; r < 14; r++) for (let c = 0; c < 9; c++) P.rect(0.03 + c * 0.11, 0.03 + r * 0.06, 0.05 + rnd(r * 9 + c) * 0.04, 0.03, 'rgba(255,255,255,0.035)', 0.005); pharaoh(P, 0.45, 0.45, 0.25); }),
    'rayhaan|Corium': ryLeather({ paper: '#8e3a18', dark: 'rgba(70,20,8,0.4)', stitch: '#d8a07a', patch: '#863616', ink: '#3a1206' }),
    'rayhaan|Cordova': ryLeather({ paper: '#6e2433', dark: 'rgba(40,5,10,0.4)', stitch: '#c99aa0', patch: '#66202e', ink: '#2e0a12' }),
    'rayhaan|Dark Leather': ryLeather({ paper: '#1d1d1f', dark: 'rgba(0,0,0,0.5)', stitch: '#5a5a5c', patch: '#202022', ink: '#4a4a4c' }),
    'rayhaan|Ocean Rush': ryAqua({ paper: '#2e4f8f', callig: 'rgba(255,255,255,0.06)', label: true }),
    'rayhaan|Pacific': ryAqua({ paper: '#273b82', callig: 'rgba(0,0,30,0.14)' }),
    'rayhaan|Imperia': ryImperia({ ink: '#f2f2f2' }),
    'rayhaan|Imperia Intense': ryImperia({ ink: '#d4af5a' }),
    'rayhaan|Royal Wood': ryWood({ paper: '#5e3624' }),
    'rayhaan|Wood Noir': ryWood({ paper: '#57514a' }),

    /* Armaf */
    armaf: clubNuit({ paper: '#1f1f23', front: (P) => { disc(P, 0.75, 0.15, 0.07, '#8e8e90'); cdn(P, 0.5, 0.4, 0.03, '#ffffff'); } }),
    'armaf|Club de Nuit Intense Man': clubNuit({ paper: '#1f1f23', rough: 0.85, front: (P) => { pinstripe(P, 'rgba(255,255,255,0.02)', 160); disc(P, 0.75, 0.15, 0.07, '#8e8e90'); cdn(P, 0.36, 0.36, 0.028, '#ffffff'); specs(P, 0.38, 0.4, '#ffffff', 'EAU DE TOILETTE'); tx(P, 'intense', 0.43, 0.024, '#ffffff', 'sans', { x: 0.24, weight: 300 }); tx(P, 'MAN', 0.435, 0.011, '#ffffff', 'sans', { x: 0.43, weight: 600 }); } }),
    'armaf|Club de Nuit Sillage': clubNuit({ paper: '#f2f2f0', metal: 0.2, sideInk: 'rgba(60,60,60,0.25)', sideArt: (P) => cracks(P, '#a8aeb4'), front: (P) => { box(P, 0.06, 0.04, 0.88, 0.92, lin(P, 0, 0, 1, 1, ['#f4f4f4', '#d8dadc', '#eeeeee'])); cracks(P, 'rgba(160,168,176,0.5)', 12); disc(P, 0.78, 0.13, 0.06, '#d1c5a1'); vtext(P, 'club de nuit', 0.25, 0.52, 0.17, '#3a3a3a', { font: 'sans', weight: 300 }); cdn(P, 0.66, 0.62, 0.02, '#3a3a3a'); scr(P, 'Sillage', 0.665, 0.03, '#111111', { x: 0.66, weight: 600 }); specs(P, 0.66, 0.72, '#3a3a3a'); } }),
    'armaf|Club de Nuit Untold': clubNuit({ paper: '#d7d7d7', side: '#742670', front: (P) => { box(P, 0, 0.28, 1, 0.72, lin(P, 0, 0.3, 1, 1, ['#a01c64', '#742670', '#55207a'])); P.path(Array.from({ length: 21 }, (_, j) => [j / 20, 0.3 + Math.sin(j * 1.7) * 0.012 + rnd(j) * 0.01]).concat([[1, 0], [0, 0]]), '#d7d7d7'); disc(P, 0.78, 0.16, 0.07, lin(P, 0.7, 0.1, 0.86, 0.22, GOLD)); cdn(P, 0.3, 0.45, 0.024, '#e2c27a'); specs(P, 0.32, 0.49, '#e2c27a'); scr(P, 'Untöld', 0.55, 0.035, '#e2c27a', { x: 0.27, weight: 600 }); } }),
    'armaf|Club de Nuit Milestone': clubNuit({ paper: '#e6e8ea', metal: 0.2, side: '#9a6e22', front: (P) => { box(P, 0, 0.55, 1, 0.45, lin(P, 0, 0.55, 1, 1, ['#b0822a', '#9a6e22', '#8a601a'])); P.path(Array.from({ length: 21 }, (_, j) => [j / 20, 0.55 + Math.sin(j * 0.5) * 0.015]).concat([[1, 0.5], [0, 0.5]]), '#e6e8ea'); for (let i = 0; i < 16; i++) P.ellipse(0.5, 0.02 + i * 0.022, 0.008, 0.012, 0, '#c9a24f', 0); P.circle(0.5, 0.5, 0.17, '#a87a28', 0.018); tx(P, 'MILESTONE', 0.5, 0.02, '#9a6e22', 'sans', { weight: 500, track: 0.1, maxW: 0.38 }); cdn(P, 0.5, 0.08, 0.04, '#9a6e22', { maxW: 0.9 }); tx(P, 'EAU DE PARFUM', 0.88, 0.008, '#ffffff', 'sans', { track: 0.2 }); specs(P, 0.5, 0.92, '#ffffff', 'VAPORISATEUR SPRAY'); } }),
    'armaf|Club de Nuit Iconic': clubNuit({ paper: '#f4f4f4', side: '#f4f4f4', sideInk: 'rgba(31,99,201,0.15)', sideArt: (P) => spirals(P, '#1f63c9'), front: (P) => { box(P, 0.05, 0.03, 0.9, 0.94, lin(P, 0, 0, 1, 1, ['#1a5ac0', '#1450b0', '#0e4296'])); disc(P, 0.75, 0.14, 0.065, lin(P, 0.68, 0.08, 0.82, 0.2, ['#f8e0f0', '#d8f0f8', '#f8f4d8', '#e0d8f8'])); cdn(P, 0.36, 0.42, 0.026, '#ffffff'); specs(P, 0.38, 0.46, '#ffffff'); tx(P, 'ico|nic', 0.78, 0.024, '#ffffff', 'sans', { weight: 300 }); } }),
    'armaf|Club de Nuit Urban Man Elixir': clubNuit({ paper: '#1a1a1a', sideInk: '#ffffff', sideArt: (P) => camo(P, ['#353535', '#4a4a4a', '#232323']), front: (P) => { camo(P, ['#353535', '#4a4a4a', '#232323']); disc(P, 0.75, 0.14, 0.07, '#e8e8e8'); cdn(P, 0.36, 0.38, 0.026, '#ffffff'); specs(P, 0.38, 0.42, '#ffffff'); ctext(P, 'URBAN', 0.5, 0.7, 0.09, '#ffffff', 0.75, { font: 'serif', weight: 800 }); scr(P, 'Man', 0.76, 0.03, '#ffffff'); tx(P, 'ELIXIR', 0.81, 0.016, '#d62828', 'serif', { weight: 700, track: 0.1 }); } }),
    'armaf|Odyssey Homme': carton({ rw: 0.85, rd: 0.7, paper: '#2c292a', rough: 0.85 }, () => ({ front: (P) => { fullBg(P, '#2c292a'); tx(P, 'EAU DE PARFUM', 0.05, 0.008, '#ffffff', 'sans', { track: 0.2 }); tx(P, 'SPRAY / VAPORISATEUR', 0.075, 0.007, '#ffffff', 'sans', { track: 0.2 }); tx(P, 'ODYSSEY', 0.35, 0.02, '#ffffff', 'sans', { track: 0.6 }); tx(P, 'HOMME', 0.45, 0.06, '#ffffff', 'sans', { weight: 300, track: 0.05 }); tx(P, '3.4FL.OZ  100ML℮', 0.92, 0.009, '#ffffff', 'sans', { x: 0.78 }); }, sideArt: (P) => { fullBg(P, '#2c292a'); vtext(P, 'FOR MEN', 0.8, 0.85, 0.05, '#ffffff', { font: 'sans', weight: 400 }); } })),
    'armaf|Tres Nuit': carton({ rw: 0.75, rd: 0.4, paper: '#1c2a4a', rough: 0.6 }, () => ({ front: (P) => { fullBg(P, '#1c2a4a'); box(P, 0, 0, 1, 1, radial(P, 0.5, 0.42, 0.6, ['#2c4a7a', '#1c2a4a'])); P.frame(0.06, 0.045, 0.88, 0.91, '#c8ccd4', 0.002); scr(P, 'Tres Nuit', 0.45, 0.05, '#e8ecf2', { weight: 600 }); tx(P, 'ARMAF', 0.85, 0.022, '#c8ccd4', 'sans', { weight: 500, track: 0.3 }); tx(P, 'EAU DE TOILETTE  ℮100ML  3.4FL.OZ', 0.9, 0.008, '#c8ccd4', 'sans', { track: 0.1 }); } })),

    /* Rasasi */
    rasasi: hawas({ paper: '#1c1819', skin: ['#5a5a5a', '#8a8a8a', '#b0b0b0', '#d0d0d0', '#6a6a6a'], panel: '#141213', ink: '#d8d8d8', foot: '#9a9a9a' }),
    'rasasi|Hawas for Him': hawas({ paper: '#1c1819', skin: ['#5a5a5a', '#8a8a8a', '#b0b0b0', '#d0d0d0', '#6a6a6a'], panel: '#141213', ink: '#d8d8d8', foot: '#9a9a9a' }),
    'rasasi|Hawas Ice': hawas({ paper: '#8dbfe7', metal: 0.45, grad: ['#5a92c6', '#3e78b0', '#22568e'], skin: ['#7a98b4', '#a8c0d6', '#d0dfea', '#90acc6'], panel: '#c6d8e8', ink: '#4a5f78', foot: '#ffffff', ice: true }),
    'rasasi|Shuhrah pour Homme': carton({ rw: 0.8, rd: 0.4, paper: '#1d2a3a', rough: 0.85 }, () => ({ front: (P) => { fullBg(P, '#1d2a3a'); pinstripe(P, 'rgba(255,255,255,0.025)', 200); brushed(P, 'rgba(0,0,0,0.08)', 200); box(P, 0.25, 0.25, 0.5, 0.2, '#111317'); scr(P, 'Shuhrah', 0.33, 0.04, '#d08a3a', { x: 0.45, weight: 600 }); ar(P, 'شهرة', 0.33, 0.03, '#d08a3a', { x: 0.65 }); scr(P, 'Pour Homme', 0.39, 0.01, '#d08a3a'); rasasiLogo(P, 0.85, 0.025, '#d08a3a'); tx(P, 'Eau De Parfum', 0.9, 0.008, '#d08a3a', 'sans'); tx(P, '℮90 ml  3.1 fl oz', 0.925, 0.007, '#d08a3a', 'sans'); } })),
    'rasasi|Daarej pour Homme': carton({ rw: 0.75, rd: 0.4, paper: '#1e1d22', rough: 0.3, metal: 0.2 }, () => ({ front: (P) => { fullBg(P, '#1e1d22'); [[0.02, 1], [0.98, -1]].forEach(([x0, d]) => { for (let k = 0; k < 4; k++) P.path([[x0, 0], [x0 + d * (0.16 - k * 0.03), 0], [x0 + d * (0.04 + k * 0.01), 0.75 - k * 0.1], [x0 + d * 0.005, 0.95]], lin(P, x0, 0, x0 + d * 0.15, 0.6, ['rgba(230,230,235,0.75)', 'rgba(120,120,130,0.2)', 'rgba(200,200,210,0.6)'])); }); tx(P, 'DAAREJ', 0.4, 0.03, '#ffffff', 'sans', { x: 0.4, weight: 300, track: 0.1 }); ar(P, 'داريج', 0.4, 0.028, '#ffffff', { x: 0.66 }); tx(P, 'POUR HOMME', 0.45, 0.008, '#ffffff', 'sans', { track: 0.6 }); rasasiLogo(P, 0.85, 0.025, '#ffffff'); tx(P, '100 ml℮     EAU DE PARFUM     3.33 fl.oz', 0.94, 0.007, '#ffffff', 'sans'); } })),
    'rasasi|La Yuqawam pour Homme': (item, fit) => Object.assign(prop(fit, 0.8, 0.75), { lid: 0.45, paper: { color: '#352b2a', rough: 0.7 }, lining: '#1a1414', front: (P) => { wood(P, 0, 1, ['#352b2a', '#4a3c38', '#2a201f'], true); box(P, 0, 0.435, 1, 0.03, lin(P, 0, 0.435, 0, 0.465, ['#e0a888', '#c48a6a', '#9a6248'])); tx(P, 'LaYuqawam', 0.22, 0.022, '#cbbfb2', 'serif', { x: 0.42, weight: 600 }); ar(P, 'لايقاوم', 0.22, 0.026, '#cbbfb2', { x: 0.63, weight: 600 }); scr(P, 'Rasasi', 0.27, 0.016, '#cbbfb2'); } }),

    /* The Spirit of Dubai */
    spiritdubai: shumukh,
    'spiritdubai|Shumukh': shumukh,
  });
})();
