/* Sillage — Lattafa, Rasasi, Armaf, Rayhaan and The Spirit of Dubai, modelled from
 * reference photos. Rayhaan pours most of its range into one square bottle, so its
 * looks come from the finish: calligraphy prints, mashrabiya lattice cages, leather
 * wraps, marble and relief medallions.
 */
(() => {
  const B = BottleCraft.tools;
  const { kit, box, cyl, sphere, lathe, merge, gradient, glass, solid, fin, paint, Q, S, profile, disc } = B;
  const T = () => B.T;

  /* ---------- painted patterns ---------- */
  const rnd = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
  // Bold brush calligraphy swirls (Rayhaan Pacific, Imperia, Ocean Rush).
  function calli(P, ink, n = 64, wmin = 0.03, wmax = 0.065) {
    const { g, W, H } = P; g.save(); g.strokeStyle = ink; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x0 = rnd(i) * 1.2 - 0.1, y0 = rnd(i + 40) * 1.1 - 0.05, a = rnd(i + 80) * Math.PI * 2, L = 0.15 + rnd(i + 120) * 0.25;
      g.lineWidth = (wmin + rnd(i + 160) * (wmax - wmin)) * H;
      g.beginPath(); g.moveTo(x0 * W, y0 * H);
      g.bezierCurveTo((x0 + Math.cos(a) * L) * W, (y0 + Math.sin(a) * L * 0.4) * H, (x0 + Math.cos(a + 1.6) * L) * W, (y0 + Math.sin(a + 1.6) * L) * H, (x0 + Math.cos(a + 0.6) * L * 0.9) * W, (y0 + Math.sin(a + 0.6) * L * 0.7) * H);
      g.stroke();
    }
    g.restore();
  }
  // Mashrabiya: an eight-pointed star tiling with linking bars.
  function lattice(P, ink, cell = 0.25, lw = 0.02) {
    const { g, W, H } = P, s = cell * W; g.save(); g.strokeStyle = ink; g.lineWidth = lw * H; g.lineJoin = 'round';
    for (let y = -s; y < H + s; y += s) for (let x = -s; x < W + s; x += s) {
      const r = s * 0.36;
      for (const rot of [0, Math.PI / 4]) {
        g.beginPath();
        for (let k = 0; k < 4; k++) { const a = rot + k * Math.PI / 2 + Math.PI / 4; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; k ? g.lineTo(px, py) : g.moveTo(px, py); }
        g.closePath(); g.stroke();
      }
      g.beginPath(); g.moveTo(x + r * 0.9, y); g.lineTo(x + s - r * 0.9, y); g.moveTo(x, y + r * 0.9); g.lineTo(x, y + s - r * 0.9);
      g.moveTo(x + r * 0.7, y + r * 0.7); g.lineTo(x + s / 2, y + s / 2); g.stroke();
    }
    g.restore();
  }
  function leather(P, bg, stitch) {
    const { g, W, H } = P; P.rect(0, 0, 1, 1, bg);
    for (let i = 0; i < 900; i++) P.circle(rnd(i), rnd(i + 999), 0.002 + rnd(i + 3) * 0.004, `rgba(0,0,0,${0.06 + rnd(i + 7) * 0.08})`);
    g.save(); g.setLineDash([0.018 * W, 0.012 * W]); g.strokeStyle = stitch; g.lineWidth = 0.006 * H; g.strokeRect(0.05 * W, 0.05 * H, 0.9 * W, 0.9 * H); g.restore();
  }
  function marble(P) {
    P.rect(0, 0, 1, 1, '#f1eee8');
    for (let i = 0; i < 9; i++) P.path(Array.from({ length: 10 }, (_, j) => [j / 9, rnd(i) * 1.1 - 0.05 + (j / 9) * (rnd(i + 5) - 0.5) * 0.8 + Math.sin(j * 1.7 + i) * 0.03]), `rgba(120,116,110,${0.2 + rnd(i + 9) * 0.35})`, false, 0.003 + rnd(i + 2) * 0.006);
  }
  // Relief medallion: a ring with rays around a beast's face.
  function beast(P, cx, cy, r, ink, shade, kind) {
    const ax = P.H / P.W;
    P.circle(cx, cy, r, ink, 0.012); P.circle(cx, cy, r * 0.9, ink, 0.004);
    if (kind !== 'lion') for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; P.line(cx + Math.cos(a) * r * 0.92 * ax, cy + Math.sin(a) * r * 0.92, cx + Math.cos(a) * r * 1.02 * ax, cy + Math.sin(a) * r * 1.02, ink, 0.004); }
    const fx = (x) => cx + x * r * ax, fy = (y) => cy + y * r;
    if (kind === 'lion') {
      for (let j = 0; j < 2; j++) for (let i = 0; i < 18; i++) { const a = (i + j * 0.5) / 18 * Math.PI * 2, a2 = a + 0.34, R2 = j ? 0.72 : 0.86; P.path([[fx(Math.cos(a) * 0.4), fy(Math.sin(a) * 0.45)], [fx(Math.cos(a + 0.3) * R2), fy(Math.sin(a + 0.3) * R2)], [fx(Math.cos(a2) * 0.4), fy(Math.sin(a2) * 0.45)]], j ? shade : ink); }
      P.ellipse(fx(0), fy(0.05), 0.42 * r * ax, 0.5 * r, 0, shade); P.ellipse(fx(0), fy(0.3), 0.2 * r * ax, 0.16 * r, 0, ink);
    } else {
      P.path([[fx(-0.5), fy(-0.2)], [fx(-0.42), fy(-0.75)], [fx(-0.18), fy(-0.38)], [fx(0.18), fy(-0.38)], [fx(0.42), fy(-0.75)], [fx(0.5), fy(-0.2)], [fx(0.3), fy(0.5)], [fx(0), fy(0.7)], [fx(-0.3), fy(0.5)]], ink);
      P.path([[fx(-0.36), fy(-0.18)], [fx(0.36), fy(-0.18)], [fx(0.2), fy(0.45)], [fx(0), fy(0.58)], [fx(-0.2), fy(0.45)]], shade);
    }
    P.ellipse(fx(-0.14), fy(-0.02), 0.06 * r * ax, 0.035 * r, 0.3, ink); P.ellipse(fx(0.14), fy(-0.02), 0.06 * r * ax, 0.035 * r, -0.3, ink);
    P.path([[fx(-0.08), fy(0.24)], [fx(0.08), fy(0.24)], [fx(0), fy(0.34)]], ink);
  }

  /* ---------- Rayhaan ---------- */
  // The square bottle: w 0.62, h 0.6, with a round cap or a lattice block.
  const RW = 0.62, RH = 0.66, RD = 0.24;
  const rcap = (c) => (c.block
    ? [{ s: 'box', w: 0.32, d: 0.16, h: 0.17, color: c.color || '#1a1a1a', rough: 0.3 }]
    : [{ s: 'cyl', r: 0.05, h: 0.03, fin: 'silver' }, Object.assign({ s: 'cyl', r: 0.105, h: 0.2 }, c)]);
  const ray = (o) => S(Object.assign({ w: RW, h: RH, d: RD, r: 0.025, coat: 0.3, env: 1 }, o.body, {
    art: [{ w: RW - 0.02, h: RH - 0.02, y: RH / 2, draw: o.draw }].concat(o.cap && o.cap.block ? [{ w: 0.3, h: 0.15, y: RH + 0.085, z: 0.083, draw: (P) => { P.rect(0, 0, 1, 1, o.cap.bg || '#222'); lattice(P, o.cap.ink || '#888', 0.3, 0.05); } }] : []),
    cap: rcap(o.cap || { color: '#0d0d0d' }),
  }));
  const rtext = (P, lines) => lines.forEach(([t, y, sz, c, f]) => P.text(t, 0.5, y, sz, c, Object.assign({ font: 'roman', weight: 600, track: 0.08 }, f)));
  const cage = (glassCol, frame, plaque) => (P) => {
    P.rect(0, 0, 1, 1, glassCol); lattice(P, frame, 0.3, 0.022);
    P.rect(0.12, 0.42, 0.76, 0.16, frame, 0.01); P.frame(0.14, 0.44, 0.72, 0.12, plaque, 0.004);
    P.text('RAYHAAN', 0.5, 0.5, 0.09, plaque, { font: 'roman', weight: 700, track: 0.08 });
  };
  const nameplate = (name, ink, sub) => (P) => rtext(P, [['RAYHAAN', 0.3, 0.1, ink], ['EAU DE PARFUM', 0.4, 0.035, ink, { font: 'helv', track: 0.2 }], [name, 0.66, 0.06, ink], [sub || 'FOR HIM', 0.74, 0.03, ink, { font: 'helv', track: 0.25 }]]);

  /* ---------- Lattafa ---------- */
  const badee = (o) => S({
    w: 0.48, h: 0.6, d: 0.22, r: 0.02, solid: o.color, rough: 0.2,
    art: { w: 0.46, h: 0.58, y: 0.3, draw: (P) => {
      const gold = '#d6b46a';
      const dia = (s, c) => P.path([[0.5, 0.48 - s * 0.8], [0.5 + s, 0.48], [0.5, 0.48 + s * 0.8], [0.5 - s, 0.48]], c);
      dia(0.44, gold); dia(0.42, o.color); dia(0.36, gold); dia(0.345, o.color); dia(0.29, gold); dia(0.28, o.color);
      for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) { P.line(0.5 + sx * (0.12 + i * 0.07), 0.04, 0.5 + sx * (0.38 + i * 0.03), 0.3 - i * 0.04, gold, 0.006); P.line(0.5 + sx * (0.12 + i * 0.07), 0.96, 0.5 + sx * (0.38 + i * 0.03), 0.7 + i * 0.04, gold, 0.006); }
      P.rect(0.28, 0.4, 0.44, 0.17, o.color);
      P.text('بديع العود', 0.5, 0.43, 0.06, gold, { font: 'arabic', weight: 700 });
      P.text("BADE'E AL OUD", 0.5, 0.5, 0.035, gold, { font: 'roman', weight: 600, track: 0.08 });
      P.text('Lattafa', 0.5, 0.55, 0.025, gold, { font: 'serif', italic: true });
      P.rect(0.24, 0.84, 0.52, 0.07, gold); P.text(o.sub, 0.5, 0.875, 0.04, o.color, { font: 'roman', weight: 700, track: 0.06 });
    } },
    cap: [{ s: 'cyl', r: 0.05, h: 0.03, fin: 'gold' }, { s: 'box', w: 0.32, d: 0.22, h: 0.2, color: o.color, rough: 0.25 }],
  });

  const fakhar = () => {
    const k = kit(), t = T();
    const body = new t.CylinderGeometry(0.29, 0.29, 0.15, 64); body.rotateX(Math.PI / 2); body.translate(0, 0.29, 0);
    k.solidBody(body, solid({ color: '#0a0a0a', rough: 0.12 }));
    const ring = new t.TorusGeometry(0.255, 0.012, 10, 64); ring.translate(0, 0.29, 0.076); k.part(ring, fin('chrome'));
    k.flat(0.4, 0.4, 0, 0.29, 0.078, paint(0.4, 0.4, (P) => {
      P.path([[0.5, 0.18], [0.72, 0.4], [0.5, 0.62], [0.28, 0.4]], '#cfd3d8'); P.path([[0.5, 0.24], [0.66, 0.4], [0.5, 0.56], [0.34, 0.4]], '#8d9298');
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; P.ellipse(0.5 + Math.cos(a) * 0.06, 0.4 + Math.sin(a) * 0.06, 0.05, 0.03, a, '#e6e9ec'); }
      P.circle(0.5, 0.4, 0.025, '#f4f6f8');
      P.text('Fakhar', 0.5, 0.8, 0.07, '#c8ccd1', { font: 'serif', italic: true });
    }), { foil: true });
    k.part(cyl(0.055, 0.06, 0.07, 0.57, 32), fin('chrome'));
    const cap = new t.CylinderGeometry(0.1, 0.1, 0.06, 48); cap.rotateX(Math.PI / 2); cap.translate(0, 0.74, 0); k.part(cap, solid({ color: '#0d0d0d', rough: 0.15 }));
    const cr = new t.TorusGeometry(0.1, 0.008, 8, 48); cr.translate(0, 0.74, 0.03); k.part(cr, fin('chrome'));
    k.flat(0.14, 0.14, 0, 0.74, 0.034, paint(0.14, 0.14, (P) => P.text('لطافة', 0.5, 0.5, 0.36, '#d8dbe0', { font: 'arabic', weight: 700 })));
    k.top(0.64);
    return k.done();
  };

  const raghba = S({
    body: 'profile', pts: [[-0.32, 0], [0.32, 0], [0.2, 0.58], [-0.2, 0.58]], round: 0.05, w: 0.64, h: 0.58, d: 0.3, juice: '#5a1608', level: 0.92, inset: 0.92,
    art: { w: 0.42, h: 0.34, y: 0.32, z: 0.152, t: [['رغبة', 0.3, 0.32, '#e2bf6a', { font: 'arabic', weight: 700 }], ['RAGHBA', 0.58, 0.1, '#e2bf6a', { font: 'roman', weight: 600, track: 0.25 }], ['Eau De Parfum', 0.8, 0.07, '#e2bf6a', { font: 'helv' }]] },
    cap: [{ s: 'cyl', r: 0.05, h: 0.06, fin: 'gold' }, { s: 'cyl', r: 0.12, rb: 0.15, h: 0.18, glass: '#f4f4f4', op: 0.35 }],
  });

  /* ---------- Rasasi ---------- */
  const hawas = (o) => S({
    w: 0.52, h: 0.62, d: 0.22, r: 0.1, juice: o.juice, level: 0.94, inset: 0.94,
    art: { w: 0.4, h: 0.3, y: 0.38, t: [['هوس', 0.2, 0.2, o.ink, { font: 'arabic', weight: 700 }], ['HAWAS', 0.5, 0.17, o.ink, { font: 'helv', weight: 600, track: 0.04 }], ['For Him', 0.68, 0.07, o.ink, { font: 'helv' }], [o.sub || '', 0.88, 0.1, o.ink, { font: 'helv', weight: 600, track: 0.2 }]] },
    cap: [{ s: 'cyl', r: 0.05, h: 0.04, fin: 'chrome' }, { s: 'cyl', r: 0.105, h: 0.2, color: o.cap, rough: 0.35, seg: 28 }],
  });

  /* ---------- Armaf Club de Nuit ---------- */
  const cdn = (o) => S(Object.assign({ w: 0.6, h: 0.64, d: 0.24, r: 0.02 }, o.body, {
    art: { w: 0.58, h: 0.62, y: 0.32, draw: (P) => {
      if (o.draw) o.draw(P);
      P.text('club de nuit', 0.62, 0.72, 0.05, o.ink, { font: 'helv', weight: 300 });
      P.text(o.name, 0.62, 0.8, o.nameSize || 0.05, o.nameInk || o.ink, { font: o.nameFont || 'helv', weight: 600, italic: !!o.italic });
      P.text('EAU DE PARFUM', 0.62, 0.92, 0.018, o.ink, { font: 'helv', track: 0.2 });
    } },
    cap: [{ s: 'cyl', r: 0.07, h: 0.04, fin: 'chrome' }, { s: 'box', w: 0.3, d: 0.24, h: 0.18, fin: o.capFin, color: o.capColor }],
    extra: [(k) => {
      // The chain and the round ARMAF pendant hanging from the cap.
      k.part(cyl(0.004, 0.004, 0.24, 0.42, 6, 0.12, 0.13), fin('silver'));
      const d = disc(0.085, 0.36, 0.135, B.matOf({ fin: o.tag || 'silver' }), 0.02); d[0].translate(0.12, 0, 0); k.part(d[0], d[1]);
      k.flat(0.12, 0.05, 0.12, 0.36, 0.147, paint(0.12, 0.05, (P) => P.text('ARMAF', 0.5, 0.5, 0.6, '#555555', { font: 'helv', weight: 600, track: 0.1 })));
    }],
  }));

  /* ---------- The Spirit of Dubai: Shumukh ---------- */
  const shumukh = () => {
    const k = kit(), t = T(), gold = fin('gold'), silver = fin('silver');
    k.part(cyl(0.42, 0.44, 0.06, 0, 64), solid({ color: '#0b0b0b', rough: 0.2 }));
    k.wrap(0.425, 0.05, 0.03, 1.2, paint(1.2 * 0.425, 0.05, (P) => P.text('SHUMUKH', 0.5, 0.55, 0.7, '#f2f2f2', { font: 'helv', weight: 700, track: 0.2 })));
    k.part(cyl(0.3, 0.32, 0.06, 0.06, 8), silver);
    k.glassBody((() => { const g = cyl(0.26, 0.26, 0.24, 0.12, 8); g.rotateY(Math.PI / 8); return g; })(), glass({ tint: '#f2e8d8', op: 0.25, flat: true }), null);
    const jg = cyl(0.235, 0.235, 0.19, 0.14, 8); jg.rotateY(Math.PI / 8); k.part(jg, new t.MeshBasicMaterial({ color: B.C('#c06a14'), transparent: true, opacity: 0.88, depthWrite: false }), 1);
    k.part(cyl(0.27, 0.27, 0.05, 0.36, 8), gold);
    k.flat(0.2, 0.04, 0, 0.385, 0.255, paint(0.2, 0.04, (P) => { P.rect(0, 0, 1, 1, '#5a3a10'); P.text('SHUMUKH', 0.5, 0.55, 0.7, '#f0cf7a', { font: 'roman', weight: 700, track: 0.15 }); }));
    k.part(cyl(0.2, 0.24, 0.05, 0.41, 32), silver);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; k.part(cyl(0.012, 0.012, 0.24, 0.46, 10, Math.cos(a) * 0.15, Math.sin(a) * 0.15), silver); }
    k.part(sphere(0.06, 0.58), glass({ tint: '#bfe8ff', op: 0.6 }));
    k.part(cyl(0.18, 0.18, 0.03, 0.7, 32), gold);
    k.part(sphere(0.17, 0.73, 1, 0.75, 1), gold);
    k.part(cyl(0.012, 0.02, 0.08, 0.86, 10), gold);
    k.part(sphere(0.035, 0.96, 0.8, 1.2, 1.4), gold);
    k.top(0.36);
    return k.done();
  };

  BottleCraft.add({
    /* Lattafa */
    "lattafa|Bade'e Al Oud Oud for Glory": badee({ color: '#0c0c0c', sub: 'OUD FOR GLORY' }),
    "lattafa|Bade'e Al Oud Amethyst": badee({ color: '#2a2148', sub: 'AMETHYST' }),
    'lattafa|Fakhar Black': fakhar,
    'lattafa|Ana Abiyedh': S({ w: 0.36, h: 0.62, d: 0.2, r: 0.02, juice: '#f2efe6', level: 0.92, inset: 0.93, art: { w: 0.3, h: 0.46, y: 0.32, draw: (P) => { P.rect(0.25, 0.08, 0.5, 0.34, '#8f9196'); for (let i = 0; i < 5; i++) P.frame(0.28 + i * 0.02, 0.1 + i * 0.012, 0.44 - i * 0.04, 0.3 - i * 0.024, '#c4c6ca', 0.003); P.text('أنا الأبيض', 0.5, 0.58, 0.08, '#555555', { font: 'arabic', weight: 700 }); P.text('ANA ABIYEDH', 0.5, 0.68, 0.035, '#555555', { font: 'roman', track: 0.1 }); P.text('لطافة', 0.5, 0.86, 0.05, '#555555', { font: 'arabic', weight: 700 }); } }, cap: [{ s: 'cyl', r: 0.05, h: 0.03, fin: 'silver' }, { s: 'box', w: 0.22, d: 0.18, h: 0.22, color: '#f4f4f4', rough: 0.4 }] }),
    'lattafa|Yara': S({ w: 0.44, h: 0.64, d: 0.22, r: 0.06, solid: '#f0a8ba', rough: 0.2, coat: 0.3, env: 1,
      art: { w: 0.44, h: 0.3, y: 0.42, draw: (P) => { for (const sx of [-1, 1]) { P.path([[0.5, 0.45], [0.5 + sx * 0.5, 0.15], [0.5 + sx * 0.5, 0.42], [0.5 + sx * 0.12, 0.55]], '#cdd2d8'); P.path([[0.5, 0.5], [0.5 + sx * 0.3, 0.95], [0.5 + sx * 0.18, 0.95], [0.5, 0.58]], '#b8bec6'); } P.circle(0.5, 0.5, 0.14, '#e4e8ec'); P.circle(0.5, 0.5, 0.1, '#f0b8c6'); P.circle(0.5, 0.5, 0.1, '#ffffff', 0.01); } },
      cap: [{ s: 'box', w: 0.44, d: 0.22, h: 0.035, fin: 'silver' }, { s: 'box', w: 0.44, d: 0.22, h: 0.2, color: '#f0a8ba', rough: 0.2, coat: 0.3 }],
      extra: [(k) => k.flat(0.2, 0.12, 0, 0.56, 0.113, paint(0.2, 0.12, (P) => P.text('يارا', 0.5, 0.5, 0.7, '#b8bec6', { font: 'arabic', weight: 700 })))] }),
    'lattafa|Raghba': raghba,
    'lattafa|Hayaati': S({ body: 'profile', pts: [[-0.21, 0], [0.21, 0], [0.21, 0.62], [-0.21, 0.62]], round: 0.12, w: 0.42, h: 0.62, d: 0.2, solid: '#0b0b0b', rough: 0.12,
      art: { w: 0.36, h: 0.5, y: 0.3, t: [['حياتي', 0.32, 0.14, '#d8dade', { font: 'arabic', weight: 700 }], ['HAYAATI', 0.48, 0.05, '#d8dade', { font: 'roman', weight: 600, track: 0.12 }], ['Lattafa', 0.9, 0.04, '#d8dade', { font: 'helv' }]] },
      cap: [{ s: 'cyl', r: 0.05, h: 0.03, fin: 'silver' }, { s: 'box', w: 0.28, d: 0.2, h: 0.18, color: '#0b0b0b', rough: 0.15 }] }),
    'lattafa|Oud Mood': S({ w: 0.46, h: 0.62, d: 0.24, r: 0.06, juice: '#d8a032', level: 0.93, inset: 0.94,
      art: { w: 0.46, h: 0.6, y: 0.31, draw: (P) => { for (const [a, b] of [[0.1, 0.45], [0.45, 0.1], [0.55, 0.92], [0.92, 0.55]]) { P.path([[0, a - 0.04], [1, b - 0.04], [1, b + 0.04], [0, a + 0.04]], '#121212'); } for (const [y, r] of [[0.13, -0.33], [0.88, -0.33]]) P.text('Oud Mood  Oud Mood', 0.5, y, 0.035, '#d8b060', { font: 'serif', italic: true }); P.circle(0.5, 0.42, 0.13, '#f2ede2'); P.circle(0.5, 0.42, 0.13, '#121212', 0.006); P.text('عود مود', 0.5, 0.4, 0.06, '#121212', { font: 'arabic', weight: 700 }); P.text('Oud Mood', 0.5, 0.47, 0.03, '#121212', { font: 'serif', italic: true }); } },
      cap: [{ s: 'cyl', r: 0.05, h: 0.03, fin: 'gold' }, { s: 'lathe', pts: [[0, 0], [0.1, 0], [0.16, 0.08], [0.15, 0.14], [0.06, 0.2], [0, 0.2]], seg: 4, fin: 'gold' }] }),
    'lattafa|Qaed Al Fursan': S({ w: 0.58, h: 0.58, d: 0.22, r: 0.02, solid: '#0b0b0b', rough: 0.15,
      art: { w: 0.5, h: 0.5, y: 0.29, draw: (P) => { P.rect(0, 0, 1, 1, '#c8ac74'); P.rect(0.03, 0.03, 0.94, 0.94, '#1a1712'); P.g.save(); P.g.beginPath(); P.g.rect(0.03 * P.W, 0.03 * P.H, 0.94 * P.W, 0.94 * P.H); P.g.clip(); for (let i = 0; i < 7; i++) { P.frame(0.1 + i * 0.12, 0.05, 0.08, 0.6, '#c8ac74', 0.012); P.line(0, 0.1 + i * 0.1, 1, 0.1 + i * 0.1, 'rgba(200,172,116,0.5)', 0.008); } P.g.restore(); P.path([[0.55, 0.62], [0.52, 0.32], [0.6, 0.18], [0.74, 0.16], [0.82, 0.24], [0.76, 0.3], [0.7, 0.28], [0.68, 0.44], [0.74, 0.62]], '#d8bf8a'); P.rect(0.08, 0.68, 0.84, 0.24, '#1a1712'); P.text('قائد الفرسان', 0.5, 0.75, 0.09, '#d8bf8a', { font: 'arabic', weight: 700 }); P.text('QAED AL FURSAN', 0.5, 0.86, 0.045, '#d8bf8a', { font: 'roman', weight: 600, track: 0.1 }); } },
      cap: [{ s: 'cyl', r: 0.05, h: 0.03, fin: 'silver' }, { s: 'cyl', r: 0.11, h: 0.22, color: '#0b0b0b', rough: 0.15 }] }),

    /* Rasasi */
    'rasasi|Hawas for Him': hawas({ juice: '#9fa2e8', ink: '#2a2f6a', cap: '#3a3d44' }),
    'rasasi|Hawas Ice': hawas({ juice: '#5a78c8', ink: '#f2f4f8', cap: '#eeeeee', sub: 'ICE' }),
    'rasasi|Shuhrah pour Homme': S({ w: 0.56, h: 0.56, d: 0.2, r: 0.04, juice: '#86c4ec', level: 0.94, inset: 0.95, art: { w: 0.4, h: 0.2, y: 0.32, t: [['Shuhrah', 0.45, 0.32, '#b8743a', { font: 'serif', italic: true }], ['POUR HOMME', 0.75, 0.08, '#b8743a', { font: 'helv', track: 0.2 }]] }, cap: [{ s: 'cyl', r: 0.05, h: 0.03, fin: 'silver' }, { s: 'box', w: 0.3, d: 0.2, h: 0.2, color: '#0b0b0b' }] }),
    'rasasi|Daarej pour Homme': S({ body: 'profile', pts: [[-0.3, 0], [0.3, 0], [0.26, 0.3], [0.3, 0.6], [-0.3, 0.6], [-0.26, 0.3]], round: 0.05, w: 0.6, h: 0.6, d: 0.26, juice: '#6c5cd8', level: 0.92, inset: 0.86, art: { w: 0.44, h: 0.16, y: 0.36, z: 0.132, t: [['DAAREJ', 0.4, 0.4, '#e8e8f4', { font: 'helv', weight: 300, track: 0.25 }], ['POUR HOMME', 0.78, 0.14, '#e8e8f4', { font: 'helv', track: 0.3 }]] }, cap: [{ s: 'cyl', r: 0.05, h: 0.03, fin: 'chrome' }, { s: 'cyl', r: 0.12, h: 0.18, fin: 'chrome', seg: 32 }] }),
    'rasasi|La Yuqawam pour Homme': S({ w: 0.44, h: 0.62, d: 0.2, r: 0.06, solid: '#2a1b14', rough: 0.25, art: { w: 0.4, h: 0.56, y: 0.31, draw: (P) => { P.text('LaYuqawam', 0.5, 0.12, 0.05, '#e8dccc', { font: 'serif' }); P.text('Pour Homme', 0.5, 0.2, 0.03, '#e8dccc', { font: 'serif' }); P.path([[0.55, 0.92], [0.42, 0.62], [0.3, 0.6], [0.4, 0.52], [0.36, 0.38], [0.5, 0.45], [0.6, 0.32], [0.64, 0.46], [0.78, 0.44], [0.7, 0.6], [0.8, 0.7], [0.62, 0.72]], '#c0804a'); for (let i = 0; i < 5; i++) P.line(0.55, 0.9, 0.42 + i * 0.07, 0.48 + (i % 2) * 0.05, '#7a4a26', 0.003); } }, cap: [{ s: 'cyl', r: 0.05, h: 0.03, fin: 'bronze' }, { s: 'box', w: 0.28, d: 0.2, h: 0.18, color: '#0b0b0b' }] }),

    /* Armaf */
    'armaf|Club de Nuit Sillage': cdn({ body: { juice: '#e4eaf0', level: 0.94, inset: 0.95 }, capFin: 'silver', ink: '#2a3440', name: 'Sillage', italic: true, nameFont: 'serif', nameSize: 0.07, draw: (P) => { for (let i = 0; i < 22; i++) { const x = rnd(i), y = rnd(i + 50); P.line(x, y, x + (rnd(i + 9) - 0.5) * 0.5, y + (rnd(i + 19) - 0.5) * 0.5, '#4c6a88', 0.004); } } }),
    'armaf|Club de Nuit Untold': cdn({ body: { solid: '#ffffff', grad: ['#f03a9c', '#f6e010'], gc: 0.8, rough: 0.15 }, capFin: 'gold', tag: 'gold', ink: '#5a3a2a', name: 'Untold', draw: (P) => { for (let i = 0; i < 6; i++) P.rect(0, i / 6, 1, 1 / 6, `hsla(${i * 50 + 160},95%,55%,0.4)`); P.text('club de nuit', 0.1, 0.5, 0.06, 'rgba(255,255,255,0.6)', { font: 'helv', weight: 600 }); } }),
    'armaf|Club de Nuit Milestone': cdn({ body: { solid: '#ffffff', grad: ['#dcaa80', '#eccab0'], rough: 0.2, coat: 0.3, env: 1 }, capFin: 'gold', tag: 'gold', ink: '#6a4a30', name: 'MILESTONE', nameSize: 0.04, draw: (P) => { P.circle(0.6, 0.45, 0.16, '#e2bd8a', 0.03); P.text('MILESTONE', 0.6, 0.45, 0.03, '#6a4a30', { font: 'helv', track: 0.1 }); } }),
    'armaf|Club de Nuit Iconic': cdn({ body: { solid: '#1f48d0', rough: 0.15 }, capFin: 'silver', ink: '#ffffff', name: 'ICONIC', nameSize: 0.05, draw: (P) => { for (let i = 0; i < 12; i++) P.path(Array.from({ length: 8 }, (_, j) => [j / 7, 0.2 + i * 0.06 + Math.sin(j * 0.8 + i) * 0.06]), 'rgba(200,220,255,0.35)', false, 0.003); } }),
    'armaf|Club de Nuit Urban Man Elixir': cdn({ body: { solid: '#151515', rough: 0.2 }, capColor: '#1a1a1a', ink: '#e8e8e8', name: 'URBAN Man', nameSize: 0.07, draw: (P) => P.text('Elixir', 0.62, 0.88, 0.04, '#d02020', { font: 'serif', italic: true, weight: 700 }) }),
    'armaf|Tres Nuit': S({ body: 'profile', pts: [[-0.36, 0], [0.36, 0], [0.08, 0.56], [-0.08, 0.56]], round: 0.1, w: 0.72, h: 0.56, d: 0.2, solid: '#ffffff', grad: ['#2a3ab8', '#8aa0f0'], rough: 0.1,
      art: { w: 0.5, h: 0.2, y: 0.18, z: 0.102, t: [['Tres Nuit', 0.45, 0.5, '#f2f2f2', { font: 'serif', italic: true }], ['POUR HOMME', 0.85, 0.14, '#f2f2f2', { font: 'helv', track: 0.2 }]] },
      cap: [{ s: 'cyl', r: 0.05, h: 0.05, fin: 'chrome' }, { s: 'box', w: 0.16, d: 0.12, h: 0.12, fin: 'chrome' }],
      extra: [(k) => { const V = T().Vector3, c = new (T().CatmullRomCurve3)([new V(-0.36, 0.05, 0), new V(-0.2, 0.33, 0), new V(-0.06, 0.55, 0), new V(0.06, 0.55, 0), new V(0.2, 0.33, 0), new V(0.36, 0.05, 0)]); k.part(new (T().TubeGeometry)(c, 40, 0.02, 8), solid({ color: '#6a3a1e', rough: 0.6 })); }] }),
    'armaf|Odyssey Homme': S({ w: 0.46, h: 0.6, d: 0.3, r: 0.12, solid: '#0d0d0d', rough: 0.25,
      art: { w: 0.4, h: 0.3, y: 0.42, t: [['ODYSSEY', 0.2, 0.09, '#f2f2f2', { font: 'helv', weight: 500, track: 0.3 }], ['HOMME', 0.42, 0.13, '#f2f2f2', { font: 'helv', weight: 300, track: 0.1 }], ['EAU DE PARFUM', 0.62, 0.05, '#f2f2f2', { font: 'helv', track: 0.2 }]] },
      cap: [{ s: 'cyl', r: 0.06, h: 0.03, fin: 'gunmetal' }, { s: 'cyl', r: 0.16, h: 0.14, color: '#0d0d0d', rough: 0.3 }],
      extra: [(k) => { const V = T().Vector3, c = new (T().CatmullRomCurve3)([new V(0.14, 0.7, 0), new V(0.34, 0.72, 0), new V(0.36, 0.64, 0), new V(0.3, 0.56, 0)]); k.part(new (T().TubeGeometry)(c, 20, 0.022, 8), solid({ color: '#111111', rough: 0.3 })); }] }),

    /* Rayhaan */
    'rayhaan|Pacific': ray({ body: { solid: '#ffffff', grad: ['#1890c8', '#0c3c8a'], rough: 0.15 }, cap: { fin: 'gold' }, draw: (P) => { calli(P, 'rgba(8,16,30,0.8)', 40, 0.05, 0.1); rtext(P, [['RAYHAAN', 0.36, 0.1, '#d8eef8'], ['EAU DE PARFUM', 0.46, 0.035, '#d8eef8', { font: 'helv', track: 0.2 }], ['PACIFIC', 0.8, 0.06, '#d8eef8'], ['FOR HIM', 0.88, 0.03, '#d8eef8', { font: 'helv', track: 0.25 }]]); } }),
    'rayhaan|Pacific Aloha': ray({ body: { solid: '#ffffff', grad: ['#ee4aa8', '#2f7ae8'], gc: 0.9, rough: 0.15 }, cap: { fin: 'gold' }, draw: (P) => { calli(P, 'rgba(255,255,255,0.12)', 14, 0.01, 0.03); rtext(P, [['PACIFIC', 0.2, 0.1, '#f4f4ff'], ['ALOHA', 0.5, 0.05, '#f4f4ff'], ['RAYHAAN', 0.86, 0.06, '#f8e8b0']]); } }),
    'rayhaan|Lion': ray({ body: { solid: '#0b0b0b', rough: 0.2 }, draw: (P) => { P.frame(0.08, 0.08, 0.84, 0.84, '#3a3a3a', 0.008); beast(P, 0.5, 0.48, 0.34, '#c8a35a', '#9c7a3a', 'lion'); } }),
    'rayhaan|Obsidian': ray({ body: { solid: '#0b0b0b', rough: 0.15 }, cap: { block: true, color: '#141414', bg: '#0b0b0b', ink: '#444' }, draw: cage('#0b0b0b', '#2a2a2a', '#8a8a8a') }),
    'rayhaan|Aquatica': ray({ body: { solid: '#d8dde2', metal: 0.6 }, cap: { block: true, color: '#cfd4da', bg: '#e8ecef', ink: '#9aa0a6' }, draw: cage('#2cc0c8', '#dde2e6', '#7a8088') }),
    'rayhaan|Terra': ray({ body: { solid: '#8a8478', metal: 0.5 }, cap: { block: true, color: '#7c766c', bg: '#8a8478', ink: '#5a554c' }, draw: cage('#e8e8e2', '#8a8478', '#4a463e') }),
    'rayhaan|Italia': ray({ body: { solid: '#f1eee8', rough: 0.15 }, cap: { fin: 'gold' }, draw: (P) => { marble(P); rtext(P, [['ITALIA', 0.24, 0.09, '#c8a050'], ['POUR HOMME', 0.32, 0.03, '#8a7a5a', { font: 'helv', track: 0.25 }], ['RAYHAAN', 0.84, 0.06, '#c8a050']]); } }),
    'rayhaan|Valhalla': ray({ body: { solid: '#ffffff', grad: ['#d81a22', '#0b0b0b'], gc: 0.45, rough: 0.15 }, draw: (P) => { rtext(P, [['RAYHAAN', 0.16, 0.08, '#f2f2f2'], ['X', 0.25, 0.05, '#f2f2f2']]); for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) P.path([[0.5 + sx * 0.05, 0.48], [0.5 + sx * (0.12 + i * 0.05), 0.34 + i * 0.025], [0.5 + sx * (0.1 + i * 0.045), 0.42 + i * 0.03]], '#d8dbe0'); P.circle(0.5, 0.45, 0.06, '#d8dbe0'); P.circle(0.5, 0.45, 0.04, '#b01818'); P.text('VALHALLA', 0.5, 0.86, 0.05, '#f2f2f2', { font: 'roman', weight: 600, track: 0.1 }); } }),
    'rayhaan|Crimson': ray({ body: { solid: '#5a0c10', rough: 0.15 }, cap: { block: true, color: '#5a0c10', bg: '#3a0608', ink: '#a02028' }, draw: cage('#2a0406', '#8a1a20', '#e0a0a0') }),
    'rayhaan|Corium': ray({ body: { solid: '#b8743c', rough: 0.7, coat: 0 }, draw: (P) => { leather(P, '#b8743c', '#e8c8a0'); rtext(P, [['RAYHAAN', 0.3, 0.07, '#4a2a12'], ['EAU DE PARFUM', 0.37, 0.025, '#4a2a12', { font: 'helv', track: 0.2 }], ['CORIUM', 0.56, 0.04, '#4a2a12'], ['LEATHER COLLECTION', 0.78, 0.022, '#4a2a12', { font: 'helv', track: 0.15 }]]); } }),
    'rayhaan|Imperia': ray({ body: { solid: '#ffffff', grad: ['#7a5a2a', '#c8a462'], rough: 0.15 }, draw: (P) => { calli(P, 'rgba(10,8,4,0.85)', 40, 0.05, 0.1); rtext(P, [['RAYHAAN', 0.3, 0.1, '#f4ecd8'], ['EAU DE PARFUM', 0.4, 0.035, '#f4ecd8', { font: 'helv', track: 0.2 }], ['IMPERIA', 0.8, 0.05, '#f4ecd8'], ['FOR HIM', 0.87, 0.028, '#f4ecd8', { font: 'helv', track: 0.25 }]]); } }),
    'rayhaan|Imperia Intense': ray({ body: { solid: '#ffffff', grad: ['#3a2410', '#8a6430'], rough: 0.15 }, draw: (P) => { calli(P, 'rgba(10,8,4,0.85)', 40, 0.05, 0.1); rtext(P, [['RAYHAAN', 0.3, 0.1, '#f4ecd8'], ['EAU DE PARFUM', 0.4, 0.035, '#f4ecd8', { font: 'helv', track: 0.2 }], ['IMPERIA', 0.78, 0.05, '#f4ecd8'], ['INTENSE', 0.86, 0.035, '#e0b860', { font: 'helv', track: 0.25 }]]); } }),
    'rayhaan|Nocturno Elixir': ray({ body: { solid: '#ffffff', grad: ['#1a8aa8', '#05070a'], gc: 1.5, rough: 0.12 }, draw: (P) => rtext(P, [['NOCTURNO', 0.2, 0.08, '#f2f2f2', { font: 'helv', weight: 500 }], ['POUR HOMME', 0.3, 0.03, '#f2f2f2', { font: 'helv', track: 0.25 }], ['ELIXIR', 0.5, 0.06, '#f2f2f2', { font: 'helv', weight: 400 }], ['RAYHAAN', 0.88, 0.06, '#f2f2f2']]) }),
    'rayhaan|Azul': ray({ body: { solid: '#eceae4', rough: 0.3 }, cap: { block: true, color: '#e8e6e0', bg: '#eceae4', ink: '#b8b4aa' }, draw: cage('#1a6a88', '#eceae4', '#8a8478') }),
    'rayhaan|Pharaoh': ray({ body: { solid: '#0b0b0b', rough: 0.15 }, cap: { fin: 'gold' }, draw: (P) => { P.frame(0.08, 0.06, 0.84, 0.88, '#c8a35a', 0.01); P.path([[0.5, 0.14], [0.72, 0.24], [0.84, 0.84], [0.16, 0.84], [0.28, 0.24]], '#b08a34'); for (let i = 0; i < 9; i++) P.line(0.24 + i * 0.065, 0.28, 0.18 + i * 0.08, 0.84, '#14285a', 0.022); P.ellipse(0.5, 0.48, 0.14, 0.19, 0, '#c8963e'); P.ellipse(0.5, 0.48, 0.14, 0.19, 0, '#c8963e'); P.ellipse(0.44, 0.44, 0.03, 0.012, 0, '#111'); P.ellipse(0.56, 0.44, 0.03, 0.012, 0, '#111'); P.rect(0.47, 0.64, 0.06, 0.16, '#c8a35a'); } }),
    'rayhaan|Tonquin Giza': ray({ body: { juice: '#c8501a', level: 0.94, inset: 0.95 }, cap: { fin: 'gold' }, draw: (P) => { P.rect(0.24, 0.28, 0.52, 0.44, '#d8b46a', 0.01); P.frame(0.27, 0.31, 0.46, 0.38, '#8a6a2a', 0.004); rtext(P, [['TONQUIN', 0.42, 0.06, '#2a1a0a'], ['GIZA', 0.52, 0.06, '#2a1a0a'], ['RAYHAAN', 0.64, 0.03, '#2a1a0a']]); } }),
    'rayhaan|Wood Noir': ray({ body: { solid: '#7e776e', rough: 0.55, coat: 0.1 }, cap: { color: '#8a7e70', rough: 0.7 }, draw: nameplate('WOOD NOIR', '#f2f0ec') }),
    'rayhaan|Royal Wood': ray({ body: { solid: '#7a4220', rough: 0.45, coat: 0.2 }, cap: { color: '#d8c4a0', rough: 0.7 }, draw: nameplate('ROYAL WOOD', '#f6eee2') }),
    'rayhaan|Ocean Rush': ray({ body: { solid: '#2a9ae0', rough: 0.15 }, cap: { color: '#f4f4f4', rough: 0.3 }, draw: (P) => { calli(P, 'rgba(12,60,140,0.5)', 40, 0.04, 0.08); rtext(P, [['OCEAN RUSH', 0.22, 0.07, '#f2faff'], ['POUR HOMME', 0.3, 0.03, '#f2faff', { font: 'helv', track: 0.25 }], ['RAYHAAN', 0.84, 0.06, '#f2faff']]); } }),
    'rayhaan|Dark Leather': ray({ body: { solid: '#2a2a2c', rough: 0.7, coat: 0 }, draw: (P) => { leather(P, '#2c2c2e', '#4a4a4c'); rtext(P, [['RAYHAAN', 0.3, 0.07, '#0a0a0a', { shadow: 'rgba(255,255,255,0.35)' }], ['DARK LEATHER', 0.56, 0.035, '#0a0a0a', { shadow: 'rgba(255,255,255,0.35)' }], ['LEATHER COLLECTION', 0.68, 0.02, '#0a0a0a', { font: 'helv', track: 0.15, shadow: 'rgba(255,255,255,0.35)' }]]); } }),
    'rayhaan|Cordova': ray({ body: { solid: '#5a1820', rough: 0.7, coat: 0 }, draw: (P) => { leather(P, '#5c1a22', '#7a2a32'); rtext(P, [['RAYHAAN', 0.3, 0.07, '#2a0a0e'], ['CORDOVA', 0.56, 0.04, '#2a0a0e'], ['LEATHER COLLECTION', 0.68, 0.02, '#2a0a0e', { font: 'helv', track: 0.15 }]]); } }),
    'rayhaan|Tiger Cal Cologne Edition': ray({ body: { solid: '#0d0d0d', rough: 0.3 }, draw: (P) => { P.text('CAL COLOGNE EDITION', 0.5, 0.06, 0.03, '#d8b46a', { font: 'roman', weight: 600, track: 0.08 }); P.rect(0.1, 0.12, 0.8, 0.72, '#3a2a10'); P.frame(0.1, 0.12, 0.8, 0.72, '#d8b46a', 0.012); beast(P, 0.5, 0.48, 0.3, '#e0bc6a', '#6a4a18', 'lion'); for (let i = 0; i < 6; i++) P.line(0.38 + i * 0.04, 0.36, 0.4 + i * 0.04, 0.42, '#1a1206', 0.006); P.text('RAYHAAN', 0.5, 0.92, 0.04, '#d8b46a', { font: 'roman', weight: 600, track: 0.1 }); } }),
    'rayhaan|Wolf': ray({ body: { solid: '#111111', rough: 0.25 }, draw: (P) => { P.frame(0.1, 0.1, 0.8, 0.8, '#5a5a5a', 0.008); beast(P, 0.5, 0.48, 0.32, '#a8acb2', '#55585e', 'wolf'); P.text('RAYHAAN', 0.5, 0.92, 0.04, '#a8acb2', { font: 'roman', weight: 600, track: 0.1 }); } }),
    'rayhaan|Tropical Vibe': ray({ body: { solid: '#ffffff', grad: ['#18b0a0', '#f04a1a'], rough: 0.15 }, cap: { fin: 'gold' }, draw: (P) => { calli(P, 'rgba(255,255,255,0.1)', 14, 0.01, 0.025); P.text('Tropical', 0.5, 0.3, 0.12, '#2a2a2a', { font: 'serif', italic: true }); P.text('VIBE', 0.5, 0.45, 0.13, '#2a2a2a', { font: 'helv', weight: 800 }); P.text('RAYHAAN', 0.5, 0.88, 0.05, '#2a2a2a', { font: 'roman', weight: 600, track: 0.1 }); } }),
    'rayhaan|Jungle Vibe': ray({ body: { solid: '#2a8a3a', rough: 0.15 }, cap: { fin: 'gold' }, draw: (P) => { calli(P, 'rgba(10,50,16,0.35)', 16, 0.01, 0.03); P.text('Jungle', 0.5, 0.3, 0.12, '#e2cf8a', { font: 'serif', italic: true }); P.text('VIBE', 0.5, 0.45, 0.13, '#c8ccc0', { font: 'helv', weight: 800 }); P.text('RAYHAAN', 0.5, 0.88, 0.05, '#e8e8e0', { font: 'roman', weight: 600, track: 0.1 }); } }),
    'rayhaan|Rayhaan Elixir': ray({ body: { solid: '#ffffff', grad: ['#3a1a08', '#a8641e'], rough: 0.15 }, cap: { fin: 'gold' }, draw: (P) => { calli(P, 'rgba(255,214,140,0.18)', 14, 0.015, 0.03); rtext(P, [['RAYHAAN', 0.3, 0.1, '#f4dca0'], ['ELIXIR', 0.6, 0.06, '#f4dca0'], ['EAU DE PARFUM', 0.68, 0.03, '#f4dca0', { font: 'helv', track: 0.2 }]]); } }),

    /* The Spirit of Dubai */
    'spiritdubai|Shumukh': shumukh,
  });
})();
