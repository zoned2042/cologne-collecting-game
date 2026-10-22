/* Sillage — Jean Paul Gaultier torsos, sculpted from reference photos.
 * The torso is a parametric mesh: a boxy superellipse cross-section whose width and
 * depth follow the real silhouette (hips, waist, chest, cut-off arms, flat shoulders),
 * with pecs, abs, the centre line, shoulder blades and spine pushed out of the surface.
 * Le Male's line is frosted glass with the sailor stripes; Le Beau's is clear glass
 * with the juice inside, a thick clear base and the gold leaf on the hip.
 */
(() => {
  const B = BottleCraft.tools;
  const { kit, cyl, sphere, lathe, glass, solid, fin } = B;
  const T = () => B.T;
  const C = (h) => B.C(h);

  // Silhouette: [height, half-width, half-depth] up the body (shoulders are flat at 0.72).
  const LE_MALE = [[0, 0.19, 0.12], [0.05, 0.2, 0.125], [0.14, 0.206, 0.13], [0.28, 0.182, 0.118], [0.42, 0.166, 0.112], [0.54, 0.178, 0.122], [0.62, 0.2, 0.14], [0.655, 0.236, 0.146], [0.7, 0.246, 0.142], [0.722, 0.24, 0.13], [0.738, 0.205, 0.11], [0.752, 0.14, 0.085], [0.762, 0.09, 0.07], [0.77, 0.075, 0.065]];
  const LE_BEAU = [[0, 0.165, 0.11], [0.1, 0.168, 0.112], [0.115, 0.188, 0.122], [0.2, 0.196, 0.126], [0.32, 0.17, 0.112], [0.44, 0.158, 0.11], [0.55, 0.176, 0.124], [0.63, 0.205, 0.142], [0.655, 0.25, 0.146], [0.7, 0.256, 0.14], [0.722, 0.246, 0.126], [0.74, 0.2, 0.104], [0.755, 0.13, 0.08], [0.766, 0.085, 0.068], [0.775, 0.072, 0.064]];
  const lerpProf = (P, y) => {
    if (y <= P[0][0]) return P[0];
    for (let i = 1; i < P.length; i++) if (y <= P[i][0]) { const a = P[i - 1], b = P[i], t = (y - a[0]) / (b[0] - a[0]), s = t * t * (3 - 2 * t); return [y, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s]; }
    return P[P.length - 1];
  };
  const g2 = (x, y, cx, cy, sx, sy) => Math.exp(-(((x - cx) / sx) ** 2) - (((y - cy) / sy) ** 2));

  // Muscles, as an outward push in z on the front (f > 0) or the back (f < 0).
  function anatomy(x, y, front, o) {
    const a = o.sculpt || 1;
    if (front) {
      let d = 0;
      d += 0.03 * (g2(x, y, -0.1, 0.6, 0.075, 0.06) + g2(x, y, 0.1, 0.6, 0.075, 0.06));      // pecs
      d -= 0.012 * g2(x, y, -0.1, 0.545, 0.07, 0.012) + 0.012 * g2(x, y, 0.1, 0.545, 0.07, 0.012); // pec underline
      for (const r of [0.3, 0.38, 0.46]) for (const s of [-1, 1]) d += 0.013 * g2(x, y, s * 0.045, r, 0.032, 0.03); // abs
      if (y > 0.24 && y < 0.66) d -= 0.014 * Math.exp(-((x / 0.012) ** 2));                   // centre line
      d -= 0.008 * g2(x, y, 0, 0.235, 0.012, 0.012);                                            // navel
      for (const s of [-1, 1]) d -= 0.012 * g2(x - s * (0.12 - (0.2 - y) * 0.3), y, 0, 0.14, 0.012, 0.06); // groin lines
      d += (o.bulge || 0.022) * g2(x, y, 0, 0.07, 0.05, 0.05);                                  // pelvis
      d += 0.012 * (g2(x, y, -0.09, 0.69, 0.06, 0.014) + g2(x, y, 0.09, 0.69, 0.06, 0.014));    // collarbones
      return d * a;
    }
    let d = 0.022 * (g2(x, y, -0.1, 0.6, 0.07, 0.07) + g2(x, y, 0.1, 0.6, 0.07, 0.07));      // shoulder blades
    if (y > 0.2 && y < 0.7) d -= 0.012 * Math.exp(-((x / 0.014) ** 2));                      // spine
    d += 0.03 * (g2(x, y, -0.08, 0.06, 0.07, 0.06) + g2(x, y, 0.08, 0.06, 0.07, 0.06));       // seat
    return d * a;
  }

  // The torso mesh; uv.y runs bottom to top so stripes can be painted by height.
  function torsoGeo(PROF, o = {}, scale = 1) {
    const t = T(), NU = 72, NV = 90, top = PROF[PROF.length - 1][0], n = o.boxy || 3;
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= NV; j++) {
      const y = (j / NV) * top, [, hw, hd] = lerpProf(PROF, y);
      for (let i = 0; i <= NU; i++) {
        const th = (i / NU) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
        const k = Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), -1 / n);
        let x = hw * c * k, z = hd * s * k;
        const face = Math.pow(Math.max(0, Math.abs(s) * k), 2);
        z += Math.sign(z) * anatomy(x, y, z > 0, o) * face * (y < top - 0.05 ? 1 : 0);
        pos.push(x * scale, y * (scale === 1 ? 1 : 1) + (scale === 1 ? 0 : 0), z * scale); uv.push(i / NU, y / top);
      }
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + NU + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new t.BufferGeometry();
    g.setAttribute('position', new t.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new t.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    // Close the bottom.
    return g;
  }
  function gradientY(g, bottom, top, curve = 1) {
    const t = T(), p = g.attributes.position, a = C(bottom), b = C(top), c = new t.Color(); let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < p.count; i++) { lo = Math.min(lo, p.getY(i)); hi = Math.max(hi, p.getY(i)); }
    const col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { c.copy(a).lerp(b, Math.pow((p.getY(i) - lo) / (hi - lo), curve)); col.set([c.r, c.g, c.b], i * 3); }
    g.setAttribute('color', new t.BufferAttribute(col, 3)); return g;
  }
  // Sailor stripes painted by height (v from the bottom), as a transparent overlay.
  function stripes(color, v0, v1, n, fill = 0.5, ribs) {
    const t = T(), c = document.createElement('canvas'); c.width = 16; c.height = 1024; const g = c.getContext('2d');
    if (ribs) { g.fillStyle = ribs; for (let y = 0; y < 1024; y += 6) g.fillRect(0, y, 16, 2); }
    g.fillStyle = color; const step = (v1 - v0) / n;
    for (let i = 0; i < n; i++) { const vb = v0 + i * step, vt = vb + step * fill; g.fillRect(0, (1 - vt) * 1024, 16, (vt - vb) * 1024); }
    const tex = new t.CanvasTexture(c); tex.encoding = t.sRGBEncoding; return tex;
  }

  function ribCap(k, y0, mat, o = {}) {
    k.part(cyl(0.06, 0.066, 0.03, y0, 40), mat);
    for (let i = 0; i < (o.ribs || 5); i++) k.part(new (T().TorusGeometry)(0.062, 0.007, 8, 40).rotateX(Math.PI / 2).translate(0, y0 + 0.04 + i * 0.016, 0), mat);
    k.part(cyl(0.058, 0.058, 0.09, y0 + 0.03, 40), mat);
    k.part(cyl(0.045, 0.05, 0.04, y0 + 0.12, 32), mat);
    k.part(cyl(0.01, 0.01, 0.02, y0 + 0.14, 10, 0, 0.04), solid({ color: '#1a1a1a' }));
  }

  /* Le Male line: frosted (or lacquered) torso with stripes. */
  const leMale = (o) => () => {
    const k = kit(), t = T();
    const geo = gradientY(torsoGeo(LE_MALE, o), o.bottom, o.top, o.gc || 1);
    k.solidBody(geo, solid({ grad: true, rough: o.rough != null ? o.rough : 0.38, coat: o.coat != null ? o.coat : 0.55, metal: o.metal || 0, env: o.env || 1.2 }));
    const over = torsoGeo(LE_MALE, o); over.scale(1.004, 1, 1.006);
    k.part(over, new t.MeshStandardMaterial({ map: stripes(o.stripe, o.s0 || 0.42, o.s1 || 0.98, o.n || 8, o.fill || 0.46, o.ribs), transparent: true, depthWrite: false, roughness: o.stripeRough || 0.3, metalness: o.metal ? 0.6 : 0 }), 4);
    k.part(cyl(0.19, 0.19, 0.004, 0.001, 48).scale(1, 1, 0.63), solid({ color: o.bottom, rough: 0.4 }));
    if (o.ring) k.part(new t.TorusGeometry(0.085, 0.012, 12, 48).translate(0, 0.84, 0.06), fin(o.capFin));
    ribCap(k, 0.77, fin(o.capFin || 'chrome'));
    k.top(0.77);
    return k.done();
  };

  /* Le Beau line: clear torso, juice inside, thick clear base, gold leaf. */
  function leaf(k, x, y, z, s) {
    const t = T(), sh = new t.Shape();
    const L = [[0, -1], [0.12, -0.35], [0.55, -0.6], [0.4, -0.2], [0.95, 0.05], [0.42, 0.18], [0.55, 0.75], [0.12, 0.42], [0, 1], [-0.12, 0.42], [-0.55, 0.75], [-0.42, 0.18], [-0.95, 0.05], [-0.4, -0.2], [-0.55, -0.6], [-0.12, -0.35]];
    L.forEach(([a, b], i) => (i ? sh.lineTo(a * s, b * s) : sh.moveTo(a * s, b * s)));
    const g = new t.ExtrudeGeometry(sh, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.004, bevelSegments: 2 });
    g.rotateZ(-0.5); g.translate(x, y, z); k.part(g, solid({ color: '#e2c27a', metal: 1, rough: 0.22, coat: 0, env: 2.6 }));
    k.part(cyl(0.004, 0.004, s * 0.9, y - s * 1.4, 6, x + s * 0.5, z + 0.006).rotateZ(0), solid({ color: '#d8b870', metal: 1, rough: 0.3, coat: 0 }));
  }
  const leBeau = (o) => () => {
    const k = kit(), t = T();
    k.glassBody(torsoGeo(LE_BEAU, Object.assign({ sculpt: 1.5, bulge: 0.012, boxy: 3.6 }, o)), glass({ tint: o.glass || '#e8f4f2', op: o.glassOp || 0.2, env: 3, rough: 0.02 }), null);
    // Juice: same sculpt, shaded so the muscles read, lifted above the clear base.
    const jp = LE_BEAU.filter((p) => p[0] >= 0.1).map(([y, w, d]) => [y, w * 0.94, d * 0.9]);
    const jg = gradientY(torsoGeo(jp, Object.assign({ sculpt: 1.3, bulge: 0, boxy: 3.6 }, o)), o.bottom, o.top, o.gc || 1);
    jg.scale(1, 0.94, 1); jg.translate(0, 0.012, 0);
    k.part(jg, new t.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0, envMapIntensity: 0.6, emissive: C(o.glow || o.bottom), emissiveIntensity: o.gi != null ? o.gi : 0.3, transparent: true, opacity: 0.93 }), 1);
    k.part(cyl(0.16, 0.162, 0.1, 0, 48).scale(1, 1, 0.66), glass({ tint: '#f0f8f6', op: 0.35, env: 3 }), 2);
    leaf(k, 0.03, 0.115, 0.115, 0.09);
    ribCap(k, 0.775, fin('gold'), { ribs: 3 });
    k.top(0.775);
    return k.done();
  };

  // The torso is also offered in the Your House bottle designer.
  Object.assign(BottleCraft.tools, { torsoGeo, TORSO_MALE: LE_MALE, TORSO_BEAU: LE_BEAU });

  BottleCraft.add({
    'jpg|Le Male': leMale({ bottom: '#09565f', top: '#5aaab6', gc: 1.8, s0: 0.5, s1: 0.93, n: 7, stripe: 'rgba(250,252,252,0.95)', capFin: 'chrome' }),
    'jpg|Ultra Male': leMale({ bottom: '#0b1a40', top: '#1a3068', gc: 1.2, s0: 0.48, s1: 0.93, n: 7, stripe: 'rgba(6,8,16,0.92)', capFin: 'chrome' }),
    'jpg|Le Male Elixir': leMale({ bottom: '#9a5a1c', top: '#e0a850', metal: 0.85, rough: 0.28, env: 2, stripe: 'rgba(60,30,10,0.85)', ribs: 'rgba(90,50,15,0.35)', capFin: 'gold', ring: true }),
    'jpg|Le Male Le Parfum': leMale({ bottom: '#0b0b0e', top: '#1c1d22', rough: 0.2, coat: 0.9, stripe: 'rgba(0,0,0,0.9)', stripeRough: 0.7, capFin: 'gold' }),
    'jpg|Le Beau': leBeau({ bottom: '#053638', top: '#0c5856', glow: '#073e3e', gi: 0.12 }),
    'jpg|Le Beau Le Parfum': leBeau({ bottom: '#0a4c4a', top: '#020203', gc: 0.5, glow: '#000000', gi: 0, glass: '#1a2222', glassOp: 0.32 }),
  });
})();
