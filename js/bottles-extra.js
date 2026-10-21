/* Sillage — the remaining designer bottles (Ralph Lauren, Valentino, Dior, Armani,
 * Versace, Prada, Gaultier, Guerlain, Givenchy, D&G, Hugo Boss, Burberry, Azzaro,
 * Calvin Klein, Davidoff, Viktor&Rolf, Bvlgari, Cartier, Carolina Herrera, Gucci,
 * Issey Miyake, Dunhill), each modelled from a reference photo of the real bottle.
 * Flankers of lines built in bottles-designer.js (Polo flask, Valentino Uomo studs,
 * Spicebomb grenade, 212 VIP flask, Guilty) have their geometry rebuilt here,
 * because those templates are local to that file.
 */
(() => {
  const B = BottleCraft.tools;
  const { kit, box, cyl, sphere, lathe, bands, merge, gradient, glass, solid, fin, paint, Q, S, profile, disc } = B;
  const T = () => B.T;

  /* ---------- shared drawing helpers ---------- */
  const FONT = { helv: '"Helvetica Neue", Helvetica, Arial, sans-serif', roman: '"Trajan Pro", "Times New Roman", Georgia, serif', serif: '"Bodoni Moda", Didot, Georgia, serif' };
  // Text running up the bottle (rotated a quarter turn).
  function vtext(P, s, x, y, size, color, o = {}) {
    const { g, W, H } = P; g.save(); g.translate(x * W, y * H); g.rotate(-Math.PI / 2);
    g.font = `${o.italic ? 'italic ' : ''}${o.weight || 500} ${size * W}px ${FONT[o.font || 'helv']}`;
    g.fillStyle = color; g.textBaseline = 'middle'; g.textAlign = o.align || 'center'; g.fillText(s, 0, 0); g.restore();
  }
  // Ralph Lauren polo player (horse, rider and mallet).
  function poloPlayer(P, c) {
    P.ellipse(0.48, 0.6, 0.28, 0.075, -0.08, c);
    P.path([[0.68, 0.56], [0.78, 0.44], [0.86, 0.38], [0.92, 0.42], [0.86, 0.47], [0.78, 0.58]], c);
    P.path([[0.24, 0.6], [0.1, 0.66], [0.08, 0.72], [0.2, 0.66]], c);
    P.path([[0.3, 0.62], [0.2, 0.78], [0.12, 0.84], [0.15, 0.86], [0.26, 0.78], [0.35, 0.65]], c);
    P.path([[0.38, 0.64], [0.4, 0.8], [0.36, 0.92], [0.39, 0.93], [0.44, 0.8], [0.43, 0.64]], c);
    P.path([[0.6, 0.63], [0.66, 0.78], [0.74, 0.86], [0.76, 0.84], [0.7, 0.76], [0.65, 0.62]], c);
    P.path([[0.68, 0.6], [0.8, 0.7], [0.86, 0.8], [0.88, 0.78], [0.83, 0.68], [0.72, 0.58]], c);
    P.path([[0.44, 0.55], [0.46, 0.36], [0.52, 0.3], [0.56, 0.34], [0.54, 0.55]], c);
    P.circle(0.52, 0.25, 0.028, c);
    P.line(0.5, 0.36, 0.36, 0.28, c, 0.014); P.line(0.36, 0.28, 0.22, 0.08, c, 0.01); P.line(0.2, 0.07, 0.27, 0.06, c, 0.016);
    P.line(0.5, 0.52, 0.46, 0.66, c, 0.016);
  }
  // Versace Medusa head in relief, centred at (cx, cy) with radius r (fractions of the art height).
  function medusa(P, cx, cy, r, ink, shade) {
    const ax = P.H / P.W;
    P.circle(cx, cy, r, shade); P.circle(cx, cy, r, ink, 0.008); P.circle(cx, cy, r * 0.8, ink, 0.004);
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; P.path([[cx + Math.cos(a) * r * 0.4 * ax, cy + Math.sin(a) * r * 0.45], [cx + Math.cos(a + 0.25) * r * 0.62 * ax, cy + Math.sin(a + 0.25) * r * 0.62], [cx + Math.cos(a) * r * 0.72 * ax, cy + Math.sin(a) * r * 0.72]], ink, false, 0.006); }
    P.ellipse(cx, cy + r * 0.05, r * 0.3 * ax, r * 0.4, 0, ink);
    P.ellipse(cx - r * 0.12 * ax, cy - r * 0.02, r * 0.06 * ax, r * 0.04, 0, shade); P.ellipse(cx + r * 0.12 * ax, cy - r * 0.02, r * 0.06 * ax, r * 0.04, 0, shade);
  }
  // Gucci interlocking GG.
  function gg(P, cx, cy, r, ink, lw = 0.03) {
    const { g, W, H } = P, R = r * H; g.save(); g.strokeStyle = ink; g.lineWidth = lw * H;
    g.beginPath(); g.arc(cx * W - R * 0.42, cy * H, R, 0.35, Math.PI * 2 - 0.35); g.stroke();
    g.beginPath(); g.arc(cx * W + R * 0.42, cy * H, R, Math.PI + 0.35, Math.PI * 3 - 0.35); g.stroke();
    g.restore();
  }
  const mat = (o) => (o.fin ? fin(o.fin) : o.glass ? glass({ tint: o.glass, op: o.op || 0.9 }) : solid({ color: o.color || '#111111', rough: o.rough != null ? o.rough : 0.2, metal: o.metal || 0, coat: o.coat != null ? o.coat : 0.8, flat: !!o.flat, env: o.env }));

  /* ---------- Ralph Lauren Polo flask ---------- */
  const DOME = [[0, 0], [0.11, 0], [0.11, 0.04], [0.13, 0.08], [0.13, 0.12], [0.11, 0.14], [0, 0.145]];

  /* ---------- Valentino Uomo: a cushion-shaped flacon covered in rockstud pyramids ---------- */
  const UOMO_R = [[0.2, 0], [0.245, 0.04], [0.265, 0.13], [0.265, 0.42], [0.245, 0.5], [0.18, 0.57], [0.12, 0.6]];
  const uomo = (o) => () => {
    const k = kit(), D = 0.3, H = 0.6;
    const outline = [...UOMO_R, ...UOMO_R.slice().reverse().map(([x, y]) => [-x, y])];
    const hw = (y) => { for (let i = 1; i < UOMO_R.length; i++) { const [x0, y0] = UOMO_R[i - 1], [x1, y1] = UOMO_R[i]; if (y >= y0 && y <= y1) return x0 + (x1 - x0) * (y - y0) / (y1 - y0 || 1); } return 0.12; };
    const geo = profile(outline, D, 0.03);
    gradient(geo, o.bottom, o.top, o.gc || 0.7);
    k.solidBody(geo, solid({ grad: true, rough: 0.12, coat: 0.6, env: 1.2 }));
    // Square pyramids set on point, in staggered rows, so their bases tile the glass.
    const studs = [], t = T(), sr = 0.034, step = 2 * sr;
    const stud = (x, y, z, ry) => { const s = new t.ConeGeometry(sr, 0.045, 4); s.rotateX(Math.PI / 2); s.rotateY(ry); s.translate(x, y, z); studs.push(s); };
    const band = [0.24, 0.36];
    for (let j = 0; ; j++) {
      const y = 0.03 + j * sr; if (y > H - 0.025) break;
      if (y > band[0] - 0.015 && y < band[1] + 0.015) continue;
      const lim = hw(y) - 0.02;
      for (let i = -8; i <= 8; i++) { const x = i * step + (j % 2) * sr; if (Math.abs(x) > lim) continue; stud(x, y, D / 2, 0); stud(x, y, -D / 2, Math.PI); }
      if (y > 0.05 && y < 0.46) for (let i = -4; i <= 4; i++) { const z = i * step + (j % 2) * sr; if (Math.abs(z) > D / 2 - 0.025) continue; stud(hw(y), y, z, Math.PI / 2); stud(-hw(y), y, z, -Math.PI / 2); }
    }
    const sg = merge(studs); gradient(sg, o.studBottom || o.bottom, o.studTop || o.top, o.gc || 0.7);
    k.part(sg, solid({ grad: true, metal: 0.35, rough: 0.06, coat: 1, flat: true, env: 2.8 }));
    // The metal band around the waist, carrying the wordmark.
    k.part(box(0.545, D + 0.014, band[1] - band[0], 0.03, band[0]), mat(o.band));
    k.flat(0.42, 0.1, 0, (band[0] + band[1]) / 2, D / 2 + 0.01, paint(0.42, 0.1, (P) => P.text('VALENTINO', 0.5, 0.55, 0.62, o.ink, { font: 'roman', weight: 500, track: 0.04 })));
    k.part(cyl(0.085, 0.085, 0.1, H, 32), mat(o.collar));
    k.part(cyl(0.095, 0.095, 0.09, H + 0.1, 32), mat(o.cap));
    k.top(H);
    return k.done();
  };

  /* ---------- Viktor&Rolf Spicebomb grenade ---------- */
  const GRENADE = [[0, 0], [0.22, 0], [0.3, 0.05], [0.33, 0.16], [0.335, 0.52], [0.3, 0.62], [0.2, 0.69], [0, 0.7]];
  const nightVision = () => {
    const k = kit(), t = T();
    const [low, high] = bands(GRENADE, [0.285]).map((p) => lathe(p, 0, 1, 48));
    gradient(low, '#06401a', '#22c055', 0.9);
    k.solidBody(low, solid({ grad: true, rough: 0.12, coat: 0.6, env: 1.2 }));
    k.part(high, solid({ color: '#0d0e10', rough: 0.15, coat: 0.8 }));
    // Raised pineapple segments: dark metal blocks around the body.
    const blocks = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      for (const [y, h] of [[0.155, 0.12], [0.43, 0.15]]) { const b = new t.BoxGeometry(0.17, h, 0.035); b.translate(0, y + h / 2, 0.325); b.rotateY(a); blocks.push(b); }
    }
    k.part(merge(blocks), solid({ color: '#2a2c30', metal: 0.7, rough: 0.25, coat: 0.4, flat: true }));
    k.part(cyl(0.34, 0.34, 0.13, 0.29, 48), solid({ color: '#0b0b0c', rough: 0.3 }));
    k.wrap(0.343, 0.13, 0.355, 1.5, paint(1.5 * 0.343, 0.13, (P) => {
      P.text('SPICEBOMB', 0.5, 0.26, 0.24, '#f2f2f2', { font: 'helv', weight: 500, track: 0.04 });
      P.text('NIGHT VISION', 0.5, 0.52, 0.16, '#f2f2f2', { font: 'helv', weight: 400, track: 0.08 });
      P.text('VIKTOR®ROLF', 0.5, 0.76, 0.18, '#f2f2f2', { font: 'helv', weight: 500, track: 0.06 });
    }));
    k.part(cyl(0.16, 0.16, 0.16, 0.7, 40), solid({ color: '#111113', rough: 0.25 }));
    k.part(cyl(0.05, 0.05, 0.03, 0.86, 20), solid({ color: '#111113', rough: 0.25 }));
    const pin = new t.TorusGeometry(0.05, 0.01, 8, 24); pin.translate(0.2, 0.84, 0); k.part(pin, solid({ color: '#141414', rough: 0.3 }));
    const tag = new t.CylinderGeometry(0.055, 0.04, 0.03, 6); tag.rotateX(Math.PI / 2); tag.translate(0.24, 0.76, 0.02); k.part(tag, solid({ color: '#141414', rough: 0.3, flat: true }));
    k.top(0.72);
    return k.done();
  };

  /* ---------- Carolina Herrera 212 VIP hip flask ---------- */
  const vip = (o) => () => {
    const k = kit(), W = 0.4, D = 0.2, H = 0.62;
    const body = box(W, D, H, 0.13);
    gradient(body, o.grad[0], o.grad[1], o.gc || 1);
    k.solidBody(body, solid({ grad: true, metal: o.metal || 0, rough: o.rough || 0.18, coat: o.metal ? 0 : 0.8, env: o.metal ? 2.4 : 1.4 }));
    k.part(box(W, D, 0.16, 0.13, H + 0.012), mat(o.cap));
    k.flat(W * 0.86, H * 0.84, 0, H * 0.5, D / 2 + 0.004, paint(W * 0.86, H * 0.84, (P) => {
      if (o.panel) P.path([[0, 0.1], [0.32, 0], [0.32, 1], [0, 1]], o.panel);
      vtext(P, '212', 0.5, 0.56, 0.28, o.num, { weight: 800 });
      vtext(P, 'VIP', 0.5, 0.2, 0.22, o.vip, { weight: 300 });
      vtext(P, o.sub, 0.78, 0.86, 0.11, o.vip, { weight: 400, align: 'left' });
      P.text('CAROLINA HERRERA', 0.5, 0.97, 0.022, o.vip, { font: 'helv', track: 0.15 });
    }));
    k.top(H);
    return k.done();
  };

  /* ---------- Gucci Guilty pour Homme flacon ---------- */
  const guilty = (o) => S({
    w: 0.5, h: 0.66, d: 0.22, r: 0.1, solid: o.solid ? '#ffffff' : undefined, grad: o.grad, gc: o.gc || 0.8, metal: o.metal, rough: o.rough, coat: o.coat, env: o.env,
    juice: o.juice, level: 0.92, inset: 0.94,
    art: { w: 0.46, h: 0.6, y: 0.33, draw: (P) => {
      if (o.frost) P.rect(0, 0, 1, 0.3, o.frost, 0.04);
      gg(P, 0.5, 0.56, 0.085, o.ink, 0.028);
      P.text('GUCCI GUILTY', 0.5, 0.74, 0.04, o.ink, { font: 'roman', weight: 600, track: 0.3 });
      if (o.sub) P.text(o.sub, 0.5, 0.95, 0.026, o.ink, { font: 'roman', weight: 600, track: 0.4 });
    } },
    cap: [{ s: 'cyl', r: 0.07, h: 0.025, fin: o.capFin === 'black' ? 'black' : 'chrome' }, { s: 'cyl', r: 0.055, h: 0.1, fin: o.capFin === 'black' ? 'black' : 'chrome' }, { s: 'cyl', r: 0.065, h: 0.03, fin: o.capFin === 'black' ? 'black' : 'chrome' }],
  });

  /* ---------- registry ---------- */
  BottleCraft.add({
    /* Ralph Lauren */
    'polo|Polo Red Extreme': S({
      body: 'pillow', w: 0.52, h: 0.66, d: 0.26, ex: 0.24, ey: 0.3, solid: '#151515', rough: 0.55, coat: 0.15,
      art: { w: 0.3, h: 0.44, y: 0.32, z: 0.132, draw: (P) => poloPlayer(P, '#d4141e') },
      cap: [{ s: 'cyl', r: 0.1, h: 0.03, color: '#111111' }, { s: 'cyl', r: 0.115, h: 0.05, color: '#c8101c', rough: 0.4 }, { s: 'lathe', pts: DOME, color: '#121212', rough: 0.35 }],
      extra: [(k) => k.wrap(0.117, 0.05, 0.715, 1.6, paint(0.19, 0.05, (P) => P.text('RED EXTREME', 0.5, 0.55, 0.6, '#111111', { font: 'helv', weight: 600, track: 0.1 })))],
    }),
    "polo|Ralph's Club": S({
      w: 0.56, h: 0.58, d: 0.26, r: 0.05, solid: '#ffffff', grad: ['#060914', '#141a2c'], rough: 0.1, coat: 1,
      extra: [(k, { W, H, D }) => {
        // Smoked-metal shoulder plate across the top third.
        k.part(box(W + 0.006, D + 0.006, 0.17, 0.05, H - 0.17), solid({ color: '#3c3e44', metal: 0.85, rough: 0.28, coat: 0, env: 2 }));
        k.flat(0.4, 0.05, 0, H - 0.07, D / 2 + 0.008, paint(0.4, 0.05, (P) => P.text("RALPH'S CLUB", 0.5, 0.55, 0.62, '#b8bcc4', { font: 'helv', weight: 400, track: 0.3 })));
        k.part(box(0.07, 0.04, 0.035, 0.01, H + 0.13).translate(0.13, 0, 0), fin('chrome'));
      }],
      cap: [{ s: 'cyl', r: 0.1, h: 0.04, fin: 'chrome' }, { s: 'cyl', r: 0.12, h: 0.16, fin: 'chrome', seg: 24 }, { s: 'cyl', r: 0.1, h: 0.03, fin: 'gunmetal' }],
    }),
    'polo|Safari for Men': S({
      w: 0.56, h: 0.58, d: 0.26, r: 0.05, juice: '#c86206', level: 0.94, inset: 0.95, jop: 1,
      art: [{ w: 0.58, h: 0.54, y: 0.28, draw: (P) => {
        for (let i = -14; i < 28; i++) { P.line(i * 0.05, 0, i * 0.05 + 0.55, 1, 'rgba(255,226,160,0.45)', 0.006); P.line(i * 0.05, 0, i * 0.05 - 0.55, 1, 'rgba(255,226,160,0.45)', 0.006); }
        P.frame(0.03, 0.03, 0.94, 0.94, 'rgba(255,240,200,0.4)', 0.008);
      } }, { w: 0.3, h: 0.25, y: 0.26, foil: true, draw: (P) => {
        const gd = '#f0d080';
        P.path([[0.38, 0.3], [0.62, 0.3], [0.62, 0.6], [0.5, 0.72], [0.38, 0.6]], gd);
        P.path([[0.38, 0.3], [0.62, 0.3], [0.62, 0.6], [0.5, 0.72], [0.38, 0.6], [0.38, 0.3]], '#6a4a10', false, 0.012);
        for (const s of [-1, 1]) { P.ellipse(0.5 + s * 0.2, 0.42, 0.07, 0.17, s * 0.3, gd); P.circle(0.5 + s * 0.2, 0.2, 0.07, gd); }
        P.ellipse(0.5, 0.14, 0.08, 0.08, 0, gd);
        P.rect(0.12, 0.78, 0.76, 0.12, gd, 0.02); P.text('RALPH LAUREN', 0.5, 0.84, 0.08, '#5a3a08', { font: 'roman', weight: 700 });
      } }],
      cap: [{ s: 'cyl', r: 0.07, h: 0.07, fin: 'gold' }, { s: 'cyl', r: 0.105, h: 0.13, fin: 'gold' }, { s: 'cyl', r: 0.1, h: 0.04, fin: 'silver' }],
    }),

    /* Valentino Uomo */
    'valentino|Uomo': uomo({ bottom: '#e8ddd2', top: '#6a4634', studBottom: '#d8c8b8', studTop: '#4a2e20', band: { color: '#c8964e', metal: 1, rough: 0.28, coat: 0, env: 2.2 }, ink: '#6a4416', collar: { color: '#b8884a', metal: 1, rough: 0.3, coat: 0, env: 2.2 }, cap: { color: '#2a1e18', rough: 0.25 } }),
    'valentino|Uomo Born in Roma Coral Fantasy': uomo({ bottom: '#f0b0a0', top: '#24161a', studBottom: '#e89484', studTop: '#1a1014', gc: 0.9, band: { color: '#0d0b0c', rough: 0.25 }, ink: '#f4c4b8', collar: { color: '#141214', rough: 0.2 }, cap: { color: '#161416', rough: 0.2 } }),
    'valentino|Uomo Acqua': uomo({ bottom: '#e6eadf', top: '#c8d0c2', studBottom: '#f2f5ee', studTop: '#aeb8aa', band: { fin: 'silver' }, ink: '#5a5e62', collar: { fin: 'chrome' }, cap: { color: '#1a1a1c', rough: 0.25 } }),

    /* Dior Homme (2005): clear block, gilded dip-tube column and a clear cap over a black core */
    'dior|Dior Homme 2005': S({
      w: 0.44, h: 0.62, d: 0.24, r: 0.01, juice: '#f2c870', level: 0.92, inset: 0.93, jop: 1,
      art: [{ w: 0.045, h: 0.56, y: 0.32, bg: '#b58a36' }, { w: 0.4, h: 0.08, y: 0.1, t: [['DIOR HOMME', 0.5, 0.5, 0.5, '#2a2a2a', { font: 'roman', track: 0.04 }]] }],
      cap: [{ s: 'cyl', r: 0.07, h: 0.05, fin: 'silver' }, { s: 'cyl', r: 0.075, h: 0.17, color: '#0b0b0b', stay: true }, { s: 'box', w: 0.42, d: 0.22, h: 0.22, rr: 0.01, glass: '#ffffff', op: 0.14 }],
      top: 0.62,
    }),

    /* Giorgio Armani */
    'armani|Acqua di Giò Parfum': S({
      w: 0.48, h: 0.66, d: 0.26, r: 0.08, solid: '#ffffff', grad: ['#f2f2f2', '#070708'], gc: 0.28, rough: 0.15, coat: 0.6, env: 1.1,
      art: { w: 0.42, h: 0.6, y: 0.34, t: [['ACQUA DI', 0.14, 0.065, '#f0f0f0', { font: 'roman', track: 0.04 }], ['GIÒ', 0.28, 0.15, '#f0f0f0', { font: 'roman' }], ['GIORGIO ARMANI', 0.4, 0.045, '#f0f0f0', { font: 'roman', track: 0.04 }], ['PARFUM', 0.93, 0.035, '#222222', { font: 'roman', track: 0.15 }]] },
      cap: [{ s: 'cyl', r: 0.13, h: 0.02, fin: 'silver' }, { s: 'cyl', r: 0.13, h: 0.22, color: '#0c0c0d', rough: 0.3 }],
    }),
    'armani|Stronger With You Absolutely': S({
      w: 0.52, h: 0.54, d: 0.26, r: 0.12, solid: '#ffffff', grad: ['#1e0804', '#c8460e'], gc: 0.55, rough: 0.12, coat: 0.5, env: 1,
      art: { w: 0.42, h: 0.48, y: 0.27, t: [['STRONGER WITH', 0.2, 0.05, '#f6d8c4', { font: 'helv', track: 0.15 }], ['YOU', 0.42, 0.24, '#f6d8c4', { font: 'helv', weight: 300 }], ['ABSOLUTELY', 0.64, 0.05, '#f6d8c4', { font: 'helv', track: 0.25 }], ['EMPORIO ⊕ ARMANI', 0.94, 0.045, '#e8c8a8', { font: 'roman', track: 0.08 }]] },
      cap: [{ s: 'cyl', r: 0.08, h: 0.04, fin: 'gunmetal' }, { s: 'sphere', r: 0.12, sx: 1.2, sy: 0.85, color: '#35363a', metal: 0.85, rough: 0.3, coat: 0 }],
      extra: [(k) => { for (const dy of [0.05, 0.09, 0.13]) { const t = new (T().TorusGeometry)(0.135, 0.008, 6, 40); t.rotateX(Math.PI / 2); t.translate(0, 0.58 + dy, 0); k.part(t, fin('gunmetal')); } }],
    }),
    "armani|Privé Bois d'Encens": S({
      w: 0.46, h: 0.62, d: 0.34, r: 0.02, solid: '#0b0b0b', rough: 0.12, coat: 1,
      art: { w: 0.2, h: 0.2, y: 0.42, bg: '#f2ead0', frame: '#c8a050', t: [['BOIS', 0.3, 0.12, '#222222', { font: 'serif', weight: 700 }], ["D'ENCENS", 0.46, 0.12, '#222222', { font: 'serif', weight: 700 }], ['ARMANI/PRIVÉ', 0.76, 0.07, '#222222', { font: 'serif' }]] },
      cap: [{ s: 'cyl', r: 0.07, h: 0.02, color: '#0b0b0b' }, { s: 'sphere', r: 0.17, sx: 1.25, sy: 0.55, sz: 0.95, color: '#0b0b0b', rough: 0.1 }],
    }),

    /* Versace */
    'versace|Pour Homme': S({
      w: 0.56, h: 0.64, d: 0.24, r: 0.03, solid: '#ffffff', grad: ['#1e7cc8', '#8cccf2'], gc: 0.8, rough: 0.1, coat: 0.4, env: 0.9,
      art: { w: 0.5, h: 0.58, y: 0.32, draw: (P) => { P.line(0.5, 0, 0.5, 0.38, 'rgba(255,255,255,0.4)', 0.004); } },
      extra: [(k, { D }) => {
        const m = disc(0.075, 0.26, D / 2 + 0.006, fin('silver')); k.part(m[0], m[1]);
        k.flat(0.15, 0.15, 0, 0.26, D / 2 + 0.018, paint(0.15, 0.15, (P) => medusa(P, 0.5, 0.5, 0.42, 'rgba(40,46,56,0.9)', 'rgba(255,255,255,0)')));
      }],
      cap: [{ s: 'cyl', r: 0.09, h: 0.04, fin: 'chrome' }, { s: 'cyl', r: 0.12, h: 0.15, color: '#6a96b8', rough: 0.35, coat: 0.3 }],
    }),
    'versace|The Dreamer': S({
      w: 0.34, h: 0.7, d: 0.2, r: 0.01, juice: '#eee08a', level: 0.92, inset: 0.93, jop: 1,
      art: { w: 0.32, h: 0.64, y: 0.34, draw: (P) => {
        medusa(P, 0.5, 0.17, 0.13, 'rgba(120,110,50,0.75)', 'rgba(255,250,210,0.5)');
        P.path([[0.5, 0.3], [0.58, 0.45], [0.52, 0.6], [0.36, 0.72], [0.3, 0.9]], 'rgba(120,110,50,0.6)', false, 0.008);
      } },
      cap: [{ s: 'cyl', r: 0.08, h: 0.05, fin: 'chrome' }, { s: 'cyl', r: 0.11, h: 0.06, color: '#0b0b0b', seg: 8 }, { s: 'cyl', r: 0.115, h: 0.1, fin: 'gold', seg: 8 }, { s: 'cyl', r: 0.07, h: 0.01, color: '#0b0b0b', seg: 8 }],
    }),

    /* Prada */
    'prada|Amber pour Homme': S({
      w: 0.54, h: 0.62, d: 0.22, r: 0.04, juice: '#b8aef2', level: 0.92, inset: 0.94, jop: 1,
      art: { w: 0.5, h: 0.08, y: 0.06, t: [['PRADA', 0.5, 0.5, 0.62, '#d8dade', { font: 'roman', weight: 700, track: 0.12, x: 0.68 }]] },
      extra: [(k, { W, H, D }) => {
        k.part(box(W + 0.006, D + 0.006, 0.12, 0.04, H - 0.12), solid({ color: '#c8ccd2', metal: 1, rough: 0.35, coat: 0, env: 2.2 }));
        k.flat(0.46, 0.06, 0, H - 0.06, D / 2 + 0.008, paint(0.46, 0.06, (P) => { P.text('AMBER POUR HOMME · EAU DE TOILETTE', 0.5, 0.35, 0.22, '#6a6e74', { font: 'helv', track: 0.05 }); P.text('PRADA MILANO', 0.5, 0.72, 0.2, '#6a6e74', { font: 'helv', track: 0.2 }); }));
      }],
      cap: [{ s: 'cyl', r: 0.075, h: 0.18, fin: 'chrome' }],
    }),

    /* Jean Paul Gaultier */
    'jpg|Le Beau Le Parfum': (item) => {
      // Gaultier torso in deep teal glass that darkens to black at the shoulders.
      const k = kit();
      const prof = [[0, 0], [0.2, 0], [0.24, 0.06], [0.215, 0.2], [0.195, 0.31], [0.24, 0.45], [0.3, 0.58], [0.325, 0.67], [0.27, 0.75], [0.13, 0.81], [0.07, 0.835], [0, 0.84]];
      k.solidBody(gradient(lathe(prof, 0, 0.62, 56), '#0e7a78', '#020305', 1.6), solid({ grad: true, rough: 0.08, coat: 1, env: 1.2 }));
      k.part(cyl(0.065, 0.065, 0.1, 0.83, 32), fin('gold'));
      k.part(cyl(0.045, 0.045, 0.06, 0.93, 24), fin('gold'));
      k.top(0.94);
      // The gilded fig leaf at the hips.
      k.flat(0.12, 0.13, 0, 0.12, 0.152, paint(0.12, 0.13, (P) => {
        const c = '#e2b85a';
        P.path([[0.5, 0.95], [0.46, 0.55], [0.18, 0.62], [0.1, 0.4], [0.3, 0.3], [0.2, 0.1], [0.42, 0.18], [0.5, 0.02], [0.58, 0.18], [0.8, 0.1], [0.7, 0.3], [0.9, 0.4], [0.82, 0.62], [0.54, 0.55]], c);
        P.line(0.5, 0.2, 0.5, 0.9, '#9a7420', 0.02);
      }), { foil: true });
      return k.done();
    },
    'jpg|Kokorico': S({
      body: 'profile', d: 0.24, round: 0.015, solid: '#0a0a0a', rough: 0.08, coat: 1, h: 0.72,
      pts: [[-0.14, 0], [0.14, 0], [0.11, 0.08], [0.12, 0.14], [0.2, 0.165], [0.25, 0.2], [0.265, 0.24], [0.275, 0.28], [0.262, 0.3], [0.285, 0.325], [0.272, 0.35], [0.285, 0.37], [0.335, 0.415], [0.285, 0.47], [0.295, 0.51], [0.28, 0.56], [0.25, 0.62], [0.18, 0.68], [0.08, 0.72], [-0.06, 0.72], [-0.18, 0.68], [-0.26, 0.6], [-0.3, 0.5], [-0.3, 0.4], [-0.27, 0.32], [-0.2, 0.24], [-0.15, 0.17], [-0.15, 0.08]],
      art: { w: 0.5, h: 0.24, x: -0.02, y: 0.36, z: 0.12, draw: (P) => { P.g.save(); P.g.translate(P.W * 0.48, P.H * 0.5); P.g.rotate(-0.22); P.g.font = `italic 700 ${P.H * 0.42}px "Brush Script MT", "Segoe Script", cursive`; P.g.fillStyle = '#d4141e'; P.g.textAlign = 'center'; P.g.textBaseline = 'middle'; P.g.fillText('Kokorico', 0, 0); P.g.restore(); } },
      cap: [{ s: 'cyl', r: 0.06, h: 0.05, color: '#0a0a0a', x: 0.02 }, { s: 'cyl', r: 0.035, h: 0.06, fin: 'chrome', x: 0.02 }],
      top: 0.71,
    }),

    /* Guerlain */
    'guerlain|Santal Royal': () => {
      const k = kit(), t = T();
      k.solidBody(cyl(0.21, 0.21, 0.42, 0, 56), solid({ color: '#0b0a09', rough: 0.1, coat: 1 }));
      // Bee-hive shoulders: black glass under a gold honeycomb.
      const comb = paint(1, 0.5, (P) => {
        P.rect(0, 0, 1, 1, '#100c06');
        const { g, W, H } = P, s = W / 26; g.strokeStyle = '#d6aa52'; g.lineWidth = s * 0.22;
        for (let row = 0; row < 12; row++) for (let i = 0; i < 28; i++) {
          const cx = i * s * 1.0 + (row % 2) * s * 0.5, cy = row * s * 0.87;
          g.beginPath(); for (let j = 0; j < 6; j++) { const a = Math.PI / 6 + j * Math.PI / 3; const x = cx + Math.cos(a) * s * 0.55, y = cy + Math.sin(a) * s * 0.55; j ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.stroke();
        }
      }, 512);
      k.part(lathe([[0.21, 0], [0.205, 0.04], [0.18, 0.1], [0.13, 0.15], [0.08, 0.18], [0.06, 0.19], [0, 0.19]], 0.42, 1, 56), new t.MeshPhysicalMaterial({ map: comb, metalness: 0.6, roughness: 0.3, clearcoat: 0.6, envMapIntensity: 1.8 }));
      k.flat(0.2, 0.28, 0, 0.2, 0.214, paint(0.2, 0.28, (P) => {
        P.rect(0, 0, 1, 1, '#d8b066'); P.frame(0.06, 0.04, 0.88, 0.92, '#6a4a14', 0.006);
        P.text('SANTAL', 0.5, 0.18, 0.08, '#1a1208', { font: 'helv', weight: 600, track: 0.05 });
        P.text('ROYAL', 0.5, 0.28, 0.08, '#1a1208', { font: 'helv', weight: 600, track: 0.05 });
        P.text('木', 0.5, 0.52, 0.1, '#8a6420', { font: 'helv' });
        P.text('GUERLAIN', 0.5, 0.78, 0.085, '#1a1208', { font: 'helv', weight: 600, track: 0.05 });
        P.text('PARIS', 0.5, 0.87, 0.04, '#1a1208', { font: 'helv' });
      }));
      k.part(cyl(0.05, 0.05, 0.14, 0.6, 24), fin('gold'));
      k.part(sphere(0.075, 0.82, 1, 1.15, 1), fin('gold'));
      k.part(cyl(0.065, 0.065, 0.02, 0.73, 24), fin('gold'));
      k.top(0.6);
      return k.done();
    },
    'guerlain|Tobacco Honey': S({
      body: 'profile', d: 0.24, round: 0.01, juice: '#d0601c', level: 0.92, inset: 0.93, jop: 0.95, h: 0.6,
      pts: [[-0.21, 0], [0.21, 0], [0.24, 0.03], [0.24, 0.55], [0.19, 0.6], [-0.19, 0.6], [-0.24, 0.55], [-0.24, 0.03]],
      art: { w: 0.24, h: 0.34, y: 0.3, z: 0.12, bg: '#0b0a09', draw: (P) => {
        P.frame(0.06, 0.05, 0.88, 0.9, '#c8a050', 0.008);
        P.text('TOBACCO', 0.5, 0.3, 0.06, '#f2ead8', { font: 'helv', track: 0.08 }); P.text('HONEY', 0.5, 0.38, 0.06, '#f2ead8', { font: 'helv', track: 0.08 });
        P.text('GUERLAIN', 0.5, 0.78, 0.07, '#f2ead8', { font: 'helv', weight: 600, track: 0.1 }); P.text('PARIS', 0.5, 0.85, 0.03, '#f2ead8', { font: 'helv', track: 0.2 });
      } },
      cap: [{ s: 'cyl', r: 0.11, h: 0.13, color: '#141414', rough: 0.7, coat: 0 }, { s: 'cyl', r: 0.11, h: 0.03, color: '#0b0b0b', rb: 0.11 }, { s: 'lathe', seg: 8, pts: [[0, 0], [0.15, 0], [0.2, 0.04], [0.2, 0.1], [0.17, 0.13], [0, 0.13]], color: '#0b0b0b', rough: 0.15, sz: 0.75 }],
      extra: [(k) => {
        k.wrap(0.112, 0.13, 0.665, Math.PI * 2, paint(0.7, 0.13, (P) => { for (let i = 0; i < 70; i++) P.line(i / 70, 0, i / 70 + 0.03, 1, 'rgba(90,90,90,0.6)', 0.03); }));
        const m = disc(0.035, 0.665, 0.115, fin('gunmetal'), 0.012); k.part(m[0], m[1]);
      }],
    }),

    /* Givenchy */
    'givenchy|Pi': S({
      body: 'profile', d: 0.22, round: 0.03, juice: '#e8ae20', level: 0.92, inset: 0.92, h: 0.6, jop: 1,
      pts: [[-0.27, 0], [0.27, 0], [0.2, 0.6], [-0.2, 0.6]],
      art: { w: 0.4, h: 0.54, y: 0.3, z: 0.112, draw: (P) => {
        for (let i = 0; i < 30; i++) P.path(Array.from({ length: 6 }, (_, j) => [0.55 + Math.sin(i * 1.3) * 0.25 + j * 0.02, i / 30 + Math.sin(j + i) * 0.01]), 'rgba(255,240,190,0.3)', false, 0.004);
        P.path([[0.58, 0.32], [0.86, 0.26], [0.86, 0.42], [0.72, 0.44], [0.72, 0.8], [0.58, 0.82]], 'rgba(255,230,160,0.25)');
        P.text('π', 0.42, 0.36, 0.42, '#111111', { font: 'serif', weight: 400 });
        P.text('GIVENCHY', 0.5, 0.9, 0.055, '#2a2a2a', { font: 'helv', weight: 500, track: 0.25 });
      } },
      cap: [{ s: 'cyl', r: 0.07, h: 0.03, fin: 'gold' }, { s: 'cyl', r: 0.055, h: 0.1, fin: 'gold' }, { s: 'cyl', r: 0.025, h: 0.03, fin: 'gold' }],
      extra: [(k) => { const a = new (T().TorusGeometry)(0.115, 0.02, 10, 32, Math.PI); a.scale(1, 1.1, 1.4); a.translate(0, 0.62, 0); k.part(a, fin('gold')); }],
    }),

    /* Dolce & Gabbana */
    'dg|Pour Homme (1994)': S({
      body: 'pillow', w: 0.54, h: 0.6, d: 0.24, ex: 0.2, ey: 0.3, juice: '#d6d690', level: 0.93, inset: 0.93,
      art: { w: 0.3, h: 0.1, y: 0.4, z: 0.122, bg: '#0b0b0b', draw: (P) => { P.frame(0.03, 0.08, 0.94, 0.84, '#c8ccd0', 0.03); P.text('DOLCE & GABBANA', 0.5, 0.42, 0.26, '#f2f2f2', { font: 'helv', weight: 500 }); P.text('EAU DE TOILETTE', 0.5, 0.7, 0.14, '#f2f2f2', { font: 'helv' }); } },
      cap: [{ s: 'cyl', r: 0.12, h: 0.06, fin: 'chrome' }, { s: 'lathe', pts: [[0, 0], [0.125, 0], [0.13, 0.08], [0.12, 0.11], [0, 0.115]], color: '#0b0b0b', rough: 0.15 }],
    }),

    /* Hugo Boss */
    'boss|Hugo Man': S({
      body: 'profile', d: 0.18, round: 0.05, juice: '#a6c0e0', level: 0.92, inset: 0.92, jop: 0.95, h: 0.6,
      pts: [[-0.24, 0], [0.24, 0], [0.26, 0.38], [0.18, 0.53], [0.09, 0.6], [-0.09, 0.6], [-0.18, 0.53], [-0.26, 0.38]],
      art: { w: 0.18, h: 0.18, y: 0.2, z: 0.092, bg: '#ffffff', draw: (P) => {
        P.rect(0.05, 0.05, 0.9, 0.45, '#c8141c'); P.text('HUGO', 0.5, 0.24, 0.24, '#ffffff', { font: 'helv', weight: 700 }); P.text('HUGO BOSS', 0.5, 0.4, 0.07, '#ffffff', { font: 'helv' });
        P.text('eau de toilette', 0.5, 0.62, 0.08, '#222222', { font: 'helv' }); P.text('natural spray', 0.5, 0.74, 0.08, '#222222', { font: 'helv' }); P.text('vaporisateur', 0.5, 0.86, 0.08, '#222222', { font: 'helv' });
      } },
      cap: [{ s: 'cyl', r: 0.08, h: 0.03, color: '#3a7a5a', rough: 0.6, coat: 0 }, { s: 'cyl', r: 0.1, h: 0.04, fin: 'silver' }, { s: 'cyl', r: 0.11, h: 0.1, fin: 'silver', seg: 30 }],
      extra: [(k) => {
        const t = T(), V = t.Vector3;
        const c = new t.CatmullRomCurve3([new V(0.1, 0.72, 0), new V(0.2, 0.72, 0), new V(0.26, 0.64, 0), new V(0.24, 0.54, 0), new V(0.18, 0.52, 0)]);
        k.part(new t.TubeGeometry(c, 24, 0.012, 8), solid({ color: '#3a7a5a', rough: 0.6, coat: 0 }));
      }],
    }),

    /* Burberry */
    'burberry|London for Men': S({
      w: 0.48, h: 0.62, d: 0.22, r: 0.02, solid: '#6e5246', rough: 0.7, coat: 0,
      art: { w: 0.48, h: 0.56, y: 0.33, draw: (P) => {
        P.rect(0, 0, 1, 1, '#6a4a3e');
        for (const [x, w, c] of [[0.08, 0.16, 'rgba(25,16,16,0.6)'], [0.42, 0.03, 'rgba(200,180,170,0.4)'], [0.58, 0.2, 'rgba(25,16,16,0.55)'], [0.88, 0.04, 'rgba(170,40,40,0.6)']]) { P.rect(x, 0, w, 1, c); }
        for (const [y, h, c] of [[0.1, 0.04, 'rgba(170,40,40,0.55)'], [0.28, 0.18, 'rgba(25,16,16,0.55)'], [0.62, 0.03, 'rgba(200,180,170,0.4)'], [0.78, 0.16, 'rgba(25,16,16,0.55)']]) { P.rect(0, y, 1, h, c); }
        for (let i = 0; i < 160; i++) P.line(i / 160 - 0.2, 0, i / 160 + 0.2, 1, 'rgba(255,255,255,0.04)', 0.002);
      } },
      extra: [(k) => k.part(box(0.48, 0.22, 0.05, 0.02, 0), glass({ tint: '#5a3a30', op: 0.85 }))],
      cap: [{ s: 'box', w: 0.22, d: 0.14, h: 0.16, rr: 0.01, color: '#3e1618', rough: 0.2 }],
    }),

    /* Azzaro */
    'azzaro|Azzaro pour Homme': S({
      w: 0.4, h: 0.64, d: 0.24, r: 0.01, juice: '#c86800', level: 0.94, inset: 0.94, jop: 1,
      art: { w: 0.36, h: 0.58, y: 0.32, draw: (P) => {
        const e = 'rgba(255,214,140,0.75)';
        P.path([[0.5, 0.22], [0.36, 0.62], [0.42, 0.62], [0.5, 0.36], [0.58, 0.62], [0.64, 0.62]], e, false, 0.012);
        P.line(0.38, 0.66, 0.62, 0.66, e, 0.012);
        P.text('AZZARO', 0.5, 0.86, 0.065, '#f0c060', { font: 'roman', weight: 600, track: 0.25 });
        P.text('POUR HOMME', 0.5, 0.93, 0.04, '#f0c060', { font: 'roman', track: 0.25 });
      } },
      cap: [{ s: 'box', w: 0.4, d: 0.24, h: 0.02, rr: 0.01, fin: 'silver' }, { s: 'box', w: 0.4, d: 0.24, h: 0.16, rr: 0.01, color: '#0b0b0b', rough: 0.15 }],
    }),

    /* Calvin Klein */
    'ck|Defy': S({
      w: 0.5, h: 0.6, d: 0.2, r: 0.03, juice: '#98aec6', level: 0.92, inset: 0.93,
      art: { w: 0.46, h: 0.54, y: 0.3, t: [['CALVIN KLEIN', 0.83, 0.05, '#1a2440', { font: 'helv', weight: 500, x: 0.72 }], ['DEFY', 0.92, 0.1, '#1a2440', { font: 'helv', weight: 800, x: 0.72 }]] },
      cap: [{ s: 'cyl', r: 0.08, h: 0.03, fin: 'silver' }, { s: 'cyl', r: 0.115, h: 0.16, color: '#1e2a4a', rough: 0.3 }],
    }),

    /* Davidoff */
    'davidoff|Hot Water': S({
      w: 0.38, h: 0.72, d: 0.22, r: 0.01, solid: '#ffffff', grad: ['#6a0404', '#e41a14'], gc: 1.2, rough: 0.1, coat: 0.6, env: 1,
      art: { w: 0.34, h: 0.66, y: 0.36, t: [['DAVIDOFF', 0.08, 0.035, '#d8dcdf', { font: 'roman', track: 0.15 }], ['HOT', 0.24, 0.1, '#d8dcdf', { font: 'roman', track: 0.05 }], ['WATER', 0.31, 0.035, '#d8dcdf', { font: 'roman', track: 0.3 }], ['EAU DE TOILETTE', 0.92, 0.025, '#d8dcdf', { font: 'helv', track: 0.15 }]] },
      extra: [(k) => { for (const y of [0.2, 0.4, 0.58]) k.part(box(0.392, 0.232, 0.016, 0.005, y), solid({ color: '#5a0606', rough: 0.2 })); }],
      cap: [{ s: 'cyl', r: 0.07, h: 0.03, fin: 'gunmetal' }, { s: 'cyl', r: 0.1, h: 0.16, color: '#141414', rough: 0.25 }],
    }),
    'davidoff|Zino': S({
      w: 0.48, h: 0.6, d: 0.26, r: 0.02, solid: '#0c0b0a', rough: 0.15, coat: 1,
      art: { w: 0.46, h: 0.56, y: 0.3, draw: (P) => {
        for (let i = 0; i < 14; i++) P.rect(i / 14, 0, 0.012, 1, 'rgba(120,100,70,0.12)');
        P.text('EAU DE TOILETTE', 0.5, 0.06, 0.035, '#e8d8b8', { font: 'roman', track: 0.15 });
        P.text('Zino', 0.5, 0.74, 0.07, '#d8b878', { font: 'serif', italic: true });
        P.text('DAVIDOFF', 0.5, 0.83, 0.06, '#d8b878', { font: 'roman', track: 0.12 });
      } },
      cap: [{ s: 'cyl', r: 0.06, h: 0.03, color: '#1a1a1a' }, { s: 'box', w: 0.24, d: 0.2, h: 0.16, rr: 0.06, color: '#f0d2a2', rough: 0.4, coat: 0.3 }],
    }),

    /* Viktor & Rolf */
    'vr|Spicebomb Night Vision': nightVision,

    /* Bvlgari */
    'bvlgari|Bvlgari pour Homme': S({
      w: 0.52, h: 0.56, d: 0.28, r: 0.03, juice: '#eceee0', level: 0.84, inset: 0.92, jop: 0.12,
      art: { w: 0.46, h: 0.2, y: 0.17, t: [['BVLGARI', 0.35, 0.22, '#3a3c40', { font: 'roman', weight: 500, track: 0.4 }], ['POUR HOMME', 0.7, 0.11, '#3a3c40', { font: 'roman', track: 0.3 }]] },
      extra: [(k) => k.part(box(0.52, 0.28, 0.07, 0.03, 0), glass({ op: 0.4 }))],
      cap: [{ s: 'cyl', r: 0.065, h: 0.04, fin: 'chrome' }, { s: 'lathe', pts: [[0, 0], [0.07, 0], [0.075, 0.05], [0.15, 0.17], [0.16, 0.22], [0, 0.22]], fin: 'chrome', sz: 0.8 }],
    }),

    /* Cartier */
    'cartier|Pasha de Cartier': S({
      body: 'cyl', w: 0.38, h: 0.48, d: 0.38, juice: '#e2e89c', level: 0.93, inset: 0.93,
      art: [{ wrap: true, arc: Math.PI * 2, h: 0.46, y: 0.23, r: 0.193, sz: 1, draw: (P) => { for (let i = 0; i < 60; i++) P.rect(i / 60, 0, 0.004, 1, 'rgba(255,255,255,0.3)'); } },
        { arc: 1.5, h: 0.22, y: 0.3, r: 0.196, sz: 1, t: [['PASHA', 0.22, 0.14, '#1a1a1a', { font: 'roman', weight: 600, track: 0.1 }], ['DE', 0.36, 0.07, '#1a1a1a', { font: 'roman' }], ['Cartier', 0.55, 0.22, '#1a1a1a', { font: 'serif', italic: true }], ['EAU DE TOILETTE', 0.95, 0.07, '#1a1a1a', { font: 'helv', track: 0.1 }]] }],
      cap: [{ s: 'cyl', r: 0.19, h: 0.03, fin: 'silver' }, { s: 'lathe', seg: 36, pts: [[0, 0], [0.19, 0], [0.19, 0.16], [0.175, 0.24], [0.13, 0.31], [0.06, 0.345], [0, 0.35]], fin: 'chrome' }],
      extra: [(k) => { const rib = []; for (let i = 0; i < 36; i++) { const b = new (T().BoxGeometry)(0.008, 0.2, 0.01); b.translate(0, 0.59, 0.192); b.rotateY((i / 36) * Math.PI * 2); rib.push(b); } k.part(merge(rib), fin('silver')); }],
    }),

    /* Carolina Herrera */
    'ch|212 VIP Men': vip({ grad: ['#9ca2a8', '#eceef0'], metal: 0.9, rough: 0.22, cap: { color: '#dfe2e6', metal: 1, rough: 0.2, coat: 0, env: 2.4 }, panel: 'rgba(255,255,255,0.75)', num: '#18233e', vip: '#8a9098', sub: 'MEN' }),
    'ch|212 VIP Black': vip({ grad: ['#e6e8ea', '#0a0a0b'], gc: 0.5, cap: { color: '#0b0b0c', rough: 0.15 }, num: '#cfd2d6', vip: '#bfc3c8', sub: 'BLACK' }),

    /* Gucci */
    'gucci|Guilty pour Homme': guilty({ solid: true, grad: ['#3e4044', '#d4d6d8'], gc: 0.9, metal: 0.95, rough: 0.2, env: 2.4, frost: 'rgba(240,240,240,0.55)', ink: '#2a2c30' }),
    'gucci|Guilty Absolu pour Homme': guilty({ juice: '#a8501a', ink: '#5a2a0c', sub: 'ABSOLUTE', capFin: 'black' }),

    /* Issey Miyake */
    "issey|L'Eau d'Issey pour Homme": S({
      w: 0.32, h: 0.6, d: 0.2, r: 0.01, solid: '#e6ebeb', rough: 0.55, coat: 0.2,
      art: { w: 0.3, h: 0.5, y: 0.28, t: [["L'EAU D'ISSEY", 0.34, 0.045, '#3a4048', { font: 'helv', track: 0.08 }], ['POUR HOMME', 0.42, 0.045, '#3a4048', { font: 'helv', track: 0.08 }], ['ISSEY MIYAKE', 0.94, 0.04, '#3a4048', { font: 'roman', track: 0.1 }]] },
      cap: [{ s: 'box', w: 0.32, d: 0.2, h: 0.18, rr: 0.01, color: '#b6babe', metal: 0.9, rough: 0.45, coat: 0 }],
    }),

    /* Dunhill */
    'dunhill|Desire Blue': S({
      w: 0.6, h: 0.46, d: 0.26, r: 0.05, solid: '#ffffff', grad: ['#1838c0', '#86c0f0'], gc: 0.9, rough: 0.08, coat: 0.5, env: 1,
      art: { w: 0.08, h: 0.36, x: 0.24, y: 0.22, draw: (P) => vtext(P, 'DESIRE BLUE', 0.5, 0.5, 0.42, '#dfe8f8', { font: 'roman' }) },
      extra: [(k, { W, H, D }) => {
        const chrome = fin('chrome');
        k.part(box(W + 0.02, D + 0.02, 0.035, 0.01, H), chrome);
        k.part(box(0.03, D + 0.02, 0.36, 0.008, H - 0.36).translate(W / 2 - 0.01, 0, 0), chrome);
      }],
      cap: [{ s: 'cyl', r: 0.09, h: 0.095, fin: 'chrome' }, { s: 'cyl', r: 0.12, h: 0.09, fin: 'chrome' }, { s: 'cyl', r: 0.17, rb: 0.13, h: 0.05, fin: 'chrome', seg: 18 }],
    }),
  });
})();
