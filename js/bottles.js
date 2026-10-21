/* Sillage — real bottle designs.
 * Each spec below was modelled from a reference photo of the actual bottle:
 * its proportions, glass colour, cap, collar and the main front artwork.
 * Bottles without their own spec use a house template where the house shares
 * one bottle across its line (Creed, Byredo, Tom Ford Private Blend, MFK,
 * Parfums de Marly); everything else falls back to the house archetype in showroom.js.
 * Units: the body stands on y = 0 and the whole bottle is roughly one unit tall.
 */
const BottleCraft = (() => {
  let T = null;
  const built = {};
  const C = (hex) => new T.Color(hex).convertSRGBToLinear();
  const FONTS = {
    serif: '"Bodoni Moda", Didot, "Bodoni 72", Georgia, serif',
    sans: 'Jost, Futura, "Century Gothic", Arial, sans-serif',
    helv: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    roman: '"Trajan Pro", "Times New Roman", Georgia, serif',
    arabic: '"Noto Naskh Arabic", "Geeza Pro", "Arial", serif',
  };

  /* ---------- geometry ---------- */
  function rrShape(w, d, r) {
    const s = new T.Shape(); const x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // Rounded box standing on y0; UVs are remapped so the front face reads 0..1 across and up.
  function box(w, d, h, r = 0.02, y0 = 0) {
    const b = Math.min(r * 0.6, 0.025, h / 4);
    const g = new T.ExtrudeGeometry(rrShape(w - 2 * b, d - 2 * b, Math.max(0.004, Math.min(r - b, (w - 2 * b) / 2.1, (d - 2 * b) / 2.1))), {
      depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 8,
    });
    g.rotateX(-Math.PI / 2); g.translate(0, y0 + b, 0);
    return g;
  }
  // Superellipsoid standing on y = 0; e < 1 squares it off, e = 1 is an ellipsoid.
  function pillow(w, h, d, ex = 0.35, ey = 0.25) {
    const g = new T.SphereGeometry(1, 48, 36); const p = g.attributes.position;
    const f = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);
    for (let i = 0; i < p.count; i++) p.setXYZ(i, f(p.getX(i), ex) * w / 2, f(p.getY(i), ey) * h / 2 + h / 2, f(p.getZ(i), ex) * d / 2);
    g.computeVertexNormals();
    return g;
  }
  function cyl(rt, rb, h, y0 = 0, seg = 40, x = 0, z = 0) { const g = new T.CylinderGeometry(rt, rb, h, seg); g.translate(x, y0 + h / 2, z); return g; }
  function sphere(r, y, sx = 1, sy = 1, sz = 1) { const g = new T.SphereGeometry(r, 32, 24); g.scale(sx, sy, sz); g.translate(0, y, 0); return g; }
  // Lathe from [radius, height] points; UV v follows height so stripes and gradients land evenly.
  function lathe(pts, y0 = 0, sz = 1, seg = 48) {
    const g = new T.LatheGeometry(pts.map(([r, y]) => new T.Vector2(Math.max(0.0001, r), y)), seg);
    const p = g.attributes.position, uv = g.attributes.uv;
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < p.count; i++) { lo = Math.min(lo, p.getY(i)); hi = Math.max(hi, p.getY(i)); }
    for (let i = 0; i < p.count; i++) uv.setY(i, (p.getY(i) - lo) / (hi - lo || 1));
    g.scale(1, 1, sz); g.translate(0, y0, 0);
    return g;
  }
  // Cut a lathe profile into horizontal bands at the given heights.
  function bands(pts, cuts) {
    const at = (y) => {
      for (let i = 1; i < pts.length; i++) {
        const [r0, y0] = pts[i - 1], [r1, y1] = pts[i];
        if ((y >= y0 && y <= y1) || (y <= y0 && y >= y1)) { const k = y1 === y0 ? 0 : (y - y0) / (y1 - y0); return [r0 + (r1 - r0) * k, y]; }
      }
      return [0, y];
    };
    const edges = [pts[0][1], ...cuts, pts[pts.length - 1][1]];
    const out = [];
    for (let b = 0; b < edges.length - 1; b++) {
      const lo = edges[b], hi = edges[b + 1];
      const seg = [b === 0 ? pts[0] : at(lo)];
      for (const q of pts) if (q[1] > lo && q[1] < hi) seg.push(q);
      seg.push(b === edges.length - 2 ? pts[pts.length - 1] : at(hi));
      out.push(seg);
    }
    return out;
  }
  function merge(geos) {
    const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
    let n = 0; parts.forEach((g) => { n += g.attributes.position.count; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
    parts.forEach((g) => { g.computeVertexNormals(); pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; });
    const m = new T.BufferGeometry(); m.setAttribute('position', new T.BufferAttribute(pos, 3)); m.setAttribute('normal', new T.BufferAttribute(nor, 3));
    return m;
  }
  // Vertical colour gradient baked into vertex colours (bottom -> top).
  function gradient(geo, bottom, top, curve = 1) {
    const p = geo.attributes.position; let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < p.count; i++) { lo = Math.min(lo, p.getY(i)); hi = Math.max(hi, p.getY(i)); }
    const a = C(bottom), b = C(top), c = new T.Color(), col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const k = Math.pow((p.getY(i) - lo) / (hi - lo || 1), curve); c.copy(a).lerp(b, k); col.set([c.r, c.g, c.b], i * 3); }
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    return geo;
  }

  /* ---------- materials ---------- */
  function glass(o = {}) {
    return new T.MeshPhysicalMaterial({
      color: o.grad ? new T.Color(1, 1, 1) : C(o.tint || '#ffffff'), transparent: true, opacity: o.op != null ? o.op : 0.22,
      roughness: o.rough != null ? o.rough : 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: o.env || 2.2,
      depthWrite: false, vertexColors: !!o.grad, map: o.map || null, bumpMap: o.bump || null, bumpScale: o.bumpScale || 0.015, flatShading: !!o.flat,
    });
  }
  function solid(o = {}) {
    return new T.MeshPhysicalMaterial({
      color: o.grad ? new T.Color(1, 1, 1) : C(o.color || '#111111'), roughness: o.rough != null ? o.rough : 0.25, metalness: o.metal || 0,
      clearcoat: o.coat != null ? o.coat : 0.8, clearcoatRoughness: 0.08, vertexColors: !!o.grad, map: o.map || null, flatShading: !!o.flat, envMapIntensity: o.env || 1.4,
    });
  }
  const FIN = {
    gold: { color: '#e0b95f', metal: 1, rough: 0.3, coat: 0, env: 2.4 },
    silver: { color: '#e4e8ec', metal: 1, rough: 0.26, coat: 0, env: 2.4 },
    chrome: { color: '#f2f4f6', metal: 1, rough: 0.18, coat: 0, env: 2.6 },
    gunmetal: { color: '#6b6f76', metal: 1, rough: 0.3, coat: 0, env: 2.2 },
    bronze: { color: '#c17f4e', metal: 1, rough: 0.3, coat: 0, env: 2.4 },
    black: { color: '#0b0b0d', metal: 0.1, rough: 0.2, coat: 1 },
    matte: { color: '#141416', metal: 0, rough: 0.6, coat: 0 },
    white: { color: '#f1efe9', metal: 0, rough: 0.35, coat: 0.6 },
  };
  const finCache = {};
  const fin = (k) => finCache[k] || (finCache[k] = solid(FIN[k]));

  /* ---------- painted artwork ---------- */
  function paint(wu, hu, draw, px = 768) {
    px = Math.min(px, Math.round(2048 * wu / hu)); // keep tall strips within texture limits
    const c = document.createElement('canvas'); c.width = Math.max(8, px); c.height = Math.max(8, Math.round(px * hu / wu));
    const g = c.getContext('2d'); const W = c.width, H = c.height;
    const P = {
      g, W, H,
      text(s, x, y, size, color, o = {}) {
        let px2 = size * H; const chars = [...s]; const tr = o.track || 0;
        const setFont = () => { g.font = `${o.italic ? 'italic ' : ''}${o.weight || 500} ${px2}px ${FONTS[o.font || 'serif']}`; };
        const measure = () => (tr ? chars.reduce((a, ch) => a + g.measureText(ch).width, 0) + tr * px2 * (chars.length - 1) : g.measureText(s).width);
        g.save(); setFont();
        let width = measure(); const maxW = (o.maxW || 0.92) * W;
        if (width > maxW) { px2 *= maxW / width; setFont(); width = measure(); }
        g.fillStyle = color; g.textBaseline = 'middle'; g.textAlign = 'left';
        if (o.shadow) { g.shadowColor = o.shadow; g.shadowBlur = px2 * 0.15; }
        const x0 = x * W - (o.align === 'left' ? 0 : o.align === 'right' ? width : width / 2);
        // Untracked text is drawn whole so scripts like Arabic keep their joined letterforms.
        if (!tr) g.fillText(s, x0, y * H);
        else { let cx = x0; for (const ch of chars) { g.fillText(ch, cx, y * H); cx += g.measureText(ch).width + tr * px2; } }
        g.restore();
      },
      rect(x, y, w, h, color, r = 0) { g.fillStyle = color; g.beginPath(); if (g.roundRect && r) g.roundRect(x * W, y * H, w * W, h * H, r * H); else g.rect(x * W, y * H, w * W, h * H); g.fill(); },
      frame(x, y, w, h, color, lw = 0.006) { g.strokeStyle = color; g.lineWidth = lw * H; g.strokeRect(x * W, y * H, w * W, h * H); },
      ellipse(x, y, rx, ry, rot, color) { g.beginPath(); g.ellipse(x * W, y * H, rx * W, ry * H, rot || 0, 0, Math.PI * 2); g.fillStyle = color; g.fill(); },
      circle(x, y, r, color, stroke = 0) { g.beginPath(); g.arc(x * W, y * H, r * H, 0, Math.PI * 2); if (stroke) { g.strokeStyle = color; g.lineWidth = stroke * H; g.stroke(); } else { g.fillStyle = color; g.fill(); } },
      line(x1, y1, x2, y2, color, lw = 0.006) { g.strokeStyle = color; g.lineWidth = lw * H; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1 * W, y1 * H); g.lineTo(x2 * W, y2 * H); g.stroke(); },
      path(points, color, fill = true, lw = 0.006) { g.beginPath(); points.forEach(([x, y], i) => (i ? g.lineTo(x * W, y * H) : g.moveTo(x * W, y * H))); if (fill) { g.closePath(); g.fillStyle = color; g.fill(); } else { g.strokeStyle = color; g.lineWidth = lw * H; g.lineJoin = 'round'; g.stroke(); } },
    };
    draw(P);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    return t;
  }
  function decalMat(tex, o = {}) {
    return new T.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: o.foil ? 0.25 : 0.45, metalness: o.foil ? 0.75 : 0, polygonOffset: true, polygonOffsetFactor: -2, side: T.DoubleSide });
  }

  /* ---------- builder kit ---------- */
  function kit() {
    const g = new T.Group(); let pick = null, top = 0.7;
    const add = (m, order) => { if (order) m.renderOrder = order; g.add(m); return m; };
    return {
      g,
      // Glass body with an optional juice volume inside it.
      glassBody(geo, mat, juice) {
        if (juice) {
          const lg = geo.clone(); lg.scale(juice.inset || 0.86, juice.level || 0.8, juice.inset || 0.86); lg.translate(0, juice.lift != null ? juice.lift : 0.03, 0);
          const c = C(juice.color);
          add(new T.Mesh(lg, new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: juice.glow || 0.22, roughness: 0.2, transparent: true, opacity: juice.op || 0.9 })), 1);
        }
        const m = add(new T.Mesh(geo, mat), 2); if (!pick) { m.name = 'pick'; pick = m; } return m;
      },
      solidBody(geo, mat) { const m = add(new T.Mesh(geo, mat)); if (!pick) { m.name = 'pick'; pick = m; } return m; },
      part(geo, mat, order) { return add(new T.Mesh(geo, mat), order || (mat.transparent ? 3 : 0)); },
      // Flat artwork on the front (z > 0) or back of a body.
      flat(w, h, x, y, z, tex, o = {}) { const p = new T.PlaneGeometry(w, h); if (o.back) p.rotateY(Math.PI); p.translate(x, y, o.back ? -z : z); return add(new T.Mesh(p, decalMat(tex, o)), 4); },
      // Artwork wrapped around a round body (optionally squashed in z like the body).
      wrap(r, h, y, arc, tex, o = {}) { const p = new T.CylinderGeometry(r, r, h, 40, 1, true, -arc / 2, arc); p.scale(1, 1, o.sz || 1); p.translate(0, y, 0); return add(new T.Mesh(p, decalMat(tex, o)), 4); },
      top(y) { top = y; },
      done() { g.userData.top = top; return { group: g, top }; },
    };
  }

  /* ---------- reusable artwork ---------- */
  const wordmark = (s, color, size = 0.5, font = 'serif', o = {}) => paint(1, 0.18, (P) => P.text(s, 0.5, 0.52, size, color, { font, ...o }));

  /* ---------- house templates ---------- */
  const CREED_PROFILE = [[0, 0], [0.3, 0], [0.315, 0.015], [0.315, 0.045], [0.29, 0.07], [0.295, 0.46], [0.29, 0.53], [0.27, 0.6], [0.22, 0.67], [0.15, 0.72], [0.08, 0.75], [0.065, 0.76], [0.065, 0.8], [0, 0.8]];
  const CREED_Z = 0.6;
  function creed(item, o = {}) {
    const k = kit();
    const [foot, mid, upper] = bands(CREED_PROFILE, [0.045, 0.44]).map((pts) => lathe(pts, 0, CREED_Z));
    const goldMat = o.gold ? solid({ color: typeof o.gold === 'string' ? o.gold : '#d9b45a', metal: 1, rough: o.metalRough || 0.22, coat: 0, env: 2.4 }) : null;
    if (o.fade) { gradient(mid, o.fade, '#ffffff', 0.9); gradient(upper, o.fadeMid || '#ffffff', '#ffffff'); }
    const tinted = o.glassTint ? glass({ tint: o.glassTint, op: o.glassOp || 0.85 }) : null;
    const lowerMat = goldMat || (o.lower === 'black' ? solid({ color: '#0a0a0a', rough: 0.15 }) : o.lower ? glass({ tint: o.lower, op: o.lowerOp || 0.75 }) : o.fade ? glass({ grad: true, op: 0.82 }) : tinted || glass({ op: 0.2 }));
    const upperMat = goldMat || (o.upper ? solid({ color: o.upper, rough: 0.2 }) : o.fade ? glass({ grad: true, op: 0.3 }) : tinted || glass({ op: 0.2 }));
    k.glassBody(upper, upperMat, null);
    if (!o.upper && !o.gold) {
      const jc = C(o.juice || FAMILIES[item.family].color);
      const jg = lathe(CREED_PROFILE, 0, CREED_Z); jg.scale(0.88, 0.84, 0.88); jg.translate(0, 0.03, 0);
      k.part(jg, new T.MeshStandardMaterial({ color: jc, emissive: jc, emissiveIntensity: 0.22, roughness: 0.2, transparent: true, opacity: 0.9 }), 1);
    }
    k.part(mid, lowerMat, o.lower === 'black' || o.gold ? 0 : 2); k.part(foot, goldMat || glass({ op: 0.3 }), 2);
    const ink = o.ink || '#141414';
    k.wrap(0.293, 0.14, 0.515, 1.8, paint(1.8 * 0.293, 0.14, (P) => {
      P.text('CREED', 0.5, 0.4, 0.66, ink, { font: 'roman', weight: 600, track: 0.08, maxW: 0.78 });
      P.line(0.3, 0.86, 0.7, 0.98, ink, 0.05); P.line(0.7, 0.86, 0.3, 0.98, ink, 0.05);
    }), { sz: CREED_Z });
    if (o.panel) {
      // Creed's arched label panel with the house crest.
      const pi = o.panel.ink || '#ffffff';
      k.wrap(0.3, 0.3, 0.25, 1.05, paint(0.3, 0.3, (P) => {
        P.path([[0.06, 0.98], [0.06, 0.12], [0.3, 0.04], [0.5, 0.0], [0.7, 0.04], [0.94, 0.12], [0.94, 0.98]], o.panel.bg);
        for (const dx of [-0.07, 0, 0.07]) P.ellipse(0.5 + dx, 0.24, 0.03, 0.06, dx * 4, pi);
        P.rect(0.4, 0.31, 0.2, 0.025, pi);
        const words = (o.title || item.name.toUpperCase()).split(' ');
        const mid2 = Math.ceil(words.length / 2);
        if (words.length > 2) { P.text(words.slice(0, mid2).join(' '), 0.5, 0.5, 0.09, pi, { font: 'helv', weight: 600, track: 0.08, maxW: 0.8 }); P.text(words.slice(mid2).join(' '), 0.5, 0.61, 0.09, pi, { font: 'helv', weight: 600, track: 0.08, maxW: 0.8 }); }
        else P.text(words.join(' '), 0.5, 0.55, 0.1, pi, { font: 'helv', weight: 600, track: 0.08, maxW: 0.8 });
        P.text('DE PÈRE EN FILS DEPUIS 1760', 0.5, 0.8, 0.04, pi, { font: 'helv', track: 0.05, maxW: 0.8 });
      }), { sz: CREED_Z });
    } else k.wrap(0.3, 0.17, 0.25, 1.0, paint(0.3, 0.17, (P) => {
      if (o.labelBg !== 'none') P.rect(0.02, 0.05, 0.96, 0.9, o.labelBg || '#e9ebee', 0.04);
      if (o.horse) { P.circle(0.5, 0.42, 0.18, '#2a2a2a'); P.path([[0.38, 0.55], [0.5, 0.25], [0.62, 0.55]], '#e9ebee'); }
      P.text(o.title || item.name.toUpperCase(), 0.5, o.horse ? 0.8 : 0.5, o.horse ? 0.16 : 0.22, o.titleInk || '#1a1a1a', { font: 'roman', weight: 600, track: 0.06, maxW: 0.86 });
    }), { sz: CREED_Z });
    k.part(cyl(0.08, 0.08, 0.04, 0.8, 32), fin(o.collar || 'silver'));
    if (o.capFin) k.part(lathe([[0, 0], [0.115, 0], [0.13, 0.03], [0.112, 0.25], [0.1, 0.29], [0, 0.29]], 0.84, 1, 40), fin(o.capFin));
    else k.part(lathe([[0, 0], [0.12, 0], [0.135, 0.04], [0.125, 0.2], [0.09, 0.29], [0, 0.31]], 0.84, 1, 8), solid({ color: o.cap || '#0d0d0d', rough: 0.12, flat: true }));
    k.top(0.82);
    return k.done();
  }

  function byredo(item) {
    const k = kit();
    k.glassBody(cyl(0.34, 0.34, 0.5, 0, 56), glass({ op: 0.18 }), { color: '#efe8cf', level: 0.86, inset: 0.82, op: 0.6 });
    k.part(cyl(0.34, 0.34, 0.03, 0, 56), glass({ op: 0.45 }));
    k.wrap(0.345, 0.32, 0.27, 2.3, paint(2.3 * 0.345, 0.32, (P) => {
      P.rect(0, 0, 1, 1, '#f7f6f2');
      P.text('BYREDO', 0.5, 0.24, 0.085, '#111', { font: 'helv', weight: 500, track: 0.25 });
      P.text(item.name.toUpperCase(), 0.5, 0.52, 0.12, '#111', { font: 'helv', weight: 500, track: 0.12, maxW: 0.5 });
      P.text('EAU DE PARFUM', 0.5, 0.82, 0.05, '#111', { font: 'helv', weight: 400, track: 0.2 });
    }));
    k.part(cyl(0.07, 0.07, 0.05, 0.5, 24), fin('silver'));
    k.part(lathe([[0, 0], [0.205, 0], [0.205, 0.14], [0.19, 0.22], [0.13, 0.29], [0, 0.31]], 0.53), solid({ color: '#0e0e0e', rough: 0.45, coat: 0.3 }));
    k.top(0.53);
    return k.done();
  }

  // Tom Ford Private Blend: tall block with a shoulder plate and the T-shaped cap in matching glass.
  function tomFord(item, o = {}) {
    const k = kit();
    const tint = o.glass || '#d9d2c4';
    const body = glass({ tint, op: o.op != null ? o.op : 0.75, rough: 0.05 });
    k.glassBody(box(0.44, 0.3, 0.6, 0.015), body, { color: o.juice || FAMILIES[item.family].color, level: 0.88, inset: 0.86, op: 0.97 });
    k.part(box(0.5, 0.34, 0.05, 0.01, 0.6), glass({ tint, op: Math.min(0.95, (o.op || 0.75) + 0.1) }));
    k.part(cyl(0.05, 0.05, 0.03, 0.65, 20), fin('silver'));
    const capMat = o.capSolid ? solid({ color: o.capSolid, rough: 0.12 }) : glass({ tint: o.cap || tint, op: Math.min(0.97, (o.op || 0.75) + 0.15) });
    k.part(box(0.24, 0.18, 0.14, 0.01, 0.67), capMat);
    k.part(box(0.42, 0.28, 0.05, 0.01, 0.81), capMat);
    const lb = o.labelBg || '#111111', lf = o.labelFg || '#ffffff';
    k.flat(0.36, 0.34, 0, 0.36, 0.153, paint(0.36, 0.34, (P) => {
      P.rect(0, 0, 1, 1, lb);
      P.text('TOM FORD', 0.5, 0.17, 0.11, lf, { font: 'helv', weight: 500, track: 0.04 });
      const words = item.name.toUpperCase().split(' ');
      const l1 = words.slice(0, Math.ceil(words.length / 2)).join(' '), l2 = words.slice(Math.ceil(words.length / 2)).join(' ');
      P.text(l2 ? l1 : item.name.toUpperCase(), 0.5, 0.42, 0.11, lf, { font: 'helv', weight: 700, track: 0.04 });
      if (l2) P.text(l2, 0.5, 0.56, 0.11, lf, { font: 'helv', weight: 700, track: 0.04 });
      P.text('EAU DE PARFUM', 0.5, 0.75, 0.065, lf, { font: 'helv', weight: 400, track: 0.06 });
      P.text('50 ML', 0.5, 0.86, 0.065, lf, { font: 'helv', weight: 400, track: 0.06 });
    }));
    k.top(0.66);
    return k.done();
  }

  // Maison Francis Kurkdjian: thick square crystal block, gold collar and square gold cap.
  function mfk(item, o = {}) {
    const k = kit();
    k.glassBody(box(0.6, 0.46, 0.55, 0.03), glass({ op: 0.24, env: 2.6 }), { color: o.juice || FAMILIES[item.family].color, level: 0.82, inset: 0.78, lift: 0.06 });
    k.part(box(0.6, 0.46, 0.06, 0.03), glass({ op: 0.45 }));
    k.part(cyl(0.11, 0.11, 0.05, 0.55, 32), fin('gold'));
    k.part(box(0.3, 0.26, 0.28, 0.01, 0.6), fin('gold'));
    const bg = o.label || '#f4efe6', fg = o.ink || '#2a2a2a';
    k.flat(0.34, 0.34, 0, 0.28, 0.232, paint(0.34, 0.34, (P) => {
      P.rect(0, 0, 1, 1, bg); P.frame(0.04, 0.04, 0.92, 0.92, fg, 0.008);
      P.text('Maison', 0.12, 0.13, 0.075, fg, { align: 'left', font: 'serif' });
      P.text('Francis Kurkdjian', 0.12, 0.22, 0.075, fg, { align: 'left', font: 'serif', maxW: 0.8 });
      P.text('Paris', 0.12, 0.31, 0.075, fg, { align: 'left', font: 'serif' });
      P.text(item.name.replace('Baccarat Rouge 540', 'Baccarat'), 0.62, 0.55, 0.1, fg, { italic: true, font: 'serif', maxW: 0.7 });
      if (/Baccarat/.test(item.name)) P.text(item.name.replace('Baccarat ', ''), 0.62, 0.66, 0.08, fg, { font: 'serif' });
      P.text('Eau de parfum', 0.5, 0.86, 0.06, fg, { font: 'serif' });
    }), { foil: false });
    k.top(0.6);
    return k.done();
  }

  // Parfums de Marly: rounded block in deep coloured glass with the embossed rearing-horse crest.
  function pdm(item, o = {}) {
    const k = kit();
    // Unknown PDM colours: a deep version of the scent family's colour, as the line uses dark tinted glass.
    const color = o.color || '#' + new T.Color(FAMILIES[item.family].color).lerp(new T.Color('#141414'), 0.5).getHexString();
    k.glassBody(box(0.52, 0.32, 0.7, 0.15), glass({ tint: color, op: 0.97, rough: 0.14 }), null);
    const emboss = o.emboss || 'rgba(255,255,255,0.13)', shade = 'rgba(0,0,0,0.35)';
    k.flat(0.46, 0.64, 0, 0.36, 0.163, paint(0.46, 0.64, (P) => {
      // Two rearing horses facing a shield, drawn as raised glass.
      for (const side of [-1, 1]) {
        const cx = 0.5 + side * 0.26;
        P.path([[cx, 0.12], [cx + side * 0.08, 0.1], [cx + side * 0.1, 0.2], [cx + side * 0.04, 0.26], [cx + side * 0.05, 0.42], [cx - side * 0.04, 0.44], [cx - side * 0.1, 0.3], [cx - side * 0.12, 0.16]].map(([x, y]) => [x, y + 0.04]), emboss);
        P.path([[cx - side * 0.12, 0.2], [cx - side * 0.2, 0.12], [cx - side * 0.16, 0.26]], emboss);
      }
      P.path([[0.38, 0.3], [0.62, 0.3], [0.62, 0.44], [0.5, 0.54], [0.38, 0.44]], emboss);
      P.path([[0.38, 0.3], [0.62, 0.3], [0.62, 0.44], [0.5, 0.54], [0.38, 0.44], [0.38, 0.3]], shade, false, 0.006);
      P.text('1743', 0.5, 0.4, 0.04, shade, { font: 'roman' });
      P.path([[0.16, 0.5], [0.3, 0.46], [0.5, 0.5], [0.7, 0.46], [0.84, 0.5]], emboss, false, 0.02);
      P.text('PARFUMS de MARLY', 0.5, 0.86, 0.045, 'rgba(255,255,255,0.55)', { font: 'roman', track: 0.18 });
      P.text('PARIS', 0.5, 0.92, 0.03, 'rgba(255,255,255,0.5)', { font: 'roman', track: 0.3 });
    }));
    k.part(cyl(0.07, 0.07, 0.04, 0.7, 24), fin('silver'));
    k.part(cyl(0.15, 0.15, 0.28, 0.73, 48), fin(o.cap || 'chrome'));
    k.top(0.73);
    return k.done();
  }

  /* ---------- individual bottles ---------- */
  const SPECS = {
    'lattafa|Khamrah': () => khamrah({ juice: '#b04800', label: '#e8c25d' }),
    'lattafa|Khamrah Qahwa': () => khamrah({ juice: '#8a5a0c', label: '#e9dcc0', sub: 'QAHWA' }),

    'creed|Aventus': (item) => creed(item, { lower: 'black', juice: '#e9e4d2', horse: true, title: 'AVENTUS' }),
    'creed|Aventus 10th Anniversary': (item) => creed(item, { lower: 'black', horse: true, title: '10TH ANNIVERSARY', collar: 'gold', cap: '#151515' }),
    'creed|Green Irish Tweed': (item) => creed(item, { lower: 'black', upper: '#1f1f1f', ink: '#3a3a3a', labelBg: 'rgba(0,0,0,0)', title: 'GREEN IRISH TWEED' }),
    'creed|Silver Mountain Water': (item) => creed(item, { lower: '#e8ecf0', lowerOp: 0.55, labelBg: '#cfd5db', title: 'SILVER MOUNTAIN WATER' }),
    'creed|Viking': (item) => creed(item, { lower: '#8a0f16', lowerOp: 0.88, upper: '#7a0d14', ink: '#f0d9b5', labelBg: '#e8e2d4', title: 'VIKING' }),

    'dior|Sauvage Eau de Toilette': () => sauvage('#05070d', '#2f5590', 'Dior'),
    'dior|Sauvage Eau de Parfum': () => sauvage('#05070c', '#284a80', 'Dior'),
    'dior|Sauvage Parfum': () => sauvage('#090b12', '#2f466c', 'Dior'),
    'dior|Sauvage Elixir': () => sauvage('#120c08', '#5a3a1e', 'Dior', true),

    'chanel|Bleu de Chanel Eau de Parfum': () => bleu('EAU DE PARFUM'),
    'chanel|Bleu de Chanel Eau de Toilette': () => bleu('EAU DE TOILETTE'),
    'chanel|Bleu de Chanel Parfum': () => bleu('PARFUM'),

    'mfk|Baccarat Rouge 540': (item) => mfk(item, { label: '#a51f2d', ink: '#efd9a0', juice: '#f2c88c' }),
    'mfk|Baccarat Rouge 540 Extrait': (item) => mfk(item, { label: '#f3efe6', ink: '#a51f2d', juice: '#e9a36f' }),
    'pdm|Layton': (item) => pdm(item, { color: '#141b44' }),

    'tomford|Oud Wood': (item) => tomFord(item, { glass: '#1d1813', op: 0.96, juice: '#3a2414', labelBg: '#0b0b0b', labelFg: '#f2f2f2' }),
    'tomford|Tobacco Vanille': (item) => tomFord(item, { glass: '#2b190c', op: 0.95, juice: '#4a2a10', labelBg: '#c9a25a', labelFg: '#1a1208' }),
    'tomford|Lost Cherry': (item) => tomFord(item, { glass: '#f8d3d9', op: 0.22, juice: '#7a0612', capSolid: '#5e0710', labelBg: '#f7f5f2', labelFg: '#111111' }),
    'tomford|Tuscan Leather': (item) => tomFord(item, { glass: '#2a150b', op: 0.95, juice: '#4a220e', labelBg: '#0b0b0b', labelFg: '#f2f2f2' }),
    'tomford|Neroli Portofino': (item) => tomFord(item, { glass: '#3d78b8', op: 0.7, juice: '#9fd0f0', labelBg: '#f4f1e8', labelFg: '#0f2a4a' }),

    'afnan|9pm': () => {
      const k = kit();
      k.glassBody(box(0.5, 0.2, 0.7, 0.06), glass({ op: 0.22 }), { color: '#1a1a1a', level: 0.9, inset: 0.9 });
      k.flat(0.44, 0.64, 0, 0.35, 0.102, paint(0.44, 0.64, (P) => {
        P.rect(0, 0, 1, 1, '#0d0d0d', 0.03);
        P.text('9', 0.5, 0.34, 0.6, '#d9dde2', { font: 'serif', weight: 400 });
        P.text('pm', 0.53, 0.56, 0.12, '#0d0d0d', { font: 'serif', weight: 700 });
        P.text('AFNAN', 0.5, 0.86, 0.045, '#d9dde2', { font: 'helv', track: 0.2 });
        P.text('eau de parfum vaporisateur · 100ml 3.4fl.oz', 0.5, 0.92, 0.022, '#9aa0a6', { font: 'helv' });
      }));
      k.part(cyl(0.05, 0.05, 0.07, 0.7, 24), fin('silver'));
      k.part(sphere(0.1, 0.86), fin('chrome'));
      k.top(0.72);
      return k.done();
    },

    'armaf|Club de Nuit Intense Man': () => {
      const k = kit();
      k.solidBody(box(0.7, 0.28, 0.64, 0.02), solid({ color: '#17181b', rough: 0.15, coat: 1 }));
      k.flat(0.66, 0.1, 0, 0.06, 0.142, paint(0.66, 0.1, (P) => {
        P.text('club de nuit', 0.05, 0.5, 0.55, '#e8e8ea', { font: 'helv', weight: 300, align: 'left' });
        P.text('intense man', 0.55, 0.58, 0.38, '#e8e8ea', { font: 'helv', weight: 300, align: 'left' });
      }));
      k.part(box(0.3, 0.26, 0.22, 0.01, 0.65), solid({ color: '#1a1512', rough: 0.3 }));
      // Chain and the hanging Armaf medallion.
      k.part(cyl(0.006, 0.006, 0.2, 0.46, 6, 0, 0.142), fin('gunmetal'));
      const med = new T.CylinderGeometry(0.1, 0.1, 0.02, 40); med.rotateX(Math.PI / 2); med.translate(0, 0.4, 0.152);
      k.part(med, solid({ color: '#151515', rough: 0.35 }));
      k.flat(0.18, 0.06, 0, 0.4, 0.163, wordmark('ARMAF', '#3a3a3a', 0.6, 'helv', { weight: 700, track: 0.1 }));
      k.top(0.65);
      return k.done();
    },

    'byredo|Gypsy Water': (item) => byredo(item),

    'lv|Ombre Nomade': () => {
      const k = kit();
      k.glassBody(gradient(box(0.5, 0.42, 0.56, 0.12), '#3a2210', '#120a05', 0.8), glass({ grad: true, op: 0.96 }), null);
      k.flat(0.44, 0.14, 0, 0.3, 0.212, paint(0.44, 0.14, (P) => {
        P.text('OMBRE NOMADE', 0.5, 0.32, 0.3, '#d8a65a', { font: 'helv', weight: 400, track: 0.06 });
        P.text('LOUIS VUITTON', 0.5, 0.72, 0.26, '#b07a3a', { font: 'helv', weight: 400, track: 0.08 });
      }), { foil: true });
      k.part(cyl(0.1, 0.1, 0.06, 0.56, 32), glass({ tint: '#2a170c', op: 0.92 }));
      k.part(lathe([[0, 0], [0.15, 0], [0.155, 0.02], [0.155, 0.15], [0.14, 0.18], [0, 0.18]], 0.62), solid({ color: '#1e130c', rough: 0.2 }));
      k.top(0.6);
      return k.done();
    },

    'polo|Polo Blue': () => {
      const k = kit();
      k.glassBody(pillow(0.76, 0.52, 0.32, 0.32, 0.4), glass({ tint: '#0b2aa6', op: 0.94, rough: 0.05 }), null);
      k.flat(0.26, 0.34, 0, 0.27, 0.165, paint(0.26, 0.34, (P) => {
        const c = '#f2f4ff';
        // Horse mid-gallop with a rider swinging the mallet.
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
      }));
      k.part(cyl(0.14, 0.14, 0.05, 0.51, 40), fin('silver'));
      k.part(lathe([[0, 0], [0.12, 0], [0.125, 0.12], [0.11, 0.17], [0.07, 0.205], [0, 0.215]], 0.56), fin('chrome'));
      k.top(0.56);
      return k.done();
    },

    'valentino|Uomo Born in Roma': () => {
      const k = kit();
      const geo = gradient(box(0.5, 0.4, 0.66, 0.03), '#8f8189', '#111114', 0.6);
      k.glassBody(geo, glass({ grad: true, op: 0.88 }), null);
      // Rockstud pyramids over the glass.
      const studs = [];
      const stud = (x, y, z, ry) => { const s = new T.ConeGeometry(0.034, 0.03, 4); s.rotateY(Math.PI / 4); s.rotateX(Math.PI / 2); s.rotateY(ry); s.translate(x, y, z); studs.push(s); };
      for (let j = 0; j < 9; j++) {
        const y = 0.05 + j * 0.072;
        if (j === 4) continue;
        for (let i = 0; i < 6; i++) { const x = -0.2 + i * 0.08 + (j % 2) * 0.04; if (x > 0.22) continue; stud(x, y, 0.2, 0); stud(x, y, -0.2, Math.PI); }
        for (let i = 0; i < 5; i++) { const z = -0.16 + i * 0.08 + (j % 2) * 0.04; if (z > 0.18) continue; stud(0.25, y, z, Math.PI / 2); stud(-0.25, y, z, -Math.PI / 2); }
      }
      k.part(merge(studs), glass({ tint: '#2a2a2e', op: 0.9, flat: true }), 3);
      k.flat(0.5, 0.075, 0, 0.338, 0.202, paint(0.5, 0.075, (P) => { P.rect(0, 0, 1, 1, '#0c0c0e'); P.text('VALENTINO', 0.5, 0.55, 0.62, '#ff2e86', { font: 'roman', weight: 500, track: 0.05 }); }));
      k.part(box(0.3, 0.3, 0.14, 0.02, 0.67), solid({ color: '#141416', rough: 0.2 }));
      k.part(cyl(0.05, 0.05, 0.06, 0.81, 20), fin('chrome'));
      k.top(0.68);
      return k.done();
    },

    'clive|X Masculine': () => {
      const k = kit();
      k.solidBody(box(0.38, 0.28, 0.52, 0.03), solid({ color: '#0a0a0b', rough: 0.12 }));
      k.part(box(0.28, 0.22, 0.1, 0.02, 0.52), solid({ color: '#0a0a0b', rough: 0.12 }));
      k.flat(0.32, 0.46, 0, 0.27, 0.142, paint(0.32, 0.46, (P) => {
        const g = '#d6b26a';
        P.circle(0.5, 0.22, 0.09, 'rgba(214,178,106,0.35)', 0.008);
        P.text('EST', 0.33, 0.48, 0.05, g, { font: 'roman', track: 0.2 }); P.text('1872', 0.67, 0.48, 0.05, g, { font: 'roman', track: 0.2 });
        P.text('"X"', 0.5, 0.66, 0.06, g, { font: 'roman' });
        P.text('PERFUME CREATION', 0.5, 0.75, 0.035, g, { font: 'roman', track: 0.15 });
        P.text('CLIVE CHRISTIAN', 0.5, 0.81, 0.035, g, { font: 'roman', track: 0.15 });
        P.text('LONDON ENGLAND', 0.5, 0.87, 0.035, g, { font: 'roman', track: 0.15 });
      }), { foil: true });
      k.part(cyl(0.075, 0.075, 0.06, 0.62, 24), fin('gold'));
      k.part(cyl(0.12, 0.1, 0.07, 0.68, 32), fin('gold'));
      for (let i = 0; i < 4; i++) { const a = new T.TorusGeometry(0.1, 0.018, 8, 20, Math.PI); a.rotateY((i * Math.PI) / 4); a.translate(0, 0.76, 0); k.part(a, fin('gold')); }
      k.part(sphere(0.035, 0.87), fin('gold'));
      k.top(0.64);
      return k.done();
    },

    'rayhaan|Pacific Aura': () => {
      const k = kit();
      k.glassBody(gradient(box(0.66, 0.26, 0.62, 0.03), '#1fc0a8', '#0f56c4'), glass({ grad: true, op: 0.92 }), null);
      k.flat(0.6, 0.56, 0, 0.32, 0.132, paint(0.6, 0.56, (P) => {
        const ink = '#0f2a5a';
        for (let i = 0; i < 16; i++) P.path(Array.from({ length: 9 }, (_, j) => [j / 8, (i / 16) + Math.sin(j * 0.9 + i) * 0.03]), 'rgba(255,255,255,0.12)', false, 0.006);
        P.text('PACIFIC', 0.5, 0.18, 0.12, ink, { font: 'roman', weight: 600, track: 0.04 });
        P.text('POUR HOMME', 0.5, 0.29, 0.035, ink, { font: 'roman', track: 0.15 });
        P.text('AURA', 0.5, 0.52, 0.06, ink, { font: 'roman', track: 0.15 });
        P.text('RAYHAAN', 0.5, 0.78, 0.065, ink, { font: 'roman', track: 0.1 });
      }));
      k.part(cyl(0.13, 0.13, 0.26, 0.63, 48), fin('bronze'));
      k.top(0.63);
      return k.done();
    },

    'versace|Eros': () => {
      const k = kit();
      k.glassBody(box(0.7, 0.3, 0.6, 0.02), glass({ tint: '#0d6e74', op: 0.86 }), null);
      k.flat(0.66, 0.56, 0, 0.3, 0.152, paint(0.66, 0.56, (P) => {
        const e = 'rgba(160,240,235,0.35)';
        // Greek key border.
        for (let i = 0; i < 12; i++) { const x = 0.04 + i * 0.077; P.path([[x, 0.06], [x + 0.05, 0.06], [x + 0.05, 0.12], [x + 0.02, 0.12], [x + 0.02, 0.09]], e, false, 0.008); P.path([[x, 0.94], [x + 0.05, 0.94], [x + 0.05, 0.88], [x + 0.02, 0.88], [x + 0.02, 0.91]], e, false, 0.008); }
        // Medusa medallion.
        const d2 = 'rgba(4,40,44,0.55)';
        P.ellipse(0.5, 0.43, 0.2, 0.24, 0, d2);
        // Serpent locks curling out around the head, then the face in low relief.
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2, r1 = 0.1, r2 = 0.17;
          P.path([[0.5 + Math.cos(a) * r1 * 0.75, 0.43 + Math.sin(a) * r1], [0.5 + Math.cos(a + 0.18) * r2 * 0.6, 0.43 + Math.sin(a + 0.18) * r2 * 0.85], [0.5 + Math.cos(a - 0.05) * r2 * 0.75, 0.43 + Math.sin(a - 0.05) * r2]], e, false, 0.012);
        }
        P.ellipse(0.5, 0.45, 0.075, 0.1, 0, 'rgba(160,240,235,0.28)');
        P.path([[0.44, 0.42], [0.48, 0.41]], d2, false, 0.008); P.path([[0.52, 0.41], [0.56, 0.42]], d2, false, 0.008);
        P.path([[0.5, 0.42], [0.495, 0.48], [0.51, 0.48]], d2, false, 0.006);
        P.text('VERSACE', 0.5, 0.72, 0.09, '#e9c46a', { font: 'roman', weight: 600, track: 0.12 });
        P.text('EROS', 0.5, 0.8, 0.06, '#e9c46a', { font: 'roman', weight: 600, track: 0.25 });
      }), { foil: true });
      k.part(cyl(0.12, 0.12, 0.14, 0.61, 40), glass({ tint: '#0d6e74', op: 0.92 }));
      k.part(cyl(0.12, 0.12, 0.035, 0.75, 40), fin('gold'));
      k.top(0.61);
      return k.done();
    },

    'jpg|Ultra Male': () => torso('#2a4a9a', '#0a0c14', '#0a1430', 0.9),
    'jpg|Le Male': () => torso('#7cc6d4', '#eef8fa', '#126a72', 0.82),

    'ysl|Y Eau de Parfum': () => {
      const k = kit();
      k.glassBody(gradient(box(0.54, 0.3, 0.78, 0.02), '#3a64b0', '#07080c', 0.7), glass({ grad: true, op: 0.9 }), null);
      k.flat(0.3, 0.06, 0.08, 0.62, 0.152, paint(0.3, 0.06, (P) => { P.rect(0, 0, 1, 1, '#f4f4f4'); P.text('YvesSaintLaurent', 0.5, 0.55, 0.62, '#111', { font: 'roman', italic: true }); }));
      const cap = cyl(0.14, 0.14, 0.2, 0.8, 48);
      k.part(cap, solid({ color: '#0d0d0e', rough: 0.45, coat: 0.2 }));
      k.part(cyl(0.06, 0.06, 0.03, 0.78, 24), fin('silver'));
      k.top(0.8);
      return k.done();
    },

    'vr|Spicebomb': () => {
      const k = kit();
      const prof = [[0, 0], [0.22, 0], [0.3, 0.05], [0.33, 0.16], [0.335, 0.52], [0.3, 0.62], [0.2, 0.69], [0, 0.7]];
      k.glassBody(lathe(prof), glass({ tint: '#5e6368', op: 0.45 }), { color: '#d8cfb8', level: 0.84, inset: 0.86, op: 0.45 });
      const grooves = [];
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const b = new T.BoxGeometry(0.022, 0.5, 0.03); b.translate(0, 0.32, 0.333); b.rotateY(a); grooves.push(b); }
      for (const y of [0.17, 0.52]) { const t = new T.TorusGeometry(0.336, 0.012, 6, 48); t.rotateX(Math.PI / 2); t.translate(0, y, 0); grooves.push(t); }
      k.part(merge(grooves), solid({ color: '#1a1a1c', rough: 0.4, coat: 0 }));
      k.part(cyl(0.34, 0.34, 0.13, 0.285, 48), solid({ color: '#111113', rough: 0.3 }));
      k.wrap(0.343, 0.11, 0.35, 1.5, paint(1.5 * 0.343, 0.11, (P) => {
        P.text('SPICEBOMB', 0.5, 0.36, 0.34, '#f2f2f2', { font: 'helv', weight: 500, track: 0.04 });
        P.text('VIKTOR&ROLF', 0.5, 0.74, 0.26, '#f2f2f2', { font: 'helv', weight: 500, track: 0.08 });
      }));
      k.part(cyl(0.15, 0.15, 0.17, 0.7, 40), solid({ color: '#121214', rough: 0.25 }));
      const pin = new T.TorusGeometry(0.07, 0.012, 8, 28); pin.translate(0.19, 0.8, 0); k.part(pin, fin('silver'));
      const tag = new T.CylinderGeometry(0.05, 0.05, 0.012, 24); tag.rotateX(Math.PI / 2); tag.translate(0.24, 0.72, 0.02); k.part(tag, solid({ color: '#141414' }));
      k.top(0.72);
      return k.done();
    },

    'lattafa|Asad': () => {
      const k = kit();
      k.solidBody(box(0.48, 0.3, 0.62, 0.02), solid({ color: '#0b0b0b', rough: 0.15 }));
      k.flat(0.48, 0.62, 0, 0.31, 0.152, paint(0.48, 0.62, (P) => {
        const gold = '#d9b25e';
        P.path([[0, 0.4], [0.12, 0.38], [0.5, 0.5], [0.12, 0.62], [0, 0.6]], gold); P.path([[1, 0.4], [0.88, 0.38], [0.5, 0.5], [0.88, 0.62], [1, 0.6]], gold);
        P.circle(0.5, 0.5, 0.075, '#111'); P.circle(0.5, 0.5, 0.075, gold, 0.01); P.circle(0.5, 0.5, 0.045, gold, 0.006);
        P.text('أسد', 0.5, 0.22, 0.12, gold, { font: 'arabic', weight: 700 });
        P.text('ASAD', 0.5, 0.72, 0.045, gold, { font: 'roman', track: 0.25 });
        P.text('Lattafa', 0.5, 0.82, 0.04, gold, { font: 'helv' });
      }), { foil: true });
      k.part(cyl(0.17, 0.17, 0.2, 0.63, 48), solid({ color: '#0e0e0e', rough: 0.2 }));
      k.part(cyl(0.172, 0.172, 0.03, 0.63, 48), fin('gold'));
      k.top(0.63);
      return k.done();
    },

    'armani|Acqua di Giò Profumo': () => {
      const k = kit();
      k.solidBody(box(0.62, 0.34, 0.56, 0.15), solid({ color: '#141416', rough: 0.12 }));
      k.flat(0.5, 0.5, 0, 0.29, 0.172, paint(0.5, 0.5, (P) => {
        const s = '#d9dde2';
        P.text('ACQUA DI', 0.5, 0.2, 0.09, s, { font: 'roman', track: 0.04 });
        P.text('GIÒ', 0.5, 0.36, 0.2, s, { font: 'roman' });
        P.text('GIORGIO ARMANI', 0.5, 0.5, 0.05, s, { font: 'roman', track: 0.06 });
        P.text('PROFUMO', 0.5, 0.88, 0.045, s, { font: 'roman', track: 0.15 });
      }), { foil: true });
      k.part(cyl(0.15, 0.15, 0.025, 0.56, 48), fin('silver'));
      k.part(cyl(0.15, 0.15, 0.22, 0.585, 48), solid({ color: '#111113', rough: 0.2 }));
      k.top(0.58);
      return k.done();
    },

    'afnan|Supremacy Not Only Intense': () => {
      const k = kit();
      k.solidBody(gradient(box(0.56, 0.3, 0.58, 0.05), '#5d6168', '#b4b8be', 0.8), solid({ grad: true, metal: 0.7, rough: 0.3, coat: 0.3, env: 2 }));
      const med = new T.CylinderGeometry(0.09, 0.09, 0.02, 40); med.rotateX(Math.PI / 2); med.translate(0.1, 0.38, 0.155); k.part(med, fin('silver'));
      k.flat(0.5, 0.2, 0, 0.12, 0.152, paint(0.5, 0.2, (P) => {
        P.text('SUPREMACY', 0.5, 0.22, 0.17, '#e8e8ea', { font: 'roman', track: 0.25 });
        P.text('not only intense', 0.5, 0.5, 0.15, '#c81e2a', { font: 'serif', italic: true });
        P.text('AFNAN', 0.5, 0.8, 0.14, '#e8e8ea', { font: 'roman', track: 0.15 });
      }));
      k.part(cyl(0.07, 0.07, 0.1, 0.58, 24), fin('silver'));
      k.part(cyl(0.09, 0.09, 0.07, 0.68, 32), fin('silver'));
      k.part(new T.TorusGeometry(0.15, 0.025, 12, 48).translate(0, 0.9, 0), fin('chrome'));
      k.top(0.62);
      return k.done();
    },

    'rabanne|1 Million': () => {
      const k = kit();
      const gold = solid({ color: '#e0b347', metal: 1, rough: 0.16, coat: 0 });
      k.solidBody(box(0.4, 0.2, 0.62, 0.03), gold);
      k.part(box(0.4, 0.2, 0.13, 0.03, 0.63), gold);
      k.flat(0.34, 0.5, 0, 0.34, 0.102, paint(0.34, 0.5, (P) => {
        const ink = 'rgba(110,70,10,0.55)';
        P.text('1', 0.5, 0.2, 0.3, ink, { font: 'roman', weight: 700 });
        P.text('MILLION', 0.5, 0.42, 0.09, ink, { font: 'roman', weight: 700, track: 0.05 });
        P.path([[0.3, 0.55], [0.42, 0.5], [0.5, 0.62], [0.58, 0.5], [0.7, 0.55]], ink, false, 0.012);
        P.text('100 ml e 3.4 fl.oz', 0.5, 0.82, 0.035, ink, { font: 'helv' });
        P.rect(0.22, 0.88, 0.56, 0.05, 'rgba(110,70,10,0.18)'); P.text('paco rabanne', 0.5, 0.905, 0.035, ink, { font: 'helv', weight: 700 });
      }));
      k.top(0.76);
      return k.done();
    },

    'dior|Dior Homme Intense': () => {
      const k = kit();
      k.glassBody(box(0.56, 0.26, 0.7, 0.01), glass({ op: 0.22 }), { color: '#8a5514', level: 0.84, inset: 0.86, op: 0.95 });
      k.flat(0.05, 0.52, 0, 0.5, 0.132, paint(0.05, 0.52, (P) => P.rect(0, 0, 1, 1, '#0b0b0b'), 64));
      k.flat(0.5, 0.1, 0, 0.11, 0.133, paint(0.5, 0.1, (P) => {
        P.text('DIOR HOMME', 0.5, 0.32, 0.36, '#111', { font: 'roman', track: 0.05 });
        P.text('INTENSE', 0.5, 0.75, 0.3, '#111', { font: 'roman', track: 0.1 });
      }));
      k.part(box(0.26, 0.16, 0.2, 0.01, 0.7), solid({ color: '#0d0d0d', rough: 0.15 }));
      k.part(cyl(0.1, 0.1, 0.02, 0.7, 32), fin('silver'));
      k.top(0.7);
      return k.done();
    },
  };

  function khamrah(o) {
    const k = kit();
    // Clear glass carved with diagonal grooves: the groove edges catch the light.
    const carve = paint(1, 1, (P) => {
      P.rect(0, 0, 1, 1, '#000000');
      for (let i = -6; i < 14; i++) {
        for (let j = 0; j < 7; j++) {
          const x = i * 0.09 + (j % 2) * 0.045, y = j * 0.16;
          P.line(x, y, x + 0.12, y + 0.14, '#ffffff', 0.012); P.line(x + 0.03, y, x + 0.15, y + 0.14, '#5a5a5a', 0.008);
        }
      }
    }, 256);
    carve.wrapS = carve.wrapT = T.RepeatWrapping; carve.repeat.set(2, 2);
    const carved = glass({ tint: '#ffffff', op: 0.2, bump: carve, bumpScale: 0.05, env: 3.2 });
    carved.emissive = new T.Color(0xffffff); carved.emissiveMap = carve; carved.emissiveIntensity = 0.9;
    k.glassBody(box(0.78, 0.5, 0.52, 0.03), carved, { color: o.juice, level: 0.9, inset: 0.84, lift: 0.025, op: 0.97, glow: 0.1 });
    k.part(box(0.78, 0.5, 0.42, 0.03, 0.535), carved);
    k.flat(0.22, 0.22, 0.13, 0.24, 0.252, paint(0.22, 0.22, (P) => {
      P.rect(0, 0, 1, 1, o.label); P.frame(0.05, 0.05, 0.9, 0.9, 'rgba(255,255,255,0.7)', 0.012);
      P.text('خمرة', 0.5, 0.33, 0.3, '#fffaf0', { font: 'arabic', weight: 700 });
      P.text('KHAMRAH', 0.5, o.sub ? 0.56 : 0.6, 0.12, '#fffaf0', { font: 'helv', weight: 700, track: 0.1 });
      if (o.sub) P.text(o.sub, 0.5, 0.69, 0.1, '#fffaf0', { font: 'helv', weight: 700, track: 0.1 });
      P.text('Lattafa', 0.5, o.sub ? 0.84 : 0.8, 0.11, '#fffaf0', { font: 'serif', italic: true });
    }), { foil: true });
    k.top(0.52);
    return k.done();
    }

  function sauvage(top, bottom, brand, elixir) {
    const k = kit();
    k.glassBody(gradient(box(0.5, 0.3, 0.8, 0.05), bottom, top, 0.45), glass({ grad: true, op: 0.94 }), null);
    k.flat(0.48, 0.76, 0, 0.4, 0.152, paint(0.48, 0.76, (P) => {
      P.text(elixir === true ? 'SAUVAGE ELIXIR' : 'SAUVAGE', 0.5, 0.12, 0.085, '#e6e9ef', { font: 'roman', track: 0.03, maxW: 0.94 });
      if (typeof elixir === 'string') P.text(elixir, 0.5, 0.2, 0.025, '#e6e9ef', { font: 'helv', track: 0.2 });
      P.text(brand, 0.5, 0.88, 0.1, '#e6e9ef', { font: 'serif' });
    }), { foil: true });
    k.part(cyl(0.165, 0.165, 0.28, 0.81, 48), solid({ color: '#0a0b0f', rough: 0.12 }));
    for (const y of [1.0, 1.025, 1.05]) k.part(cyl(0.168, 0.168, 0.008, y, 48), solid({ color: '#30343d', rough: 0.3 }));
    k.top(0.81);
    return k.done();
  }

  function bleu(conc) {
    const k = kit();
    k.glassBody(box(0.7, 0.3, 0.66, 0.03), glass({ tint: '#0c1a36', op: 0.92 }), null);
    k.flat(0.6, 0.6, 0, 0.32, 0.152, paint(0.6, 0.6, (P) => {
      P.text('BLEU', 0.5, 0.28, 0.07, '#f2f2f2', { font: 'helv', weight: 600, track: 0.25 });
      P.text('DE', 0.5, 0.36, 0.035, '#f2f2f2', { font: 'helv', weight: 600, track: 0.25 });
      P.text('CHANEL', 0.5, 0.44, 0.07, '#f2f2f2', { font: 'helv', weight: 600, track: 0.25 });
      P.text(conc, 0.5, 0.9, 0.03, '#f2f2f2', { font: 'helv', weight: 500, track: 0.2 });
    }));
    k.part(cyl(0.1, 0.1, 0.14, 0.67, 40), solid({ color: '#0b0b0c', rough: 0.15 }));
    k.top(0.67);
    return k.done();
  }

  function torso(body, stripe, deep, op, capFin = 'chrome') {
    const k = kit();
    const prof = [[0, 0], [0.2, 0], [0.24, 0.06], [0.215, 0.2], [0.195, 0.31], [0.24, 0.45], [0.3, 0.58], [0.325, 0.67], [0.27, 0.75], [0.13, 0.81], [0.07, 0.835], [0, 0.84]];
    k.glassBody(gradient(lathe(prof, 0, 0.62, 56), deep, body, 0.8), glass({ grad: true, op }), null);
    if (stripe) {
      const stripes = paint(0.5, 1, (P) => { for (let i = 0; i < 9; i++) P.rect(0, 0.25 + i * 0.052, 1, 0.027, stripe); }, 128);
      const over = lathe(prof, 0, 0.62, 56); over.scale(1.006, 1, 1.006);
      k.part(over, new T.MeshStandardMaterial({ map: stripes, transparent: true, depthWrite: false, roughness: 0.25 }), 4);
    }
    k.part(cyl(0.065, 0.065, 0.1, 0.83, 32), fin(capFin));
    k.part(cyl(0.045, 0.045, 0.06, 0.93, 24), fin(capFin));
    k.top(0.94);
    return k.done();
  }

  const PRIVATE_BLEND = ['Oud Wood', 'Tobacco Vanille', 'Tuscan Leather', 'Lost Cherry', 'Fucking Fabulous', 'Costa Azzurra', 'Neroli Portofino', 'Soleil Blanc', 'Bitter Peach', 'Tobacco Oud', 'Rose Prick', 'Ébène Fumé', 'Oud Minérale', 'Electric Cherry', 'Vanilla Sex', 'Café Rose'];

  function specFor(item) {
    if (SPECS[item.key]) return SPECS[item.key];
    if (item.house === 'byredo') return byredo;
    if (item.house === 'creed' && !item.limited) return (it) => creed(it, {});
    if (item.house === 'tomford' && PRIVATE_BLEND.includes(item.name)) return (it) => tomFord(it, {});
    if (item.house === 'mfk') return (it) => mfk(it, {});
    if (item.house === 'pdm') return (it) => pdm(it, {});
    if (HOUSE_FALLBACK[item.house]) return HOUSE_FALLBACK[item.house];
    return null;
  }
  const HOUSE_FALLBACK = {};

  return {
    // Building blocks for js/bottles-designer.js, which adds the designer and house lines.
    tools: {
      kit, box, cyl, sphere, lathe, pillow, bands, merge, gradient, glass, solid, fin, paint, extrudeFlat: null,
      creed, torso, sauvage, byredo, tomFord, mfk, pdm, C: (hex) => C(hex), get T() { return T; },
    },
    add(specs) { Object.assign(SPECS, specs); },
    houseFallback(house, spec) { HOUSE_FALLBACK[house] = spec; },
    has(item) { return !!specFor(item); },
    // Drop a cached build so a spec registered again (e.g. a bottle being designed) rebuilds.
    forget(key) { delete built[key]; },
    // A ready-to-place copy of the bottle (geometry and materials are shared between copies).
    build(item) {
      T = window.THREE; if (!T) return null;
      const spec = specFor(item); if (!spec) return null;
      if (!built[item.key]) built[item.key] = spec(item);
      const b = built[item.key];
      const group = b.group.clone();
      return { group, pick: group.getObjectByName('pick'), top: b.top };
    },
  };
})();
