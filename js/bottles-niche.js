/* Sillage — niche houses modelled from reference photos: Xerjoff, Amouage, Initio,
 * Kilian, Roja, Nishane, Baccarat, Maison Crivelli and DKNY.
 * Most of these houses pour a whole line into one flacon, so each line is a template
 * and every fragrance passes its own glass, juice, cap and label; the one-off bottles
 * (Mefisto, Guidance, Oud for Greatness, Diaghilev, the Kilian liquor crystals,
 * Les Larmes Sacrées de Thèbes, the Golden Delicious Million Dollar apple) get their own geometry.
 */
(() => {
  const B = BottleCraft.tools;
  const { kit, box, cyl, sphere, lathe, bands, merge, gradient, glass, solid, fin, paint, S, profile } = B;
  const T = () => B.T;

  /* ---------- shared helpers ---------- */
  const rnd = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const metal = (color, rough = 0.24) => solid({ color, metal: 1, rough, coat: 0, env: 2.4 });
  const ROSE = '#e8ab8c', GOLD = '#e2bb62';
  const gem = (color, o = {}) => solid({ color, rough: 0.04, coat: 1, flat: true, env: o.env || 2.6, metal: o.metal || 0.15 });
  // Unlit juice inside a glass shell keeps its true colour.
  function juice(k, geo, color, o = {}) {
    const jg = geo.clone(); const ins = o.inset || 0.92; jg.scale(ins, o.level || 0.88, o.insetZ || ins); jg.translate(0, o.lift != null ? o.lift : 0.025, 0);
    k.part(jg, new (T().MeshBasicMaterial)({ color: B.C(color), transparent: true, opacity: o.op || 0.9, depthWrite: false }), 1);
  }
  // Octagonal prism: a box with its vertical edges chamfered by c, standing on y0.
  function cham(w, d, h, c, y0 = 0) {
    const t = T(), s = new t.Shape(), bv0 = Math.min(0.012, h / 6) * 0.7, x = w / 2 - bv0, z = d / 2 - bv0;
    [[-x + c, -z], [x - c, -z], [x, -z + c], [x, z - c], [x - c, z], [-x + c, z], [-x, z - c], [-x, -z + c]].forEach(([a, b], i) => (i ? s.lineTo(a, b) : s.moveTo(a, b)));
    const bv = Math.min(0.012, h / 6);
    const g = new t.ExtrudeGeometry(s, { depth: h - 2 * bv, bevelEnabled: true, bevelThickness: bv, bevelSize: bv * 0.7, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2); g.translate(0, y0 + bv, 0);
    return g;
  }
  // A lathe with flat facets, one facet facing the front.
  function facetLathe(pts, seg, sz = 1, y0 = 0) { const g = lathe(pts, 0, 1, seg); g.rotateY(Math.PI / seg); g.scale(1, 1, sz); g.translate(0, y0, 0); return g; }
  const ax = (P) => P.H / P.W;
  // Multi-stop vertical gradient baked into vertex colours: stops are [t (0 bottom .. 1 top), '#hex'].
  function gradStops(geo, stops) {
    const t = T(), p = geo.attributes.position; let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < p.count; i++) { lo = Math.min(lo, p.getY(i)); hi = Math.max(hi, p.getY(i)); }
    const cs = stops.map(([u, h]) => [u, B.C(h)]), c = new t.Color(), col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const u = (p.getY(i) - lo) / (hi - lo || 1); let j = 1; while (j < cs.length - 1 && u > cs[j][0]) j++;
      const [u0, c0] = cs[j - 1], [u1, c1] = cs[j]; c.copy(c0).lerp(c1, Math.min(1, Math.max(0, (u - u0) / (u1 - u0 || 1))));
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('color', new t.BufferAttribute(col, 3));
    return geo;
  }

  /* ---------- Xerjoff: the 1861 / Shooting Stars flacon ---------- */
  const XJ_PTS = [[0, 0], [0.17, 0], [0.185, 0.015], [0.21, 0.1], [0.228, 0.25], [0.232, 0.4], [0.222, 0.48], [0.19, 0.545], [0.125, 0.595], [0.068, 0.615], [0, 0.62]];
  const XJ_Z = 0.74;
  function xjCap(k, y, capMat, o = {}) {
    // Engraved collar with two rims, then the faceted spire cap.
    k.part(cyl(0.068, 0.068, 0.055, y, 32), capMat);
    for (const dy of [0, 0.045]) k.part(cyl(0.078, 0.078, 0.012, y + dy, 32), capMat);
    k.wrap(0.07, 0.03, y + 0.028, 1.6, paint(1.6 * 0.07, 0.03, (P) => P.text(o.collar || 'XERJOFF', 0.5, 0.55, 0.7, 'rgba(70,40,20,0.75)', { font: 'roman', weight: 600, track: 0.1 })));
    const c = facetLathe([[0, 0], [0.07, 0], [0.085, 0.02], [0.098, 0.07], [0.1, 0.1], [0.085, 0.118], [0.075, 0.13], [0.06, 0.17], [0.035, 0.22], [0.008, 0.26], [0, 0.262]], 8, 1, y + 0.057);
    k.part(c, capMat);
    k.part(cyl(0.1, 0.1, 0.012, y + 0.155, 8), capMat);
  }
  // Raised gold plaque with the X monogram.
  function xjPlaque(P, gold = '#d9b468', light = '#f2dcae') {
    P.rect(0, 0, 1, 1, gold); P.rect(0.08, 0.06, 0.84, 0.88, light); P.frame(0.12, 0.09, 0.76, 0.82, gold, 0.012);
    P.text('X', 0.5, 0.5, 0.62, '#b68a40', { font: 'serif', weight: 400, shadow: 'rgba(255,255,255,0.6)' });
  }
  const xj = (o) => (item) => {
    const k = kit();
    const geo = facetLathe(XJ_PTS, 12, XJ_Z);
    if (o.stops) gradStops(geo, o.stops); else if (o.grad) gradient(geo, o.grad[0], o.grad[1], o.gc || 1);
    k.solidBody(geo, solid({ color: o.color, grad: !!(o.grad || o.stops), rough: o.rough != null ? o.rough : 0.3, coat: 0.25, env: o.env || 0.8, flat: true }));
    const capMat = metal(o.cap === 'gold' ? GOLD : ROSE, 0.22);
    k.part(box(0.13, 0.025, 0.2, 0.006, 0.21).translate(0, 0, 0.158), metal(o.cap === 'gold' ? GOLD : '#e2b48a'));
    k.flat(0.12, 0.19, 0, 0.31, 0.172, paint(0.12, 0.19, (P) => xjPlaque(P)), { foil: true });
    const ink = o.ink || '#d9b06a';
    k.flat(0.32, 0.16, 0, 0.115, 0.157, paint(0.32, 0.16, (P) => {
      if (o.logo) o.logo(P, ink);
      const lines = o.lines || [item.name.toUpperCase()];
      lines.forEach((s, i) => P.text(s, 0.5, (o.ly || 0.62) + i * 0.17, o.ls || 0.15, ink, { font: 'roman', weight: 600, track: 0.12, maxW: 0.8 }));
    }));
    xjCap(k, 0.62, capMat);
    k.top(0.62);
    return k.done();
  };
  // The Naxos crest: a little coat of arms over the Italian tricolour ribbon.
  const naxosLogo = (P) => {
    P.rect(0.44, 0.04, 0.12, 0.16, '#c9a35a', 0.01); P.text('1861', 0.5, 0.3, 0.07, '#c9a35a', { font: 'roman' });
    P.path([[0.3, 0.42], [0.42, 0.34], [0.5, 0.4], [0.58, 0.34], [0.7, 0.42]], '#2a8a3a', false, 0.04);
    P.path([[0.33, 0.47], [0.43, 0.4], [0.5, 0.45], [0.57, 0.4], [0.67, 0.47]], '#c81e2a', false, 0.04);
  };
  const alexLogo = (P, ink) => { P.text('A', 0.5, 0.22, 0.36, ink, { font: 'roman', weight: 500 }); };

  // Casamorati Mefisto: stepped blue flacon with flared shoulders and a navy tassel.
  const mefisto = () => {
    const k = kit(), t = T();
    const pts = [[-0.17, 0], [0.17, 0], [0.17, 0.36], [0.195, 0.45], [0.215, 0.53], [0.21, 0.6], [0.13, 0.6], [0.075, 0.625], [-0.075, 0.625], [-0.13, 0.6], [-0.21, 0.6], [-0.215, 0.53], [-0.195, 0.45], [-0.17, 0.36]];
    const geo = profile(pts, 0.22, 0.03); gradient(geo, '#0c2490', '#1a3cb4', 1);
    k.solidBody(geo, solid({ grad: true, rough: 0.2, coat: 0.4, env: 0.9 }));
    k.flat(0.38, 0.56, 0, 0.32, 0.113, paint(0.38, 0.56, (P) => {
      const e = 'rgba(150,180,255,0.55)', d = 'rgba(8,20,70,0.6)';
      // Arched CASAMORATI emboss and the CJ monogram medallion.
      const g = P.g; g.save(); g.font = `600 ${0.06 * P.H}px "Trajan Pro", "Times New Roman", serif`; g.fillStyle = e; g.textAlign = 'center'; g.textBaseline = 'middle';
      const word = 'CASAMORATI', n = word.length;
      for (let i = 0; i < n; i++) { const a = -0.75 + (i / (n - 1)) * 1.5; g.save(); g.translate(P.W * (0.5 + Math.sin(a) * 0.44), P.H * (0.27 - Math.cos(a) * 0.17)); g.rotate(a); g.fillText(word[i], 0, 0); g.restore(); }
      g.restore();
      P.ellipse(0.5, 0.24, 0.16, 0.085, 0, d); P.ellipse(0.5, 0.24, 0.13, 0.07, 0, e);
      P.text('C', 0.46, 0.24, 0.09, d, { font: 'serif', italic: true }); P.text('J', 0.54, 0.25, 0.09, d, { font: 'serif', italic: true });
      // The painted shield label.
      P.path([[0.2, 0.58], [0.8, 0.58], [0.82, 0.78], [0.5, 0.95], [0.18, 0.78]], '#e8e2d2');
      P.g.save(); P.g.beginPath(); [[0.22, 0.6], [0.78, 0.6], [0.8, 0.77], [0.5, 0.92], [0.2, 0.77]].forEach(([x, y], i) => (i ? P.g.lineTo(x * P.W, y * P.H) : P.g.moveTo(x * P.W, y * P.H))); P.g.closePath(); P.g.clip();
      P.rect(0.2, 0.58, 0.6, 0.36, '#2a4ab0'); P.ellipse(0.38, 0.68, 0.2, 0.08, 0.4, '#c8302a'); P.ellipse(0.66, 0.8, 0.18, 0.07, -0.5, '#e8a030'); P.ellipse(0.5, 0.86, 0.22, 0.05, 0.1, '#1a2a6a'); P.circle(0.62, 0.66, 0.04, '#f2ead8');
      P.g.restore();
      P.text('MEFISTO', 0.5, 0.97, 0.03, '#e8e2d2', { font: 'roman', weight: 600, track: 0.15 });
    }));
    // Tassel: a cord from the right shoulder and the tasselled bundle.
    const navy = solid({ color: '#1a2350', rough: 0.8, coat: 0 });
    const c = new t.CatmullRomCurve3([new t.Vector3(0.14, 0.62, 0.02), new t.Vector3(0.22, 0.6, 0.05), new t.Vector3(0.25, 0.48, 0.06), new t.Vector3(0.255, 0.4, 0.06)]);
    k.part(new t.TubeGeometry(c, 20, 0.012, 8), navy);
    k.part(sphere(0.022, 0.39).translate(0.255, 0, 0.06), metal(GOLD));
    const tas = cyl(0.02, 0.06, 0.26, 0.12, 24, 0.255, 0.06); k.part(tas, navy);
    
    xjCap(k, 0.625, metal(GOLD), { collar: 'CASAMORATI' });
    k.top(0.62);
    return k.done();
  };

  /* ---------- Amouage ---------- */
  // The sunburst crest: a ring of beads round a knotted rosette.
  function crest(P, cx, cy, r, c, d) {
    const a = ax(P);
    for (let i = 0; i < 16; i++) { const t = (i / 16) * Math.PI * 2; P.circle(cx + Math.cos(t) * r * 1.02 * a, cy + Math.sin(t) * r * 1.02, r * 0.11, c); P.line(cx + Math.cos(t) * r * 0.7 * a, cy + Math.sin(t) * r * 0.7, cx + Math.cos(t) * r * 0.92 * a, cy + Math.sin(t) * r * 0.92, c, r * 0.06); }
    P.circle(cx, cy, r * 0.75, c); P.circle(cx, cy, r * 0.62, d, r * 0.04);
    for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2; P.ellipse(cx + Math.cos(t) * r * 0.28 * a, cy + Math.sin(t) * r * 0.28, r * 0.24 * a, r * 0.12, t, d); }
    P.circle(cx, cy, r * 0.12, c);
  }
  // Front outline of the men's cap: a narrow stem that flares into wide wings.
  const AM_CAP = [[-0.06, 0], [0.06, 0], [0.066, 0.06], [0.09, 0.12], [0.13, 0.165], [0.18, 0.195], [0.185, 0.235], [0.11, 0.225], [0, 0.235], [-0.11, 0.225], [-0.185, 0.235], [-0.18, 0.195], [-0.13, 0.165], [-0.09, 0.12], [-0.066, 0.06]];
  const amouage = (o) => (item) => {
    const k = kit();
    const W = 0.42, H = 0.58, D = 0.19;
    const geo = box(W, D, H, 0.025);
    if (o.juice) {
      k.glassBody(geo, glass({ op: 0.1, env: 1.6 }), null);
      juice(k, box(W, D, H, 0.025), o.juice, { level: 0.88, inset: 0.94, lift: 0.035, op: 0.95 });
      k.part(box(W, D, 0.04, 0.02), glass({ op: 0.4 }));
    } else {
      if (o.grad) gradient(geo, o.grad[0], o.grad[1], o.gc || 1);
      k.solidBody(geo, solid({ color: o.color, grad: !!o.grad, rough: 0.2, coat: 0.3, env: 0.8 }));
    }
    const ink = o.ink || '#e6cf98', cr = o.crest || ink;
    k.flat(W * 0.9, H * 0.6, 0, 0.27, D / 2 + 0.003, paint(W * 0.9, H * 0.6, (P) => {
      if (o.draw) o.draw(P);
      crest(P, 0.5, 0.3, 0.19, cr, o.crestDark || 'rgba(0,0,0,0.35)');
      P.text('AMOUAGE', 0.5, 0.66, 0.1, ink, { font: 'roman', weight: 600, track: 0.18 });
      P.text(o.title || item.name.replace(/ Man$/, '').toUpperCase(), 0.5, 0.8, 0.065, ink, { font: o.titleFont || 'roman', weight: 600, track: 0.2, maxW: 0.84 });
    }), { foil: !!o.foil });
    const capMat = o.capColor ? solid({ color: o.capColor, rough: 0.3, coat: 0.5, env: 1.4 }) : fin(o.cap || 'gold');
    k.part(cyl(0.065, 0.065, 0.02, H, 32), fin(o.collar || (o.cap === 'silver' ? 'silver' : 'gold')));
    const cg = profile(AM_CAP, 0.17, 0.025); cg.translate(0, H + 0.02, 0); k.part(cg, capMat);
    k.part(sphere(0.02, H + 0.2, 1, 1, 0.6).translate(0, 0, 0.084), gem(o.gem || '#1a3ab0'));
    k.top(H);
    return k.done();
  };
  // Guidance: the rounded women's flacon with a ribbed dome cap.
  const guidance = (item) => {
    const k = kit();
    const W = 0.6, H = 0.5, D = 0.22;
    k.solidBody(gradient(box(W, D, H, 0.09), '#eeb1a2', '#f4c4b6', 1), solid({ grad: true, rough: 0.15, coat: 0.4, env: 1 }));
    k.flat(W * 0.8, H * 0.7, 0, 0.24, D / 2 + 0.003, paint(W * 0.8, H * 0.7, (P) => {
      crest(P, 0.5, 0.36, 0.15, 'rgba(200,140,120,0.9)', 'rgba(255,230,220,0.6)');
      P.text('AMOUAGE', 0.5, 0.68, 0.085, '#e8b896', { font: 'roman', weight: 600, track: 0.12 });
      P.text('GUIDANCE', 0.5, 0.8, 0.05, '#e8b896', { font: 'roman', weight: 600, track: 0.2 });
    }), { foil: true });
    k.part(cyl(0.09, 0.09, 0.03, H, 32), fin('gold'));
    k.part(lathe([[0, 0], [0.13, 0], [0.135, 0.03], [0.13, 0.08], [0.11, 0.12], [0.07, 0.15], [0.02, 0.165], [0, 0.166]], H + 0.03, 1, 18), solid({ color: '#d9a89a', rough: 0.3, coat: 0.4, flat: true, env: 1.2 }));
    k.part(sphere(0.02, H + 0.205), metal('#e2b49a'));
    k.top(H);
    return k.done();
  };

  /* ---------- Initio ---------- */
  // The filigree diamond medallion.
  function filigree(P, base, line) {
    P.path([[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]], base);
    P.path([[0.5, 0.06], [0.94, 0.5], [0.5, 0.94], [0.06, 0.5], [0.5, 0.06]], line, false, 0.02);
    const g = P.g; g.save(); g.strokeStyle = line; g.lineWidth = 0.022 * P.H; g.lineCap = 'round';
    for (let i = 0; i < 34; i++) {
      const x = 0.2 + rnd(i) * 0.6, y = 0.2 + rnd(i + 30) * 0.6; if (Math.abs(x - 0.5) + Math.abs(y - 0.5) > 0.38) continue;
      const r = 0.03 + rnd(i + 60) * 0.05;
      g.beginPath(); g.arc(x * P.W, y * P.H, r * P.H, rnd(i + 90) * 6, rnd(i + 90) * 6 + 3.8); g.stroke();
    }
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 0.008 * P.H;
    for (let i = 0; i < 20; i++) { const x = 0.25 + rnd(i + 5) * 0.5, y = 0.25 + rnd(i + 35) * 0.5; if (Math.abs(x - 0.5) + Math.abs(y - 0.5) > 0.36) continue; g.beginPath(); g.arc(x * P.W, y * P.H, 0.035 * P.H, rnd(i + 7) * 6, rnd(i + 7) * 6 + 2.5); g.stroke(); }
    g.restore();
    P.text('I', 0.5, 0.5, 0.3, line, { font: 'serif', weight: 700 });
  }
  const IW = 0.4, IH = 0.52, ID = 0.24;
  function initioShell(k, color, capColor) {
    const mat = solid({ color, rough: 0.6, coat: 0.1, env: 0.7 });
    k.solidBody(cham(IW, ID, IH, 0.04), mat);
    k.part(cyl(0.075, 0.075, 0.08, IH, 32), solid({ color: capColor || color, rough: 0.6, coat: 0.1, env: 0.7 }));
    const cap = cham(0.4, 0.24, 0.13, 0.04, IH + 0.08);
    // Flare the cap outward towards its top.
    const p = cap.attributes.position; for (let i = 0; i < p.count; i++) { const f = 0.9 + 0.1 * (p.getY(i) - IH - 0.08) / 0.13; p.setX(i, p.getX(i) * f); p.setZ(i, p.getZ(i) * f); }
    cap.computeVertexNormals();
    k.part(cap, solid({ color: capColor || color, rough: 0.6, coat: 0.1, env: 0.7 }));
    k.flat(0.18, 0.05, 0, IH + 0.21 + 0.002, 0, paint(0.18, 0.05, (P) => P.text('INITIO', 0.5, 0.5, 0.6, 'rgba(255,255,255,0.35)', { font: 'roman', track: 0.3 })));
  }
  const initio = (o) => () => {
    const k = kit();
    initioShell(k, o.color, o.capColor);
    const m = new (T().BoxGeometry)(0.155, 0.155, 0.02); m.rotateZ(Math.PI / 4); m.translate(0, 0.23, ID / 2 + 0.005); k.part(m, metal(o.metal || '#d8c08a', 0.3));
    k.flat(0.215, 0.215, 0, 0.23, ID / 2 + 0.017, paint(0.215, 0.215, (P) => filigree(P, o.metal || '#d8c08a', o.line || '#7a6430')), { foil: true });
    k.top(IH);
    return k.done();
  };
  // Oud for Greatness: black with the gold-printed Black Gold Project seal.
  const ofg = () => {
    const k = kit();
    initioShell(k, '#121212');
    k.part(cyl(0.072, 0.072, 0.05, IH + 0.01, 32), metal(GOLD, 0.3));
    k.flat(IW - 0.02, IH - 0.02, 0, IH / 2, ID / 2 + 0.004, paint(IW - 0.02, IH - 0.02, (P) => {
      const gd = '#d8b260', a = ax(P);
      P.frame(0.04, 0.04, 0.92, 0.92, gd, 0.006);
      P.path([[0.5, 0.06], [0.95, 0.52], [0.5, 0.96], [0.05, 0.52], [0.5, 0.06]], gd, false, 0.008);
      P.circle(0.5, 0.52, 0.3, gd, 0.012); P.circle(0.5, 0.52, 0.26, gd, 0.004); P.circle(0.5, 0.52, 0.2, gd, 0.004);
      P.path([[0.5, 0.3], [0.72, 0.68], [0.28, 0.68], [0.5, 0.3]], gd, false, 0.006);
      P.ellipse(0.5, 0.54, 0.09, 0.04, 0, gd); P.circle(0.5, 0.54, 0.03, '#121212'); P.circle(0.5, 0.54, 0.014, gd);
      for (let i = 0; i < 24; i++) { const t = (i / 24) * Math.PI * 2; P.line(0.5 + Math.cos(t) * 0.21 * a, 0.52 + Math.sin(t) * 0.21, 0.5 + Math.cos(t) * 0.25 * a, 0.52 + Math.sin(t) * 0.25, gd, 0.004); }
      P.text('BLACK GOLD PROJECT', 0.5, 0.15, 0.04, gd, { font: 'roman', weight: 600, track: 0.1 });
      P.rect(0.14, 0.86, 0.72, 0.07, gd); P.text('OUD FOR GREATNESS', 0.5, 0.897, 0.045, '#121212', { font: 'roman', weight: 700, track: 0.04 });
    }), { foil: true });
    k.top(IH);
    return k.done();
  };

  /* ---------- Kilian ---------- */
  // The classic rectangular flacon: thick clear glass round a lacquered inner panel and a framed plaque.
  const kilian = (o) => () => {
    const k = kit();
    const W = 0.42, H = 0.56, D = 0.2;
    k.glassBody(box(W, D, H, 0.02), glass({ op: 0.07, env: 1.4 }), null);
    k.part(box(W - 0.03, D - 0.03, H - 0.09, 0.008, 0.065), solid({ color: o.color, rough: 0.25, coat: 0.5, env: 0.7 }));
    const plq = o.plaque || (o.cap === 'gunmetal' ? '#b8bcc2' : '#d8b878');
    k.part(box(0.155, 0.012, 0.215, 0.004, 0.225).translate(0, 0, D / 2 - 0.01), metal(o.cap === 'gunmetal' ? '#c8ccd2' : GOLD));
    k.flat(0.145, 0.205, 0, 0.3325, D / 2 + 0.003, paint(0.145, 0.205, (P) => {
      P.rect(0, 0, 1, 1, plq); P.frame(0.07, 0.05, 0.86, 0.9, o.pink || 'rgba(0,0,0,0.35)', 0.008);
      const ink = o.ink || '#2a2116';
      o.lines.forEach((s, i) => P.text(s, 0.5, 0.2 + i * 0.12, 0.1, ink, { font: 'serif', italic: true, maxW: 0.82 }));
      P.text('by', 0.5, 0.2 + o.lines.length * 0.12, 0.06, ink, { font: 'serif', italic: true });
      P.text('Kilian', 0.5, 0.36 + o.lines.length * 0.12, 0.19, ink, { font: 'serif', italic: true });
      if (o.sub) P.text(o.sub, 0.5, 0.88, 0.05, ink, { font: 'serif' });
    }), { foil: true });
    const cm = fin(o.cap || 'gold');
    k.part(cyl(0.06, 0.06, 0.03, H, 32), cm);
    k.part(cyl(0.068, 0.068, 0.17, H + 0.03, 40), cm);
    k.top(H);
    return k.done();
  };
  // The Liquors crystal: a carved whisky decanter block with a gold diamond plaque.
  let carveTex = null;
  const carve = () => carveTex || (carveTex = (() => {
    const t = paint(1, 1, (P) => {
      P.rect(0, 0, 1, 1, '#000000');
      for (let i = -10; i < 20; i++) { const x = i * 0.1; P.line(x, 0, x + 0.4, 0.5, '#ffffff', 0.03); P.line(x + 0.04, 0, x + 0.44, 0.5, '#7a7a7a', 0.016); P.line(x, 1, x + 0.4, 0.5, '#ffffff', 0.03); P.line(x + 0.04, 1, x + 0.44, 0.5, '#7a7a7a', 0.016); }
    }, 256);
    t.wrapS = t.wrapT = T().RepeatWrapping; t.repeat.set(2.4, 2.4);
    return t;
  })());
  const liquor = (o) => (item) => {
    const k = kit();
    const tex = carve();
    const mat = glass({ op: 0.16, bump: tex, bumpScale: 0.06, env: 2.4 }); mat.emissive = new (T().Color)(0xffffff); mat.emissiveMap = tex; mat.emissiveIntensity = 1.1;
    const W = 0.56, D = 0.48, H = 0.44;
    k.glassBody(box(W, D, H, 0.08), mat, null);
    // Juice seen through the cuts: light and dark diagonal facets over the liquor colour.
    const jt = paint(1, 1, (P) => { P.rect(0, 0, 1, 1, '#ffffff'); for (let i = -10; i < 20; i++) { const x = i * 0.1; P.path([[x, 0], [x + 0.05, 0], [x + 0.45, 0.5], [x + 0.4, 0.5]], 'rgba(90,50,0,0.45)'); P.path([[x, 1], [x + 0.05, 1], [x + 0.45, 0.5], [x + 0.4, 0.5]], 'rgba(255,240,200,0.6)'); } }, 256);
    jt.wrapS = jt.wrapT = T().RepeatWrapping; jt.repeat.set(2.4, 2.4);
    const jg = box(W, D, H, 0.08); jg.scale(0.9, o.level || 0.78, 0.9); jg.translate(0, 0.04, 0);
    k.part(jg, new (T().MeshBasicMaterial)({ color: B.C(o.juice), map: jt, transparent: true, opacity: o.jop || 0.92, depthWrite: false }), 1);
    k.part(box(W, D, 0.2, 0.08, H + 0.005), mat);
    k.part(cyl(0.05, 0.05, 0.15, H - 0.05, 20), glass({ op: 0.35 }), 3);
    const lines = o.lines || item.name.toUpperCase().split(' ');
    k.flat(0.26, 0.26, 0, 0.24, D / 2 + 0.006, paint(0.26, 0.26, (P) => {
      P.path([[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]], '#d8b46a'); P.path([[0.5, 0.05], [0.95, 0.5], [0.5, 0.95], [0.05, 0.5], [0.5, 0.05]], '#f0d898', false, 0.01);
      lines.forEach((s, i) => P.text(s, 0.5, 0.36 + i * 0.1 - (lines.length - 2) * 0.05, 0.09, '#fff6dc', { font: 'helv', weight: 400, maxW: 0.6 }));
      P.text('Kilian', 0.5, 0.64, 0.12, '#fff6dc', { font: 'serif', italic: true });
      if (o.sub) P.text(o.sub, 0.5, 0.74, 0.04, '#fff6dc', { font: 'helv', track: 0.1 });
    }), { foil: true });
    k.top(H);
    return k.done();
  };

  /* ---------- Roja ---------- */
  // Cushion-cut crystals set 2 x 2 on a gold plate.
  function rojaCrown(k, y, color, w = 0.3) {
    k.part(box(w, w, 0.025, 0.006, y), metal(GOLD));
    const g = [], s = w / 4;
    for (const xx of [-s, s]) for (const zz of [-s, s]) { const j = lathe([[0, 0], [s * 1.1, 0], [s * 1.38, s * 0.45], [s * 1.25, s * 0.95], [s * 0.7, s * 1.3], [0, s * 1.38]], 0, 1, 4); j.rotateY(Math.PI / 4); j.translate(xx, y + 0.02, zz); g.push(j); }
    k.part(merge(g), gem(color));
    return y + 0.02 + s * 1.38;
  }
  function rojaCollar(k, y, h = 0.15, r = 0.082) {
    k.part(cyl(r, r, h, y, 32), metal(GOLD, 0.2));
    k.part(cyl(r + 0.008, r + 0.008, 0.015, y + h - 0.015, 32), metal(GOLD, 0.2));
    k.wrap(r + 0.002, h * 0.6, y + h * 0.5, 1.2, paint(1.2 * r, h * 0.6, (P) => { P.text('R', 0.5, 0.45, 0.6, 'rgba(110,80,20,0.55)', { font: 'serif', italic: true }); P.path([[0.2, 0.75], [0.5, 0.62], [0.8, 0.78]], 'rgba(110,80,20,0.5)', false, 0.03); }));
    return y + h;
  }
  const RW = 0.52, RH = 0.44, RD = 0.3;
  const roja = (o) => (item) => {
    const k = kit();
    const geo = cham(RW, RD, RH, 0.035);
    k.glassBody(geo, glass({ op: 0.16, env: 2.8 }), null);
    juice(k, cham(RW, RD, RH, 0.035), o.juice || '#f0d47a', { level: 0.86, inset: 0.92, lift: 0.04, op: 0.9 });
    k.part(cham(RW, RD, 0.05, 0.035), glass({ op: 0.4 }));
    k.flat(o.lw || 0.29, o.lh || 0.36, 0, RH / 2 + 0.01, RD / 2 + 0.004, paint(o.lw || 0.29, o.lh || 0.36, o.label || ((P) => {
      const bg = o.bg || '#f4ead0', ink = o.ink || '#141414';
      P.rect(0, 0, 1, 1, bg); P.frame(0.04, 0.03, 0.92, 0.94, ink, 0.008); P.frame(0.07, 0.05, 0.86, 0.9, ink, 0.003);
      P.text('ROJA', 0.5, 0.15, 0.15, ink, { font: 'helv', weight: 400, track: 0.12 });
      P.text('PARFUMS', 0.5, 0.28, 0.06, ink, { font: 'helv', weight: 500, track: 0.25 });
      P.line(0.12, 0.39, 0.88, 0.39, ink, 0.006); P.line(0.12, 0.56, 0.88, 0.56, ink, 0.006);
      P.text(o.title || item.name.replace(/ Pour Homme$/, '').toUpperCase(), 0.5, 0.475, 0.075, ink, { font: 'helv', weight: 500, track: 0.2, maxW: 0.82 });
      if (o.mark) o.mark(P, ink);
      P.text('PARFUM', 0.5, 0.7, 0.075, ink, { font: 'helv', weight: 500, track: 0.2 });
      if (/Pour Homme/.test(item.name)) P.text('POUR HOMME', 0.5, 0.84, 0.075, ink, { font: 'helv', weight: 500, track: 0.1 });
    })), { foil: !!o.foil });
    const y = rojaCollar(k, RH);
    rojaCrown(k, y, o.jewel || '#111216');
    k.top(RH);
    return k.done();
  };
  // Burlington 1819: the gilded Art Deco portal on navy.
  const burlington = (P) => {
    const gd = '#d6b46a', nv = '#13183a';
    P.rect(0, 0, 1, 1, gd); P.rect(0.08, 0.04, 0.84, 0.96, '#c8a458');
    for (let i = 0; i < 5; i++) { P.line(0.04 + i * 0.012, 0.25, 0.04 + i * 0.012, 1, '#a88438', 0.004); P.line(0.96 - i * 0.012, 0.25, 0.96 - i * 0.012, 1, '#a88438', 0.004); }
    P.path([[0.12, 1], [0.12, 0.32], [0.3, 0.2], [0.5, 0.17], [0.7, 0.2], [0.88, 0.32], [0.88, 1]], nv);
    P.circle(0.5, 0.09, 0.05, '#a88438', 0.006); P.circle(0.5, 0.09, 0.025, '#a88438', 0.006);
    P.text('ROJA', 0.5, 0.36, 0.1, '#e8d6a8', { font: 'helv', weight: 300, track: 0.15 });
    P.text('PARFUMS', 0.5, 0.45, 0.035, '#e8d6a8', { font: 'helv', track: 0.3 });
    P.text('18', 0.5, 0.6, 0.1, '#e8d6a8', { font: 'roman' });
    P.text('BURLINGTON', 0.5, 0.71, 0.055, '#e8d6a8', { font: 'roman', weight: 600 });
    P.text('19', 0.5, 0.82, 0.1, '#e8d6a8', { font: 'roman' });
  };
  // Roja Parfum Cologne: a taller block in graded glass under a single faceted crystal.
  const rojaCologne = (o) => () => {
    const k = kit();
    const W = 0.52, H = 0.52, D = 0.22;
    const geo = box(W, D, H, 0.04); gradient(geo, o.grad[0], o.grad[1], o.gc || 1);
    k.solidBody(geo, solid({ grad: true, rough: 0.15, coat: 0.35, env: 0.8 }));
    k.flat(W * 0.9, H * 0.9, 0, H / 2, D / 2 + 0.003, paint(W * 0.9, H * 0.9, o.draw));
    if (o.capFin === 'black') {
      k.part(cyl(0.07, 0.07, 0.05, H, 24), solid({ color: '#0d0d0f', rough: 0.3 }));
      const top = facetLathe([[0, 0], [0.12, 0], [0.155, 0.04], [0.15, 0.08], [0.1, 0.12], [0, 0.13]], 4, 1, H + 0.05); top.rotateY(Math.PI / 4);
      k.part(top, gem('#0d0d0f', { metal: 0.3 }));
    } else {
      const y = rojaCollar(k, H, 0.11, 0.08);
      const gold = metal(GOLD, 0.16), cr = [], s2 = 0.07;
      k.part(box(0.28, 0.24, 0.02, 0.006, y), gold);
      for (const xx of [-s2, s2]) { const j = lathe([[0, 0], [0.09, 0], [0.105, 0.03], [0.095, 0.065], [0.05, 0.09], [0, 0.095]], 0, 1, 4); j.rotateY(Math.PI / 4); j.translate(xx, y + 0.02, 0); cr.push(j); }
      k.part(merge(cr), solid({ color: GOLD, metal: 1, rough: 0.14, coat: 0, env: 2.6, flat: true }));
    }
    k.top(H);
    return k.done();
  };
  // Diaghilev: the deep crystal cube in dark amber with the house name etched down its side.
  const diaghilev = () => {
    const k = kit();
    const W = 0.46, D = 0.46, H = 0.4;
    k.glassBody(cham(W, D, H, 0.03), glass({ op: 0.16, env: 2.8 }), null);
    juice(k, cham(W, D, H, 0.03), '#8a3a10', { level: 0.86, inset: 0.92, lift: 0.04, op: 0.95 });
    k.part(cham(W, D, 0.05, 0.03), glass({ op: 0.4 }));
    k.flat(0.26, 0.3, 0.04, 0.21, D / 2 + 0.004, paint(0.26, 0.3, (P) => {
      const ink = '#1a1208';
      P.rect(0, 0, 1, 1, '#f0dcae'); P.frame(0.05, 0.04, 0.9, 0.92, ink, 0.006);
      P.text('ROJA', 0.5, 0.18, 0.14, ink, { font: 'helv', weight: 400, track: 0.15 });
      P.text('PARFUMS', 0.5, 0.31, 0.05, ink, { font: 'helv', track: 0.3 });
      P.line(0.15, 0.45, 0.85, 0.45, ink, 0.004); P.line(0.15, 0.6, 0.85, 0.6, ink, 0.004);
      P.text('DIAGHILEV', 0.5, 0.525, 0.065, ink, { font: 'helv', track: 0.2 });
      P.text('PARFUM', 0.5, 0.78, 0.06, ink, { font: 'helv', track: 0.25 });
    }));
    // Big etched ROJA PARFUMS running up the left face.
    const side = paint(0.38, 0.36, (P) => {
      P.g.save(); P.g.translate(P.W * 0.5, P.H * 0.5); P.g.rotate(-Math.PI / 2); P.g.textAlign = 'center'; P.g.textBaseline = 'middle';
      P.g.fillStyle = 'rgba(255,236,200,0.55)'; P.g.font = `300 ${P.W * 0.34}px Jost, Futura, Arial, sans-serif`; P.g.fillText('ROJA', 0, -P.W * 0.18);
      P.g.font = `300 ${P.W * 0.12}px Jost, Futura, Arial, sans-serif`; P.g.fillText('P A R F U M S', 0, P.W * 0.14); P.g.restore();
    });
    const sp = new (T().PlaneGeometry)(0.38, 0.36); sp.rotateY(-Math.PI / 2); sp.translate(-W / 2 - 0.004, 0.21, 0);
    k.part(sp, new (T().MeshStandardMaterial)({ map: side, transparent: true, depthWrite: false, roughness: 0.5, side: T().DoubleSide }), 4);
    const y = rojaCollar(k, H, 0.14);
    rojaCrown(k, y, '#141a3a');
    k.top(H);
    return k.done();
  };

  /* ---------- Nishane ---------- */
  // The gold cap: a block whose right edge rolls up into a curled sheet.
  function nishaneCap(k, y) {
    const t = T(), m = solid({ color: '#f2cf72', metal: 1, rough: 0.32, coat: 0, env: 2.8 });
    k.part(cyl(0.07, 0.07, 0.025, y, 24), solid({ color: '#222', rough: 0.4 }));
    k.part(box(0.26, 0.22, 0.25, 0.02, y + 0.025).translate(-0.025, 0, 0), m);
    const roll = new t.CylinderGeometry(0.055, 0.055, 0.33, 24, 1, true, Math.PI * 0.1, Math.PI * 1.25); roll.translate(0.11, y + 0.025 + 0.165, 0);
    const mm = m.clone(); mm.side = t.DoubleSide; k.part(roll, mm);
    k.part(box(0.06, 0.22, 0.33, 0.01, y + 0.025).translate(0.08, 0, 0), m);
  }
  const NW = 0.5, NH = 0.44, ND = 0.3;
  const nishane = (o) => (item) => {
    const k = kit();
    if (o.solid) k.solidBody(box(NW, ND, NH, 0.02), solid({ color: o.solid, rough: 0.4, coat: 0.2, env: 0.7 }));
    else {
      k.glassBody(box(NW, ND, NH, 0.02), glass({ op: 0.16, env: 2.8 }), null);
      juice(k, box(NW, ND, NH, 0.02), o.juice || '#f0d890', { level: 0.86, inset: 0.92, lift: 0.04 });
      k.part(box(NW, ND, 0.05, 0.02), glass({ op: 0.45 }));
    }
    const lw = o.solid ? NW - 0.02 : 0.42, lh = o.solid ? NH - 0.02 : 0.36;
    k.flat(lw, lh, 0, o.solid ? NH / 2 : 0.25, ND / 2 + 0.004, paint(lw, lh, (P) => {
      const ink = o.ink || '#c99c3a', title = o.title || item.name.toUpperCase();
      if (o.bg) P.rect(0, 0, 1, 1, o.bg);
      if (o.draw) o.draw(P);
      if (o.frame !== false && !o.solid) { P.frame(0.04, 0.04, 0.92, 0.92, ink, 0.02); P.frame(0.065, 0.065, 0.87, 0.87, ink, 0.005); }
      P.text(title, 0.5, 0.16, 0.07, o.titleInk || ink, { font: 'roman', weight: 700, track: 0.06, maxW: 0.8 });
      P.text('NISHANE', 0.5, 0.45, 0.19, o.brand || ink, { font: 'helv', weight: 600, maxW: 0.88 });
      P.text('Extrait de Parfum', 0.5, 0.59, 0.06, o.titleInk || ink, { font: 'roman' });
      P.text(o.city || 'ISTANBUL', 0.5, 0.86, 0.05, o.titleInk || ink, { font: 'helv', track: 0.2 });
    }));
    nishaneCap(k, NH);
    k.top(NH);
    return k.done();
  };
  const ribbons = (P) => {
    for (let i = 0; i < 5; i++) {
      const pts = Array.from({ length: 12 }, (_, j) => [j / 11, 0.1 + i * 0.2 + Math.sin(j * 1.3 + i * 2) * 0.18]);
      P.path(pts, '#c8221e', false, 0.05);
    }
    P.frame(0.03, 0.03, 0.94, 0.94, '#f2c81a', 0.03);
  };

  /* ---------- Baccarat: Les Larmes Sacrées de Thèbes ---------- */
  const larmes = () => {
    const k = kit();
    const crystal = glass({ op: 0.1, env: 2.4, flat: true });
    const pyr = cyl(0.06, 0.44, 0.28, 0, 4); pyr.rotateY(Math.PI / 4);
    k.glassBody(pyr, crystal, null);
    // The amber teardrop reservoir and the gilded pool in the base.
    const amber = new (T().MeshBasicMaterial)({ color: B.C('#d89a14'), transparent: true, opacity: 0.92, depthWrite: false });
    k.part(lathe([[0, 0], [0.035, 0.004], [0.06, 0.035], [0.058, 0.075], [0.035, 0.11], [0.018, 0.14], [0.018, 0.2], [0, 0.2]], 0.075), amber, 1);
    k.part(sphere(0.085, 0.0, 1, 0.42, 1), amber, 1);
    // Sapphire cabochons on the corners and faces.
    const blue = gem('#1a1a6a', { metal: 0.2 }), dots = [];
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + (i * Math.PI) / 2; dots.push(sphere(0.028, 0.028).translate(Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4)); }
    for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; dots.push(sphere(0.024, 0.08, 1, 1, 0.5).translate(Math.cos(a) * 0.235, 0, Math.sin(a) * 0.235)); }
    k.part(merge(dots), blue);
    k.part(cyl(0.035, 0.042, 0.03, 0.275, 24), metal(GOLD));
    k.part(sphere(0.012, 0.29).translate(0, 0, 0.04), solid({ color: '#ffffff', rough: 0, coat: 1, env: 3 }));
    const st = cyl(0, 0.07, 0.1, 0.305, 4); st.rotateY(Math.PI / 4); k.part(st, gem('#141a5a'));
    k.flat(0.1, 0.03, 0.2, 0.03, 0.27, paint(0.1, 0.03, (P) => P.text('baccarat', 0.5, 0.5, 0.7, 'rgba(255,255,255,0.7)', { font: 'serif', italic: true })));
    k.top(0.28);
    return k.done();
  };

  /* ---------- Maison Crivelli ---------- */
  const crivelli = (o) => () => {
    const k = kit();
    const R = 0.145, H = 0.56;
    const geo = cyl(R, R, H, 0, 56); gradient(geo, o.grad[0], o.grad[1], 1);
    k.solidBody(geo, solid({ grad: true, rough: 0.2, coat: 0.3, env: 0.7 }));
    k.wrap(R + 0.003, 0.3, 0.3, 2.4, paint(2.4 * (R + 0.003), 0.3, (P) => {
      P.rect(0, 0, 1, 1, '#f6f4f0');
      P.text(o.l1, 0.5, 0.15, 0.13, '#111111', { font: 'helv', weight: 500 });
      P.text(o.l2, 0.5, 0.3, 0.13, '#111111', { font: 'serif', italic: true, weight: 600 });
      P.text('EXTRAIT DE PARFUM', 0.5, 0.44, 0.045, o.acc, { font: 'helv', weight: 700, track: 0.08 });
      P.text('Maison', 0.48, 0.83, 0.07, '#111111', { font: 'serif', align: 'right' }); P.text('Crivelli', 0.5, 0.83, 0.07, '#111111', { font: 'serif', italic: true, align: 'left' });
    }));
    k.part(cyl(0.06, 0.06, 0.03, H, 24), fin('silver'));
    k.part(cyl(0.115, 0.115, 0.26, H + 0.03, 48), fin('silver'));
    k.top(H);
    return k.done();
  };

  /* ---------- DKNY: the apple ---------- */
  const APPLE = [[0, 0.03], [0.06, 0.01], [0.15, 0], [0.24, 0.03], [0.3, 0.1], [0.33, 0.2], [0.335, 0.28], [0.32, 0.38], [0.28, 0.46], [0.21, 0.52], [0.13, 0.545], [0.07, 0.54], [0.03, 0.52], [0, 0.51]];
  const APPLE_CUT = 0.27;
  const apple = (o) => () => {
    const k = kit();
    const [lo, hi] = bands(APPLE, [APPLE_CUT]).map((p) => lathe(p, 0, 0.92, 64));
    k.glassBody(lo, glass({ tint: o.glass, op: 0.85, env: 2.6 }), null);
    k.part(lathe(bands(APPLE, [APPLE_CUT])[0], 0, 0.92, 64).scale(0.94, 0.9, 0.94), new (T().MeshBasicMaterial)({ color: B.C(o.juice), transparent: true, opacity: 0.85, depthWrite: false }), 1);
    k.part(hi, o.top());
    const ring = new (T().TorusGeometry)(0.334, 0.008, 8, 64); ring.rotateX(Math.PI / 2); ring.scale(1, 1, 0.92); ring.translate(0, APPLE_CUT, 0); k.part(ring, o.ring ? o.ring() : fin('silver'));
    // The slot on the crown and the oval badge.
    const slot = new (T().BoxGeometry)(0.012, 0.03, 0.07); slot.rotateY(0.3); slot.translate(-0.06, 0.53, 0.02); k.part(slot, solid({ color: '#111', rough: 0.5 }));
    if (o.badge) {
      const b = new (T().CylinderGeometry)(0.07, 0.07, 0.01, 32); b.scale(1.3, 1, 0.8); b.rotateX(Math.PI / 2 - 0.6); b.rotateY(0.5); b.translate(0.14, 0.44, 0.19); k.part(b, fin('silver'));
      const lb = paint(0.17, 0.11, (P) => { P.ellipse(0.5, 0.5, 0.46, 0.44, 0, o.badge); P.ellipse(0.5, 0.5, 0.42, 0.38, 0, '#f2f2ee'); P.text('DKNY', 0.5, 0.3, 0.16, '#111', { font: 'helv', weight: 700 }); P.text('be delicious', 0.5, 0.52, 0.17, o.badge, { font: 'serif', italic: true, weight: 700 }); P.text('MEN', 0.5, 0.72, 0.12, '#111', { font: 'helv', weight: 700 }); });
      const pl = new (T().PlaneGeometry)(0.17, 0.11); pl.rotateX(-0.6); pl.rotateY(0.5); pl.translate(0.145, 0.445, 0.198);
      k.part(pl, new (T().MeshStandardMaterial)({ map: lb, transparent: true, depthWrite: false, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 }), 4);
    }
    if (o.extra) o.extra(k);
    k.top(0.53);
    return k.done();
  };
  // The Million Dollar bottle: a 14k gold apple paved in diamonds, the NYC skyline in yellow sapphires, ruby accents.
  const millionApple = (k) => {
    const t = T(), gems = { white: [], yellow: [], ruby: [], blue: [] };
    const rAt = (y) => { for (let i = 1; i < APPLE.length; i++) { const [r0, y0] = APPLE[i - 1], [r1, y1] = APPLE[i]; if ((y - y0) * (y - y1) <= 0 && y1 !== y0) return r0 + (r1 - r0) * (y - y0) / (y1 - y0); } return 0; };
    const sky = (a) => { const u = ((a / (Math.PI * 2)) % 1 + 1) % 1; return 0.3 + 0.08 * Math.abs(Math.sin(u * 37)) * (rnd(Math.floor(u * 24)) > 0.4 ? 1 : 0.35) + (Math.abs(u - 0.5) < 0.02 ? 0.1 : 0); };
    const g0 = new t.OctahedronGeometry(0.0085, 0);
    for (let row = 0; row < 34; row++) {
      const y = 0.18 + row * 0.011, r = rAt(y); if (r < 0.04) continue;
      const n = Math.floor(r * 2 * Math.PI / 0.019);
      for (let i = 0; i < n; i++) {
        const a = (i + (row % 2) * 0.5) / n * Math.PI * 2;
        let kind = y < 0.29 ? 'yellow' : y < sky(a) ? 'yellow' : 'white';
        if (y < 0.29 && rnd(row * 97 + i) > 0.5) continue;
        if (rnd(row * 31 + i * 7) > 0.985) kind = 'ruby'; else if (rnd(row * 13 + i * 3) > 0.99) kind = 'blue';
        const s = g0.clone(); s.scale(1, 0.7, 1); s.translate(Math.sin(a) * (r + 0.004), y, Math.cos(a) * (r + 0.004) * 0.92); gems[kind].push(s);
      }
    }
    const col = { white: '#f4f8ff', yellow: '#f0c428', ruby: '#c8102a', blue: '#1a3ac0' };
    for (const kk of Object.keys(gems)) if (gems[kk].length) k.part(merge(gems[kk]), solid({ color: col[kk], rough: 0.02, coat: 1, metal: kk === 'white' ? 0.5 : 0.2, env: 3.4, flat: true }));
  };

  /* ---------- the catalogue ---------- */
  BottleCraft.add({
    /* Xerjoff */
    'xerjoff|Naxos': xj({ color: '#f1efe9', rough: 0.25, cap: 'rose', ink: '#c8a050', logo: naxosLogo, ly: 0.82, ls: 0.13 }),
    'xerjoff|Alexandria II': xj({ stops: [[0, '#f0d0a0'], [0.16, '#e8701e'], [0.42, '#901c0a'], [0.72, '#2c0a06'], [1, '#140604']], cap: 'rose', ink: '#e8c27a', logo: alexLogo, ly: 0.7, ls: 0.1, lines: ['ALEXANDRIA II'] }),
    'xerjoff|Erba Pura': xj({ color: '#2a94a8', cap: 'gold', ink: '#f2f6f6', lines: ['ERBA', 'PURA'], ly: 0.45, ls: 0.14 }),
    'xerjoff|Torino21': xj({ stops: [[0, '#e4e8f4'], [0.2, '#b0bcec'], [0.4, '#2a3cc0'], [1, '#141c78']], cap: 'rose', ink: '#f4f4fa', lines: ['TORINO21'], ly: 0.6 }),
    'xerjoff|Mefisto': mefisto,
    'xerjoff|40 Knots': xj({ stops: [[0, '#e6ebf4'], [0.2, '#a4b4e0'], [0.45, '#26368c'], [1, '#0e1446']], cap: 'rose', ink: '#a8884a', lines: ['40', 'KNOTS'], ly: 0.4, ls: 0.15 }),
    'xerjoff|More Than Words': xj({ stops: [[0, '#e6e9f2'], [0.2, '#a8b2dc'], [0.45, '#2a3488'], [1, '#101444']], cap: 'rose', ink: '#a8884a', lines: ['MORE', 'THAN', 'WORDS'], ly: 0.3, ls: 0.13 }),
    'xerjoff|Accento': xj({ color: '#3e2492', cap: 'gold', ink: '#f2eefa', lines: ['ACCENTO'], ly: 0.6 }),

    /* Amouage */
    'amouage|Interlude Man': amouage({ grad: ['#0a1640', '#1838a0'], gc: 0.9, gem: '#2038c8' }),
    'amouage|Reflection Man': amouage({ juice: '#eef0ee', cap: 'silver', ink: '#5a5e64', crest: '#a8acb2', crestDark: 'rgba(60,60,70,0.45)', gem: '#6a7ac8' }),
    'amouage|Jubilation XXV': amouage({ juice: '#e8c040', ink: '#6a5020', crest: '#c8a050', crestDark: 'rgba(90,60,10,0.5)', title: 'JUBILATION XXV' }),
    'amouage|Epic Man': amouage({ grad: ['#060c08', '#1e6a3a'], gc: 0.9, gem: '#1a8a4a' }),
    'amouage|Guidance': guidance,
    'amouage|Search': amouage({ color: '#7c9c98', capColor: '#e8dcd4', collar: 'gold', ink: '#f4f2ee', crest: '#eceae4', crestDark: 'rgba(90,110,106,0.6)', gem: '#c8a050', titleFont: 'helv' }),
    'amouage|Enclave': amouage({ color: '#1a3038', capColor: '#c6d4dc', collar: 'gold', ink: '#e6cf98', crest: '#cfd8de', crestDark: 'rgba(20,40,48,0.6)', gem: '#1a8a5a' }),
    'amouage|Purpose': amouage({ color: '#3a4a30', capColor: '#ecebe6', collar: 'gold', ink: '#f2f0ea', crest: '#e8e8e4', crestDark: 'rgba(40,52,32,0.6)', gem: '#b8a48a', titleFont: 'helv' }),
    'amouage|Beach Hut Man': amouage({ juice: '#efe9a8', cap: 'silver', ink: '#8a8070', crest: '#b8bcc0', crestDark: 'rgba(80,80,80,0.45)', gem: '#d89a20', draw: (P) => {
      // The hand-drawn hut sketch behind the crest.
      const c = 'rgba(120,110,80,0.55)';
      P.path([[0.15, 0.95], [0.15, 0.25], [0.5, 0.1], [0.85, 0.25], [0.85, 0.95]], c, false, 0.012);
      P.path([[0.1, 0.28], [0.5, 0.06], [0.9, 0.28]], c, false, 0.02); P.line(0.5, 0.06, 0.6, -0.02, c, 0.012);
      for (let i = 0; i < 5; i++) P.line(0.2 + i * 0.15, 0.3, 0.18 + i * 0.15, 0.95, c, 0.006);
    } }),
    'amouage|Memoir Man': amouage({ color: '#0e0e10', cap: 'gunmetal', collar: 'silver', ink: '#d8dadc', crest: '#c8ccd0', gem: '#0a0a0a' }),

    /* Initio */
    'initio|Oud for Greatness': ofg,
    'initio|Side Effect': initio({ color: '#2c1f36' }),
    'initio|Rehab': initio({ color: '#f2f2f0', metal: '#d4d8dc', line: '#5a5e64' }),
    'initio|Absolute Aphrodisiac': initio({ color: '#141414', metal: '#c41a3a', line: '#e8e8ea' }),
    'initio|Atomic Rose': initio({ color: '#2e2038' }),
    'initio|Musk Therapy': initio({ color: '#f4f4f2', capColor: '#efefed', metal: '#d8c890', line: '#7a6a30' }),
    'initio|Paragon': initio({ color: '#f2f2f0', capColor: '#efefed', metal: '#5a3a30', line: '#d8b8a0' }),
    'initio|Psychedelic Love': initio({ color: '#2c1e36' }),
    'initio|High Frequency': initio({ color: '#2d1f37' }),
    'initio|Narcotic Delight': initio({ color: '#2e0f1c', capColor: '#2e0f1c' }),

    /* Kilian */
    "kilian|Angels' Share": liquor({ juice: '#c88a1a', lines: ["ANGELS'", 'SHARE'] }),
    "kilian|Love, Don't Be Shy": kilian({ color: '#f6d6cc', plaque: '#f2d8c8', ink: '#5a3a30', lines: ['Love,', "don't be shy"] }),
    'kilian|Black Phantom': kilian({ color: '#0b0b0b', lines: ['Black', 'Phantom'], sub: '"MEMENTO MORI"' }),
    'kilian|Good Girl Gone Bad': kilian({ color: '#f4f2ee', plaque: '#f6f2e8', ink: '#b8964a', lines: ['Good girl', 'gone bad'] }),
    'kilian|Straight to Heaven': kilian({ color: '#0b0b0b', lines: ['Straight', 'to Heaven'], sub: 'white cristal' }),
    'kilian|Intoxicated': kilian({ color: '#0b0b0b', lines: ['Intoxicated'] }),
    'kilian|Back to Black': kilian({ color: '#0b0b0b', cap: 'gunmetal', lines: ['Back', 'to Black'], sub: 'aphrodisiac' }),
    'kilian|Moonlight in Heaven': kilian({ color: '#2848b8', cap: 'gunmetal', lines: ['Moonlight', 'in Heaven'] }),
    'kilian|Roses on Ice': liquor({ juice: '#e8eedc', jop: 0.5, lines: ['ROSES', 'ON ICE'] }),
    'kilian|Smoking Hot': kilian({ color: '#0b0b0b', cap: 'gunmetal', lines: ['Smoking', 'Hot'] }),
    'kilian|Apple Brandy on the Rocks': liquor({ juice: '#d8a83a', lines: ['APPLE', 'BRANDY'], sub: 'ON THE ROCKS' }),
    'kilian|Old Fashioned': liquor({ juice: '#c07a14', lines: ['OLD', 'FASHIONED'] }),
    'kilian|Vodka on the Rocks': kilian({ color: '#2848c0', cap: 'gunmetal', lines: ['Vodka', 'on the rocks'] }),

    /* Roja */
    'roja|Elysium Pour Homme': roja({ jewel: '#0e0e12' }),
    'roja|Enigma Pour Homme': rojaCologne({ grad: ['#f08a1a', '#8a1a08'], gc: 0.8, draw: (P) => {
      P.text('ENIGMA', 0.5, 0.12, 0.08, '#f6d0a8', { font: 'helv', weight: 400, track: 0.3 });
      P.text('PARFUM COLOGNE', 0.5, 0.21, 0.035, '#f6d0a8', { font: 'helv', track: 0.15 });
      P.text('ROJA', 0.5, 0.8, 0.09, 'rgba(255,220,180,0.5)', { font: 'helv', weight: 300, track: 0.2 });
      P.text('PARFUMS', 0.5, 0.9, 0.03, 'rgba(255,220,180,0.5)', { font: 'helv', track: 0.3 });
    } }),
    'roja|Burlington 1819': roja({ jewel: '#c8945a', label: burlington, lw: 0.48, lh: 0.42 }),
    'roja|Isola Blu': roja({ jewel: '#3ab8d8', ink: '#1888b8', bg: '#f4e6b4' }),
    'roja|Danger Pour Homme': roja({ jewel: '#0e0e12' }),
    'roja|Apex': rojaCologne({ grad: ['#1aa030', '#06180a'], gc: 0.7, capFin: 'black', draw: (P) => {
      P.text('APEX', 0.5, 0.18, 0.14, '#e8ece8', { font: 'helv', weight: 300, track: 0.15, shadow: 'rgba(0,0,0,0.9)' }); P.text('APEX', 0.5, 0.18, 0.14, '#1a2a1c', { font: 'helv', weight: 100, track: 0.15 });
      P.text('ROJA', 0.5, 0.78, 0.1, '#f2f2f2', { font: 'helv', weight: 300, track: 0.2 });
      P.text('PARFUMS', 0.5, 0.88, 0.035, '#f2f2f2', { font: 'helv', track: 0.3 });
    } }),
    'roja|Diaghilev': diaghilev,
    'roja|Haute Luxe': roja({ jewel: '#4a2a98', juice: '#e0a020', ink: '#5a3a9a', bg: '#f2dc98', title: ' ', mark: (P, ink) => { P.path([[0.3, 0.52], [0.42, 0.42], [0.5, 0.5], [0.46, 0.6], [0.6, 0.46], [0.7, 0.54]], ink, false, 0.008); } }),

    /* Nishane */
    'nishane|Hacivat': nishane({ solid: '#e8e0d0', ink: '#6a6a6a', brand: '#5a5c60', title: 'HACIVAT' }),
    'nishane|Ani': nishane({ bg: '#0b0b0b', juice: '#e8c070', city: 'PARIS' }),
    'nishane|Wulong Cha': nishane({ bg: '#f2ead6', titleInk: '#2a2418', juice: '#e8e0b0', title: 'WŪLÓNG CHÁ', city: 'SHANGHAI' }),
    'nishane|Fan Your Flames': nishane({ bg: '#1e3aa8', titleInk: '#f2e8d0', juice: '#e8a040', city: 'NEW YORK' }),
    'nishane|Hundred Silent Ways': nishane({ bg: '#b0162a', titleInk: '#f2e8d0', juice: '#f0c890', city: 'PARIS' }),
    'nishane|Ege': nishane({ solid: '#3274a8', ink: '#ecd8a0', title: 'EGE / ΑΙΓΑΙΟ', city: 'IZMIR / ΑΘΗΝΑ' }),
    'nishane|Tempfluo': nishane({ bg: '#f8f6f2', draw: ribbons, frame: false, ink: '#f2c81a', titleInk: '#3a2a20', juice: '#f0d8a0', city: 'TOKYO' }),
    'nishane|Karagöz': nishane({ solid: '#111112', ink: '#d8d8d8', title: 'KARAGOZ' }),

    /* Baccarat */
    'baccarat|Les Larmes Sacrées de Thèbes': larmes,

    /* Maison Crivelli */
    'crivelli|Hibiscus Mahajád': crivelli({ grad: ['#d82a16', '#8a0e0a'], l1: 'Hibiscus', l2: 'Mahajád', acc: '#c81e1e' }),
    'crivelli|Oud Maracujá': crivelli({ grad: ['#1e3a9a', '#0e1838'], l1: 'Oud', l2: 'Maracujá', acc: '#1a2a7a' }),

    /* DKNY */
    'dkny|Be Delicious Men': apple({ glass: '#7a4a14', juice: '#a8641a', top: () => fin('chrome'), badge: '#5a6a3a' }),
    'dkny|Golden Delicious Million Dollar Fragrance Bottle': apple({ glass: '#c89a3a', juice: '#d8a840', top: () => metal('#e8c060', 0.2), ring: () => metal('#e8c060', 0.2), extra: (k) => { k.part(lathe(bands(APPLE, [APPLE_CUT])[0], 0, 0.92, 64).scale(1.003, 1, 1.003), metal('#e2b850', 0.18)); millionApple(k); } }),
  });
})();
