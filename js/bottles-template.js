/* Sillage — the template houses, modelled from reference photos: Byredo, Parfums de Marly,
 * Tom Ford, Maison Francis Kurkdjian, Clive Christian and Creed Absolu Aventus.
 * Each house shares one or two bottles across its line, so every house gets a template here
 * built to the real bottle's proportions, and each fragrance passes its own glass, juice,
 * lacquer, cap and label colours as read off its photo.
 */
(() => {
  const B = BottleCraft.tools;
  const { kit, box, cyl, sphere, lathe, pillow, merge, gradient, glass, solid, fin, paint, profile } = B;
  const T = () => B.T;

  /* ---------- shared helpers ---------- */
  // Unlit juice (true colour on the dark stage) inside a clear shell, fading bottom -> top.
  function fill(k, geo, bottom, top, o = {}) {
    const g = geo.clone(); const ins = o.inset || 0.92;
    g.scale(ins, o.level || 0.9, o.insetZ || ins); g.translate(0, o.lift != null ? o.lift : 0.02, 0);
    gradient(g, bottom, top || bottom, o.gc || 1);
    k.part(g, new (T().MeshBasicMaterial)({ vertexColors: true, transparent: true, opacity: o.op || 0.94, depthWrite: false }), 1);
  }
  const shell = (o = {}) => glass({ op: o.op != null ? o.op : 0.16, env: o.env || 2.6 });
  // Opaque lacquered glass with a soft vertical gradient so it doesn't read flat.
  function lacquer(geo, bottom, top, o = {}) {
    gradient(geo, bottom, top || bottom, o.gc || 0.8);
    return solid({ grad: true, rough: o.rough != null ? o.rough : 0.2, coat: o.coat != null ? o.coat : 0.5, env: o.env || 1.1, metal: o.metal || 0 });
  }
  const split2 = (s) => { const w = s.split(' '); if (w.length < 2) return [s]; const m = Math.ceil(w.length / 2); return [w.slice(0, m).join(' '), w.slice(m).join(' ')]; };
  const flatPath = (P, pts, color, fx, fy) => P.path(pts.map(([x, y]) => [fx(x), fy(y)]), color);
  const metal = (color, rough = 0.28) => solid({ color, metal: 1, rough, coat: 0, env: 2.4 });
  const mat = (m) => (typeof m === 'function' ? m() : m);

  /* ---------- Byredo ---------- */
  // Round clear flacon nearly covered by a white paper label, under a tall glossy black bullet cap.
  const BYR_CAP = [[0, 0], [0.205, 0], [0.205, 0.2], [0.2, 0.26], [0.185, 0.31], [0.155, 0.355], [0.11, 0.385], [0.05, 0.4], [0, 0.402]];
  const byr = (o = {}) => (item) => {
    const k = kit(); const R = 0.34, H = 0.6;
    k.glassBody(cyl(R, R, H, 0, 64), shell(), null);
    fill(k, cyl(R, R, H, 0, 64), o.juice || '#e8e2bf', o.juiceTop || o.juice || '#f2eed8', { inset: 0.93, level: 0.88, lift: 0.045, gc: 1.4 });
    k.part(cyl(R * 0.985, R * 0.985, 0.045, 0, 64), glass({ op: 0.22, env: 2.6 }));
    const lines = o.lines || [item.name.toUpperCase()];
    const A = 2.44, lr = R + 0.004;
    const draw = (P) => {
      const ink = o.ink || '#141414';
      if (!o.bare) P.rect(0, 0, 1, 1, o.label || '#f6f5f1');
      P.text('BYREDO', 0.5, o.big ? 0.15 : 0.17, o.big ? 0.09 : 0.072, ink, { font: 'helv', weight: 600, track: 0.28 });
      const sz = o.size || (lines.length > 1 ? 0.11 : 0.12);
      lines.forEach((l, i) => P.text(l, 0.5, 0.48 + (i - (lines.length - 1) / 2) * sz * 1.25, sz, ink, { font: 'helv', weight: o.weight || 600, track: 0.07, maxW: 0.64 }));
      P.text(o.sub || 'EAU DE PARFUM', 0.5, 0.86, 0.046, ink, { font: 'helv', weight: 600, track: 0.14 });
    };
    k.wrap(lr, 0.47, 0.305, A, paint(A * lr, 0.47, draw));
    k.part(cyl(0.075, 0.075, 0.03, H, 24), fin('silver'));
    k.part(lathe(BYR_CAP, H + 0.02, 1, 56), solid({ color: '#0a0a0b', rough: 0.1, coat: 1, env: 1.6 }));
    k.top(H);
    return k.done();
  };

  /* ---------- Parfums de Marly ---------- */
  // Rearing horse in a unit box (head up right, forelegs raised, tail bottom left).
  const HORSE = [[0.52, 0.02], [0.6, 0.0], [0.7, 0.06], [0.8, 0.16], [0.84, 0.24], [0.78, 0.27], [0.7, 0.22], [0.66, 0.3], [0.72, 0.38], [0.86, 0.42], [0.97, 0.5], [1.0, 0.62], [0.95, 0.64], [0.9, 0.53], [0.8, 0.5], [0.84, 0.58], [0.86, 0.68], [0.81, 0.7], [0.76, 0.58], [0.66, 0.54], [0.6, 0.64], [0.52, 0.74], [0.52, 0.86], [0.6, 0.96], [0.58, 1.0], [0.46, 0.98], [0.42, 0.86], [0.36, 0.84], [0.3, 0.94], [0.32, 1.0], [0.2, 1.0], [0.22, 0.88], [0.26, 0.76], [0.16, 0.8], [0.04, 0.9], [0.0, 0.86], [0.12, 0.72], [0.26, 0.64], [0.34, 0.5], [0.42, 0.36], [0.46, 0.2]];
  function marlyCrest(P, hi, lo, y0 = 0.05) {
    const layer = (col, dx, dy) => {
      // Ribbon banner behind the shield.
      P.path([[0.08, 0.47], [0.2, 0.43], [0.5, 0.45], [0.8, 0.43], [0.92, 0.47], [0.9, 0.52], [0.8, 0.48], [0.5, 0.5], [0.2, 0.48], [0.1, 0.52]].map(([x, y]) => [x + dx, y + y0 + dy]), col);
      // Two horses rearing inward over the shield.
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? 0.04 : 0.96, w = 0.44, h = 0.38;
        flatPath(P, HORSE, col, (x) => x0 - side * x * w + dx, (y) => y0 + y * h + dy);
      }
      P.path([[0.35, 0.3], [0.65, 0.3], [0.64, 0.46], [0.58, 0.54], [0.5, 0.58], [0.42, 0.54], [0.36, 0.46]].map(([x, y]) => [x + dx, y + y0 + dy]), col);
    };
    layer(lo, 0.008, 0.008); layer(hi, 0, 0);
    P.path([[0.38, 0.33], [0.62, 0.33], [0.61, 0.45], [0.56, 0.52], [0.5, 0.55], [0.44, 0.52], [0.39, 0.45], [0.38, 0.33]].map(([x, y]) => [x, y + y0]), lo, false, 0.004);
    P.text('1743', 0.5, y0 + 0.41, 0.04, lo, { font: 'roman', weight: 600, track: 0.1 });
  }
  // The crest in real relief: horse, shield and ribbon outlines extruded off the front face.
  // Canvas coords of the front art (0.48 x 0.68, centred at y 0.37) map to bottle space.
  function marlyRelief(k, z, mat, y0 = 0.05) {
    const t = T(), AW = 0.48, AH = 0.68, AY = 0.37;
    const wx = (u) => (u - 0.5) * AW, wy = (v) => AY + (0.5 - v) * AH;
    const shape = (pts) => { const sh = new t.Shape(); pts.forEach(([u, v], i) => (i ? sh.lineTo(wx(u), wy(v)) : sh.moveTo(wx(u), wy(v)))); return sh; };
    const opts = { depth: 0.006, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.0035, bevelSegments: 2, curveSegments: 4 };
    const shapes = [];
    for (const side of [-1, 1]) { const x0 = side < 0 ? 0.04 : 0.96; shapes.push(shape(HORSE.map(([x, y]) => [x0 - side * x * 0.44, y0 + y * 0.38]))); }
    shapes.push(shape([[0.35, 0.3], [0.65, 0.3], [0.64, 0.46], [0.58, 0.54], [0.5, 0.58], [0.42, 0.54], [0.36, 0.46]].map(([x, y]) => [x, y + y0])));
    shapes.push(shape([[0.08, 0.47], [0.2, 0.43], [0.5, 0.45], [0.8, 0.43], [0.92, 0.47], [0.9, 0.52], [0.8, 0.48], [0.5, 0.5], [0.2, 0.48], [0.1, 0.52]].map(([x, y]) => [x, y + y0])));
    const g = new t.ExtrudeGeometry(shapes, opts); g.translate(0, 0, z - 0.004);
    k.part(g, mat, mat.transparent ? 3 : 0);
  }
  const marly = (o = {}) => (item) => {
    const k = kit(); const W = 0.52, H = 0.74, D = 0.3;
    const geo = pillow(W, H, D, 0.22, 0.16);
    let relief;
    if (o.clear) {
      // Tinted see-through glass: the stage shows through, thicker edges read darker.
      k.glassBody(geo, glass({ tint: o.clear[1], op: o.glassOp || 0.4, env: 2.8 }), null);
      fill(k, pillow(W, H, D, 0.22, 0.16), o.clear[0], o.clear[1], { inset: 0.84, insetZ: 0.7, level: 0.88, lift: 0.045, op: o.juiceOp || 0.78, gc: 0.9 });
      relief = glass({ tint: o.clear[1], op: 0.75, env: 3 });
    } else {
      k.solidBody(geo, lacquer(geo, o.color[0], o.color[1], { coat: o.coat != null ? o.coat : 0.55, rough: 0.22, env: o.env || 1.1, metal: o.metal }));
      const rc = new (T().Color)(o.relief || o.color[1]).lerp(new (T().Color)('#ffffff'), o.lift != null ? o.lift : 0.18);
      relief = solid({ color: '#' + rc.getHexString(), rough: 0.25, coat: o.coat != null ? o.coat : 0.55, env: o.env || 1.3, metal: o.metal || 0 });
    }
    marlyRelief(k, D / 2, relief);
    const hi = o.hi || 'rgba(255,255,255,0.17)', lo = o.lo || 'rgba(0,0,0,0.3)';
    k.flat(0.48, 0.68, 0, 0.37, D / 2 + 0.012, paint(0.48, 0.68, (P) => {
      P.text('1743', 0.5, 0.05 + 0.41, 0.04, o.brand || hi, { font: 'roman', weight: 600, track: 0.1 });
      if (o.name) P.text(o.name, 0.5, 0.68, o.nameSize || 0.065, o.nameInk || '#f2efe6', { font: o.nameFont || 'roman', italic: !!o.italic, weight: 500, track: o.italic ? 0 : 0.04, maxW: 0.8 });
    }));
    k.flat(0.48, 0.68, 0, 0.37, D / 2 + 0.004, paint(0.48, 0.68, (P) => {
      P.text('PARFUMS de MARLY', 0.5 + 0.004, 0.84 + 0.004, 0.036, lo, { font: 'roman', weight: 600, track: 0.14 });
      P.text('PARFUMS de MARLY', 0.5, 0.84, 0.036, o.brand || hi, { font: 'roman', weight: 600, track: 0.14 });
      P.text('PARIS', 0.5, 0.89, 0.022, o.brand || hi, { font: 'roman', track: 0.3 });
    }));
    const capMat = mat(o.capMat) || fin(o.cap || 'silver');
    k.part(cyl(0.07, 0.07, 0.03, H - 0.005, 24), fin('silver'));
    const cp = cyl(0.168, 0.162, 0.25, H + 0.02, 8); cp.rotateY(Math.PI / 8); cp.scale(1, 1, 0.82); k.part(cp, capMat);
    k.top(H);
    return k.done();
  };
  // Delina / Valaya: the waisted "violin" flacon with a domed horse-head stopper and tassel.
  const DELINA = (() => { const r = [[0.205, 0], [0.232, 0.03], [0.236, 0.11], [0.21, 0.26], [0.18, 0.38], [0.188, 0.48], [0.222, 0.59], [0.236, 0.655], [0.212, 0.712], [0.13, 0.742], [0.075, 0.75]]; return r.concat(r.slice().reverse().map(([x, y]) => [-x, y])); })();
  const delina = (o) => (item) => {
    const k = kit(); const H = 0.75, D = 0.22;
    const geo = profile(DELINA, D, 0.025);
    k.solidBody(geo, lacquer(geo, o.color[0], o.color[1], { coat: 0.3, rough: 0.42, env: 1 }));
    // Raised baroque frame following the silhouette, inset from the edge.
    { const V = T().Vector3, f = 0.78, pts = DELINA.slice(0, 11).map(([x, y]) => new V(x * f, 0.06 + y * 0.84, D / 2 + 0.002));
      const loop = pts.concat(pts.slice().reverse().map((p) => new V(-p.x, p.y, p.z)));
      k.part(new (T().TubeGeometry)(new (T().CatmullRomCurve3)(loop, true), 120, 0.009, 6, true), solid({ color: '#' + new (T().Color)(o.color[1]).lerp(new (T().Color)('#ffffff'), 0.35).getHexString(), rough: 0.35, coat: 0.3 })); }
    k.flat(0.44, 0.7, 0, 0.37, D / 2 + 0.004, paint(0.44, 0.7, (P) => {
      const e = o.emboss || 'rgba(255,255,255,0.35)', s = 'rgba(0,0,0,0.08)';
      // Baroque relief frame in the glass.
      for (const [c, d] of [[s, 0.006], [e, 0]]) {
        P.path([[0.12 + d, 0.08], [0.3, 0.04], [0.5, 0.1 + d], [0.7, 0.04], [0.88 - d, 0.08]], c, false, 0.006);
        P.path([[0.16, 0.86 + d], [0.34, 0.92], [0.5, 0.88], [0.66, 0.92], [0.84, 0.86 + d]], c, false, 0.006);
        for (const sx of [-1, 1]) P.path([[0.5 + sx * 0.38, 0.12], [0.5 + sx * 0.33, 0.3 + d], [0.5 + sx * 0.3, 0.5], [0.5 + sx * 0.33, 0.7 + d], [0.5 + sx * 0.36, 0.84]], c, false, 0.006);
      }
      P.text('PARFUMS de MARLY', 0.5, 0.95, 0.024, o.ink || 'rgba(150,110,110,0.7)', { font: 'roman', track: 0.15 });
    }));
    k.part(cyl(0.075, 0.08, 0.05, H - 0.01, 32), fin('silver'));
    k.part(new (T().TorusGeometry)(0.082, 0.014, 8, 32).rotateX(Math.PI / 2).translate(0, H + 0.03, 0), fin('silver'));
    k.part(sphere(0.135, H + 0.17, 1, 0.95, 0.85), fin('chrome'));
    k.flat(0.12, 0.12, 0, H + 0.17, 0.118, paint(0.08, 0.08, (P) => { P.circle(0.5, 0.5, 0.46, 'rgba(90,90,96,0.5)', 0.04); flatPath(P, HORSE, 'rgba(70,70,76,0.6)', (x) => 0.22 + x * 0.56, (y) => 0.2 + y * 0.6); }), { foil: true });
    // Tassel on a cord from the collar.
    const tc = solid({ color: o.tassel, rough: 0.8, coat: 0 });
    k.part(cyl(0.008, 0.008, 0.2, H - 0.17, 6, 0.1, D / 2 + 0.03), tc);
    for (const dx of [-0.032, 0.032]) { k.part(cyl(0.016, 0.045, 0.2, H - 0.42, 12, 0.1 + dx, D / 2 + 0.04), tc); k.part(sphere(0.024, H - 0.21, 1, 1.3, 1).translate(0.1 + dx, 0, D / 2 + 0.04), tc); k.part(cyl(0.004, 0.004, 0.06, H - 0.2, 4, 0.1 + dx / 2, D / 2 + 0.035), tc); }
    k.top(H);
    return k.done();
  };

  /* ---------- Tom Ford ---------- */
  function tfLabel(o, lines) {
    return (P) => {
      P.rect(0, 0, 1, 1, o.label);
      const ink = o.ink || '#ffffff';
      P.text('TOM FORD', 0.5, 0.17, 0.11, ink, { font: 'helv', weight: 600, track: 0.02 });
      lines.forEach((l, i) => P.text(l, 0.5, (lines.length > 1 ? 0.39 : 0.45) + i * 0.13, 0.115, o.nameInk || ink, { font: 'helv', weight: 800, track: 0.03, maxW: 0.88 }));
      P.text('EAU DE PARFUM', 0.5, 0.74, 0.065, ink, { font: 'helv', weight: 600, track: 0.03 });
      P.text(o.ml || '50 ML', 0.5, 0.84, 0.065, ink, { font: 'helv', weight: 600, track: 0.03 });
    };
  }
  // Private Blend: tall block, short glass neck and a T-shaped top plate the width of the bottle.
  const pb = (o) => (item) => {
    const k = kit(); const W = 0.42, H = 0.66, D = 0.27;
    if (o.solid) {
      const g = box(W, D, H, 0.02);
      k.solidBody(g, lacquer(g, o.solid[0], o.solid[1], { rough: o.rough || 0.25, coat: o.coat != null ? o.coat : 0.5 }));
    } else {
      k.glassBody(box(W, D, H, 0.02), shell({ op: 0.09 }), null);
      fill(k, box(W, D, H, 0.02), o.fill[0], o.fill[1], { inset: 0.95, level: o.level || 0.93, lift: 0.025, gc: 0.8 });
      if (o.empty) fill(k, box(W, D, H, 0.02), o.empty, o.empty, { inset: 0.9, level: 0.93 - o.level, lift: 0.025 + o.level * H, op: 0.55 });
    }
    const neckMat = mat(o.neckMat) || (o.solid ? solid({ color: o.solid[1], rough: o.rough || 0.25, coat: 0.5, env: 1.1 }) : solid({ color: o.neck, rough: 0.06, coat: 1, env: 1.3 }));
    const nk = lathe([[0, 0], [0.21, 0], [0.165, 0.04], [0.148, 0.07], [0.148, 0.17], [0, 0.17]], H - 0.01, 1, 4); nk.rotateY(Math.PI / 4); nk.scale(1.15, 1, 0.95);
    k.part(nk, neckMat);
    k.part(box(W, D * 0.82, 0.08, 0.012, H + 0.155), neckMat);
    k.flat(0.3, 0.33, 0, 0.3, D / 2 + 0.003, paint(0.3, 0.33, tfLabel(o, o.lines || split2(item.name.toUpperCase()))));
    k.top(H);
    return k.done();
  };
  // Decanter (Costa Azzurra 250 ml): tall block, chamfered shoulders, gold collar and ball stopper.
  const decanter = (o) => (item) => {
    const k = kit(); const D = 0.3;
    const pts = [[-0.2, 0], [0.2, 0], [0.2, 0.6], [0.11, 0.68], [0.06, 0.69], [-0.06, 0.69], [-0.11, 0.68], [-0.2, 0.6]];
    k.glassBody(profile(pts, D, 0.02), shell({ op: 0.09 }), null);
    fill(k, profile(pts, D, 0.02), o.fill[0], o.fill[1], { inset: 0.94, level: 0.92, lift: 0.025 });
    k.part(cyl(0.055, 0.06, 0.06, 0.68, 24), solid({ color: o.fill[1], rough: 0.06, coat: 1 }));
    k.part(cyl(0.065, 0.065, 0.025, 0.72, 24), fin('gold'));
    k.part(cyl(0.035, 0.05, 0.05, 0.745, 24), solid({ color: o.fill[1], rough: 0.06, coat: 1 }));
    k.part(sphere(0.115, 0.89), solid({ color: o.ball, rough: 0.05, coat: 1, env: 1.6 }));
    k.flat(0.2, 0.25, 0, 0.36, D / 2 + 0.003, paint(0.2, 0.25, tfLabel(o, split2(item.name.toUpperCase()))));
    k.top(0.7);
    return k.done();
  };
  // Signature line: black block with a full-width ribbed cap (Noir, Noir Extreme).
  const noir = (o) => (item) => {
    const k = kit(); const W = 0.5, H = 0.66, D = 0.28;
    const g = box(W, D, H, 0.025);
    k.solidBody(g, lacquer(g, o.body[0], o.body[1], { rough: 0.12, coat: 1, env: 1.3 }));
    k.flat(0.44, 0.2, 0, 0.17, D / 2 + 0.004, paint(0.44, 0.2, (P) => {
      P.text('TOM FORD', 0.5, 0.28, 0.24, o.ink, { font: 'helv', weight: 600, track: 0.02 });
      P.text('NOIR', 0.5, 0.55, 0.24, o.ink, { font: 'helv', weight: 600, track: 0.04 });
      if (o.sub) P.text(o.sub, 0.5, 0.79, 0.16, o.ink, { font: 'helv', weight: 600, track: 0.06 });
    }), { foil: o.foil });
    k.part(box(0.26, 0.16, 0.04, 0.01, H - 0.005), solid({ color: '#0d0d0d', rough: 0.3 }));
    const capMat = o.cap === 'gold' ? metal('#c99a3e', 0.32) : solid({ color: '#0d0d0e', rough: 0.25, coat: 0.6 });
    k.part(box(W, D, 0.22, 0.02, H + 0.03), capMat);
    // Vertical ribs on the cap.
    const ribs = [];
    for (let i = 0; i < 26; i++) { const r = new (T().BoxGeometry)(0.008, 0.2, 0.012); r.translate(-W / 2 + 0.02 + i * (W - 0.04) / 25, H + 0.14, D / 2 + 0.002); ribs.push(r); }
    for (let i = 0; i < 14; i++) for (const s of [-1, 1]) { const r = new (T().BoxGeometry)(0.012, 0.2, 0.008); r.translate(s * (W / 2 + 0.002), H + 0.14, -D / 2 + 0.02 + i * (D - 0.04) / 13); ribs.push(r); }
    k.part(merge(ribs), o.cap === 'gold' ? metal('#a87a2a', 0.4) : solid({ color: '#1e1e20', rough: 0.4, coat: 0.2 }));
    k.top(H);
    return k.done();
  };
  // Ombré Leather: matte black rounded flacon, round black cap, framed black label.
  const ombre = () => (item) => {
    const k = kit(); const W = 0.52, H = 0.68, D = 0.3;
    const g = pillow(W, H, D, 0.3, 0.14);
    k.solidBody(g, lacquer(g, '#0b0b0c', '#1a1a1c', { rough: 0.55, coat: 0.15, env: 1 }));
    k.flat(0.44, 0.16, 0, 0.24, D / 2 + 0.003, paint(0.44, 0.16, (P) => {
      P.rect(0, 0, 1, 1, '#0c0c0c'); P.frame(0.02, 0.05, 0.96, 0.9, '#9a9a9a', 0.03);
      P.text('TOM FORD', 0.5, 0.37, 0.26, '#f4f4f4', { font: 'helv', weight: 600, track: 0.03 });
      P.text('OMBRÉ LEATHER', 0.5, 0.69, 0.2, '#e8e8e8', { font: 'helv', weight: 600, track: 0.04 });
    }));
    k.part(cyl(0.135, 0.135, 0.25, H - 0.01, 48), solid({ color: '#111113', rough: 0.45, coat: 0.2 }));
    k.top(H);
    return k.done();
  };
  // Fluted oval flacon with a metal plaque (Tom Ford for Men, Grey Vetiver, Black Orchid).
  const FLUTE = [[0, 0], [0.2, 0], [0.215, 0.02], [0.222, 0.1], [0.226, 0.42], [0.22, 0.5], [0.2, 0.56], [0.16, 0.6], [0.1, 0.625], [0.06, 0.632], [0, 0.632]];
  const ORCHID = [[0, 0], [0.16, 0], [0.18, 0.025], [0.205, 0.2], [0.232, 0.42], [0.232, 0.5], [0.21, 0.57], [0.15, 0.625], [0.08, 0.65], [0.05, 0.655], [0, 0.655]];
  const fluted = (o) => (item) => {
    const k = kit(); const SZ = 0.56;
    const pts = o.orchid ? ORCHID : FLUTE, Ht = pts[pts.length - 1][1];
    if (o.solid) { const g = lathe(pts, 0, SZ, 64); k.solidBody(g, lacquer(g, o.solid[0], o.solid[1], { rough: 0.1, coat: 1, env: 1.4 })); }
    else {
      k.glassBody(lathe(pts, 0, SZ, 64), shell({ op: o.frost || 0.2 }), null);
      fill(k, lathe(pts, 0, SZ, 64), o.fill[0], o.fill[1], { inset: 0.92, level: 0.9, lift: 0.025, gc: 0.9 });
    }
    // Vertical flutes catch the light as fine stripes.
    const r = o.orchid ? 0.236 : 0.228;
    k.wrap(r, Ht * 0.62, Ht * 0.4, Math.PI * 2, paint(Math.PI * 2 * r, Ht * 0.62, (P) => {
      for (let i = 0; i < 90; i++) { P.rect(i / 90, 0, 0.0035, 1, o.flute || 'rgba(255,255,255,0.18)'); P.rect(i / 90 + 0.005, 0, 0.003, 1, 'rgba(0,0,0,0.16)'); }
    }, 1024), { sz: SZ });
    const pl = o.plaque;
    k.flat(0.17, 0.17, 0, Ht * 0.34, r * SZ + 0.006, paint(0.17, 0.17, (P) => {
      P.rect(0, 0, 1, 1, pl[0]); P.frame(0.04, 0.04, 0.92, 0.92, pl[1], 0.02);
      P.text('TOM FORD', 0.5, o.orchid ? 0.36 : 0.44, 0.09, pl[2], { font: 'helv', weight: 500, track: 0.05 });
      if (o.sub) P.text(o.sub, 0.5, 0.52, 0.08, pl[2], { font: 'helv', weight: 500, track: 0.04 });
      P.text(o.foot || '100 ML', 0.5, 0.85, 0.05, pl[2], { font: 'helv', track: 0.1 });
    }), { foil: true });
    const capFin = mat(o.capMat) || metal(o.cap === 'silver' ? '#d8dce0' : '#d4a64e', 0.25);
    k.part(cyl(o.collar || 0.07, o.collar || 0.07, 0.035, Ht - 0.005, 40), mat(o.collarMat) || capFin);
    const capH = o.capH || 0.22, cr = o.capR || 0.06;
    k.part(lathe([[0, 0], [cr, 0], [cr, capH * 0.82], [cr * 0.85, capH * 0.93], [cr * 0.5, capH], [0, capH]], Ht + 0.03, 1, 24), mat(o.capMat2) || capFin);
    k.top(Ht);
    return k.done();
  };

  /* ---------- Maison Francis Kurkdjian ---------- */
  // Square crystal block with the house name printed in the top-left and the KK seal low centre.
  const mk = (o) => (item) => {
    const k = kit(); const W = 0.56, H = 0.62, D = 0.42;
    if (o.solid) { const g = box(W, D, H, 0.05); k.solidBody(g, lacquer(g, o.solid[0], o.solid[1], { rough: 0.15, coat: 0.9, env: 1.2 })); }
    else {
      k.glassBody(box(W, D, H, 0.05), shell({ op: o.jop ? 0.22 : 0.1 }), null);
      fill(k, box(W, D, H, 0.05), o.fill[0], o.fill[1], { inset: 0.86, level: 0.82, lift: 0.075, op: o.jop || 0.94 });
      k.part(box(W * 0.98, D * 0.98, 0.07, 0.04), glass({ op: 0.2, env: 2.6 }));
    }
    const ink = o.ink;
    k.flat(W * 0.94, H * 0.94, 0, H / 2, D / 2 + 0.003, paint(W * 0.94, H * 0.94, (P) => {
      ['Maison', 'Francis Kurkdjian', 'Paris'].forEach((s, i) => P.text(s, 0.07, 0.1 + i * 0.085, 0.08, ink, { font: 'serif', weight: 500, align: 'left', maxW: 0.78 }));
      if (o.draw) o.draw(P, ink); else P.text(item.name, 0.92, 0.4, 0.085, o.nameInk || ink, { font: 'serif', weight: 400, align: 'right', maxW: 0.6 });
      // KK seal.
      P.frame(0.445, 0.76, 0.11, 0.1, ink, 0.006);
      P.text('KK', 0.5, 0.812, 0.06, ink, { font: 'roman', weight: 600, track: -0.05 });
    }));
    const capMat = o.cap === 'gold' ? metal('#d9bf86', 0.4) : o.cap === 'chrome' ? metal('#e4e8eb', 0.34) : metal('#9a9da0', 0.6);
    k.part(cyl(0.1, 0.1, 0.06, H, 32), o.cap === 'gold' ? metal('#e2c88e', 0.22) : fin('silver'));
    k.part(box(0.32, 0.28, 0.2, 0.012, H + 0.055), capMat);
    k.top(H);
    return k.done();
  };
  const oudMood = (sub) => (P, ink) => {
    P.text('OUD', 0.78, 0.38, 0.1, ink, { font: 'serif', weight: 500, track: 0.04 });
    P.text(sub, 0.78, 0.47, 0.08, ink, { font: 'serif', italic: true });
  };

  /* ---------- Clive Christian ---------- */
  // Shield with the CC monogram under a small crown, in one ink.
  function ccCrest(P, x, y, s, ink, line) {
    const ax = P.H / P.W, fx = (u) => x + u * s * ax, fy = (v) => y + v * s;
    P.path([[fx(-0.5), fy(-0.3)], [fx(0.5), fy(-0.3)], [fx(0.48), fy(0.25)], [fx(0.3), fy(0.55)], [fx(0), fy(0.72)], [fx(-0.3), fy(0.55)], [fx(-0.48), fy(0.25)]], ink, !line, 0.006);
    P.text('C', x, fy(0.18), s * 0.7, line ? ink : 'rgba(0,0,0,0.45)', { font: 'serif', weight: 600, italic: true });
    // Crown above the shield.
    P.path([[fx(-0.32), fy(-0.38)], [fx(-0.36), fy(-0.62)], [fx(-0.18), fy(-0.5)], [fx(0), fy(-0.72)], [fx(0.18), fy(-0.5)], [fx(0.36), fy(-0.62)], [fx(0.32), fy(-0.38)]], ink);
    P.circle(fx(0), fy(-0.8), s * 0.06, ink);
  }
  const cc = (o) => (item) => {
    const k = kit(); const W = 0.36, H = 0.6, D = 0.2;
    let bodyTop;
    if (o.gold) {
      const g = box(W, D, H, 0.02); k.solidBody(g, metal('#d6ab50', 0.3));
      bodyTop = metal('#d6ab50', 0.3);
    } else {
      k.glassBody(box(W, D, H, 0.02), shell({ op: 0.09 }), null);
      fill(k,  box(W, D, H, 0.02), o.fill[0], o.fill[1], { inset: 0.94, level: 0.95, lift: 0.015, gc: 0.8 });
      bodyTop = o.clearTop ? glass({ op: 0.3, env: 2.6 }) : solid({ color: o.fill[0], rough: 0.06, coat: 1, env: 1.1 });
    }
    // Stepped shoulder.
    k.part(box(0.29, 0.17, 0.05, 0.012, H - 0.005), bodyTop);
    const cf = o.crown === 'silver' ? metal('#dfe3e7', 0.2) : metal('#dcb25a', 0.24);
    // Ribbed collar, then the crown: band, two crossed arches over a cushion, and the orb.
    k.part(cyl(0.075, 0.08, 0.07, H + 0.045, 24), cf);
    k.part(cyl(0.1, 0.08, 0.025, H + 0.115, 24), cf);
    k.part(cyl(0.125, 0.115, 0.065, H + 0.14, 32), cf);
    k.part(sphere(0.1, H + 0.205, 1, 0.95, 1), o.cushion ? solid({ color: o.cushion, rough: 0.6, coat: 0 }) : cf);
    for (const a of [0, Math.PI / 2]) { const t = new (T().TorusGeometry)(0.115, 0.03, 10, 28, Math.PI); t.scale(1, 1.1, 1); t.rotateY(a); t.translate(0, H + 0.205, 0); k.part(t, cf); }
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; k.part(sphere(0.022, H + 0.215, 1, 1.5, 1).translate(Math.cos(a) * 0.125, 0, Math.sin(a) * 0.125), cf); }
    k.part(sphere(0.036, H + 0.36), cf);
    k.part(box(0.014, 0.014, 0.06, 0.002, H + 0.385), cf);
    k.part(box(0.04, 0.014, 0.014, 0.002, H + 0.415), cf);
    if (o.diamond) k.part(sphere(0.022, H + 0.08, 1, 1, 1).translate(0, 0, 0.07), solid({ color: '#ffffff', rough: 0.02, coat: 1, env: 3, flat: true }));
    k.flat(W * 0.9, H * 0.94, 0, H / 2, D / 2 + 0.003, paint(W * 0.9, H * 0.94, (P) => o.art(P)));
    k.top(H);
    return k.done();
  };
  const ccText = (P, lines, ink, font = 'roman') => lines.forEach(([s, y, sz, opt]) => P.text(s, 0.5, y, sz, ink, Object.assign({ font, weight: 500, track: 0.12, maxW: 0.86 }, opt)));
  const crownArt = (name, ink = '#ffffff') => (P) => {
    ccCrest(P, 0.5, 0.27, 0.26, ink, true);
    ccText(P, [['EST 1872', 0.52, 0.05, { font: 'helv', weight: 700 }], ['CLIVE CHRISTIAN', 0.79, 0.05, { font: 'helv', weight: 700, track: 0.04 }], ['CROWN COLLECTION', 0.85, 0.03, { font: 'helv', weight: 600 }], [name, 0.93, 0.03, { font: 'helv', weight: 600 }]], ink);
  };
  const legacyArt = (title, lines, ink) => (P) => {
    ccCrest(P, 0.5, 0.22, 0.22, ink, true);
    P.text('EST', 0.3, 0.46, 0.045, ink, { font: 'roman', track: 0.2 }); P.text('1872', 0.7, 0.46, 0.045, ink, { font: 'roman', track: 0.2 });
    if (title) P.text(title[0], 0.5, title[1], title[2], ink, { font: 'roman', weight: 500, track: 0.04 });
    ccText(P, lines, ink);
  };

  BottleCraft.add({
    /* Byredo — photos 001-018 */
    "byredo|Bal d'Afrique": byr({ juice: '#ece2b8' }),
    'byredo|Mojave Ghost': byr({ juice: '#efe8c6' }),
    'byredo|Blanche': byr({ juice: '#f2efe2' }),
    'byredo|Super Cedar': byr({ juice: '#efe9cc' }),
    'byredo|Bibliothèque': byr({ juice: '#ead9b0' }),
    "byredo|Rose of No Man's Land": byr({ juice: '#f1dfd2', lines: ['ROSE OF', "NO MAN'S LAND"] }),
    'byredo|Oud Immortel': byr({ juice: '#e2d29c' }),
    'byredo|Tobacco Mandarin': byr({ juice: '#2e0308', juiceTop: '#5a0a16', bare: true, ink: '#eab4b8', lines: ['TOBACCO', 'MANDARIN'], size: 0.1, weight: 300, sub: 'EXTRAIT DE PARFUM' }),
    'byredo|Eleventh Hour': byr({ juice: '#ecdfb4', lines: ['ELEVENTH', 'HOUR'] }),
    'byredo|Mixed Emotions': byr({ juice: '#efe6c0', lines: ['MIXED', 'EMOTIONS'] }),
    'byredo|Black Saffron': byr({ juice: '#e8d6a6' }),
    'byredo|Pulp': byr({ juice: '#efe4c2' }),
    'byredo|Sundazed': byr({ juice: '#f2e6b4' }),
    'byredo|Slow Dance': byr({ juice: '#e9d7a8' }),
    'byredo|Lil Fleur': byr({ juice: '#f0e2c8' }),
    'byredo|Velvet Haze': byr({ juice: '#efe8d0' }),
    'byredo|Mumbai Noise': byr({ juice: '#e4cc78', lines: ['MUMBAI', 'NOISE'] }),
    'byredo|1996': byr({ juice: '#e8dcb4', big: true, size: 0.11, sub: 'INEZ & VINOODH' }),

    /* Parfums de Marly — photos 019-035 */
    'pdm|Layton': marly({ color: ['#0e1630', '#1c2a4e'] }),
    'pdm|Layton Exclusif': marly({ color: ['#0c1220', '#1a2538'], name: 'Layton Exclusif' }),
    'pdm|Pegasus': marly({ color: ['#9ea0a2', '#c8cacc'], hi: 'rgba(255,255,255,0.55)', lo: 'rgba(0,0,0,0.16)', coat: 0.4 }),
    'pdm|Pegasus Exclusif': marly({ color: ['#1e1e1e', '#373735'], name: 'Pegasus Exclusif', nameInk: '#e6dcc2' }),
    'pdm|Herod': marly({ color: ['#231e20', '#433a3e'], capMat: () => metal('#4a4448', 0.3) }),
    'pdm|Sedley': marly({ clear: ['#1c4670', '#4a80b4'], hi: 'rgba(220,235,250,0.3)', lo: 'rgba(10,30,60,0.35)' }),
    'pdm|Percival': marly({ color: ['#060c34', '#101a50'] }),
    'pdm|Greenley': marly({ clear: ['#1f6a46', '#4aa07a'], hi: 'rgba(225,250,235,0.3)', lo: 'rgba(10,50,30,0.35)' }),
    'pdm|Carlisle': marly({ color: ['#1c1e20', '#3a3c3f'], name: 'Carlisle', nameSize: 0.07 }),
    'pdm|Kalan': marly({ color: ['#46040a', '#701018'] }),
    'pdm|Haltane': marly({ color: ['#18301a', '#2c4a2c'], name: 'Haltane', nameInk: '#e2c070', cap: 'gold', capMat: () => metal('#e4cc8e', 0.3) }),
    'pdm|Althaïr': marly({ color: ['#6a2c0e', '#9a4e22'], hi: 'rgba(255,220,190,0.22)' }),
    'pdm|Godolphin': marly({ color: ['#a87418', '#dcb044'], hi: 'rgba(255,240,190,0.35)', lo: 'rgba(90,55,5,0.32)', metal: 0.5, capMat: () => metal('#d9b154', 0.26) }),
    'pdm|Galloway': marly({ color: ['#e2e2e0', '#fafaf8'], hi: 'rgba(255,255,255,0.7)', lo: 'rgba(0,0,0,0.1)', brand: 'rgba(150,150,150,0.6)', coat: 0.3 }),
    'pdm|Oajan': marly({ color: ['#08080a', '#1c1c1e'], name: 'Oajan', italic: true, nameFont: 'serif', nameInk: '#d6ad58', nameSize: 0.06, brand: '#c9a457', capMat: () => metal('#c99a3e', 0.26) }),
    'pdm|Darley': marly({ clear: ['#c8a440', '#e8d080'], juiceOp: 0.7, hi: 'rgba(255,250,230,0.45)', lo: 'rgba(110,90,30,0.28)', capMat: () => metal('#d9b154', 0.26) }),
    'pdm|Delina': delina({ color: ['#dc8e96', '#eab0b2'], tassel: '#f0a890' }),
    'pdm|Valaya': delina({ color: ['#e6e6e8', '#fbfbfb'], tassel: '#f4f2ee', ink: 'rgba(140,140,150,0.7)' }),

    /* Tom Ford — photos 036-055 */
    'tomford|Fucking Fabulous': pb({ solid: ['#141414', '#1f1f1f'], rough: 0.5, coat: 0.1, label: '#f6f6f4', ink: '#111111' }),
    'tomford|Ombré Leather': ombre(),
    'tomford|Noir Extreme': noir({ body: ['#140b06', '#2e1a0e'], ink: '#d9a654', sub: 'EXTREME', cap: 'gold' }),
    'tomford|Noir': noir({ body: ['#08080a', '#16161a'], ink: '#e8e8ea' }),
    'tomford|Costa Azzurra': decanter({ fill: ['#0a6ec8', '#2ea6ec'], ball: '#2a96d8', label: '#d2a648', ink: '#ffffff', ml: '250 ML' }),
    'tomford|Soleil Blanc': pb({ solid: ['#e8e6e0', '#fafaf8'], rough: 0.3, label: '#d6aa50', ink: '#ffffff' }),
    'tomford|Grey Vetiver': fluted({ fill: ['#c4c8b4', '#e2e5d6'], frost: 0.3, cap: 'silver', plaque: ['#c8ccd0', '#9a9ea2', '#55595e'], flute: 'rgba(255,255,255,0.25)', sub: 'GREY VETIVER', capH: 0.24, capR: 0.055 }),
    'tomford|Tom Ford for Men': fluted({ fill: ['#a85204', '#e09a28'], plaque: ['#d4a64e', '#a87a28', '#5a3a10'], collar: 0.1, capMat2: () => glass({ tint: '#e8d8b0', op: 0.5 }), capH: 0.24 }),
    'tomford|Beau de Jour': pb({ fill: ['#1a1008', '#3a2414'], neck: '#2a1a0e', label: '#c9a052', ink: '#fff6e0' }),
    'tomford|Bitter Peach': pb({ fill: ['#c02e06', '#ea6a1e'], neckMat: () => glass({ tint: '#f4a060', op: 0.85 }), label: '#f7d6c0', ink: '#c8401a' }),
    'tomford|Black Orchid': fluted({ orchid: true, solid: ['#050506', '#141416'], flute: 'rgba(255,255,255,0.1)', plaque: ['#cfa24a', '#a07a2a', '#3a2808'], sub: 'BLACK ORCHID', collar: 0.065, capMat2: () => solid({ color: '#0b0b0c', rough: 0.12, coat: 1 }), capH: 0.17, capR: 0.07 }),
    'tomford|Tobacco Oud': pb({ fill: ['#2e2e2e', '#555556'], neck: '#3e3e3f', label: '#5c5c5e', ink: '#ffffff' }),
    'tomford|Rose Prick': pb({ solid: ['#e6a6ba', '#f2c4d2'], rough: 0.3, label: '#0d0d0d', ink: '#ffffff' }),
    'tomford|Ébène Fumé': pb({ fill: ['#8a3a0c', '#c8782a'], neck: '#3a2210', label: '#6e3c1c', ink: '#f2a456' }),
    'tomford|Oud Minérale': pb({ fill: ['#121212', '#262626'], neck: '#1a1a1a', label: '#3c3c3e', ink: '#ffffff' }),
    'tomford|Electric Cherry': pb({ fill: ['#8a0410', '#c8101e'], level: 0.42, empty: '#f8d8dc', neckMat: () => glass({ tint: '#e83a4a', op: 0.85 }), label: '#f8f6f4', ink: '#c8101e' }),
    'tomford|Vanilla Sex': pb({ solid: ['#cdb08a', '#e2cdb0'], rough: 0.3, label: '#d0aa80', ink: '#ffffff' }),
    'tomford|Café Rose': pb({ fill: ['#08080a', '#141416'], neck: '#111113', label: '#6a4c9e', ink: '#e8c46a' }),
    'tomford|Noir de Noir': pb({ fill: ['#0a0806', '#16120e'], neck: '#141210', label: '#d6a640', ink: '#111111' }),
    'tomford|Tom Ford for Men Extreme': fluted({ fill: ['#300e04', '#62280e'], flute: 'rgba(255,190,140,0.1)', plaque: ['#d4a64e', '#a87a28', '#5a3a10'], collar: 0.1, capH: 0.24, foot: 'EXTREME' }),

    /* Maison Francis Kurkdjian — photos 056-063 */
    'mfk|Grand Soir': mk({ fill: ['#a44a06', '#dc8418'], ink: '#f2dca8', cap: 'gold' }),
    'mfk|Oud Satin Mood': mk({ solid: ['#0f151d', '#1c2836'], ink: '#dcc08a', cap: 'gold', draw: oudMood('satin mood') }),
    'mfk|Oud Silk Mood': mk({ solid: ['#111820', '#202c3c'], ink: '#dcc08a', cap: 'gold', draw: oudMood('silk mood') }),
    'mfk|Aqua Universalis': mk({ fill: ['#d6dee2', '#eef2f4'], jop: 0.88, ink: '#7e8082', draw: (P, ink) => { P.text('Aqua', 0.86, 0.4, 0.065, ink, { font: 'serif', align: 'right' }); P.text('Universalis', 0.92, 0.47, 0.065, ink, { font: 'serif', align: 'right' }); } }),
    'mfk|Gentle Fluidity Gold': mk({ fill: ['#e2ded2', '#f4f2ea'], jop: 0.88, ink: '#a8844a', cap: 'gold', draw: (P, ink) => { P.text('gentle', 0.62, 0.36, 0.06, ink, { font: 'serif', italic: true, align: 'left' }); P.text('Fluidity', 0.6, 0.45, 0.09, ink, { font: 'serif', align: 'left' }); P.line(0.88, 0.3, 0.88, 0.42, ink, 0.004); } }),
    'mfk|Gentle Fluidity Silver': mk({ fill: ['#dce0e4', '#f0f2f4'], jop: 0.88, ink: '#6e7072', cap: 'chrome', draw: (P, ink) => { P.text('Gentle', 0.62, 0.38, 0.08, ink, { font: 'serif', align: 'left' }); P.text('fluidity', 0.66, 0.46, 0.06, ink, { font: 'serif', italic: true, align: 'left' }); } }),
    'mfk|Petit Matin': mk({ fill: ['#e2d278', '#f2eab0'], jop: 0.9, ink: '#8a7e50', draw: (P, ink) => { P.text('Petit Matin', 0.92, 0.37, 0.07, ink, { font: 'serif', align: 'right' }); } }),
    'mfk|Amyris Homme': mk({ fill: ['#dfe2a8', '#eff0cc'], jop: 0.9, ink: '#86856e', draw: (P) => { P.text('Amyris', 0.92, 0.42, 0.085, '#d8742a', { font: 'serif', align: 'right' }); P.text('homme', 0.86, 0.5, 0.06, '#d8742a', { font: 'serif', align: 'right' }); } }),

    /* Clive Christian — photos 064-071 */
    'clive|No.1 Masculine': cc({ gold: true, art: legacyArt(['No1', 0.66, 0.07], [['CREATED USING THE RAREST AND', 0.56, 0.022], ['MOST EXPENSIVE INGREDIENTS', 0.6, 0.022], ['THE WORLDS MOST', 0.75, 0.026], ['EXPENSIVE PERFUME', 0.79, 0.026], ['CLIVE CHRISTIAN LONDON ENGLAND', 0.9, 0.02]], 'rgba(80,50,10,0.75)') }),
    'clive|1872 Masculine': cc({ fill: ['#022a12', '#0a5428'], art: legacyArt(['1872', 0.6, 0.05], [['MADE IN ENGLAND USING THE', 0.67, 0.022], ['NATURAL INGREDIENTS AS', 0.71, 0.022], ['ORIGINALLY CREATED IN 1872', 0.75, 0.022], ['CLIVE CHRISTIAN', 0.9, 0.032]], '#e0c27a'), foil: true }),
    'clive|C Masculine': cc({ fill: ['#341204', '#62280c'], art: legacyArt(['"C"', 0.62, 0.06], [['PERFUME CREATION', 0.72, 0.026], ['CLIVE CHRISTIAN', 0.77, 0.026], ['LONDON ENGLAND', 0.82, 0.026]], '#e0b862'), foil: true }),
    'clive|V Masculine': cc({ fill: ['#2e1004', '#5a260a'], art: (P) => {
      P.text('V', 0.5, 0.33, 0.34, '#e2bc66', { font: 'roman', weight: 500, shadow: 'rgba(0,0,0,0.4)' });
      ccText(P, [['"V"', 0.68, 0.035], ['PRIVATE COLLECTION', 0.73, 0.026], ['CLIVE CHRISTIAN', 0.84, 0.026], ['LONDON ENGLAND', 0.88, 0.022]], '#e2bc66');
    }, foil: true }),
    'clive|Jump Up and Kiss Me Hedonistic': cc({ fill: ['#08187a', '#1a38b0'], crown: 'silver', art: (P) => {
      const ink = 'rgba(240,244,255,0.85)';
      P.path([[0.3, 0.42], [0.36, 0.3], [0.48, 0.22], [0.6, 0.26], [0.62, 0.36], [0.54, 0.42], [0.46, 0.38], [0.5, 0.3], [0.66, 0.24], [0.72, 0.32], [0.68, 0.46], [0.56, 0.54]], ink, false, 0.006);
      P.path([[0.36, 0.5], [0.44, 0.46], [0.52, 0.5], [0.44, 0.54], [0.36, 0.5]], ink, false, 0.005);
      P.text('Jump up and Kiss Me', 0.5, 0.64, 0.035, ink, { font: 'serif', italic: true });
      ccText(P, [['CLIVE CHRISTIAN', 0.79, 0.04, { font: 'helv', track: 0.08 }], ['ADDICTIVE ARTS', 0.85, 0.025, { font: 'helv' }], ['HEDONISTIC', 0.93, 0.022, { font: 'helv' }]], ink);
    } }),
    'clive|Matsukita': cc({ fill: ['#9a0006', '#da1010'], art: crownArt('MATSUKITA') }),
    'clive|Town & Country': cc({ fill: ['#90040a', '#cc1414'], art: crownArt('TOWN & COUNTRY') }),
    'clive|No.1 Imperial Majesty': cc({ fill: ['#c8a040', '#e8cc80'], clearTop: true, diamond: true, art: legacyArt(['No1', 0.66, 0.07], [['IMPERIAL MAJESTY', 0.75, 0.03], ['CLIVE CHRISTIAN LONDON ENGLAND', 0.9, 0.02]], '#b8902e'), foil: true }),

    /* Creed — photo 072 */
    'creed|Absolu Aventus': (item) => B.creed(item, { lower: 'black', upper: '#0e0e0f', ink: '#2c2c2e', labelBg: 'none', horse: true, title: 'ABSOLU AVENTUS', titleInk: '#f2f2f4', collar: 'gunmetal', cap: '#0c0c0d' }),
  });
})();
