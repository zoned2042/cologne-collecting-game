/* Sillage — retail boxes for the maisons: Frédéric Malle, Serge Lutens, Memo Paris, Mancera,
 * Montale, Acqua di Parma, Penhaligon's, Ex Nihilo, Tiziana Terenzi, BDK Parfums, Bond No. 9,
 * Maison Crivelli and DKNY. Positions follow the notes taken from photos of the real boxes:
 * y from the top of the face, cap heights as a fraction of H.
 */
(() => {
  const { prop, tx, rnd, stipple, brushed, pinstripe, waves, fullBg, seal } = BoxCraft.lib;

  /* ---------- shared drawing helpers ---------- */
  const ax = (P) => P.H / P.W; // converts a height-unit length to width units
  const L = (x, o = {}) => Object.assign({ x, align: 'left' }, o);
  const R = (x, o = {}) => Object.assign({ x, align: 'right' }, o);
  // Text squeezed horizontally (condensed display caps).
  function ctx(P, s, y, cap, col, font, o = {}, sx = 0.62) {
    const g = P.g, x = o.x != null ? o.x : 0.5; g.save(); g.translate(x * P.W, 0); g.scale(sx, 1); g.translate(-x * P.W, 0);
    tx(P, s, y, cap, col, font, Object.assign({}, o, { x, maxW: (o.maxW || 0.9) / sx })); g.restore();
  }
  // Typewriter caps (IBM Plex Mono is loaded by the page).
  function mono(P, s, y, cap, col, o = {}) {
    const g = P.g, px = cap / 0.7 * P.H; g.save(); g.font = `${o.weight || 500} ${px}px "IBM Plex Mono", "Courier New", monospace`;
    g.fillStyle = col; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(s, (o.x != null ? o.x : 0.5) * P.W, y * P.H); g.restore();
  }
  // Characters set along a circle (centre x, y; radius r in H units); top = reads over the top, else under the bottom.
  function arcText(P, s, x, y, r, cap, col, font = 'helv', top = true, spread = 0.11, o = {}) {
    const g = P.g, ch = [...s], n = ch.length;
    ch.forEach((c, i) => {
      const a = (i - (n - 1) / 2) * spread * (top ? 1 : -1);
      g.save(); g.translate(x * P.W, y * P.H); g.rotate(a); g.translate(0, (top ? -r : r) * P.H);
      g.translate(-x * P.W, -y * P.H); tx(P, c, y, cap, col, font, Object.assign({ x, weight: 700 }, o)); g.restore();
    });
  }
  const diamond = (P, x, y, hw, hh, col, lw) => P.path([[x, y - hh], [x + hw, y], [x, y + hh], [x - hw, y]], col, !lw, lw);
  const clip = (P, x, y, w, h, fn) => { const g = P.g; g.save(); g.beginPath(); g.rect(x * P.W, y * P.H, w * P.W, h * P.H); g.clip(); fn(); g.restore(); };
  function grad(P, x0, y0, x1, y1, stops, rect = [0, 0, 1, 1]) {
    const g = P.g, gr = g.createLinearGradient(x0 * P.W, y0 * P.H, x1 * P.W, y1 * P.H);
    stops.forEach(([t, c]) => gr.addColorStop(t, c)); g.fillStyle = gr; g.fillRect(rect[0] * P.W, rect[1] * P.H, rect[2] * P.W, rect[3] * P.H);
  }
  function curve(P, pts, col, lw) { // smooth quadratic stroke through midpoints
    const g = P.g; g.save(); g.strokeStyle = col; g.lineWidth = lw * P.H; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0][0] * P.W, pts[0][1] * P.H);
    for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0] * P.W, pts[i][1] * P.H, (pts[i][0] + pts[i + 1][0]) / 2 * P.W, (pts[i][1] + pts[i + 1][1]) / 2 * P.H);
    const e = pts[pts.length - 1]; g.lineTo(e[0] * P.W, e[1] * P.H); g.stroke(); g.restore();
  }
  // Embossed crocodile scales.
  function croc(P, col, n = 26) {
    const a = ax(P), h = 1 / (n * 1.4);
    for (let r = 0; r * h < 1; r++) for (let c = -1; c < n; c++) {
      const w = (1 / n) * (0.7 + rnd(r * 31 + c) * 0.5), x = (c + (r % 2) * 0.5) / n;
      P.g.strokeStyle = col; P.g.lineWidth = 0.0012 * P.H; P.g.beginPath();
      if (P.g.roundRect) P.g.roundRect(x * P.W, r * h * P.H, w * P.W * 0.92, h * P.H * 0.9, h * P.H * 0.35); else P.g.rect(x * P.W, r * h * P.H, w * P.W * 0.92, h * P.H * 0.9);
      P.g.stroke();
    }
    void a;
  }

  /* ---------- Frédéric Malle: the red carton, white sans caps on the left ---------- */
  const MR = '#c8150d';
  const malle = (lines, nose) => (item, fit) => Object.assign(prop(fit, 0.66, 0.42), {
    open: 'flap', paper: { color: MR, rough: 0.42 }, lining: '#151515',
    front: (P) => {
      fullBg(P, MR); const o = L(0.095, { weight: 500, maxW: 0.84 });
      lines.forEach((l, i) => tx(P, l, 0.31 + i * 0.05, 0.028, '#ffffff', 'helv', o));
      tx(P, nose, 0.31 + (lines.length - 1) * 0.05 + 0.06, 0.02, '#ffffff', 'helv', L(0.095, { weight: 400 }));
      tx(P, 'EDITIONS DE PARFUMS', 0.82, 0.018, '#ffffff', 'helv', o);
      tx(P, 'FREDERIC MALLE', 0.855, 0.024, '#ffffff', 'helv', o);
    },
    sideArt: (P) => {
      fullBg(P, MR); lines.forEach((l, i) => tx(P, l, 0.08 + i * 0.025, 0.011, '#ffffff', 'helv', { maxW: 0.86 }));
      tx(P, nose, 0.09 + lines.length * 0.025, 0.009, '#ffffff', 'helv', { weight: 400, maxW: 0.86 });
      tx(P, 'E', 0.485, 0.016, '#ffffff', 'helv', { x: 0.38, weight: 600 }); tx(P, 'P', 0.515, 0.016, '#ffffff', 'helv', { x: 0.38, weight: 600 });
      P.line(0.5, 0.47, 0.5, 0.53, '#ffffff', 0.002); tx(P, 'FM', 0.5, 0.016, '#ffffff', 'helv', { x: 0.66, weight: 600 });
      const g = P.g; g.save(); g.translate(0.5 * P.W, 0.86 * P.H); g.rotate(-Math.PI / 2); g.translate(-0.5 * P.W, -0.86 * P.H);
      tx(P, 'EDITIONS DE PARFUMS FREDERIC MALLE', 0.86, 0.06, '#ffffff', 'helv', { maxW: 0.9 * P.H / P.W }); g.restore();
    },
    top: (P) => fullBg(P, MR),
  });

  /* ---------- Serge Lutens: black-violet carton, condensed Deco caps, SL monogram ---------- */
  function slMono(P, x, y, h, col) {
    const w = h * 0.55 * ax(P), lw = 0.0035;
    P.frame(x - w / 2, y - h / 2, w, h, col, lw);
    P.path([[x - w * 0.28, y - h * 0.36], [x - w * 0.28, y + h * 0.18], [x + w * 0.1, y + h * 0.18]], col, false, lw);
    P.path([[x + w * 0.28, y + h * 0.36], [x + w * 0.28, y - h * 0.18], [x - w * 0.1, y - h * 0.18]], col, false, lw);
    P.path([[x - w * 0.1, y - h * 0.36], [x + w * 0.28, y - h * 0.36]], col, false, lw); P.path([[x + w * 0.1, y + h * 0.36], [x - w * 0.28, y + h * 0.36]], col, false, lw);
  }
  const lutens = (name) => (item, fit) => Object.assign(prop(fit, 0.48, 0.26), {
    open: 'flap', paper: { color: '#1d1b20', rough: 0.85 }, lining: '#111013',
    front: (P) => {
      fullBg(P, '#1d1b20'); stipple(P, 'rgba(255,255,255,0.02)', 900);
      P.frame(0.14, 0.12, 0.72, 0.745, '#4c4952', 0.002);
      const ink = '#dcd6c8';
      ctx(P, 'SERGE', 0.28, 0.058, ink, 'helv', { weight: 400, track: 0.05 }, 0.5);
      ctx(P, 'LUTENS', 0.35, 0.058, ink, 'helv', { weight: 400, track: 0.05 }, 0.5);
      tx(P, name, 0.685, 0.015, '#a29dab', 'helv', { italic: true, weight: 400, maxW: 0.62 });
      slMono(P, 0.5, 0.78, 0.085, ink);
      tx(P, 'EAU DE PARFUM', 0.93, 0.0095, '#a8a4ac', 'helv', { track: 0.08 });
      tx(P, '℮ 50ML 1.6 FL. OZ.', 0.955, 0.0095, '#a8a4ac', 'helv', { track: 0.06 });
    },
    top: (P) => { fullBg(P, '#1d1b20'); ctx(P, 'SERGE LUTENS', 0.5, 0.12, '#dcd6c8', 'helv', { weight: 300, track: 0.05 }, 0.6); },
  });

  /* ---------- Memo Paris: kraft two-piece box with the label artwork inset ---------- */
  const KRAFT = '#b08b52';
  function zigzag(P, col, y0, y1, step = 0.013, lw = 0.0017) {
    const per = 0.034;
    for (let y = y0; y < y1; y += step) { const pts = []; for (let x = -per, k = 0; x < 1 + per; x += per / 2, k++) pts.push([x, y + (k % 2 ? 0.0045 : -0.0045)]); P.path(pts, col, false, lw); }
  }
  function leopard(P, x, y, s) {
    const a = ax(P), body = '#d8b878', ink = '#1a120c';
    P.ellipse(x, y, 0.2 * s * a * 6, 0.05 * s * 6, -0.08, body); // body
    P.circle(x - 0.2 * s * a * 6 * 0.95, y - 0.05 * s * 6, 0.045 * s * 6, body); // head
    P.path([[x - 0.12 * s * 6 * a, y + 0.02 * s * 6], [x - 0.3 * s * 6 * a, y + 0.07 * s * 6], [x - 0.12 * s * 6 * a, y + 0.07 * s * 6]], body); // paws
    curve(P, [[x + 0.19 * s * 6 * a, y], [x + 0.27 * s * 6 * a, y + 0.06 * s * 6], [x + 0.24 * s * 6 * a, y + 0.16 * s * 6]], body, 0.012 * s * 6);
    for (let i = 0; i < 40; i++) P.circle(x + (rnd(i + 50) - 0.6) * 0.36 * s * 6 * a, y + (rnd(i + 90) - 0.5) * 0.08 * s * 6, 0.006 * s * 6, ink);
  }
  const memoArt = {
    african: (P) => {
      fullBg(P, '#b8944c'); zigzag(P, '#1a1410', 0, 1, 0.013, 0.0024);
      P.circle(0.5, 0.52, 0.115, '#dcc07c'); P.circle(0.5, 0.52, 0.098, '#1a1410');
      P.path([[0, 0.505], [0.25, 0.535], [0.55, 0.585], [1, 0.645], [1, 0.84], [0, 0.84]], '#3b2a20');
      leopard(P, 0.55, 0.585, 0.11);
    },
    irish: (P) => {
      fullBg(P, '#16130f');
      for (let i = 0; i < 70; i++) {
        const x = rnd(i * 3 + 1), y = rnd(i * 3 + 2) * 0.98, r = 0.03 + rnd(i * 3 + 3) * 0.05;
        curve(P, [[x - r, y], [x, y - r], [x + r, y], [x, y + r * 0.8], [x - r * 0.6, y + r * 0.2]], i % 3 ? '#b8862a' : '#d8b050', 0.02);
        curve(P, [[x - r * 0.9, y + 0.01], [x + r * 0.2, y - r * 0.9], [x + r * 1.1, y + 0.01]], '#a8c4dc', 0.0025);
      }
      P.circle(0.5, 0.67, 0.2, '#ddb24a'); P.circle(0.5, 0.67, 0.2, '#f0d27a', 0.006);
      for (let i = 0; i < 16; i++) { const t = i / 16 * Math.PI * 2; P.line(0.5 + Math.cos(t) * 0.2 * ax(P), 0.67 + Math.sin(t) * 0.2, 0.5 + Math.cos(t) * 0.25 * ax(P), 0.67 + Math.sin(t) * 0.25, '#ddb24a', 0.006); }
    },
    italian: (P) => {
      fullBg(P, '#e9eef0'); grad(P, 0, 0, 0, 0.35, [[0, '#d8e4ea'], [1, '#f2efe4']]);
      for (let i = 0; i < 6; i++) { const x = 0.1 + rnd(i + 3) * 0.8, y = 0.06 + rnd(i + 9) * 0.18; P.ellipse(x, y, 0.09, 0.02, 0, '#ffffff'); P.ellipse(x + 0.04, y - 0.012, 0.05, 0.018, 0, '#ffffff'); }
      const hill = (y, col, amp, ph) => P.path([[0, 1], ...Array.from({ length: 21 }, (_, j) => [j / 20, y + Math.sin(j * 0.6 + ph) * amp]), [1, 1]], col);
      hill(0.3, '#c8a878', 0.02, 0); hill(0.38, '#9a7a50', 0.025, 1.4); hill(0.47, '#d8c09a', 0.02, 2.2); hill(0.56, '#8a6840', 0.03, 0.4);
      for (let k = 0; k < 40; k++) P.line(0, 0.4 + k * 0.012, 1, 0.42 + k * 0.012 + Math.sin(k) * 0.01, 'rgba(60,40,20,0.25)', 0.0015);
      for (let i = 0; i < 7; i++) P.ellipse(0.62 + i * 0.045, 0.37 + i * 0.012, 0.008, 0.035, 0, '#2e2418');
      P.rect(0, 0.62, 1, 0.16, '#f3ead6'); P.rect(0, 0.84, 1, 0.16, '#8a6840'); zigzag(P, 'rgba(40,25,10,0.35)', 0.85, 1);
    },
    french: (P) => {
      fullBg(P, '#3a2128');
      for (let k = 1; k < 26; k++) { const r = k * 0.04, n = Math.round(14 + k * 9); for (let i = 0; i < n; i++) { const t = Math.PI * (0.05 + 0.9 * i / n); P.circle(0.5 + Math.cos(t) * r * ax(P), 0.17 + Math.sin(t) * r, 0.0028, 'rgba(240,232,226,0.8)'); } }
      P.circle(0.5, 0.17, 0.065, '#141012');
      for (let k = 0; k < 4; k++) P.circle(0.5, 0.17, 0.015 + k * 0.013, '#4a3a40', 0.004);
    },
    marfa: (P) => {
      grad(P, 0, 0, 1, 1, [[0, '#e8bc18'], [0.5, '#c89410'], [1, '#e2b418']]);
      const eye = (x, y, s, iris) => { const a = ax(P); P.path(Array.from({ length: 13 }, (_, i) => { const t = i / 12 * Math.PI * 2; return [x + Math.cos(t) * s * a, y + Math.sin(t) * s * 0.42 * (t < Math.PI ? 1 : 1)]; }), '#fbf4dc'); P.path(Array.from({ length: 13 }, (_, i) => { const t = i / 12 * Math.PI * 2; return [x + Math.cos(t) * s * a, y + Math.sin(t) * s * 0.42]; }).concat([[x + s * a, y]]), '#1a1a1a', false, s * 0.09); P.circle(x, y, s * 0.3, iris || '#1a1a1a'); if (iris) P.circle(x, y, s * 0.13, '#101010'); };
      for (let r = 0; r < 13; r++) for (let c = 0; c < 5; c++) { const x = (c + 0.5 + (r % 2) * 0.5) / 5, y = 0.04 + r * 0.075; if (Math.abs(y - 0.47) < 0.06 && Math.abs(x - 0.5) < 0.3) continue; eye(x, y, 0.022); }
      eye(0.5, 0.47, 0.085, '#2a8ad0');
    },
  };
  const memo = (art, o = {}) => (item, fit) => Object.assign(prop(fit, 0.52, 0.34), {
    lid: 0.9, paper: { color: KRAFT, rough: 0.8 }, lining: '#d8c4a0',
    front: (P) => {
      fullBg(P, KRAFT); stipple(P, 'rgba(90,60,20,0.08)', 1500);
      if (!art) {
        tx(P, 'MEMO', 0.735, 0.036, '#e2cf9c', 'serif', { weight: 700, track: 0.06 }); tx(P, 'P A R I S', 0.775, 0.01, '#e2cf9c', 'serif', { weight: 600, track: 0.2 });
        return;
      }
      P.rect(0.03, 0.02, 0.94, 0.96, '#e6e4de');
      clip(P, 0.045, 0.03, 0.91, 0.94, () => memoArt[art](P));
      const ink = o.ink || '#ffffff';
      if (o.plate) P.rect(0.2, 0.635, 0.6, 0.135, o.plate);
      tx(P, item.name.toUpperCase(), 0.665, 0.022, ink, 'serif', { weight: 700, maxW: 0.66, track: 0.02 });
      tx(P, 'EAU DE PARFUM', 0.69, 0.0075, ink, 'helv', { track: 0.1 });
      tx(P, 'MEMO', 0.72, 0.026, ink, 'serif', { weight: 800, track: 0.02 });
      tx(P, 'PARIS', 0.75, 0.0085, ink, 'serif', { weight: 600, track: 0.12 });
      if (o.col) { P.rect(0.3, 0.945, 0.4, 0.028, '#f0e4c4'); tx(P, o.col, 0.959, 0.009, '#4a3820', 'serif', { italic: true, weight: 600 }); }
    },
    top: (P) => { fullBg(P, KRAFT); stipple(P, 'rgba(90,60,20,0.08)', 600); },
  });

  /* ---------- Mancera: tall carton with the bottle label copied in the upper half ---------- */
  function mancM(P, x, y, s, col) { // geometric "M" monogram
    const a = ax(P) * s;
    P.path([[x - a, y + s * 0.5], [x - a, y - s * 0.5], [x, y + s * 0.15], [x + a, y - s * 0.5], [x + a, y + s * 0.5]], col, false, s * 0.16);
    P.line(x - a * 1.5, y - s * 0.5, x + a * 1.5, y - s * 0.5, col, s * 0.12);
  }
  function mancCrest(P, x, y, s, col) { // iris flower above the M
    const a = ax(P) * s;
    P.ellipse(x, y - s * 0.55, 0.18 * a, 0.42 * s, 0, col);
    P.ellipse(x - 0.5 * a, y - s * 0.3, 0.32 * a, 0.18 * s, -0.5, col); P.ellipse(x + 0.5 * a, y - s * 0.3, 0.32 * a, 0.18 * s, 0.5, col);
    P.ellipse(x - 0.6 * a, y + s * 0.05, 0.28 * a, 0.2 * s, 0.6, col); P.ellipse(x + 0.6 * a, y + s * 0.05, 0.28 * a, 0.2 * s, -0.6, col);
    mancM(P, x, y + s * 0.3, s * 0.45, col);
  }
  const mancera = (o) => (item, fit) => Object.assign(prop(fit, 0.42, 0.4), {
    open: 'flap', paper: o.gold ? { color: '#cdb886', rough: 0.35, metal: 0.55 } : { color: '#0c0c0c', rough: 0.3 }, lining: o.gold ? '#cdb886' : '#0c0c0c',
    front: (P) => {
      if (o.gold) { grad(P, 0, 0, 1, 1, [[0, '#c8a862'], [0.5, '#b0904c'], [1, '#c8a862']]); croc(P, 'rgba(90,65,25,0.3)'); } else fullBg(P, '#0c0c0c');
      const x0 = 0.29, w = 0.42, cx = x0 + w / 2;
      P.rect(x0, 0.21, w, 0.42, o.label);
      if (o.rule) P.frame(x0 + 0.02, 0.217, w - 0.04, 0.406, o.rule, 0.0022);
      if (o.crest) mancCrest(P, cx, 0.285, 0.052, o.logo); else mancM(P, cx, 0.31, 0.024, o.logo);
      tx(P, 'MANCERA', 0.37, 0.016, o.ink, 'sans', { x: cx, weight: 600, track: 0.1, maxW: w * 0.86 });
      tx(P, 'PARIS', 0.39, 0.0065, o.ink, 'sans', { x: cx, track: 0.2 });
      const nm = o.lines || item.name.toUpperCase().split(' ').reduce((a, wd) => { if (a.length && (a[a.length - 1] + ' ' + wd).length <= 7) a[a.length - 1] += ' ' + wd; else a.push(wd); return a; }, []);
      nm.forEach((l, i) => tx(P, l, 0.47 + i * 0.028 - (nm.length - 1) * 0.006, 0.017, (o.inks && o.inks[i]) || o.ink, 'sans', { x: cx, weight: 600, maxW: w * 0.84 }));
      tx(P, 'EAU DE PARFUM', 0.555, 0.0085, o.ink, 'sans', { x: cx, track: 0.06, maxW: w * 0.8 });
      tx(P, '4 FL.oz', 0.6, 0.0075, o.ink, 'sans', L(x0 + 0.04)); tx(P, '120 ML', 0.6, 0.0075, o.ink, 'sans', R(x0 + w - 0.04));
    },
    top: (P) => { if (o.gold) { fullBg(P, '#cdb886'); croc(P, 'rgba(110,85,40,0.28)', 14); } else fullBg(P, '#0c0c0c'); },
  });

  /* ---------- Montale: narrow carton, MTL star logo, label plate low on the left ---------- */
  function mtlLogo(P, x, y, h, col) {
    const hw = h / 2 * ax(P), s = h * 0.36;
    diamond(P, x, y, hw, h / 2, col, 0.0028);
    P.frame(x - s * ax(P), y - s, 2 * s * ax(P), 2 * s, col, 0.0028);
    P.frame(x - s * 0.62 * ax(P), y - s * 0.62, 1.24 * s * ax(P), 1.24 * s, col, 0.0018);
    tx(P, 'M', y - s * 0.22, s * 0.5, col, 'helv', { x, weight: 700 }); tx(P, 'TL', y + s * 0.3, s * 0.4, col, 'helv', { x, weight: 700 });
  }
  const montale = (o) => (item, fit) => Object.assign(prop(fit, 0.36, 0.36), {
    open: 'flap', paper: o.black ? { color: '#0e0e0e', rough: 0.25 } : { color: '#d8c08a', rough: 0.3, metal: 0.6 }, lining: o.black ? '#0e0e0e' : '#d8c08a',
    front: (P) => {
      if (o.black) fullBg(P, '#0e0e0e'); else { grad(P, 0, 0, 1, 0.3, [[0, '#d2b46e'], [0.45, '#b8984e'], [1, '#ccad66']]); for (let i = 0; i < 120; i++) P.line(rnd(i), 0, rnd(i) + 0.02, 1, `rgba(255,255,255,${0.04 + rnd(i + 4) * 0.08})`, 0.002); }
      const ink = o.black ? '#d9b65e' : '#141414';
      mtlLogo(P, 0.74, 0.167, 0.12, ink);
      tx(P, 'MONTALE', 0.305, 0.04, ink, 'sans', { x: 0.52, weight: 700, track: 0.04, maxW: 0.8 });
      tx(P, 'PARIS', 0.332, 0.011, ink, 'sans', R(0.92, { weight: 600, track: 0.1 }));
      if (o.art) o.art(P, ink);
      P.rect(0.22, 0.77, 0.7, 0.09, o.label || '#121212'); P.frame(0.235, 0.777, 0.67, 0.076, o.rule || '#d9b65e', 0.002);
      tx(P, item.name.toUpperCase(), 0.802, 0.0115, o.labelInk || '#f2f2f2', 'sans', { x: 0.57, weight: 600, maxW: 0.6 });
      tx(P, 'EAU DE PARFUM', 0.828, 0.0072, o.labelInk || '#f2f2f2', 'sans', { x: 0.57, track: 0.06 });
      tx(P, '100ML', 0.905, 0.011, ink, 'sans', L(0.1, { weight: 500 })); tx(P, '3.4Fl.oz', 0.905, 0.011, ink, 'sans', R(0.92, { weight: 500 }));
    },
    top: (P) => { if (o.black) fullBg(P, '#0e0e0e'); else fullBg(P, '#d8c08a'); mtlLogo(P, 0.5, 0.5, 0.5, o.black ? '#d9b65e' : '#141414'); },
  });
  const HORSE = [[0.14, 0.715], [0.17, 0.69], [0.25, 0.64], [0.33, 0.6], [0.38, 0.575], [0.4, 0.555], [0.42, 0.535], [0.435, 0.56], [0.455, 0.54], [0.465, 0.565], [0.55, 0.575], [0.64, 0.605], [0.7, 0.65], [0.72, 0.71], [0.7, 0.76], [0.62, 0.74], [0.55, 0.7], [0.47, 0.68], [0.38, 0.69], [0.3, 0.715], [0.22, 0.745], [0.16, 0.745]];
  function horseHead(P, ink) { // Arabians Tonka: an ink-drawn horse head under a palm
    const bg = '#c6a45c';
    curve(P, [[0.6, 0.66], [0.62, 0.55], [0.66, 0.45]], ink, 0.007);
    for (let i = 0; i < 9; i++) { const t = Math.PI * (0.95 + i * 0.14); curve(P, [[0.66, 0.45], [0.66 + Math.cos(t) * 0.12, 0.45 + Math.sin(t) * 0.035], [0.66 + Math.cos(t) * 0.22, 0.45 + Math.sin(t) * 0.06 + 0.035]], ink, 0.006); }
    P.path(HORSE, ink);
    for (let i = 0; i < 8; i++) curve(P, [[0.47 + i * 0.03, 0.575 + i * 0.006], [0.55 + i * 0.025, 0.64], [0.5 + i * 0.03, 0.72]], bg, 0.0022);
    P.circle(0.35, 0.605, 0.005, bg); P.circle(0.175, 0.715, 0.003, bg); P.line(0.16, 0.73, 0.22, 0.728, bg, 0.0015);
  }

  /* ---------- Acqua di Parma: the textured tube with a printed label ---------- */
  function adpCrest(P, x, y, s, col) {
    const a = ax(P) * s;
    P.path([[x - 0.35 * a, y - 0.3 * s], [x + 0.35 * a, y - 0.3 * s], [x + 0.35 * a, y + 0.1 * s], [x, y + 0.45 * s], [x - 0.35 * a, y + 0.1 * s]], col, false, s * 0.06);
    P.path([[x - 0.3 * a, y - 0.4 * s], [x - 0.2 * a, y - 0.62 * s], [x, y - 0.5 * s], [x + 0.2 * a, y - 0.62 * s], [x + 0.3 * a, y - 0.4 * s]], col);
    curve(P, [[x - 0.4 * a, y - 0.2 * s], [x - 0.75 * a, y], [x - 0.45 * a, y + 0.4 * s]], col, s * 0.06);
    curve(P, [[x + 0.4 * a, y - 0.2 * s], [x + 0.75 * a, y], [x + 0.45 * a, y + 0.4 * s]], col, s * 0.06);
    P.circle(x, y, 0.08 * s, col);
  }
  const adp = (o) => (item, fit) => {
    const h = Math.max(fit.h + 0.08, (Math.hypot(fit.w, fit.d) / 2 + 0.035) / 0.25);
    return {
      shape: 'round', r: 0.25 * h, h, lid: h * 0.46, arc: 1.8,
      paper: { color: o.tube, rough: 0.85 }, lining: { color: '#f6f3ea', rough: 0.9 },
      front: (P) => {
        fullBg(P, o.tube); for (let i = 0; i < 260; i++) P.line(rnd(i), 0, rnd(i), 1, 'rgba(0,0,0,0.05)', 0.0012); for (let i = 0; i < 160; i++) P.line(0, rnd(i + 900), 1, rnd(i + 900), 'rgba(255,255,255,0.05)', 0.0012);
        P.rect(0, 0.459, 1, 0.003, 'rgba(0,0,0,0.25)');
        P.rect(0.11, 0.54, 0.78, 0.45, o.label);
        const ink = o.ink;
        tx(P, 'ACQUA', 0.592, 0.034, ink, 'roman', { weight: 700, track: 0.1, maxW: 0.7 });
        tx(P, 'DI', 0.636, 0.018, ink, 'roman', { weight: 700, track: 0.12 });
        tx(P, 'PARMA', 0.677, 0.034, ink, 'roman', { weight: 700, track: 0.1, maxW: 0.7 });
        if (o.blu) tx(P, 'Blu Mediterraneo', 0.745, 0.024, ink, 'serif', { italic: true, weight: 600, maxW: 0.72 });
        adpCrest(P, 0.5, o.blu ? 0.825 : 0.81, 0.06, ink);
        const nm = o.lines || [item.name.toUpperCase()];
        nm.forEach((l, i) => tx(P, l, (o.blu ? 0.885 : 0.88) + i * 0.026, o.blu ? (i ? 0.014 : 0.017) : 0.012, o.nameInk || ink, o.blu ? 'helv' : 'roman', { track: o.blu ? 0.02 : 0.15, maxW: 0.66 }));
        tx(P, o.conc || 'EAU DE COLOGNE', 0.962, 0.0075, ink, 'helv', { track: 0.08 });
        tx(P, '100 ml', 0.95, 0.009, 'rgba(255,255,255,0.45)', 'helv', { x: 0.055 }); tx(P, '3.4 FL.OZ', 0.95, 0.009, 'rgba(255,255,255,0.45)', 'helv', { x: 0.945 });
      },
      top: (P) => { fullBg(P, o.tube); for (let i = 0; i < 120; i++) P.line(rnd(i), 0, rnd(i), 1, 'rgba(0,0,0,0.05)', 0.003); },
    };
  };
  const ADPY = '#e48c00', ADPB = '#12344f';
  const bluMed = (fruit, col) => adp({ tube: ADPB, label: '#f7f6f2', ink: '#1d3f8c', blu: true, lines: fruit, nameInk: col, conc: 'EAU DE TOILETTE' });

  /* ---------- Penhaligon's: two-piece box, patterned lid, cartouche label, coloured base ---------- */
  function cartouche(P, x0, y0, x1, y1, fill, edge) {
    const cx = 0.035, cy = 0.022, m = (x0 + x1) / 2;
    const pts = (d) => [[x0 + cx - d, y0 - d], [m - 0.06, y0 - d], [m, y0 - 0.018 - d], [m + 0.06, y0 - d], [x1 - cx + d, y0 - d], [x1 - cx + d, y0 + cy - d], [x1 + d, y0 + cy - d], [x1 + d, y1 - 0.06], [m, y1 + d * 1.5], [x0 - d, y1 - 0.06], [x0 - d, y0 + cy - d], [x0 + cx - d, y0 + cy - d]];
    if (edge) P.path(pts(0.012), edge);
    P.path(pts(0), fill); P.path(pts(-0.008), 'rgba(0,0,0,0)', false); P.path(pts(-0.008).concat([pts(-0.008)[0]]), 'rgba(120,120,120,0.35)', false, 0.0015);
  }
  const penPat = {
    juniper: (P) => { fullBg(P, '#c6cbc9'); const a = ax(P); for (let r = 0; r < 24; r++) for (let c = -1; c < 7; c++) { const x = (c + (r % 2) * 0.5) / 6, y = r * 0.04; for (let k = 1; k <= 3; k++) { P.g.beginPath(); P.g.arc(x * P.W, (y + 0.04) * P.H, k * 0.014 * P.H, Math.PI, 2 * Math.PI); P.g.strokeStyle = '#2f8e7e'; P.g.lineWidth = 0.005 * P.H; P.g.stroke(); } } void a; },
    halfeti: (P) => { fullBg(P, '#6a2a18'); for (let i = 0; i < 90; i++) P.path(Array.from({ length: 9 }, (_, j) => [rnd(i) + Math.sin(j * 0.8 + i) * 0.03, j / 8]), i % 3 ? 'rgba(40,10,4,0.35)' : 'rgba(200,110,70,0.18)', false, 0.002 + rnd(i + 5) * 0.004); },
    endymion: (P) => { fullBg(P, '#1c2a5a'); for (let i = 0; i < 140; i++) { const x = ((i % 10) + (Math.floor(i / 10) % 2) * 0.5) / 10, y = Math.floor(i / 10) / 14 + 0.02; diamond(P, x, y, 0.009 * ax(P), 0.009, '#5a7ae0'); diamond(P, x, y, 0.003 * ax(P), 0.015, '#5a7ae0'); } },
    babylon: (P) => { fullBg(P, '#1b2a3c'); for (let i = -20; i < 40; i++) { P.line(i / 20, 0, i / 20 + 0.6, 1, 'rgba(200,160,70,0.55)', 0.0018); P.line(i / 20, 0, i / 20 - 0.6, 1, 'rgba(200,160,70,0.55)', 0.0018); } for (let r = 0; r < 30; r++) for (let c = 0; c < 10; c++) P.circle((c + 0.5 + (r % 2) * 0.5) / 10, r / 29, 0.004, '#c8a04a'); },
    sartorial: (P) => { fullBg(P, '#5d6064'); for (let r = 0; r < 60; r++) for (let c = 0; c < 22; c++) P.line(c / 22, r / 60, (c + 0.5) / 22, (r + (c % 2 ? 1 : -1) * 0.5 + 0.5) / 60, 'rgba(255,255,255,0.12)', 0.0014); pinstripe(P, 'rgba(255,255,255,0.1)', 18); },
  };
  const penhaligon = (o) => (item, fit) => Object.assign(prop(fit, 0.55, 0.52), {
    lid: 0.77, paper: { color: o.base, rough: 0.7 }, lining: '#efe8da',
    front: (P) => {
      clip(P, 0, 0, 1, 0.77, () => penPat[o.pat](P));
      P.rect(0, 0.77, 1, 0.02, '#161616'); P.rect(0, 0.79, 1, 0.21, o.base); P.rect(0, 0.985, 1, 0.015, 'rgba(0,0,0,0.4)');
      if (o.moon) { P.circle(0.5, 0.095, 0.032, '#d8dce4'); P.circle(0.515, 0.085, 0.03, '#1c2a5a'); }
      cartouche(P, 0.2, 0.15, 0.8, 0.5, o.label, o.edge);
      const ink = o.ink || '#1a1a1a';
      P.circle(0.5, 0.185, 0.011, o.gold || '#5a5a5a'); P.rect(0.485, 0.193, 0.03, 0.008, o.gold || '#5a5a5a');
      tx(P, "PENHALIGON'S", 0.265, 0.026, o.gold || ink, 'serif', { weight: 600, maxW: 0.54 });
      tx(P, 'LONDON', 0.292, 0.0065, o.dim || '#9a9a9a', 'serif', { track: 0.25 });
      const nm = o.lines || [item.name.toUpperCase()];
      nm.forEach((l, i) => tx(P, l, 0.345 + i * 0.038 + (nm.length === 1 ? 0.015 : 0), i ? 0.022 : 0.03, o.nameInk || ink, 'helv', { weight: 400, track: 0.02, maxW: 0.5 }));
      tx(P, o.conc || 'EAU DE PARFUM', 0.435, 0.0085, o.dim || '#9a9a9a', 'serif', { track: 0.08, maxW: 0.4 });
      P.line(0.43, 0.452, 0.57, 0.452, o.dim || '#9a9a9a', 0.0015);
      tx(P, '100 mL ℮ 3.4 FL OZ', 0.87, 0.014, o.baseInk || '#1a1a1a', 'serif', { weight: 500 });
    },
    top: (P) => penPat[o.pat](P),
  });
  const lordGeorge = (item, fit) => Object.assign(prop(fit, 0.5, 0.48), {
    lid: 0.78, paper: { color: '#f4f4f2', rough: 0.7 }, lining: '#f4f4f2',
    front: (P) => {
      clip(P, 0, 0, 1, 0.78, () => {
        fullBg(P, '#8e938c');
        for (let i = 0; i < 700; i++) { const x = rnd(i), y = rnd(i + 300) * 0.82; curve(P, [[x, y], [x + (rnd(i + 7) - 0.5) * 0.12, y - 0.04], [x + (rnd(i + 9) - 0.5) * 0.2, y - 0.1]], i % 4 ? `rgba(${15 + rnd(i + 2) * 40},${20 + rnd(i + 2) * 40},${18 + rnd(i + 2) * 30},0.75)` : 'rgba(235,238,232,0.7)', 0.002 + rnd(i + 11) * 0.004); }
        for (let i = 0; i < 12; i++) P.rect(0.03 + i * 0.085 + rnd(i) * 0.02, 0, 0.012 + rnd(i + 4) * 0.02, 0.78, 'rgba(30,32,30,0.35)');
        const flower = ['#d8383a', '#e8c840', '#3a6ad8', '#e87aa8', '#f2f2f2', '#4aa04a'];
        for (let i = 0; i < 46; i++) P.circle(rnd(i + 50), 0.12 + rnd(i + 70) * 0.66, 0.004 + rnd(i + 90) * 0.008, flower[i % 6]);
        // the stag with a blue wing, the gentleman behind it
        P.path([[0.35, 0.56], [0.42, 0.5], [0.62, 0.5], [0.7, 0.44], [0.74, 0.45], [0.72, 0.52], [0.68, 0.56], [0.66, 0.66], [0.63, 0.66], [0.6, 0.57], [0.44, 0.58], [0.42, 0.67], [0.39, 0.67], [0.38, 0.6]], '#5a4028');
        P.path([[0.7, 0.44], [0.66, 0.36], [0.7, 0.38], [0.72, 0.32], [0.74, 0.4], [0.78, 0.34], [0.76, 0.43]], '#3a3a3a', false, 0.004);
        P.path([[0.2, 0.42], [0.36, 0.5], [0.52, 0.53], [0.4, 0.55], [0.26, 0.5]], '#4a74d8'); P.path([[0.24, 0.44], [0.38, 0.5], [0.3, 0.5]], '#c8d8f8');
        P.rect(0.5, 0.33, 0.06, 0.14, '#1e1e1e'); P.circle(0.53, 0.31, 0.018, '#e8d8c8'); P.rect(0.505, 0.26, 0.05, 0.035, '#141414'); P.rect(0.495, 0.293, 0.07, 0.006, '#141414');
        tx(P, "PENHALIGON'S", 0.1, 0.03, '#f6f6f2', 'roman', { weight: 700, track: 0.02, maxW: 0.7, shadow: 'rgba(0,0,0,0.6)' });
        P.line(0.3, 0.135, 0.7, 0.135, '#f6f6f2', 0.0015);
      });
      P.rect(0, 0.78, 1, 0.012, '#161616');
      P.circle(0.5, 0.835, 0.012, '#5a5a5a'); P.ellipse(0.47, 0.835, 0.03, 0.006, 0, '#7a7a7a'); P.ellipse(0.53, 0.835, 0.03, 0.006, 0, '#7a7a7a');
      tx(P, 'THE TRAGEDY OF', 0.875, 0.0085, '#1a1a1a', 'helv', { weight: 500, track: 0.1 });
      ctx(P, 'LORD GEORGE', 0.91, 0.024, '#1a1a1a', 'helv', { weight: 500, track: 0.04 }, 0.72);
    },
    top: (P) => { fullBg(P, '#b9bdb6'); for (let i = 0; i < 80; i++) P.circle(rnd(i), rnd(i + 5), 0.01, 'rgba(30,40,30,0.4)'); },
  });

  /* ---------- Ex Nihilo: printed sleeve over a dark box; letter collage or line graphics ---------- */
  function hexLogo(P, y, w, col, txt = 'EX NIHILO') {
    const hh = 0.024, e = 0.035, x0 = 0.5 - w / 2, x1 = 0.5 + w / 2;
    const pts = (d) => [[x0 - d, y], [x0 + e - d * 0.3, y - hh - d], [x1 - e + d * 0.3, y - hh - d], [x1 + d, y], [x1 - e + d * 0.3, y + hh + d], [x0 + e - d * 0.3, y + hh + d], [x0 - d, y]];
    P.path(pts(0), col, false, 0.0016); P.path(pts(0.006), col, false, 0.0012);
    tx(P, txt, y, 0.019, col, 'serif', { weight: 500, maxW: w * 0.82 });
    tx(P, 'PARIS', y + 0.042, 0.0085, col, 'serif', { weight: 600, track: 0.15 });
  }
  // Stencil letters cut into colour blocks; each glyph is a list of polygons in a unit cell.
  const GL = {
    E: [[[0, 0], [0.3, 0], [0.3, 1], [0, 1]], [[0.3, 0], [1, 0], [1, 0.22], [0.3, 0.22]], [[0.3, 0.4], [0.85, 0.4], [0.85, 0.6], [0.3, 0.6]], [[0.3, 0.78], [1, 0.78], [1, 1], [0.3, 1]]],
    X: [[[0, 0], [0.3, 0], [1, 1], [0.7, 1]], [[0.7, 0], [1, 0], [0.62, 0.55], [0.47, 0.33]], [[0.38, 0.67], [0.53, 0.88], [0.45, 1], [0, 1]]],
    N: [[[0, 0], [0.28, 0], [0.28, 1], [0, 1]], [[0.28, 0], [0.5, 0], [0.72, 0.7], [0.72, 1]], [[0.72, 0], [1, 0], [1, 1], [0.72, 1]]],
    I: [[[0.3, 0], [0.7, 0], [0.7, 0.5], [0.3, 0.5]], [[0.3, 0.5], [0.7, 0.5], [0.7, 1], [0.3, 1]]],
    H: [[[0, 0], [0.3, 0], [0.3, 1], [0, 1]], [[0.3, 0.4], [0.7, 0.4], [0.7, 0.6], [0.3, 0.6]], [[0.7, 0], [1, 0], [1, 1], [0.7, 1]]],
    L: [[[0, 0], [0.32, 0], [0.32, 1], [0, 1]], [[0.32, 0.76], [1, 0.76], [1, 1], [0.32, 1]]],
  };
  function glyph(P, c, x, y, w, h, cols, seed) {
    if (c === 'O') {
      const g = P.g, cx = (x + w / 2) * P.W, cy = (y + h / 2) * P.H, rr = Math.min(w * P.W, h * P.H) / 2;
      [[-0.5, 0.5], [0.5, 1.5]].forEach(([a0, a1], i) => { g.beginPath(); g.arc(cx, cy, rr * 0.82, a0 * Math.PI, a1 * Math.PI); g.strokeStyle = cols[(seed + i) % cols.length]; g.lineWidth = rr * 0.36; g.stroke(); });
      return;
    }
    GL[c].forEach((poly, i) => P.path(poly.map(([px, py]) => [x + px * w, y + py * h]), cols[Math.floor(rnd(seed * 7 + i) * cols.length)]));
  }
  function collage(P, cols) {
    const rows = [['EX', 0.09, 0.29, 0.2, 0.78], ['NIH', 0.46, 0.16, 0.24, 0.76], ['ILO', 0.66, 0.15, 0.24, 0.76]];
    rows.forEach(([s, y, h, x0, x1], r) => { const n = s.length, gap = 0.03, w = (x1 - x0 - gap * (n - 1)) / n; [...s].forEach((c, i) => glyph(P, c, x0 + i * (w + gap), y, w, h, cols, r * 5 + i)); });
  }
  const exNihilo = (o) => (item, fit) => Object.assign(prop(fit, 0.6, 0.42), {
    lid: 0.93, paper: { color: o.bg, rough: 0.6 }, side: '#141a2a', lining: '#141a2a',
    front: (P) => {
      fullBg(P, o.bg); stipple(P, 'rgba(0,0,0,0.03)', 900);
      if (o.lines) o.lines(P);
      else {
        collage(P, o.blocks);
        const nm = item.name.toUpperCase().split(' '), l1 = nm.length > 2 ? nm.slice(0, 2).join(' ') : nm[0], l2 = nm.length > 2 ? nm.slice(2).join(' ') : nm.slice(1).join(' ');
        mono(P, l1, 0.4, 0.02, o.ink); mono(P, l2, 0.432, 0.02, o.ink); mono(P, 'EAU DE PARFUM', 0.462, 0.009, o.ink);
      }
      hexLogo(P, 0.875, 0.4, o.logo || o.ink);
    },
    top: (P) => { fullBg(P, o.bg); hexLogo(P, 0.46, 0.5, o.logo || o.ink); },
  });
  function talismanLines(P) {
    const c = '#c9a961', a = ax(P), lw = 0.0018;
    for (let k = 0; k < 3; k++) { P.g.beginPath(); P.g.arc((0.78 + k * 0.03) * P.W, 0.14 * P.H, 0.2 * P.H, Math.PI * 0.82, Math.PI * 1.08); P.g.strokeStyle = c; P.g.lineWidth = lw * P.H; P.g.stroke(); }
    [0.65, 0.68].forEach((x) => P.line(x, 0.03, x, 0.55, c, lw)); P.line(0.6, 0.535, 0.9, 0.535, c, lw); P.line(0.6, 0.55, 0.9, 0.55, c, lw);
    P.line(0.6, 0.15, 0.97, 0.15, c, lw); P.line(0.6, 0.165, 0.97, 0.165, c, lw);
    for (let k = 0; k < 3; k++) { P.g.beginPath(); P.g.arc(-0.2 * P.W, (0.45 + k * 0.012) * P.H, 0.55 * P.W, -0.22, -0.02); P.g.strokeStyle = c; P.g.lineWidth = lw * P.H; P.g.stroke(); }
    [0.18, 0.2, 0.24].forEach((x, i) => P.line(x, 0.48 + i * 0.03, x, 0.98, c, lw));
    P.path([[0.38, 0.86], [0.64, 0.66], [0.94, 0.94]], c, false, lw); P.path([[0.68, 0.66], [0.96, 0.62]], c, false, lw); P.path([[0.62, 0.7], [0.92, 0.98]], c, false, lw);
    tx(P, 'BLUE', 0.4, 0.022, c, 'sans', { weight: 400, track: 0.06 }); tx(P, 'TALISMAN', 0.436, 0.022, c, 'sans', { weight: 400, track: 0.04 }); tx(P, 'EAU DE PARFUM', 0.475, 0.0075, c, 'sans', { track: 0.12 });
    void a;
  }

  /* ---------- Tiziana Terenzi: near-cubic lid box, white crest panel, rose-gold collar ---------- */
  function ttCrest(P, x, y, s, col) {
    const a = ax(P) * 0.62, X = (u) => x + u * s * a, Y = (v) => y + v * s, lw = 0.022 * s;
    P.ellipse(x, y, 0.17 * s * a, 0.22 * s, 0, col); P.ellipse(x, y, 0.135 * s * a, 0.185 * s, 0, '#f6f6f4');
    tx(P, 'S', y, 0.17 * s, col, 'serif', { x, italic: true, weight: 700 });
    for (const sg of [-1, 1]) {
      curve(P, [[X(sg * 0.18), Y(-0.2)], [X(sg * 0.55), Y(-0.38)], [X(sg * 0.42), Y(0)], [X(sg * 0.6), Y(0.28)], [X(sg * 0.16), Y(0.42)]], col, lw);
      curve(P, [[X(sg * 0.24), Y(-0.06)], [X(sg * 0.4), Y(-0.16)], [X(sg * 0.36), Y(0.08)], [X(sg * 0.22), Y(0.24)]], col, lw * 0.8);
      curve(P, [[X(sg * 0.08), Y(-0.3)], [X(sg * 0.32), Y(-0.52)], [X(sg * 0.58), Y(-0.44)], [X(sg * 0.5), Y(-0.3)]], col, lw * 0.8);
      curve(P, [[X(sg * 0.6), Y(0.28)], [X(sg * 0.72), Y(0.42)], [X(sg * 0.5), Y(0.5)]], col, lw * 0.7);
      curve(P, [[X(sg * 0.42), Y(0)], [X(sg * 0.7), Y(-0.08)], [X(sg * 0.66), Y(0.12)]], col, lw * 0.7);
      for (let k = 0; k < 5; k++) P.circle(X(sg * (0.3 + k * 0.08)), Y(0.36 + k * 0.03), 0.018 * s, col);
    }
    P.path([[X(-0.14), Y(-0.36)], [X(-0.1), Y(-0.52)], [X(0), Y(-0.44)], [X(0.1), Y(-0.52)], [X(0.14), Y(-0.36)]], col);
    P.circle(x, Y(-0.58), 0.035 * s, col); P.circle(X(-0.1), Y(-0.55), 0.022 * s, col); P.circle(X(0.1), Y(-0.55), 0.022 * s, col);
    curve(P, [[X(-0.2), Y(0.34)], [x, Y(0.5)], [X(0.2), Y(0.34)]], col, lw * 0.7);
  }
  const tt = (o) => (item, fit) => Object.assign(prop(fit, 0.71, 0.68), {
    lid: 0.73, paper: { color: o.board, rough: 0.55 }, lining: o.board,
    front: (P) => {
      fullBg(P, o.board); const ink = o.ink, gold = '#a87e3c';
      tx(P, 'x Te', 0.08, 0.013, ink, 'helv', { weight: 600 });
      P.rect(0.155, 0.14, 0.7, 0.59, '#ecebe6');
      ttCrest(P, 0.5, 0.385, 0.42, gold);
      tx(P, 'Tiziana Terenzi', 0.652, 0.026, gold, 'serif', { italic: true, weight: 700, maxW: 0.6 });
      tx(P, 'Since 1968', 0.686, 0.0085, gold, 'serif', { weight: 600 });
      grad(P, 0, 0.73, 0, 0.81, [[0, '#e8caa0'], [0.5, '#c89a6e'], [1, '#e0bc90']], [0, 0.73, 1, 0.08]);
      P.rect(0.18, 0.745, 0.74, 0.052, o.plate); P.frame(0.18, 0.745, 0.74, 0.052, '#b08a5a', 0.0015);
      tx(P, o.name || item.name, 0.772, 0.0125, o.plateInk, 'helv', { x: 0.55, weight: 500, maxW: 0.6 });
      tx(P, 'Extrait de Parfum', 0.862, 0.016, ink, 'helv', { weight: 500 });
      tx(P, 'natural spray', 0.895, 0.0105, ink, 'helv', { weight: 400 });
      tx(P, '100 ml   3.38 fl.oz', 0.935, 0.0125, ink, 'helv', { weight: 400 });
    },
    top: (P) => { fullBg(P, o.board); tx(P, 'Tiziana Terenzi', 0.5, 0.06, '#c4a064', 'serif', { italic: true, maxW: 0.7 }); },
  });

  /* ---------- BDK Parfums: off-white carton, black frame, notes listed ---------- */
  const bdk = (lines, notes) => (item, fit) => Object.assign(prop(fit, 0.51, 0.36), {
    open: 'flap', paper: { color: '#f4f3ef', rough: 0.9 }, lining: '#f4f3ef',
    front: (P) => {
      fullBg(P, '#f4f3ef'); const k = '#1a1a1a';
      P.frame(0.03, 0.02, 0.94, 0.96, k, 0.0025);
      tx(P, 'bdk', 0.135, 0.085, k, 'serif', { weight: 500, maxW: 0.48 });
      tx(P, 'PARFUMS', 0.2, 0.016, k, 'helv', { weight: 500, track: 0.22 }); tx(P, 'PARIS', 0.225, 0.007, k, 'helv', { weight: 500, track: 0.25 });
      lines.forEach((l, i) => tx(P, l, 0.36 + i * 0.04, 0.022, k, 'helv', { weight: 700, maxW: 0.7 }));
      P.line(0.21, 0.45, 0.78, 0.45, k, 0.0015);
      notes.forEach((n, i) => tx(P, n, 0.5 + i * 0.042, 0.0105, k, 'helv', { weight: 400, maxW: 0.7 }));
      tx(P, 'EAU DE PARFUM', 0.91, 0.009, k, 'helv', { weight: 400 }); tx(P, 'VAPORISATEUR - NATURAL SPRAY', 0.93, 0.009, k, 'helv', { weight: 400 }); tx(P, '℮ 100 ML - 3,4 FL.OZ.', 0.95, 0.009, k, 'helv', { weight: 400 });
    },
    top: (P) => { fullBg(P, '#f4f3ef'); tx(P, 'bdk', 0.5, 0.2, '#1a1a1a', 'serif', { weight: 400 }); },
  });

  /* ---------- Bond No. 9: square lid box; spirograph circle, croc token or skyline ---------- */
  function token(P, x, y, r, disc, gold, name, ink) {
    P.circle(x, y, r, disc); P.circle(x, y, r, gold, r * 0.07); P.circle(x, y, r * 0.62, gold, r * 0.035);
    tx(P, 'N', y + r * 0.02, r * 0.42, ink || gold, 'helv', { x: x - r * 0.3 * ax(P), weight: 700 });
    tx(P, 'Y', y - r * 0.12, r * 0.42, ink || gold, 'helv', { x, weight: 700 });
    tx(P, 'C', y + r * 0.02, r * 0.42, ink || gold, 'helv', { x: x + r * 0.3 * ax(P), weight: 700 });
    const sp = Math.min(0.26, 2.2 / Math.max(1, name.length));
    arcText(P, name, x, y, r * 0.8, r * 0.2, ink || gold, 'helv', true, sp);
    arcText(P, 'BOND No.9', x, y, r * 0.8, r * 0.2, ink || gold, 'helv', false, 0.24);
  }
  function bondScript(P, gold, x = 0.7, y = 0.81) {
    tx(P, 'Bond no.9', y, 0.06, gold, 'serif', { x, italic: true, weight: 500, maxW: 0.5 });
    tx(P, 'NEW YORK', y + 0.07, 0.016, gold, 'helv', { x: x + 0.04, weight: 600, track: 0.1 });
  }
  function spiro(P, bg, gold, tok, name) {
    const g = P.g, cx = 0.5 * P.W, cy = 0.45 * P.H, R0 = 0.4 * P.H, n = 96, span = 2.27;
    g.save(); g.strokeStyle = gold; g.lineWidth = 0.0019 * P.H;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0); g.lineTo(cx + Math.cos(a + span) * R0, cy + Math.sin(a + span) * R0); g.stroke(); }
    g.lineWidth = 0.004 * P.H; g.beginPath(); g.arc(cx, cy, R0, 1.65, 0.6 + Math.PI * 2); g.stroke(); g.restore();
    P.circle(0.5, 0.45, 0.17, bg); P.circle(0.5, 0.45, 0.17, gold, 0.003);
    arcText(P, 'EAU DE PARFUM / NATURAL SPRAY / VAPORISATEUR', 0.5, 0.45, 0.145, 0.0085, gold, 'helv', true, 0.052, { weight: 500 });
    tx(P, '3.3 FL OZ / 100MLℯ', 0.56, 0.012, gold, 'helv', { weight: 600, track: 0.04 });
    token(P, 0.5, 0.435, 0.07, tok, gold, name, null);
  }
  const bondSpiro = (o) => (item, fit) => Object.assign(prop(fit, 1.0, 0.45), {
    lid: 0.86, paper: { color: o.bg, rough: 0.3 }, lining: '#d8b860',
    front: (P) => { fullBg(P, o.bg); spiro(P, o.bg, '#d4b25a', o.tok, o.name); bondScript(P, '#d4b25a'); },
    top: (P) => { fullBg(P, o.bg); },
  });
  const greenwich = (item, fit) => Object.assign(prop(fit, 1.0, 0.45), {
    lid: 0.86, paper: { color: '#0b6668', rough: 0.3, metal: 0.15 }, lining: '#d8b860',
    front: (P) => {
      grad(P, 0, 0, 1, 1, [[0, '#0e7476'], [1, '#085a5c']]); croc(P, 'rgba(0,30,30,0.4)', 18);
      const g = '#d9b75c', r = 0.22;
      P.circle(0.5, 0.47, r, g, 0.008); P.circle(0.5, 0.47, r * 0.62, g, 0.004);
      arcText(P, 'GREENWICH VILLAGE', 0.5, 0.47, r * 0.8, 0.032, g, 'helv', true, 0.15);
      arcText(P, 'BOND No.9', 0.5, 0.47, r * 0.8, 0.032, g, 'helv', false, 0.2);
      tx(P, 'N', 0.475, 0.07, g, 'helv', { x: 0.5 - 0.075, weight: 600 }); tx(P, 'Y', 0.45, 0.07, g, 'helv', { x: 0.5, weight: 600 }); tx(P, 'C', 0.475, 0.07, g, 'helv', { x: 0.575, weight: 600 });
    },
    top: (P) => { fullBg(P, '#0b6668'); croc(P, 'rgba(0,40,40,0.35)', 18); },
  });
  const nyNights = (item, fit) => Object.assign(prop(fit, 1.0, 0.45), {
    lid: 0.86, paper: { color: '#2c2c9a', rough: 0.25, metal: 0.2 }, lining: '#d8b860',
    front: (P) => {
      grad(P, 0, 0, 1, 1, [[0, '#0d0b46'], [0.5, '#17145e'], [1, '#0a0838']]);
      const pal = ['#e8384a', '#f07ab0', '#f2d040', '#2ac0c0', '#48b048', '#f08a2a', '#8a5ae0', '#ffffff'];
      const bld = [[0.02, 0.7], [0.08, 0.58], [0.15, 0.74], [0.2, 0.5], [0.27, 0.66], [0.33, 0.38], [0.39, 0.62], [0.45, 0.26], [0.51, 0.55], [0.56, 0.2], [0.61, 0.45], [0.67, 0.64], [0.72, 0.36], [0.78, 0.68], [0.84, 0.55], [0.9, 0.72], [0.95, 0.6]];
      bld.forEach(([x, top], b) => {
        const w = 0.05; P.rect(x, top, w, 1 - top, 'rgba(20,20,70,0.6)');
        for (let yy = top; yy < 1; yy += 0.022) for (let xx = 0; xx < 3; xx++) if (rnd(b * 97 + yy * 300 + xx) > 0.5) P.rect(x + 0.004 + xx * 0.016, yy + 0.003, 0.013, 0.017, pal[Math.floor(rnd(b * 13 + yy * 71 + xx) * pal.length)]);
        if (b === 9 || b === 7) P.line(x + w / 2, top, x + w / 2, top - 0.1, '#f2f2f2', 0.003);
      });
      token(P, 0.84, 0.17, 0.075, '#2c2c9a', '#e0c060', 'NEW YORK NIGHTS', null);
    },
    top: (P) => fullBg(P, '#2c2c9a'),
  });

  /* ---------- Maison Crivelli: matte extrait carton, serif name top left ---------- */
  const crivelli = (o) => (item, fit) => Object.assign(prop(fit, 0.55, 0.36), {
    open: 'flap', paper: { color: o.bg, rough: 0.85, metal: o.metal || 0 }, lining: o.bg,
    front: (P) => {
      fullBg(P, o.bg); if (o.metal) brushed(P, 'rgba(255,255,255,0.08)', 80);
      tx(P, o.l1, 0.12, 0.028, o.ink, 'serif', L(0.09, { weight: 500, maxW: 0.8 }));
      tx(P, o.l2, 0.17, 0.028, o.ink, 'serif', L(0.09, { italic: true, weight: 600, maxW: 0.8 }));
      tx(P, 'EXTRAIT DE PARFUM · PARIS', 0.225, 0.0075, o.ink, 'helv', L(0.09, { weight: 500, track: 0.08 }));
      tx(P, '℮50ml · 1.7fl.oz', 0.95, 0.0075, o.ink, 'helv', L(0.09, { weight: 400 }));
      tx(P, 'Maison Crivelli', 0.95, 0.014, o.ink, 'serif', R(0.91, { weight: 500 }));
    },
    top: (P) => { fullBg(P, o.bg); tx(P, 'Maison Crivelli', 0.5, 0.1, o.ink, 'serif', { maxW: 0.8 }); },
  });

  /* ---------- DKNY (estimated: no photo of either box) ---------- */
  const dknyMen = (item, fit) => Object.assign(prop(fit, 1.0, 0.9), {
    open: 'flap', paper: { color: '#b9bec2', rough: 0.3, metal: 0.6 }, lining: '#e8eae8',
    front: (P) => {
      grad(P, 0, 0, 1, 1, [[0, '#cfd3d6'], [0.5, '#aeb3b8'], [1, '#c8ccd0']]); brushed(P, 'rgba(255,255,255,0.25)', 120);
      P.circle(0.5, 0.42, 0.27, '#8cc63f'); P.circle(0.44, 0.33, 0.07, 'rgba(255,255,255,0.25)');
      P.path([[0.5, 0.15], [0.52, 0.08], [0.55, 0.08], [0.53, 0.16]], '#5a4028'); P.ellipse(0.6, 0.11, 0.06, 0.022, -0.4, '#5a9a2a');
      P.ellipse(0.5, 0.44, 0.27, 0.1, 0, '#7a2a24'); P.ellipse(0.5, 0.44, 0.25, 0.085, 0, '#f2ece2');
      tx(P, 'DKNY', 0.405, 0.012, '#7a2a24', 'helv', { weight: 700, track: 0.15 });
      ctx(P, 'BE DELICIOUS', 0.44, 0.024, '#7a2a24', 'helv', { weight: 700 }, 0.7);
      tx(P, 'MEN', 0.475, 0.012, '#7a2a24', 'helv', { weight: 700, track: 0.2 });
      tx(P, 'DKNY', 0.82, 0.05, '#1a1a1a', 'helv', { weight: 700, track: 0.12 });
      tx(P, 'EAU DE TOILETTE', 0.89, 0.011, '#1a1a1a', 'helv', { track: 0.12 }); tx(P, '100 ml ℮ 3.4 FL.OZ.', 0.915, 0.01, '#1a1a1a', 'helv', { track: 0.06 });
    },
    top: (P) => { fullBg(P, '#b9bec2'); tx(P, 'DKNY', 0.5, 0.25, '#1a1a1a', 'helv', { weight: 700 }); },
  });
  const goldenMillion = (item, fit) => Object.assign(prop(fit, 0.85, 0.75), {
    lid: 0.85, paper: { color: '#0e0e0e', rough: 0.18 }, lining: { color: '#d8b45a', rough: 0.35, metal: 0.5 },
    front: (P) => {
      fullBg(P, '#0e0e0e'); const gd = '#d8b45a';
      P.frame(0.05, 0.04, 0.9, 0.78, gd, 0.004); P.frame(0.07, 0.055, 0.86, 0.75, gd, 0.0015);
      P.circle(0.5, 0.34, 0.13, gd); P.circle(0.44, 0.29, 0.035, 'rgba(255,255,255,0.3)');
      P.path([[0.5, 0.22], [0.515, 0.16], [0.535, 0.165], [0.52, 0.225]], gd); P.ellipse(0.58, 0.18, 0.05, 0.018, -0.4, gd);
      tx(P, 'DKNY', 0.56, 0.04, gd, 'helv', { weight: 700, track: 0.14 });
      tx(P, 'GOLDEN DELICIOUS', 0.625, 0.016, gd, 'helv', { weight: 500, track: 0.18 });
      tx(P, 'MILLION DOLLAR FRAGRANCE BOTTLE', 0.66, 0.0095, gd, 'helv', { weight: 500, track: 0.12 });
      tx(P, 'MARTIN KATZ', 0.75, 0.008, gd, 'helv', { track: 0.3 });
      P.rect(0, 0.85, 1, 0.004, gd);
    },
    top: (P) => { fullBg(P, '#0e0e0e'); P.frame(0.06, 0.06, 0.88, 0.88, '#d8b45a', 0.01); tx(P, 'DKNY', 0.5, 0.14, '#d8b45a', 'helv', { weight: 700 }); },
  });

  BoxCraft.add({
    /* Frédéric Malle */
    malle: (item, fit) => malle([item.name.toUpperCase()], 'Editions de Parfums')(item, fit),
    'malle|Portrait of a Lady': malle(['PORTRAIT', 'OF A LADY'], 'Dominique Ropion'),
    'malle|Musc Ravageur': malle(['MUSC', 'RAVAGEUR'], 'Maurice Roucel'),
    'malle|Géranium pour Monsieur': malle(['GERANIUM', 'POUR MONSIEUR'], 'Dominique Ropion'),
    'malle|French Lover': malle(['FRENCH', 'LOVER'], 'Pierre Bourdon'),
    'malle|Vétiver Extraordinaire': malle(['VETIVER', 'EXTRAORDINAIRE'], 'Dominique Ropion'),
    'malle|Carnal Flower': malle(['CARNAL', 'FLOWER'], 'Dominique Ropion'),
    'malle|Monsieur.': malle(['MONSIEUR.'], 'Bruno Jovanovic'),

    /* Serge Lutens */
    lutens: (item, fit) => lutens(item.name)(item, fit),
    'lutens|Ambre Sultan': lutens('Ambre sultan'), 'lutens|Chergui': lutens('Chergui'), 'lutens|Daim Blond': lutens('Daim blond'),
    'lutens|La Fille de Berlin': lutens('La fille de Berlin'), 'lutens|Féminité du Bois': lutens('Féminité du bois'),

    /* Memo Paris */
    memo: memo(null),
    'memo|African Leather': memo('african', { col: 'Cuirs Nomades' }),
    'memo|Irish Leather': memo('irish', { ink: '#2a1a0c', col: 'Cuirs Nomades' }),
    'memo|Italian Leather': memo('italian', { ink: '#3a2a18', col: 'Cuirs Nomades' }),
    'memo|French Leather': memo('french', { col: 'Cuirs Nomades' }),
    'memo|Marfa': memo('marfa', { ink: '#141414', col: 'Art Land' }),
    'memo|Lalibela': memo(null), 'memo|Inlé': memo(null),

    /* Mancera */
    mancera: mancera({ label: '#f4f4f2', ink: '#141414', logo: '#141414' }),
    'mancera|Cedrat Boisé': mancera({ label: '#f4f4f2', ink: '#141414', logo: '#141414', lines: ['CEDRAT', 'BOISE'] }),
    'mancera|Red Tobacco': mancera({ label: '#0c0c0c', rule: '#c8a45a', crest: true, logo: '#c8a45a', ink: '#f2f2f2', lines: ['RED', 'TOBACCO'], inks: ['#d4282a'] }),
    'mancera|Instant Crush': mancera({ gold: true, label: '#f6f4ee', ink: '#7a6236', logo: '#7a6236', lines: ['INSTANT', 'CRUSH'] }),
    'mancera|Roses Vanille': mancera({ label: '#f4f4f2', ink: '#141414', logo: '#141414', lines: ['ROSES', 'VANILLE'] }),
    'mancera|Aoud Lemon Mint': mancera({ gold: true, label: '#dcc890', ink: '#2a2214', logo: '#2a2214', lines: ['AOUD', 'LEMON MINT'] }),
    'mancera|Hindu Kush': mancera({ label: '#f4f4f2', crest: true, ink: '#141414', logo: '#141414', lines: ['HINDU KUSH'] }),

    /* Montale */
    montale: montale({}),
    'montale|Intense Café': montale({ label: '#3a1530', rule: '#c8a45a' }),
    'montale|Arabians Tonka': montale({ art: horseHead }),
    'montale|Black Aoud': montale({ black: true }),
    'montale|Starry Nights': montale({ label: '#141414' }),
    'montale|Chocolate Greedy': montale({ black: true, label: '#e8e8e8', rule: '#8a8a8a', labelInk: '#1a1a1a' }),
    'montale|Aoud Forest': montale({ label: '#6a1a1e', rule: '#c8a45a' }),

    /* Acqua di Parma */
    adp: adp({ tube: ADPY, label: '#f6f3ea', ink: '#1a1a1a' }),
    'adp|Colonia': adp({ tube: ADPY, label: '#f6f3ea', ink: '#1a1a1a', lines: ['COLONIA'] }),
    'adp|Colonia Intensa': adp({ tube: ADPY, label: '#6e5c5e', ink: '#efe6dc', lines: ['COLONIA INTENSA'] }),
    'adp|Fico di Amalfi': bluMed(['FICO', 'di AMALFI'], '#e0403e'),
    'adp|Arancia di Capri': bluMed(['ARANCIA', 'di CAPRI'], '#f08a1a'),
    'adp|Mirto di Panarea': bluMed(['MIRTO', 'di PANAREA'], '#3a8a5a'),

    /* Penhaligon's */
    penhaligons: penhaligon({ pat: 'sartorial', base: '#1a1a1a', label: '#e8e8e6', edge: '#8a8a8a', baseInk: '#e8e8e8' }),
    'penhaligons|Juniper Sling': penhaligon({ pat: 'juniper', base: '#2f8e7e', label: '#e6e8e6', edge: '#2f8e7e', lines: ['JUNIPER', 'SLING'], conc: 'EAU DE TOILETTE' }),
    'penhaligons|Halfeti': penhaligon({ pat: 'halfeti', base: '#3a160c', label: '#141414', edge: '#c9a24a', gold: '#c9a24a', ink: '#c9a24a', nameInk: '#e8405a', dim: '#c9a24a', baseInk: '#c9a24a', lines: ['HALFETI'] }),
    'penhaligons|Endymion': penhaligon({ pat: 'endymion', base: '#141c3c', label: '#dfe2e8', edge: '#9aa4c0', ink: '#1c2a5a', moon: true, lines: ['ENDYMION'], conc: 'EAU DE COLOGNE', baseInk: '#c8d0e8' }),
    'penhaligons|Babylon': penhaligon({ pat: 'babylon', base: '#132030', label: '#f0e6cc', edge: '#c8a04a', ink: '#132030', gold: '#a8802a', lines: ['BABYLON'], baseInk: '#d8b860' }),
    'penhaligons|Sartorial': penhaligon({ pat: 'sartorial', base: '#1a1a1a', label: '#e8e8e6', edge: '#8a8a8a', lines: ['SARTORIAL'], conc: 'EAU DE TOILETTE', baseInk: '#e8e8e8' }),
    'penhaligons|The Tragedy of Lord George': lordGeorge,

    /* Ex Nihilo */
    exnihilo: exNihilo({ bg: '#f6f5f2', blocks: ['#2a49c8', '#c4a04c', '#efe6cf', '#d8d8d8', '#2a49c8', '#c4a04c'], ink: '#1d2a6a', logo: '#a8884a' }),
    'exnihilo|Fleur Narcotique': exNihilo({ bg: '#f6f5f2', blocks: ['#2a49c8', '#c4a04c', '#efe6cf', '#cfcfcf', '#2a49c8', '#c4a04c', '#2a49c8', '#c4a04c', '#1c1c1c'], ink: '#1d2a6a', logo: '#a8884a' }),
    'exnihilo|Lust in Paradise': exNihilo({ bg: '#f2c4d4', blocks: ['#e8405a', '#c4a04c', '#f6ecd8', '#e8405a', '#c4a04c'], ink: '#d02848', logo: '#d02848' }),
    'exnihilo|Blue Talisman': exNihilo({ bg: '#22348a', lines: talismanLines, ink: '#c9a961' }),

    /* Tiziana Terenzi */
    tt: tt({ board: '#aaa08a', ink: '#5a4a30', plate: '#f8f6f0', plateInk: '#b08a5a' }),
    'tt|Kirke': tt({ board: '#121212', ink: '#f2f2f2', plate: '#121212', plateInk: '#f2f2f2', name: 'Kirkè' }),
    'tt|Orion': tt({ board: '#aaa08a', ink: '#5a4a30', plate: '#f8f6f0', plateInk: '#b08a5a' }),
    'tt|Andromeda': tt({ board: '#aaa08a', ink: '#5a4a30', plate: '#f8f6f0', plateInk: '#b08a5a' }),
    'tt|Cassiopea': tt({ board: '#b0a792', ink: '#5a4a30', plate: '#f8f6f0', plateInk: '#b08a5a' }),

    /* BDK Parfums */
    bdk: (item, fit) => bdk(item.name.toUpperCase().split(' '), [])(item, fit),
    'bdk|Rouge Smoking': bdk(['ROUGE', 'SMOKING'], ['ACCORD CERISE', 'BAIE ROSE', "BERGAMOTE D'ITALIE", 'VANILLE NOIRE', 'FÈVE TONKA', 'AMBROXAN', 'CASHMERAN', 'LABDANUM', 'MUSCS BLANCS']),
    'bdk|Gris Charnel': bdk(['GRIS', 'CHARNEL'], ['FIGUE', 'THÉ NOIR', 'CARDAMOME', 'ABSOLU IRIS', 'VÉTIVER BOURBON', "SANTAL D'INDE", 'ABSOLU FÈVE TONKA']),
    'bdk|Pas Ce Soir': bdk(['PAS', 'CE SOIR'], ['ORANGE', 'RHUM', 'POIVRE NOIR', 'PATCHOULI', 'CACAO', 'VANILLE', 'AMBRE', 'MUSCS']),

    /* Bond No. 9 */
    bond: bondSpiro({ bg: '#121212', tok: '#121212', name: 'NEW YORK' }),
    'bond|Bleecker Street': bondSpiro({ bg: '#04602c', tok: '#4a3aa0', name: 'BLEECKER ST.' }),
    'bond|Wall Street': bondSpiro({ bg: '#121212', tok: '#121212', name: 'WALL STREET' }),
    'bond|Greenwich Village': greenwich,
    'bond|New York Nights': nyNights,

    /* Maison Crivelli */
    crivelli: crivelli({ bg: '#4e4c4c', ink: '#f2f2f0', l1: 'Maison', l2: 'Crivelli' }),
    'crivelli|Hibiscus Mahajád': crivelli({ bg: '#4e4c4c', ink: '#f2f2f0', l1: 'Hibiscus', l2: 'Mahajád' }),
    'crivelli|Oud Maracujá': crivelli({ bg: '#b89c66', metal: 0.15, ink: '#3a2a1a', l1: 'Oud', l2: 'Maracujá' }),

    /* DKNY */
    dkny: dknyMen,
    'dkny|Be Delicious Men': dknyMen,
    'dkny|Golden Delicious Million Dollar Fragrance Bottle': goldenMillion,
  });
  void waves; void seal;
})();
