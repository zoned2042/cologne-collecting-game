/* Sillage — designer and house bottle lines, modelled from reference photos.
 * Most houses reuse one bottle across a line (Afnan Supremacy, Louis Vuitton,
 * Invictus, Polo, Eros, Maison Christian Dior...), so each line is a template
 * and every fragrance passes its own glass, juice, cap and label.
 */
(() => {
  const B = BottleCraft.tools;
  const { kit, box, cyl, sphere, lathe, pillow, bands, merge, gradient, glass, solid, fin, paint } = B;
  const T = () => B.T;

  /* ---------- generic builder ----------
   * body: box | pillow | cyl | lathe, with w (width), h (height), d (depth)
   * glass/op/juice for glass bodies, solid/metal for opaque ones, grad: [bottom, top]
   * cap: parts stacked upward from the body top; art: painted front artwork.
   */
  function matOf(c) {
    if (c.fin) return fin(c.fin);
    if (c.glass) return glass({ tint: c.glass, op: c.op != null ? c.op : 0.9 });
    return solid({ color: c.color || '#111111', rough: c.rough != null ? c.rough : 0.2, metal: c.metal || 0, coat: c.coat != null ? c.coat : 0.8, flat: !!(c.seg && c.seg < 12) });
  }
  function capGeo(c, y) {
    const t = T(); let g, h = c.h || 0;
    switch (c.s) {
      case 'cyl': g = cyl(c.r, c.rb != null ? c.rb : c.r, c.h, y, c.seg || 40); if (c.seg && c.seg < 12) g.rotateY(Math.PI / c.seg); break;
      case 'box': g = box(c.w, c.d || c.w, c.h, c.rr != null ? c.rr : 0.015, y); break;
      case 'sphere': { const sy = c.sy || 1; g = sphere(c.r, y + c.r * sy, c.sx || 1, sy, c.sz || 1); h = 2 * c.r * sy; break; }
      case 'lathe': g = lathe(c.pts, y, c.sz || 1, c.seg || 40); h = c.pts[c.pts.length - 1][1]; break;
      case 'ring': g = new t.TorusGeometry(c.r, c.tube || 0.022, 12, 48); g.translate(0, y + c.r, 0); h = 2 * c.r; break;
      case 'prof': g = profile(c.pts, c.d || 0.06, c.round != null ? c.round : 0.01); g.translate(0, y, 0); h = Math.max(...c.pts.map((q) => q[1])) - Math.min(...c.pts.map((q) => q[1])); break;
      case 'geo': ({ g, h } = c.make(y)); break;
      default: return null;
    }
    if (c.x || c.z) g.translate(c.x || 0, 0, c.z || 0);
    return { g, h };
  }
  function addCaps(k, caps, y0) {
    let y = y0;
    for (const c of caps || []) {
      const r = capGeo(c, y + (c.dy || 0)); if (!r) continue;
      k.part(r.g, matOf(c));
      if (!c.stay) y += r.h;
    }
    return y;
  }
  function addArt(k, o, a, W, H, D) {
    const wrap = a.wrap || o.body === 'cyl' || o.body === 'lathe';
    const r = a.r || W / 2 + 0.004;
    const aw = a.w || (wrap ? (a.arc || 1.6) * r : W * 0.86), ah = a.h || H * 0.86;
    const tex = paint(aw, ah, (P) => {
      if (a.bg) P.rect(0, 0, 1, 1, a.bg, a.round || 0);
      if (a.frame) P.frame(0.05, 0.05, 0.9, 0.9, a.frame, 0.01);
      (a.t || []).forEach(([s, yy, sz, col, opt]) => P.text(s, (opt && opt.x) != null ? opt.x : 0.5, yy, sz, col, opt || {}));
      if (a.draw) a.draw(P);
    });
    if (wrap) k.wrap(r, ah, a.y != null ? a.y : H / 2, a.arc || 1.6, tex, { sz: a.sz || (D / W), foil: a.foil });
    else k.flat(aw, ah, a.x || 0, a.y != null ? a.y : H / 2, (a.z != null ? a.z : D / 2) + 0.003, tex, { foil: a.foil });
  }
  function Q(o) {
    const k = kit();
    const W = o.w || 0.5, H = o.h || 0.7, D = o.d || 0.3;
    let geo;
    switch (o.body || 'box') {
      case 'box': geo = box(W, D, H, o.r != null ? o.r : 0.03); break;
      case 'pillow': geo = pillow(W, H, D, o.ex || 0.3, o.ey || 0.3); break;
      case 'cyl': geo = cyl(W / 2, (o.wb || W) / 2, H, 0, o.seg || 48); if (o.seg && o.seg < 12) geo.rotateY(Math.PI / o.seg); geo.scale(1, 1, D / W); break;
      case 'lathe': geo = lathe(o.pts, 0, 1, o.seg || 48); if (o.seg && o.seg < 12) geo.rotateY(Math.PI / o.seg); geo.scale(1, 1, D / W); break;
      case 'sphere': geo = sphere(1, H / 2, W / 2, H / 2, D / 2); break;
      case 'profile': geo = profile(o.pts, D, o.round || 0.03); break;
      case 'geo': geo = o.geo(); break;
    }
    if (o.grad) gradient(geo, o.grad[0], o.grad[1], o.gc || 0.8);
    const flat = !!(o.seg && o.seg < 12);
    if (o.solid || o.metal) {
      k.solidBody(geo, solid({ color: o.solid, metal: o.metal ? (o.metal === true ? 1 : o.metal) : 0, rough: o.rough != null ? o.rough : (o.metal ? 0.25 : 0.18), coat: o.coat != null ? o.coat : (o.metal ? 0 : 0.8), grad: !!o.grad, flat, env: o.env || (o.metal ? 2.2 : 1.4) }));
    } else {
      k.glassBody(geo, glass({ tint: o.glass, op: o.op != null ? o.op : (o.glass || o.grad ? 0.85 : 0.16), grad: !!o.grad, flat }), null);
      if (o.juice) {
        // Unlit juice keeps its true colour under the glossy shell.
        const ins = o.inset || 0.93, jg = geo.clone(); jg.scale(ins, o.level || 0.88, ins); jg.translate(0, 0.025, 0);
        if (o.jgrad) gradient(jg, o.jgrad[0], o.jgrad[1], 0.7);
        k.part(jg, new (T().MeshBasicMaterial)(o.jgrad ? { vertexColors: true, transparent: true, opacity: o.jop || 0.9, depthWrite: false } : { color: B.C(o.juice), transparent: true, opacity: o.jop || 0.9, depthWrite: false }), 1);
      }
    }
    [].concat(o.skin || []).forEach((sk, i) => addSkin(k, geo, o, sk, W, H, D, i));
    addCaps(k, o.cap, H);
    [].concat(o.art || []).forEach((a) => addArt(k, o, a, W, H, D));
    (o.extra || []).forEach((fn) => fn(k, { W, H, D }));
    k.top(o.top || H);
    return k.done();
  }
  const S = (o) => () => Q(o);
  // A pattern printed all the way round the body: a slightly larger copy of the body
  // geometry, UV-mapped by walking round its outline so the artwork follows any shape.
  function addSkin(k, geo, o, sk, W, H, D, i) {
    const t = T();
    const round = sk.round != null ? sk.round : (o.body === 'lathe' || o.body === 'sphere' || (o.body === 'cyl' && !(o.seg && o.seg < 8)));
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    const grow = 1.005 + i * 0.004; g.scale(grow, 1 + (grow - 1) / 2, grow);
    const per = round ? Math.PI * (W + D) / 2 : 2 * (W + D);
    const pos = g.attributes.position, n = pos.count, uv = new Float32Array(n * 2);
    for (let j = 0; j < n; j++) {
      const x = pos.getX(j), y = pos.getY(j), z = pos.getZ(j);
      let u;
      if (round) u = Math.atan2(x / W, z / D) / (Math.PI * 2) + 0.5;
      else {
        // Perimeter position round a W x D rectangle, front centre at u = 0.5.
        const a = x / (W / 2), b = z / (D / 2);
        const s = Math.abs(b) >= Math.abs(a) ? (b >= 0 ? W / 2 + x : W + D + (W / 2 - x)) : (a > 0 ? W + (D / 2 - z) : 2 * W + D + (z + D / 2));
        u = (s - W / 2) / per + 0.5; u -= Math.floor(u);
      }
      uv[j * 2] = u; uv[j * 2 + 1] = y / H;
    }
    // Triangles straddling the back seam take the long way round otherwise.
    for (let j = 0; j + 2 < n; j += 3) {
      const a = uv[j * 2], b = uv[j * 2 + 2], c = uv[j * 2 + 4];
      if (Math.max(a, b, c) - Math.min(a, b, c) > 0.5) for (let q = 0; q < 3; q++) if (uv[(j + q) * 2] < 0.5) uv[(j + q) * 2] += 1;
    }
    g.setAttribute('uv', new t.BufferAttribute(uv, 2));
    const tex = paint(per, H, sk.draw, 2048); tex.wrapS = t.RepeatWrapping;
    const mat = new t.MeshStandardMaterial(sk.opaque
      ? { map: tex, roughness: sk.rough != null ? sk.rough : 0.6, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1 - i }
      : { map: tex, transparent: true, depthWrite: false, roughness: sk.foil ? 0.25 : 0.45, metalness: sk.foil ? 0.8 : 0, polygonOffset: true, polygonOffsetFactor: -2 - i, side: t.DoubleSide });
    k.part(g, mat, sk.opaque ? 0 : 4);
  }
  // A front-view outline extruded to depth d, corners rounded by rr, standing on y = 0.
  function profile(pts, d, rr) {
    const t = T(), sh = new t.Shape(), n = pts.length, bv = Math.min(0.02, d / 4);
    const at = (i) => pts[(i + n) % n];
    for (let i = 0; i < n; i++) {
      const [x, y] = at(i), [px, py] = at(i - 1), [nx, ny] = at(i + 1);
      const l1 = Math.hypot(px - x, py - y), l2 = Math.hypot(nx - x, ny - y), r = Math.min(rr, l1 / 2, l2 / 2);
      const ax = x + (px - x) / l1 * r, ay = y + (py - y) / l1 * r, bx = x + (nx - x) / l2 * r, by = y + (ny - y) / l2 * r;
      if (i) sh.lineTo(ax, ay); else sh.moveTo(ax, ay);
      sh.quadraticCurveTo(x, y, bx, by);
    }
    const g = new t.ExtrudeGeometry(sh, { depth: d - 2 * bv, bevelEnabled: true, bevelThickness: bv, bevelSize: bv * 0.8, bevelSegments: 3, curveSegments: 10 });
    g.computeBoundingBox(); g.translate(0, -g.boundingBox.min.y, -(d - 2 * bv) / 2);
    return g;
  }
  const disc = (r, y, z, mat, depth = 0.02) => { const g = new (T().CylinderGeometry)(r, r, depth, 40); g.rotateX(Math.PI / 2); g.translate(0, y, z); return [g, mat]; };

  /* ---------- Afnan ---------- */
  const nine = (o) => S({
    w: 0.5, h: 0.72, d: 0.2, r: 0.06, glass: o.frame, op: o.op || 0.85,
    art: { w: 0.44, h: 0.66, z: 0.1, bg: o.panel, round: 0.02, t: [['9', 0.34, 0.6, o.num, { font: 'serif', weight: 400 }], [o.pm || 'pm', 0.56, 0.12, o.pmc || '#111111', { font: 'serif', weight: 700 }], [o.sub || '', 0.7, 0.07, o.num, { font: o.subFont || 'helv', weight: 600, italic: !!o.subItalic, track: o.subItalic ? 0 : 0.1 }], ['AFNAN', 0.86, 0.045, o.num, { font: 'helv', track: 0.2 }]], draw: o.draw },
    cap: [{ s: 'cyl', r: 0.05, h: 0.07, fin: 'silver' }, Object.assign({ s: 'sphere', r: 0.1 }, o.cap)],
  });
  const decoLines = (P) => { for (let i = 0; i < 9; i++) P.path([[0, 0.1 + i * 0.1], [0.3, 0.05 + i * 0.1], [0.3, 0.12 + i * 0.1], [1, 0.08 + i * 0.1]], 'rgba(226,178,92,0.35)', false, 0.006); };

  const supremacy = (o) => () => {
    const k = kit();
    const W = 0.48, H = 0.66, D = 0.24;
    const geo = box(W, D, H, 0.05);
    if (o.grad) gradient(geo, o.grad[0], o.grad[1], 0.8);
    k.solidBody(geo, solid({ color: o.color, grad: !!o.grad, metal: o.metal != null ? o.metal : 0.7, rough: 0.3, coat: 0.3, env: 2 }));
    if (o.speckle) k.flat(W, H, 0, H / 2, D / 2 + 0.003, paint(W, H, (P) => { for (let i = 0; i < 170; i++) { const x = (Math.sin(i * 12.9898) * 43758.5453) % 1, y = (Math.sin(i * 78.233) * 12345.678) % 1; P.circle(Math.abs(x), Math.abs(y), 0.004 + (i % 4) * 0.003, '#111111'); } }));
    const med = disc(0.075, 0.47, D / 2 + 0.005, matOf(o.med || { fin: 'silver' }));
    med[0].translate(0.12, 0, 0);
    k.part(med[0], med[1]);
    k.flat(0.44, 0.2, 0, 0.13, D / 2 + 0.003, paint(0.44, 0.2, (P) => {
      P.text(o.title || 'SUPREMACY', 0.5, 0.22, 0.15, o.ink || '#e8e8ea', { font: 'roman', track: 0.3 });
      if (o.sub) P.text(o.sub, 0.5, 0.5, 0.15, o.subInk || o.ink || '#e8e8ea', { font: 'serif', italic: /[a-z]/.test(o.sub) });
      P.text('AFNAN', 0.5, 0.8, 0.12, o.ink || '#e8e8ea', { font: 'roman', track: 0.15 });
    }));
    k.part(cyl(0.06, 0.06, 0.1, H, 24), matOf(o.ring || { fin: 'silver' }));
    k.part(cyl(0.075, 0.075, 0.05, H + 0.1, 32), matOf(o.ring || { fin: 'silver' }));
    k.part(new (T().TorusGeometry)(0.12, 0.022, 12, 48).translate(0, H + 0.27, 0), matOf(o.ring || { fin: 'chrome' }));
    k.top(H + 0.04);
    return k.done();
  };

  // Turathi: a faceted gem that widens to square shoulders, with a tulip cap.
  const turathi = (o) => () => {
    const k = kit();
    const geo = lathe([[0, 0], [0.17, 0], [0.19, 0.03], [0.4, 0.72], [0.37, 0.79], [0.15, 0.87], [0.09, 0.9], [0, 0.9]], 0, 1, 6);
    geo.rotateY(Math.PI / 6); geo.scale(1, 1, 0.5);
    k.glassBody(geo, glass({ tint: o.glass, op: o.op || 0.88, flat: true }), null);
    k.flat(0.3, 0.24, 0, 0.5, 0.15, paint(0.3, 0.24, (P) => {
      P.text('تراثي', 0.5, 0.3, 0.32, o.ink || '#f2f2f2', { font: 'arabic', weight: 700 });
      P.text('Turathi', 0.5, 0.62, 0.13, o.ink || '#f2f2f2', { font: 'serif', track: 0.1 });
      if (o.sub) P.text(o.sub, 0.5, 0.82, 0.13, o.ink || '#f2f2f2', { font: 'serif', italic: true });
    }));
    k.part(cyl(0.07, 0.07, 0.05, 0.9, 24), fin(o.cap === 'black' ? 'silver' : o.cap));
    k.part(lathe([[0, 0], [0.08, 0], [0.13, 0.05], [0.17, 0.13], [0.16, 0.2], [0.11, 0.25], [0, 0.26]], 0.95, 1, 8), o.cap === 'black' ? solid({ color: '#0d0d0d', rough: 0.15, flat: true }) : solid({ color: o.cap === 'gold' ? '#e0b95f' : '#e4e8ec', metal: 1, rough: 0.2, coat: 0, flat: true, env: 2.4 }));
    k.top(0.92);
    return k.done();
  };

  // Rare: a wide barrel under a notched metal collar and a tall faceted cap.
  const rare = (o) => () => {
    const k = kit();
    const geo = lathe([[0, 0], [0.2, 0], [0.225, 0.02], [0.24, 0.1], [0.25, 0.3], [0.245, 0.5], [0.235, 0.55], [0, 0.55]], 0, 1, 48); geo.scale(1, 1, 0.85);
    if (o.grad) gradient(geo, o.grad[0], o.grad[1], 0.8);
    k.glassBody(geo, glass({ tint: o.glass, grad: !!o.grad, op: o.op || 0.85 }), null);
    k.wrap(0.252, 0.24, 0.3, 1.3, paint(1.3 * 0.252, 0.24, (P) => {
      P.text('Rare', 0.5, 0.25, 0.3, o.ink, { font: 'serif', italic: true, shadow: 'rgba(0,0,0,0.25)' });
      P.text(o.sub, 0.5, 0.55, 0.13, o.ink, { font: 'roman', track: 0.3 });
      P.text('AFNAN', 0.5, 0.85, 0.1, o.ink, { font: 'roman', track: 0.15 });
    }), { sz: 0.85 });
    const steel = solid({ color: '#e2e6ea', metal: 1, rough: 0.3, coat: 0, env: 2.6 });
    const col = cyl(0.255, 0.255, 0.09, 0.55, 12); col.rotateY(Math.PI / 12); col.scale(1, 1, 0.88); k.part(col, steel);
    const cp = cyl(0.17, 0.17, 0.12, 0.64, 10); cp.rotateY(Math.PI / 10); k.part(cp, steel);
    const tp = cyl(0.13, 0.15, 0.06, 0.76, 10); tp.rotateY(Math.PI / 10); k.part(tp, steel);
    k.top(0.58);
    return k.done();
  };

  /* ---------- Louis Vuitton ---------- */
  const LV_PTS = [[0, 0], [0.17, 0], [0.19, 0.015], [0.196, 0.05], [0.196, 0.45], [0.188, 0.51], [0.16, 0.55], [0.11, 0.575], [0.085, 0.585], [0.08, 0.6], [0, 0.6]];
  const LV_EXTRAIT = [[0, 0], [0.14, 0], [0.158, 0.02], [0.168, 0.12], [0.158, 0.27], [0.162, 0.4], [0.152, 0.49], [0.115, 0.55], [0.078, 0.575], [0.075, 0.6], [0, 0.6]];
  const lv = (o) => (item) => {
    const k = kit();
    const pts = o.extrait ? LV_EXTRAIT : LV_PTS, R = o.extrait ? 0.168 : 0.196;
    // Clear glass shell around a coloured juice that fades top to bottom.
    k.glassBody(lathe(pts, 0, 1, 56), glass({ op: 0.16, env: 2.6 }), null);
    const jg = gradient(lathe(pts, 0, 1, 56), o.bottom, o.top, 0.7); jg.scale(0.965, 0.93, 0.965); jg.translate(0, 0.012, 0);
    const jm = new (T().MeshBasicMaterial)({ vertexColors: true, transparent: true, opacity: o.op || 0.88, depthWrite: false });
    k.part(jg, jm, 1);
    const ink = o.ink || '#141414';
    k.wrap(R + 0.003, 0.1, o.extrait ? 0.26 : 0.3, 1.4, paint(1.4 * (R + 0.003), 0.1, (P) => {
      P.text(item.name.toUpperCase(), 0.5, 0.3, 0.36, ink, { font: 'helv', weight: 700, track: 0.04, maxW: 0.86 });
      P.text('LOUIS VUITTON', 0.5, 0.74, 0.26, o.sub || 'rgba(255,255,255,0.6)', { font: 'helv', weight: 400, track: 0.12, maxW: 0.76 });
    }), { foil: !!o.foil });
    const black = solid({ color: '#0c0c0c', rough: 0.22, coat: 1 });
    if (o.extrait) {
      // Les Extraits: a crumpled chrome sculpture on a gold collar.
      k.part(cyl(0.08, 0.08, 0.06, 0.6, 24), fin('gold'));
      const shards = [];
      for (let i = 0; i < 9; i++) {
        const b = new (T().BoxGeometry)(0.2 - i * 0.008, 0.04, 0.24 - i * 0.012);
        b.rotateZ(0.5 + i * 0.7); b.rotateY(i * 1.3); b.rotateX(0.5 * Math.sin(i * 2.1));
        b.translate(Math.sin(i * 1.7) * 0.07, 0.76 + (i % 4) * 0.045, Math.cos(i * 1.3) * 0.05); shards.push(b);
      }
      k.part(merge(shards), solid({ color: '#f4f6f8', metal: 1, rough: 0.16, coat: 0, flat: true, env: 3 }));
    } else {
      k.part(cyl(0.085, 0.085, 0.05, 0.6, 32), black);
      k.part(cyl(0.1, 0.085, 0.025, 0.65, 32), black);
      k.part(cyl(0.075, 0.075, 0.035, 0.675, 32), black);
      k.part(lathe([[0, 0], [0.11, 0], [0.135, 0.02], [0.14, 0.07], [0.13, 0.08], [0, 0.08]], 0.71, 1, 48), black);
      const lid = new (T().PlaneGeometry)(0.2, 0.2); lid.rotateX(-Math.PI / 2); lid.translate(0, 0.792, 0);
      const flower = paint(0.2, 0.2, (P) => { for (let i = 0; i < 4; i++) P.ellipse(0.5, 0.5, 0.4, 0.12, i * Math.PI / 4, 'rgba(190,190,195,0.85)'); P.circle(0.5, 0.5, 0.08, '#0c0c0c'); });
      k.part(lid, new (T().MeshStandardMaterial)({ map: flower, transparent: true, metalness: 0.6, roughness: 0.3, depthWrite: false }), 4);
    }
    k.top(0.6);
    return k.done();
  };

  /* ---------- Creed (millésime bottle) ---------- */
  const cr = (o) => (item) => B.creed(item, o);

  /* ---------- Maison Christian Dior ---------- */
  const mcd = (juice) => (item) => Q({
    w: 0.3, h: 0.82, d: 0.3, r: 0.035, juice, level: 0.9,
    art: { w: 0.26, h: 0.16, y: 0.6, bg: '#f6f6f4', t: [[item.name.toUpperCase(), 0.3, 0.15, '#2a2a2a', { font: 'serif', maxW: 0.9 }], ['CHRISTIAN DIOR', 0.62, 0.1, '#2a2a2a', { font: 'serif' }], ['PARIS', 0.8, 0.07, '#2a2a2a', { font: 'serif' }]] },
    cap: [{ s: 'cyl', r: 0.08, h: 0.02, fin: 'silver' }, { s: 'cyl', r: 0.125, h: 0.24, color: '#0c0c0c', seg: 28 }],
  });

  /* ---------- Chanel ---------- */
  const allure = (o) => S({
    w: 0.62, h: 0.58, d: 0.26, r: 0.03, solid: '#cccccc', grad: o.grad, metal: 0.35,
    art: { t: [['ALLURE', 0.22, 0.13, o.ink, { font: 'helv', weight: 400, track: 0.35 }], ['HOMME', 0.4, 0.05, o.ink, { font: 'helv', track: 0.4 }], [o.sub || '', 0.5, 0.06, o.subInk || '#d6252b', { font: 'helv', track: 0.3 }], [o.foot || '', 0.86, 0.035, o.ink, { font: 'helv', track: 0.2 }]] },
    cap: [{ s: 'cyl', r: 0.13, h: 0.06, fin: 'chrome' }, { s: 'cyl', r: 0.13, h: 0.16, color: o.cap || '#0d0d0d' }],
  });
  const exclusif = (juice) => (item) => Q({
    w: 0.3, h: 0.8, d: 0.2, r: 0.02, juice, level: 0.86,
    art: { w: 0.18, h: 0.15, y: 0.6, bg: '#ffffff', t: [[item.name.toUpperCase().replace(' CHANEL', ''), 0.24, 0.1, '#222222', { font: 'helv' }], ['CHANEL', 0.52, 0.17, '#111111', { font: 'helv', weight: 700, track: 0.1 }], ['PARIS', 0.78, 0.08, '#222222', { font: 'helv' }]] },
    cap: [{ s: 'cyl', r: 0.085, h: 0.18, color: '#0b0b0b' }],
  });
  const chanelClassic = (juice, lines) => S({
    w: 0.56, h: 0.5, d: 0.26, r: 0.01, juice, level: 0.9,
    art: { w: 0.24, h: 0.22, y: 0.28, bg: '#ffffff', frame: '#111111', t: lines },
    cap: [{ s: 'cyl', r: 0.07, h: 0.04, fin: 'gold' }, { s: 'box', w: 0.26, d: 0.12, h: 0.14, glass: '#ffffff', op: 0.45 }],
  });

  /* ---------- Dior Homme ---------- */
  const dhomme = (o) => S({
    w: 0.44, h: 0.8, d: 0.24, r: 0.01, juice: o.juice, level: 0.9, inset: 0.92, glass: o.frame, op: o.frame ? 0.45 : 0.16,
    art: [{ w: 0.055, h: 0.7, y: 0.4, bg: '#0b0b0b' }, { w: 0.4, h: 0.1, y: 0.08, t: [[o.sub || '', 0.5, 0.5, o.subInk || '#d6252b', { font: 'serif' }]] }],
    cap: [{ s: 'box', w: 0.42, d: 0.22, h: 0.17, color: '#0b0b0b' }],
    extra: [(k) => k.flat(0.3, 0.13, 0, 0.885, 0.113, paint(0.3, 0.13, (P) => { P.text('Dior', 0.5, 0.4, 0.5, '#f2f2f2', { font: 'serif' }); P.text('HOMME', 0.5, 0.84, 0.18, '#f2f2f2', { font: 'serif', track: 0.1 }); }))],
  });

  /* ---------- Versace ---------- */
  const eros = (o) => () => {
    const k = kit();
    k.glassBody(box(0.7, 0.3, 0.6, 0.02), glass({ tint: o.body, op: o.op || 0.88 }), null);
    const e = o.relief || 'rgba(255,255,255,0.28)', d2 = 'rgba(0,0,0,0.35)';
    k.flat(0.66, 0.56, 0, 0.3, 0.152, paint(0.66, 0.56, (P) => {
      for (let i = 0; i < 12; i++) { const x = 0.04 + i * 0.077; P.path([[x, 0.06], [x + 0.05, 0.06], [x + 0.05, 0.12], [x + 0.02, 0.12], [x + 0.02, 0.09]], e, false, 0.008); P.path([[x, 0.94], [x + 0.05, 0.94], [x + 0.05, 0.88], [x + 0.02, 0.88], [x + 0.02, 0.91]], e, false, 0.008); }
      P.ellipse(0.5, 0.43, 0.2, 0.24, 0, d2);
      for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; P.path([[0.5 + Math.cos(a) * 0.075, 0.43 + Math.sin(a) * 0.1], [0.5 + Math.cos(a + 0.18) * 0.1, 0.43 + Math.sin(a + 0.18) * 0.145], [0.5 + Math.cos(a - 0.05) * 0.128, 0.43 + Math.sin(a - 0.05) * 0.17]], e, false, 0.012); }
      P.ellipse(0.5, 0.45, 0.075, 0.1, 0, e);
      P.text('VERSACE', 0.5, 0.72, 0.09, o.ink || '#e9c46a', { font: 'roman', weight: 600, track: 0.12 });
      P.text(o.sub || 'EROS', 0.5, 0.8, 0.05, o.ink || '#e9c46a', { font: 'roman', weight: 600, track: 0.2 });
    }), { foil: true });
    k.part(cyl(0.12, 0.12, 0.14, 0.61, 40), o.capGlass ? glass({ tint: o.capGlass, op: 0.92 }) : solid({ color: o.cap, metal: o.capMetal || 0.6, rough: 0.25, coat: 0.3, env: 2 }));
    k.part(cyl(0.12, 0.12, 0.035, 0.75, 40), fin('gold'));
    k.top(0.61);
    return k.done();
  };
  const versacePH = (o) => S({
    w: 0.58, h: 0.64, d: 0.26, r: 0.03, grad: o.grad, op: 0.95, gc: 0.5,
    extra: [(k) => { const m = disc(0.075, 0.28, 0.133, fin('gold')); k.part(m[0], m[1]); }],
    cap: o.cap,
  });

  /* ---------- Prada ---------- */
  const lunaRossa = (o) => S({
    w: 0.64, h: 0.6, d: 0.26, r: 0.08, grad: o.grad, solid: o.solid, metal: o.metal, op: 0.95, gc: 0.4,
    art: [{ w: 0.06, h: 0.42, y: 0.4, bg: '#c8102e', draw: (P) => ['P', 'R', 'A', 'D', 'A'].forEach((ch, i) => P.text(ch, 0.5, 0.16 + i * 0.16, 0.09, '#ffffff', { font: 'roman', weight: 700 })) },
      { w: 0.5, h: 0.08, y: 0.07, t: [[o.sub || '', 0.5, 0.5, 0.36, '#e8e8e8', { font: 'helv', weight: 700, track: 0.5 }]] }],
    cap: [{ s: 'cyl', r: 0.1, h: 0.2, fin: o.capFin, color: o.cap }, { s: 'sphere', r: 0.018, z: 0.07, dy: -0.06, color: '#d0102a', stay: true }],
    extra: o.base ? [(k) => k.part(box(0.646, 0.266, 0.2, 0.08), solid({ color: o.base, rough: 0.75, coat: 0 }))] : [],
  });

  /* ---------- Rabanne ---------- */
  const trophy = (o) => () => {
    const k = kit();
    const pts = [[0, 0], [0.16, 0], [0.16, 0.04], [0.09, 0.07], [0.09, 0.13], [0.15, 0.15], [0.22, 0.24], [0.27, 0.4], [0.29, 0.56], [0.29, 0.66], [0, 0.66]];
    const [foot, cup] = bands(pts, [0.14]).map((p) => { const g = lathe(p, 0, 1, 48); g.scale(1, 1, 0.62); return g; });
    if (o.grad) gradient(cup, o.grad[0], o.grad[1], 0.6);
    if (o.solid) k.solidBody(cup, solid({ color: o.solid, rough: 0.15 })); else k.glassBody(cup, glass({ tint: o.glass, grad: !!o.grad, op: o.op || 0.85 }), null);
    k.part(foot, o.foot ? glass({ tint: o.foot, op: 0.8 }) : glass({ op: 0.45 }));
    const band = matOf(o.band || { fin: 'chrome' });
    const top = cyl(0.3, 0.3, 0.1, 0.66, 48); top.scale(1, 1, 0.62); k.part(top, band);
    const rib = []; for (let i = 0; i < 4; i++) { const t = new (T().TorusGeometry)(0.302, 0.007, 6, 48); t.rotateX(Math.PI / 2); t.scale(1, 0.62, 1); t.translate(0, 0.68 + i * 0.02, 0); rib.push(t); }
    k.part(merge(rib), solid({ color: '#2a2a2c', metal: 0.5, rough: 0.3 }));
    const lid = cyl(0.24, 0.27, 0.06, 0.76, 48); lid.scale(1, 1, 0.62); k.part(lid, band);
    for (const sx of [-1, 1]) { const V = T().Vector3, c = new (T().CatmullRomCurve3)([new V(sx * 0.27, 0.74, 0), new V(sx * 0.36, 0.73, 0), new V(sx * 0.37, 0.6, 0), new V(sx * 0.33, 0.42, 0), new V(sx * 0.27, 0.36, 0)]); k.part(new (T().TubeGeometry)(c, 24, 0.02, 8), band); }
    if (o.letter || o.draw) k.flat(0.3, 0.26, 0, 0.42, 0.185, paint(0.3, 0.26, (P) => { if (o.letter) P.text(o.letter, 0.5, 0.5, 0.75, o.ink || '#d9b25e', { font: 'serif' }); if (o.draw) o.draw(P); }), { foil: true });
    k.top(0.76);
    return k.done();
  };
  const wings = (P) => { for (const s of [-1, 1]) for (let i = 0; i < 5; i++) P.path([[0.5 + s * 0.04, 0.7], [0.5 + s * (0.14 + i * 0.05), 0.2 + i * 0.08], [0.5 + s * (0.1 + i * 0.04), 0.3 + i * 0.08]], '#f2f2f2', true); };

  // 1 Million Parfum: a taller ingot with rounded corners and an engraved sunburst, no separate cap.
  const millionParfum = () => {
    const k = kit(), t = T();
    const W = 0.4, H = 0.8, D = 0.17, R = 0.085, bv = 0.02;
    const w = W / 2 - bv, h = H - 2 * bv, r = R - bv, sh = new t.Shape();
    sh.moveTo(-w + r, 0); sh.lineTo(w - r, 0); sh.quadraticCurveTo(w, 0, w, r); sh.lineTo(w, h - r); sh.quadraticCurveTo(w, h, w - r, h);
    sh.lineTo(-w + r, h); sh.quadraticCurveTo(-w, h, -w, h - r); sh.lineTo(-w, r); sh.quadraticCurveTo(-w, 0, -w + r, 0);
    const g = new t.ExtrudeGeometry(sh, { depth: D - 2 * bv, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 3, curveSegments: 12 });
    g.translate(0, bv, -(D - 2 * bv) / 2);
    k.solidBody(g, solid({ color: '#e8bc4e', metal: 1, rough: 0.28, coat: 0, env: 2.6 }));
    k.part(sphere(0.022, H - 0.06, 1, 1.3, 0.4).translate(0, 0, D / 2), solid({ color: '#1a1206', rough: 0.4 }));
    k.flat(0.36, 0.66, 0, 0.42, D / 2 + 0.003, paint(0.36, 0.66, (P) => {
      const ink = 'rgba(92,56,4,0.85)', cx = 0.5, cy = 0.42;
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2, r1 = 0.16, r2 = i % 2 ? 0.34 : 0.42, ax = 0.66 / 0.36;
        P.line(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 / ax, cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 / ax, ink, i % 2 ? 0.004 : 0.007);
      }
      P.circle(cx, cy, 0.075, ink, 0.008); P.circle(cx, cy, 0.062, ink, 0.004);
      P.text('1', cx, cy, 0.09, ink, { font: 'roman', weight: 700 });
      P.text('MILLION', 0.5, 0.7, 0.085, ink, { font: 'roman', weight: 700, track: 0.04 });
      P.text('PARFUM', 0.5, 0.79, 0.065, ink, { font: 'roman', weight: 700, track: 0.08 });
      P.text('rabanne', 0.5, 0.97, 0.06, ink, { font: 'helv', weight: 600 });
    }));
    k.top(H);
    return k.done();
  };
  const goldBar = (o) => () => {
    const k = kit();
    const gold = solid({ color: '#e0b347', metal: 1, rough: 0.16, coat: 0, env: 2.4 });
    k.solidBody(box(0.4, 0.2, 0.62, 0.03), gold);
    k.part(box(0.4, 0.2, 0.13, 0.03, 0.63), gold);
    k.flat(0.34, 0.5, 0, 0.34, 0.102, paint(0.34, 0.5, (P) => {
      const ink = 'rgba(110,70,10,0.55)';
      if (o.badge) { P.rect(0.3, 0.06, 0.4, 0.3, o.badge, 0.04); P.text('1', 0.5, 0.21, 0.24, '#e8c060', { font: 'roman', weight: 700 }); }
      else P.text('1', 0.5, 0.2, 0.3, ink, { font: 'roman', weight: 700 });
      P.text('MILLION', 0.5, 0.45, 0.09, ink, { font: 'roman', weight: 700, track: 0.05 });
      if (o.sub) P.text(o.sub, 0.5, 0.55, 0.06, ink, { font: 'roman', weight: 700, track: 0.1 });
      P.rect(0.22, 0.88, 0.56, 0.05, 'rgba(110,70,10,0.18)'); P.text('paco rabanne', 0.5, 0.905, 0.035, ink, { font: 'helv', weight: 700 });
    }));
    k.top(0.76);
    return k.done();
  };

  const phantom = () => {
    const k = kit();
    const chrome = solid({ color: '#e6e9ec', metal: 1, rough: 0.12, coat: 0, env: 2.8 });
    k.solidBody(box(0.5, 0.3, 0.4, 0.06, 0.24), chrome);
    for (const sx of [-0.12, 0.12]) k.part(box(0.16, 0.24, 0.24, 0.04, 0), chrome).position.x = sx;
    for (const sx of [-0.3, 0.3]) k.part(box(0.1, 0.2, 0.26, 0.04, 0.32), chrome).position.x = sx;
    k.part(cyl(0.08, 0.08, 0.06, 0.64, 24), chrome);
    k.part(box(0.44, 0.26, 0.2, 0.06, 0.7), chrome);
    k.flat(0.32, 0.08, 0, 0.8, 0.133, paint(0.32, 0.08, (P) => P.rect(0, 0, 1, 1, '#0b0b0b', 0.5)));
    k.flat(0.36, 0.3, 0, 0.44, 0.153, paint(0.36, 0.3, (P) => { P.rect(0, 0, 1, 1, '#0b0b0b', 0.08); P.text('P', 0.5, 0.52, 0.85, '#f2f2f2', { font: 'helv', weight: 800 }); }));
    k.top(0.9);
    return k.done();
  };

  /* ---------- Givenchy Gentleman ---------- */
  const gentleman = (o) => S({
    w: 0.56, h: 0.6, d: 0.32, r: 0.12, grad: o.grad, solid: o.solid, op: 0.95, gc: 0.55,
    art: { w: 0.5, h: o.band ? 0.16 : 0.14, y: o.y || 0.36, bg: o.band, t: [['GENTLEMAN', 0.42, 0.28, o.ink || '#f0f0f0', { font: 'helv', weight: 500, track: 0.2 }], ['GIVENCHY', 0.74, 0.16, o.ink || '#f0f0f0', { font: 'helv', track: 0.3 }]], draw: o.draw },
    cap: [{ s: 'cyl', r: 0.09, h: 0.03, fin: 'chrome' }, { s: 'cyl', r: 0.14, h: 0.2, color: '#0c0c0c', seg: 28 }],
  });
  const fourG = (P) => { const c = '#d8dce0'; for (const [x, y] of [[0.36, 0.14], [0.64, 0.14], [0.36, 0.56], [0.64, 0.56]]) { P.path([[x - 0.12, y], [x + 0.12, y], [x + 0.12, y + 0.3], [x - 0.12, y + 0.3]], c, false, 0.04); } };

  /* ---------- Polo flask ---------- */
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
  }
  const DOME = [[0, 0], [0.12, 0], [0.125, 0.12], [0.11, 0.17], [0.07, 0.205], [0, 0.215]];
  const poloFlask = (o) => S({
    body: 'pillow', w: 0.64, h: 0.56, d: 0.3, ex: 0.3, ey: 0.42, glass: o.glass, solid: o.solid, grad: o.grad, op: o.op || 0.92,
    art: { w: 0.26, h: 0.36, y: 0.28, z: 0.15, draw: (P) => { if (o.player) poloPlayer(P, o.player); if (o.script) P.text(o.script, 0.5, 0.9, 0.09, o.player || '#ffffff', { font: 'serif', italic: true }); if (o.draw) o.draw(P); } },
    cap: [{ s: 'cyl', r: 0.14, h: 0.05, fin: o.collar || 'silver' }, o.cap || { s: 'lathe', pts: DOME, fin: 'chrome' }],
  });

  /* ---------- Valentino Rockstud ---------- */
  const rockstud = (o) => () => {
    const k = kit();
    k.glassBody(gradient(box(0.5, 0.4, 0.66, 0.03), o.bottom, o.top, 0.6), glass({ grad: true, op: o.op || 0.88 }), null);
    const studs = [];
    const stud = (x, y, z, ry) => { const s = new (T().ConeGeometry)(0.034, 0.03, 4); s.rotateY(Math.PI / 4); s.rotateX(Math.PI / 2); s.rotateY(ry); s.translate(x, y, z); studs.push(s); };
    for (let j = 0; j < 9; j++) {
      const y = 0.05 + j * 0.072; if (j === 4) continue;
      for (let i = 0; i < 6; i++) { const x = -0.2 + i * 0.08 + (j % 2) * 0.04; if (x > 0.22) continue; stud(x, y, 0.2, 0); stud(x, y, -0.2, Math.PI); }
      for (let i = 0; i < 5; i++) { const z = -0.16 + i * 0.08 + (j % 2) * 0.04; if (z > 0.18) continue; stud(0.25, y, z, Math.PI / 2); stud(-0.25, y, z, -Math.PI / 2); }
    }
    k.part(merge(studs), glass({ tint: o.stud || '#2a2a2e', op: 0.9, flat: true }), 3);
    k.flat(0.5, 0.075, 0, 0.338, 0.202, paint(0.5, 0.075, (P) => { P.rect(0, 0, 1, 1, o.band || '#0c0c0e'); P.text('VALENTINO', 0.5, 0.55, 0.62, o.ink || '#ff2e86', { font: 'roman', weight: 500, track: 0.05 }); }));
    k.part(box(0.3, 0.3, 0.14, 0.02, 0.67), solid({ color: '#141416', rough: 0.2 }));
    k.part(cyl(0.05, 0.05, 0.06, 0.81, 20), fin('chrome'));
    k.top(0.68);
    return k.done();
  };

  /* ---------- Boss Bottled ---------- */
  const bossBottled = (o) => S({
    body: 'cyl', w: 0.42, h: 0.7, d: 0.32, seg: o.seg || 48, glass: o.glass, op: o.op, juice: o.juice, level: 0.88,
    art: { arc: 1.2, h: 0.56, y: 0.36, draw: (P) => ['B', 'O', 'S', 'S'].forEach((ch, i) => P.text(ch, 0.42, 0.14 + i * 0.22, 0.22, o.ink, { font: 'helv', weight: 800 })), t: o.sub ? [[o.sub, 0.5, 0.06, o.ink, { x: 0.8 }]] : [] },
    cap: [{ s: 'cyl', r: 0.13, h: 0.22, fin: o.capFin }],
  });

  /* ---------- Montblanc ---------- */
  const explorer = (o) => S({
    body: 'cyl', w: 0.52, h: 0.62, d: 0.52, juice: '#efe6c8', level: 0.86,
    art: { wrap: true, arc: Math.PI * 2, h: 0.44, y: 0.34, r: 0.264, sz: 1, draw: (P) => { P.rect(0, 0, 1, 1, o.band); for (let i = 0; i < 60; i++) P.line(i / 60, 0, i / 60 + 0.04, 1, 'rgba(255,255,255,0.08)', 0.004); P.circle(0.5, 0.62, 0.035, '#ffffff'); } },
    cap: [{ s: 'cyl', r: 0.08, h: 0.03, fin: 'chrome' }, { s: 'cyl', r: 0.19, h: 0.24, fin: 'chrome', seg: 32 }],
  });
  const legend = (o) => S({
    body: 'pillow', w: 0.62, h: 0.62, d: 0.28, ex: 0.25, ey: 0.42, solid: o.color, rough: 0.2,
    art: { w: 0.4, h: 0.16, y: 0.16, z: 0.14, t: o.t || [] },
    cap: [{ s: 'cyl', r: 0.16, h: 0.05, fin: 'chrome', dy: -0.08 }, { s: 'cyl', r: 0.14, h: 0.12, fin: 'chrome' }],
  });

  /* ---------- Azzaro Wanted ---------- */
  const wanted = (o) => () => {
    const k = kit();
    const lower = cyl(0.3, 0.3, 0.3, 0, 48);
    if (o.juice) k.glassBody(lower, glass({ op: 0.25 }), { color: o.juice, level: 0.9, inset: 0.9 });
    else k.solidBody(lower, solid({ color: '#0c0c0c', rough: 0.2 }));
    const topMat = solid({ color: o.top, metal: o.metal != null ? o.metal : 1, rough: 0.2, coat: 0, env: 2.4 });
    k.part(cyl(0.3, 0.3, 0.3, 0.3, 48), topMat);
    k.wrap(0.304, 0.1, 0.36, Math.PI * 2, paint(Math.PI * 2 * 0.304, 0.1, (P) => { for (let i = 0; i < 90; i++) { P.line(i / 90, 0, i / 90 + 0.01, 1, 'rgba(0,0,0,0.5)', 0.04); } }), {});
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; k.part(cyl(0.07, 0.07, 0.05, 0.6, 20, Math.sin(a) * 0.2, Math.cos(a) * 0.2), o.tip ? fin(o.tip) : topMat); }
    k.part(cyl(0.1, 0.1, 0.12, 0.6, 24), topMat);
    k.top(0.6);
    return k.done();
  };

  /* ---------- Hermès ---------- */
  const terre = (juice, sub) => S({
    w: 0.5, h: 0.62, d: 0.28, r: 0.02, juice, level: 0.86,
    art: { w: 0.3, h: 0.14, y: 0.42, t: [['TERRE', 0.25, 0.26, '#e06a1c', { font: 'serif' }], ["D'HERMÈS", 0.55, 0.26, '#e06a1c', { font: 'serif' }], [sub || '', 0.85, 0.15, '#e06a1c', { font: 'helv', track: 0.1 }]] },
    cap: [{ s: 'cyl', r: 0.07, h: 0.06, fin: 'chrome' }, { s: 'cyl', r: 0.13, h: 0.15, fin: 'chrome' }],
  });
  const fondateur = (label, ink, title) => S({
    w: 0.36, h: 0.66, d: 0.24, r: 0.06, juice: '#efe2b0', level: 0.88,
    art: { w: 0.2, h: 0.26, y: 0.36, bg: label, t: title.map((s, i) => [s, 0.25 + i * 0.16, 0.12, ink, { font: 'serif' }]) },
    cap: [{ s: 'cyl', r: 0.08, h: 0.03, color: '#1a1a1a' }, { s: 'lathe', pts: [[0, 0], [0.12, 0], [0.125, 0.08], [0.11, 0.13], [0.06, 0.16], [0, 0.165]], color: '#0b0b0b' }],
  });

  /* ---------- Guerlain ---------- */
  const guerlainSquare = (juice, label, title, ink = '#ffffff') => S({
    w: 0.64, h: 0.62, d: 0.32, r: 0.02, juice, level: 0.82, inset: 0.8,
    art: { w: 0.2, h: 0.2, y: 0.31, bg: label, t: [[title, 0.3, 0.13, ink, { font: 'helv', weight: 600 }], ['EAU DE TOILETTE', 0.46, 0.06, ink, { font: 'helv' }], ['GUERLAIN', 0.74, 0.11, ink, { font: 'helv', weight: 600 }], ['PARIS', 0.87, 0.05, ink, { font: 'helv' }]] },
    cap: [{ s: 'cyl', r: 0.15, h: 0.22, color: '#0c0c0c', seg: 32 }],
  });
  const guerlainArt = (juice, title) => S({
    body: 'cyl', seg: 8, w: 0.5, h: 0.62, d: 0.4, juice, level: 0.86,
    art: { wrap: false, w: 0.2, h: 0.3, y: 0.3, z: 0.19, bg: '#0c0c0c', t: [...title.map((s, i) => [s, 0.28 + i * 0.1, 0.07, '#e8c070', { font: 'helv' }]), ['GUERLAIN', 0.84, 0.08, '#e8c070', { font: 'helv', weight: 600 }]] },
    cap: [{ s: 'cyl', r: 0.12, h: 0.05, color: '#0c0c0c' }, { s: 'cyl', r: 0.14, h: 0.08, color: '#0c0c0c', seg: 32 }, { s: 'lathe', pts: [[0, 0], [0.12, 0], [0.2, 0.08], [0.2, 0.14], [0, 0.14]], seg: 8, color: '#0c0c0c' }],
  });

  /* ---------- Mugler ---------- */
  const amen = (o) => () => {
    const k = kit();
    const g = lathe([[0, 0], [0.24, 0], [0.26, 0.04], [0.26, 0.68], [0.245, 0.75], [0.17, 0.81], [0, 0.83]], 0, 1, 48); g.scale(1, 1, 0.6);
    k.solidBody(g, solid({ color: o.body, metal: o.metal, rough: o.rough || 0.2, coat: 0, env: 2.4 }));
    const s = new (T().Shape)();
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const r = i % 2 ? 0.07 : 0.18; const x = Math.sin(a) * r, y = Math.cos(a) * r; i ? s.lineTo(x, y) : s.moveTo(x, y); }
    const star = new (T().ExtrudeGeometry)(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.01, bevelSegments: 1 });
    star.translate(0, 0.36, 0.14);
    k.part(star, glass({ tint: o.star, op: 0.92, flat: true }), 3);
    k.top(0.8);
    return k.done();
  };

  /* ---------- registry ---------- */
  BottleCraft.add({
    // Afnan
    'afnan|9pm Rebel': nine({ frame: '#7a0f18', panel: '#5c5e60', num: '#b3141e', pmc: '#111111', sub: 'REBEL', cap: { color: '#3a3a3e', metal: 0.8 } }),
    'afnan|9pm Elixir': nine({ frame: '#1a1a1a', op: 0.92, panel: '#6e2e12', num: '#e2b25c', sub: 'ELIXIR', subFont: 'serif', draw: decoLines, cap: { color: '#151515' } }),
    'afnan|9pm Night Out': nine({ frame: '#4a4a4c', op: 0.92, panel: '#141414', num: '#f2f2f2', pmc: '#141414', sub: 'Night Out', subFont: 'serif', cap: { color: '#5a5a5c', rough: 0.7 } }),
    'afnan|9am Dive': nine({ frame: '#9fd2ee', op: 0.55, panel: '#2a4580', num: '#f4f6ff', pm: 'am', pmc: '#2a4580', sub: 'Dive', subItalic: true, subFont: 'serif', cap: { fin: 'chrome' } }),
    'afnan|Supremacy Silver': supremacy({ grad: ['#9aa0a7', '#e9ecef'], metal: 0.8, med: { fin: 'silver' }, ring: { fin: 'chrome' }, ink: '#5a5f66' }),
    "afnan|Supremacy Collector's Edition": supremacy({ color: '#efefef', metal: 0, speckle: true, med: { color: '#111111' }, ring: { color: '#111111' }, ink: '#222222', sub: "COLLECTOR'S EDITION" }),
    'afnan|Supremacy in Oud': supremacy({ grad: ['#5a4a1e', '#a8893a'], metal: 0.85, med: { fin: 'gold' }, ring: { fin: 'gold' }, ink: '#f0e2b0', sub: 'in Oud' }),
    'afnan|Supremacy Incense': supremacy({ grad: ['#c9ced3', '#123c4a'], metal: 0.55, med: { fin: 'silver' }, ring: { fin: 'chrome' }, sub: 'INCENSE' }),
    'afnan|Supremacy Noir': supremacy({ color: '#121212', metal: 0.2, med: { fin: 'silver' }, ring: { color: '#2a2a2e', metal: 0.8 }, ink: '#dddddd', title: 'NOIR · SUPREMACY' }),
    'afnan|Supremacy in Heaven': supremacy({ grad: ['#c7ccd1', '#9cc4dc'], metal: 0.5, med: { fin: 'silver' }, ring: { fin: 'chrome' }, ink: '#ffffff', sub: 'in Heaven' }),
    'afnan|Supremacy Gold': supremacy({ grad: ['#a07a28', '#e6c25e'], metal: 1, med: { fin: 'gold' }, ring: { fin: 'gold' }, ink: '#a01a1a' }),
    'afnan|Turathi Blue': turathi({ glass: '#1c2470', cap: 'silver' }),
    'afnan|Turathi Brown': turathi({ glass: '#8a3a12', op: 0.86, cap: 'gold' }),
    'afnan|Turathi Electric': turathi({ glass: '#9ad6ee', op: 0.82, cap: 'black', ink: '#1a1a2a', sub: 'electric' }),
    'afnan|Rare Carbon': rare({ grad: ['#d8d8d8', '#f8f8f8'], op: 0.55, ink: '#ffffff', sub: 'CARBON' }),
    'afnan|Rare Reef': rare({ glass: '#2a64b8', op: 0.9, ink: '#ffffff', sub: 'REEF' }),
    'afnan|Modest Une pour Homme': S({ w: 0.34, h: 0.78, d: 0.2, r: 0.02, glass: '#0e1530', op: 0.95, art: { w: 0.16, h: 0.2, y: 0.55, bg: '#ffffff', frame: '#111111', t: [['Modest', 0.3, 0.16, '#111111', { font: 'serif', italic: true }], ['POUR HOMME', 0.55, 0.07, '#111111', { font: 'helv' }], ['UNE', 0.75, 0.09, '#111111', { font: 'helv' }]] }, cap: [{ s: 'box', w: 0.22, d: 0.16, h: 0.18, color: '#0b0b0b' }] }),
    'afnan|Mystique Bouquet': S({ body: 'cyl', seg: 8, w: 0.46, h: 0.6, d: 0.32, grad: ['#123a6a', '#1fa84a'], op: 0.9, art: { wrap: false, w: 0.3, h: 0.3, y: 0.38, z: 0.15, t: [['Mystique', 0.3, 0.12, '#e8c870', { font: 'serif', italic: true }], ['BOUQUET', 0.5, 0.14, '#e8c870', { font: 'serif' }], ['AFNAN', 0.9, 0.09, '#e8c870', { font: 'serif' }]] }, cap: [{ s: 'box', w: 0.22, d: 0.16, h: 0.06, fin: 'gold' }, { s: 'box', w: 0.3, d: 0.22, h: 0.16, fin: 'gold' }] }),

    // Louis Vuitton
    "lv|L'Immensité": lv({ bottom: '#e2a048', top: '#f6e4b8' }),
    'lv|Imagination': lv({ bottom: '#2fa2a2', top: '#b8e6e0' }),
    'lv|Météore': lv({ bottom: '#5f8ed6', top: '#c8daf4' }),
    'lv|Sur la Route': lv({ bottom: '#9cb862', top: '#e0eac0' }),
    'lv|Orage': lv({ bottom: '#9ea486', top: '#dcdecc' }),
    'lv|Afternoon Swim': lv({ bottom: '#0a7ed6', top: '#74c4ec', op: 0.7 }),
    'lv|Pacific Chill': lv({ bottom: '#10a868', top: '#80cce8', op: 0.7 }),
    'lv|Symphony': lv({ bottom: '#a88cd2', top: '#e2d6f0', extrait: true }),
    'lv|California Dream': lv({ bottom: '#ee4a68', top: '#80b6ea', op: 0.7 }),
    'lv|Cosmic Cloud': lv({ bottom: '#ee9864', top: '#f4d6bc', extrait: true }),
    'lv|Les Sables Roses': lv({ bottom: '#2a0f10', top: '#140808', op: 0.96, ink: '#d8a35a', sub: 'rgba(216,163,90,0.7)', foil: true }),
    'lv|Ombre Nomade': lv({ bottom: '#2a1408', top: '#120804', op: 0.96, ink: '#d8a35a', sub: 'rgba(216,163,90,0.7)', foil: true }),
    'lv|Nouveau Monde': lv({ bottom: '#dc8418', top: '#f2c878' }),
    'lv|Stellar Times': lv({ bottom: '#ee9478', top: '#f6d2c0', extrait: true }),
    'lv|Attrape-Rêves': lv({ bottom: '#ee6e88', top: '#f4b8c6', op: 0.7 }),
    'lv|Spell on You': lv({ bottom: '#f07a94', top: '#f6bccb' }),
    'lv|Dancing Blossom': lv({ bottom: '#ee9494', top: '#f6d0cc', extrait: true }),
    'lv|Rhapsody': lv({ bottom: '#dc8c08', top: '#f0c860', extrait: true }),

    // Creed
    'creed|Millésime Impérial': cr({ gold: true, capFin: 'gold', ink: '#6a5016', labelBg: 'none', title: 'MILLÉSIME IMPÉRIAL', titleInk: '#6a5016' }),
    'creed|Original Vetiver': cr({ fade: '#0a2412', fadeMid: '#9cc890', title: 'ORIGINAL VETIVER', labelBg: 'none', titleInk: '#ffffff' }),
    'creed|Virgin Island Water': cr({ capFin: 'silver', panel: { bg: '#c9ced6', ink: '#2a6fa8' }, juice: '#f4f6f0' }),
    'creed|Original Santal': cr({ fade: '#b0201c', fadeMid: '#f4d0a0', capFin: 'silver', labelBg: 'none', titleInk: '#ffffff' }),
    'creed|Royal Water': cr({ capFin: 'silver', panel: { bg: '#a9aeb4', ink: '#ffffff' }, juice: '#f4f6f0' }),
    'creed|Erolfa': cr({ capFin: 'gold', panel: { bg: '#1d3a6a', ink: '#ffffff' }, juice: '#f0f2e0' }),
    'creed|Viking Cologne': cr({ capFin: 'silver', lower: '#f2741c', lowerOp: 0.95, panel: { bg: '#cfd3d8', ink: '#3a6aa8' } }),
    'creed|Queen of Silk': cr({ glassTint: '#5a2aa8', glassOp: 0.88, capFin: 'gold', ink: '#b89ae8', labelBg: 'none', titleInk: '#e8c060' }),
    'creed|Bois du Portugal': cr({ capFin: 'gold', panel: { bg: '#1e4a2e', ink: '#ffffff' }, juice: '#e8e4b8' }),
    'creed|Royal Oud': cr({ panel: { bg: '#3a3a3a', ink: '#dddddd' }, juice: '#f0ecd0' }),
    'creed|Tabarome': cr({ capFin: 'gold', glassTint: '#d6dc8a', glassOp: 0.5, panel: { bg: '#b8603a', ink: '#ffffff' } }),
    'creed|Carmina': cr({ glassTint: '#8a1258', glassOp: 0.9, capFin: 'gold', ink: '#c870a8', labelBg: 'none', titleInk: '#e8c060' }),
    'creed|Aventus Cologne': cr({ capFin: 'silver', lower: '#aab4c0', lowerOp: 0.9, panel: { bg: '#d8dce0', ink: '#555555' } }),
    'creed|Himalaya': cr({ gold: '#c8ccd1', metalRough: 0.34, capFin: 'silver', ink: '#7c8086', labelBg: 'none', title: 'HIMALAYA', titleInk: '#7c8086' }),

    // Dior
    'dior|Ambre Nuit': mcd('#e8a83c'), 'dior|Tobacolor': mcd('#e09040'), 'dior|Spice Blend': mcd('#f0b8a4'),
    'dior|Vanilla Diorama': mcd('#e8b860'), 'dior|Fève Délicieuse': mcd('#e88a3a'), "dior|Bois d'Argent": mcd('#e6c04a'),
    'dior|Oud Ispahan': mcd('#d8909a'), 'dior|Gris Dior': mcd('#cdb8cc'),
    'dior|Dior Homme': dhomme({ juice: '#e0901c' }),
    'dior|Dior Homme Sport': dhomme({ juice: '#f0c8a0', sub: 'SPORT' }),
    'dior|Dior Homme Parfum': dhomme({ juice: '#5a300c', frame: '#1a1a1a', sub: 'PARFUM', subInk: '#a88a5a' }),
    'dior|Sauvage Eau Forte': () => B.sauvage('#05070d', '#2f5590', 'Dior', 'EAU FORTE'),
    'dior|Fahrenheit': S({ body: 'lathe', w: 0.44, d: 0.24, h: 0.82, pts: [[0, 0], [0.2, 0], [0.22, 0.02], [0.2, 0.5], [0.15, 0.75], [0.12, 0.82], [0, 0.82]], solid: '#ffffff', rough: 0.15, grad: ['#ec7414', '#1e0303'], gc: 0.9, art: { w: 0.36, h: 0.3, y: 0.48, z: 0.1, wrap: false, t: [['Fahrenheit', 0.3, 0.16, '#ffffff', { font: 'serif' }], ['Dior', 0.9, 0.1, 'rgba(255,255,255,0.7)', { font: 'serif' }]] }, cap: [{ s: 'cyl', r: 0.11, h: 0.12, color: '#0a0a0a' }] }),
    'dior|Eau Sauvage': S({ w: 0.52, h: 0.5, d: 0.26, r: 0.02, glass: '#b8d48a', op: 0.45, juice: '#cfe0a0', art: [{ w: 0.52, h: 0.5, y: 0.25, draw: (P) => { for (let i = -6; i < 14; i++) P.line(i * 0.08, 0, i * 0.08 + 0.3, 1, 'rgba(255,255,255,0.35)', 0.012); } }, { w: 0.52, h: 0.12, y: 0.25, bg: '#c8ccd0', t: [['EAU SAUVAGE', 0.4, 0.3, '#333333', { font: 'serif' }], ['Christian Dior', 0.78, 0.22, '#333333', { font: 'serif' }]] }], cap: [{ s: 'cyl', r: 0.12, h: 0.24, fin: 'chrome', seg: 24 }] }),

    // Chanel
    'chanel|Allure Homme Sport': allure({ grad: ['#c4c8cc', '#f6f7f8'], ink: '#111111', sub: 'SPORT' }),
    'chanel|Allure Homme Sport Eau Extrême': allure({ grad: ['#5c6066', '#b8bcc0'], ink: '#ffffff', sub: 'SPORT', foot: 'EAU EXTRÊME' }),
    'chanel|Allure Homme Édition Blanche': allure({ grad: ['#d8c8a8', '#f4ecdc'], ink: '#2a2a2a', sub: 'ÉDITION BLANCHE', subInk: '#f8f8f8', cap: '#f2efe8' }),
    'chanel|Antaeus': S({ w: 0.32, h: 0.92, d: 0.22, r: 0.06, solid: '#0b0b0b', art: { w: 0.28, h: 0.6, y: 0.4, t: [['ANTAEUS', 0.18, 0.06, '#ffffff', { font: 'helv', weight: 700 }], ['POUR HOMME', 0.26, 0.035, '#ffffff', { font: 'helv' }], ['CHANEL', 0.62, 0.07, '#ffffff', { font: 'helv', weight: 700 }], ['PARIS', 0.7, 0.03, '#ffffff', { font: 'helv' }], ['EAU DE TOILETTE', 0.9, 0.03, '#ffffff', { font: 'helv' }]] } }),
    'chanel|Sycomore': exclusif('#e8d48a'), 'chanel|Coromandel': exclusif('#e0b860'), 'chanel|Le Lion': exclusif('#e0a840'), 'chanel|Boy Chanel': exclusif('#f0e8b8'),
    'chanel|Coco Mademoiselle': chanelClassic('#f2b4a4', [['COCO', 0.24, 0.14, '#111111', { font: 'helv' }], ['MADEMOISELLE', 0.42, 0.08, '#111111', { font: 'helv' }], ['CHANEL', 0.66, 0.13, '#111111', { font: 'helv', weight: 700 }], ['PARIS', 0.82, 0.06, '#111111', { font: 'helv' }]]),
    'chanel|N°5': chanelClassic('#e8a820', [['N°5', 0.2, 0.14, '#111111', { font: 'helv', weight: 700 }], ['CHANEL', 0.44, 0.15, '#111111', { font: 'helv', weight: 700 }], ['PARIS', 0.6, 0.06, '#111111', { font: 'helv' }], ['EAU DE PARFUM', 0.8, 0.06, '#111111', { font: 'helv' }]]),
    'chanel|Égoïste Platinum': S({ w: 0.56, h: 0.6, d: 0.28, r: 0.02, juice: '#efe8c4', level: 0.88, art: { t: [['PLATINUM', 0.2, 0.07, '#111111', { font: 'helv', weight: 600, track: 0.1 }], ['ÉGOÏSTE', 0.3, 0.06, '#111111', { font: 'helv', track: 0.1 }], ['CHANEL', 0.62, 0.1, '#111111', { font: 'helv', weight: 700, track: 0.1 }], ['PARIS', 0.72, 0.04, '#111111', { font: 'helv' }], ['EAU DE TOILETTE', 0.9, 0.035, '#111111', { font: 'helv' }]] }, cap: [{ s: 'cyl', r: 0.22, h: 0.22, seg: 8, fin: 'chrome' }] }),
    'chanel|Égoïste': S({ w: 0.56, h: 0.6, d: 0.28, r: 0.02, juice: '#f0e8c8', level: 0.88, art: { t: [['ÉGOÏSTE', 0.24, 0.08, '#111111', { font: 'helv', track: 0.1 }], ['CHANEL', 0.68, 0.1, '#111111', { font: 'helv', weight: 700, track: 0.1 }], ['PARIS', 0.78, 0.04, '#111111', { font: 'helv' }], ['EAU DE TOILETTE', 0.92, 0.035, '#111111', { font: 'helv' }]] }, cap: [{ s: 'cyl', r: 0.22, h: 0.22, seg: 8, color: '#151515' }] }),
    'chanel|Pour Monsieur': S({ w: 0.32, h: 0.66, d: 0.2, r: 0.02, juice: '#e2cc4a', level: 0.84, art: { w: 0.22, h: 0.4, y: 0.34, t: [['POUR', 0.12, 0.05, '#ffffff', { font: 'helv' }], ['MONSIEUR', 0.2, 0.05, '#ffffff', { font: 'helv' }], ['CHANEL', 0.6, 0.07, '#ffffff', { font: 'helv', weight: 700 }]] }, cap: [{ s: 'cyl', r: 0.08, h: 0.05, fin: 'chrome' }, { s: 'cyl', r: 0.12, h: 0.28, fin: 'gunmetal' }] }),

    // Giorgio Armani
    'armani|Acqua di Giò Eau de Toilette': S({ w: 0.54, h: 0.6, d: 0.3, r: 0.1, glass: '#e8eeea', op: 0.6, art: { w: 0.42, h: 0.5, y: 0.32, t: [['ACQUA DI', 0.2, 0.08, '#555555', { font: 'roman' }], ['GIÒ', 0.36, 0.18, '#555555', { font: 'roman' }], ['GIORGIO ARMANI', 0.5, 0.05, '#555555', { font: 'roman' }], ['POUR HOMME', 0.92, 0.04, '#555555', { font: 'roman', track: 0.1 }]] }, cap: [{ s: 'cyl', r: 0.14, h: 0.22, color: '#9aa0a4', metal: 0.6 }] }),
    'armani|Acqua di Giò Profondo': S({ w: 0.54, h: 0.6, d: 0.3, r: 0.1, grad: ['#22385a', '#3e5e86'], op: 0.92, art: { w: 0.42, h: 0.5, y: 0.32, t: [['ACQUA DI', 0.2, 0.08, '#e8eef4', { font: 'roman' }], ['GIÒ', 0.36, 0.18, '#e8eef4', { font: 'roman' }], ['GIORGIO ARMANI', 0.5, 0.05, '#e8eef4', { font: 'roman' }], ['PROFONDO', 0.92, 0.045, '#e8eef4', { font: 'roman', track: 0.1 }]] }, cap: [{ s: 'cyl', r: 0.14, h: 0.03, fin: 'chrome' }, { s: 'cyl', r: 0.14, h: 0.2, color: '#2a3e5a', rough: 0.4 }] }),
    'armani|Armani Code Profumo': S({ body: 'cyl', w: 0.3, h: 0.74, d: 0.26, solid: '#ffffff', grad: ['#c07a30', '#100604'], gc: 1, rough: 0.4, coat: 0.2, env: 0.8, art: { arc: 1.4, h: 0.2, y: 0.22, t: [['ARMANI', 0.3, 0.22, '#d8a860', { font: 'roman' }], ['code', 0.6, 0.24, '#d8a860', { font: 'serif' }], ['PROFUMO', 0.88, 0.12, '#d8a860', { font: 'roman' }]] }, cap: [{ s: 'cyl', r: 0.14, h: 0.24, fin: 'bronze' }] }),
    'armani|Armani Code Parfum': S({ body: 'cyl', w: 0.46, h: 0.62, d: 0.3, solid: '#0b0b0c', art: { arc: 1.4, h: 0.2, y: 0.24, t: [['ARMANI', 0.3, 0.22, '#c8c8c8', { font: 'roman' }], ['code', 0.6, 0.26, '#c8c8c8', { font: 'serif' }], ['PARFUM', 0.88, 0.1, '#c8c8c8', { font: 'roman' }]] }, cap: [{ s: 'cyl', r: 0.16, h: 0.26, color: '#0b0b0c' }] }),
    'armani|Armani Code': S({ body: 'cyl', w: 0.32, h: 0.82, d: 0.22, glass: '#0d1226', op: 0.96, art: { arc: 1.4, h: 0.12, y: 0.12, t: [['ARMANI', 0.35, 0.3, '#d8d8e0', { font: 'roman' }], ['code', 0.75, 0.32, '#d8d8e0', { font: 'serif' }]] }, cap: [{ s: 'cyl', r: 0.14, h: 0.14, color: '#0b0b0c' }] }),
    'armani|Stronger With You Intensely': S({ w: 0.54, h: 0.54, d: 0.26, r: 0.12, juice: '#d8501a', level: 0.9, art: { w: 0.4, h: 0.4, y: 0.32, t: [['STRONGER WITH', 0.18, 0.06, '#f2e2d0', { font: 'helv', track: 0.15 }], ['YOU', 0.42, 0.26, '#f2e2d0', { font: 'helv', weight: 300 }], ['INTENSELY', 0.66, 0.06, '#f2e2d0', { font: 'helv', track: 0.2 }]] }, cap: [{ s: 'cyl', r: 0.08, h: 0.04, fin: 'gunmetal' }, { s: 'sphere', r: 0.12, sx: 1.25, sy: 0.85, color: '#3a3a3e', metal: 0.8 }] }),
    'armani|Privé Oud Royal': S({ w: 0.52, h: 0.58, d: 0.36, r: 0.02, solid: '#0b0b0b', art: { w: 0.2, h: 0.2, y: 0.38, bg: '#f2ead0', frame: '#c8a050', t: [['OUD', 0.3, 0.12, '#222222', { font: 'serif', weight: 700 }], ['ROYAL', 0.46, 0.12, '#222222', { font: 'serif', weight: 700 }], ['ARMANI/PRIVÉ', 0.76, 0.07, '#222222', { font: 'serif' }]] }, cap: [{ s: 'sphere', r: 0.16, sx: 1.4, sy: 0.6, fin: 'gold' }] }),
    'armani|Privé Rouge Malachite': S({ w: 0.52, h: 0.58, d: 0.36, r: 0.02, solid: '#b0141a', art: [{ w: 0.52, h: 0.58, y: 0.29, draw: (P) => { for (let i = 0; i < 18; i++) P.path(Array.from({ length: 10 }, (_, j) => [j / 9, i / 18 + Math.sin(j * 1.3 + i) * 0.05]), 'rgba(80,0,0,0.35)', false, 0.01); } }, { w: 0.2, h: 0.2, y: 0.38, bg: '#f2ead0', frame: '#c8a050', t: [['ROUGE', 0.3, 0.11, '#222222', { font: 'serif', weight: 700 }], ['MALACHITE', 0.46, 0.1, '#222222', { font: 'serif', weight: 700 }], ['ARMANI/PRIVÉ', 0.76, 0.07, '#222222', { font: 'serif' }]] }], cap: [{ s: 'sphere', r: 0.16, sx: 1.4, sy: 0.6, color: '#b81a1e', rough: 0.2 }] }),

    // YSL
    'ysl|Kouros': () => { const k = kit(); k.solidBody(box(0.42, 0.26, 0.6, 0.03), solid({ color: '#f2f2f0', rough: 0.35 })); k.part(box(0.3, 0.2, 0.08, 0.02, 0.6), solid({ color: '#f2f2f0', rough: 0.35 })); k.part(box(0.4, 0.24, 0.2, 0.02, 0.68), fin('chrome')); k.flat(0.36, 0.5, 0, 0.32, 0.133, paint(0.36, 0.5, (P) => { P.text('KOUROS', 0.5, 0.22, 0.09, '#9a9a9a', { font: 'helv', weight: 300 }); P.text('YvesSaintLaurent', 0.5, 0.9, 0.06, '#7a7a7a', { font: 'roman', italic: true }); })); k.top(0.68); return k.done(); },
    "ysl|La Nuit de L'Homme": S({ w: 0.56, h: 0.6, d: 0.32, r: 0.1, solid: '#ffffff', rough: 0.12, grad: ['#2a2e26', '#d0d4c0'], gc: 0.6, art: [{ w: 0.01, h: 0.6, y: 0.3, bg: '#111111' }, { w: 0.54, h: 0.18, y: 0.38, t: [["LA NUIT DE L'HOMME", 0.35, 0.3, '#111111', { font: 'helv', weight: 300 }], ['YvesSaintLaurent', 0.78, 0.22, '#111111', { font: 'roman', italic: true }]] }], cap: [{ s: 'cyl', r: 0.24, h: 0.26, seg: 6, color: '#0b0b0b' }] }),
    'ysl|Y Le Parfum': S({ w: 0.54, h: 0.78, d: 0.3, r: 0.02, solid: '#0b0b0d', art: { w: 0.3, h: 0.06, x: 0.08, y: 0.62, bg: '#202024', t: [['YvesSaintLaurent', 0.5, 0.55, 0.62, '#d8d8d8', { font: 'roman', italic: true }]] }, cap: [{ s: 'cyl', r: 0.06, h: 0.03, fin: 'silver' }, { s: 'cyl', r: 0.14, h: 0.2, color: '#0d0d0e', rough: 0.45, seg: 32 }] }),
    'ysl|Y Eau de Toilette': S({ w: 0.54, h: 0.78, d: 0.3, r: 0.02, juice: '#a8c0e0', level: 0.93, inset: 0.94, art: { w: 0.3, h: 0.06, x: 0.08, y: 0.62, bg: '#f4f4f4', t: [['YvesSaintLaurent', 0.5, 0.55, 0.62, '#111111', { font: 'roman', italic: true }]] }, cap: [{ s: 'cyl', r: 0.06, h: 0.03, fin: 'silver' }, { s: 'cyl', r: 0.14, h: 0.2, color: '#0d0d0e', rough: 0.45, seg: 32 }] }),
    'ysl|MYSLF': S({ w: 0.3, h: 0.84, d: 0.26, r: 0.02, solid: '#0b0b0d', art: { w: 0.24, h: 0.5, y: 0.5, foil: true, t: [['Y', 0.22, 0.34, '#dfe3e8', { font: 'serif' }], ['S', 0.5, 0.34, '#dfe3e8', { font: 'serif' }], ['L', 0.78, 0.34, '#dfe3e8', { font: 'serif' }]] }, cap: [{ s: 'cyl', r: 0.12, h: 0.18, color: '#0b0b0d' }] }),
    'ysl|Libre': S({ w: 0.5, h: 0.56, d: 0.3, r: 0.06, juice: '#f2e2b0', level: 0.88, art: { w: 0.24, h: 0.24, x: 0.12, y: 0.2, foil: true, draw: (P) => { P.path([[0.1, 0.2], [0.9, 0.6], [0.1, 0.9]], '#d8b060', false, 0.05); P.path([[0.3, 0.1], [0.6, 0.9]], '#d8b060', false, 0.05); } }, cap: [{ s: 'cyl', r: 0.14, h: 0.07, fin: 'gold' }, { s: 'box', w: 0.26, d: 0.2, h: 0.2, color: '#0b0b0b' }] }),
    "ysl|L'Homme": S({ w: 0.56, h: 0.58, d: 0.32, r: 0.1, juice: '#f0e6b0', level: 0.88, art: [{ w: 0.01, h: 0.58, y: 0.29, bg: '#5a5a5c' }, { w: 0.5, h: 0.18, y: 0.32, t: [["L'HOMME", 0.35, 0.36, '#5a5a5c', { font: 'helv', weight: 300 }], ['YvesSaintLaurent', 0.78, 0.24, '#5a5a5c', { font: 'roman', italic: true }]] }], cap: [{ s: 'box', w: 0.54, d: 0.32, h: 0.22, color: '#4a4a4c', metal: 0.5 }] }),
    'ysl|M7 Oud Absolu': S({ w: 0.54, h: 0.52, d: 0.3, r: 0.01, juice: '#3a2410', art: { w: 0.5, h: 0.42, y: 0.29, bg: '#0b0b0b', t: [['M7', 0.25, 0.26, '#e0e0e0', { font: 'serif' }], ['OUD ABSOLU', 0.58, 0.07, '#e0e0e0', { font: 'helv', track: 0.15 }], ['YvesSaintLaurent', 0.78, 0.11, '#e0e0e0', { font: 'roman', italic: true }]] }, cap: [{ s: 'box', w: 0.54, d: 0.3, h: 0.28, color: '#38383a', metal: 0.4 }] }),
    'ysl|Tuxedo': S({ w: 0.38, h: 0.74, d: 0.26, r: 0.02, juice: '#d87a3a', level: 0.88, art: { w: 0.18, h: 0.18, y: 0.55, bg: '#f6f6f6', t: [['TUXEDO', 0.3, 0.12, '#111111', { font: 'helv' }], ['YvesSaintLaurent', 0.74, 0.08, '#111111', { font: 'roman', italic: true }]] }, cap: [{ s: 'cyl', r: 0.12, h: 0.24, color: '#0b0b0b', seg: 28 }] }),

    // Versace
    'versace|Eros Flame': eros({ body: '#9e1212', cap: '#c8a040', capMetal: 1, sub: 'EROS FLAME' }),
    'versace|Eros Parfum': eros({ body: '#0e5f78', capGlass: '#1a6fa0', sub: 'EROS PARFUM' }),
    'versace|Eros Energy': eros({ body: '#f2c21a', op: 0.9, cap: '#5a3418', capMetal: 0.6, relief: 'rgba(120,80,0,0.35)', ink: '#1a1a1a', sub: 'EROS ENERGY' }),
    'versace|Pour Homme Oud Noir': versacePH({ grad: ['#d8b040', '#0a0a0a'], cap: [{ s: 'cyl', r: 0.08, h: 0.05, fin: 'gold' }, { s: 'cyl', r: 0.13, h: 0.14, color: '#0b0b0b' }] }),
    'versace|Dylan Blue': versacePH({ grad: ['#0e1640', '#1e2e72'], cap: [{ s: 'cyl', r: 0.12, h: 0.16, fin: 'gold', seg: 24 }] }),

    // Prada
    'prada|Luna Rossa Black': lunaRossa({ solid: '#151515', grad: ['#3a3a3a', '#0c0c0c'], sub: 'BLACK', cap: '#0c0c0c' }),
    'prada|Luna Rossa Carbon': lunaRossa({ solid: '#b4b8bc', metal: 0.8, base: '#141416', capFin: 'chrome' }),
    'prada|Luna Rossa Ocean': lunaRossa({ grad: ['#0a1a3a', '#1e3e70'], cap: '#0c0c0c' }),
    'prada|Paradigme': S({ w: 0.5, h: 0.52, d: 0.22, r: 0.03, grad: ['#1a5a1a', '#3ac03a'], op: 0.88, art: { w: 0.36, h: 0.3, y: 0.32, draw: (P) => { P.text('PRADA', 0.5, 0.18, 0.18, '#0b0b0b', { font: 'roman', weight: 700, track: 0.1 }); P.text('MILANO', 0.5, 0.34, 0.07, '#0b0b0b', { font: 'roman' }); P.path([[0.3, 0.44], [0.7, 0.44], [0.5, 0.9]], '#0b0b0b', false, 0.02); } }, cap: [{ s: 'cyl', r: 0.06, h: 0.05, fin: 'chrome' }, { s: 'box', w: 0.3, d: 0.2, h: 0.18, color: '#0b0b0b' }] }),
    "prada|L'Homme Prada": S({ w: 0.5, h: 0.74, d: 0.28, r: 0.03, juice: '#e0dcd0', level: 0.88, art: [{ w: 0.14, h: 0.74, y: 0.37, bg: 'rgba(80,80,80,0.75)' }, { w: 0.3, h: 0.16, y: 0.6, t: [['PRADA', 0.35, 0.3, '#f2f2f2', { font: 'roman', weight: 700 }], ['MILANO', 0.65, 0.14, '#f2f2f2', { font: 'roman' }]] }], cap: [{ s: 'cyl', r: 0.07, h: 0.05, fin: 'chrome' }, { s: 'cyl', r: 0.14, h: 0.22, fin: 'chrome' }] }),

    // Rabanne
    'rabanne|Invictus': trophy({ glass: '#d6e2ea', op: 0.5 }),
    'rabanne|Invictus Victory': trophy({ solid: '#0c0c0c', letter: 'V', band: { color: '#1c1c1e', metal: 0.8 } }),
    'rabanne|Invictus Victory Elixir': trophy({ grad: ['#1a3aa8', '#0a0a0a'], op: 0.95, letter: 'V', foot: '#1a3aa8', band: { color: '#1c1c1e', metal: 0.8 } }),
    'rabanne|Invictus Platinum': trophy({ grad: ['#5a5e64', '#c8ccd0'], op: 0.9, draw: wings }),
    'rabanne|Pure XS': S({ body: 'cyl', seg: 8, w: 0.6, h: 0.62, d: 0.3, solid: '#ffffff', rough: 0.3, coat: 0.2, env: 0.8, grad: ['#a8c0e8', '#05070a'], gc: 1.6, cap: [{ s: 'cyl', seg: 8, r: 0.27, rb: 0.3, h: 0.08, color: '#08090c', rough: 0.08 }], art: { wrap: false, w: 0.3, h: 0.24, y: 0.4, z: 0.14, foil: true, t: [['PURE', 0.25, 0.18, '#e8c870', { font: 'helv', track: 0.3 }], ['XS', 0.65, 0.4, '#e8c870', { font: 'serif' }]] } }),
    'rabanne|Black XS': S({ w: 0.54, h: 0.72, d: 0.22, r: 0.1, solid: '#0b0b0b', art: { w: 0.46, h: 0.5, y: 0.42, draw: (P) => { P.text('Black XS', 0.5, 0.3, 0.14, '#f2f2f2', { font: 'serif', italic: true, weight: 700 }); for (let i = 0; i < 4; i++) P.circle(0.6, 0.6, 0.03 + i * 0.03, '#d8d8d8', 0.006); P.text('paco rabanne', 0.5, 0.95, 0.05, '#bbbbbb', { font: 'helv' }); } } }),
    'rabanne|1 Million Royal': goldBar({ badge: '#a8141a', sub: 'ROYAL' }),
    'rabanne|1 Million Parfum': millionParfum,
    'rabanne|Phantom': phantom,

    // Jean Paul Gaultier
    'jpg|Le Male Elixir': () => B.torso('#c88a30', '#3a2208', '#6a4010', 0.95, 'gold'),
    'jpg|Le Male Le Parfum': () => B.torso('#1a1e30', '#05060a', '#0a0c16', 0.95, 'gunmetal'),
    'jpg|Le Beau': () => B.torso('#1f8078', null, '#0e4a46', 0.9, 'gold'),
    'jpg|Scandal pour Homme': () => {
      const k = kit();
      k.glassBody(gradient(box(0.56, 0.3, 0.56, 0.1), '#2a3a5a', '#8a9ab0', 0.8), glass({ grad: true, op: 0.9 }), null);
      k.flat(0.32, 0.08, 0, 0.42, 0.153, paint(0.32, 0.08, (P) => { P.rect(0, 0, 1, 1, '#c8a040', 0.1); P.text('SCANDAL', 0.5, 0.55, 0.6, '#3a2a0a', { font: 'roman', weight: 700 }); }), { foil: true });
      k.part(cyl(0.12, 0.1, 0.08, 0.56, 32), fin('gold'));
      for (let i = 0; i < 4; i++) { const a = new (T().TorusGeometry)(0.1, 0.018, 8, 20, Math.PI); a.rotateY((i * Math.PI) / 4); a.translate(0, 0.64, 0); k.part(a, fin('gold')); }
      k.part(sphere(0.07, 0.68), solid({ color: '#a01020', rough: 0.6 }));
      k.top(0.56); return k.done();
    },

    // Givenchy
    'givenchy|Gentleman Réserve Privée': gentleman({ grad: ['#a8521a', '#0a0a0a'], y: 0.4 }),
    'givenchy|Gentleman Eau de Parfum': gentleman({ solid: '#0c0c0c' }),
    'givenchy|Gentleman Society': gentleman({ solid: '#0c0c0c', draw: null, y: 0.3 }),
    'givenchy|Gentleman Boisée': gentleman({ grad: ['#c8c8c8', '#2a1e18'], band: '#1e1612', ink: '#c8a060' }),
    'givenchy|Insensé': S({ body: 'pillow', w: 0.5, h: 0.6, d: 0.26, glass: '#c8e050', op: 0.8, art: { w: 0.3, h: 0.3, y: 0.34, z: 0.13, t: [['INSENSÉ', 0.3, 0.14, '#222222', { font: 'helv', weight: 700 }], ['GIVENCHY', 0.5, 0.11, '#222222', { font: 'roman', track: 0.15 }], ['EAU DE TOILETTE', 0.92, 0.06, '#222222', { font: 'roman' }]] }, cap: [{ s: 'cyl', r: 0.1, h: 0.04, fin: 'gold' }, { s: 'lathe', pts: [[0, 0], [0.13, 0], [0.14, 0.12], [0.12, 0.2], [0, 0.21]], color: '#f2efe2', rough: 0.4 }] }),

    // Dolce & Gabbana
    'dg|Light Blue Eau Intense pour Homme': S({ body: 'pillow', w: 0.6, h: 0.56, d: 0.3, ex: 0.28, ey: 0.4, glass: '#7ac4ea', op: 0.88, art: { w: 0.4, h: 0.4, y: 0.3, z: 0.15, t: [['DOLCE & GABBANA', 0.2, 0.07, '#5a6a78', { font: 'roman' }], ['light blue', 0.34, 0.1, '#5a6a78', { font: 'serif', italic: true }], ['eau intense', 0.8, 0.07, '#5a6a78', { font: 'serif', italic: true }], ['POUR HOMME', 0.9, 0.04, '#5a6a78', { font: 'roman' }]] }, cap: [{ s: 'cyl', r: 0.15, h: 0.05, fin: 'chrome' }, { s: 'cyl', r: 0.15, h: 0.16, color: '#7ab8e0', rough: 0.2 }] }),
    'dg|Light Blue pour Homme': S({ body: 'pillow', w: 0.6, h: 0.56, d: 0.3, ex: 0.28, ey: 0.4, juice: '#f2eecc', level: 0.9, art: { w: 0.4, h: 0.4, y: 0.3, z: 0.15, t: [['DOLCE & GABBANA', 0.2, 0.07, '#2a3a4a', { font: 'roman' }], ['light blue', 0.34, 0.1, '#2a3a4a', { font: 'serif', italic: true }], ['POUR HOMME', 0.8, 0.04, '#2a3a4a', { font: 'roman' }]] }, cap: [{ s: 'cyl', r: 0.15, h: 0.05, fin: 'chrome' }, { s: 'cyl', r: 0.15, h: 0.16, color: '#5a8ac0', rough: 0.3 }] }),
    'dg|The One for Men Eau de Parfum': S({ w: 0.62, h: 0.62, d: 0.22, r: 0.01, juice: '#5a2a0a', level: 0.9, art: { w: 0.58, h: 0.1, y: 0.07, t: [['DOLCE & GABBANA', 0.4, 0.4, '#ffffff', { font: 'helv' }], ['the one', 0.85, 0.3, '#ffffff', { font: 'helv', x: 0.8 }]] }, cap: [{ s: 'cyl', r: 0.08, h: 0.05, fin: 'chrome' }, { s: 'box', w: 0.58, d: 0.2, h: 0.13, color: '#0b0b0b' }] }),
    'dg|The One for Men': S({ w: 0.62, h: 0.62, d: 0.22, r: 0.01, juice: '#c07a3a', level: 0.9, art: { w: 0.58, h: 0.1, y: 0.07, t: [['DOLCE & GABBANA', 0.4, 0.4, '#111111', { font: 'helv' }], ['the one', 0.85, 0.3, '#111111', { font: 'helv', x: 0.8 }]] }, cap: [{ s: 'cyl', r: 0.08, h: 0.05, fin: 'chrome' }, { s: 'box', w: 0.58, d: 0.2, h: 0.13, color: '#0b0b0b' }] }),
    'dg|K by Dolce & Gabbana': S({ w: 0.5, h: 0.52, d: 0.26, r: 0.02, glass: '#9ab0c8', op: 0.55, art: { w: 0.36, h: 0.38, y: 0.3, draw: (P) => { P.path([[0.38, 0.1], [0.5, 0.02], [0.62, 0.1], [0.58, 0.16], [0.42, 0.16]], '#111111'); P.text('K', 0.5, 0.5, 0.5, '#0b0b0b', { font: 'helv', weight: 800 }); P.text('DOLCE & GABBANA', 0.5, 0.9, 0.07, '#111111', { font: 'helv' }); } }, cap: [{ s: 'cyl', r: 0.14, h: 0.08, fin: 'gold' }, { s: 'ring', r: 0.1, tube: 0.02, fin: 'gold', stay: true }, { s: 'sphere', r: 0.04, dy: 0.12, color: '#1a3aa8', rough: 0.1 }] }),

    // Hugo Boss
    'boss|Boss Bottled': bossBottled({ juice: '#e2c860', ink: 'rgba(200,170,60,0.55)', capFin: 'silver' }),
    'boss|Boss Bottled Elixir': bossBottled({ glass: '#1a1410', op: 0.95, ink: '#d8b060', capFin: 'gold' }),
    'boss|Boss The Scent': bossBottled({ seg: 8, juice: '#e08a10', ink: 'rgba(180,90,0,0.6)', capFin: 'silver' }),

    // Burberry
    'burberry|Mr. Burberry': S({ w: 0.5, h: 0.64, d: 0.28, r: 0.02, glass: '#b8c8c4', op: 0.4, art: { w: 0.36, h: 0.16, y: 0.46, t: [['Mr.', 0.35, 0.5, '#222222', { font: 'serif', italic: true }], ['BURBERRY', 0.82, 0.2, '#222222', { font: 'roman' }]] }, cap: [{ s: 'cyl', r: 0.13, h: 0.2, color: '#0b0b0b' }, { s: 'box', w: 0.46, d: 0.06, h: 0.07, dy: -0.12, color: '#0b0b0b', stay: true }] }),
    'burberry|Hero': S({ w: 0.58, h: 0.6, d: 0.3, r: 0.02, juice: '#e8d8a0', level: 0.86, art: { w: 0.4, h: 0.14, y: 0.42, t: [['BURBERRY', 0.35, 0.36, '#111111', { font: 'helv', weight: 700 }], ['HERO', 0.8, 0.26, '#111111', { font: 'helv', weight: 700 }]] }, cap: [{ s: 'cyl', r: 0.13, h: 0.22, color: '#0b0b0b', seg: 28 }] }),
    'burberry|Brit for Him': S({ w: 0.5, h: 0.74, d: 0.22, r: 0.02, glass: '#7a8088', op: 0.6, art: { w: 0.5, h: 0.74, y: 0.37, draw: (P) => { for (let i = 0; i < 5; i++) { P.rect(i * 0.24, 0, 0.1, 1, 'rgba(255,255,255,0.18)'); P.rect(0, i * 0.24, 1, 0.08, 'rgba(255,255,255,0.18)'); } P.line(0, 0, 1, 1, 'rgba(0,0,0,0.25)', 0.03); P.line(1, 0, 0, 1, 'rgba(0,0,0,0.25)', 0.03); } }, cap: [{ s: 'box', w: 0.14, d: 0.08, h: 0.16, fin: 'chrome' }] }),

    // Montblanc
    'montblanc|Explorer': explorer({ band: '#2e2824' }),
    'montblanc|Explorer Platinum': explorer({ band: '#c8cacc' }),
    'montblanc|Explorer Ultra Blue': explorer({ band: '#2a4ab8' }),
    'montblanc|Legend': legend({ color: '#0c0c0c' }),
    'montblanc|Legend Spirit': legend({ color: '#f2f2f2', t: [['LEGEND', 0.4, 0.4, '#222222', { font: 'helv', track: 0.2 }], ['SPIRIT', 0.8, 0.24, '#222222', { font: 'helv', track: 0.2 }]] }),

    // Azzaro
    'azzaro|The Most Wanted': wanted({ top: '#141414', metal: 0.4 }),
    'azzaro|Wanted by Night': wanted({ top: '#2a2a2c', metal: 0.8, juice: '#c87a1a' }),
    'azzaro|Wanted': wanted({ top: '#dfe3e8', juice: '#e8c25a', tip: 'gold' }),
    'azzaro|Chrome': S({ w: 0.56, h: 0.56, d: 0.24, r: 0.02, juice: '#9ccbec', level: 0.94, inset: 0.95, art: { w: 0.52, h: 0.52, y: 0.28, t: [['C H R O M E', 0.12, 0.08, 'rgba(255,255,255,0.8)', { font: 'roman' }], ['A Z Z A R O', 0.9, 0.08, 'rgba(255,255,255,0.8)', { font: 'roman' }]] }, cap: [{ s: 'cyl', r: 0.07, h: 0.06, fin: 'chrome' }, { s: 'box', w: 0.2, d: 0.12, h: 0.14, fin: 'chrome' }] }),

    // Calvin Klein
    'ck|Eternity Aqua for Men': S({ w: 0.56, h: 0.6, d: 0.3, r: 0.1, glass: '#3a6ab0', op: 0.88, art: { w: 0.44, h: 0.5, y: 0.32, t: [['ETERNITY', 0.15, 0.13, '#ffffff', { font: 'helv', weight: 300 }], ['for men', 0.27, 0.06, '#ffffff', { font: 'helv' }], ['AQUA', 0.52, 0.1, '#ffffff', { font: 'helv' }], ['Calvin Klein', 0.9, 0.08, '#ffffff', { font: 'helv' }]] }, cap: [{ s: 'cyl', r: 0.16, h: 0.07, fin: 'chrome' }, { s: 'cyl', r: 0.12, h: 0.18, fin: 'chrome' }] }),
    'ck|Eternity for Men': S({ w: 0.56, h: 0.6, d: 0.3, r: 0.1, juice: '#dcdc9c', level: 0.92, inset: 0.94, art: { w: 0.44, h: 0.5, y: 0.32, t: [['ETERNITY', 0.15, 0.13, '#333333', { font: 'helv', weight: 300 }], ['for men', 0.27, 0.06, '#333333', { font: 'helv' }], ['Calvin Klein', 0.9, 0.08, '#333333', { font: 'helv' }]] }, cap: [{ s: 'cyl', r: 0.16, h: 0.07, fin: 'chrome' }, { s: 'cyl', r: 0.12, h: 0.18, fin: 'chrome' }] }),
    'ck|CK One': S({ body: 'pillow', w: 0.5, h: 0.62, d: 0.18, ex: 0.2, ey: 0.35, glass: '#eef0ee', op: 0.75, art: { w: 0.3, h: 0.3, y: 0.38, z: 0.09, t: [['ck', 0.4, 0.5, '#777777', { font: 'helv', weight: 300 }], ['one', 0.8, 0.1, '#777777', { font: 'helv' }]] }, cap: [{ s: 'cyl', r: 0.09, h: 0.12, fin: 'silver', seg: 24 }] }),
    'ck|Obsession for Men': S({ body: 'sphere', w: 0.52, h: 0.66, d: 0.2, juice: '#d89a3a', level: 0.94, inset: 0.94, art: { w: 0.3, h: 0.2, y: 0.4, z: 0.1, t: [['OBSESSION', 0.3, 0.2, '#222222', { font: 'roman' }], ['for men', 0.5, 0.1, '#222222', { font: 'roman' }], ['Calvin Klein', 0.85, 0.12, '#222222', { font: 'helv' }]] }, cap: [{ s: 'lathe', pts: [[0, 0], [0.08, 0], [0.11, 0.12], [0.09, 0.2], [0, 0.21]], color: '#6a3a18', rough: 0.3 }] }),
    'ck|Escape for Men': S({ body: 'cyl', w: 0.3, h: 0.62, d: 0.22, glass: '#f2eec0', op: 0.55, art: { arc: 1.4, h: 0.4, y: 0.32, t: [['ESCAPE', 0.15, 0.08, '#333333', { font: 'serif' }], ['for men', 0.24, 0.04, '#333333', { font: 'serif' }], ['Calvin Klein', 0.92, 0.05, '#333333', { font: 'helv' }]] }, cap: [{ s: 'cyl', r: 0.15, h: 0.3, fin: 'silver' }] }),

    // Davidoff
    'davidoff|Cool Water': S({ w: 0.34, h: 0.86, d: 0.2, r: 0.02, glass: '#0f6aa8', op: 0.9, art: { w: 0.34, h: 0.86, y: 0.43, draw: (P) => { for (let i = 0; i < 60; i++) P.circle(Math.abs(Math.sin(i * 7.1)), Math.abs(Math.sin(i * 3.3)), 0.004 + (i % 3) * 0.002, 'rgba(255,255,255,0.35)'); P.text('DAVIDOFF', 0.5, 0.12, 0.025, '#ffffff', { font: 'roman' }); P.text('Cool Water', 0.5, 0.17, 0.04, '#ffffff', { font: 'serif', italic: true }); } }, cap: [{ s: 'box', w: 0.34, d: 0.2, h: 0.1, color: '#0a2a4a' }] }),

    // Viktor & Rolf
    'vr|Spicebomb Extreme': () => {
      const k = kit();
      const prof = [[0, 0], [0.22, 0], [0.3, 0.05], [0.33, 0.16], [0.335, 0.52], [0.3, 0.62], [0.2, 0.69], [0, 0.7]];
      k.glassBody(lathe(prof), glass({ tint: '#141416', op: 0.92 }), null);
      const grooves = [];
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const b = new (T().BoxGeometry)(0.022, 0.5, 0.03); b.translate(0, 0.32, 0.333); b.rotateY(a); grooves.push(b); }
      k.part(merge(grooves), solid({ color: '#050505', rough: 0.4, coat: 0 }));
      k.part(cyl(0.34, 0.34, 0.13, 0.285, 48), solid({ color: '#b8743a', metal: 0.9, rough: 0.25, coat: 0 }));
      k.wrap(0.343, 0.11, 0.35, 1.5, paint(1.5 * 0.343, 0.11, (P) => { P.text('SPICEBOMB', 0.5, 0.3, 0.3, '#1a0e04', { font: 'helv', weight: 500 }); P.text('VIKTOR&ROLF', 0.5, 0.62, 0.22, '#1a0e04', { font: 'helv', weight: 500 }); P.text('EXTREME', 0.5, 0.86, 0.14, '#1a0e04', { font: 'helv' }); }));
      k.part(cyl(0.15, 0.15, 0.17, 0.7, 40), solid({ color: '#121214', rough: 0.25 }));
      k.top(0.72); return k.done();
    },

    // Ralph Lauren
    'polo|Polo': poloFlask({ glass: '#0f5a2a', player: '#d4a73a', collar: 'gold', cap: { s: 'lathe', pts: DOME, fin: 'gold' } }),
    'polo|Polo 67': poloFlask({ glass: '#0e1a3a', op: 0.96, draw: (P) => { P.text('Polo', 0.45, 0.45, 0.24, '#ffffff', { font: 'serif', italic: true, weight: 700 }); P.text('EST. 67', 0.7, 0.65, 0.1, '#ffffff', { font: 'helv', weight: 700 }); }, cap: { s: 'cyl', r: 0.13, h: 0.18, color: '#0e1a3a' } }),
    'polo|Polo Red': poloFlask({ glass: '#e01818', player: '#0b0b0b', cap: { s: 'cyl', r: 0.13, h: 0.18, color: '#0b0b0b' } }),
    'polo|Polo Double Black': poloFlask({ solid: '#1a1a1a', player: '#050505', cap: { s: 'cyl', r: 0.13, h: 0.18, color: '#0b0b0b' } }),
    'polo|Polo Black': poloFlask({ solid: '#101010', player: '#c8ccd0', collar: 'chrome', cap: { s: 'lathe', pts: DOME, fin: 'chrome' } }),
    'polo|Polo Blue Parfum': poloFlask({ glass: '#0e2050', op: 0.96, player: '#a8b0b8', cap: { s: 'cyl', r: 0.13, h: 0.18, color: '#0e2050' } }),
    'polo|Polo Ultra Blue': poloFlask({ grad: ['#3a62d0', '#a8c0ee'], op: 0.95, player: '#1a2a7a' }),
    'polo|Polo Supreme Oud': poloFlask({ solid: '#0b0b0b', player: '#d4a73a', script: 'Supreme Oud', collar: 'gold', cap: { s: 'lathe', pts: DOME, fin: 'gold' } }),
    'polo|Polo Sport': S({ w: 0.38, h: 0.7, d: 0.26, r: 0.04, glass: '#1a3ab8', op: 0.92, art: { w: 0.32, h: 0.6, y: 0.38, draw: (P) => { P.rect(0.08, 0.1, 0.36, 0.12, '#ffffff'); P.rect(0.08, 0.1, 0.14, 0.06, '#1a3a8a'); for (let i = 0; i < 3; i++) P.rect(0.22, 0.1 + i * 0.04, 0.22, 0.02, '#c8102e'); P.text('POLO SPORT', 0.7, 0.5, 0.06, '#ffffff', { font: 'helv', weight: 800 }); } }, cap: [{ s: 'cyl', r: 0.12, h: 0.2, fin: 'chrome' }] }),
    "polo|Ralph's Club Parfum": S({ w: 0.6, h: 0.6, d: 0.28, r: 0.06, solid: '#141416', art: { w: 0.4, h: 0.4, y: 0.32, draw: (P) => { P.text("RALPH'S CLUB", 0.5, 0.15, 0.06, '#9a9a9a', { font: 'helv', track: 0.2 }); P.path([[0.5, 0.3], [0.6, 0.5], [0.5, 0.7], [0.4, 0.5]], '#c8c8c8', false, 0.01); P.text('R', 0.5, 0.5, 0.14, '#c8c8c8', { font: 'serif' }); } }, cap: [{ s: 'cyl', r: 0.13, h: 0.05, fin: 'chrome' }, { s: 'lathe', pts: DOME, color: '#1a1a1c', metal: 0.6 }] }),

    // Valentino
    'valentino|Uomo Born in Roma': rockstud({ bottom: '#8f8189', top: '#111114' }),
    'valentino|Uomo Born in Roma Intense': rockstud({ bottom: '#9a1a28', top: '#111114', ink: '#ff2e5a' }),
    'valentino|Uomo Intense': rockstud({ bottom: '#d0d0d0', top: '#5a5a5c', stud: '#7a7a7c', band: '#1a1a1a', ink: '#c8c8c8' }),
    'valentino|Uomo Born in Roma Yellow Dream': rockstud({ bottom: '#f2e8a0', top: '#f6f0c8', stud: '#e8e0b0', ink: '#e8c84a' }),
    'valentino|Donna Born in Roma': rockstud({ bottom: '#f0a8b8', top: '#f6c8d4', stud: '#f2b8c8', band: '#3a0a14', ink: '#ff4a7a' }),

    // Gucci
    'gucci|Gucci pour Homme (2003)': S({ w: 0.56, h: 0.5, d: 0.26, r: 0.01, juice: '#e0a830', level: 0.9, art: { w: 0.4, h: 0.16, y: 0.3, t: [['G U C C I', 0.35, 0.36, '#f8f0d8', { font: 'roman' }], ['Pour Homme', 0.8, 0.2, '#f8f0d8', { font: 'helv' }]] }, cap: [{ s: 'box', w: 0.56, d: 0.26, h: 0.2, color: '#0b0b0b' }] }),
    'gucci|Guilty Elixir pour Homme': S({ w: 0.56, h: 0.46, d: 0.24, r: 0.06, glass: '#8aa018', op: 0.9, art: { w: 0.4, h: 0.36, y: 0.24, draw: (P) => { P.circle(0.42, 0.32, 0.14, 'rgba(255,255,255,0.35)', 0.03); P.circle(0.58, 0.32, 0.14, 'rgba(255,255,255,0.35)', 0.03); P.text('GUCCI GUILTY', 0.5, 0.68, 0.08, '#f2f2f2', { font: 'helv', track: 0.2 }); P.text('ELIXIR DE PARFUM POUR HOMME', 0.5, 0.82, 0.05, '#f2f2f2', { font: 'helv', track: 0.15 }); } }, cap: [{ s: 'cyl', r: 0.06, h: 0.04, fin: 'chrome' }, { s: 'cyl', r: 0.1, h: 0.18, fin: 'chrome' }] }),
    'gucci|Rush for Men': S({ w: 0.5, h: 0.7, d: 0.2, r: 0.12, solid: '#f0f0f2', metal: 0.25, art: { w: 0.4, h: 0.1, y: 0.62, draw: (P) => { P.rect(0, 0.45, 1, 0.08, 'rgba(0,0,0,0.12)'); P.circle(0.5, 0.75, 0.08, '#c8c8c8'); } } }),

    // Bvlgari
    'bvlgari|Man in Black': S({ w: 0.5, h: 0.66, d: 0.3, r: 0.02, solid: '#0c0c0c', art: { w: 0.4, h: 0.5, y: 0.36, t: [['BVLGARI', 0.06, 0.08, '#d8d8d8', { font: 'roman', track: 0.3 }], ['BVLGARI', 0.46, 0.04, '#c8c8c8', { font: 'roman', track: 0.2 }], ['MAN', 0.56, 0.1, '#e0b48a', { font: 'roman', track: 0.2 }], ['IN BLACK', 0.72, 0.05, '#d8d8d8', { font: 'roman', track: 0.3 }]] }, cap: [{ s: 'box', w: 0.5, d: 0.3, h: 0.04, fin: 'bronze', dy: -0.12, stay: true }, { s: 'box', w: 0.46, d: 0.28, h: 0.06, color: '#0c0c0c' }] }),
    'bvlgari|Aqva pour Homme': () => {
      const k = kit();
      const g = sphere(1, 0.36, 0.38, 0.36, 0.2); gradient(g, '#0a4a40', '#2a9a8a', 0.8);
      k.glassBody(g, glass({ grad: true, op: 0.9 }), null);
      const t = new (T().SphereGeometry)(1, 40, 20, 0, Math.PI * 2, 0, 0.75); t.scale(0.385, 0.365, 0.205); t.translate(0, 0.36, 0); k.part(t, fin('chrome'));
      k.flat(0.4, 0.2, 0, 0.4, 0.205, paint(0.4, 0.2, (P) => { P.text('BVLGARI', 0.5, 0.25, 0.18, '#e0f0ec', { font: 'roman', track: 0.3 }); P.text('AQVA', 0.5, 0.62, 0.16, '#e0f0ec', { font: 'roman', track: 0.2 }); P.text('POUR HOMME', 0.5, 0.82, 0.07, '#e0f0ec', { font: 'roman' }); }));
      k.top(0.7); return k.done();
    },
    'bvlgari|Le Gemme Tygar': S({ w: 0.34, h: 0.66, d: 0.26, r: 0.02, solid: '#0c0c0c', art: { w: 0.18, h: 0.08, y: 0.08, bg: '#e8d8a8', t: [['LE GEMME', 0.38, 0.32, '#222222', { font: 'roman' }], ['TYGAR', 0.75, 0.26, '#222222', { font: 'roman' }]] }, cap: [{ s: 'cyl', r: 0.17, rb: 0.1, h: 0.1, seg: 6, fin: 'gold' }, { s: 'cyl', r: 0.12, rb: 0.17, h: 0.06, seg: 6, fin: 'gold' }, { s: 'box', w: 0.22, d: 0.2, h: 0.14, color: '#0c0c0c' }] }),
    'bvlgari|Man Wood Essence': S({ w: 0.54, h: 0.6, d: 0.3, r: 0.02, glass: '#5a6a22', op: 0.92, art: { w: 0.4, h: 0.4, y: 0.32, t: [['BVLGARI', 0.3, 0.06, '#e8e0c8', { font: 'roman', track: 0.3 }], ['MAN', 0.46, 0.14, '#e8e0c8', { font: 'roman', track: 0.2 }], ['WOOD ESSENCE', 0.74, 0.05, '#e8e0c8', { font: 'roman', track: 0.2 }]] }, cap: [{ s: 'box', w: 0.54, d: 0.3, h: 0.14, color: '#b8a888', metal: 0.8 }] }),

    // Hermès
    "hermes|Terre d'Hermès": terre('#e8a850'),
    "hermes|Terre d'Hermès Eau Givrée": terre('#f2eec8', 'EAU GIVRÉE'),
    'hermes|H24': S({ w: 0.56, h: 0.62, d: 0.22, r: 0.06, juice: '#dfe8b4', level: 0.92, inset: 0.94, art: { w: 0.2, h: 0.1, x: 0.08, y: 0.42, t: [['H24', 0.5, 0.6, 'rgba(90,100,80,0.7)', { font: 'serif' }]] }, cap: [{ s: 'cyl', r: 0.1, h: 0.24, fin: 'chrome' }] }),
    'hermes|Un Jardin sur le Nil': S({ w: 0.34, h: 0.76, d: 0.2, r: 0.08, juice: '#8ccca4', level: 0.92, inset: 0.94, art: { w: 0.24, h: 0.5, y: 0.4, t: [['UN JARDIN', 0.3, 0.05, '#1e6a4a', { font: 'serif' }], ['SUR LE NIL', 0.38, 0.05, '#1e6a4a', { font: 'serif' }], ['HERMÈS', 0.92, 0.045, '#1e6a4a', { font: 'serif', track: 0.1 }]] }, cap: [{ s: 'cyl', r: 0.06, h: 0.04, fin: 'chrome' }, { s: 'sphere', r: 0.11, glass: '#ffffff', op: 0.45 }] }),
    "hermes|Voyage d'Hermès": () => { const k = kit(); const g = pillow(0.6, 0.66, 0.16, 0.25, 0.5); g.rotateZ(0.45); g.translate(0.08, 0, 0); k.solidBody(g, fin('chrome')); k.part(cyl(0.05, 0.05, 0.12, 0.62, 20, -0.2), fin('chrome')); k.top(0.7); return k.done(); },
    'hermes|Bel Ami Vétiver': fondateur('#7a2a20', '#f2e2c8', ['BEL AMI', 'VÉTIVER']),
    'hermes|Équipage': fondateur('#e8dcc8', '#5a4a3a', ['EQUIPAGE']),
    'hermes|Rocabar': fondateur('#c0281e', '#f8e8d8', ['ROCABAR']),

    // Guerlain
    'guerlain|Vétiver': guerlainSquare('#c8d070', '#1e5a4a', 'VETIVER'),
    'guerlain|Héritage': guerlainSquare('#f0a050', '#d84a1a', 'HÉRITAGE'),
    "guerlain|L'Homme Idéal": guerlainSquare('#e8a020', '#a8a8a8', "L'HOMME IDÉAL"),
    'guerlain|Spiritueuse Double Vanille': guerlainArt('#7a3a10', ['SPIRITUEUSE', 'DOUBLE VANILLE']),
    'guerlain|Cuir Béluga': guerlainArt('#e8b020', ['CUIR', 'BÉLUGA']),
    "guerlain|Bois d'Arménie": S({ w: 0.24, h: 0.78, d: 0.18, r: 0.01, juice: '#d8a040', level: 0.9, art: { w: 0.06, h: 0.5, x: 0.07, y: 0.42, bg: '#c8a050' }, cap: [{ s: 'cyl', r: 0.03, h: 0.08, fin: 'gold' }, { s: 'sphere', r: 0.08, fin: 'gold' }] }),
    'guerlain|Habit Rouge': S({ w: 0.46, h: 0.64, d: 0.26, r: 0.02, juice: '#efe4b0', level: 0.88, art: { w: 0.16, h: 0.2, y: 0.36, bg: '#c8102e', t: [['HABIT', 0.3, 0.12, '#ffffff', { font: 'helv', weight: 700 }], ['ROUGE', 0.48, 0.14, '#ffffff', { font: 'helv', weight: 700 }], ['Guerlain', 0.85, 0.1, '#ffffff', { font: 'serif', italic: true }]] }, cap: [{ s: 'cyl', r: 0.1, h: 0.05, color: '#0b0b0b' }, { s: 'cyl', r: 0.1, h: 0.18, fin: 'chrome' }] }),
    'guerlain|Shalimar': () => { const k = kit(); const g = sphere(1, 0.34, 0.36, 0.28, 0.15); k.glassBody(g, glass({ op: 0.25 }), { color: '#e8a030', level: 0.95, inset: 0.86, op: 0.95 }); k.part(cyl(0.16, 0.18, 0.06, 0, 32), glass({ op: 0.4 })); k.part(cyl(0.06, 0.06, 0.06, 0.62, 20), fin('gold')); const st = new (T().CylinderGeometry)(0.16, 0.16, 0.08, 24, 1, false, -Math.PI / 2, Math.PI); st.rotateX(Math.PI / 2); st.rotateZ(Math.PI / 2); st.translate(0, 0.72, 0); k.part(st, glass({ tint: '#1a3a9a', op: 0.92 })); k.flat(0.3, 0.06, 0, 0.5, 0.14, paint(0.3, 0.06, (P) => P.text('SHALIMAR', 0.5, 0.5, 0.6, '#5a3a10', { font: 'roman', track: 0.2 }))); k.top(0.62); return k.done(); },

    // Cartier
    'cartier|Déclaration': S({ w: 0.4, h: 0.72, d: 0.24, r: 0.1, juice: '#f0e8c8', level: 0.88, art: { w: 0.2, h: 0.56, y: 0.36, draw: (P) => { P.g.save(); P.g.translate(P.W * 0.5, P.H * 0.5); P.g.rotate(-Math.PI / 2); P.g.font = `${P.W * 0.42}px "Bodoni Moda", Georgia, serif`; P.g.fillStyle = '#111'; P.g.textAlign = 'center'; P.g.fillText('Cartier', 0, P.W * 0.15); P.g.font = `${P.W * 0.12}px Arial`; P.g.fillText('DÉCLARATION', 0, -P.W * 0.2); P.g.restore(); } }, cap: [{ s: 'cyl', r: 0.1, h: 0.16, fin: 'chrome' }, { s: 'ring', r: 0.06, tube: 0.015, fin: 'chrome', stay: true }] }),
    "cartier|L'Envol de Cartier": S({ body: 'lathe', w: 0.33, d: 0.33, h: 0.65, pts: [[0, 0], [0.1, 0], [0.14, 0.03], [0.16, 0.12], [0.165, 0.4], [0.15, 0.56], [0.11, 0.62], [0.06, 0.65], [0, 0.65]], juice: '#e0b040', level: 0.84, art: { arc: 1.2, h: 0.1, y: 0.22, r: 0.168, t: [['Cartier', 0.5, 0.6, '#a87a20', { font: 'serif', italic: true }]] }, cap: [{ s: 'cyl', r: 0.05, h: 0.04, fin: 'chrome' }, { s: 'cyl', r: 0.075, h: 0.16, fin: 'chrome', seg: 24 }] }),

    // Issey Miyake
    "issey|Nuit d'Issey": S({ w: 0.4, h: 0.84, d: 0.24, r: 0.01, solid: '#141414', art: { w: 0.36, h: 0.8, y: 0.42, draw: (P) => { for (let i = 0; i < 40; i++) P.line(0, i / 40, 1, i / 40 + 0.02, 'rgba(255,255,255,0.05)', 0.003); P.text("NUIT D'ISSEY", 0.5, 0.3, 0.03, '#f2f2f2', { font: 'helv', weight: 600, track: 0.25 }); P.text('ISSEY MIYAKE', 0.5, 0.92, 0.025, '#f2f2f2', { font: 'roman', track: 0.15 }); } } }),

    // Mugler
    'mugler|A*Men Pure Havane': amen({ body: '#8a6a2a', metal: 0.3, rough: 0.6, star: '#e0a020' }),
    'mugler|A*Men': amen({ body: '#e2e6ea', metal: 1, rough: 0.12, star: '#2a5ac8' }),
    'mugler|Alien Man': S({ w: 0.46, h: 0.74, d: 0.22, r: 0.02, glass: '#1a2440', op: 0.94, cap: [{ s: 'box', w: 0.06, d: 0.04, h: 0.16, fin: 'chrome', dy: -0.1 }] }),

    // Carolina Herrera
    'ch|Bad Boy': () => {
      const k = kit(); const t = T();
      const s = new t.Shape(); [[-0.05, 0.82], [0.22, 0.82], [0.06, 0.5], [0.24, 0.5], [-0.18, 0.0], [-0.04, 0.36], [-0.22, 0.36]].forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
      const g = new t.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 }); g.translate(0, 0, -0.08);
      k.solidBody(g, solid({ color: '#0b0b0b', rough: 0.12 }));
      k.part(box(0.36, 0.2, 0.02, 0.005, 0), fin('gold'));
      k.top(0.82); return k.done();
    },
    'ch|CH Men Privé': S({ w: 0.56, h: 0.62, d: 0.28, r: 0.02, juice: '#d8c0a0', level: 0.5, art: { w: 0.56, h: 0.34, y: 0.45, bg: '#0b0b0b', t: [['CH', 0.35, 0.22, '#d8b060', { font: 'serif' }], ['HC', 0.62, 0.22, '#d8b060', { font: 'serif' }]] }, cap: [{ s: 'box', w: 0.34, d: 0.26, h: 0.18, color: '#0b0b0b' }, { s: 'box', w: 0.06, d: 0.02, h: 0.03, fin: 'gold', dy: -0.1, x: 0.17, z: 0.1, stay: true }] }),

    // Dunhill
    'dunhill|Icon Elite': S({ body: 'cyl', w: 0.44, h: 0.7, d: 0.44, solid: '#141414', art: { wrap: true, arc: Math.PI * 2, h: 0.56, y: 0.4, r: 0.224, sz: 1, draw: (P) => { for (let i = 0; i < 80; i++) { P.line(i / 80, 0, i / 80 + 0.1, 1, 'rgba(255,255,255,0.12)', 0.003); P.line(i / 80, 0, i / 80 - 0.1, 1, 'rgba(255,255,255,0.12)', 0.003); } } }, cap: [{ s: 'sphere', r: 0.22, sy: 0.25, color: '#141414' }] }),
    'dunhill|Icon': S({ body: 'cyl', w: 0.44, h: 0.7, d: 0.44, metal: 1, solid: '#d8dce0', art: { wrap: true, arc: Math.PI * 2, h: 0.56, y: 0.4, r: 0.224, sz: 1, draw: (P) => { for (let i = 0; i < 80; i++) { P.line(i / 80, 0, i / 80 + 0.1, 1, 'rgba(0,0,0,0.15)', 0.003); P.line(i / 80, 0, i / 80 - 0.1, 1, 'rgba(0,0,0,0.15)', 0.003); } } }, cap: [{ s: 'sphere', r: 0.22, sy: 0.25, fin: 'chrome' }] }),

    // Lalique
    'lalique|Encre Noire': S({ w: 0.54, h: 0.48, d: 0.3, r: 0.01, glass: '#0a0a0a', op: 0.97, art: { w: 0.4, h: 0.08, y: 0.3, t: [['ENCRE  NOIRE', 0.5, 0.5, 0.6, '#ffffff', { font: 'helv', track: 0.1 }]] }, cap: [{ s: 'box', w: 0.26, d: 0.2, h: 0.26, color: '#3a2620', rough: 0.6 }] }),
    "lalique|Encre Noire à l'Extrême": S({ w: 0.54, h: 0.48, d: 0.3, r: 0.01, juice: '#6a2a0a', level: 0.9, art: { w: 0.54, h: 0.48, y: 0.24, draw: (P) => { P.rect(0, 0.62, 1, 0.38, '#0a0a0a'); P.text('ENCRE  NOIRE', 0.5, 0.56, 0.1, '#ffffff', { font: 'helv', track: 0.1 }); P.text("À L'EXTRÊME", 0.5, 0.68, 0.07, '#ffffff', { font: 'helv', track: 0.1 }); } }, cap: [{ s: 'box', w: 0.26, d: 0.2, h: 0.26, color: '#0b0b0b' }] }),
  });

  // Every Louis Vuitton bottle shares the same silhouette, so unlisted ones get it too.
  Object.assign(BottleCraft.tools, { Q, S, matOf, profile, disc });
  BottleCraft.houseFallback('lv', lv({ bottom: '#e8c08a', top: '#f6ecdc' }));
})();
