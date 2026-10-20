/* Sillage — retail boxes per house, from photos of the real packaging.
 * Positions and sizes follow the notes taken from those photos: y is measured
 * from the top of the box face, cap heights as a fraction of the box height.
 */
(() => {
  // Box dimensions from W : D : H proportions, grown until the bottle fits.
  function prop(fit, rw, rd, pad = 0.07) {
    const h = Math.max(fit.h + pad, (fit.w + pad) / rw, (fit.d + pad) / rd);
    return { w: rw * h, d: rd * h, h };
  }
  // Text by cap height (fonts draw caps at about 0.7 of their size).
  const tx = (P, s, y, cap, col, font = 'sans', o = {}) => P.text(s, o.x != null ? o.x : 0.5, y, cap / 0.7, col, Object.assign({ font, weight: 500 }, o));
  const rnd = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
  // Paper textures.
  function stipple(P, col, n = 1400, r = 0.0012) { for (let i = 0; i < n; i++) P.circle(rnd(i), rnd(i + 7777), r * (0.5 + rnd(i + 3)), col); }
  function brushed(P, col, n = 160) { for (let i = 0; i < n; i++) P.line(0, rnd(i), 1, rnd(i) + (rnd(i + 5) - 0.5) * 0.002, col, 0.0008 + rnd(i + 9) * 0.0012); }
  function pinstripe(P, col, n = 70) { for (let i = 0; i < n; i++) P.line(i / n, 0, i / n, 1, col, 0.0007); }
  function waves(P, col, n = 60) { for (let i = 0; i < n; i++) P.path(Array.from({ length: 13 }, (_, j) => [j / 12, i / n + Math.sin(j * 0.9 + i * 0.7) * 0.004]), col, false, 0.0012); }
  const fullBg = (P, c) => P.rect(0, 0, 1, 1, c);

  // Creed's Prince-of-Wales feathers with coronet.
  function feathers(P, x, y, s, col) {
    const ax = P.H / P.W;
    for (const [dx, rot] of [[-0.55, -0.35], [0, 0], [0.55, 0.35]]) {
      P.ellipse(x + dx * s * ax, y - s * 0.25 + Math.abs(dx) * s * 0.25, s * 0.32 * ax, s * 0.62, rot, col);
      P.ellipse(x + (dx + (dx ? (dx > 0 ? 0.18 : -0.18) : 0)) * s * ax, y - s * 0.75 + Math.abs(dx) * s * 0.3, s * 0.2 * ax, s * 0.2, 0, col);
    }
    P.rect(x - s * 0.55 * ax, y + s * 0.35, s * 1.1 * ax, s * 0.18, col);
    P.path([[x - s * 0.9 * ax, y + s * 0.62], [x - s * 0.5 * ax, y + s * 0.55], [x + s * 0.5 * ax, y + s * 0.55], [x + s * 0.9 * ax, y + s * 0.62], [x + s * 0.5 * ax, y + s * 0.7], [x - s * 0.5 * ax, y + s * 0.7]], col);
  }
  function creedMark(P, y, cap, col) {
    tx(P, 'CREED', y, cap, col, 'helv', { weight: 700, track: 0.18 });
    const w = cap * 2.6 * P.H / P.W;
    P.path([[0.5 - w, y + cap * 0.75], [0.5, y + cap * 1.05], [0.5 + w, y + cap * 1.35]], col, false, cap * 0.08);
    P.path([[0.5 - w, y + cap * 1.35], [0.5, y + cap * 1.05], [0.5 + w, y + cap * 0.75]], col, false, cap * 0.08);
  }
  function seal(P, ring, disc, mono, label = 'CD') {
    fullBg(P, 'rgba(0,0,0,0)'); P.circle(0.5, 0.5, 0.17, ring); P.circle(0.5, 0.5, 0.145, disc);
    P.text(label, 0.5, 0.5, 0.16, mono, { font: label === 'CC' ? 'sans' : 'serif', weight: 600, track: label === 'CC' ? -0.1 : 0 });
  }

  /* ---------- Creed: one template, paper and window label change ---------- */
  const creed = (o) => (item, fit) => Object.assign(prop(fit, 0.58, 0.33), {
    open: 'flap', paper: { color: o.paper, rough: 0.75 },
    front: (P) => {
      fullBg(P, o.paper);
      if (o.wave) waves(P, 'rgba(255,255,255,0.05)', 90); else stipple(P, o.speck || 'rgba(0,0,0,0.05)');
      feathers(P, 0.5, 0.14, 0.068, o.crest);
      P.rect(0.225, 0.25, 0.55, 0.32, o.frame || '#bfc3c6');
      P.rect(0.265, 0.28, 0.47, 0.255, o.plate);
      if (o.border) P.frame(0.285, 0.295, 0.43, 0.225, o.border, 0.003);
      (o.lines || [item.name.toUpperCase()]).forEach((l, i, a) => tx(P, l, 0.41 + (i - (a.length - 1) / 2) * 0.035, 0.018, o.plateInk, 'roman', { weight: 600, track: 0.08, maxW: 0.42 }));
      if (o.draw) o.draw(P);
      creedMark(P, 0.665, 0.035, o.ink);
      tx(P, 'DE PÈRE EN FILS DEPUIS 1760', 0.73, 0.012, o.ink, 'helv', { weight: 700, track: 0.12 });
      tx(P, 'FROM FATHER TO SON SINCE 1760', 0.755, 0.012, o.ink, 'helv', { weight: 700, track: 0.12 });
      tx(P, '100 ML', 0.957, 0.014, o.ink, 'helv', { x: 0.12, weight: 600 });
      tx(P, '3.3 FL.OZ.', 0.957, 0.014, o.ink, 'helv', { x: 0.86, weight: 600 });
    },
  });
  const horseman = (ink) => (P) => { P.ellipse(0.47, 0.38, 0.05, 0.03, -0.4, ink); P.path([[0.43, 0.4], [0.4, 0.46], [0.42, 0.46], [0.46, 0.41]], ink); P.path([[0.5, 0.39], [0.55, 0.45], [0.53, 0.46], [0.49, 0.41]], ink); P.circle(0.5, 0.335, 0.012, ink); P.path([[0.52, 0.355], [0.56, 0.33], [0.53, 0.37]], ink); };
  const CW = { paper: '#f6f5f2', crest: '#c9a24a', ink: '#1a1a1a' };

  /* ---------- Dior ---------- */
  const sauvage = (o) => (item, fit) => Object.assign(prop(fit, 0.63, 0.4), {
    open: 'flap', paper: { color: o.frame, rough: 0.4, metal: 0.25 },
    front: (P) => {
      fullBg(P, o.frame); P.rect(0.07, 0.06, 0.86, 0.89, o.panel);
      if (o.glow) { const g = P.g.createLinearGradient(0, 0.6 * P.H, 0, 0.95 * P.H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, o.glow); P.g.fillStyle = g; P.g.fillRect(0.07 * P.W, 0.6 * P.H, 0.86 * P.W, 0.35 * P.H); }
      tx(P, 'SAUVAGE', 0.39, 0.055, '#f2f2f2', 'serif', { weight: 500, track: 0.15, maxW: 0.72 });
      tx(P, o.sub, 0.47, 0.014, '#cfd3d8', 'helv', { track: 0.2 });
      tx(P, 'VAPORISATEUR SPRAY', 0.495, 0.012, '#cfd3d8', 'helv', { track: 0.2 });
      tx(P, 'Dior', 0.89, 0.045, '#f2f2f2', 'serif', { weight: 500 });
    },
    top: (P) => { fullBg(P, o.frame); P.line(0, 0, 1, 1, 'rgba(0,0,0,0.35)', 0.004); P.line(1, 0, 0, 1, 'rgba(0,0,0,0.35)', 0.004); seal(P, '#e8e8e8', '#0d0d0d', '#e8e8e8'); },
  });
  const homme = (o) => (item, fit) => Object.assign(prop(fit, 0.55, 0.4), {
    open: 'flap', paper: { color: o.paper, rough: o.metal ? 0.35 : 0.8, metal: o.metal || 0 },
    front: (P) => {
      fullBg(P, o.paper); if (o.brushed) brushed(P, 'rgba(255,255,255,0.18)'); if (o.pin) pinstripe(P, 'rgba(0,0,0,0.08)');
      P.rect(0.19, o.y0, 0.62, o.y1 - o.y0, '#0b0b0b');
      const m = (o.y0 + o.y1) / 2;
      tx(P, 'Dior', m - 0.05, 0.05, '#f2f2f2', 'serif'); tx(P, 'HOMME', m + 0.02, 0.022, '#f2f2f2', 'serif', { track: 0.15 });
      if (o.bee) { P.ellipse(0.5, m + 0.075, 0.012, 0.012, 0, '#f2f2f2'); P.ellipse(0.48, m + 0.068, 0.012, 0.006, 0.5, '#f2f2f2'); P.ellipse(0.52, m + 0.068, 0.012, 0.006, -0.5, '#f2f2f2'); }
      if (o.sub) tx(P, o.sub, o.subY || 0.6, 0.018, o.subInk || '#c8c8c8', o.subFont || 'serif', { track: 0.2 });
      tx(P, 'Dior', 0.88, 0.035, o.foot || 'rgba(255,255,255,0.5)', 'serif');
    },
  });
  const MCD = (item, fit) => ({
    shape: 'round', r: Math.max(0.22, fit.w * 0.62), h: fit.h + 0.18, lid: (fit.h + 0.18) * 0.3, arc: 1.6,
    paper: { color: '#f3f1ec', rough: 0.85 }, lining: { color: '#ffffff', rough: 0.9 },
    front: (P) => {
      P.rect(0.2, 0.4, 0.6, 0.15, '#fbfbf9'); P.frame(0.21, 0.405, 0.58, 0.14, '#8a8a8a', 0.002);
      tx(P, item.name.toUpperCase(), 0.445, 0.022, '#2a2a2a', 'serif', { maxW: 0.54 });
      tx(P, 'CHRISTIAN DIOR', 0.49, 0.012, '#2a2a2a', 'serif', { track: 0.1 });
      tx(P, 'PARIS', 0.52, 0.008, '#2a2a2a', 'serif', { track: 0.2 });
    },
  });

  /* ---------- Chanel ---------- */
  const chanel = (o) => (item, fit) => Object.assign(prop(fit, o.rw || 0.55, o.rd || 0.35), {
    open: 'flap', paper: { color: o.paper, rough: o.metal ? 0.3 : 0.6, metal: o.metal || 0 },
    front: (P) => {
      fullBg(P, o.paper); if (o.metal) brushed(P, 'rgba(255,255,255,0.22)', 220);
      if (o.border) { P.frame(0.0175, 0.0125, 0.965, 0.975, '#111', 0.025); }
      if (o.rim) { P.rect(0, 0, 1, 0.006, o.rim); P.rect(0, 0.994, 1, 0.006, o.rim); }
      o.lines.forEach(([s, y, cap, bold, col]) => tx(P, s, y, cap, col || o.ink, 'sans', { weight: bold ? 700 : 400, track: bold ? 0.3 : 0.25, maxW: 0.8 }));
      tx(P, '100 ml', 0.95, 0.013, o.dim || o.ink, 'sans', { x: 0.12, weight: 400 });
      tx(P, '3.4 FL.OZ.', 0.95, 0.013, o.dim || o.ink, 'sans', { x: 0.85, weight: 400 });
    },
    top: (P) => { fullBg(P, o.paper); seal(P, o.seal || '#c9a659', o.sealDisc || '#111', o.seal || '#c9a659', 'CC'); },
  });
  const bleu = (paper, ink, conc) => chanel({ rw: 0.76, rd: 0.36, paper, ink, seal: ink, lines: [['BLEU', 0.28, 0.04, 1], ['DE', 0.36, 0.015], ['CHANEL', 0.43, 0.04, 1], ['PARIS', 0.485, 0.016], [conc, 0.79, 0.018], ['POUR HOMME', 0.82, 0.018], ['VAPORISATEUR SPRAY', 0.885, 0.013]] });
  const allureSport = (paper, ink, sub, metal = 0.85) => chanel({ rw: 0.52, rd: 0.33, paper, ink, metal, seal: '#d8d8d8', sealDisc: paper, lines: [['ALLURE', 0.13, 0.045, 0], ['HOMME', 0.26, 0.022], [sub[0], 0.3, 0.022, 0, sub[1]], ['CHANEL', 0.56, 0.032, 1], ['EAU DE TOILETTE', 0.79, 0.016], ['VAPORISATEUR SPRAY', 0.82, 0.013]] });
  const exclusif = (item, fit) => chanel({ rw: 0.6, rd: 0.38, paper: '#ffffff', ink: '#111', border: true, seal: '#111', sealDisc: '#fff', lines: [[item.name.toUpperCase().replace(' CHANEL', ''), 0.33, 0.02], ['CHANEL', 0.42, 0.04, 1], ['PARIS', 0.47, 0.016], ['EAU DE PARFUM', 0.85, 0.016], ['VAPORISATEUR SPRAY', 0.88, 0.013]] })(item, fit);

  BoxCraft.add({
    /* Creed */
    creed: creed(Object.assign({ plate: '#c9ccd0', plateInk: '#2a2a2a' }, CW)),
    'creed|Aventus': creed({ paper: '#111111', wave: true, crest: '#d8d8d8', ink: '#c8c8c8', frame: '#0b0b0b', plate: '#cfd2d4', plateInk: '#111', lines: ['AVENTUS'], draw: horseman('#111') }),
    'creed|Aventus 10th Anniversary': creed({ paper: '#6a6e74', wave: true, crest: '#d8d8d8', ink: '#e0e0e0', frame: '#3a3c40', plate: '#d6b25a', plateInk: '#111', lines: ['AVENTUS', '10TH ANNIVERSARY'], draw: horseman('#3a2a10') }),
    'creed|Absolu Aventus': (item, fit) => Object.assign(prop(fit, 0.62, 0.4), { lid: 0.88, paper: { color: '#121212', rough: 0.5 }, lining: '#0b0b0b', front: (P) => { fullBg(P, '#121212'); waves(P, 'rgba(255,255,255,0.05)', 90); P.rect(0.22, 0.18, 0.56, 0.74, '#0b0b0b'); horseman('#c9b2a6')(P); tx(P, 'ABSOLU', 0.52, 0.02, '#cfd2d4', 'roman', { track: 0.15 }); tx(P, 'AVENTUS', 0.56, 0.02, '#cfd2d4', 'roman', { track: 0.15 }); creedMark(P, 0.75, 0.03, '#e8e8e8'); tx(P, 'DE PÈRE EN FILS DEPUIS 1760', 0.81, 0.011, '#e8e8e8', 'helv', { weight: 700, track: 0.12 }); } }),
    'creed|Aventus Cologne': creed({ paper: '#5a6670', crest: '#d8d8d8', ink: '#eceff2', plate: '#cfd2d4', plateInk: '#2a3440', lines: ['AVENTUS', 'COLOGNE'], draw: horseman('#2a3440'), speck: 'rgba(255,255,255,0.05)' }),
    'creed|Green Irish Tweed': creed(Object.assign({ plate: '#d8cf9a', plateInk: '#7a6a2a', frame: '#c0484a', lines: ['GREEN', 'IRISH TWEED'] }, CW)),
    'creed|Silver Mountain Water': creed(Object.assign({ plate: '#c9ccd0', plateInk: '#2a2a2a', lines: ['SILVER', 'MOUNTAIN WATER'] }, CW)),
    'creed|Royal Oud': creed(Object.assign({ plate: '#141414', plateInk: '#d2b064', border: '#c9a24a', lines: ['ROYAL OUD'] }, CW)),
    'creed|Millésime Impérial': creed(Object.assign({ plate: '#d6b25a', plateInk: '#5a4214', lines: ['MILLÉSIME', 'IMPÉRIAL'] }, CW)),
    'creed|Viking Cologne': creed({ paper: '#e8622a', crest: '#f4f4f4', ink: '#ffffff', plate: '#fbfbf9', plateInk: '#6a6a6a', lines: ['VIKING', 'COLOGNE'], speck: 'rgba(0,0,0,0.06)', draw: (P) => { P.path([[0.36, 0.38], [0.64, 0.38], [0.6, 0.42], [0.4, 0.42]], '#8a8a8a'); P.line(0.5, 0.3, 0.5, 0.38, '#8a8a8a', 0.003); P.rect(0.44, 0.31, 0.12, 0.05, '#b0b0b0'); } }),
    'creed|Viking': creed(Object.assign({ plate: '#b3202a', plateInk: '#f2f2f2', lines: ['VIKING'] }, CW)),
    'creed|Original Vetiver': creed(Object.assign({ plate: '#eef0ec', plateInk: '#2f6a3a', lines: ['ORIGINAL', 'VETIVER'] }, CW)),
    'creed|Original Santal': creed(Object.assign({ plate: '#d8b37a', plateInk: '#5a3a14', lines: ['ORIGINAL', 'SANTAL'] }, CW)),
    'creed|Himalaya': creed(Object.assign({ plate: '#c9ccd0', plateInk: '#2a4a8a', lines: ['HIMALAYA'] }, CW)),
    'creed|Virgin Island Water': creed(Object.assign({ plate: '#eef2f2', plateInk: '#1e8a9a', lines: ['VIRGIN', 'ISLAND WATER'] }, CW)),
    'creed|Bois du Portugal': creed(Object.assign({ plate: '#3a2414', plateInk: '#d2b064', lines: ['BOIS DU', 'PORTUGAL'] }, CW)),
    'creed|Erolfa': creed(Object.assign({ plate: '#c9ccd0', plateInk: '#1e3a7a', lines: ['EROLFA'] }, CW)),
    'creed|Royal Water': creed(Object.assign({ plate: '#d6b25a', plateInk: '#5a4214', lines: ['ROYAL WATER'] }, CW)),
    'creed|Tabarome': creed(Object.assign({ plate: '#4a3018', plateInk: '#d2b064', lines: ['TABAROME'] }, CW)),
    'creed|Carmina': creed(Object.assign({ plate: '#6a1424', plateInk: '#d2b064', lines: ['CARMINA'] }, CW)),
    'creed|Queen of Silk': creed(Object.assign({ plate: '#4a2470', plateInk: '#d2b064', lines: ['QUEEN', 'OF SILK'] }, CW)),

    /* Dior */
    dior: homme({ paper: '#f4f2ed', y0: 0.2, y1: 0.48, sub: '', foot: '#8a8a8a' }),
    'dior|Sauvage Eau de Toilette': sauvage({ frame: '#2b3340', panel: '#0d0f12', sub: 'EAU DE TOILETTE' }),
    'dior|Sauvage Eau de Parfum': sauvage({ frame: '#1f2a3d', panel: '#0d0f12', sub: 'EAU DE PARFUM' }),
    'dior|Sauvage Parfum': sauvage({ frame: '#1a2338', panel: '#0a0c10', sub: 'PARFUM', glow: 'rgba(30,60,140,0.6)' }),
    'dior|Sauvage Eau Forte': sauvage({ frame: '#5a6878', panel: '#20262e', sub: 'EAU FORTE', glow: 'rgba(120,150,190,0.4)' }),
    'dior|Sauvage Elixir': (item, fit) => Object.assign(prop(fit, 0.75, 0.62), { lid: 0.9, paper: { color: '#2e3034', rough: 0.4, metal: 0.3 }, lining: '#0b0b0b', front: (P) => { fullBg(P, '#2e3034'); P.rect(0.08, 0.07, 0.85, 0.83, '#0b0b0b'); P.rect(0, 0.9, 1, 0.1, '#0b0b0b'); tx(P, 'SAUVAGE', 0.33, 0.06, '#c9cbcf', 'serif', { track: 0.15, maxW: 0.7 }); tx(P, 'ELIXIR', 0.43, 0.02, '#c9cbcf', 'helv', { weight: 700, track: 0.3 }); tx(P, 'VAPORISATEUR SPRAY', 0.47, 0.012, '#c9cbcf', 'helv', { track: 0.2 }); tx(P, 'Dior', 0.83, 0.05, '#c9cbcf', 'serif'); } }),
    'dior|Dior Homme Intense': homme({ paper: '#1c1c1c', y0: 0.17, y1: 0.5, sub: 'INTENSE', subInk: '#c8c8c8' }),
    'dior|Dior Homme': homme({ paper: '#b9bbbd', metal: 0.6, brushed: true, y0: 0.22, y1: 0.5, bee: true, foot: '#e8e8e8' }),
    'dior|Dior Homme 2005': homme({ paper: '#b9bbbd', metal: 0.6, brushed: true, y0: 0.22, y1: 0.5, foot: '#e8e8e8' }),
    'dior|Dior Homme Sport': homme({ paper: '#f1efe9', pin: true, y0: 0.1, y1: 0.38, bee: true, sub: 'SPORT', subY: 0.47, subInk: '#c8202a', subFont: 'helv', foot: '#8a8a8a' }),
    'dior|Dior Homme Parfum': homme({ paper: '#2a2a2c', y0: 0.17, y1: 0.5, sub: 'PARFUM', subInk: '#b8a07a' }),
    'dior|Fahrenheit': (item, fit) => Object.assign(prop(fit, 0.55, 0.4), { open: 'flap', paper: '#0e0e0e', front: (P) => { fullBg(P, '#0e0e0e'); const g = P.g.createLinearGradient(0, 0, 0, P.H); g.addColorStop(0, '#c01f1f'); g.addColorStop(0.5, '#6a0d0d'); g.addColorStop(0.85, '#140606'); P.g.fillStyle = g; P.g.fillRect(0.08 * P.W, 0.05 * P.H, 0.84 * P.W, 0.9 * P.H); tx(P, 'Fahrenheit', 0.18, 0.06, '#ffffff', 'serif', { maxW: 0.8 }); tx(P, 'EAU DE TOILETTE', 0.53, 0.014, '#e8b0a8', 'helv', { track: 0.2 }); tx(P, 'VAPORISATEUR SPRAY', 0.56, 0.012, '#e8b0a8', 'helv', { track: 0.2 }); tx(P, 'Dior', 0.88, 0.05, '#ffffff', 'serif'); } }),
    'dior|Eau Sauvage': (item, fit) => Object.assign(prop(fit, 0.55, 0.35), { open: 'flap', paper: '#f4f2ed', front: (P) => { fullBg(P, '#f4f2ed'); P.line(0.2, 0.34, 0.8, 0.34, '#111', 0.002); tx(P, 'EAU SAUVAGE', 0.4, 0.04, '#111', 'serif', { track: 0.12, maxW: 0.8 }); P.line(0.2, 0.46, 0.8, 0.46, '#111', 0.002); tx(P, 'Dior', 0.55, 0.035, '#111', 'serif'); tx(P, 'EAU DE TOILETTE', 0.85, 0.014, '#111', 'helv', { track: 0.2 }); } }),
    'dior|Oud Ispahan': MCD, 'dior|Ambre Nuit': MCD, 'dior|Gris Dior': MCD, "dior|Bois d'Argent": MCD, 'dior|Tobacolor': MCD, 'dior|Fève Délicieuse': MCD, 'dior|Vanilla Diorama': MCD, 'dior|Spice Blend': MCD,

    /* Chanel */
    chanel: (item, fit) => chanel({ paper: '#f4f1ea', ink: '#111', border: true, seal: '#111', sealDisc: '#f4f1ea', lines: [[item.name.toUpperCase(), 0.3, 0.03, 1], ['CHANEL', 0.42, 0.035, 1], ['PARIS', 0.47, 0.016], ['EAU DE TOILETTE', 0.85, 0.016]] })(item, fit),
    'chanel|Bleu de Chanel Eau de Toilette': bleu('#1f2633', '#d8dce2', 'EAU DE TOILETTE'),
    'chanel|Bleu de Chanel Eau de Parfum': bleu('#141a24', '#a7adb5', 'EAU DE PARFUM'),
    'chanel|Bleu de Chanel Parfum': bleu('#1c2338', '#d2b277', 'PARFUM'),
    'chanel|Allure Homme Sport': allureSport('#bfc1c3', '#111', ['SPORT', '#b0202e']),
    'chanel|Allure Homme Sport Eau Extrême': allureSport('#3a3d41', '#e8e8e8', ['SPORT', '#d0303a']),
    'chanel|Allure Homme Édition Blanche': allureSport('#f2f0ea', '#6a6a6a', ['ÉDITION BLANCHE', '#a8a8a8'], 0.2),
    'chanel|Égoïste Platinum': chanel({ rw: 0.55, paper: '#b8babc', metal: 0.85, ink: '#111', seal: '#d8d8d8', sealDisc: '#b8babc', lines: [['ÉGOÏSTE', 0.16, 0.04, 1], ['PLATINUM', 0.24, 0.02], ['CHANEL', 0.56, 0.032, 1], ['PARIS', 0.6, 0.014], ['EAU DE TOILETTE', 0.8, 0.016]] }),
    'chanel|Égoïste': chanel({ rw: 0.55, paper: '#111111', ink: '#b4573a', seal: '#b4573a', lines: [['ÉGOÏSTE', 0.2, 0.04, 1], ['POUR HOMME', 0.27, 0.016], ['CHANEL', 0.56, 0.032, 1], ['PARIS', 0.6, 0.014], ['EAU DE TOILETTE', 0.8, 0.016]] }),
    'chanel|Antaeus': chanel({ rw: 0.55, paper: '#b8324e', metal: 0.5, ink: '#ffffff', seal: '#f2d0d8', sealDisc: '#b8324e', lines: [['ANTAEUS', 0.22, 0.04, 1], ['POUR HOMME', 0.27, 0.016], ['CHANEL', 0.68, 0.032, 1], ['PARIS', 0.73, 0.014], ['EAU DE TOILETTE', 0.82, 0.016]] }),
    'chanel|Pour Monsieur': chanel({ paper: '#f4f1ea', ink: '#111', border: true, seal: '#111', sealDisc: '#f4f1ea', lines: [['POUR MONSIEUR', 0.3, 0.028, 1], ['CHANEL', 0.42, 0.035, 1], ['PARIS', 0.47, 0.016], ['EAU DE TOILETTE', 0.85, 0.016]] }),
    'chanel|Sycomore': exclusif, 'chanel|Coromandel': exclusif, 'chanel|Le Lion': exclusif, 'chanel|Boy Chanel': exclusif,
    'chanel|Coco Mademoiselle': chanel({ rw: 0.58, rd: 0.33, paper: '#ece6da', ink: '#111', rim: '#c9a659', seal: '#c9a659', lines: [['COCO', 0.16, 0.04, 0], ['MADEMOISELLE', 0.21, 0.016], ['CHANEL', 0.3, 0.032, 1], ['PARIS', 0.34, 0.014], ['EAU DE PARFUM', 0.81, 0.016], ['VAPORISATEUR SPRAY', 0.85, 0.013]] }),
    'chanel|N°5': chanel({ rw: 0.62, rd: 0.4, paper: '#ffffff', ink: '#111', border: true, seal: '#111', sealDisc: '#fff', lines: [['N°5', 0.3, 0.05, 1], ['CHANEL', 0.4, 0.03, 1], ['PARIS', 0.45, 0.014], ['EAU DE PARFUM', 0.84, 0.016], ['VAPORISATEUR SPRAY', 0.87, 0.013]] }),
  });

  // Any other house: a tuck carton in the house colours with a framed name plate.
  BoxCraft.add({
    '*': (item, fit) => {
      const h = HOUSE_BY_ID[item.house], gold = item.tier === 'legendary' || item.tier === 'haute';
      return Object.assign(prop(fit, 0.6, 0.38), {
        open: 'flap', paper: { color: h.lbg, rough: gold ? 0.35 : 0.6, metal: gold ? 0.3 : 0 },
        front: (P) => {
          fullBg(P, h.lbg); P.frame(0.06, 0.04, 0.88, 0.92, gold ? '#d8ae54' : h.lfg, 0.003);
          tx(P, h.name.toUpperCase(), 0.2, 0.03, h.lfg, 'serif', { weight: 600, track: 0.15, maxW: 0.78 });
          P.line(0.4, 0.26, 0.6, 0.26, h.lfg, 0.0015);
          tx(P, item.name, 0.42, 0.045, h.lfg, 'serif', { italic: true, maxW: 0.78 });
          tx(P, h.origin.toUpperCase(), 0.86, 0.012, h.lfg, 'sans', { track: 0.3 });
          tx(P, '100 ml ℮ 3.4 FL. OZ.', 0.91, 0.011, h.lfg, 'sans', { track: 0.1 });
        },
        top: (P) => { fullBg(P, h.lbg); tx(P, h.name.toUpperCase(), 0.5, 0.12, h.lfg, 'serif', { weight: 600, maxW: 0.8 }); },
      });
    },
  });

  BoxCraft.lib = { prop, tx, rnd, stipple, brushed, pinstripe, waves, fullBg, seal, feathers };
})();
