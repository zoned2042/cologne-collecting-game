/* Sillage — retail boxes for the big designer houses (YSL, Armani, Versace, Prada, Rabanne,
 * Jean Paul Gaultier, Valentino, Ralph Lauren, Givenchy, Dolce & Gabbana, Boss, Gucci),
 * from photos of the real packaging. y is measured from the top of the face, cap heights
 * as a fraction of the box height.
 */
(() => {
  const { prop, tx, rnd, stipple, brushed, pinstripe, waves, fullBg, seal } = BoxCraft.lib;
  const ax = (P) => P.H / P.W;
  const PI = Math.PI;

  /* ---------- shared drawing helpers ---------- */
  // Small print anchored to the bottom-left and bottom-right corners.
  const corners = (P, l, r, y, cap, col, font = 'helv', inset = 0.1) => { tx(P, l, y, cap, col, font, { x: inset, align: 'left' }); tx(P, r, y, cap, col, font, { x: 1 - inset, align: 'right' }); };
  // Horizontally squeezed text (condensed Didones and grotesks).
  function ctext(P, s, y, cap, col, font, sx, o = {}) {
    const x = o.x != null ? o.x : 0.5, g = P.g; g.save(); g.translate(x * P.W, 0); g.scale(sx, 1); g.translate(-x * P.W, 0);
    tx(P, s, y, cap, col, font, Object.assign({}, o, { maxW: (o.maxW || 0.92) / sx })); g.restore();
  }
  // Text turned 90° to read bottom-to-top, centred on (x, y); len caps its length as a fraction of the height.
  function vtext(P, s, x, y, cap, col, font, o = {}, len = 0.9) {
    const g = P.g; g.save(); g.translate(x * P.W, y * P.H); g.rotate(-PI / 2); g.translate(-x * P.W, -y * P.H);
    if (o.sx) { g.translate(x * P.W, y * P.H); g.scale(1, o.sx); g.translate(-x * P.W, -y * P.H); }
    tx(P, s, y, cap, col, font, Object.assign({ x, maxW: len * ax(P) }, o)); g.restore();
  }
  // A light-to-dark diagonal sweep for metallic foil boards.
  function sheen(P, stops, ang = 0.35) {
    const g = P.g, gr = g.createLinearGradient(0, 0, P.W * ang, P.H);
    stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, P.W, P.H);
  }
  const vgrad = (P, stops, y0 = 0, y1 = 1) => { const g = P.g, gr = g.createLinearGradient(0, y0 * P.H, 0, y1 * P.H); stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c)); g.fillStyle = gr; g.fillRect(0, y0 * P.H, P.W, (y1 - y0) * P.H); };
  // Stroke helpers in face units (x by width, y by height, widths by height).
  function curve(P, pts, col, lw, cap = 'round') {
    const g = P.g; g.save(); g.strokeStyle = col; g.lineWidth = lw * P.H; g.lineCap = cap; g.beginPath(); g.moveTo(pts[0] * P.W, pts[1] * P.H);
    for (let i = 2; i < pts.length; i += 6) g.bezierCurveTo(pts[i] * P.W, pts[i + 1] * P.H, pts[i + 2] * P.W, pts[i + 3] * P.H, pts[i + 4] * P.W, pts[i + 5] * P.H);
    g.stroke(); g.restore();
  }
  const oval = (P, x, y, rx, ry, col, lw) => { const g = P.g; g.save(); g.beginPath(); g.ellipse(x * P.W, y * P.H, rx * P.H, ry * P.H, 0, 0, PI * 2); g.strokeStyle = col; g.lineWidth = lw * P.H; g.stroke(); g.restore(); };
  // Top flap with the house name.
  const topWord = (bg, s, ink, font = 'serif', o = {}) => (P) => { fullBg(P, bg); tx(P, s, 0.5, o.cap || 0.11, ink, font, Object.assign({ weight: 600, track: 0.12, maxW: 0.7 }, o)); };

  /* ---------- Yves Saint Laurent ---------- */
  // Cassandre's interlocked Y, S and L, centred on (x, y), h tall; k thickens the strokes.
  function cassandre(P, x, y, h, col, k = 1) {
    const g = P.g, s = h * P.H, X = (u) => x * P.W + u * s, Y = (v) => (y - h / 2) * P.H + v * s;
    const ln = (w, a, b, c, d) => { g.lineWidth = w * s * k; g.beginPath(); g.moveTo(X(a), Y(b)); g.lineTo(X(c), Y(d)); g.stroke(); };
    g.save(); g.strokeStyle = col; g.lineCap = 'butt';
    ln(0.08, -0.235, 0, 0.012, 0.43); ln(0.022, 0.2, 0, -0.004, 0.43);
    ln(0.045, 0, 0.4, 0, 0.99); ln(0.02, -0.02, 0.978, 0.23, 0.978); ln(0.018, 0.225, 0.945, 0.225, 0.995);
    const bz = (w, p) => { g.lineWidth = w * s * k; g.beginPath(); g.moveTo(X(p[0]), Y(p[1])); g.bezierCurveTo(X(p[2]), Y(p[3]), X(p[4]), Y(p[5]), X(p[6]), Y(p[7])); g.stroke(); };
    g.lineCap = 'round';
    bz(0.028, [0.16, 0.37, 0.11, 0.29, -0.17, 0.3, -0.15, 0.43]); bz(0.075, [-0.15, 0.43, -0.12, 0.53, 0.17, 0.53, 0.15, 0.67]); bz(0.028, [0.15, 0.67, 0.13, 0.79, -0.13, 0.8, -0.17, 0.71]);
    g.restore();
  }
  const yslWord = (P, y, cap, col, x = 0.5) => ctext(P, 'YvesSaintLaurent', y, cap, col, 'serif', 0.78, { x, weight: 600, maxW: 0.72 });
  const yslTop = (bg, ink) => (P) => { fullBg(P, bg); cassandre(P, 0.5, 0.5, 0.7, ink); };
  // The Y family: tall carton, tonal Cassandre, block Y, a label strip naming the concentration.
  const yslY = (o) => (item, fit) => Object.assign(prop(fit, 0.45, 0.3), {
    open: 'flap', paper: { color: o.paper, rough: 0.55 }, side: o.side,
    front: (P) => {
      fullBg(P, o.paper); cassandre(P, 0.5, 0.5, 0.94, o.tone, 1.3);
      P.path([[0.2, 0.2], [0.335, 0.2], [0.46, 0.33], [0.585, 0.2], [0.72, 0.2], [0.52, 0.39], [0.52, 0.52], [0.4, 0.52], [0.4, 0.39]], o.y);
      yslWord(P, 0.845, 0.024, '#f2f2f2');
      P.rect(0.25, 0.874, 0.5, 0.032, o.tag); tx(P, o.label, 0.891, 0.011, o.tagInk || '#111', 'helv', { weight: 600, track: 0.12, maxW: 0.46 });
      tx(P, 'VAPORISATEUR - NATURAL SPRAY', 0.925, 0.007, '#9a9a9a', 'helv', { track: 0.1 });
      corners(P, '3.3 fl.oz.', '℮100 ml', 0.957, 0.011, '#bdbdbd');
    },
    top: yslTop(o.paper, o.tone),
  });
  const yslCarton = (rw, rd, paper, draw, topInk) => (item, fit) => Object.assign(prop(fit, rw, rd), { open: 'flap', paper: { color: paper, rough: 0.55 }, front: (P) => { fullBg(P, paper); draw(P); }, top: yslTop(paper, topInk) });
  const yslFoot = (P, conc, col, y = 0.95) => { corners(P, '3.3 fl.oz.', '℮100 ml', y, 0.012, col); tx(P, conc, y - 0.008, 0.007, col, 'helv', { track: 0.12, maxW: 0.4 }); tx(P, 'VAPORISATEUR - SPRAY', y + 0.008, 0.006, col, 'helv', { track: 0.12, maxW: 0.4 }); };
  // An oversized black Cassandre bleeding off the white face (MYSLF, Libre).
  const yslBig = (rw, rd, word, wordCol, wordFont, wy, lines) => yslCarton(rw, rd, '#f4f3f0', (P) => {
    stipple(P, 'rgba(0,0,0,0.035)', 900); cassandre(P, 0.52, 0.47, rw < 0.5 ? 1.2 : 1.45, '#111111', 1.15);
    ctext(P, word, wy, rw < 0.5 ? 0.06 : 0.12, wordCol, wordFont, 0.85, { weight: 800, track: 0.02, maxW: 0.94, shadow: 'rgba(0,0,0,0.25)' });
    lines.forEach(([s, y, cap, col, bar]) => { if (bar) P.rect(0.2, y - cap * 1.3, 0.6, cap * 2.6, bar); if (s === 'YSL') yslWord(P, y, cap, col); else tx(P, s, y, cap, col, 'helv', { weight: 600, track: 0.1, maxW: 0.7 }); });
  }, '#111');

  /* ---------- Giorgio Armani ---------- */
  const didone = (P, s, y, cap, col, sx = 0.62, o = {}) => ctext(P, s, y, cap, col, 'serif', sx, Object.assign({ weight: 600 }, o));
  // Acqua di Giò: the big condensed GIÒ, left-aligned on the classic boxes.
  const adg = (o) => (item, fit) => Object.assign(prop(fit, o.rw || 0.55, o.rd || 0.38), {
    open: 'flap', paper: { color: o.paper, rough: o.gloss ? 0.25 : 0.45, metal: o.metal || 0 },
    front: (P) => {
      fullBg(P, o.paper); if (o.pearl) sheen(P, ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)', 'rgba(220,225,230,0.3)']);
      const x = o.center ? 0.5 : 0.13, al = o.center ? {} : { x, align: 'left' };
      didone(P, 'ACQUA DI', 0.17, 0.052, o.ink, 0.62, al); didone(P, 'GIÒ', 0.325, 0.15, o.gio || o.ink, 0.74, al);
      if (o.center) { didone(P, o.sub, 0.44, 0.024, o.ink, 0.7, { track: 0.05 }); }
      else didone(P, 'GIORGIO ARMANI', 0.435, 0.03, o.ink, 0.62, al);
      o.lines.forEach(([s, y, cap, l]) => didone(P, s, y, cap, o.ink, 0.75, Object.assign({ track: 0.12, maxW: 0.8 }, l ? al : {})));
      if (o.foot) corners(P, '℮100 ml', '3.4 FL.OZ.', 0.95, 0.011, o.ink, 'serif');
    },
    top: topWord(o.paper, 'GIORGIO ARMANI', o.ink, 'serif', { cap: 0.08 }),
  });
  const code = (o) => (item, fit) => Object.assign(prop(fit, o.rw || 0.42, o.rd || 0.3), {
    open: 'flap', paper: { color: '#111111', rough: 0.7 },
    front: (P) => {
      fullBg(P, '#111111');
      didone(P, 'ARMANI', o.y, 0.04, o.ink, 0.6, { track: 0.04 }); ctext(P, 'code', o.y + 0.055, 0.032, o.ink, 'serif', 0.7, { weight: 500 });
      if (o.tag) { P.rect(0.41, 0.785, 0.18, 0.026, '#d6d6d6'); tx(P, o.tag, 0.798, 0.009, '#111', 'helv', { weight: 600, track: 0.15, maxW: 0.16 }); }
      (o.lines || []).forEach(([s, y, cap]) => didone(P, s, y, cap, o.ink, 0.8, { track: 0.15 }));
      didone(P, 'GIORGIO ARMANI', o.ga || 0.88, 0.02, o.ink, 0.62, { track: 0.03 });
    },
    sideArt: (P) => { fullBg(P, '#111111'); vtext(P, 'ARMANI code', 0.35, 0.3, 0.05, o.ink, 'serif', {}, 0.5); vtext(P, 'GIORGIO ARMANI', 0.65, 0.3, 0.035, o.ink, 'serif', { track: 0.05 }, 0.45); },
    top: topWord('#111111', 'ARMANI', o.ink, 'serif', { cap: 0.1 }),
  });
  const swy = (o) => (item, fit) => Object.assign(prop(fit, 0.5, 0.36), {
    open: 'flap', paper: { color: o.paper, rough: 0.35, metal: o.metal || 0 },
    front: (P) => {
      fullBg(P, o.paper); if (o.metal) sheen(P, ['rgba(255,255,255,0.12)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.25)']);
      tx(P, 'STRONGER WITH', 0.3, 0.017, '#f0f0f0', 'sans', { weight: 400, track: 0.3, maxW: 0.7 });
      tx(P, 'Y', 0.375, 0.07, '#f2f2f2', 'sans', { x: 0.32, weight: 300 }); tx(P, 'U', 0.375, 0.07, '#f2f2f2', 'sans', { x: 0.68, weight: 300 });
      P.circle(0.48, 0.375, 0.04, o.o, 0.008); P.circle(0.52, 0.375, 0.04, o.o, 0.008);
      tx(P, o.sub, 0.45, 0.017, '#f0f0f0', 'sans', { weight: 400, track: 0.3, maxW: 0.7 });
      for (let i = 0; i < 4; i++) { const y = 0.565 + i * 0.03, s = (i % 2 ? -1 : 1) * 0.015; curve(P, [0, y, 0.3, y + s, 0.7, y - s, 1, y], 'rgba(0,0,0,0.45)', 0.022); curve(P, [0, y - 0.004, 0.3, y + s - 0.004, 0.7, y - s - 0.004, 1, y - 0.004], o.band, 0.016); }
      ctext(P, 'EMPORIO ARMANI', 0.78, 0.02, '#f2f2f2', 'serif', 0.75, { weight: 500, track: 0.08 });
      tx(P, o.conc, 0.82, 0.008, '#d8d8d8', 'helv', { track: 0.12 }); tx(P, 'VAPORISATEUR SPRAY', 0.84, 0.007, '#d8d8d8', 'helv', { track: 0.12 });
      corners(P, '℮100 ml', '3.4 FL.OZ.', 0.95, 0.01, '#d8d8d8');
    },
    top: topWord(o.paper, 'EMPORIO ARMANI', '#e8e8e8', 'serif', { cap: 0.07 }),
  });
  // Armani Privé: square, deep box with a lid; black board and a parchment name label.
  const prive = (name, edge) => (item, fit) => Object.assign(prop(fit, 0.62, 0.6), {
    lid: 0.3, paper: { color: '#161616', rough: 0.8 }, lining: '#1e1e1e',
    front: (P) => {
      fullBg(P, '#161616'); stipple(P, 'rgba(255,255,255,0.03)', 1600);
      P.rect(0.27, 0.46, 0.46, 0.18, '#d8c9a6'); P.frame(0.28, 0.47, 0.44, 0.16, edge, 0.004);
      tx(P, name.toUpperCase(), 0.525, 0.022, '#1a1a1a', 'serif', { weight: 600, track: 0.06, maxW: 0.4 });
      tx(P, 'ARMANI / PRIVÉ', 0.585, 0.012, '#1a1a1a', 'serif', { track: 0.12, maxW: 0.36 });
    },
  });

  /* ---------- Versace ---------- */
  // The Greek key (greca) as a band from (x, y) along len, th thick, in face units; vertical runs downward.
  function greca(P, x, y, len, th, col, vertical) {
    const g = P.g, t = th * P.H, L = len * (vertical ? P.H : P.W), n = Math.max(1, Math.round(L / t));
    g.save(); g.translate(x * P.W, y * P.H); if (vertical) { g.rotate(PI / 2); g.translate(0, -t); }
    g.strokeStyle = col; g.lineWidth = t * 0.09; g.lineJoin = 'miter'; const c = L / n;
    g.beginPath(); g.moveTo(0, t * 0.05); g.lineTo(L, t * 0.05); g.moveTo(0, t * 0.95); g.lineTo(L, t * 0.95);
    for (let i = 0; i < n; i++) { const a = i * c; g.moveTo(a + c * 0.1, t * 0.95); g.lineTo(a + c * 0.1, t * 0.25); g.lineTo(a + c * 0.8, t * 0.25); g.lineTo(a + c * 0.8, t * 0.72); g.lineTo(a + c * 0.4, t * 0.72); g.lineTo(a + c * 0.4, t * 0.5); }
    g.stroke(); g.restore();
  }
  function grecaFrame(P, m, th, col) { const mh = m / ax(P); greca(P, m, mh, 1 - 2 * m, th, col); greca(P, m, 1 - mh - th, 1 - 2 * m, th, col); greca(P, m + th * ax(P), mh, 1 - 2 * mh, th, col, true); greca(P, 1 - m, mh, 1 - 2 * mh, th, col, true); }
  // Medusa medallion: a key ring round a face crowned with snakes. r in height units.
  function medusa(P, x, y, r, col, ring = true, lw = 1) {
    const a = ax(P), X = (u) => x + u * r * a, Y = (v) => y + v * r;
    if (ring) {
      P.circle(x, y, r, col, r * 0.05 * lw); P.circle(x, y, r * 0.78, col, r * 0.04 * lw);
      for (let i = 0; i < 28; i++) { const t = i / 28 * 2 * PI, t2 = t + PI / 28; P.line(X(Math.cos(t) * 0.78), Y(Math.sin(t) * 0.78), X(Math.cos(t) * 0.95), Y(Math.sin(t) * 0.95), col, r * 0.03 * lw); P.line(X(Math.cos(t) * 0.95), Y(Math.sin(t) * 0.95), X(Math.cos(t2) * 0.9), Y(Math.sin(t2) * 0.9), col, r * 0.03 * lw); }
    }
    const k = ring ? 0.7 : 1;
    for (let i = 0; i < 12; i++) { const t = (i / 12) * 2 * PI - PI / 2; P.circle(X(Math.cos(t) * 0.7 * k), Y(Math.sin(t) * 0.72 * k), r * 0.13 * k, col, r * 0.035 * lw); }
    oval(P, x, y + r * 0.04 * k, r * 0.38 * k, r * 0.48 * k, col, r * 0.045 * lw);
    P.ellipse(X(-0.15 * k), Y(-0.06 * k), r * 0.07 * k * a, r * 0.035 * k, 0, col); P.ellipse(X(0.15 * k), Y(-0.06 * k), r * 0.07 * k * a, r * 0.035 * k, 0, col);
    P.line(X(0), Y(-0.02 * k), X(0), Y(0.16 * k), col, r * 0.03 * lw); P.line(X(-0.12 * k), Y(0.27 * k), X(0.12 * k), Y(0.27 * k), col, r * 0.035 * lw);
  }
  const vWord = (P, y, cap, col, o = {}) => tx(P, 'VERSACE', y, cap, col, 'roman', Object.assign({ weight: 600, track: 0.1, maxW: 0.72 }, o));
  const vSmall = (P, s, y, cap, col, o = {}) => tx(P, s, y, cap, col, 'roman', Object.assign({ weight: 500, track: 0.08, maxW: 0.7 }, o));
  const versace = (o) => (item, fit) => Object.assign(prop(fit, o.rw || 0.72, o.rd || 0.42), {
    open: 'flap', paper: { color: o.paper, rough: o.metal ? 0.3 : 0.65, metal: o.metal || 0 },
    front: (P) => { fullBg(P, o.paper); if (o.sheen) sheen(P, o.sheen); o.draw(P); },
    top: topWord(o.paper, 'VERSACE', o.ink, 'roman', { cap: 0.12 }),
  });
  // Eros and Eros Flame: metallic board with blind-embossed key and Medusa, gold lettering.
  const eros = (paper, sh, emb, ink, sub, conc, y0) => versace({
    paper, metal: 0.35, ink, sheen: sh, draw: (P) => {
      greca(P, 0.07, 0.05, 0.86, 0.06, emb); greca(P, 0.93, 0.11, 0.86, 0.045, emb, true); if (y0 > 0.6) greca(P, 0.07 + 0.045 * ax(P), 0.11, 0.86, 0.045, emb, true);
      medusa(P, 0.5, y0 > 0.6 ? 0.47 : 0.3, y0 > 0.6 ? 0.12 : 0.14, emb, false, 1.4);
      vWord(P, y0, 0.04, ink); vSmall(P, sub, y0 + 0.045, 0.018, ink, { track: 0.2 });
      vSmall(P, conc, y0 + 0.14, 0.013, ink); vSmall(P, 'Natural Spray', y0 + 0.16, 0.01, ink); vSmall(P, '100 mL ℮  3.4 US Fl.Oz.', y0 + 0.185, 0.011, ink);
    },
  });
  // Pour Homme / Oud Noir: black with a key frame, Medusa and right-aligned small print.
  const vph = (ink, sub, conc) => versace({
    paper: '#101010', ink, draw: (P) => {
      grecaFrame(P, 0.045, 0.03, ink); medusa(P, 0.5, 0.38, 0.08, ink);
      vWord(P, 0.56, 0.036, ink); tx(P, 'pour homme', 0.61, 0.016, ink, 'sans', { weight: 400, track: 0.25 });
      if (sub) tx(P, sub, 0.68, 0.02, ink, 'sans', { weight: 500, track: 0.12 });
      [conc, 'Natural Spray', '100 ml ℮ 3.4 us fl.oz.'].forEach((s, i) => tx(P, s, 0.85 + i * 0.03, 0.011, ink, 'roman', { x: 0.86, align: 'right', weight: 500 }));
    },
  });

  /* ---------- Prada ---------- */
  function pradaCrest(P, x, y, s, col) {
    const a = ax(P);
    P.path([[x - s * 0.5 * a, y - s * 0.5], [x + s * 0.5 * a, y - s * 0.5], [x + s * 0.4 * a, y + s * 0.1], [x, y + s * 0.4], [x - s * 0.4 * a, y + s * 0.1]], col, false, s * 0.06);
    P.path([[x - s * 0.25 * a, y - s * 0.25], [x + s * 0.25 * a, y - s * 0.25], [x, y + s * 0.15]], col);
    curve(P, [x - s * 0.9 * a, y + s * 0.4, x - s * 0.4 * a, y + s * 0.75, x + s * 0.4 * a, y + s * 0.75, x + s * 0.9 * a, y + s * 0.4], col, s * 0.07);
  }
  // Luna Rossa: the vertical "linea rossa" with PRADA turned along it.
  const luna = (o) => (item, fit) => Object.assign(prop(fit, o.rw || 0.74, 0.42), {
    open: 'flap', paper: { color: o.paper, rough: 0.5, metal: o.metal || 0 }, side: o.side,
    front: (P) => {
      fullBg(P, o.paper); if (o.draw) o.draw(P);
      const s0 = 0.5 - o.sw / 2;
      if (o.gold) { const g = P.g, gr = g.createLinearGradient(0, 0, 0, o.sl * P.H); gr.addColorStop(0, '#1a1a1a'); gr.addColorStop(1, o.stripe); g.fillStyle = gr; g.fillRect(s0 * P.W, 0, o.sw * P.W, o.sl * P.H); } else P.rect(s0, 0, o.sw, o.sl, o.stripe);
      vtext(P, 'PRADA', 0.5, o.sl * 0.62, o.sw / ax(P) * 0.45, o.pr || '#ffffff', 'serif', { weight: 600, track: 0.35 }, o.sl * 0.6);
      tx(P, o.name, o.ny, 0.018, o.nameInk || '#f0f0f0', 'sans', { weight: 400, track: 0.6, maxW: 0.6 });
      tx(P, 'LUNA ROSSA', o.ly, 0.012, o.lunaInk || '#bbbbbb', 'sans', { weight: 400, track: 0.4, maxW: 0.5 });
      (o.lines || []).forEach(([s, y, cap]) => tx(P, s, y, cap, o.small || '#9a9a9a', 'helv', { track: 0.12, maxW: 0.7 }));
    },
    top: (P) => { fullBg(P, o.paper); P.rect(0.44, 0, 0.12, 1, o.gold ? o.stripe : o.stripe); },
  });

  /* ---------- Rabanne ---------- */
  const paco = (P, y, cap, col) => ctext(P, 'paco rabanne', y, cap, col, 'helv', 0.95, { weight: 800, track: -0.02, maxW: 0.6 });
  function flourish(P, x, y, s, col) {
    const a = ax(P), X = (u) => x + u * s * a;
    curve(P, [X(0), y - s * 0.3, X(0.05), y + s * 0.2, X(0.6), y + s * 0.3, X(0.55), y - s * 0.05, X(0.5), y - s * 0.3, X(0.1), y - s * 0.1, X(0), y + s * 0.15], col, s * 0.05);
    curve(P, [X(0), y - s * 0.3, X(-0.05), y + s * 0.2, X(-0.6), y + s * 0.3, X(-0.55), y - s * 0.05, X(-0.5), y - s * 0.3, X(-0.1), y - s * 0.1, X(0), y + s * 0.15], col, s * 0.05);
    curve(P, [X(0), y + s * 0.15, X(0.1), y + s * 0.5, X(-0.3), y + s * 0.6, X(-0.1), y + s * 0.8], col, s * 0.04);
  }
  // 1 Million: the gold ingot board with the engraved "1", MILLION and the swash.
  const million = (o) => (item, fit) => Object.assign(prop(fit, 0.5, 0.31), {
    open: 'flap', paper: { color: o.margin || o.gold, rough: 0.22, metal: o.margin ? 0.2 : 0.85 },
    front: (P) => {
      fullBg(P, o.margin || o.gold);
      if (!o.margin) sheen(P, ['#f3d77a', o.gold, '#9c7420', o.gold, '#f0d070'], 0.6);
      const g = P.g; g.save(); g.fillStyle = o.panel || 'rgba(120,80,10,0.12)'; g.fillRect(0.07 * P.W, 0.05 * P.H, 0.86 * P.W, (o.margin ? 0.75 : 0.9) * P.H); g.restore();
      if (o.rays) for (let i = 0; i < 48; i++) { const t = i / 48 * 2 * PI; P.line(0.5, 0.22, 0.5 + Math.cos(t) * 0.8, 0.22 + Math.sin(t) * 0.8 / ax(P), 'rgba(255,240,190,0.18)', 0.002); }
      if (o.jewel) { const a = ax(P), r = 0.075; P.path(Array.from({ length: 8 }, (_, i) => { const t = (i + 0.5) / 8 * 2 * PI; return [0.5 + Math.cos(t) * r * a * 0.8, 0.22 + Math.sin(t) * r]; }), o.jewel); }
      tx(P, '1', 0.215, 0.16, o.one || '#2a1c08', 'roman', { weight: 800, shadow: 'rgba(0,0,0,0.2)' });
      P.line(0.5, 0.15, 0.5, 0.28, 'rgba(240,200,110,0.6)', 0.004);
      tx(P, 'MILLION', 0.335, 0.034, '#2a1c08', 'roman', { weight: 700, track: 0.04, maxW: 0.6 });
      flourish(P, 0.5, 0.39, 0.08, '#2a1c08');
      if (o.tag) { P.rect(0.375, 0.705, 0.25, 0.03, o.tag); tx(P, 'ROYAL', 0.72, 0.01, '#ffffff', 'helv', { weight: 600, track: 0.2 }); }
      if (o.conc) tx(P, o.conc, 0.72, 0.02, '#2a1c08', 'roman', { weight: 700, track: 0.06 });
      if (o.margin) { tx(P, 'rabanne', 0.87, 0.045, '#d4aa48', 'helv', { weight: 300, maxW: 0.7 }); tx(P, 'PARFUM', 0.93, 0.008, '#b8a070', 'helv', { track: 0.15 }); }
      else { paco(P, 0.85, 0.022, '#2a1c08'); tx(P, o.foot || 'EAU DE TOILETTE', 0.88, 0.008, '#2a1c08', 'helv', { track: 0.12 }); tx(P, 'NATURAL SPRAY', 0.9, 0.007, '#2a1c08', 'helv', { track: 0.12 }); tx(P, '100 ml ℮ 3.4 FL OZ', 0.94, 0.009, '#2a1c08', 'helv', { track: 0.05 }); }
    },
    top: (P) => { fullBg(P, o.gold); paco ? tx(P, 'paco rabanne', 0.5, 0.12, '#2a1c08', 'helv', { weight: 800, maxW: 0.7 }) : 0; },
  });
  // Invictus: winged trophy plaque.
  function wings(P, cy, up, low, s = 1) {
    const a = ax(P);
    for (const sd of [-1, 1]) for (let i = 0; i < 7; i++) {
      const t = (i / 6), ang = sd * (0.25 + t * 0.9), len = (0.3 - t * 0.12) * s, x = 0.5 + sd * (0.06 + t * 0.07) * a * s;
      P.ellipse(x + Math.sin(ang) * len * 0.5 * a, cy - Math.cos(ang) * len * 0.5, 0.025 * a * s, len * 0.5, ang * 0.9, up);
    }
    for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { const ang = sd * (1.7 + i * 0.22); P.ellipse(0.5 + sd * 0.05 * a + Math.sin(ang) * 0.09 * a * s, cy + 0.07 - Math.cos(ang) * 0.06 * s, 0.018 * a * s, 0.09 * s, ang, low); }
  }
  const invictus = (o) => (item, fit) => Object.assign(prop(fit, 0.78, 0.48), {
    open: 'flap', paper: { color: o.paper, rough: o.metal ? 0.35 : 0.7, metal: o.metal || 0 },
    front: (P) => {
      fullBg(P, o.paper); if (o.panel) P.rect(0.07, 0.05, 0.86, 0.72, o.panel); if (o.panelLine) P.frame(0.07, 0.05, 0.86, 0.72, o.panelLine, 0.003);
      if (o.brushed) brushed(P, 'rgba(255,255,255,0.15)');
      wings(P, 0.41, o.wing, o.low || o.wing, 0.95);
      P.rect(0.2, 0.4, 0.6, 0.12, o.plate); P.frame(0.21, 0.41, 0.58, 0.1, o.plateLine, 0.004); P.frame(0.225, 0.42, 0.55, 0.08, o.plateLine, 0.0015);
      tx(P, 'INVICTUS', 0.46, 0.042, o.plateInk, 'roman', { weight: 700, track: 0.04, maxW: 0.52 });
      (o.lines || []).forEach(([s, y, cap]) => tx(P, s, y, cap, o.sub || o.ink, 'roman', { weight: 600, track: 0.08 }));
      paco(P, 0.84, 0.026, o.ink); tx(P, o.conc, 0.88, 0.009, o.ink, 'helv', { track: 0.12 });
    },
    top: topWord(o.paper, 'paco rabanne', o.ink, 'helv', { cap: 0.1, weight: 800, track: 0 }),
  });

  /* ---------- Jean Paul Gaultier: the tin can ---------- */
  // Rolled ribs as dark/light line pairs between y0 and y1.
  function ribs(P, y0, y1, n, dark, light) { for (let i = 0; i < n; i++) { const y = y0 + (y1 - y0) * (i + 0.5) / n; P.line(0, y, 1, y, dark, 0.006); P.line(0, y + 0.006, 1, y + 0.006, light, 0.003); } }
  const jpgLogo = (P, y, col, sub, o = {}) => {
    ctext(P, 'Jean Paul', y, 0.034, col, 'roman', 0.75, { weight: 700, maxW: 0.32, shadow: o.shadow });
    ctext(P, 'GAULTIER', y + 0.056, 0.046, col, 'roman', 0.72, { weight: 800, maxW: 0.4, shadow: o.shadow });
    if (sub) tx(P, sub, y + 0.11, 0.014, o.subCol || col, 'helv', { weight: 600, track: 0.45, maxW: 0.3 });
  };
  const tin = (o) => (item, fit) => {
    const r = Math.max(0.2, Math.hypot(fit.w, fit.d) / 2 + 0.035), h = Math.max(fit.h + 0.16, r / 0.25);
    return {
      shape: 'round', r, h, lid: h * 0.13, arc: 3.4,
      paper: { color: o.metal, rough: o.rough || 0.3, metal: o.m != null ? o.m : 0.9 }, lining: { color: o.metal, rough: 0.35, metal: 0.8 }, topRim: o.rim,
      front: (P) => {
        const dk = o.ribDark || 'rgba(0,0,0,0.35)', lt = o.ribLight || 'rgba(255,255,255,0.3)';
        P.rect(0, 0, 1, 0.012, o.rimCol || 'rgba(0,0,0,0)'); P.rect(0, 0.988, 1, 0.012, o.rimCol || 'rgba(0,0,0,0)');
        ribs(P, 0.04, 0.16, 5, dk, lt); ribs(P, o.mid ? o.mid[0] : 0.5, o.mid ? o.mid[1] : 0.62, o.mid ? o.mid[2] : 6, dk, lt); ribs(P, 0.8, 0.95, 6, dk, lt);
        o.draw(P);
      },
    };
  };

  /* ---------- Valentino ---------- */
  // Rockstud pyramids: four-faced studs in a grid; hi and lo shade the faces.
  function studs(P, hi, lo, n = 13, y0 = 0, y1 = 1) {
    const cw = 1 / n, ch = cw / ax(P);
    for (let y = y0; y < y1; y += ch) for (let x = 0; x < 1; x += cw) {
      const cx = x + cw / 2, cy = y + ch / 2;
      P.path([[x, y], [x + cw, y], [cx, cy]], hi); P.path([[x, y], [cx, cy], [x, y + ch]], hi);
      P.path([[x + cw, y], [x + cw, y + ch], [cx, cy]], lo); P.path([[x, y + ch], [cx, cy], [x + cw, y + ch]], lo);
    }
  }
  const valWord = (P, y, cap, col) => ctext(P, 'VALENTINO', y, cap, col, 'serif', 0.68, { weight: 500, track: 0.02, maxW: 0.58 });
  const born = (o) => (item, fit) => Object.assign(prop(fit, 0.78, 0.45), {
    open: 'flap', paper: { color: o.paper, rough: 0.55 },
    front: (P) => {
      fullBg(P, o.paper); studs(P, o.hi || 'rgba(255,255,255,0.035)', o.lo || 'rgba(0,0,0,0.3)', 11);
      if (o.panel !== false) P.rect(0.19, 0.13, 0.62, 0.24, o.panel || '#0e0e0e');
      valWord(P, 0.235, 0.065, o.ink); tx(P, o.who || 'UOMO', 0.29, 0.012, o.ink, 'sans', { weight: 400, track: 0.3 });
      if (o.squares) { P.rect(0.2, 0.69, 0.06, 0.06 * ax(P), o.squares); P.rect(0.74, 0.69, 0.06, 0.06 * ax(P), o.squares); }
      ctext(P, 'BORN IN ROMA', o.by || 0.7, 0.016, o.bornInk || o.ink, 'helv', 0.75, { weight: 800, track: 0.08 });
      if (o.sub) tx(P, o.sub, (o.by || 0.7) + 0.03, 0.01, o.bornInk || o.ink, 'helv', { weight: 400, track: 0.15 });
      tx(P, o.conc || 'EAU DE TOILETTE', 0.9, 0.008, o.small || '#8a8a8a', 'helv', { track: 0.12 }); tx(P, 'VAPORISATEUR SPRAY', 0.92, 0.006, o.small || '#8a8a8a', 'helv', { track: 0.12 });
      corners(P, '100 ml', '3.4 FL.OZ.', 0.94, 0.009, o.small || '#8a8a8a');
    },
    top: (P) => { fullBg(P, o.paper); studs(P, o.hi || 'rgba(255,255,255,0.06)', o.lo || 'rgba(0,0,0,0.35)', 13); },
  });
  // The 2014 Uomo: plain cappuccino board with a gold-framed black square.
  const uomo = (paper, frame, ink, foot, sub) => (item, fit) => Object.assign(prop(fit, 0.82, 0.5), {
    open: 'flap', paper: { color: paper, rough: 0.7 },
    front: (P) => {
      fullBg(P, paper); stipple(P, 'rgba(0,0,0,0.04)', 900);
      const w = 0.36, hh = w / ax(P); P.rect(0.5 - w / 2, 0.38 - hh / 2, w, hh, '#111111'); P.frame(0.5 - w / 2 + 0.012, 0.38 - hh / 2 + 0.012 / ax(P), w - 0.024, hh - 0.024 / ax(P), frame, 0.003);
      valWord(P, 0.37, 0.03, ink); tx(P, 'UOMO', 0.41, 0.01, ink, 'sans', { weight: 400, track: 0.3 });
      if (sub) tx(P, sub, 0.62, 0.016, foot, 'sans', { weight: 400, track: 0.4 });
      valWord(P, 0.89, 0.035, foot); tx(P, '℮100 ml   EAU DE TOILETTE - VAPORISATEUR NATURAL SPRAY', 0.95, 0.007, foot, 'helv', { track: 0.05 });
    },
  });

  /* ---------- Ralph Lauren ---------- */
  // The Polo player, horse galloping to the left with the mallet raised. s = figure height.
  function pony(P, x, y, s, col) {
    const a = ax(P), X = (u) => x + u * s * a, Y = (v) => y + v * s, L = (x1, y1, x2, y2, w) => P.line(X(x1), Y(y1), X(x2), Y(y2), col, s * w);
    P.ellipse(X(0.02), Y(0.14), 0.27 * s * a, 0.12 * s, -0.08, col);
    P.path([[X(-0.2), Y(0.06)], [X(-0.33), Y(-0.1)], [X(-0.47), Y(-0.08)], [X(-0.46), Y(-0.02)], [X(-0.36), Y(-0.01)], [X(-0.24), Y(0.2)]], col);
    L(-0.17, 0.2, -0.38, 0.28, 0.055); L(-0.38, 0.28, -0.44, 0.38, 0.04); L(-0.12, 0.22, -0.2, 0.36, 0.05); L(-0.2, 0.36, -0.33, 0.44, 0.04);
    L(0.2, 0.2, 0.32, 0.34, 0.055); L(0.32, 0.34, 0.46, 0.42, 0.04); L(0.15, 0.22, 0.16, 0.38, 0.05); L(0.16, 0.38, 0.26, 0.47, 0.04);
    L(0.28, 0.08, 0.42, 0.24, 0.045);
    P.ellipse(X(0.0), Y(-0.07), 0.075 * s * a, 0.13 * s, 0.25, col); P.circle(X(-0.03), Y(-0.25), 0.055 * s, col);
    L(0.03, -0.14, 0.17, -0.3, 0.04); L(0.17, -0.3, 0.38, -0.5, 0.018); P.ellipse(X(0.4), Y(-0.51), 0.04 * s * a, 0.018 * s, -0.7, col);
    L(-0.02, 0.0, -0.1, 0.16, 0.05);
  }
  const rlWord = (P, y, cap, col) => tx(P, 'RALPH LAUREN', y, cap, col, 'serif', { weight: 500, track: 0.2, maxW: 0.6 });
  const polo = (o) => (item, fit) => Object.assign(prop(fit, 0.62, 0.38), {
    open: 'flap', paper: { color: o.paper, rough: o.gloss ? 0.25 : 0.6 },
    front: (P) => {
      fullBg(P, o.paper); if (o.bg) o.bg(P); if (o.gloss) sheen(P, ['rgba(255,255,255,0.15)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.2)']);
      if (o.frame) P.frame(0.06, 0.045, 0.88, 0.91, o.frame, 0.0035);
      pony(P, 0.5, o.py || 0.33, o.ps || 0.26, o.pony || o.ink);
      if (o.heritage) { tx(P, 'Polo', 0.45, 0.06, o.ink, 'roman', { weight: 800, track: 0.02 }); P.line(0.33, 0.48, 0.67, 0.48, o.ink, 0.002); tx(P, 'Ralph Lauren', 0.5, 0.011, o.ink, 'helv', { weight: 500 }); }
      else { tx(P, 'POLO', 0.6, 0.05, o.ink, 'serif', { weight: 600, track: 0.04, maxW: 0.6 }); rlWord(P, 0.665, 0.013, o.ink); }
      if (o.sub) tx(P, o.sub, 0.7, 0.014, o.subInk || o.ink, 'serif', { weight: 500, track: 0.2, maxW: 0.6 });
      if (o.tag) { P.rect(0.38, 0.815, 0.24, 0.028, o.tag, 0.014); tx(P, 'PARFUM', 0.829, 0.009, o.tagInk || '#1a1a1a', 'helv', { weight: 600, track: 0.15 }); }
      tx(P, o.conc || 'EAU DE TOILETTE', o.heritage ? 0.845 : 0.77, 0.011, o.small || o.ink, 'helv', { track: 0.1, maxW: 0.7 });
      tx(P, 'SPRAY/VAPORISATEUR', o.heritage ? 0.865 : 0.875, 0.008, o.small || o.ink, 'helv', { track: 0.1 });
      corners(P, o.oz || '4.2 FL.OZ.', o.ml || '125 ml', 0.93, 0.009, o.small || o.ink, 'helv', 0.09);
    },
    top: (P) => { fullBg(P, o.paper); if (o.frame) P.frame(0.06, 0.1, 0.88, 0.8, o.frame, 0.01); tx(P, 'RALPH LAUREN', 0.5, 0.08, o.ink, 'serif', { weight: 500, track: 0.2, maxW: 0.75 }); },
  });
  // Ralph's Club: the diamond R.
  function diamondR(P, x, y, h, col, gold, rc = 0.4, ry = 0.02) {
    const a = ax(P), w = h * 0.55 * a;
    P.path([[x, y - h / 2], [x + w, y], [x, y + h / 2], [x - w, y]], col, false, 0.004);
    if (gold) P.path([[x, y - h / 2 + 0.02], [x + w - 0.02, y], [x, y + h / 2 - 0.02], [x - w + 0.02, y]], gold, false, 0.003);
    tx(P, 'R', y + h * ry, h * rc, col, 'serif', { x, weight: 600 });
  }
  const club = (o) => (item, fit) => Object.assign(prop(fit, 0.62, 0.38), {
    open: 'flap', paper: { color: o.paper, rough: 0.55 },
    front: (P) => {
      fullBg(P, o.paper); if (o.twill) for (let i = -40; i < 80; i++) P.line(i / 40, 0, i / 40 + 0.6, 1, o.twill, 0.002);
      o.draw(P); rlWord(P, o.ry || 0.8, 0.016, o.ink);
      tx(P, o.conc, 0.87, 0.009, o.ink, 'helv', { track: 0.12 }); tx(P, 'SPRAY/VAPORISATEUR', 0.89, 0.007, o.ink, 'helv', { track: 0.12 });
      corners(P, '3.4 FL.OZ.', '100 ml', 0.94, 0.008, o.ink);
    },
    top: (P) => { fullBg(P, o.paper); P.rect(0.3, 0.25, 0.4, 0.5, '#111111'); tx(P, 'RL', 0.45, 0.16, '#f2f2f2', 'serif', { weight: 600 }); tx(P, 'PARFUM', 0.67, 0.05, '#f2f2f2', 'helv', { track: 0.2 }); },
  });

  /* ---------- Givenchy ---------- */
  // The 4G: four squared Gs turned about the centre. s = side in height units.
  function g4(P, x, y, s, col, lw = 0.12) {
    const g = P.g, S = s * P.H / 2; g.save(); g.translate(x * P.W, y * P.H); g.strokeStyle = col; g.lineWidth = S * lw; g.lineCap = 'butt'; g.lineJoin = 'miter';
    for (let i = 0; i < 4; i++) { g.beginPath(); [[0.1, -0.9], [-0.9, -0.9], [-0.9, 0.1], [-0.15, 0.1], [-0.15, -0.35], [-0.45, -0.35]].forEach(([u, v], j) => (j ? g.lineTo(u * S, v * S) : g.moveTo(u * S, v * S))); g.stroke(); g.rotate(PI / 2); }
    g.restore();
  }
  const gtx = (P, s, y, cap, col, tr = 0.3, o = {}) => tx(P, s, y, cap, col, 'sans', Object.assign({ weight: 500, track: tr, maxW: 0.8 }, o));
  const gent = (o) => (item, fit) => Object.assign(prop(fit, 0.58, 0.4), {
    open: 'flap', paper: { color: o.paper, rough: o.gloss ? 0.18 : 0.55, metal: o.metal || 0 },
    front: (P) => {
      fullBg(P, o.paper); if (o.band) P.rect(0, 0, 1, o.bandH || 0.38, o.band); if (o.edge) P.line(0, o.bandH, 1, o.bandH, o.edge, 0.002);
      if (o.gloss) sheen(P, ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.05)']);
      o.draw(P); if (o.g4) g4(P, 0.5, 0.88, 0.06, o.g4);
    },
    top: (P) => { fullBg(P, o.paper); g4(P, 0.5, 0.5, 0.5, o.g4 || o.ink || '#333', 0.1); },
  });

  /* ---------- Dolce & Gabbana ---------- */
  const dgWord = (P, y, cap, col, w = 0.8) => ctext(P, 'DOLCE&GABBANA', y, cap, col, 'helv', 0.8, { weight: 500, track: 0.01, maxW: w });
  function crown(P, x, y, w, col) {
    const a = 1 / ax(P), h = w * a * 0.45, X = (u) => x + u * w / 2, Y = (v) => y + v * h;
    P.path([[X(-0.8), Y(0.5)], [X(-1), Y(-0.35)], [X(-0.5), Y(0.05)], [X(-0.25), Y(-0.5)], [X(0), Y(-0.05)], [X(0.25), Y(-0.5)], [X(0.5), Y(0.05)], [X(1), Y(-0.35)], [X(0.8), Y(0.5)]], col);
    [-1, -0.25, 0.25, 1].forEach((u) => P.circle(X(u), Y(u === -1 || u === 1 ? -0.45 : -0.62), h * 0.12, col)); P.circle(X(0), Y(-0.75), h * 0.15, col);
    P.rect(X(-0.82), Y(0.55), w * 0.82, h * 0.18, col);
  }
  const dg = (o) => (item, fit) => Object.assign(prop(fit, o.rw || 0.68, 0.4), {
    open: 'flap', paper: { color: o.paper, rough: o.metal ? 0.28 : 0.6, metal: o.metal || 0 },
    front: (P) => { fullBg(P, o.paper); if (o.sheen) sheen(P, o.sheen, 0.8); o.draw(P); },
    top: (P) => { fullBg(P, o.paper); if (o.seal) { P.circle(0.5, 0.5, 0.17, '#b8bcc0'); dgWord(P, 0.5, 0.025, '#2a2a2a', 0.3); } else dgWord(P, 0.5, 0.07, o.ink || '#eee', 0.7); },
  });
  function stone(P, light, dark, n = 260) { for (let i = 0; i < n; i++) P.ellipse(rnd(i + 11), rnd(i + 401), 0.02 + rnd(i + 3) * 0.05, 0.01 + rnd(i + 5) * 0.03, rnd(i) * 3, i % 2 ? light : dark); }

  /* ---------- Hugo Boss ---------- */
  // The Bottled flask silhouette, bleeding off the top.
  function flask(P, col, x0 = 0.13, x1 = 0.87, y1 = 0.92) {
    const g = P.g, W = P.W, H = P.H, cx = (x0 + x1) / 2, nk = 0.14, cp = 0.17;
    g.save(); g.fillStyle = col; g.beginPath();
    g.moveTo((cx - cp) * W, 0); g.lineTo((cx - cp) * W, 0.1 * H); g.lineTo((cx - nk) * W, 0.1 * H); g.lineTo((cx - nk) * W, 0.2 * H);
    g.quadraticCurveTo(x0 * W, 0.22 * H, x0 * W, 0.34 * H); g.lineTo(x0 * W, (y1 - 0.03) * H); g.quadraticCurveTo(x0 * W, y1 * H, (x0 + 0.05) * W, y1 * H);
    g.lineTo((x1 - 0.05) * W, y1 * H); g.quadraticCurveTo(x1 * W, y1 * H, x1 * W, (y1 - 0.03) * H); g.lineTo(x1 * W, 0.34 * H);
    g.quadraticCurveTo(x1 * W, 0.22 * H, (cx + nk) * W, 0.2 * H); g.lineTo((cx + nk) * W, 0.1 * H); g.lineTo((cx + cp) * W, 0.1 * H); g.lineTo((cx + cp) * W, 0);
    g.closePath(); g.fill(); g.restore();
  }
  const bossSans = (P, s, x, y, cap, col, len) => vtext(P, s, x, y, cap, col, 'helv', { weight: 900, track: 0.02, sx: 1.25 }, len);
  const bottled = (o) => (item, fit) => Object.assign(prop(fit, 0.6, 0.38), {
    open: 'flap', paper: { color: o.paper, rough: o.metal ? 0.3 : 0.65, metal: o.metal || 0 },
    front: (P) => {
      fullBg(P, o.paper); if (o.sheen) { const g = P.g, gr = g.createLinearGradient(0, 0, P.W, 0); o.sheen.forEach((c, i) => gr.addColorStop(i / (o.sheen.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, P.W, P.H); }
      flask(P, o.flask);
      bossSans(P, 'BOSS', 0.5, 0.6, 0.15, '#111111', 0.5);
      tx(P, 'BOTTLED', 0.855, 0.013, '#111111', 'helv', { weight: 600, track: 0.5, maxW: 0.5 });
      P.rect(0.3, 0.87, 0.4, 0.024, '#111111'); tx(P, o.conc, 0.882, 0.009, '#ffffff', 'helv', { weight: 600, track: 0.12, maxW: 0.36 });
      tx(P, 'NATURAL SPRAY · VAPORISATEUR', 0.905, 0.006, '#222', 'helv', { track: 0.08, maxW: 0.6 });
      tx(P, '100 ml ℮ 3.3 FL.OZ.', 0.965, 0.008, o.foot || '#555', 'helv', { track: 0.05 });
    },
    top: (P) => { fullBg(P, o.paper); tx(P, 'BOSS', 0.5, 0.2, '#111', 'helv', { weight: 900, track: 0.02, maxW: 0.6 }); },
  });

  /* ---------- Gucci ---------- */
  // Interlocking GG; r = radius of each G in height units.
  function gg(P, x, y, r, col, lw = 0.2) {
    const g = P.g, R = r * P.H, d = 0.55 * R;
    const one = (cx) => { g.beginPath(); g.arc(0, 0, R, -0.75, 0.05, true); g.lineTo(R * 0.35, Math.sin(0.05) * R); g.stroke(); };
    g.save(); g.strokeStyle = col; g.lineWidth = R * lw; g.lineCap = 'butt';
    g.translate(x * P.W - d, y * P.H); one(); g.translate(2 * d, 0); g.rotate(PI); one(); g.restore();
  }
  const gWord = (P, s, y, cap, col, tr = 0.25) => tx(P, s, y, cap, col, 'roman', { weight: 500, track: tr, maxW: 0.7 });
  const guilty = (o) => (item, fit) => Object.assign(prop(fit, o.rw || 0.62, 0.36), {
    open: 'flap', paper: { color: o.paper, rough: o.metal ? 0.35 : 0.7, metal: o.metal || 0 },
    front: (P) => {
      fullBg(P, o.paper); if (o.tex) o.tex(P);
      gg(P, 0.5, o.gy || 0.18, o.gr || 0.068, o.ink); gWord(P, 'GUCCI', o.uy || 0.29, o.uc || 0.036, o.ink); gWord(P, 'GUILTY', (o.uy || 0.29) + (o.uc || 0.036) * 1.5, (o.uc || 0.036) * 0.55, o.ink, 0.3);
      o.lines.forEach(([s, y, cap, col]) => tx(P, s, y, cap, col || o.ink, 'helv', { weight: 500, track: 0.15, maxW: 0.7 }));
      corners(P, o.ml || '℮90 ml', o.oz || '3.0 FL.OZ.', 0.94, 0.009, o.ink);
    },
    top: (P) => { fullBg(P, o.paper); if (o.tex) o.tex(P); gg(P, 0.5, 0.5, 0.2, o.ink); },
  });

  BoxCraft.add({
    /* Yves Saint Laurent */
    ysl: yslY({ paper: '#121212', tone: '#262626', y: '#e6e6e6', tag: '#e8e8e8', label: 'EAU DE TOILETTE' }),
    'ysl|Y Eau de Toilette': yslY({ paper: '#121212', tone: '#262626', y: '#e6e6e6', tag: '#ececec', label: 'EAU DE TOILETTE', side: '#7d8bb8' }),
    'ysl|Y Eau de Parfum': yslY({ paper: '#151c33', tone: '#26304f', y: '#c8c9cc', tag: '#d6d8dc', label: 'EAU DE PARFUM' }),
    'ysl|Y Le Parfum': yslY({ paper: '#0d0b0d', tone: '#3b1a2e', y: '#d4a084', tag: '#c8927a', label: 'LE PARFUM' }),
    "ysl|La Nuit de L'Homme": yslCarton(0.7, 0.4, '#22232a', (P) => {
      cassandre(P, 0.5, 0.32, 0.36, '#c9cbd0'); ctext(P, "LA NUIT DE L'HOMME", 0.68, 0.03, '#e2e4e8', 'helv', 0.78, { weight: 400, track: 0.02, maxW: 0.62 });
      yslWord(P, 0.725, 0.022, '#c9cbd0'); yslFoot(P, 'EAU DE TOILETTE', '#9fa2a8');
    }, '#c9cbd0'),
    "ysl|L'Homme": yslCarton(0.72, 0.4, '#2b2b2d', (P) => {
      const a = ax(P), r = 0.235; P.path(Array.from({ length: 6 }, (_, i) => { const t = PI / 6 + i * PI / 3; return [0.5 + Math.cos(t) * r * a * 1.05, 0.255 + Math.sin(t) * r]; }), '#f2f2f2');
      cassandre(P, 0.5, 0.255, 0.3, '#111111');
      tx(P, "L'HOMME", 0.6, 0.035, '#f2f2f2', 'helv', { weight: 300, track: 0.12, maxW: 0.5 }); yslWord(P, 0.66, 0.026, '#f2f2f2');
      yslFoot(P, 'EAU DE TOILETTE', '#d0d0d0', 0.93);
    }, '#f2f2f2'),
    'ysl|MYSLF': yslBig(0.42, 0.3, 'MYSLF', '#b8bcc2', 'helv', 0.4, [['YSL', 0.88, 0.022, '#111'], ['EAU DE PARFUM', 0.905, 0.008, '#111'], ['VAPORISATEUR RECHARGEABLE / REFILLABLE SPRAY', 0.93, 0.005, '#111']]),
    'ysl|Libre': yslBig(0.7, 0.4, 'LIBRE', '#b8913c', 'sans', 0.33, [['YSL', 0.78, 0.028, '#b8913c'], ['EAU DE PARFUM', 0.83, 0.012, '#c9a24a', '#111111'], ['VAPORISATEUR RECHARGEABLE / REFILLABLE SPRAY', 0.88, 0.006, '#111']]),
    'ysl|Kouros': yslCarton(0.55, 0.38, '#1c2a4a', (P) => {
      const band = (y, flip) => { P.rect(0, y, 1, 0.05, '#f2f2f2'); P.rect(0.3, flip ? y + 0.05 : y - 0.05, 0.4, 0.05, '#f2f2f2'); P.rect(0.4, flip ? y + 0.05 : y - 0.035, 0.2, 0.035, '#1c2a4a'); };
      band(0.17, false); band(0.62, true);
      tx(P, 'KOUROS', 0.38, 0.042, '#f2f2f2', 'helv', { weight: 400, track: 0.12, maxW: 0.7 });
      yslWord(P, 0.82, 0.026, '#f2f2f2'); yslFoot(P, 'EAU DE TOILETTE', '#e0e0e0', 0.93);
    }, '#f2f2f2'),
    'ysl|Tuxedo': (item, fit) => Object.assign(prop(fit, 0.48, 0.4), {
      open: 'flap', paper: { color: '#efebe3', rough: 0.9 },
      front: (P) => {
        fullBg(P, '#efebe3'); stipple(P, 'rgba(90,80,60,0.06)', 1800); pinstripe(P, 'rgba(90,80,60,0.035)', 90);
        P.frame(0.2, 0.35, 0.6, 0.25, '#111', 0.003); P.frame(0.215, 0.36, 0.57, 0.23, '#111', 0.0012);
        tx(P, 'TUXEDO', 0.43, 0.028, '#111', 'serif', { weight: 500, track: 0.12, maxW: 0.5 }); tx(P, 'EPICES - PATCHOULI', 0.48, 0.008, '#111', 'helv', { track: 0.15 });
        yslWord(P, 0.54, 0.018, '#111'); tx(P, 'LE VESTIAIRE DES PARFUMS', 0.88, 0.011, '#111', 'helv', { weight: 500, track: 0.2, maxW: 0.7 });
      },
      top: yslTop('#efebe3', '#111'),
    }),
    'ysl|M7 Oud Absolu': yslCarton(0.6, 0.4, '#121212', (P) => {
      for (let i = 0; i < 7; i++) P.rect(0, i / 7 + 0.07, 1, 0.07, 'rgba(255,255,255,0.03)');
      P.rect(0.29, 0.28, 0.42, 0.24, '#6b2a22'); tx(P, 'M7', 0.375, 0.08, '#f2f2f2', 'serif', { weight: 500, italic: true }); yslWord(P, 0.48, 0.016, '#f2f2f2');
      tx(P, 'EAU DE TOILETTE', 0.83, 0.012, '#e8e8e8', 'helv', { track: 0.12 }); tx(P, 'VAPORISATEUR - SPRAY', 0.86, 0.009, '#e8e8e8', 'helv', { track: 0.12 });
      tx(P, '2.7 fl.oz. ℮80 ml', 0.9, 0.018, '#e8e8e8', 'helv', { weight: 400 });
    }, '#6b2a22'),

    /* Giorgio Armani */
    armani: adg({ paper: '#ecebe8', pearl: true, ink: '#4a4d50', gio: '#383b3e', foot: true, lines: [['EAU DE TOILETTE', 0.79, 0.014], ['VAPORISATEUR SPRAY', 0.84, 0.009]] }),
    'armani|Acqua di Giò Eau de Toilette': adg({ paper: '#ecebe8', pearl: true, ink: '#4a4d50', gio: '#383b3e', foot: true, lines: [['EAU DE TOILETTE', 0.79, 0.014], ['POUR HOMME', 0.815, 0.014], ['VAPORISATEUR SPRAY', 0.845, 0.009]] }),
    'armani|Acqua di Giò Profumo': adg({ paper: '#0e0e0e', gloss: true, ink: '#c8b48a', lines: [['PROFUMO', 0.82, 0.032, 1], ['PARFUM', 0.86, 0.012, 1], ['VAPORISATEUR / NATURAL SPRAY', 0.89, 0.008, 1]] }),
    'armani|Acqua di Giò Parfum': adg({ paper: '#0e0e0e', gloss: true, ink: '#c8b48a', lines: [['PARFUM', 0.82, 0.032, 1], ['VAPORISATEUR RECHARGEABLE', 0.86, 0.008, 1], ['REFILLABLE SPRAY', 0.88, 0.008, 1]] }),
    'armani|Acqua di Giò Profondo': adg({ rw: 0.7, rd: 0.42, paper: '#1e2640', gloss: true, center: true, sub: 'PROFONDO', ink: '#d9dce2', lines: [['EAU DE PARFUM', 0.73, 0.013], ['GIORGIO ARMANI', 0.82, 0.024], ['VAPORISATEUR RECHARGEABLE / REFILLABLE SPRAY', 0.86, 0.007]] }),
    'armani|Armani Code': code({ y: 0.27, ink: '#b8b8b8', lines: [['EAU DE TOILETTE', 0.81, 0.009], ['POUR HOMME', 0.83, 0.009]] }),
    'armani|Armani Code Profumo': code({ y: 0.27, ink: '#b58a54', lines: [['PROFUMO', 0.8, 0.016], ['POUR HOMME', 0.83, 0.009]] }),
    'armani|Armani Code Parfum': code({ rw: 0.62, rd: 0.4, y: 0.24, ink: '#c4c4c4', tag: 'PARFUM', ga: 0.86, lines: [['VAPORISATEUR RECHARGEABLE / REFILLABLE SPRAY', 0.9, 0.007]] }),
    'armani|Stronger With You Intensely': swy({ paper: '#3a3a3c', metal: 0.5, o: '#d2873a', band: '#c9772e', sub: 'INTENSELY', conc: 'EAU DE PARFUM POUR HOMME' }),
    'armani|Stronger With You Absolutely': swy({ paper: '#121212', o: '#d2502a', band: '#b4471e', sub: 'ABSOLUTELY', conc: 'PARFUM POUR HOMME' }),
    'armani|Privé Oud Royal': prive('Oud Royal', '#c9a24a'),
    "armani|Privé Bois d'Encens": prive("Bois d'Encens", '#b89a5a'),
    'armani|Privé Rouge Malachite': prive('Rouge Malachite', '#b89a5a'),

    /* Versace */
    versace: eros('#0c4462', ['#14608a', '#0d4664', '#08304a', '#0d4664'], 'rgba(255,255,255,0.08)', '#c9a35a', 'EROS', 'Eau de Toilette', 0.69),
    'versace|Eros': eros('#0c4462', ['#14608a', '#0d4664', '#08304a', '#0d4664'], 'rgba(255,255,255,0.08)', '#c9a35a', 'EROS', 'Eau de Toilette', 0.69),
    'versace|Eros Flame': eros('#9a1824', ['#a8303a', '#8a1620', '#5a0a12', '#8a1620'], 'rgba(255,255,255,0.09)', '#d4a65a', 'EROS FLAME', 'Eau de Parfum', 0.58),
    'versace|Eros Parfum': versace({
      paper: '#185a80', ink: '#d7b56d', draw: (P) => {
        P.rect(0.19, 0.13, 0.62, 0.8, '#d7b56d'); medusa(P, 0.5, 0.31, 0.14, '#1c4f78', false, 1.2);
        vWord(P, 0.54, 0.038, '#1c4f78', { maxW: 0.56 }); vSmall(P, 'EROS', 0.585, 0.017, '#1c4f78', { track: 0.2 });
        vSmall(P, 'Parfum', 0.8, 0.012, '#1c4f78'); vSmall(P, 'Natural Spray', 0.82, 0.009, '#1c4f78'); vSmall(P, '100 mL ℮ 3.4 US FL.OZ.', 0.85, 0.009, '#1c4f78');
      },
    }),
    'versace|Eros Energy': versace({
      paper: '#d9c22a', metal: 0.45, ink: '#2a2610', sheen: ['#efe060', '#d9c22a', '#a8901a', '#d9c22a'], draw: (P) => {
        grecaFrame(P, 0.04, 0.06, '#3a3410'); medusa(P, 0.5, 0.3, 0.085, '#3a3410', false);
        ctext(P, 'VERSACE', 0.5, 0.042, '#2a2610', 'roman', 0.8, { weight: 800, maxW: 0.6 }); tx(P, 'EROS ENERGY', 0.58, 0.018, '#2a2610', 'helv', { weight: 600, track: 0.12 });
        tx(P, 'pour homme', 0.61, 0.014, '#2a2610', 'helv', { weight: 400, track: 0.1 }); tx(P, 'EAU DE PARFUM', 0.7, 0.009, '#2a2610', 'helv', { track: 0.15 }); tx(P, 'NATURAL SPRAY', 0.72, 0.007, '#2a2610', 'helv', { track: 0.15 });
        tx(P, '100 ml ℮ 3.4 US fl. oz.', 0.79, 0.009, '#2a2610', 'helv');
      },
    }),
    'versace|Dylan Blue': versace({
      paper: '#14161c', ink: '#c8a15a', draw: (P) => {
        medusa(P, 0.5, 0.32, 0.1, '#c8a15a'); ctext(P, 'VERSACE', 0.62, 0.042, '#c8a15a', 'roman', 0.8, { weight: 800, maxW: 0.66 });
        tx(P, 'DYLAN BLUE', 0.68, 0.016, '#c8a15a', 'helv', { weight: 500, track: 0.25 }); tx(P, 'pour homme', 0.71, 0.013, '#c8a15a', 'helv', { weight: 400, track: 0.1 });
        greca(P, 0, 0.835, 1, 0.032, '#c8a15a'); tx(P, 'EAU DE TOILETTE · NATURAL SPRAY', 0.9, 0.008, '#c8a15a', 'helv', { track: 0.12 });
        corners(P, '100 ml ℮', '3.4 US fl. oz.', 0.95, 0.009, '#c8a15a');
      },
    }),
    'versace|Pour Homme': vph('#cfd2d4', '', 'Eau de Toilette'),
    'versace|Pour Homme Oud Noir': vph('#c9a45c', 'OUD NOIR', 'Eau de Parfum'),
    'versace|The Dreamer': versace({
      rw: 0.55, rd: 0.45, paper: '#1e2860', ink: '#e8e8f0', draw: (P) => {
        P.rect(0, 0, 1, 0.13, '#2c3672'); for (let i = 0; i < 260; i++) P.circle(rnd(i + 31), 0.13 + rnd(i + 97) * 0.87, 0.0015 + rnd(i + 5) * 0.002, 'rgba(255,255,255,0.85)');
        vWord(P, 0.3, 0.036, '#e8e8f0'); greca(P, 0, 0.33, 1, 0.025, '#c8ccd4'); tx(P, 'THE DREAMER', 0.39, 0.016, '#f0f0f0', 'helv', { weight: 500, track: 0.15 });
        tx(P, 'EAU DE TOILETTE', 0.82, 0.012, '#f0f0f0', 'helv', { weight: 500, track: 0.12 }); tx(P, 'NATURAL SPRAY', 0.85, 0.008, '#f0f0f0', 'helv', { track: 0.12 });
        corners(P, '100 ml ℮', '3.4 US fl.oz', 0.93, 0.01, '#f0f0f0');
      },
    }),

    /* Prada */
    prada: (item, fit) => Object.assign(prop(fit, 0.72, 0.4), {
      open: 'flap', paper: { color: '#151515', rough: 0.75 },
      front: (P) => {
        fullBg(P, '#151515'); stipple(P, 'rgba(255,255,255,0.05)', 3000, 0.0009); P.rect(0, 0, 1, 0.08, '#101010'); P.rect(0, 0.88, 1, 0.12, '#101010');
        tx(P, item.name.toUpperCase().replace(' PRADA', ''), 0.19, 0.045, '#f2f2f2', 'serif', { weight: 500, track: 0.04, maxW: 0.7 });
        tx(P, 'PRADA', 0.265, 0.045, '#f2f2f2', 'serif', { weight: 500, track: 0.04 }); tx(P, 'MILANO', 0.31, 0.008, '#f2f2f2', 'helv', { track: 0.3 });
        pradaCrest(P, 0.5, 0.345, 0.03, '#f2f2f2');
        ['EAU DE TOILETTE', 'VAPORISATEUR SPRAY', '℮ 100ml 3.4 FL OZ'].forEach((s, i) => tx(P, s, 0.85 + i * 0.02, 0.008, '#d8d8d8', 'helv', { track: 0.12 }));
      },
      top: topWord('#151515', 'PRADA', '#f2f2f2', 'serif', { cap: 0.12, track: 0.04 }),
    }),
    'prada|Luna Rossa Carbon': luna({ rw: 0.78, paper: '#26282a', stripe: '#c8202a', sw: 0.12, sl: 0.62, name: 'CARBON', ny: 0.68, ly: 0.78, lunaInk: '#a8a8a8', small: '#8a8a8a', side: '#e4e4e2', draw: (P) => P.rect(0, 0.72, 1, 0.28, '#e4e4e2'), lines: [['EAU DE TOILETTE', 0.86, 0.008], ['VAPORISATEUR SPRAY POUR HOMME', 0.885, 0.007], ['℮100ml 3.4 FL OZ', 0.91, 0.008]] }),
    'prada|Luna Rossa Black': luna({ paper: '#5a5c5e', metal: 0.5, gold: true, stripe: '#8a6f3a', sw: 0.12, sl: 0.42, name: 'BLACK', ny: 0.58, ly: 0.72, lunaInk: '#e8e8e8', small: '#d8d8d8', draw: (P) => {
      for (let y = 0.01; y < 0.68; y += 0.014) for (let x = 0.01; x < 1; x += 0.014 / ax(P)) P.circle(x, y, 0.0028, (Math.round(x * 300 + y * 300) % 2) ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.12)');
      P.rect(0, 0.68, 1, 0.32, '#111111');
    }, lines: [['EAU DE PARFUM', 0.82, 0.012], ['VAPORISATEUR SPRAY POUR HOMME', 0.88, 0.007], ['℮100ml 3.4 FL OZ', 0.92, 0.008]] }),
    'prada|Luna Rossa Ocean': luna({ paper: '#2a2f36', stripe: '#6a2a2a', sw: 0.11, sl: 0.45, pr: '#c8c8c8', name: 'OCEAN', ny: 0.56, ly: 0.67, nameInk: '#b8c4d0', lunaInk: '#7a8088', small: '#c0c6cc', draw: (P) => brushed(P, 'rgba(255,255,255,0.02)', 120), lines: [['EAU DE PARFUM', 0.86, 0.011], ['VAPORISATEUR SPRAY POUR HOMME', 0.88, 0.007]] }),
    'prada|Paradigme': (item, fit) => Object.assign(prop(fit, 0.62, 0.4), {
      open: 'flap', paper: { color: '#1f4a37', rough: 0.5 },
      front: (P) => {
        fullBg(P, '#1f4a37'); P.path([[0.325, 0], [0.675, 0], [0.5, 0.1]], '#0e0e0e');
        P.rect(0.325, 0.255, 0.35, 0.03, '#f2f2f2'); tx(P, 'PARADIGME', 0.27, 0.011, '#111', 'helv', { weight: 600, track: 0.15, maxW: 0.32 });
        tx(P, 'PRADA', 0.335, 0.05, '#f2f2f2', 'serif', { weight: 600, track: 0.02, maxW: 0.6 });
        tx(P, 'EAU DE PARFUM', 0.8, 0.011, '#f2f2f2', 'helv', { track: 0.15 }); tx(P, '℮100 ml 3.4 FL. OZ.', 0.92, 0.009, '#f2f2f2', 'helv', { track: 0.08 });
      },
      top: topWord('#1f4a37', 'PRADA', '#f2f2f2', 'serif', { cap: 0.12 }),
    }),
    'prada|Amber pour Homme': (item, fit) => Object.assign(prop(fit, 0.62, 0.38), {
      open: 'flap', paper: { color: '#2a2224', rough: 0.85 },
      front: (P) => {
        fullBg(P, '#2a2224'); stipple(P, 'rgba(255,255,255,0.03)', 1800);
        tx(P, 'PRADA', 0.36, 0.09, '#3a3032', 'serif', { x: 0.62, weight: 600, maxW: 2 });
        P.rect(0.23, 0.3, 0.38, 0.07, '#e8dcc0'); P.circle(0.255, 0.335, 0.006, '#2a2224'); tx(P, 'PRADA', 0.335, 0.022, '#111', 'serif', { x: 0.43, weight: 600, maxW: 0.3 });
        ['AMBER POUR HOMME', 'eau de toilette vaporisateur', '℮100 ml 3.4 FL OZ'].forEach((s, i) => tx(P, s, 0.82 + i * 0.025, i ? 0.008 : 0.012, '#9a9090', 'helv', { track: 0.12 }));
      },
      top: topWord('#2a2224', 'PRADA', '#e8dcc0', 'serif', { cap: 0.12 }),
    }),

    /* Rabanne */
    rabanne: million({ gold: '#d4a63a' }),
    'rabanne|1 Million': million({ gold: '#d4a63a' }),
    'rabanne|1 Million Parfum': million({ gold: '#d9ab45', rays: true, conc: 'PARFUM', foot: 'PARFUM' }),
    'rabanne|1 Million Royal': million({ gold: '#e2c178', margin: '#eeeeee', panel: '#e2c178', jewel: '#8a1a2a', one: '#e2c178', tag: '#9a2333' }),
    'rabanne|Invictus': invictus({ paper: '#90959a', panel: '#a4a8ad', panelLine: '#e0e2e4', wing: '#1c1c1c', low: '#8e9480', plate: '#eef0f0', plateLine: '#1c1c1c', plateInk: '#111', ink: '#3a3a3a', conc: 'EAU DE TOILETTE' }),
    'rabanne|Invictus Victory': invictus({ paper: '#111111', wing: '#e8e8e8', plate: '#111111', plateLine: '#c9a04a', plateInk: '#d8b86a', ink: '#f0f0f0', sub: '#d8c08a', lines: [['VICTORY', 0.68, 0.022]], conc: 'EAU DE PARFUM EXTRÊME' }),
    'rabanne|Invictus Victory Elixir': invictus({ paper: '#0f1220', wing: '#c9a04a', plate: '#c9a04a', plateLine: '#1a1408', plateInk: '#111', ink: '#c9a04a', lines: [['VICTORY', 0.68, 0.022], ['ELIXIR', 0.72, 0.016]], conc: 'PARFUM INTENSE' }),
    'rabanne|Invictus Platinum': invictus({ paper: '#cfd2d6', metal: 0.6, brushed: true, wing: '#4a4c50', low: '#f0f2f4', plate: '#f4f5f6', plateLine: '#3a3c40', plateInk: '#2a2c30', ink: '#3a3c40', lines: [['PLATINUM', 0.68, 0.02]], conc: 'EAU DE PARFUM' }),
    'rabanne|Phantom': (item, fit) => Object.assign(prop(fit, 0.7, 0.45), {
      open: 'flap', paper: { color: '#e9eaeb', rough: 0.3, metal: 0.25 },
      front: (P) => {
        fullBg(P, '#e9eaeb'); P.rect(0.06, 0.04, 0.88, 0.76, '#f4f5f5');
        tx(P, 'PHANTOM', 0.17, 0.045, '#111', 'helv', { weight: 600, track: 0.04, maxW: 0.8 });
        const x = 0.5, a = ax(P); P.rect(x - 0.035 * a, 0.55, 0.07 * a, 0.035, '#9a9a9a'); P.rect(x - 0.055 * a, 0.59, 0.11 * a, 0.085, '#bdbdbd'); P.frame(x - 0.035 * a, 0.605, 0.07 * a, 0.05, '#111', 0.006);
        P.rect(x - 0.05 * a, 0.68, 0.035 * a, 0.035, '#9a9a9a'); P.rect(x + 0.015 * a, 0.68, 0.035 * a, 0.035, '#9a9a9a');
        paco(P, 0.86, 0.026, '#111'); tx(P, 'EAU DE TOILETTE', 0.89, 0.008, '#333', 'helv', { track: 0.12 });
      },
      top: (P) => { fullBg(P, '#e9eaeb'); P.rect(0.3, 0.2, 0.4, 0.6, '#111'); P.rect(0.38, 0.35, 0.24, 0.3, '#c8c8c8'); },
    }),
    'rabanne|Pure XS': (item, fit) => Object.assign(prop(fit, 0.78, 0.42), {
      open: 'flap', paper: { color: '#1c2a6a', rough: 0.25, metal: 0.3 },
      front: (P) => {
        fullBg(P, '#1c2a6a'); sheen(P, ['rgba(255,255,255,0.1)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.2)']);
        tx(P, 'PURE', 0.18, 0.06, '#d8a640', 'helv', { weight: 500, track: 0.15, maxW: 0.6 });
        const g = P.g, gr = g.createLinearGradient(0, 0.3 * P.H, P.W, 0.65 * P.H); gr.addColorStop(0, '#c88a2c'); gr.addColorStop(0.5, '#f0c060'); gr.addColorStop(1, '#b8742a');
        tx(P, 'XS', 0.48, 0.25, gr, 'serif', { weight: 800, italic: true, maxW: 0.8 });
        paco(P, 0.83, 0.026, '#e89a3a'); tx(P, 'EAU DE TOILETTE', 0.87, 0.009, '#f0d8a0', 'helv', { track: 0.12 }); tx(P, 'NATURAL SPRAY', 0.89, 0.007, '#f0d8a0', 'helv', { track: 0.12 }); tx(P, '100 ml ℮ 3.4 FL OZ', 0.94, 0.009, '#f0d8a0', 'helv');
      },
      top: topWord('#1c2a6a', 'paco rabanne', '#d8a640', 'helv', { cap: 0.1, weight: 800, track: 0 }),
    }),
    'rabanne|Black XS': (item, fit) => Object.assign(prop(fit, 0.68, 0.42), {
      open: 'flap', paper: { color: '#0e0e0e', rough: 0.95 },
      front: (P) => {
        fullBg(P, '#0e0e0e'); stipple(P, 'rgba(255,255,255,0.025)', 2000);
        tx(P, 'Black', 0.16, 0.05, '#c8c8c8', 'roman', { weight: 800, italic: true, track: 0.04 });
        const g = P.g, gr = g.createLinearGradient(0.2 * P.W, 0, 0.8 * P.W, 0); ['#8a8a8a', '#e8e8e8', '#9a9a9a', '#d8d8d8', '#8a8a8a'].forEach((c, i) => gr.addColorStop(i / 4, c));
        tx(P, 'XS', 0.4, 0.22, gr, 'serif', { weight: 800, maxW: 0.7 });
        paco(P, 0.84, 0.026, '#f2f2f2'); tx(P, 'EAU DE TOILETTE', 0.87, 0.009, '#f2f2f2', 'helv', { track: 0.12 }); tx(P, 'NATURAL SPRAY', 0.89, 0.007, '#f2f2f2', 'helv', { track: 0.12 }); tx(P, '100 ml ℮ 3.4 FL OZ', 0.94, 0.009, '#f2f2f2', 'helv');
      },
      top: topWord('#0e0e0e', 'paco rabanne', '#f2f2f2', 'helv', { cap: 0.1, weight: 800, track: 0 }),
    }),

    /* Jean Paul Gaultier: the Le Male / Le Beau tins, cartons for the rest */
    jpg: tin({ metal: '#a9acb0', rim: 'silver', draw: (P) => jpgLogo(P, 0.29, 'rgba(255,255,255,0.32)', '"LE MALE"', { shadow: 'rgba(0,0,0,0.6)' }) }),
    'jpg|Le Male': tin({ metal: '#a9acb0', rim: 'silver', mid: [0.48, 0.6, 6], draw: (P) => jpgLogo(P, 0.29, 'rgba(255,255,255,0.32)', '"LE MALE"', { shadow: 'rgba(0,0,0,0.6)' }) }),
    'jpg|Le Male Elixir': tin({ metal: '#c9a24a', rim: 'gold', ribDark: 'rgba(42,28,10,0.95)', ribLight: 'rgba(255,240,180,0.4)', mid: [0.04, 0.3, 11], draw: (P) => {
      ribs(P, 0.7, 0.96, 11, 'rgba(42,28,10,0.95)', 'rgba(255,240,180,0.4)'); P.rect(0.22, 0.36, 0.56, 0.3, '#e7d6a5'); P.frame(0.23, 0.367, 0.54, 0.286, '#2a2010', 0.003);
      jpgLogo(P, 0.41, '#2a2010', '"LE MALE"'); tx(P, 'ELIXIR', 0.575, 0.016, '#2a2010', 'helv', { weight: 700, track: 0.15 });
    } }),
    'jpg|Le Male Le Parfum': tin({ metal: '#3a3d42', m: 0.6, rim: 'gold', mid: [0.54, 0.62, 5], draw: (P) => { jpgLogo(P, 0.33, '#c9a35a', '"LE MALE"'); tx(P, 'LE PARFUM', 0.5, 0.01, '#c9a35a', 'helv', { weight: 600, track: 0.3 }); tx(P, '℮125 ml – 4.2 FL OZ', 0.975, 0.008, '#c9a35a', 'helv'); } }),
    'jpg|Ultra Male': tin({ metal: '#141c33', m: 0.55, rough: 0.25, rim: { color: '#111111', metal: 0.8, rough: 0.3 }, mid: [0.62, 0.7, 4], draw: (P) => {
      jpgLogo(P, 0.27, 'rgba(255,255,255,0.14)', '', { shadow: 'rgba(0,0,0,0.8)' });
      ctext(P, 'ULTRA', 0.45, 0.022, '#d01f26', 'roman', 0.8, { weight: 800, track: 0.05, x: 0.47 }); ctext(P, 'MALE', 0.525, 0.07, '#d01f26', 'roman', 0.75, { weight: 800, x: 0.47, maxW: 0.42 });
      const a = ax(P), x = 0.66; P.line(x, 0.43, x, 0.56, '#d01f26', 0.006); P.line(x - 0.02 * a, 0.45, x + 0.02 * a, 0.45, '#d01f26', 0.005); curve(P, [x - 0.04 * a, 0.53, x - 0.03 * a, 0.57, x + 0.03 * a, 0.57, x + 0.04 * a, 0.53], '#d01f26', 0.005);
      for (let i = 0; i < 6; i++) P.circle(x + 0.05 * a, 0.44 + i * 0.022, 0.008, '#d01f26', 0.003);
    } }),
    'jpg|Le Beau': tin({ metal: '#1f4b4d', m: 0.5, rough: 0.35, rim: 'gold', mid: [0.52, 0.58, 3], draw: (P) => {
      jpgLogo(P, 0.31, '#c9a35a', '"LE BEAU"'); tx(P, 'EAU DE TOILETTE', 0.64, 0.012, '#e8dcc0', 'helv', { weight: 500, track: 0.12 });
      ['VAPORISATEUR', 'NATURAL SPRAY', '℮125 ml – 4.2 FL OZ'].forEach((s, i) => tx(P, s, 0.67 + i * 0.018, 0.008, '#e8dcc0', 'helv', { track: 0.12 }));
    } }),
    'jpg|Le Beau Le Parfum': tin({ metal: '#5f8a77', m: 0.45, rough: 0.35, rim: 'gold', mid: [0.66, 0.72, 3], draw: (P) => {
      jpgLogo(P, 0.31, '#c9a35a', '"LE BEAU"'); const a = ax(P);
      P.ellipse(0.5, 0.55, 0.035 * a, 0.045, 0, '#c9a35a'); P.ellipse(0.46, 0.535, 0.03 * a, 0.03, -0.6, '#c9a35a'); P.ellipse(0.54, 0.535, 0.03 * a, 0.03, 0.6, '#c9a35a');
      P.path([[0.36, 0.565], [0.64, 0.565], [0.62, 0.59], [0.64, 0.615], [0.36, 0.615], [0.38, 0.59]], '#b8202a'); tx(P, 'LE PARFUM', 0.59, 0.011, '#f0dca0', 'helv', { weight: 600, track: 0.15, maxW: 0.24 });
    } }),
    'jpg|Scandal pour Homme': (item, fit) => Object.assign(prop(fit, 0.75, 0.45), {
      open: 'flap', paper: { color: '#15161c', rough: 0.55 },
      front: (P) => {
        fullBg(P, '#15161c'); jpgLogo(P, 0.26, '#c9a35a');
        P.rect(0.22, 0.41, 0.56, 0.09, '#d8a840'); P.frame(0.235, 0.42, 0.53, 0.07, '#5a3a10', 0.004);
        ctext(P, 'SCANDAL', 0.455, 0.04, '#2a1a08', 'roman', 0.75, { weight: 800, track: 0.04, maxW: 0.5 });
        tx(P, 'POUR HOMME', 0.56, 0.016, '#c9a35a', 'helv', { weight: 600, track: 0.3 }); tx(P, 'EAU DE TOILETTE', 0.86, 0.01, '#c9a35a', 'helv', { track: 0.15 });
        corners(P, '℮100 ml', '3.4 FL OZ', 0.94, 0.009, '#c9a35a');
      },
      top: topWord('#15161c', 'GAULTIER', '#c9a35a', 'roman', { cap: 0.12, weight: 800 }),
    }),
    'jpg|Kokorico': (item, fit) => Object.assign(prop(fit, 0.5, 0.36), {
      open: 'flap', paper: { color: '#121212', rough: 0.7 },
      front: (P) => {
        fullBg(P, '#121212'); const g = P.g, gr = g.createLinearGradient(0, 0.4 * P.H, P.W, 0.5 * P.H); gr.addColorStop(0, '#8a5228'); gr.addColorStop(0.5, '#d89a62'); gr.addColorStop(1, '#8a5228');
        ctext(P, 'KOKORICO', 0.45, 0.045, gr, 'roman', 0.75, { weight: 700, track: 0.06, maxW: 0.8 }); jpgLogo(P, 0.14, '#b07a48');
        tx(P, 'EAU DE TOILETTE', 0.86, 0.01, '#b07a48', 'helv', { track: 0.15 }); corners(P, '℮100 ml', '3.4 FL OZ', 0.94, 0.009, '#b07a48');
      },
      top: topWord('#121212', 'KOKORICO', '#b07a48', 'roman', { cap: 0.12 }),
    }),

    /* Valentino */
    valentino: born({ paper: '#121212', ink: '#e8708a' }),
    'valentino|Uomo Born in Roma': born({ paper: '#121212', ink: '#e8708a' }),
    'valentino|Uomo Born in Roma Intense': born({ paper: '#121212', ink: '#f0a0a0', bornInk: '#f2f2f2', squares: '#f2a39a', sub: 'INTENSE', conc: 'EAU DE PARFUM INTENSE' }),
    'valentino|Uomo Born in Roma Coral Fantasy': born({ paper: '#121212', ink: '#ef5450', by: 0.74, sub: 'CORAL FANTASY' }),
    'valentino|Uomo Born in Roma Yellow Dream': born({ paper: '#121212', ink: '#d6ec2a', sub: 'YELLOW DREAM' }),
    'valentino|Donna Born in Roma': born({ paper: '#de4a80', hi: 'rgba(255,255,255,0.12)', lo: 'rgba(120,20,60,0.16)', ink: '#f18bb0', bornInk: '#111111', who: 'DONNA', by: 0.8, conc: 'EAU DE PARFUM', small: '#3a1a28' }),
    'valentino|Uomo': uomo('#9a8068', '#c9a35a', '#c9a35a', '#111111'),
    'valentino|Uomo Acqua': uomo('#c9d6d8', '#c8ccd0', '#d6dade', '#2a3a40', 'ACQUA'),
    'valentino|Uomo Intense': born({ paper: '#5a5d61', hi: 'rgba(255,255,255,0.06)', lo: 'rgba(0,0,0,0.2)', panel: '#121520', ink: '#262c3a', bornInk: 'rgba(0,0,0,0)', sub: '', conc: 'EAU DE PARFUM', small: '#d8d8d8' }),

    /* Ralph Lauren */
    polo: polo({ paper: '#24404a', ink: '#c9a24a', frame: '#c9a24a', heritage: true, py: 0.28, ps: 0.16, oz: '4 FL.OZ.', ml: '118 ml', conc: 'EAU DE TOILETTE NATURAL SPRAY' }),
    'polo|Polo': polo({ paper: '#24404a', ink: '#c9a24a', frame: '#c9a24a', heritage: true, py: 0.28, ps: 0.16, oz: '4 FL.OZ.', ml: '118 ml', conc: 'EAU DE TOILETTE NATURAL SPRAY' }),
    'polo|Polo Blue': polo({ paper: '#141a48', ink: '#d0d3d8', frame: '#d0d3d8', sub: 'BLUE', small: '#f0f0f0' }),
    'polo|Polo Blue Parfum': polo({ paper: '#18204a', ink: '#c0c4ca', frame: '#9a9ea6', sub: 'BLUE', tag: '#c0c4ca', conc: '', small: '#e0e0e0' }),
    'polo|Polo Red': polo({ paper: '#c92a2a', gloss: true, ink: '#3a0f10', sub: 'RED', conc: 'EAU DE TOILETTE' }),
    'polo|Polo Red Extreme': polo({ paper: '#121212', ink: '#d42a2a', frame: '#d42a2a', sub: 'RED EXTREME', conc: 'PARFUM' }),
    'polo|Polo Black': polo({ paper: '#0e0e0e', ink: '#9a9ea3', frame: '#9a9ea3', sub: 'BLACK' }),
    'polo|Polo Double Black': polo({ paper: '#0e0e0e', ink: '#3a3a3c', frame: '#4a4a4c', sub: 'DOUBLE BLACK', small: '#6a6a6c' }),
    'polo|Polo Supreme Oud': polo({ paper: '#1c1410', ink: '#c9a24a', frame: '#c9a24a', sub: 'SUPREME OUD', conc: 'EAU DE PARFUM' }),
    'polo|Polo Ultra Blue': polo({ paper: '#2f64b8', ink: '#e0e3e8', frame: '#e0e3e8', sub: 'ULTRA BLUE' }),
    'polo|Polo 67': (item, fit) => Object.assign(prop(fit, 0.62, 0.38), {
      open: 'flap', paper: { color: '#1a1d3a', rough: 0.7 },
      front: (P) => {
        fullBg(P, '#1a1d3a'); P.frame(0.06, 0.045, 0.88, 0.91, '#c0c4cc', 0.003);
        const g = P.g; g.save(); g.translate(0.46 * P.W, 0.27 * P.H); g.rotate(-0.12); g.translate(-0.46 * P.W, -0.27 * P.H); tx(P, 'Polo', 0.27, 0.08, '#f2f2f2', 'serif', { x: 0.46, weight: 800, italic: true }); g.restore();
        curve(P, [0.24, 0.33, 0.4, 0.31, 0.55, 0.3, 0.72, 0.25], '#f2f2f2', 0.005);
        tx(P, 'EST.', 0.29, 0.008, '#f2f2f2', 'helv', { x: 0.72 }); tx(P, '67', 0.32, 0.02, '#f2f2f2', 'helv', { x: 0.72, weight: 700 });
        rlWord(P, 0.62, 0.014, '#9a9ea8'); tx(P, 'EAU DE PARFUM', 0.87, 0.01, '#c0c4cc', 'helv', { track: 0.12 }); tx(P, 'SPRAY/VAPORISATEUR', 0.89, 0.007, '#c0c4cc', 'helv', { track: 0.12 });
        corners(P, '4.2 FL.OZ.', '125 ml', 0.93, 0.009, '#c0c4cc', 'helv', 0.09);
      },
      top: topWord('#1a1d3a', 'RALPH LAUREN', '#c0c4cc', 'serif', { cap: 0.08 }),
    }),
    'polo|Polo Sport': (item, fit) => Object.assign(prop(fit, 0.55, 0.38), {
      open: 'flap', paper: { color: '#f4f4f4', rough: 0.5 },
      front: (P) => {
        fullBg(P, '#f4f4f4'); const a = ax(P);
        P.rect(0.1, 0.06, 0.16, 0.16 * 0.6 / a, '#1c2a5c'); for (let i = 0; i < 5; i++) P.rect(0.1, 0.06 + 0.16 * 0.6 / a + i * 0.012, 0.16, 0.006, i % 2 ? '#f4f4f4' : '#c8202a'); tx(P, 'RL', 0.06 + 0.048 / a, 0.016, '#f4f4f4', 'serif', { x: 0.18, weight: 700 });
        ctext(P, 'POLO', 0.42, 0.11, '#1c2a5c', 'helv', 0.6, { weight: 900, maxW: 0.8 }); ctext(P, 'SPORT', 0.58, 0.07, '#1c2a5c', 'helv', 0.6, { weight: 900, track: 0.05, maxW: 0.8 });
        rlWord(P, 0.68, 0.014, '#1c2a5c'); tx(P, 'EAU DE TOILETTE', 0.86, 0.01, '#1c2a5c', 'helv', { track: 0.12 }); corners(P, '4.2 FL.OZ.', '125 ml', 0.93, 0.009, '#1c2a5c');
      },
      top: topWord('#f4f4f4', 'POLO SPORT', '#1c2a5c', 'helv', { cap: 0.1, weight: 900 }),
    }),
    "polo|Ralph's Club": club({ paper: '#111111', twill: 'rgba(255,255,255,0.04)', ink: '#f2f2f2', conc: 'EAU DE PARFUM', draw: (P) => { tx(P, "RALPH'S CLUB", 0.18, 0.022, '#f2f2f2', 'sans', { weight: 400, track: 0.25, maxW: 0.8 }); diamondR(P, 0.5, 0.365, 0.17, '#f2f2f2'); } }),
    "polo|Ralph's Club Parfum": club({ paper: '#9a3420', ink: '#f0e4d0', conc: 'PARFUM', ry: 0.82, draw: (P) => { diamondR(P, 0.5, 0.35, 0.42, '#111111', '#d0a050', 0.22, -0.15); tx(P, "RALPH'S CLUB", 0.5, 0.02, '#f0e4d0', 'sans', { weight: 500, track: 0.12, maxW: 0.7 }); tx(P, 'NEW YORK', 0.54, 0.02, '#f0e4d0', 'sans', { weight: 500, track: 0.12 }); } }),
    'polo|Safari for Men': (item, fit) => Object.assign(prop(fit, 0.6, 0.38), {
      open: 'flap', paper: { color: '#eee4cf', rough: 0.8 },
      front: (P) => {
        fullBg(P, '#eee4cf'); P.frame(0.05, 0.035, 0.9, 0.93, '#3a2414', 0.012); P.frame(0.08, 0.055, 0.84, 0.89, '#3a2414', 0.002);
        const a = ax(P); P.path([[0.5 - 0.06 * a, 0.18], [0.5 + 0.06 * a, 0.18], [0.5 + 0.055 * a, 0.25], [0.5, 0.29], [0.5 - 0.055 * a, 0.25]], '#a8acb0');
        P.ellipse(0.5 - 0.1 * a, 0.23, 0.03 * a, 0.055, 0.3, '#a8acb0'); P.ellipse(0.5 + 0.1 * a, 0.23, 0.03 * a, 0.055, -0.3, '#a8acb0'); crown(P, 0.5, 0.16, 0.08, '#a8acb0');
        tx(P, 'SAFARI', 0.42, 0.045, '#3a2414', 'serif', { weight: 600, track: 0.12 }); rlWord(P, 0.48, 0.014, '#3a2414'); tx(P, 'FOR MEN', 0.51, 0.011, '#3a2414', 'serif', { track: 0.25 });
        tx(P, 'EAU DE TOILETTE', 0.86, 0.01, '#3a2414', 'helv', { track: 0.12 }); corners(P, '4.2 FL.OZ.', '125 ml', 0.92, 0.009, '#3a2414', 'helv', 0.12);
      },
      top: topWord('#eee4cf', 'RALPH LAUREN', '#3a2414', 'serif', { cap: 0.08 }),
    }),

    /* Givenchy */
    givenchy: gent({ paper: '#0d0d0d', gloss: true, g4: '#2a2a2a', draw: (P) => { gtx(P, 'GENTLEMAN', 0.2, 0.03, '#d8d8d8', 0.15); gtx(P, 'GIVENCHY', 0.24, 0.014, '#d8d8d8', 0.35); } }),
    'givenchy|Gentleman Réserve Privée': gent({ paper: '#0d0d0d', gloss: true, band: '#1a1a1a', bandH: 0.38, g4: '#262626', draw: (P) => {
      gtx(P, 'GENTLEMAN', 0.18, 0.034, '#c98a3c', 0.15); gtx(P, 'GIVENCHY', 0.22, 0.014, '#c98a3c', 0.35); gtx(P, 'RÉSERVE PRIVÉE', 0.33, 0.013, '#c98a3c', 0.15); gtx(P, 'EAU DE PARFUM', 0.355, 0.009, '#c98a3c', 0.15);
    } }),
    'givenchy|Gentleman Eau de Parfum': gent({ paper: '#0e0e0e', gloss: true, draw: (P) => {
      vtext(P, 'GENTLEMAN', 0.21, 0.6, 0.075, '#f2f2f2', 'sans', { weight: 600, track: 0.08 }, 0.5); vtext(P, 'GIVENCHY', 0.31, 0.6, 0.035, '#f2f2f2', 'sans', { weight: 500, track: 0.3 }, 0.3);
      vtext(P, 'EAU DE PARFUM', 0.9, 0.6, 0.012, '#d8d8d8', 'sans', { track: 0.2 }, 0.25);
    } }),
    'givenchy|Gentleman Society': gent({ paper: '#f2f2f2', metal: 0.35, ink: '#c8c8c8', draw: (P) => {
      sheen(P, ['rgba(255,255,255,0.4)', 'rgba(200,205,210,0.25)', 'rgba(255,255,255,0.3)']); g4(P, 0.5, 0.31, 0.46, 'rgba(160,165,170,0.35)', 0.11);
      P.frame(0.015, 0.012, 0.97, 0.976, '#111', 0.004);
      gtx(P, 'GENTLEMAN', 0.33, 0.028, '#111', 0.12); gtx(P, 'SOCIETY', 0.37, 0.014, '#111', 0.3); gtx(P, 'EAU DE PARFUM', 0.6, 0.008, '#111', 0.2); gtx(P, 'GIVENCHY', 0.88, 0.014, '#111', 0.3);
    } }),
    'givenchy|Gentleman Boisée': gent({ paper: '#121212', band: '#181818', bandH: 0.4, edge: '#262626', g4: '#2e2e2e', draw: (P) => {
      gtx(P, 'GENTLEMAN', 0.26, 0.034, '#d8c49a', 0.15); gtx(P, 'GIVENCHY', 0.3, 0.014, '#d8c49a', 0.35); gtx(P, 'EAU DE PARFUM', 0.47, 0.009, '#d8c49a', 0.15); gtx(P, 'BOISÉE', 0.49, 0.008, '#d8c49a', 0.2);
    } }),
    'givenchy|Pi': gent({ paper: '#f6f6f4', g4: '#b8b8b8', ink: '#c9a04a', draw: (P) => {
      tx(P, 'π', 0.24, 0.2, '#c9a04a', 'roman', { weight: 800, maxW: 0.45, shadow: '#c9a04a' });
      gtx(P, 'GIVENCHY', 0.45, 0.018, '#111', 0.3); gtx(P, 'EAU DE TOILETTE', 0.9, 0.008, '#111', 0.15); corners(P, '100 ML', '3.3 FL.OZ.', 0.96, 0.008, '#a8a8a8');
    } }),
    'givenchy|Insensé': gent({ paper: '#22228a', gloss: true, g4: '#d8a040', ink: '#e8a020', draw: (P) => {
      P.rect(0, 0, 0.05, 1, '#e8a020'); P.rect(0, 0, 1, 0.03, '#e8a020');
      tx(P, 'INSENSÉ', 0.2, 0.04, '#f08a1a', 'helv', { weight: 800, track: 0.04 }); tx(P, 'ULTRAMARINE', 0.25, 0.018, '#f08a1a', 'helv', { weight: 700, track: 0.04 });
      gtx(P, 'GIVENCHY', 0.83, 0.011, '#d8a040', 0.3); tx(P, 'EAU DE TOILETTE', 0.76, 0.009, '#f2f2f2', 'helv', { track: 0.12 }); tx(P, 'VAPORISATEUR - SPRAY', 0.78, 0.007, '#f2f2f2', 'helv', { track: 0.12 });
      corners(P, '100 ml', '3.3 FL.OZ', 0.94, 0.01, '#f2f2f2');
    } }),

    /* Dolce & Gabbana */
    dg: dg({ paper: '#3a3634', metal: 0.6, sheen: ['rgba(255,255,255,0.18)', 'rgba(0,0,0,0)', 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.25)'], draw: (P) => { dgWord(P, 0.62, 0.032, '#f0f0f0'); } }),
    'dg|The One for Men': dg({ paper: '#3a3634', metal: 0.6, sheen: ['rgba(255,255,255,0.18)', 'rgba(0,0,0,0)', 'rgba(255,255,255,0.08)', 'rgba(0,0,0,0.25)'], draw: (P) => {
      dgWord(P, 0.62, 0.045, '#f0f0f0'); tx(P, 'the one', 0.665, 0.02, '#f0f0f0', 'helv', { x: 0.88, align: 'right', weight: 300 });
      ['POUR HOMME', 'EAU DE TOILETTE', 'MADE IN ITALY'].forEach((s, i) => tx(P, s, 0.76 + i * 0.03, 0.008, '#e0e0e0', 'helv', { track: 0.25 }));
      tx(P, '100ml ℮ 3.3 FL.OZ.', 0.92, 0.009, '#e0e0e0', 'helv');
    } }),
    'dg|The One for Men Eau de Parfum': dg({ rw: 0.7, paper: '#1a1a1a', sheen: ['rgba(255,255,255,0.08)', 'rgba(0,0,0,0)'], ink: '#b8b8b8', draw: (P) => {
      dgWord(P, 0.7, 0.04, '#b8b8b8', 0.75); tx(P, 'the one', 0.74, 0.018, '#b8b8b8', 'helv', { x: 0.86, align: 'right', weight: 300 });
      tx(P, 'EAU DE PARFUM FOR MEN', 0.8, 0.008, '#a0a0a0', 'helv', { track: 0.2 }); tx(P, 'NATURAL SPRAY VAPORISATEUR', 0.83, 0.007, '#a0a0a0', 'helv', { track: 0.2 });
    } }),
    'dg|Light Blue pour Homme': dg({ rw: 0.7, paper: '#4e6078', seal: true, draw: (P) => {
      stone(P, 'rgba(143,160,180,0.1)', 'rgba(60,78,100,0.14)'); dgWord(P, 0.18, 0.04, '#e8ecf0', 0.75);
      tx(P, 'light blue', 0.25, 0.03, '#eef2f6', 'serif', { italic: true, weight: 400 });
      tx(P, 'POUR HOMME', 0.66, 0.011, '#eef2f6', 'helv', { track: 0.3 }); tx(P, 'EAU DE TOILETTE · NATURAL SPRAY VAPORISATEUR', 0.69, 0.007, '#eef2f6', 'helv', { track: 0.12 });
      tx(P, '125ml ℮ 4.2 FL.OZ.', 0.78, 0.009, '#eef2f6', 'helv');
    } }),
    'dg|Light Blue Eau Intense pour Homme': dg({ rw: 0.7, paper: '#2f5d93', seal: true, draw: (P) => {
      stone(P, 'rgba(110,150,200,0.18)', 'rgba(30,60,110,0.2)'); dgWord(P, 0.18, 0.04, '#e8ecf0', 0.75);
      tx(P, 'light blue', 0.25, 0.03, '#eef2f6', 'serif', { italic: true, weight: 400 });
      tx(P, 'POUR HOMME', 0.66, 0.011, '#eef2f6', 'helv', { track: 0.3 }); tx(P, 'EAU INTENSE', 0.69, 0.011, '#eef2f6', 'helv', { track: 0.3 });
      tx(P, '100ml ℮ 3.3 FL.OZ.', 0.78, 0.009, '#eef2f6', 'helv');
    } }),
    'dg|K by Dolce & Gabbana': dg({ rw: 0.6, paper: '#1a2a55', sheen: ['rgba(255,255,255,0.1)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.2)'], ink: '#d0a856', draw: (P) => {
      P.frame(0.01, 0.007, 0.98, 0.986, '#d0a856', 0.003); crown(P, 0.5, 0.35, 0.36, '#d0a856'); dgWord(P, 0.45, 0.036, '#d0a856', 0.75);
      ['POUR HOMME', 'EAU DE TOILETTE', 'MADE IN ITALY'].forEach((s, i) => tx(P, s, 0.88 + i * 0.022, 0.007, '#d0a856', 'helv', { track: 0.2 }));
    } }),
    'dg|Pour Homme (1994)': dg({ rw: 0.65, paper: '#141a3a', ink: '#f0f0f0', draw: (P) => {
      stipple(P, 'rgba(255,255,255,0.02)', 1500); dgWord(P, 0.16, 0.045, '#f2f2f2', 0.85); tx(P, 'POUR HOMME', 0.2, 0.011, '#f2f2f2', 'helv', { track: 0.35 });
      tx(P, 'EAU DE TOILETTE', 0.86, 0.01, '#f2f2f2', 'helv', { track: 0.2 }); tx(P, '125 ml ℮ 4.2 FL.OZ', 0.89, 0.009, '#f2f2f2', 'helv', { track: 0.08 });
    } }),

    /* Hugo Boss */
    boss: bottled({ paper: '#b8bcc0', metal: 0.6, sheen: ['#c8cbce', '#a8acb0', '#7e8286'], flask: '#eef0f2', conc: 'EAU DE TOILETTE' }),
    'boss|Boss Bottled': bottled({ paper: '#b8bcc0', metal: 0.6, sheen: ['#c8cbce', '#a8acb0', '#7e8286'], flask: '#eef0f2', conc: 'EAU DE TOILETTE' }),
    'boss|Boss Bottled Elixir': bottled({ paper: '#0e0e0e', flask: '#9c7840', conc: 'ELIXIR', foot: '#8a7a5a' }),
    'boss|Boss The Scent': (item, fit) => Object.assign(prop(fit, 0.62, 0.38), {
      open: 'flap', paper: { color: '#111111', rough: 0.7 },
      front: (P) => {
        fullBg(P, '#111111'); vtext(P, 'BOSS', 0.4, 0.34, 0.075, '#c08a5a', 'serif', { weight: 600, track: 0.02 }, 0.32); vtext(P, 'HUGO BOSS', 0.53, 0.34, 0.02, '#c08a5a', 'sans', { weight: 400, track: 0.3 }, 0.3);
        tx(P, 'THE SCENT', 0.65, 0.02, '#c08a5a', 'sans', { weight: 400, track: 0.1 }); tx(P, 'EAU DE TOILETTE · 100 ml ℮ 3.3 FL.OZ.', 0.95, 0.007, '#8a6a4a', 'helv', { track: 0.1 });
      },
      top: (P) => { fullBg(P, '#111'); tx(P, 'BOSS', 0.5, 0.16, '#c08a5a', 'serif', { weight: 600 }); },
    }),
    'boss|Hugo Man': (item, fit) => Object.assign(prop(fit, 0.62, 0.38), {
      open: 'flap', paper: { color: '#42513e', rough: 0.75 },
      front: (P) => {
        fullBg(P, '#42513e'); const a = ax(P);
        P.rect(0.12, 0.18, 0.76, 0.37, '#3a4838', 0.04); P.rect(0.4, 0.06, 0.2, 0.13, '#3a4838'); P.circle(0.7, 0.13, 0.05, '#3a4838', 0.015);
        P.rect(0, 0.55, 1, 0.17, '#d7262e'); ctext(P, 'HUGO', 0.635, 0.1, '#111111', 'helv', 0.8, { x: 0.42, weight: 900, maxW: 1.3 });
        tx(P, 'MAN', 0.77, 0.016, '#f2f2f2', 'helv', { weight: 600, track: 0.15 }); tx(P, 'EAU DE TOILETTE', 0.89, 0.008, '#e8e8e8', 'helv', { track: 0.12 }); tx(P, 'VAPORISATEUR · NATURAL SPRAY', 0.905, 0.006, '#e8e8e8', 'helv', { track: 0.12 });
        tx(P, '125 ml ℮ 4.2 FL.OZ.', 0.94, 0.008, '#e8e8e8', 'helv');
      },
      top: (P) => { fullBg(P, '#4a5a46'); P.rect(0, 0.3, 1, 0.4, '#d7262e'); tx(P, 'HUGO', 0.5, 0.2, '#111', 'helv', { weight: 900 }); },
    }),

    /* Gucci */
    gucci: guilty({ paper: '#2e3033', metal: 0.4, ink: '#c0c4c8', lines: [['EAU DE TOILETTE', 0.8, 0.011], ['POUR HOMME', 0.83, 0.011], ['VAPORISATEUR / NATURAL SPRAY', 0.87, 0.007]] }),
    'gucci|Guilty pour Homme': guilty({ paper: '#2e3033', metal: 0.4, ink: '#c0c4c8', lines: [['EAU DE TOILETTE', 0.8, 0.011], ['POUR HOMME', 0.83, 0.011], ['VAPORISATEUR / NATURAL SPRAY', 0.87, 0.007]] }),
    'gucci|Guilty Absolu pour Homme': guilty({ paper: '#4e3e2a', ink: '#1a1410', tex: (P) => { stipple(P, 'rgba(0,0,0,0.08)', 2500); waves(P, 'rgba(255,255,255,0.03)', 50); }, lines: [['ABSOLU', 0.84, 0.01], ['POUR HOMME', 0.865, 0.01]] }),
    'gucci|Guilty Elixir pour Homme': guilty({ rw: 0.75, paper: '#76861e', ink: '#c8ccd0', gy: 0.27, gr: 0.08, uy: 0.45, uc: 0.04, ml: '℮60 ml', oz: '2.0 FL.OZ.', tex: (P) => { stone(P, 'rgba(110,126,30,0.3)', 'rgba(160,176,60,0.25)', 140); sheen(P, ['rgba(255,255,255,0.1)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.1)']); }, lines: [['ELIXIR DE PARFUM', 0.65, 0.014], ['POUR HOMME', 0.8, 0.011, '#f2f2f2'], ['PARFUM VAPORISATEUR / NATURAL SPRAY', 0.84, 0.007]] }),
    'gucci|Gucci pour Homme (2003)': (item, fit) => Object.assign(prop(fit, 0.55, 0.36), {
      open: 'flap', paper: { color: '#121212', rough: 0.7 },
      front: (P) => {
        fullBg(P, '#121212'); P.rect(0, 0.36, 1, 0.3, '#a8acb0'); brushed(P, 'rgba(255,255,255,0.08)');
        gWord(P, 'GUCCI', 0.48, 0.04, '#121212', 0.3); tx(P, 'POUR HOMME', 0.55, 0.012, '#121212', 'roman', { weight: 500, track: 0.3 });
        tx(P, 'EAU DE TOILETTE', 0.86, 0.009, '#a8acb0', 'helv', { track: 0.15 }); corners(P, '℮100 ml', '3.3 FL.OZ.', 0.94, 0.009, '#a8acb0');
      },
      top: topWord('#121212', 'GUCCI', '#a8acb0', 'roman', { cap: 0.12, track: 0.3 }),
    }),
    'gucci|Rush for Men': (item, fit) => Object.assign(prop(fit, 0.7, 0.35), {
      open: 'flap', paper: { color: '#a8b0a8', rough: 0.3, metal: 0.25 },
      front: (P) => {
        fullBg(P, '#a8b0a8'); sheen(P, ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.25)', 'rgba(0,0,0,0.1)']);
        gWord(P, 'GUCCI', 0.4, 0.035, '#3a3e3a', 0.3); tx(P, 'rush', 0.47, 0.04, '#3a3e3a', 'helv', { weight: 300, track: 0.05 }); tx(P, 'for men', 0.53, 0.014, '#3a3e3a', 'helv', { weight: 400, track: 0.2 });
        tx(P, 'EAU DE TOILETTE', 0.86, 0.009, '#3a3e3a', 'helv', { track: 0.15 }); corners(P, '℮75 ml', '2.5 FL.OZ.', 0.94, 0.009, '#3a3e3a');
      },
      top: topWord('#a8b0a8', 'GUCCI', '#3a3e3a', 'roman', { cap: 0.12, track: 0.3 }),
    }),
  });
  BoxCraft.add({ "prada|L'Homme Prada": BoxCraft.specs.prada });
})();
