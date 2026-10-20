/* Sillage — retail boxes for the classic designer and niche houses (Hermès, Guerlain, Cartier,
 * Bvlgari, Mugler, Burberry, Montblanc, Azzaro, Calvin Klein, Davidoff, Viktor & Rolf,
 * Carolina Herrera, Dunhill, Lalique, Issey Miyake, Le Labo, Margiela, Diptyque, Jo Malone).
 * Positions follow the notes taken from photos of the real boxes: y from the top of the face,
 * sizes as cap heights in fractions of the box height.
 */
(() => {
  const { prop, tx, rnd, stipple, brushed, pinstripe, waves, fullBg, seal } = BoxCraft.lib;

  /* ---------- shared helpers ---------- */
  // Rows of text: [string, y, cap, colour, font, opts].
  const L = (P, rows) => (rows || []).forEach((r) => r && tx(P, r[0], r[1], r[2], r[3], r[4] || 'sans', Object.assign({ weight: 400 }, r[5])));
  // Bottom line: left and right entries (centre optional).
  const foot = (P, l, r, y, cap, col, font = 'sans', o = {}, c) => {
    if (l) tx(P, l, y, cap, col, font, Object.assign({ x: 0.06, align: 'left', weight: 400 }, o));
    if (r) tx(P, r, y, cap, col, font, Object.assign({ x: 0.94, align: 'right', weight: 400 }, o));
    if (c) tx(P, c, y, cap, col, font, Object.assign({ weight: 400 }, o));
  };
  // Text squeezed (kx) or stretched (ky) about its anchor: condensed logotypes.
  function sx(P, s, x, y, cap, col, kx, o = {}) {
    const g = P.g; g.save(); g.translate(x * P.W, y * P.H); g.scale(kx, o.ky || 1); g.translate(-x * P.W, -y * P.H);
    tx(P, s, y, cap, col, o.font || 'helv', Object.assign({ weight: 700 }, o, { x, maxW: (o.maxW || 0.92) / kx }));
    g.restore();
  }
  // Fonts the painter does not list (typewriter), or outlined text.
  const FF = { mono: '"Courier New", Courier, "Liberation Mono", monospace', sans: 'Jost, Futura, "Century Gothic", Arial, sans-serif', helv: '"Helvetica Neue", Helvetica, Arial, sans-serif' };
  function raw(P, s, x, y, size, col, o = {}) {
    const g = P.g; g.save(); g.font = `${o.weight || 400} ${size * P.H}px ${FF[o.font || 'mono']}`;
    g.textBaseline = 'middle'; g.textAlign = o.align || 'left';
    const w = g.measureText(s).width, mw = (o.maxW || 0.9) * P.W;
    g.translate(x * P.W, y * P.H); if (w > mw) g.scale(mw / w, 1);
    if (o.stroke) { g.strokeStyle = col; g.lineWidth = o.stroke * P.H; g.strokeText(s, 0, 0); } else { g.fillStyle = col; g.fillText(s, 0, 0); }
    g.restore();
  }
  function grad(P, stops, x0 = 0, y0 = 0, x1 = 0, y1 = 1, r = [0, 0, 1, 1]) {
    const g = P.g, G = g.createLinearGradient(x0 * P.W, y0 * P.H, x1 * P.W, y1 * P.H);
    stops.forEach((c, i) => G.addColorStop(i / (stops.length - 1), c));
    g.fillStyle = G; g.fillRect(r[0] * P.W, r[1] * P.H, r[2] * P.W, r[3] * P.H);
  }
  function radial(P, x, y, rad, stops) {
    const g = P.g, G = g.createRadialGradient(x * P.W, y * P.H, 0, x * P.W, y * P.H, rad * P.H);
    stops.forEach((c, i) => G.addColorStop(i / (stops.length - 1), c));
    g.fillStyle = G; g.fillRect(0, 0, P.W, P.H);
  }
  // Diagonal crosshatch inside a rectangle (knurling, saffiano leather, engine turning).
  function hatch(P, col, step, lw = 0.0008, r = [0, 0, 1, 1], one) {
    const g = P.g, d = r[3] * P.H / P.W; g.save(); g.beginPath(); g.rect(r[0] * P.W, r[1] * P.H, r[2] * P.W, r[3] * P.H); g.clip();
    for (let x = r[0] - d; x < r[0] + r[2] + d; x += step) {
      P.line(x, r[1], x + d, r[1] + r[3], col, lw);
      if (!one) P.line(x + d, r[1], x, r[1] + r[3], col, lw);
    }
    g.restore();
  }
  const card = (rw, rd, paper, o = {}) => (item, fit) => Object.assign(prop(fit, rw, rd), { open: 'flap', paper: typeof paper === 'string' ? { color: paper, rough: 0.6 } : paper }, o);

  /* ---------- Hermès ---------- */
  // The Duc carriage: horse, calèche with a big wheel, groom standing at the horse's head.
  function duc(P, y, s, col) {
    const a = P.H / P.W, X = (u) => 0.5 + u * s * a, Y = (v) => y + v * s;
    P.ellipse(X(-0.45), Y(0), 0.32 * s * a, 0.13 * s, 0, col);
    P.path([[X(-0.72), Y(-0.05)], [X(-0.9), Y(-0.38)], [X(-1.02), Y(-0.32)], [X(-0.98), Y(-0.24)], [X(-0.8), Y(0.05)]], col);
    for (const u of [-0.7, -0.6, -0.3, -0.2]) P.line(X(u), Y(0.05), X(u + (u < -0.5 ? -0.05 : 0.05)), Y(0.42), col, 0.06 * s);
    P.line(X(-0.12), Y(0.0), X(0.25), Y(0.02), col, 0.05 * s);
    P.path([[X(0.12), Y(-0.28)], [X(0.55), Y(-0.28)], [X(0.62), Y(0.02)], [X(0.15), Y(0.02)]], col, false, 0.07 * s);
    P.path([[X(0.2), Y(-0.28)], [X(0.35), Y(-0.48)], [X(0.6), Y(-0.45)], [X(0.55), Y(-0.28)]], col);
    P.circle(X(0.38), Y(0.18), 0.24 * s, col, 0.045 * s); P.line(X(0.38), Y(-0.06), X(0.38), Y(0.42), col, 0.03 * s); P.line(X(0.14), Y(0.18), X(0.62), Y(0.18), col, 0.03 * s);
    P.circle(X(-1.18), Y(-0.28), 0.06 * s, col); P.line(X(-1.18), Y(-0.2), X(-1.18), Y(0.12), col, 0.07 * s);
    P.line(X(-1.18), Y(0.12), X(-1.24), Y(0.42), col, 0.05 * s); P.line(X(-1.18), Y(0.12), X(-1.12), Y(0.42), col, 0.05 * s);
  }
  const herm = (o) => card(o.rw || 0.56, o.rd || 0.34, { color: o.paper, rough: 0.85 }, {
    side: o.side,
    front: (P) => {
      fullBg(P, o.paper); stipple(P, o.speck || 'rgba(0,0,0,0.04)', 900);
      if (o.bg) o.bg(P); L(P, o.lines); if (o.art) o.art(P);
      const y = o.ly || 0.8;
      if (!o.noDuc) duc(P, y, 0.04, o.logo);
      tx(P, 'HERMÈS', y + 0.055, 0.02, o.logo, 'serif', { weight: 500, track: 0.14 });
      tx(P, 'PARIS', y + 0.083, 0.008, o.logo, 'sans', { track: 0.4 });
      foot(P, o.ml || '100 ML ℮', o.oz || '3.3 FL.OZ.', 0.97, 0.011, o.foot || o.logo);
    },
  });
  const terre = (paper, conc, extra) => herm({
    paper, logo: extra ? '#F0ECE8' : '#C2B6AD', foot: extra ? '#F0ECE8' : '#B4A69C',
    bg: (P) => P.rect(0, 0, 1, 0.012, 'rgba(0,0,0,0.18)'),
    lines: [
      ...(extra ? [['VAPORISATEUR . RECHARGEABLE', 0.08, 0.009, '#F0ECE8', 'sans', { track: 0.2 }], ['NATURAL SPRAY . REFILLABLE', 0.105, 0.009, '#F0ECE8', 'sans', { track: 0.2 }], ['EAU DE PARFUM', 0.13, 0.009, '#F0ECE8', 'sans', { track: 0.2 }]]
        : [['VAPORISATEUR . NATURAL SPRAY', 0.04, 0.009, '#A8968A', 'sans', { track: 0.2 }]]),
      ['TERRE', extra ? 0.33 : 0.27, 0.058, '#E8642C', 'sans', { x: 0.15, align: 'left', weight: 400 }],
      ["D'HERMÈS", extra ? 0.41 : 0.35, 0.058, '#F2EEE8', 'sans', { x: 0.15, align: 'left', weight: 400, maxW: 0.72 }],
      [conc, extra ? 0.52 : 0.44, extra ? 0.018 : 0.014, '#EDE8E2', 'sans', { x: 0.53, track: 0.12 }],
    ],
  });
  // Tall orange heritage box with a coloured label panel.
  const heritage = (o) => herm({
    rw: 0.37, rd: 0.3, paper: o.paper || '#E8601E', logo: o.logo || '#7A3410', noDuc: true, ly: 0.83, speck: 'rgba(120,40,0,0.05)',
    art: (P) => {
      const [x0, y0, x1, y1] = o.panel; P.rect(x0, y0, x1 - x0, y1 - y0, o.pc);
      if (o.ring) { P.circle((x0 + x1) / 2, 0.455, 0.06, 'rgba(0,0,0,0.18)', 0.004); P.circle((x0 + x1) / 2, 0.455, 0.045, 'rgba(0,0,0,0.12)', 0.002); }
      L(P, o.lines.map((r) => [r[0], r[1], r[2], r[3], r[4], Object.assign({ x: (x0 + x1) / 2, maxW: (x1 - x0) * 0.9 }, r[5])]));
    },
    lines: o.top,
  });

  /* ---------- Guerlain ---------- */
  const gStack = (P, y, ink, sub) => { tx(P, 'GUERLAIN', y, 0.034, ink, 'sans', { weight: 500, track: 0.12, maxW: 0.6 }); tx(P, 'PARIS', y + 0.05, 0.011, ink, 'sans', { track: 0.4 }); };
  const ideal = (o) => card(0.7, 0.38, { color: o.paper, rough: 0.5, metal: 0.1 }, {
    side: o.side,
    front: (P) => {
      fullBg(P, o.paper); pinstripe(P, 'rgba(255,255,255,0.05)', 160);
      P.rect(0.2, o.inset[0], 0.6, o.inset[1] - o.inset[0], o.panel); P.frame(0.2, o.inset[0], 0.6, o.inset[1] - o.inset[0], 'rgba(255,255,255,0.12)', 0.002);
      L(P, o.lines); gStack(P, o.gy, '#F4F4F6');
      if (o.gg) tx(P, 'GG', 0.6, 0.035, 'rgba(255,255,255,0.22)', 'serif', { weight: 400, track: -0.2 });
      tx(P, o.conc, o.cy || 0.88, 0.012, '#F4F4F6', 'sans', { track: 0.3 });
      foot(P, '100 mL', '3.3 FL.OZ.', 0.97, 0.01, '#F4F4F6');
    },
  });
  const habit = (o) => card(0.48, 0.32, { color: o.paper, rough: 0.55 }, {
    front: (P) => {
      fullBg(P, o.paper); pinstripe(P, 'rgba(0,0,0,0.1)', 120);
      P.rect(0, 0.565, 1, 0.03, o.band);
      gStack(P, 0.17, o.ink);
      P.rect(0.15, 0.45, 0.65, 0.3, o.paper); P.frame(0.15, 0.45, 0.65, 0.3, o.ink, 0.003);
      L(P, [[o.n[0], 0.52, 0.03, o.ink, 'sans', { x: 0.475, weight: 500, track: 0.1 }], [o.n[1], 0.565, 0.03, o.ink, 'sans', { x: 0.475, weight: 500, track: 0.1 }],
        ['EAU DE TOILETTE', 0.655, 0.01, o.ink, 'sans', { x: 0.475, track: 0.2 }], ['VAPORISATEUR - SPRAY', 0.68, 0.008, o.ink, 'sans', { x: 0.475, track: 0.2 }], ['GUERLAIN', 0.725, 0.008, o.ink, 'sans', { x: 0.475, track: 0.3 }]]);
      foot(P, '100mL', '3.3 FL.OZ.', 0.97, 0.011, o.ink);
    },
  });
  const bee = (P, x, y, s, col) => { const a = P.H / P.W; P.ellipse(x, y + s * 0.15, s * 0.16 * a, s * 0.38, 0, col); P.circle(x, y - s * 0.3, s * 0.12, col); P.ellipse(x - s * 0.3 * a, y - s * 0.08, s * 0.28 * a, s * 0.16, 0.5, col); P.ellipse(x + s * 0.3 * a, y - s * 0.08, s * 0.28 * a, s * 0.16, -0.5, col); };
  // L'Art & la Matière / Les Absolus: white two-part box, black label, gold bee.
  const absolu = (n1, n2) => (item, fit) => Object.assign(prop(fit, 0.62, 0.45), {
    lid: 0.86, paper: { color: '#F1F0E8', rough: 0.85 }, lining: '#f6f5f0',
    front: (P) => {
      fullBg(P, '#F1F0E8'); stipple(P, 'rgba(0,0,0,0.05)', 1600);
      P.rect(0, 0.855, 1, 0.006, 'rgba(0,0,0,0.12)');
      P.rect(0.22, 0.07, 0.56, 0.53, '#16151A');
      L(P, [[n1, n2 ? 0.16 : 0.175, 0.018, '#F2F2F2', 'sans', { track: 0.12, maxW: 0.5 }], n2 && [n2, 0.195, 0.018, '#F2F2F2', 'sans', { track: 0.12, maxW: 0.5 }]]);
      bee(P, 0.5, 0.34, 0.03, '#C2A15C');
      tx(P, 'GUERLAIN', 0.48, 0.028, '#C2A15C', 'sans', { weight: 500, track: 0.12, maxW: 0.46 }); tx(P, 'PARIS', 0.52, 0.009, '#C2A15C', 'sans', { track: 0.4 });
      foot(P, '100 ml', '3.3 FL.OZ', 0.94, 0.008, '#8a8a8a', 'sans', {}, 'EAU DE PARFUM');
    },
  });

  /* ---------- Cartier ---------- */
  const cartierScript = (P, y, cap, col, x = 0.5) => tx(P, 'Cartier', y, cap, col, 'serif', { x, italic: true, weight: 500 });
  const pasha = card(0.48, 0.36, { color: '#A1010E', rough: 0.3 }, {
    front: (P) => {
      fullBg(P, '#A1010E'); grad(P, ['rgba(255,60,60,0.12)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.15)'], 0, 0, 1, 0);
      P.rect(0.23, 0.09, 0.54, 0.3, '#F2F2F2'); P.rect(0.245, 0.1, 0.51, 0.28, '#7B7F78'); hatch(P, 'rgba(255,255,255,0.05)', 0.008, 0.0006, [0.245, 0.1, 0.51, 0.28]);
      L(P, [['PASHA', 0.165, 0.022, '#F2F2F2', 'sans', { track: 0.2 }], ['DE', 0.2, 0.008, '#F2F2F2', 'sans', { track: 0.2 }], ['EAU DE TOILETTE', 0.31, 0.009, '#F2F2F2', 'sans', { track: 0.2 }]]);
      cartierScript(P, 0.25, 0.034, '#F2F2F2');
      L(P, [['EAU DE TOILETTE', 0.85, 0.012, '#7E000A', 'sans', { track: 0.2 }], ['VAPORISATEUR NATURAL SPRAY', 0.88, 0.009, '#7E000A', 'sans', { track: 0.2 }], ['100 ml ℮ 3.3 FL.OZ.', 0.92, 0.01, '#7E000A', 'sans', { track: 0.1 }]]);
    },
  });
  const declaration = card(0.42, 0.32, { color: '#B0101C', rough: 0.3 }, {
    front: (P) => {
      fullBg(P, '#B0101C'); grad(P, ['rgba(255,80,80,0.12)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.12)'], 0, 0, 1, 0);
      tx(P, 'déclaration', 0.08, 0.014, '#F4F4F4', 'serif', { weight: 400, track: 0.25 }); cartierScript(P, 0.135, 0.04, '#F4F4F4');
      const g = P.g; g.save(); g.strokeStyle = '#F4F4F4'; g.lineCap = 'round';
      for (const [w, a0, a1] of [[0.03, -0.25, 0.32], [0.012, -0.32, 0.4]]) { g.lineWidth = w * P.H; g.beginPath(); g.arc(0.22 * P.W, 0.63 * P.H, (0.2 + w) * P.H, -Math.PI * a0, Math.PI * a1 * 2 - Math.PI * 0.05, true); g.stroke(); }
      g.restore();
      tx(P, 'EAU DE TOILETTE', 0.55, 0.01, '#F4F4F4', 'sans', { x: 0.72, track: 0.2 });
      tx(P, '100 ml ℮ 3.3 FL.OZ.', 0.95, 0.011, '#F4F4F4', 'sans', { track: 0.1 });
    },
  });
  const envol = card(0.55, 0.4, { color: '#3A3A3E', rough: 0.4, metal: 0.2 }, {
    front: (P) => {
      fullBg(P, '#3A3A3E'); P.frame(0.06, 0.04, 0.88, 0.92, '#D9772A', 0.004);
      P.rect(0.22, 0.2, 0.56, 0.25, '#F4F2EE'); P.frame(0.24, 0.212, 0.52, 0.226, '#D9772A', 0.002);
      L(P, [["L'ENVOL", 0.26, 0.022, '#1A1A1A', 'sans', { track: 0.3 }], ['DE', 0.295, 0.008, '#1A1A1A', 'sans', { track: 0.2 }], ['EAU DE PARFUM', 0.4, 0.009, '#1A1A1A', 'sans', { track: 0.2 }]]);
      cartierScript(P, 0.345, 0.034, '#A8321E');
      tx(P, '100 ml ℮ 3.3 FL.OZ.', 0.92, 0.012, '#D9772A', 'sans', { track: 0.1 });
    },
  });

  /* ---------- Bvlgari ---------- */
  const bvl = (o) => card(o.rw || 0.5, o.rd || 0.32, { color: o.paper, rough: o.rough || 0.7, metal: o.metal || 0 }, {
    front: (P) => {
      fullBg(P, o.paper); if (o.bg) o.bg(P);
      tx(P, 'BVLGARI', o.by || 0.08, o.bcap || 0.036, o.ink, 'roman', { weight: 500, track: 0.3, maxW: 0.86 });
      if (o.fr) {
        const [x0, y0, x1, y1] = o.fr;
        if (o.panel) P.rect(x0, y0, x1 - x0, y1 - y0, o.panel);
        const i = o.panel ? 0.025 : 0; P.frame(x0 + i, y0 + i * 0.6, x1 - x0 - 2 * i, y1 - y0 - 1.2 * i, o.fc || o.ink, 0.004);
      }
      if (o.art) o.art(P); L(P, o.lines);
      const f = o.fc2 || o.ink, x = o.fx || 0.5;
      tx(P, o.conc || 'EAU DE PARFUM', o.cy || 0.86, 0.011, f, 'sans', { x, weight: 500, track: 0.15 }); tx(P, 'VAPORISATEUR NATURAL SPRAY', (o.cy || 0.86) + 0.022, 0.006, f, 'sans', { x, track: 0.15 });
      foot(P, o.ml || '100 ML', o.oz || '3.4 FL.OZ. U.S.', 0.94, 0.011, f, 'sans', { weight: 500 });
    },
  });
  const man = (ink, sub) => [['BVLGARI', 0.4, 0.014, ink, 'roman', { track: 0.3, weight: 500 }], ['MAN', 0.48, 0.055, ink, 'roman', { weight: 600, track: 0.04 }], [sub, 0.63, 0.018, ink, 'sans', { weight: 700, track: 0.3, maxW: 0.62 }]];

  /* ---------- Mugler ---------- */
  const amen = (o) => card(0.62, 0.45, { color: o.rim, rough: 0.3, metal: 0.8 }, {
    front: (P) => {
      fullBg(P, o.rim); brushed(P, 'rgba(255,255,255,0.18)', 200);
      P.rect(0.05, 0.035, 0.9, 0.93, o.panel); P.frame(0.065, 0.045, 0.87, 0.91, o.key, 0.003);
      sx(P, 'A', 0.33, 0.215, 0.13, o.blue, 0.55, { font: 'helv', weight: 500 });
      star(P, 0.48, 0.2, 0.05, o.blue, o.hi);
      sx(P, 'MEN', 0.66, 0.215, 0.13, o.blue, 0.55, { font: 'helv', weight: 500 });
      if (o.sub) tx(P, o.sub, 0.36, 0.022, o.blue, 'sans', { weight: 500, track: 0.35 });
      tx(P, o.house || 'MUGLER', 0.66, 0.045, o.ink, 'sans', { weight: 600, track: 0.12, maxW: 0.8 });
      L(P, [['EAU DE TOILETTE', 0.73, 0.011, o.blue, 'sans', { track: 0.45 }], ['VAPORISATEUR GOMME RECHARGEABLE', 0.758, 0.008, o.blue, 'sans', { track: 0.25, maxW: 0.8 }], ['REFILLABLE RUBBER SPRAY', 0.782, 0.008, o.blue, 'sans', { track: 0.25 }]]);
      foot(P, '℮ 100 mL', '3.3 Fl. Oz.', 0.945, 0.01, '#9a9a9a', 'sans', { x: 0.1 });
      P.g.textAlign = 'left';
    },
  });
  function star(P, x, y, r, col, hi) {
    const a = P.H / P.W, pts = [];
    for (let i = 0; i < 10; i++) { const t = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; pts.push([x + Math.cos(t) * rr * a, y + Math.sin(t) * rr]); }
    P.path(pts, col); if (hi) P.path([pts[9], pts[0], pts[1], [x, y]], hi);
  }
  const alienMan = card(0.45, 0.4, { color: '#111111', rough: 0.45 }, {
    front: (P) => {
      fullBg(P, '#111111');
      for (let i = 0; i < 26; i++) P.path([[rnd(i), rnd(i + 40)], [rnd(i + 80), rnd(i + 120)], [rnd(i + 160), rnd(i + 200)]], `rgba(255,255,255,${0.015 + rnd(i + 9) * 0.03})`);
      sx(P, 'ALIEN', 0.5, 0.22, 0.1, '#C8C8D0', 0.6, { font: 'serif', weight: 400, track: 0.08 });
      tx(P, 'MAN', 0.32, 0.03, '#9A8CC8', 'sans', { weight: 500, track: 0.5 });
      tx(P, 'MUGLER', 0.75, 0.03, '#C8C8D0', 'sans', { weight: 600, track: 0.3 });
      tx(P, 'EAU DE TOILETTE', 0.8, 0.01, '#C8C8D0', 'sans', { track: 0.4 });
      foot(P, '℮ 100 mL', '3.3 Fl. Oz.', 0.95, 0.01, '#8a8a8a');
    },
  });

  /* ---------- Burberry ---------- */
  const london = card(0.5, 0.32, { color: '#A18579', rough: 0.35 }, {
    front: (P) => {
      fullBg(P, '#A18579');
      for (const [x, w, c] of [[0.3, 0.22, 'rgba(110,84,74,0.45)'], [0.68, 0.14, 'rgba(205,186,176,0.35)'], [0.05, 0.08, 'rgba(110,84,74,0.3)']]) P.rect(x, 0, w, 1, c);
      for (const [y, h, c] of [[0.2, 0.12, 'rgba(110,84,74,0.4)'], [0.55, 0.08, 'rgba(205,186,176,0.3)'], [0.8, 0.1, 'rgba(110,84,74,0.25)']]) P.rect(0, y, 1, h, c);
      pinstripe(P, 'rgba(255,255,255,0.04)', 90);
      for (const d of [0, 0.012]) { P.line(0, 0.14 + d, 1, 0.14 + d, '#B8786E', 0.003); P.line(0.15 + d, 0, 0.15 + d, 1, '#B8786E', 0.003); }
      L(P, [['BURBERRY', 0.4, 0.026, '#F2ECE6', 'roman', { weight: 500, track: 0.25, maxW: 0.72 }], ['LONDON', 0.44, 0.011, '#F2ECE6', 'roman', { track: 0.6 }],
        ['FOR MEN', 0.86, 0.009, '#F2ECE6', 'roman', { track: 0.3 }], ['EAU DE TOILETTE', 0.88, 0.008, '#F2ECE6', 'roman', { track: 0.3 }], ['NATURAL SPRAY VAPORISATEUR', 0.9, 0.007, '#F2ECE6', 'roman', { track: 0.2 }], ['100 ml ℮ 3.3 FL.OZ.', 0.945, 0.014, '#F2ECE6', 'helv', { weight: 500 }]]);
    },
  });
  const brit = card(0.48, 0.3, { color: '#1A1A1A', rough: 0.4 }, {
    front: (P) => {
      fullBg(P, '#1A1A1A');
      for (const [x, w, c] of [[0.1, 0.25, '#2E2E2E'], [0.55, 0.18, '#4A4A4A'], [0.85, 0.08, '#2E2E2E']]) P.rect(x, 0, w, 1, c);
      for (const [y, h, c] of [[0.48, 0.16, 'rgba(90,90,90,0.55)'], [0.75, 0.08, 'rgba(46,46,46,0.6)'], [0.02, 0.06, 'rgba(90,90,90,0.4)']]) P.rect(0, y, 1, h, c);
      pinstripe(P, 'rgba(0,0,0,0.35)', 110);
      const o = { x: 0.13, align: 'left' };
      L(P, [['BURBERRY', 0.2, 0.025, '#F5F5F5', 'helv', Object.assign({ weight: 700, track: 0.04 }, o)], ['BRIT', 0.28, 0.07, '#F5F5F5', 'helv', Object.assign({ weight: 900 }, o)], ['FOR HIM', 0.355, 0.02, '#F5F5F5', 'helv', Object.assign({ weight: 700, track: 0.05 }, o)],
        ['EAU DE TOILETTE', 0.86, 0.009, '#F5F5F5', 'helv', Object.assign({ weight: 500, track: 0.1 }, o)], ['NATURAL SPRAY VAPORISATEUR', 0.88, 0.007, '#F5F5F5', 'helv', Object.assign({ track: 0.1 }, o)], ['100 ml ℮ 3.3 FL. OZ.', 0.92, 0.012, '#F5F5F5', 'helv', o]]);
    },
  });
  const mrb = card(0.55, 0.4, { color: '#0E0E0E', rough: 0.85 }, {
    front: (P) => {
      fullBg(P, '#0E0E0E');
      sx(P, 'Mr.', 0.42, 0.33, 0.1, '#F2F2F2', 0.9, { font: 'serif', italic: true, weight: 600 });
      tx(P, 'BURBERRY', 0.43, 0.025, '#F2F2F2', 'roman', { weight: 500, track: 0.18, maxW: 0.8 });
      tx(P, 'EAU DE TOILETTE', 0.88, 0.01, '#F2F2F2', 'roman', { track: 0.35 });
      tx(P, '100 ml ℮ 3.3 FL. OZ.', 0.93, 0.01, '#9a9a9a', 'helv');
    },
  });
  const hero = (paper, conc) => card(0.78, 0.4, { color: paper, rough: 0.35 }, {
    front: (P) => {
      fullBg(P, paper); grad(P, ['rgba(255,255,255,0.08)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.12)'], 0, 0, 1, 1);
      P.rect(0.25, 0.1, 0.5, 0.52, '#F1EEE6');
      L(P, [['BURBERRY', 0.2, 0.04, '#B8974F', 'helv', { weight: 700, track: 0.04, maxW: 0.42 }], ['HERO', 0.27, 0.022, '#B8974F', 'helv', { weight: 700, track: 0.08 }],
        [conc, 0.52, 0.008, '#B8974F', 'helv', { track: 0.2 }], ['NATURAL SPRAY VAPORISATEUR', 0.55, 0.007, '#B8974F', 'helv', { track: 0.15 }],
        ['REFILLABLE / RECHARGEABLE', 0.85, 0.009, '#EFE6D8', 'helv', { track: 0.15 }], ['100 ml ℮ 3.3 FL. OZ.', 0.92, 0.014, '#EFE6D8', 'helv', { weight: 500 }]]);
    },
  });

  /* ---------- Montblanc ---------- */
  function snowcap(P, x, y, r, col) {
    const a = P.H / P.W;
    for (let k = 0; k < 6; k++) { const t = k * Math.PI / 3 - Math.PI / 2; P.ellipse(x + Math.cos(t) * r * 0.5 * a, y + Math.sin(t) * r * 0.5, r * 0.26 * a, r * 0.5, 0, col); }
    P.circle(x, y, r * 0.55, col);
  }
  const mbWord = (P, y, cap, col) => tx(P, 'MONTBLANC', y, cap, col, 'helv', { weight: 800, track: 0.04, maxW: 0.6 });
  const mbFoot = (P, conc, col) => foot(P, '100ML ℮', '3.3 FL.OZ.', 0.95, 0.012, col, 'helv', { x: 0.08 }, conc);
  const explorer = (o) => card(0.75, 0.45, { color: o.paper, rough: o.metal ? 0.3 : 0.55, metal: o.metal || 0 }, {
    front: (P) => {
      fullBg(P, o.paper);
      if (o.hex) for (let r = 0; r < 60; r++) for (let c = 0; c < 46; c++) P.circle((c + (r % 2) * 0.5) / 45, r / 59, 0.007, (r + c) % 3 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)', 0.0012);
      else hatch(P, o.tex, 0.012, 0.0009);
      P.rect(0, 0.25, 1, 0.22, o.band);
      P.line(0, 0.25, 1, 0.25, '#BFC3C6', 0.004); P.line(0, 0.47, 1, 0.47, '#BFC3C6', 0.004);
      tx(P, 'EXPLORER', o.sub ? 0.34 : 0.36, 0.065, o.ink, 'sans', { weight: 400, track: 0.06, maxW: 0.8 });
      if (o.sub) tx(P, o.sub, 0.42, 0.028, o.ink, 'sans', { weight: 600, track: 0.08 });
      if (o.stack) { tx(P, 'MONT', 0.67, 0.045, o.ink, 'helv', { weight: 800, x: 0.48 }); tx(P, 'BLANC', 0.745, 0.045, o.ink, 'helv', { weight: 800, x: 0.5 }); snowcap(P, 0.6, 0.635, 0.022, o.ink); }
      else mbWord(P, 0.8, 0.04, o.word || o.ink);
      mbFoot(P, 'EAU DE PARFUM', o.ink);
    },
    top: (P) => { fullBg(P, o.paper); P.circle(0.5, 0.5, 0.2, '#0b0b0b'); snowcap(P, 0.5, 0.5, 0.13, '#f4f4f4'); },
  });
  const legend = (o) => card(0.8, 0.4, { color: o.paper, rough: 0.45, metal: o.metal || 0 }, {
    front: (P) => {
      fullBg(P, o.paper); if (o.pearl) grad(P, ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.05)'], 0, 0, 1, 1);
      for (let i = 0; i < 26; i++) {
        const amp = Math.pow(i / 25, 1.6) * 0.06, y = 0.02 + i * 0.021;
        P.path(Array.from({ length: 41 }, (_, j) => [j / 40, y + amp * Math.sin((j / 40) * Math.PI * 1.6 - 0.5)]), o.lines, false, 0.0016 - i * 0.00003);
      }
      tx(P, 'LEGEND', 0.66, 0.075, o.ink, 'sans', { weight: 300, track: 0.28, maxW: 0.66 });
      if (o.spirit) tx(P, 'SPIRIT', 0.735, 0.025, o.ink, 'sans', { weight: 700, track: 0.35, x: 0.68 });
      else tx(P, 'EAU DE TOILETTE', 0.735, 0.022, o.ink, 'sans', { weight: 400, track: 0.05 });
      mbWord(P, 0.83, 0.035, o.word); mbFoot(P, 'EAU DE TOILETTE', o.ink);
    },
    top: (P) => { fullBg(P, o.paper); snowcap(P, 0.5, 0.5, 0.14, o.word); },
  });

  /* ---------- Azzaro ---------- */
  function medallion(P, y, r, disc, rim, ink) {
    const a = P.H / P.W; P.circle(0.5, y, r, rim); P.circle(0.5, y, r * 0.9, disc); P.circle(0.5, y, r * 0.38, rim, 0.003); P.circle(0.5, y, r * 0.18, rim);
    [...'AZZARO'].forEach((ch, i) => { const t = -Math.PI / 2 + i * Math.PI / 3, cx = 0.5 + Math.cos(t) * r * 0.64 * a, cy = y + Math.sin(t) * r * 0.64; P.circle(cx, cy, r * 0.2, rim, 0.002); P.text(ch, cx, cy, r * 0.24, ink, { font: 'serif', weight: 600 }); });
  }
  const azFoot = (P, col) => { tx(P, 'AZZARO', 0.88, 0.05, col, 'serif', { weight: 400, track: 0.55, maxW: 0.92 }); tx(P, '℮ 100 mL   Vaporisateur Spray   3.38 Fl. Oz.', 0.96, 0.011, col, 'sans', { maxW: 0.9 }); };
  const wanted = (o) => card(0.6, 0.42, { color: o.up, rough: 0.35, metal: 0.3 }, {
    side: o.low ? { color: o.low, rough: 0.35, metal: 0.4 } : undefined,
    front: (P) => {
      fullBg(P, o.up); if (o.low) P.rect(0, 0.7, 1, 0.3, o.low);
      P.rect(0, 0.6, 1, 0.1, o.band); hatch(P, o.knurl, 0.014, 0.0022, [0, 0.6, 1, 0.1]);
      medallion(P, 0.6, 0.1, o.disc, o.med, o.medInk);
      L(P, o.lines); tx(P, o.conc, 0.79, 0.015, o.foot, 'sans', { weight: 400 }); azFoot(P, o.foot);
    },
  });
  const chrome = card(0.62, 0.32, { color: '#B4B0B5', rough: 0.25, metal: 0.85 }, {
    front: (P) => {
      grad(P, ['#C9C6CB', '#9A959B', '#D2CFD4', '#A9A5AA'], 0, 0, 1, 0.3); brushed(P, 'rgba(255,255,255,0.25)', 220);
      tx(P, 'CHROME', 0.12, 0.045, '#1F2433', 'serif', { weight: 500, track: 0.55, maxW: 0.86 });
      const s = 0.22, w = s * P.H / P.W, x0 = 0.5 - w / 2, y0 = 0.38;
      P.rect(x0, y0, w, s, '#B8D0EA');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) hatch(P, '#5E8CC2', 0.012, 0.004, [x0 + c * w / 4, y0 + r * s / 4, w / 4, s / 4], true), (r + c) % 2 && P.rect(x0 + c * w / 4, y0 + r * s / 4, w / 4, s / 4, 'rgba(184,208,234,0.55)');
      tx(P, 'Eau de Toilette', 0.66, 0.014, '#6A6A6A', 'serif', { weight: 400 }); azFoot(P, '#1F2433');
    },
  });
  const azzaroPH = card(0.48, 0.3, { color: '#0A0A0A', rough: 0.2 }, {
    front: (P) => {
      fullBg(P, '#0A0A0A');
      tx(P, 'AZZARO', 0.1, 0.032, '#F4F4F4', 'serif', { weight: 400, track: 0.45, maxW: 0.8 }); tx(P, 'POUR HOMME', 0.15, 0.016, '#F4F4F4', 'sans', { weight: 500, track: 0.2 });
      const a = P.H / P.W, X = (u) => 0.5 + u * a;
      P.path([[X(-0.11), 0.6], [X(-0.01), 0.33], [X(0.045), 0.33], [X(-0.055), 0.6]], '#D0D0D0');
      P.path([[X(0.03), 0.4], [X(0.075), 0.4], [X(0.075), 0.6], [X(0.03), 0.6]], '#D0D0D0');
      P.rect(X(-0.035), 0.555, 0.08 * a, 0.045, '#D0D0D0');
      tx(P, 'Eau de Toilette', 0.75, 0.014, '#F4F4F4', 'sans', { weight: 400 }); azFoot(P, '#F4F4F4');
    },
  });

  /* ---------- Calvin Klein ---------- */
  const ckFoot = (P, col, l = '3.3 FL OZ', r = '100 ml ℮', y = 0.95) => foot(P, l, r, y, 0.012, col, 'helv');
  const ckOne = card(0.55, 0.32, { color: '#BCAEA5', rough: 0.95 }, {
    front: (P) => {
      fullBg(P, '#BCAEA5'); pinstripe(P, 'rgba(255,255,255,0.06)', 160); stipple(P, 'rgba(60,40,30,0.07)', 1400);
      tx(P, 'ck', 0.355, 0.2, '#3C3C3C', 'sans', { x: 0.14, align: 'left', weight: 300, maxW: 0.6 });
      tx(P, 'one', 0.52, 0.026, '#3C3C3C', 'sans', { x: 0.26, align: 'left', weight: 300 });
      tx(P, 'eau de toilette', 0.82, 0.011, '#3C3C3C', 'sans', { weight: 400, track: 0.1 });
      tx(P, 'Calvin Klein', 0.86, 0.022, '#3C3C3C', 'sans', { weight: 300 });
      ckFoot(P, '#3C3C3C');
    },
  });
  const eternity = (paper, ink, aqua) => card(0.62, 0.4, { color: paper, rough: 0.8 }, {
    front: (P) => {
      fullBg(P, paper); if (aqua) grad(P, ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)'], 0, 0, 0, 0.6, [0, 0, 1, 0.6]);
      sx(P, 'ETERNITY', 0.5, 0.12, 0.08, ink, 0.6, { font: 'sans', weight: 300, track: 0.12 });
      tx(P, 'FOR MEN', aqua ? 0.21 : 0.22, 0.016, ink, 'sans', { weight: 400, track: 0.3 });
      if (aqua) L(P, [['AQUA', 0.45, 0.035, ink, 'sans', { weight: 400, track: 0.08 }], ['eau de toilette spray', 0.7, 0.012, ink, 'sans', { track: 0.12 }], ['vaporisateur', 0.73, 0.012, ink, 'sans', { track: 0.12 }], ['CALVIN KLEIN', 0.83, 0.024, ink, 'sans', { track: 0.05 }]]);
      else L(P, [['EAU DE TOILETTE', 0.79, 0.016, ink, 'sans', { weight: 500 }], ['SPRAY VAPORISATEUR', 0.82, 0.01, ink, 'sans', { track: 0.1 }], ['CALVIN KLEIN', 0.87, 0.026, ink, 'sans']]);
      ckFoot(P, ink, undefined, undefined, aqua ? 0.93 : 0.95);
    },
  });
  const obsession = card(0.6, 0.38, { color: '#CBB38F', rough: 0.4, metal: 0.35 }, {
    front: (P) => {
      grad(P, ['#E2D1AE', '#CBB38F', '#B89C74'], 0, 0, 1, 1);
      tx(P, 'O', 0.195, 0.055, '#2A2218', 'serif', { x: 0.17, weight: 400 });
      tx(P, 'BSESSION', 0.205, 0.038, '#2A2218', 'serif', { x: 0.215, align: 'left', weight: 400, track: 0.03, maxW: 0.66 });
      L(P, [['for men', 0.27, 0.014, '#2A2218', 'serif', { track: 0.4 }], ['eau de toilette spray', 0.72, 0.011, '#2A2218', 'sans', { track: 0.1 }], ['vaporisateur', 0.75, 0.011, '#2A2218', 'sans', { track: 0.1 }], ['Calvin Klein', 0.83, 0.022, '#2A2218', 'sans', { weight: 300 }]]);
      ckFoot(P, '#2A2218', '4.0 FL OZ', '125 ml ℮', 0.94);
    },
  });
  const escape = card(0.42, 0.32, { color: '#D1C18D', rough: 0.9 }, {
    front: (P) => {
      fullBg(P, '#D1C18D');
      for (let i = 0; i < 70; i++) P.ellipse(rnd(i + 11), rnd(i + 51), 0.04 + rnd(i + 91) * 0.12, 0.01 + rnd(i + 3) * 0.03, rnd(i + 7) * 3, rnd(i) > 0.5 ? 'rgba(245,235,200,0.25)' : 'rgba(150,120,60,0.12)');
      L(P, [['ESCAPE', 0.24, 0.04, '#1A1A1A', 'serif', { weight: 400, track: 0.12 }], ['for men', 0.28, 0.009, '#1A1A1A', 'serif', { track: 0.4 }], ['eau de toilette spray', 0.77, 0.009, '#1A1A1A', 'sans', { track: 0.1 }], ['vaporisateur', 0.8, 0.009, '#1A1A1A', 'sans', { track: 0.1 }], ['Calvin Klein', 0.88, 0.026, '#1A1A1A', 'sans', { weight: 300 }]]);
      ckFoot(P, '#1A1A1A', undefined, undefined, 0.97);
    },
  });
  const defy = card(0.6, 0.38, { color: '#1F3048', rough: 0.4 }, {
    front: (P) => {
      fullBg(P, '#1F3048'); grad(P, ['rgba(110,135,160,0.55)', 'rgba(68,87,105,0.25)', 'rgba(0,0,0,0)'], 0, 0, 0.7, 0.6);
      L(P, [['CALVIN KLEIN', 0.33, 0.045, '#F2F2F2', 'helv', { x: 0.08, align: 'left', weight: 700, maxW: 0.84 }], ['DEFY', 0.43, 0.11, '#F2F2F2', 'helv', { x: 0.075, align: 'left', weight: 900, maxW: 0.86 }],
        ['EAU DE TOILETTE', 0.83, 0.02, '#F2F2F2', 'helv', { x: 0.08, align: 'left', weight: 500 }], ['SPRAY VAPORISATEUR', 0.86, 0.009, '#9aa6b4', 'helv', { x: 0.08, align: 'left' }], ['3.3 FL OZ  100 ml ℮', 0.89, 0.011, '#F2F2F2', 'helv', { x: 0.08, align: 'left' }]]);
    },
  });

  /* ---------- Davidoff ---------- */
  const coolWater = card(0.4, 0.28, { color: '#2E8DBA', rough: 0.3 }, {
    front: (P) => {
      grad(P, ['#4FB0D6', '#3A99C1', '#1F7FAE', '#2A6F99'], 0, 0.8, 1, 0.2);
      for (let i = 0; i < 40; i++) { const x = rnd(i + 5); P.rect(x, 0, 0.01 + rnd(i + 8) * 0.04, 1, `rgba(255,255,255,${0.03 + rnd(i + 2) * 0.06})`); }
      grad(P, ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)'], 0, 1, 0, 0.6, [0, 0.6, 1, 0.4]);
      tx(P, 'DAVIDOFF', 0.13, 0.02, '#FFFFFF', 'roman', { weight: 500, track: 0.2 });
      tx(P, 'Cool Water', 0.2, 0.045, '#FFFFFF', 'serif', { italic: true, weight: 600, maxW: 0.86 });
      L(P, [['EAU DE TOILETTE', 0.86, 0.008, '#FFFFFF', 'sans', { track: 0.25 }], ['NATURAL SPRAY', 0.88, 0.008, '#FFFFFF', 'sans', { track: 0.25 }], ['VAPORISATEUR', 0.9, 0.008, '#FFFFFF', 'sans', { track: 0.25 }], ['4.2 FL OZ ℮ 125 ML', 0.95, 0.012, '#FFFFFF', 'sans', { weight: 500 }]]);
    },
  });
  const hotWater = card(0.42, 0.3, { color: '#3A1A18', rough: 0.3 }, {
    front: (P) => {
      fullBg(P, '#2A1A18'); radial(P, 0.5, 0.52, 0.55, ['#E0402F', '#C2301F', '#7A1A12', '#2A1A18']);
      tx(P, 'DAVIDOFF', 0.2, 0.022, '#EDE6E4', 'roman', { weight: 500, track: 0.2 });
      tx(P, 'HOT', 0.47, 0.08, '#3A1210', 'serif', { weight: 800, track: 0.02, maxW: 0.8 });
      tx(P, 'WATER', 0.555, 0.02, '#3A1210', 'serif', { weight: 600, track: 0.65 });
      L(P, [['EAU DE TOILETTE', 0.88, 0.009, '#F6D8D2', 'sans', { track: 0.25 }], ['NATURAL SPRAY', 0.9, 0.008, '#F6D8D2', 'sans', { track: 0.25 }], ['3.7 FL OZ ℮ 110 ml', 0.94, 0.011, '#F6D8D2', 'sans', { weight: 500 }]]);
    },
  });
  const zino = card(0.62, 0.35, { color: '#E0C394', rough: 0.85 }, {
    front: (P) => {
      fullBg(P, '#E0C394'); for (let i = 0; i < 150; i++) P.line(0, i / 150, 1, i / 150, 'rgba(150,100,40,0.12)', 0.0009);
      P.frame(0.1, 0.07, 0.42, 0.48, '#C8662E', 0.003);
      L(P, [['EAU DE TOILETTE', 0.1, 0.011, '#4A3016', 'roman', { x: 0.31, weight: 600, track: 0.05 }], ['NATURAL SPRAY', 0.13, 0.009, '#4A3016', 'roman', { x: 0.31, weight: 600, track: 0.05 }]]);
      tx(P, 'Zino', 0.715, 0.04, '#8A6A3A', 'serif', { italic: true, weight: 500 });
      tx(P, 'DAVIDOFF', 0.78, 0.028, '#8A6A3A', 'roman', { weight: 500, track: 0.2 });
      tx(P, '4.2 FL OZ ℮ 125 ml', 0.95, 0.012, '#6A4A2A', 'serif', { weight: 500 });
    },
  });

  /* ---------- Viktor & Rolf ---------- */
  const vrLogo = (P, y, cap, col) => {
    const a = P.H / P.W;
    tx(P, 'VIKTOR', y, cap, col, 'sans', { x: 0.5 - cap * 0.75 * a, align: 'right', weight: 300, track: 0.06 });
    tx(P, 'ROLF', y, cap, col, 'sans', { x: 0.5 + cap * 0.75 * a, align: 'left', weight: 300, track: 0.06 });
    P.circle(0.5, y, cap * 0.55, col, 0.0018); tx(P, '&', y, cap * 0.55, col, 'sans', { weight: 400 });
  };
  const spicebomb = (o) => card(0.75, 0.5, { color: o.field, rough: 0.4, metal: 0.25 }, {
    front: (P) => {
      fullBg(P, o.field); if (o.brush) pinstripe(P, 'rgba(255,255,255,0.04)', 160);
      if (o.rules) { P.rect(0, 0.272, 1, 0.012, o.rules); P.rect(0, o.b1 + 0.004, 1, 0.012, o.rules); }
      P.rect(0, 0.29, 1, o.b1 - 0.29, o.band);
      tx(P, 'SPICEBOMB', 0.35, 0.05, o.ink, 'sans', { weight: 300, track: 0.08, maxW: 0.72 });
      if (o.mid) tx(P, o.mid, 0.4, 0.022, o.ink, 'sans', { weight: 400, track: 0.15 });
      vrLogo(P, o.mid ? 0.445 : 0.42, o.mid ? 0.03 : 0.038, o.ink);
      if (o.sub) tx(P, o.sub, 0.455, 0.013, o.ink, 'sans', { weight: 500, track: 0.3 });
      L(P, [[o.conc, 0.84, 0.01, o.foot, 'sans', { track: 0.2 }], ['VAPORISATEUR', 0.86, 0.008, o.foot, 'sans', { track: 0.2 }], ['SPRAY', 0.88, 0.008, o.foot, 'sans', { track: 0.2 }], ['℮90ml 3.04 FL.OZ.', 0.935, 0.02, o.foot, 'sans', { weight: 300 }]]);
    },
  });

  /* ---------- Carolina Herrera ---------- */
  const badBoy = card(0.7, 0.4, { color: '#0D0D0F', rough: 0.2 }, {
    front: (P) => {
      fullBg(P, '#0D0D0F'); grad(P, ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.04)'], 0, 0, 1, 1);
      const G = '#C9A55A';
      P.frame(0.07, 0.03, 0.86, 0.49, G, 0.005); P.frame(0.07, 0.71, 0.86, 0.26, G, 0.005);
      P.line(0, 0.515, 1, 0.515, G, 0.004); P.line(0, 0.715, 1, 0.715, G, 0.004);
      sx(P, 'BAD BOY', 0.5, 0.585, 0.045, '#EDEDED', 0.82, { font: 'serif', weight: 500 });
      tx(P, 'CAROLINA HERRERA', 0.637, 0.016, '#EDEDED', 'serif', { weight: 500, track: 0.04 });
      tx(P, 'NEW YORK', 0.667, 0.008, '#EDEDED', 'serif', { weight: 500, track: 0.35 });
      tx(P, 'EAU DE TOILETTE NATURAL SPRAY', 0.915, 0.011, '#EDEDED', 'helv', { weight: 500 });
      tx(P, '℮100 ml 3.4 FL OZ', 0.945, 0.013, '#EDEDED', 'helv', { weight: 500 });
    },
  });
  const vip = (o) => card(0.45, 0.32, { color: o.paper, rough: o.metal ? 0.25 : 0.6, metal: o.metal || 0 }, {
    front: (P) => {
      if (o.metal) { grad(P, ['#E4E2EE', '#C3C1CE', '#E8E6F0', '#BDBBC8'], 0, 0, 1, 0.2); pinstripe(P, 'rgba(255,255,255,0.3)', 140); }
      else { fullBg(P, o.paper); grad(P, ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.3)'], 0, 0, 1, 0); pinstripe(P, 'rgba(255,255,255,0.03)', 140); }
      o.stack.forEach(([s, y, cap, col]) => (s === '-' ? P.rect(0.06, y, 0.86, 0.004, col) : sx(P, s, 0.06, y, cap, col, 0.62, { font: 'helv', weight: 900, align: 'left', maxW: 0.88 })));
      tx(P, 'CAROLINA HERRERA', o.chy, 0.013, o.ink, 'serif', { weight: 500, track: 0.12 });
      foot(P, '℮100 ml', '3.4 FL OZ', 0.96, 0.009, o.ink, 'helv', {}, o.conc);
    },
  });
  const chPrive = card(0.62, 0.38, { color: '#3A3A3E', rough: 0.35, metal: 0.3 }, {
    front: (P) => {
      fullBg(P, '#3A3A3E'); brushed(P, 'rgba(255,255,255,0.05)', 160);
      P.rect(0.18, 0.17, 0.62, 0.41, '#0E0E10'); P.frame(0.2, 0.185, 0.58, 0.38, '#C8CACD', 0.003);
      sx(P, 'CH', 0.49, 0.295, 0.1, '#C8CACD', 0.85, { font: 'serif', weight: 500 }); sx(P, 'HC', 0.49, 0.455, 0.1, '#C8CACD', 0.85, { font: 'serif', weight: 500 });
      tx(P, 'MEN PRIVÉ', 0.78, 0.02, '#C8CACD', 'serif', { weight: 500, track: 0.3 });
      tx(P, 'CAROLINA HERRERA', 0.83, 0.016, '#C8CACD', 'serif', { weight: 500, track: 0.12 });
      foot(P, '℮100 ml', '3.4 FL OZ', 0.95, 0.01, '#C8CACD', 'helv');
    },
  });

  /* ---------- Dunhill ---------- */
  const dunWord = (P, x, y, cap, col) => sx(P, 'dunhill', x, y, cap, col, 0.8, { font: 'helv', weight: 700, ky: 1.45 });
  const icon = (o) => card(0.62, 0.45, { color: o.field, rough: 0.45, metal: 0.25 }, {
    front: (P) => {
      fullBg(P, o.field); hatch(P, 'rgba(255,255,255,0.06)', 0.014, 0.0012); hatch(P, 'rgba(0,0,0,0.2)', 0.014, 0.0012, [0.007, 0, 1, 1]);
      P.rect(0.28, 0, 0.1, 1, o.s1); P.rect(0.38, 0, 0.06, 1, o.s2);
      P.rect(0.2, 0.2, 0.36, 0.32, o.plate);
      dunWord(P, 0.38, 0.31, 0.045, '#F2F2F2');
      tx(P, 'LONDON', 0.37, 0.007, '#F2F2F2', 'sans', { x: 0.38, track: 0.5 });
      P.line(0.27, 0.39, 0.49, 0.39, o.ink, 0.0015); tx(P, 'ICON', 0.415, 0.014, o.ink, 'sans', { x: 0.38, weight: 500, track: 0.3 });
      P.line(0.27, 0.44, 0.49, 0.44, o.ink, 0.0015); if (o.sub) tx(P, o.sub, 0.465, 0.014, o.ink, 'sans', { x: 0.38, weight: 500, track: 0.3 });
      const l = { x: 0.06, align: 'left', track: 0.1 };
      L(P, [['EAU DE PARFUM FOR MEN', 0.86, 0.009, '#F2F2F2', 'sans', l], ['NATURAL SPRAY / VAPORISATEUR', 0.885, 0.008, '#F2F2F2', 'sans', l], ['3.4 FL. OZ. / 100 ml ℮', 0.91, 0.009, '#F2F2F2', 'sans', l]]);
    },
  });
  const desireBlue = card(0.55, 0.4, { color: '#2C5BD6', rough: 0.25, metal: 0.6 }, {
    front: (P) => {
      grad(P, ['#2448B8', '#4F86F0', '#2C5BD6', '#1E3FA8'], 0, 0, 1, 1);
      P.rect(0.25, 0.1, 0.3, 0.35, '#0B0B0D');
      dunWord(P, 0.4, 0.22, 0.05, '#F2F2F2'); tx(P, 'LONDON', 0.29, 0.008, '#F2F2F2', 'sans', { x: 0.4, track: 0.5 });
      P.rect(0.27, 0.34, 0.26, 0.08, '#24262B'); sx(P, 'DESIRE BLUE', 0.4, 0.38, 0.022, '#D6D9DE', 0.7, { font: 'helv', weight: 700, track: 0.1 });
      tx(P, 'EAU DE TOILETTE', 0.88, 0.012, '#F2F2F2', 'sans', { track: 0.2 }); tx(P, '100 ml ℮ 3.4 FL.OZ.', 0.92, 0.011, '#F2F2F2', 'sans');
    },
  });

  /* ---------- Lalique ---------- */
  const encre = (ext) => card(1.0, 0.7, { color: '#0B0B0B', rough: 0.6 }, {
    front: (P) => {
      fullBg(P, '#0B0B0B'); for (let i = 0; i < 220; i++) { const x = rnd(i + 3); P.path(Array.from({ length: 9 }, (_, j) => [x + Math.sin(j * 0.8 + i) * 0.003, j / 8]), `rgba(255,255,255,${0.012 + rnd(i) * 0.025})`, false, 0.001); }
      if (ext) {
        P.rect(0, 0.55, 1, 0.05, '#F07A1A'); tx(P, 'ENCRE  NOIRE', 0.575, 0.026, '#0B0B0B', 'sans', { weight: 500, track: 0.3 });
        tx(P, "À L'EXTRÊME", 0.65, 0.032, '#F07A1A', 'sans', { weight: 400, track: 0.2 });
      } else { P.rect(0, 0.42, 1, 0.08, 'rgba(255,255,255,0.035)'); tx(P, 'ENCRE  NOIRE', 0.47, 0.035, '#CFCFCF', 'sans', { weight: 400, track: 0.3, maxW: 0.7 }); }
      const y = ext ? 0.76 : 0.78;
      sx(P, 'LALIQUE', 0.5, y, ext ? 0.05 : 0.055, '#F0F0F0', 0.85, { font: 'sans', weight: 300, track: 0.04 });
      L(P, [[ext ? 'EAU DE PARFUM' : 'EAU DE TOILETTE', y + 0.08, 0.028, '#F0F0F0', 'sans', { weight: 500 }], ['VAPORISATEUR - NATURAL SPRAY', y + 0.12, 0.013, '#F0F0F0', 'sans'], ['℮ 100 ml - 3.3 Fl.Oz.', 0.95, 0.022, '#F0F0F0', 'sans', { weight: 500 }]]);
    },
  });

  /* ---------- Issey Miyake ---------- */
  const leauIssey = card(0.4, 0.3, { color: '#F4F4F2', rough: 0.5 }, {
    front: (P) => {
      fullBg(P, '#F4F4F2'); grad(P, ['rgba(185,188,189,0)', 'rgba(185,188,189,0.75)', '#B9BCBD'], 0, 0.5, 0, 1, [0, 0.5, 1, 0.5]); brushed(P, 'rgba(255,255,255,0.15)', 80);
      tx(P, 'ISSEY MIYAKE', 0.07, 0.016, '#8A8A8A', 'serif', { weight: 500, track: 0.15 });
      L(P, [["L'EAU D'ISSEY", 0.36, 0.02, '#3A3A3A', 'sans', { track: 0.15, maxW: 0.8 }], ['POUR HOMME', 0.41, 0.02, '#3A3A3A', 'sans', { track: 0.15 }], ['EAU DE TOILETTE', 0.5, 0.008, '#8A8A8A', 'sans', { track: 0.3 }]]);
      foot(P, '℮ 125 ml', '4.2 FL.OZ.', 0.97, 0.009, '#6A6A6A');
    },
  });
  const nuitIssey = card(0.4, 0.3, { color: '#2A2A2A', rough: 0.55 }, {
    front: (P) => {
      fullBg(P, '#2A2A2A'); brushed(P, 'rgba(255,255,255,0.07)', 260); P.rect(0, 0.48, 1, 0.52, 'rgba(255,255,255,0.04)');
      P.rect(0, 0.477, 1, 0.006, '#BFC3C6');
      tx(P, 'ISSEY MIYAKE', 0.06, 0.016, '#9A9A9A', 'serif', { weight: 500, track: 0.15 });
      tx(P, "NUIT D'ISSEY", 0.33, 0.022, '#F2F2F2', 'sans', { weight: 600, track: 0.2, maxW: 0.84 });
      L(P, [['EAU DE TOILETTE', 0.9, 0.007, '#9A9A9A', 'sans', { track: 0.2 }], ['POUR HOMME', 0.92, 0.007, '#9A9A9A', 'sans', { track: 0.2 }], ['ISSEY MIYAKE', 0.955, 0.012, '#9A9A9A', 'serif', { track: 0.15 }]]);
      foot(P, '℮125ml', '4.2 FL OZ', 0.955, 0.007, '#9A9A9A');
    },
  });

  /* ---------- Le Labo: kraft mailer, typed lab label ---------- */
  const lelabo = (item, fit) => Object.assign(prop(fit, 1.0, 0.55), {
    open: 'flap', paper: { color: '#9C7656', rough: 0.95 },
    front: (P) => {
      fullBg(P, '#9C7656'); stipple(P, 'rgba(60,40,20,0.12)', 2600, 0.0011); stipple(P, 'rgba(255,230,190,0.08)', 1200, 0.0012);
      P.rect(0, 0, 0.03, 1, 'rgba(0,0,0,0.12)'); P.rect(0.97, 0, 0.03, 1, 'rgba(0,0,0,0.12)'); P.line(0.03, 0, 0.03, 1, 'rgba(0,0,0,0.2)', 0.002); P.line(0.97, 0, 0.97, 1, 'rgba(0,0,0,0.2)', 0.002);
      tx(P, 'LE LABO', 0.44, 0.065, '#231F1C', 'helv', { weight: 800, track: 0.04 });
      P.circle(0.71, 0.4, 0.012, '#231F1C', 0.002); tx(P, 'R', 0.4, 0.008, '#231F1C', 'helv', { x: 0.71, weight: 700 });
      tx(P, 'GRASSE — NEW YORK', 0.52, 0.022, '#231F1C', 'helv', { weight: 700, track: 0.14, maxW: 0.42 });
      const x0 = 0.2, x1 = 0.84, k = '#1A1A1A', xt = 0.335;
      P.rect(x0, 0.59, x1 - x0, 0.35, '#EEEEE2'); P.line(0.325, 0.6, 0.325, 0.93, k, 0.001); P.line(0.825, 0.6, 0.825, 0.93, k, 0.001);
      tx(P, item.name.toUpperCase(), 0.625, 0.026, k, 'helv', { x: xt, align: 'left', weight: 700, maxW: 0.48 });
      raw(P, '100ml ℮ / 3,4 FL.OZ.', xt, 0.66, 0.018, k);
      P.line(xt, 0.68, 0.82, 0.68, k, 0.001);
      raw(P, 'eau de parfum', xt, 0.7, 0.018, k); raw(P, 'natural spray / vaporisateur', xt, 0.725, 0.018, k);
      P.line(xt, 0.745, 0.82, 0.745, k, 0.001);
      raw(P, 'Compounded:  in our lab', xt, 0.77, 0.018, k); raw(P, 'Fresh:       12 months after first spray*', xt, 0.795, 0.018, k, { maxW: 0.48 });
      P.line(xt, 0.815, 0.82, 0.815, k, 0.001);
      raw(P, 'Made in USA - LE LABO - 233 Elizabeth Street, New York, NY 10012 USA', xt, 0.835, 0.011, k, { maxW: 0.48 });
      for (let i = 0; i < 4; i++) raw(P, '* Store your creation away from light and heat to help preserve it for longer', xt, 0.86 + i * 0.016, 0.009, '#5a5a5a', { maxW: 0.48 });
    },
  });

  /* ---------- Maison Margiela: Replica ---------- */
  // Each scene paints into the photo window: u, v are 0..1 across it.
  const SCENE = {
    'Jazz Club': (S) => { S.fill('#1A0F0A'); S.glow(0.62, 0.35, 0.6, ['rgba(200,116,42,0.95)', 'rgba(90,42,20,0.6)', 'rgba(26,15,10,0)']); S.ell(0.4, 0.62, 0.12, 0.3, '#120806'); S.ell(0.4, 0.3, 0.07, 0.08, '#120806'); S.rect(0, 0.82, 1, 0.18, '#3A1A0E'); },
    'By the Fireplace': (S) => { S.fill('#2A1A12'); S.rect(0.12, 0.2, 0.76, 0.72, '#140C08'); S.glow(0.5, 0.7, 0.45, ['rgba(255,220,120,1)', 'rgba(216,106,30,0.9)', 'rgba(216,106,30,0)']); [0.36, 0.5, 0.62].forEach((u, i) => S.ell(u, 0.62, 0.07, 0.2 - i * 0.03, 'rgba(255,170,60,0.9)')); S.rect(0.25, 0.82, 0.5, 0.06, '#4A2A18'); },
    'Lazy Sunday Morning': (S) => { S.grad(['#F4F1EC', '#CFC8C0']); S.ell(0.35, 0.4, 0.3, 0.16, '#FAF8F5'); S.ell(0.7, 0.55, 0.3, 0.18, '#ECE7E1'); S.line(0.1, 0.75, 0.9, 0.68, 'rgba(150,140,130,0.4)'); S.line(0.2, 0.85, 0.8, 0.9, 'rgba(150,140,130,0.4)'); },
    'Beach Walk': (S) => { S.grad(['#B9D3E0', '#8FB7C9']); S.rect(0, 0.6, 1, 0.4, '#E9D3B6'); S.rect(0, 0.56, 1, 0.06, '#DDE8EC'); S.ell(0.68, 0.48, 0.12, 0.3, '#5A3A24'); S.ell(0.7, 0.8, 0.1, 0.2, '#C99B7E'); },
    'Coffee Break': (S) => { S.grad(['#E8DCCB', '#CDB89E']); S.ell(0.5, 0.6, 0.34, 0.18, '#F4EEE6'); S.ell(0.5, 0.55, 0.2, 0.12, '#F8F4EE'); S.ell(0.5, 0.54, 0.15, 0.08, '#6B4A33'); S.ell(0.5, 0.53, 0.07, 0.03, '#C8A47E'); },
    'Bubble Bath': (S) => { S.grad(['#BFD3DE', '#F2E8EC']); for (let i = 0; i < 26; i++) S.ell(rnd(i) , 0.45 + rnd(i + 4) * 0.55, 0.05 + rnd(i + 8) * 0.08, 0.04 + rnd(i + 9) * 0.06, 'rgba(255,255,255,0.85)'); },
    'Sailing Day': (S) => { S.grad(['#8FB8DE', '#C8DCEE']); S.rect(0, 0.62, 1, 0.38, '#2E5E8E'); S.path([[0.5, 0.12], [0.5, 0.62], [0.24, 0.62]], '#F2F2F2'); S.path([[0.53, 0.2], [0.53, 0.6], [0.72, 0.6]], '#E2E2E2'); S.rect(0.22, 0.62, 0.36, 0.05, '#3A2A1A'); },
    'Whispers in the Library': (S) => { S.fill('#3A2414'); for (let i = 0; i < 14; i++) S.rect(i / 14, 0.08 + rnd(i) * 0.1, 1 / 14 - 0.008, 0.4, ['#5A3A22', '#9A6A3A', '#6A2A1A', '#2E3A2A'][i % 4]); for (let i = 0; i < 12; i++) S.rect(i / 12, 0.56 + rnd(i + 5) * 0.08, 1 / 12 - 0.01, 0.4, ['#9A6A3A', '#5A3A22', '#7A4A2A'][i % 3]); S.rect(0, 0.5, 1, 0.04, '#2A180C'); },
    'Autumn Vibes': (S) => { S.grad(['#C88A2E', '#A8551E']); for (let i = 0; i < 30; i++) S.ell(rnd(i + 1), rnd(i + 31), 0.06, 0.035, ['#A8551E', '#C88A2E', '#7A3A14', '#D8A040'][i % 4]); },
    'Under the Lemon Trees': (S) => { S.grad(['#8FB8DE', '#C6DCEE']); for (let i = 0; i < 22; i++) S.ell(rnd(i + 2), rnd(i + 22) * 0.9, 0.09, 0.04, i % 2 ? '#4E7A2E' : '#3A6020'); for (let i = 0; i < 7; i++) S.ell(0.15 + rnd(i + 70) * 0.7, 0.2 + rnd(i + 80) * 0.6, 0.06, 0.07, '#E9D23A'); },
    'Matcha Meditation': (S) => { S.grad(['#E6D8BE', '#C9B590']); S.ell(0.5, 0.58, 0.32, 0.24, '#3A4A2A'); S.ell(0.5, 0.52, 0.28, 0.14, '#7FA04A'); S.ell(0.5, 0.52, 0.12, 0.05, '#A9C46A'); },
    'On a Date': (S) => { S.grad(['#E8C0B8', '#C49A5A']); S.glow(0.3, 0.4, 0.35, ['rgba(255,236,190,0.95)', 'rgba(255,200,120,0)']); for (let i = 0; i < 8; i++) S.ell(0.55 + rnd(i) * 0.4, 0.35 + rnd(i + 3) * 0.5, 0.07, 0.06, i % 2 ? '#D8A6A0' : '#B86A6A'); S.rect(0.27, 0.45, 0.06, 0.45, '#F6F0E6'); },
  };
  const REPLICA = {
    'Jazz Club': ['Brooklyn, 2013', 'Heady boozy notes', 'Male fragrance'],
    'By the Fireplace': ['Chamonix, 1971', 'Burning wood and chestnut', 'Memory in a fragrance'],
    'Lazy Sunday Morning': ['Florence, 2003', 'Clean white linen', 'Female fragrance'],
    'Beach Walk': ['Calvi, 1972', 'Sun-kissed salty skin', 'Female fragrance'],
    'Coffee Break': ['Milan, 2015', 'Warm milky coffee', 'Unisex fragrance'],
    'Bubble Bath': ['Paris, 2021', 'Soft soapy foam', 'Unisex fragrance'],
    'Sailing Day': ['Aeolian Islands, 1987', 'Fresh sea spray', 'Unisex fragrance'],
    'Whispers in the Library': ['Oxford, 1970', 'Old books and vanilla', 'Unisex fragrance'],
    'Autumn Vibes': ['New England, 2019', 'Crisp leaves and woods', 'Unisex fragrance'],
    'Under the Lemon Trees': ['Procida, 2015', 'Zesty lemon shade', 'Unisex fragrance'],
    'Matcha Meditation': ['Kyoto, 2021', 'Calm green matcha', 'Unisex fragrance'],
    'On a Date': ['Paris, 2023', 'Flowers by candlelight', 'Unisex fragrance'],
  };
  function scene(P, r, fn) {
    const g = P.g, X = (u) => r[0] + u * r[2], Y = (v) => r[1] + v * r[3];
    const S = {
      fill: (c) => P.rect(r[0], r[1], r[2], r[3], c),
      grad: (st) => grad(P, st, 0, r[1], 0, r[1] + r[3], r),
      rect: (u, v, w, h, c) => P.rect(X(u), Y(v), w * r[2], h * r[3], c),
      ell: (u, v, ru, rv, c) => P.ellipse(X(u), Y(v), ru * r[2], rv * r[3], 0, c),
      line: (u1, v1, u2, v2, c) => P.line(X(u1), Y(v1), X(u2), Y(v2), c, 0.003),
      path: (pts, c) => P.path(pts.map(([u, v]) => [X(u), Y(v)]), c),
      glow: (u, v, rr, st) => radial(P, X(u), Y(v), rr * r[3], st),
    };
    g.save(); g.beginPath(); g.rect(r[0] * P.W, r[1] * P.H, r[2] * P.W, r[3] * P.H); g.clip(); fn(S); g.restore();
  }
  const replica = (item, fit) => Object.assign(prop(fit, 0.44, 0.36), {
    open: 'flap', paper: { color: '#F3F1EC', rough: 0.85 },
    front: (P) => {
      const n = item.name.replace(/^Replica /, ''), d = REPLICA[n] || ['Paris, 2020', 'A familiar moment', 'Unisex fragrance'], k = '#111111';
      fullBg(P, '#F3F1EC'); stipple(P, 'rgba(0,0,0,0.03)', 800);
      const s = 0.27, w = s * P.H / P.W, r = [0.5 - w / 2, 0.095, w, s];
      P.rect(r[0] - 0.012, r[1] - 0.006, w + 0.024, s + 0.012, '#FFFFFF'); scene(P, r, SCENE[n] || SCENE['Lazy Sunday Morning']);
      P.rect(0, 0.54, 1, 0.22, '#ECE8DF'); P.line(0, 0.54, 1, 0.54, '#9A9A9A', 0.0015); P.line(0, 0.76, 1, 0.76, '#9A9A9A', 0.0015);
      const l = { x: 0.06, align: 'left' };
      tx(P, 'REPLICA', 0.57, 0.026, k, 'helv', Object.assign({ weight: 800 }, l));
      tx(P, 'REPRODUCTION OF FAMILIAR SCENTS AND MOMENTS', 0.597, 0.008, k, 'helv', Object.assign({ weight: 700, maxW: 0.88 }, l));
      tx(P, 'OF VARYING LOCATIONS AND PERIODS', 0.615, 0.008, k, 'helv', Object.assign({ weight: 700, maxW: 0.88 }, l));
      [['Originally:', n], ['Provenance and Period:', d[0]], ['Fragrance Description:', d[1]], ['Style Description:', d[2]]].forEach(([a, b], i) => {
        const y = 0.645 + i * 0.03; tx(P, a, y, 0.01, k, 'helv', Object.assign({ weight: 700, maxW: 0.4 }, l));
        const x = 0.06 + Math.min(0.4, a.length * 0.018); P.line(x, y + 0.009, 0.97, y + 0.009, 'rgba(0,0,0,0.35)', 0.0008); raw(P, b, x + 0.01, y, 0.016, '#6E6E6E', { maxW: 0.94 - x });
      });
      tx(P, 'Maison Margiela', 0.84, 0.024, k, 'serif', { weight: 500, maxW: 0.8 }); tx(P, 'PARIS', 0.87, 0.009, k, 'serif', { track: 0.35 });
      raw(P, 'Eau de Toilette', 0.5, 0.905, 0.02, '#333333', { align: 'center' }); raw(P, 'Vaporisateur Natural Spray', 0.5, 0.93, 0.02, '#333333', { align: 'center' }); raw(P, '℮ 100 ml 3.4 fl.oz.', 0.5, 0.965, 0.026, k, { align: 'center', weight: 700 });
    },
    top: (P) => { fullBg(P, '#F3F1EC'); tx(P, 'Maison Margiela', 0.45, 0.13, 'rgba(0,0,0,0.12)', 'serif', { weight: 500, maxW: 0.7 }); tx(P, 'PARIS', 0.62, 0.05, 'rgba(0,0,0,0.12)', 'serif', { track: 0.3 }); },
  });

  /* ---------- Diptyque: the oval ---------- */
  const DIP = {
    'Tam Dao': ['TAM', 'DAO'], Philosykos: ['PHILOSYKOS'], 'Do Son': ['DO', 'SON'], 'Orphéon': ['OR', 'PHÉ', 'ON'],
    'Fleur de Peau': ['FLEUR', 'DE', 'PEAU'], 'Oud Palao': ['OUD', 'PALAO'], 'Eau Duelle': ['EAU', 'DUELLE'],
  };
  function dipArt(P, n, cx, cy, s, k) {
    const a = P.H / P.W, X = (u) => cx + u * s * a, Y = (v) => cy + v * s, ln = (pts) => P.path(pts.map(([u, v]) => [X(u), Y(v)]), k, false, 0.0016);
    if (n === 'Philosykos') { for (const [u, v] of [[-0.3, 0.1], [0.3, 0.15]]) { P.ellipse(X(u), Y(v), 0.32 * s * a, 0.3 * s, 0, k); P.ellipse(X(u), Y(v), 0.27 * s * a, 0.25 * s, 0, P._bg); ln([[u - 0.1, v - 0.1], [u, v + 0.15], [u + 0.12, v - 0.05]]); } ln([[-0.6, -0.4], [-0.1, -0.25], [0.5, -0.45]]); return; }
    if (n === 'Do Son' || n === 'Tam Dao') { ln([[-0.7, 0.4], [0.7, 0.4]]); ln([[-0.45, 0.4], [-0.45, -0.05], [0.45, -0.05], [0.45, 0.4]]); ln(n === 'Tam Dao' ? [[-0.6, -0.05], [0, -0.35], [0.6, -0.05]] : [[-0.55, -0.05], [0.55, -0.05], [0.4, -0.2], [-0.4, -0.2], [-0.55, -0.05]]); for (const u of [-0.2, 0.2]) ln([[u, 0.4], [u, 0.1]]); P.circle(X(-0.75), Y(-0.1), 0.18 * s, k, 0.0016); P.circle(X(0.78), Y(-0.15), 0.2 * s, k, 0.0016); return; }
    if (n === 'Eau Duelle') { ln([[-0.6, 0.35], [-0.2, 0.0], [0.3, -0.2], [0.65, -0.3]]); ln([[-0.55, 0.42], [-0.15, 0.08], [0.32, -0.12], [0.68, -0.22]]); return; }
    if (n === 'Fleur de Peau') { for (let i = 0; i < 5; i++) { const t = i * 1.256; P.ellipse(X(Math.cos(t) * 0.25), Y(Math.sin(t) * 0.25), 0.15 * s * a, 0.22 * s, t + 1.57, k); } P.circle(X(0), Y(0), 0.1 * s, P._bg); ln([[0, 0.3], [0, 0.6]]); return; }
    // Orphéon / Oud Palao: a lattice of arcs (art-deco / eastern pattern).
    for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) P.circle(X(i * 0.3), Y(j * 0.3), 0.15 * s, k, 0.0014);
  }
  const diptyque = (edp) => (item, fit) => {
    const bg = edp ? '#0A0A0A' : '#F2F1EE', k = edp ? '#F5F5F5' : '#111111', dim = edp ? '#F5F5F5' : '#555555';
    return Object.assign(prop(fit, edp ? 0.5 : 0.58, 0.3), {
      open: 'flap', paper: { color: bg, rough: 0.8 }, lining: bg,
      front: (P) => {
        fullBg(P, bg); P._bg = bg; const a = P.H / P.W, cy = 0.45, rx = 0.25 * a * 1.25, ry = 0.24;
        P.rect(0, cy - 0.0175, 1, 0.035, k);
        P.ellipse(0.5, cy, rx + 0.004, ry + 0.004, 0, k); P.ellipse(0.5, cy, rx, ry, 0, bg);
        P.ellipse(0.5, cy, rx * 0.82, ry * 0.86, 0, k); P.ellipse(0.5, cy, rx * 0.82 - 0.003 * a, ry * 0.86 - 0.003, 0, bg);
        // Ring text: up the left side, over the top, down the right; "paris 5e" upright at the bottom.
        const ring = '34 boulevard saint germain diptyque 34 boulevard saint germain', g = P.g, N = ring.length;
        for (let i = 0; i < N; i++) {
          const t = Math.PI * (0.64 + 1.72 * i / (N - 1)), px = (0.5 + Math.cos(t) * rx * 0.91) * P.W, py = (cy + Math.sin(t) * ry * 0.93) * P.H;
          const sz = (i > 26 && i < 35 ? 0.03 : 0.018 + rnd(i) * 0.008) * P.H;
          g.save(); g.translate(px, py); g.rotate(t + Math.PI / 2); g.fillStyle = k; g.font = `${i > 26 && i < 35 ? 600 : 400} ${sz}px "Bodoni Moda", Didot, Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ring[i], 0, (rnd(i + 50) - 0.5) * sz * 0.3); g.restore();
        }
        tx(P, 'paris 5e', cy + ry * 0.93, 0.014, k, 'serif', { weight: 400 });
        const nm = DIP[item.name] || [item.name.toUpperCase()];
        if (nm.length === 1) tx(P, nm[0], 0.31, 0.02, k, 'serif', { weight: 700, track: 0.05, maxW: rx * 1.2 });
        else nm.forEach((w, i) => tx(P, w, 0.29 + i * 0.05, 0.032, k, 'serif', { x: 0.5 + (i % 2 ? 0.07 : -0.07), weight: 500, track: 0.35 }));
        dipArt(P, item.name, 0.5, nm.length === 1 ? 0.45 : 0.36 + nm.length * 0.05, 0.11, k);
        tx(P, edp ? 'eau de parfum' : 'eau de toilette', 0.82, 0.02, k, 'serif', { weight: 400 });
        if (edp) { tx(P, 'vaporisateur', 0.86, 0.012, dim, 'serif', { weight: 400 }); tx(P, 'natural spray', 0.885, 0.012, dim, 'serif', { weight: 400 }); }
        else tx(P, 'vaporisateur - natural spray', 0.86, 0.011, dim, 'serif', { weight: 400 });
        foot(P, edp ? '℮ 75 ml' : '℮ 100 ml', edp ? '2.5 fl.oz.' : '3.4 fl.oz.', 0.97, 0.012, k, 'serif');
      },
      top: (P) => { fullBg(P, bg); tx(P, 'diptyque', 0.45, 0.16, k, 'serif', { weight: 400 }); tx(P, 'paris', 0.62, 0.08, k, 'serif', { weight: 400 }); },
    });
  };

  /* ---------- Jo Malone London: telescoping lid over a black tray ---------- */
  const joMalone = (intense) => (item, fit) => {
    const paper = intense ? '#1E2228' : '#EFE9CF', ink = intense ? '#E8E8E8' : '#111111';
    return Object.assign(prop(fit, 0.6, 0.38), {
      lid: 0.955, paper: { color: paper, rough: 0.9 }, lining: '#111111',
      front: (P) => {
        fullBg(P, paper); pinstripe(P, intense ? 'rgba(255,255,255,0.03)' : 'rgba(120,100,60,0.06)', 200); brushed(P, intense ? 'rgba(255,255,255,0.03)' : 'rgba(120,100,60,0.06)', 200);
        P.rect(0, 0.955, 1, 0.045, '#111111'); P.rect(0, 0, 0.006, 1, '#111'); P.rect(0.994, 0, 0.006, 1, '#111');
        if (intense) {
          P.rect(0, 0.94, 1, 0.012, '#C9A55A');
          tx(P, 'JO MALONE', 0.08, 0.016, ink, 'serif', { weight: 500, track: 0.35 }); tx(P, 'LONDON', 0.105, 0.006, ink, 'serif', { track: 0.6 });
          const [a, b] = item.name.split(' & ');
          L(P, [[a, 0.38, 0.026, ink, 'serif'], ['& ' + b, 0.43, 0.026, ink, 'serif'], ['Cologne Intense', 0.48, 0.02, ink, 'serif']]);
          L(P, [['Cologne', 0.89, 0.008, ink, 'serif', { track: 0.2 }], ['100 ml ℮ / 3.4 fl oz liq', 0.91, 0.008, ink, 'serif', { track: 0.1 }]]);
        } else {
          P.frame(0.12, 0.37, 0.76, 0.18, ink, 0.0025);
          tx(P, 'J', 0.44, 0.028, ink, 'serif', { x: 0.215, weight: 500 }); tx(P, 'O', 0.444, 0.02, ink, 'serif', { x: 0.27, weight: 500 });
          tx(P, 'M', 0.44, 0.028, ink, 'serif', { x: 0.38, weight: 500 }); tx(P, 'ALONE', 0.444, 0.02, ink, 'serif', { x: 0.43, align: 'left', weight: 500, track: 0.35 });
          tx(P, 'LONDON', 0.49, 0.008, ink, 'serif', { track: 0.8 });
        }
      },
    });
  };

  BoxCraft.add({
    /* Hermès */
    hermes: terre('#523C2E', 'EAU DE TOILETTE'),
    "hermes|Terre d'Hermès": terre('#523C2E', 'EAU DE TOILETTE'),
    "hermes|Terre d'Hermès Eau Givrée": terre('#7A6454', 'EAU GIVRÉE', true),
    'hermes|H24': herm({
      rw: 0.55, rd: 0.33, paper: '#8C8985', side: '#A9B83A', logo: '#2E2E2E', ly: 0.8, bg: (P) => { P.rect(0.975, 0, 0.025, 1, '#A9B83A'); P.rect(0, 0, 1, 0.008, '#A9B83A'); },
      lines: [['VAPORISATEUR . REMPLISSABLE', 0.04, 0.009, '#EEEDEA', 'sans', { track: 0.2 }], ['NATURAL SPRAY . REFILLABLE', 0.065, 0.009, '#EEEDEA', 'sans', { track: 0.2 }], ['EAU DE TOILETTE', 0.43, 0.014, '#EEEDEA', 'sans', { track: 0.15 }]],
      art: (P) => { raw(P, 'H24', 0.5, 0.32, 0.12, '#2A2A2A', { align: 'center', font: 'helv', weight: 300, stroke: 0.0035 }); P.line(0.2, 0.32, 0.8, 0.32, '#2A2A2A', 0.0015); },
    }),
    'hermes|Un Jardin sur le Nil': herm({
      rw: 0.44, rd: 0.3, paper: '#FBFBF8', logo: '#2E9E3A', foot: '#9AB09A', ly: 0.855,
      bg: (P) => P.rect(0, 0, 1, 0.015, '#3CB043'),
      lines: [['VAPORISATEUR • RECHARGEABLE', 0.04, 0.008, '#2E9E3A', 'sans', { track: 0.12 }], ['NATURAL SPRAY • REFILLABLE', 0.06, 0.008, '#2E9E3A', 'sans', { track: 0.12 }], ['EAU DE TOILETTE', 0.08, 0.008, '#2E9E3A', 'sans', { track: 0.12 }],
        ['UN JARDIN', 0.37, 0.03, '#2E9E3A', 'serif', { weight: 500, track: 0.04 }], ['SUR LE NIL', 0.42, 0.03, '#2E9E3A', 'serif', { weight: 500, track: 0.04 }]],
      art: (P) => {
        P.line(0.3, 0.56, 0.42, 0.9, '#8A9A2A', 0.003); P.line(0.12, 0.68, 0.2, 0.92, '#8A9A2A', 0.003);
        for (const [x, y, rx, ry, rot] of [[0.08, 0.66, 0.26, 0.05, -0.25], [0.44, 0.73, 0.22, 0.042, 0.2], [0.12, 0.84, 0.24, 0.055, 0.2]]) { P.ellipse(x, y, rx, ry, rot, '#7E8C22'); P.ellipse(x, y, rx * 0.93, ry * 0.85, rot, '#B4C040'); }
        stipple(P, 'rgba(120,90,40,0.0)', 1);
        for (let i = 0; i < 40; i++) P.circle(rnd(i) * 0.5, 0.63 + rnd(i + 3) * 0.24, 0.002, 'rgba(120,90,40,0.5)');
        for (const [rx, rot] of [[0.05, -0.5], [0.05, 0.5], [0.04, 0]]) P.ellipse(0.3, 0.545, rx, 0.03, rot, '#EBB8C4');
        P.ellipse(0.3, 0.555, 0.025, 0.015, 0, '#D88898');
      },
    }),
    "hermes|Voyage d'Hermès": herm({
      rw: 0.63, rd: 0.45, paper: '#BAB7B6', logo: '#1A1A1A', foot: '#F4F4F4', ly: 0.76, speck: 'rgba(255,255,255,0.06)',
      bg: (P) => { for (let r = 0; r < 70; r++) for (let c = 0; c < 22; c++) P.path([[c / 22, r / 70], [(c + 0.5) / 22, r / 70 + 0.008], [(c + 1) / 22, r / 70]], 'rgba(255,255,255,0.18)', false, 0.0008); for (let i = 0; i < 40; i++) P.line(i / 40, 0.03, i / 40 + 0.012, 0.03, '#9a9a9a', 0.0012); },
      lines: [['VAPORISATEUR . RECHARGEABLE', 0.07, 0.009, '#F4F4F4', 'sans', { track: 0.2 }], ['NATURAL SPRAY . REFILLABLE', 0.095, 0.009, '#F4F4F4', 'sans', { track: 0.2 }],
        ['Voyage', 0.27, 0.05, '#1A1A1A', 'helv', { weight: 300, track: 0.02 }], ["d'Hermès", 0.36, 0.05, '#1A1A1A', 'helv', { weight: 300, track: 0.02 }], ['EAU DE TOILETTE', 0.45, 0.014, '#5A5A5A', 'sans', { track: 0.15 }]],
    }),
    'hermes|Bel Ami Vétiver': heritage({
      panel: [0.17, 0.23, 0.69, 0.55], pc: '#55241A', ring: true,
      top: [['EAU DE TOILETTE', 0.05, 0.009, '#B85A1E', 'sans', { track: 0.15 }], ['VAPORISATEUR - NATURAL SPRAY', 0.07, 0.008, '#B85A1E', 'sans', { track: 0.1 }]],
      lines: [['BEL AMI', 0.29, 0.024, '#E8C890', 'serif', { weight: 500 }], ['VÉTIVER', 0.33, 0.024, '#E8C890', 'serif', { weight: 500 }]],
    }),
    'hermes|Équipage': heritage({
      paper: '#D9481C', panel: [0.36, 0, 0.94, 0.52], pc: '#CABA94',
      lines: [['VAPORISATEUR', 0.05, 0.009, '#8A7A62', 'sans', { track: 0.15 }], ['NATURAL SPRAY', 0.07, 0.009, '#8A7A62', 'sans', { track: 0.15 }], ['EQUIPAGE', 0.4, 0.024, '#3A2A1E', 'serif', { weight: 500 }], ['EAU DE TOILETTE', 0.48, 0.008, '#3A2A1E', 'sans', { track: 0.15 }]],
    }),
    'hermes|Rocabar': heritage({
      paper: '#E05A20', panel: [0.36, 0, 0.94, 0.52], pc: '#B9A27A',
      lines: [['VAPORISATEUR', 0.05, 0.009, '#6A5A42', 'sans', { track: 0.15 }], ['NATURAL SPRAY', 0.07, 0.009, '#6A5A42', 'sans', { track: 0.15 }], ['ROCABAR', 0.4, 0.024, '#3A2A1E', 'serif', { weight: 500 }], ['EAU DE TOILETTE', 0.48, 0.008, '#3A2A1E', 'sans', { track: 0.15 }]],
    }),

    /* Guerlain */
    guerlain: (item, fit) => absolu(item.name.toUpperCase())(item, fit),
    "guerlain|L'Homme Idéal": ideal({ paper: '#B4B3B9', panel: '#C1C0C6', side: '#3A3A3E', inset: [0.15, 0.7], gy: 0.44, gg: true, conc: 'EAU DE TOILETTE',
      lines: [["L'HOMME", 0.25, 0.036, '#F4F4F6', 'sans', { track: 0.08 }], ['IDÉAL', 0.3, 0.036, '#F4F4F6', 'sans', { track: 0.08 }], ['DE', 0.37, 0.012, '#F4F4F6', 'sans', { track: 0.2 }]] }),
    'guerlain|Vétiver': ideal({ paper: '#2B413F', panel: '#263A38', side: '#1A2524', inset: [0.12, 0.7], gy: 0.33, conc: 'EAU DE TOILETTE', cy: 0.9,
      lines: [['VETIVER', 0.18, 0.036, '#F2F2F2', 'sans', { weight: 600, track: 0.08 }], ['DE', 0.25, 0.012, '#F2F2F2', 'sans', { track: 0.2 }]] }),
    'guerlain|Habit Rouge': habit({ paper: '#7C111A', band: '#C9C9CC', ink: '#F5F5F5', n: ['HABIT', 'ROUGE'] }),
    'guerlain|Héritage': habit({ paper: '#3A2A1E', band: '#C2A15C', ink: '#D8BC7A', n: ['HÉRITAGE', 'POUR HOMME'] }),
    'guerlain|Shalimar': card(0.75, 0.45, { color: '#1E2331', rough: 0.3 }, {
      front: (P) => {
        const G = '#C9A866'; fullBg(P, '#1E2331'); grad(P, ['rgba(255,255,255,0.06)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.15)'], 0, 0, 1, 1);
        P.line(0.5, 0, 0.5, 0.155, G, 0.002); P.circle(0.5, 0.18, 0.024, G, 0.0025); P.circle(0.5, 0.18, 0.012, G, 0.0015);
        L(P, [['SHALIMAR', 0.42, 0.034, G, 'roman', { weight: 500, track: 0.22 }], ['EAU DE PARFUM', 0.73, 0.013, G, 'sans', { track: 0.2 }], ['VAPORISATEUR . SPRAY', 0.755, 0.008, G, 'sans', { track: 0.2 }],
          ['GUERLAIN', 0.82, 0.032, G, 'roman', { weight: 600, track: 0.08 }], ['PARIS', 0.86, 0.01, G, 'roman', { track: 0.4 }]]);
      },
    }),
    'guerlain|Spiritueuse Double Vanille': absolu('SPIRITUEUSE', 'DOUBLE VANILLE'),
    'guerlain|Cuir Béluga': absolu('CUIR', 'BÉLUGA'),
    "guerlain|Bois d'Arménie": absolu('BOIS', "D'ARMÉNIE"),
    'guerlain|Santal Royal': absolu('SANTAL', 'ROYAL'),
    'guerlain|Tobacco Honey': absolu('TOBACCO', 'HONEY'),

    /* Cartier */
    cartier: pasha, 'cartier|Pasha de Cartier': pasha, 'cartier|Déclaration': declaration, "cartier|L'Envol de Cartier": envol,

    /* Bvlgari */
    bvlgari: (item, fit) => bvl({ paper: '#070607', ink: '#E0B394', fr: [0.15, 0.24, 0.85, 0.73], lines: man('#E0B394', item.name.replace(/^Bvlgari |^Man /, '').toUpperCase()), fc2: '#E6E6E6' })(item, fit),
    'bvlgari|Man in Black': bvl({ paper: '#070607', ink: '#E0B394', fr: [0.15, 0.24, 0.85, 0.73], lines: man('#E0B394', 'IN BLACK'), fc2: '#E6E6E6', rough: 0.85 }),
    'bvlgari|Man Wood Essence': bvl({ paper: '#4A3D35', ink: '#D8C8A0', panel: '#4F5A26', fr: [0.14, 0.24, 0.86, 0.73], lines: man('#D8C8A0', 'WOOD ESSENCE'), bg: (P) => pinstripe(P, 'rgba(0,0,0,0.08)', 120) }),
    'bvlgari|Aqva pour Homme': bvl({
      rw: 0.95, rd: 0.45, paper: '#182835', ink: '#E9ECEE', by: 0.12, bcap: 0.065, fr: [0.34, 0.3, 0.8, 0.75], conc: 'EAU DE TOILETTE', fx: 0.57, cy: 0.87,
      bg: (P) => grad(P, ['#24394A', '#182835'], 0, 0, 0, 1),
      lines: [['AQVA', 0.47, 0.055, '#E9ECEE', 'roman', { x: 0.57, weight: 500, track: 0.25 }], ['POUR HOMME', 0.56, 0.016, '#E9ECEE', 'roman', { x: 0.57, track: 0.3 }]],
    }),
    'bvlgari|Bvlgari pour Homme': bvl({
      paper: '#DCDCDA', metal: 0.3, rough: 0.4, ink: '#4A4A4A', fc: '#8A8A8A', fr: [0.15, 0.26, 0.85, 0.66], conc: 'EAU DE TOILETTE',
      bg: (P) => grad(P, ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.06)'], 0, 0, 1, 1),
      lines: [['POUR HOMME', 0.44, 0.026, '#4A4A4A', 'roman', { weight: 500, track: 0.2, maxW: 0.62 }], ['EAU DE TOILETTE', 0.5, 0.011, '#4A4A4A', 'sans', { track: 0.25 }]],
    }),
    'bvlgari|Le Gemme Tygar': bvl({
      rw: 0.45, rd: 0.4, paper: '#3A2E2E', rough: 0.35, ink: '#D8B46A', by: 0.06, ml: '125 ML', oz: '4.2 FL.OZ. U.S.', fc2: '#E8D8B0',
      bg: (P) => { for (let i = 0; i < 90; i++) P.ellipse(rnd(i), rnd(i + 99), 0.08 + rnd(i + 3) * 0.25, 0.02 + rnd(i + 5) * 0.06, rnd(i + 7) * 3, ['rgba(122,58,36,0.45)', 'rgba(58,46,46,0.5)', 'rgba(138,138,144,0.3)', 'rgba(170,96,50,0.35)'][i % 4]); },
      art: (P) => { P.rect(0.22, 0.58, 0.56, 0.19, '#C9A25A'); brushed(P, 'rgba(255,255,255,0.0)', 1); for (let i = 0; i < 30; i++) P.line(0.22, 0.58 + i * 0.0063, 0.78, 0.58 + i * 0.0063, 'rgba(255,255,255,0.12)', 0.0006); },
      lines: [['LE GEMME', 0.17, 0.026, '#D8B46A', 'roman', { weight: 500, track: 0.2 }], ['TYGAR', 0.625, 0.022, '#3A2414', 'roman', { weight: 600, track: 0.2 }], ['x', 0.67, 0.01, '#3A2414', 'sans'], ['REFIK ANADOL', 0.71, 0.014, '#3A2414', 'sans', { weight: 600, track: 0.15 }]],
    }),

    /* Mugler */
    mugler: amen({ rim: '#ADB0B1', panel: '#161618', key: '#6F78C8', blue: '#7F8AD8', hi: '#C8CCF0', ink: '#D8D8D8' }),
    'mugler|A*Men': amen({ rim: '#ADB0B1', panel: '#161618', key: '#6F78C8', blue: '#7F8AD8', hi: '#C8CCF0', ink: '#D8D8D8' }),
    'mugler|A*Men Pure Havane': amen({ rim: '#B87A48', panel: '#4A2E1C', key: '#C88A4A', blue: '#C88A4A', hi: '#E8C090', ink: '#D8A878', sub: 'PURE HAVANE' }),
    'mugler|Alien Man': alienMan,

    /* Burberry */
    burberry: london, 'burberry|London for Men': london, 'burberry|Brit for Him': brit, 'burberry|Mr. Burberry': mrb, 'burberry|Hero': hero('#7A5740', 'EAU DE PARFUM'),

    /* Montblanc */
    montblanc: legend({ paper: '#111111', lines: '#D0D0D0', ink: '#E6E6E6', word: '#F0F0F0' }),
    'montblanc|Explorer': explorer({ paper: '#151515', tex: 'rgba(255,255,255,0.05)', band: '#0E0E0E', ink: '#E2E2E2', word: '#F0F0F0' }),
    'montblanc|Explorer Platinum': explorer({ paper: '#A9ABAD', metal: 0.8, hex: true, band: '#C8C9CA', ink: '#2A2A2A', sub: 'PLATINUM' }),
    'montblanc|Explorer Ultra Blue': explorer({ paper: '#2B3F9E', tex: 'rgba(255,255,255,0.06)', band: '#3349B5', ink: '#FFFFFF', sub: 'ULTRA BLUE', stack: true }),
    'montblanc|Legend': legend({ paper: '#111111', lines: '#D0D0D0', ink: '#E6E6E6', word: '#F0F0F0' }),
    'montblanc|Legend Spirit': legend({ paper: '#E8E8E6', metal: 0.2, pearl: true, lines: '#6E6E6E', ink: '#4A4A4A', word: '#1A1A1A', spirit: true }),

    /* Azzaro */
    azzaro: azzaroPH,
    'azzaro|Wanted': wanted({ up: '#B4B1AE', low: '#D4B682', band: '#9C9996', knurl: 'rgba(60,60,60,0.45)', disc: '#C2A25E', med: '#DDBE78', medInk: '#6A5020', foot: '#8A6E3A', conc: 'Eau de Toilette',
      lines: [['AZZARO', 0.17, 0.014, '#2E2E2E', 'serif', { track: 0.5 }], ['WANTED', 0.27, 0.06, '#2E2E2E', 'sans', { weight: 600, maxW: 0.8 }]] }),
    'azzaro|Wanted by Night': wanted({ up: '#342E35', low: '#E1CA87', band: '#C8AE68', knurl: 'rgba(20,16,10,0.7)', disc: '#C8AC60', med: '#E0C67C', medInk: '#5A4418', foot: '#6A5428', conc: 'Eau de Parfum',
      lines: [['AZZARO', 0.17, 0.014, '#D9BF6E', 'serif', { track: 0.5 }], ['WANTED', 0.255, 0.058, '#D9BF6E', 'sans', { weight: 600, maxW: 0.8 }], ['BY NIGHT', 0.345, 0.034, '#E8E2EE', 'sans', { weight: 300, maxW: 0.7 }]] }),
    'azzaro|The Most Wanted': wanted({ up: '#312C31', band: '#604741', knurl: 'rgba(160,100,60,0.6)', disc: '#3A2A22', med: '#B07040', medInk: '#E8B080', foot: '#C88A66', conc: 'Parfum',
      lines: [['AZZARO', 0.15, 0.014, '#C88A66', 'serif', { track: 0.5 }], ['THE MOST', 0.225, 0.04, '#C89070', 'sans', { weight: 300 }], ['WANTED', 0.315, 0.055, '#C8885A', 'sans', { weight: 600, maxW: 0.8 }]] }),
    'azzaro|Chrome': chrome,
    'azzaro|Azzaro pour Homme': azzaroPH,

    /* Calvin Klein */
    ck: ckOne, 'ck|CK One': ckOne,
    'ck|Eternity for Men': eternity('#1D2133', '#F4F4F4'),
    'ck|Eternity Aqua for Men': eternity('#B0B5CC', '#1E2C5A', true),
    'ck|Obsession for Men': obsession, 'ck|Defy': defy, 'ck|Escape for Men': escape,

    /* Davidoff */
    davidoff: coolWater, 'davidoff|Cool Water': coolWater, 'davidoff|Hot Water': hotWater, 'davidoff|Zino': zino,

    /* Viktor & Rolf */
    vr: spicebomb({ field: '#9F9897', rules: '#C9C4C2', band: '#252628', b1: 0.47, ink: '#F2F2F2', foot: '#4A4A4A', conc: 'EAU DE TOILETTE' }),
    'vr|Spicebomb': spicebomb({ field: '#9F9897', rules: '#C9C4C2', band: '#252628', b1: 0.47, ink: '#F2F2F2', foot: '#4A4A4A', conc: 'EAU DE TOILETTE' }),
    'vr|Spicebomb Extreme': spicebomb({ field: '#606161', brush: true, band: '#B9783A', b1: 0.48, ink: '#2A1A0E', foot: '#D8D8D8', conc: 'EAU DE PARFUM', sub: 'EXTREME' }),
    'vr|Spicebomb Night Vision': spicebomb({ field: '#1E2022', band: '#389785', b1: 0.5, ink: '#FFFFFF', foot: '#C8C8C8', conc: 'EAU DE PARFUM', mid: 'NIGHT VISION', sub: 'EAU DE PARFUM' }),

    /* Carolina Herrera */
    ch: badBoy, 'ch|Bad Boy': badBoy, 'ch|CH Men Privé': chPrive,
    'ch|212 VIP Men': vip({ paper: '#D1CFDC', metal: 0.75, ink: '#111111', chy: 0.86, conc: 'eau de toilette',
      stack: [['212', 0.105, 0.085, '#111'], ['VIP', 0.23, 0.085, '#111'], ['MEN', 0.355, 0.065, '#111'], ['-', 0.405, '#111'], ['ARE YOU', 0.455, 0.05, '#111'], ['ON THE', 0.53, 0.05, '#111'], ['LIST?', 0.605, 0.05, '#111'], ['-', 0.66, '#111'], ['NYC', 0.735, 0.065, '#111'], ['-', 0.825, '#111']] }),
    'ch|212 VIP Black': vip({ paper: '#3C3B42', ink: '#F2F2F2', chy: 0.88, conc: 'eau de parfum for men',
      stack: [['212', 0.12, 0.085, '#8E8780'], ['VIP', 0.255, 0.085, '#8E8780'], ['BLACK', 0.39, 0.075, '#F2F2F2'], ['-', 0.455, '#F2F2F2'], ['NYC', 0.53, 0.065, '#8E8780']] }),

    /* Dunhill */
    dunhill: icon({ field: '#2E3033', s1: '#BFC3C6', s2: '#0B0B0B', plate: '#0B0B0B', ink: '#F2F2F2' }),
    'dunhill|Icon': icon({ field: '#2E3033', s1: '#BFC3C6', s2: '#0B0B0B', plate: '#0B0B0B', ink: '#F2F2F2' }),
    'dunhill|Icon Elite': icon({ field: '#1A1E2A', s1: '#C2A15C', s2: '#0B0B0B', plate: '#0B0B0B', ink: '#C2A15C', sub: 'ELITE' }),
    'dunhill|Desire Blue': desireBlue,

    /* Lalique */
    lalique: encre(false), 'lalique|Encre Noire': encre(false), "lalique|Encre Noire à l'Extrême": encre(true),

    /* Issey Miyake */
    issey: leauIssey, "issey|L'Eau d'Issey pour Homme": leauIssey, "issey|Nuit d'Issey": nuitIssey,

    /* Le Labo, Margiela: one box per house, the label changes */
    lelabo, margiela: replica,

    /* Diptyque: white EDT box, black EDP box */
    diptyque: diptyque(false), 'diptyque|Tam Dao': diptyque(false), 'diptyque|Philosykos': diptyque(false), 'diptyque|Do Son': diptyque(false), 'diptyque|Eau Duelle': diptyque(false),
    'diptyque|Orphéon': diptyque(true), 'diptyque|Fleur de Peau': diptyque(true), 'diptyque|Oud Palao': diptyque(true),

    /* Jo Malone London */
    jomalone: joMalone(false),
    'jomalone|Oud & Bergamot': joMalone(true), 'jomalone|Myrrh & Tonka': joMalone(true), 'jomalone|Velvet Rose & Oud': joMalone(true),
  });
})();
