/* Sillage — 3D showroom. A rotunda of lit shelves around a spotlit pedestal.
 * Bottles are built procedurally per house archetype (see HOUSES[].shape).
 */
const Showroom = (() => {
  const ROWS = 6, ROW_Y0 = 0.34, ROW_GAP = 0.56, COL_GAP = 0.44;
  const SHELF_SCALE = 0.36, HERO_SCALE = 0.72, HERO_Y = 1.0;
  let T = window.THREE || null, renderer, scene, camera, host, canvas;
  let active = false, raf = 0, last = 0, ok = false;
  let R = 5.4, builtR = 0;
  let room, bottleGroup, signGroup, heroHalo, dust, mist, pointLight;
  let records = [], byId = {}, pickables = [];
  let hero = null, hovered = null;
  const tweens = [];
  const orbit = { yaw: 0, pitch: 0.1, dist: 3.6, tx: 0, ty: 1.25, tz: 0 };
  const cur = { yaw: 0, pitch: 0.1, dist: 3.6, tx: 0, ty: 1.25, tz: 0 };
  let lastInput = 0, tour = null, cb = {};
  const shapeCache = {}, matCache = {}, labelCache = {};
  // Box and label textures are drawn on canvas, so wait for the web fonts before drawing.
  const fontsReady = (document.fonts && document.fonts.load) ? Promise.all([document.fonts.load('600 64px "Bodoni Moda"'), document.fonts.load('italic 500 52px "Bodoni Moda"'), document.fonts.load('500 22px Jost')]).catch(() => {}) : Promise.resolve();

  /* ---------- helpers ---------- */
  // r128 treats hex colours as linear; convert so sRGB output shows the intended colour.
  const col = (hex) => new T.Color(hex).convertSRGBToLinear();
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  function tween(dur, fn, done) { tweens.push({ t: 0, dur, fn, done }); }

  function radialTexture(stops) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(([o, col]) => gr.addColorStop(o, col));
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new T.CanvasTexture(c); return t;
  }

  function rrShape(w, d, r) {
    const s = new T.Shape(); const x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function box(w, d, h, r, y0 = 0) {
    const b = Math.min(r * 0.6, 0.03);
    const g = new T.ExtrudeGeometry(rrShape(w - 2 * b, d - 2 * b, Math.max(0.006, r - b)), {
      depth: h - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 6,
    });
    g.rotateX(-Math.PI / 2); g.translate(0, y0 + b, 0); return g;
  }
  function cyl(rt, rb, h, seg, y0 = 0, x = 0) { const g = new T.CylinderGeometry(rt, rb, h, seg); g.translate(x, y0 + h / 2, 0); return g; }
  function lathe(pts, y0 = 0) { const g = new T.LatheGeometry(pts.map(([r, y]) => new T.Vector2(r, y)), 44); g.translate(0, y0, 0); return g; }
  function sphere(r, cy, sx = 1, sy = 1, sz = 1) { const g = new T.SphereGeometry(r, 40, 28); g.scale(sx, sy, sz); g.translate(0, cy, 0); return g; }
  function extrudeFlat(shape, depth, y0 = 0) {
    const g = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2, curveSegments: 8 });
    g.translate(0, y0, -depth / 2); return g;
  }

  /* ---------- bottle archetypes ----------
   * body: glass geometry (bottom at y=0). parts: [geometry, material role].
   * label: where the house label goes. top: nozzle height for the spray.
   */
  const SHAPES = {
    cyl: () => ({ body: cyl(0.3, 0.3, 0.78, 48), parts: [[cyl(0.07, 0.07, 0.06, 24, 0.78), 'metal'], [cyl(0.21, 0.21, 0.34, 40, 0.84), 'cap']], label: { kind: 'curved', r: 0.305, h: 0.22, y: 0.42, arc: 1.5 }, top: 0.84 }),
    tall: () => ({ body: box(0.5, 0.32, 0.9, 0.06), parts: [[cyl(0.08, 0.08, 0.06, 24, 0.9), 'metal'], [cyl(0.13, 0.13, 0.28, 40, 0.96), 'cap']], label: { kind: 'flat', w: 0.4, h: 0.22, y: 0.5, z: 0.162 }, top: 0.96 }),
    flask: () => ({ body: box(0.72, 0.26, 0.68, 0.09), parts: [[cyl(0.07, 0.07, 0.05, 24, 0.68), 'metal'], [box(0.3, 0.22, 0.22, 0.03, 0.73), 'cap']], label: { kind: 'flat', w: 0.5, h: 0.2, y: 0.36, z: 0.132 }, top: 0.73 }),
    square: () => ({ body: box(0.62, 0.62, 0.6, 0.05), parts: [[cyl(0.08, 0.08, 0.05, 24, 0.6), 'metal'], [box(0.36, 0.36, 0.3, 0.03, 0.65), 'cap']], label: { kind: 'flat', w: 0.46, h: 0.22, y: 0.3, z: 0.312 }, top: 0.65 }),
    pdm: () => {
      const emblem = new T.CylinderGeometry(0.11, 0.11, 0.025, 36); emblem.rotateX(Math.PI / 2); emblem.translate(0, 0.58, 0.15);
      return { body: box(0.6, 0.28, 0.82, 0.04), parts: [[cyl(0.07, 0.07, 0.05, 24, 0.82), 'metal'], [cyl(0.17, 0.17, 0.24, 40, 0.87), 'cap'], [emblem, 'metal']], label: { kind: 'flat', w: 0.44, h: 0.14, y: 0.27, z: 0.142 }, top: 0.87 };
    },
    lv: () => ({ body: box(0.64, 0.4, 0.56, 0.14), parts: [[cyl(0.07, 0.07, 0.05, 24, 0.56), 'metal'], [box(0.34, 0.22, 0.2, 0.06, 0.61), 'cap']], label: { kind: 'flat', w: 0.4, h: 0.16, y: 0.28, z: 0.202 }, top: 0.61 }),
    arab: () => ({
      body: lathe([[0, 0], [0.3, 0], [0.37, 0.07], [0.4, 0.28], [0.35, 0.48], [0.18, 0.6], [0.08, 0.65], [0.07, 0.68], [0, 0.68]]),
      parts: [[lathe([[0, 0], [0.12, 0], [0.16, 0.06], [0.1, 0.18], [0.15, 0.3], [0.07, 0.46], [0.02, 0.58], [0, 0.62]], 0.68), 'cap']],
      label: { kind: 'curved', r: 0.404, h: 0.14, y: 0.29, arc: 1.1 }, top: 0.68,
    }),
    orb: () => ({ body: sphere(0.38, 0.38), parts: [[cyl(0.07, 0.09, 0.1, 24, 0.74), 'metal'], [cyl(0.14, 0.14, 0.22, 40, 0.82), 'cap']], label: { kind: 'curved', r: 0.388, h: 0.12, y: 0.38, arc: 1.0 }, top: 0.82 }),
    crown: () => {
      const parts = [[cyl(0.08, 0.08, 0.05, 24, 0.78), 'metal'], [cyl(0.15, 0.13, 0.13, 40, 0.83), 'cap']];
      const ring = new T.TorusGeometry(0.15, 0.022, 10, 40); ring.rotateX(Math.PI / 2); ring.translate(0, 0.96, 0); parts.push([ring, 'cap']);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const s = new T.SphereGeometry(0.03, 12, 10); s.translate(Math.sin(a) * 0.14, 1.0, Math.cos(a) * 0.14); parts.push([s, 'cap']); }
      const top = new T.SphereGeometry(0.05, 16, 12); top.translate(0, 1.02, 0); parts.push([top, 'cap']);
      return { body: lathe([[0, 0], [0.26, 0], [0.28, 0.04], [0.28, 0.62], [0.2, 0.74], [0.08, 0.78], [0, 0.78]]), parts, label: { kind: 'curved', r: 0.284, h: 0.22, y: 0.34, arc: 1.4 }, top: 0.83 };
    },
    faceted: () => {
      const b = new T.CylinderGeometry(0.32, 0.36, 0.72, 8); b.rotateY(Math.PI / 8); b.translate(0, 0.36, 0);
      const c = new T.IcosahedronGeometry(0.19, 0); c.translate(0, 0.95, 0);
      return { body: b, flat: true, parts: [[cyl(0.07, 0.07, 0.05, 16, 0.72), 'metal'], [c, 'cap']], label: { kind: 'flat', w: 0.28, h: 0.16, y: 0.36, z: 0.318 }, top: 0.76 };
    },
    hex: () => {
      const b = new T.CylinderGeometry(0.33, 0.33, 0.7, 6); b.rotateY(Math.PI / 6); b.translate(0, 0.35, 0);
      const c = new T.CylinderGeometry(0.2, 0.2, 0.24, 6); c.rotateY(Math.PI / 6); c.translate(0, 0.87, 0);
      return { body: b, flat: true, parts: [[cyl(0.07, 0.07, 0.05, 16, 0.7), 'metal'], [c, 'cap']], label: { kind: 'flat', w: 0.3, h: 0.18, y: 0.35, z: 0.288 }, top: 0.75 };
    },
    apoth: () => ({ body: box(0.48, 0.48, 0.66, 0.03), parts: [[cyl(0.07, 0.07, 0.05, 24, 0.66), 'metal'], [cyl(0.13, 0.13, 0.18, 32, 0.71), 'cap']], label: { kind: 'flat', w: 0.38, h: 0.3, y: 0.33, z: 0.242 }, top: 0.71 }),
    studs: () => {
      const parts = [[cyl(0.07, 0.07, 0.05, 24, 0.78), 'metal'], [box(0.26, 0.2, 0.22, 0.02, 0.83), 'cap']];
      for (let i = 0; i < 5; i++) for (const y of [0.1, 0.68]) {
        const s = new T.ConeGeometry(0.026, 0.045, 4); s.rotateX(Math.PI / 2); s.rotateZ(Math.PI / 4); s.translate(-0.2 + i * 0.1, y, 0.19); parts.push([s, 'metal']);
      }
      return { body: box(0.56, 0.34, 0.78, 0.03), parts, label: { kind: 'flat', w: 0.4, h: 0.18, y: 0.4, z: 0.172 }, top: 0.83 };
    },
    ingot: () => {
      const b = new T.CylinderGeometry(0.28, 0.38, 0.5, 4, 1); b.rotateY(Math.PI / 4); b.scale(1, 1, 0.55); b.translate(0, 0.25, 0);
      return { body: b, opaque: true, flat: true, parts: [[cyl(0.07, 0.07, 0.12, 24, 0.5), 'black']], label: null, top: 0.6 };
    },
    torso: () => {
      const b = lathe([[0, 0], [0.18, 0], [0.23, 0.08], [0.2, 0.3], [0.3, 0.52], [0.33, 0.64], [0.24, 0.74], [0.1, 0.8], [0, 0.8]]); b.scale(1, 1, 0.68);
      return { body: b, parts: [[cyl(0.07, 0.07, 0.06, 24, 0.8), 'metal'], [cyl(0.09, 0.09, 0.14, 32, 0.86), 'cap']], label: null, top: 0.86 };
    },
    grenade: () => {
      const parts = [[cyl(0.09, 0.09, 0.14, 24, 0.68), 'cap']];
      for (const [y, r] of [[0.2, 0.33], [0.46, 0.32]]) { const t = new T.TorusGeometry(r, 0.016, 8, 48); t.rotateX(Math.PI / 2); t.translate(0, y, 0); parts.push([t, 'black']); }
      const pin = new T.TorusGeometry(0.06, 0.012, 8, 24); pin.translate(0.13, 0.76, 0); parts.push([pin, 'metal']);
      return { body: lathe([[0, 0], [0.22, 0], [0.32, 0.12], [0.34, 0.34], [0.28, 0.56], [0.14, 0.66], [0, 0.68]]), parts, label: null, top: 0.76 };
    },
    oval: () => ({ body: sphere(1, 0.42, 0.42, 0.42, 0.17), parts: [[cyl(0.06, 0.06, 0.06, 24, 0.82), 'metal'], [cyl(0.1, 0.1, 0.26, 32, 0.87), 'cap']], label: { kind: 'flat', w: 0.34, h: 0.2, y: 0.42, z: 0.174 }, top: 0.87 }),
    disc: () => {
      const b = new T.CylinderGeometry(0.36, 0.36, 0.2, 48); b.rotateX(Math.PI / 2); b.translate(0, 0.38, 0);
      return { body: b, parts: [[cyl(0.06, 0.06, 0.06, 24, 0.73), 'metal'], [cyl(0.12, 0.12, 0.2, 32, 0.78), 'cap']], label: { kind: 'flat', w: 0.34, h: 0.14, y: 0.38, z: 0.102 }, top: 0.78 };
    },
    star: () => {
      const s = new T.Shape();
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const r = i % 2 ? 0.19 : 0.42; const x = Math.sin(a) * r, y = Math.cos(a) * r + 0.42; i ? s.lineTo(x, y) : s.moveTo(x, y); }
      return { body: extrudeFlat(s, 0.18), parts: [[cyl(0.05, 0.05, 0.05, 24, 0.84), 'metal'], [cyl(0.11, 0.11, 0.18, 32, 0.88), 'cap']], label: { kind: 'flat', w: 0.22, h: 0.11, y: 0.4, z: 0.108 }, top: 0.88 };
    },
    bolt: () => {
      const s = new T.Shape(); const p = [[-0.05, 0.82], [0.22, 0.82], [0.06, 0.5], [0.24, 0.5], [-0.18, 0.0], [-0.04, 0.36], [-0.22, 0.36]];
      p.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
      return { body: extrudeFlat(s, 0.16), parts: [[cyl(0.08, 0.08, 0.16, 32, 0.84, 0.085), 'cap']], label: null, top: 0.84 };
    },
    apple: () => ({ body: sphere(0.36, 0.34, 1, 0.92, 1), parts: [[cyl(0.03, 0.02, 0.14, 12, 0.64), 'cap'], [sphere(0.06, 0.76), 'cap']], label: null, top: 0.66 }),
  };

  function getShape(key) {
    if (!shapeCache[key]) {
      const s = (SHAPES[key] || SHAPES.tall)();
      const liq = s.body.clone(); liq.scale(0.86, 0.8, 0.86); liq.translate(0, 0.035, 0);
      s.liquid = liq;
      if (s.label) {
        s.labelGeo = s.label.kind === 'curved'
          ? new T.CylinderGeometry(s.label.r, s.label.r, s.label.h, 24, 1, true, -s.label.arc / 2, s.label.arc).translate(0, s.label.y, 0)
          : new T.PlaneGeometry(s.label.w, s.label.h).translate(0, s.label.y, s.label.z);
      }
      shapeCache[key] = s;
    }
    return shapeCache[key];
  }

  function mat(key, make) { if (!matCache[key]) matCache[key] = make(); return matCache[key]; }

  const CAPS = {
    gold: () => new T.MeshStandardMaterial({ color: col('#d8ae54'), metalness: 1, roughness: 0.22 }),
    silver: () => new T.MeshStandardMaterial({ color: col('#d9dde2'), metalness: 1, roughness: 0.18 }),
    black: () => new T.MeshStandardMaterial({ color: col('#0d0d0f'), metalness: 0.4, roughness: 0.28 }),
    white: () => new T.MeshStandardMaterial({ color: col('#f1efe9'), metalness: 0, roughness: 0.4 }),
    wood: () => new T.MeshStandardMaterial({ color: col('#5b3a22'), metalness: 0, roughness: 0.55 }),
    blue: () => new T.MeshStandardMaterial({ color: col('#1f5aa6'), metalness: 0.5, roughness: 0.25 }),
    animal: () => new T.MeshStandardMaterial({ color: col('#c9a050'), metalness: 1, roughness: 0.35 }),
    crystal: () => new T.MeshPhysicalMaterial({ color: col('#ffffff'), metalness: 0, roughness: 0.02, transparent: true, opacity: 0.45, clearcoat: 1, envMapIntensity: 3, flatShading: true }),
  };
  function capMat(name) { return mat('cap-' + name, CAPS[name] || CAPS.black); }
  function glassMat(flat) {
    return mat('glass' + (flat ? 'F' : ''), () => new T.MeshPhysicalMaterial({
      color: col('#ffffff'), metalness: 0, roughness: 0.04, transparent: true, opacity: 0.17, clearcoat: 1, clearcoatRoughness: 0.03,
      envMapIntensity: 2.4, depthWrite: false, flatShading: !!flat,
    }));
  }
  // Coloured glass for iconic bottles; darker glass is more opaque, like the real thing.
  function tintedGlassMat(tint, dense, flat) {
    return mat('glass-' + tint + dense + (flat ? 'F' : ''), () => new T.MeshPhysicalMaterial({
      color: col(tint), metalness: 0.1, roughness: 0.06, transparent: true, opacity: dense, clearcoat: 1, clearcoatRoughness: 0.03,
      envMapIntensity: 2.2, depthWrite: false, flatShading: !!flat,
    }));
  }
  function liquidMat(family, flat, juice) {
    return mat('liq-' + (juice || family) + (flat ? 'F' : ''), () => {
      const c = col(juice || FAMILIES[family].color);
      return new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.3, roughness: 0.18, metalness: 0, transparent: true, opacity: 0.94, flatShading: !!flat });
    });
  }

  function labelMat(houseId) {
    if (labelCache[houseId]) return labelCache[houseId];
    const h = HOUSE_BY_ID[houseId];
    const c = document.createElement('canvas'); c.width = 512; c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = h.lbg; g.fillRect(0, 0, 512, 256);
    g.strokeStyle = h.lfg; g.globalAlpha = 0.6; g.lineWidth = 3; g.strokeRect(18, 18, 476, 220); g.globalAlpha = 1;
    g.fillStyle = h.lfg; g.textAlign = 'center'; g.textBaseline = 'middle';
    const name = h.name.toUpperCase();
    let size = 64; g.font = `600 ${size}px "Bodoni Moda", Didot, "Bodoni 72", Georgia, serif`;
    while (g.measureText(name).width > 430 && size > 22) { size -= 3; g.font = `600 ${size}px "Bodoni Moda", Didot, Georgia, serif`; }
    g.fillText(name, 256, 112);
    g.font = '500 22px Jost, "Futura", "Century Gothic", sans-serif';
    g.globalAlpha = 0.8; g.fillText(h.origin.toUpperCase(), 256, 184);
    const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding; tex.anisotropy = 4;
    labelCache[houseId] = new T.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0, side: T.DoubleSide });
    return labelCache[houseId];
  }

  function makeBottle(item) {
    // Bottles modelled from their real design come from BottleCraft; the rest use the house archetype.
    const craft = typeof BottleCraft !== 'undefined' && BottleCraft.build(item);
    if (craft) { craft.group.userData = { item, top: craft.top }; return { group: craft.group, pick: craft.pick }; }
    const house = HOUSE_BY_ID[item.house];
    const s = getShape(house.shape);
    const icon = ICONIC[item.key] || {};
    const cap = icon.cap || house.cap;
    const g = new T.Group();
    let body;
    if (s.opaque) {
      body = new T.Mesh(s.body, capMat(cap));
    } else {
      const liquid = new T.Mesh(s.liquid, liquidMat(item.family, s.flat, icon.juice)); liquid.renderOrder = 1; g.add(liquid);
      body = new T.Mesh(s.body, icon.glass ? tintedGlassMat(icon.glass, icon.dense || 0.6, s.flat) : glassMat(s.flat)); body.renderOrder = 2;
    }
    g.add(body);
    for (const [geo, role] of s.parts) {
      const m = role === 'cap' ? capMat(cap) : role === 'black' ? capMat('black') : capMat(cap === 'silver' || cap === 'white' || cap === 'blue' ? 'silver' : 'gold');
      g.add(new T.Mesh(geo, m));
    }
    if (s.labelGeo) g.add(new T.Mesh(s.labelGeo, labelMat(item.house)));
    g.userData = { item, top: s.top };
    return { group: g, pick: body };
  }

  /* ---------- the room ---------- */
  function disposeTree(obj) {
    obj.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && !o.material.userData.shared) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
    });
  }

  function beamMaterial(color, opacity, power) {
    return new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      uniforms: { color: { value: new T.Color(color) }, opacity: { value: opacity }, power: { value: power } },
      vertexShader: 'varying vec2 vUv; varying float vF; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vec3 n=normalize(normalMatrix*normal); vF=abs(dot(n, normalize(-mv.xyz))); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 color; uniform float opacity; uniform float power; varying vec2 vUv; varying float vF; void main(){ float a=pow(vUv.y,power)*opacity*pow(vF,1.2); gl_FragColor=vec4(color,a); }',
    });
  }

  function floorTexture(radius) {
    const S = 1024, c = document.createElement('canvas'); c.width = c.height = S;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    gr.addColorStop(0, '#3a2c20'); gr.addColorStop(0.25, '#1d1611'); gr.addColorStop(1, '#0b0907');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    const px = (r) => (r / radius) * (S / 2);
    g.strokeStyle = '#b8894a';
    for (const [r, w, a] of [[0.95, 3, 0.8], [1.05, 1.2, 0.5], [2.1, 1.5, 0.35], [radius - 0.6, 2, 0.4]]) { g.globalAlpha = a; g.lineWidth = w; g.beginPath(); g.arc(S / 2, S / 2, px(r), 0, Math.PI * 2); g.stroke(); }
    g.globalAlpha = 0.25; g.lineWidth = 1.2;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      g.beginPath(); g.moveTo(S / 2 + Math.cos(a) * px(1.05), S / 2 + Math.sin(a) * px(1.05)); g.lineTo(S / 2 + Math.cos(a) * px(2.1), S / 2 + Math.sin(a) * px(2.1)); g.stroke();
    }
    g.globalAlpha = 1;
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t;
  }

  function wallTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 8;
    const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 256, 0);
    gr.addColorStop(0, '#1c140f'); gr.addColorStop(0.08, '#2a1e16'); gr.addColorStop(0.5, '#1e1611'); gr.addColorStop(0.94, '#2a1e16'); gr.addColorStop(1, '#0d0907');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 8);
    const t = new T.CanvasTexture(c); t.wrapS = T.RepeatWrapping; t.encoding = T.sRGBEncoding; return t;
  }

  function buildRoom() {
    if (room) { scene.remove(room); disposeTree(room); }
    room = new T.Group(); builtR = R;
    const arc = Math.PI * 2 * 0.92, a0 = Math.PI - arc / 2;

    const floor = new T.Mesh(new T.CircleGeometry(R + 0.6, 96), new T.MeshStandardMaterial({ map: floorTexture(R + 0.6), roughness: 0.2, metalness: 0.5, envMapIntensity: 0.45 }));
    floor.rotation.x = -Math.PI / 2; room.add(floor);

    const wtex = wallTexture(); wtex.repeat.set(Math.round((Math.PI * 2 * (R + 0.4)) / 0.9), 1);
    const wall = new T.Mesh(new T.CylinderGeometry(R + 0.4, R + 0.4, 4.8, 160, 1, true), new T.MeshStandardMaterial({ map: wtex, side: T.BackSide, roughness: 0.75, metalness: 0.1 }));
    wall.position.y = 2.4; room.add(wall);

    const ceil = new T.Mesh(new T.CircleGeometry(R + 0.6, 64), new T.MeshStandardMaterial({ color: col('#0a0806'), roughness: 1 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.y = 4.8; room.add(ceil);
    const ring = new T.Mesh(new T.TorusGeometry(R - 0.6, 0.018, 8, 240), new T.MeshBasicMaterial({ color: col('#ffd59a') }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 4.55; room.add(ring);

    const shelfMat = new T.MeshStandardMaterial({ color: col('#2a1f17'), roughness: 0.35, metalness: 0.35, side: T.DoubleSide });
    const ledMat = new T.MeshBasicMaterial({ color: col('#ffcf8f') });
    const washMat = beamMaterial('#ffb766', 0.16, 2.2);
    for (let r = 0; r < ROWS; r++) {
      const y = ROW_Y0 + r * ROW_GAP;
      const ringGeo = new T.RingGeometry(R - 0.24, R + 0.2, 200, 1, a0 - Math.PI / 2, arc);
      ringGeo.rotateX(-Math.PI / 2);
      const plate = new T.Mesh(ringGeo, shelfMat); plate.position.y = y; room.add(plate);
      const edge = new T.Mesh(new T.CylinderGeometry(R - 0.24, R - 0.24, 0.035, 200, 1, true, a0, arc), shelfMat); edge.position.y = y - 0.0175; room.add(edge);
      const led = new T.Mesh(new T.CylinderGeometry(R - 0.235, R - 0.235, 0.008, 200, 1, true, a0, arc), ledMat); led.position.y = y - 0.03; room.add(led);
      const wash = new T.Mesh(new T.CylinderGeometry(R + 0.36, R + 0.36, ROW_GAP * 0.95, 160, 1, true, a0, arc), washMat); wash.position.y = y + ROW_GAP * 0.48; room.add(wash);
    }

    // Pedestal.
    const stone = new T.MeshStandardMaterial({ color: col('#16110e'), roughness: 0.28, metalness: 0.25 });
    const brass = new T.MeshStandardMaterial({ color: col('#b98b45'), roughness: 0.25, metalness: 1 });
    const base = new T.Mesh(cyl(0.72, 0.78, 0.12, 64), stone); room.add(base);
    const column = new T.Mesh(cyl(0.46, 0.5, 0.82, 64, 0.12), stone); room.add(column);
    const plate = new T.Mesh(cyl(0.54, 0.54, 0.06, 64, 0.94), new T.MeshStandardMaterial({ color: col('#2b2116'), roughness: 0.2, metalness: 0.9 })); room.add(plate);
    for (const [y, r] of [[0.13, 0.5], [0.94, 0.47], [1.0, 0.54]]) { const t = new T.Mesh(new T.TorusGeometry(r, 0.012, 8, 96), brass); t.rotation.x = Math.PI / 2; t.position.y = y; room.add(t); }

    const beam = new T.Mesh(new T.CylinderGeometry(0.1, 0.95, 3.6, 64, 1, true), beamMaterial('#ffe2b0', 0.2, 1.6));
    beam.position.y = 1.0 + 1.8; room.add(beam);
    const pool = new T.Mesh(new T.PlaneGeometry(3.2, 3.2), new T.MeshBasicMaterial({ map: radialTexture([[0, 'rgba(255,214,160,0.35)'], [0.5, 'rgba(255,190,120,0.08)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.005; room.add(pool);

    scene.add(room);
  }

  function buildEnvironment(r = renderer) {
    const env = new T.Scene();
    const shell = new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: col('#2a221c'), side: T.BackSide }));
    env.add(shell);
    const panel = (w, h, col, k, x, y, z, ry = 0, rx = 0) => {
      const m = new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k), side: T.DoubleSide });
      const p = new T.Mesh(new T.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx, ry, 0); env.add(p);
    };
    panel(8, 3, '#fff1dc', 3.2, 0, 9, 0, 0, Math.PI / 2);
    panel(3, 8, '#ffe9cc', 1.8, -6, 2, 7, Math.PI * 0.75);
    panel(1.2, 12, '#ffd2a0', 2.6, -9, 1, -3, Math.PI / 2);
    panel(1.2, 12, '#ffd2a0', 2.6, 9, 1, 3, -Math.PI / 2);
    panel(10, 0.8, '#ffe0c0', 1.2, 0, 3, -9.5);
    panel(10, 0.8, '#ffb07a', 1.2, 0, -2, 9.5, Math.PI);
    const pm = new T.PMREMGenerator(r);
    const tex = pm.fromScene(env, 0.035).texture;
    pm.dispose();
    return tex;
  }

  /* Atomizer mist: a particle pool with per-particle alpha and size. Shared with the unboxing scene. */
  function createMist(M = 520) {
    const mp = new Float32Array(M * 3), ma = new Float32Array(M), ms = new Float32Array(M);
    const mg = new T.BufferGeometry();
    mg.setAttribute('position', new T.BufferAttribute(mp, 3));
    mg.setAttribute('aAlpha', new T.BufferAttribute(ma, 1));
    mg.setAttribute('aSize', new T.BufferAttribute(ms, 1));
    const mm = new T.ShaderMaterial({
      transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      uniforms: { color: { value: new T.Color('#ffffff') }, map: { value: radialTexture([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]) }, pr: { value: 1 } },
      vertexShader: 'attribute float aAlpha; attribute float aSize; uniform float pr; varying float vA; void main(){ vA=aAlpha; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=aSize*pr*(320.0/-mv.z); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'uniform vec3 color; uniform sampler2D map; varying float vA; void main(){ vec4 t=texture2D(map, gl_PointCoord); gl_FragColor=vec4(color, t.a*vA); }',
    });
    const points = new T.Points(mg, mm); points.frustumCulled = false;
    const P = Array.from({ length: M }, () => ({ life: 1, max: 1, vx: 0, vy: 0, vz: 0, delay: 0 }));
    let next = 0;
    return {
      points,
      setPixelRatio(v) { mm.uniforms.pr.value = v; },
      emit(origin, dir, family, count = 180) {
        mm.uniforms.color.value.set(FAMILIES[family].color).lerp(new T.Color('#ffffff'), 0.55);
        for (let i = 0; i < count; i++) {
          const j = next; next = (j + 1) % M;
          const q = P[j]; const sp = 0.9 + Math.random() * 1.6;
          q.life = 0; q.max = 1.4 + Math.random() * 1.6; q.delay = Math.random() * 0.22;
          q.vx = dir.x * sp + (Math.random() - 0.5) * 0.5; q.vy = 0.25 + (Math.random() - 0.3) * 0.45; q.vz = dir.z * sp + (Math.random() - 0.5) * 0.5;
          mp[j * 3] = origin.x; mp[j * 3 + 1] = origin.y; mp[j * 3 + 2] = origin.z;
        }
      },
      update(dt) {
        for (let i = 0; i < M; i++) {
          const q = P[i];
          if (q.life >= q.max) { ma[i] = 0; continue; }
          if (q.delay > 0) { q.delay -= dt; ma[i] = 0; continue; }
          q.life += dt; const f = q.life / q.max;
          const drag = Math.pow(0.18, dt);
          q.vx *= drag; q.vz *= drag; q.vy = q.vy * drag - dt * 0.05;
          mp[i * 3] += q.vx * dt; mp[i * 3 + 1] += q.vy * dt; mp[i * 3 + 2] += q.vz * dt;
          ma[i] = Math.min(1, f * 8) * (1 - f) * 0.42; ms[i] = 0.05 + f * 0.6;
        }
        mg.attributes.position.needsUpdate = true; mg.attributes.aAlpha.needsUpdate = true; mg.attributes.aSize.needsUpdate = true;
      },
    };
  }

  function buildAtmosphere() {
    // Floating dust motes catching the light.
    const N = 700, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 6; pos[i * 3] = Math.sin(a) * r; pos[i * 3 + 1] = Math.random() * 4.6; pos[i * 3 + 2] = Math.cos(a) * r; }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    dust = new T.Points(g, new T.PointsMaterial({ size: 0.022, map: radialTexture([[0, 'rgba(255,240,220,1)'], [1, 'rgba(255,240,220,0)']]), transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending, color: col('#ffe6c4') }));
    scene.add(dust);

    mist = createMist(); scene.add(mist.points);

    heroHalo = new T.Sprite(new T.SpriteMaterial({ map: radialTexture([[0, 'rgba(255,255,255,0.8)'], [0.35, 'rgba(255,255,255,0.18)'], [1, 'rgba(255,255,255,0)']]), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    heroHalo.scale.set(1.6, 1.6, 1); heroHalo.position.set(0, 1.35, 0); heroHalo.visible = false; scene.add(heroHalo);
  }

  /* ---------- init ---------- */
  function init(el, callbacks) {
    host = el; cb = callbacks || {};
    T = window.THREE;
    if (!T) return false;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (e) { return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    canvas = renderer.domElement; canvas.className = 'showroom-canvas';
    host.appendChild(canvas);

    scene = new T.Scene();
    scene.background = new T.Color('#070504');
    scene.fog = new T.FogExp2('#070504', 0.045);
    camera = new T.PerspectiveCamera(50, 1, 0.05, 60);
    scene.environment = buildEnvironment();

    scene.add(new T.HemisphereLight('#ffe8cc', '#120c08', 0.5));
    const spot = new T.SpotLight('#ffe0b4', 3.2, 9, 0.42, 0.65, 1.2);
    spot.position.set(0, 4.6, 0.4); spot.target.position.set(0, 1, 0); scene.add(spot, spot.target);
    pointLight = new T.PointLight('#ffd7a8', 1.4, 14, 1.2); pointLight.position.set(0, 2.6, 0); scene.add(pointLight);
    const rim = new T.PointLight('#9fc2ff', 0.6, 7, 1.5); rim.position.set(-1.6, 2.2, -1.4); scene.add(rim);

    bottleGroup = new T.Group(); signGroup = new T.Group(); scene.add(bottleGroup, signGroup);
    buildAtmosphere();
    buildRoom();
    bindInput();
    new ResizeObserver(resize).observe(host);
    resize();
    ok = true;
    return true;
  }

  function resize() {
    if (!renderer) return;
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w / h < 1 ? 68 : 50; camera.updateProjectionMatrix();
    if (mist) mist.setPixelRatio(renderer.getPixelRatio() * (h / 900));
  }

  /* ---------- collection layout ---------- */
  function setItems(items, preferHeroId) {
    if (!ok) return;
    return fontsReady.then(() => layout(items, preferHeroId));
  }

  function layout(items, preferHeroId) {
    for (const r of records) bottleGroup.remove(r.group);
    signGroup.children.slice().forEach((c) => { signGroup.remove(c); c.geometry.dispose(); });
    records = []; byId = {}; pickables = []; hero = null; hovered = null;
    const n = items.length;
    const cols = Math.max(1, Math.ceil(n / ROWS));
    R = Math.max(5.4, (cols * COL_GAP) / (Math.PI * 2 * 0.86));
    if (Math.abs(R - builtR) > 0.01) buildRoom();
    let lastSignCol = -1, lastHouse = null;
    items.forEach((item, i) => {
      const ci = Math.floor(i / ROWS), row = i % ROWS;
      const a = Math.PI + (ci - (cols - 1) / 2) * (COL_GAP / R);
      const { group, pick } = makeBottle(item);
      const home = new T.Vector3(Math.sin(a) * (R - 0.03), ROW_Y0 + row * ROW_GAP + 0.018, Math.cos(a) * (R - 0.03));
      group.position.copy(home); group.rotation.y = a + Math.PI; group.scale.setScalar(SHELF_SCALE);
      bottleGroup.add(group);
      const rec = { item, group, home, homeRot: a + Math.PI, lift: 0, flying: false };
      pick.userData.rec = rec; pickables.push(pick);
      records.push(rec); byId[item.id] = rec;
      if (item.house !== lastHouse && ci !== lastSignCol) {
        const sign = new T.Mesh(new T.PlaneGeometry(0.42, 0.21), labelMat(item.house));
        sign.position.set(Math.sin(a) * (R + 0.05), ROW_Y0 + ROWS * ROW_GAP + 0.12, Math.cos(a) * (R + 0.05));
        sign.rotation.y = a + Math.PI; signGroup.add(sign); lastSignCol = ci;
      }
      lastHouse = item.house;
    });
    const first = (preferHeroId && byId[preferHeroId]) || records.slice().sort((x, y) => y.item.base - x.item.base)[0];
    if (first) placeHero(first, false);
    heroHalo.visible = !!first;
    orbit.dist = Math.min(orbit.dist, R - 0.9);
  }

  function placeHero(rec, animate) {
    if (hero === rec) return;
    const prev = hero; hero = rec;
    if (prev) {
      prev.flying = true;
      const from = prev.group.position.clone(), s0 = prev.group.scale.x;
      let r0 = prev.group.rotation.y % (Math.PI * 2); const r1 = prev.homeRot;
      tween(animate ? 0.9 : 0.01, (k) => {
        const e = ease(k);
        prev.group.position.lerpVectors(from, prev.home, e); prev.group.position.y += Math.sin(e * Math.PI) * 0.4;
        prev.group.scale.setScalar(s0 + (SHELF_SCALE - s0) * e);
        prev.group.rotation.y = r0 + (r1 - r0) * e;
      }, () => { prev.flying = false; });
    }
    rec.flying = true;
    const from = rec.group.position.clone(), s0 = rec.group.scale.x, r0 = rec.group.rotation.y;
    const to = new T.Vector3(0, HERO_Y, 0);
    tween(animate ? 1.15 : 0.01, (k) => {
      const e = ease(k);
      rec.group.position.lerpVectors(from, to, e); rec.group.position.y += Math.sin(e * Math.PI) * 0.9;
      rec.group.scale.setScalar(s0 + (HERO_SCALE - s0) * e);
      rec.group.rotation.y = r0 + e * Math.PI * 2;
    }, () => { rec.flying = false; });
    heroHalo.material.color.set(FAMILIES[rec.item.family].color);
  }

  function focus(id, fromTour) {
    const rec = byId[id]; if (!rec) return;
    if (!fromTour) stopTour();
    placeHero(rec, true);
    orbit.tx = 0; orbit.ty = 1.3; orbit.tz = 0;
    orbit.dist = 2.5; orbit.pitch = 0.08;
    lastInput = performance.now();
    if (cb.onFocus) cb.onFocus(rec.item);
  }

  function spray() {
    if (!hero || hero.flying) return false;
    const top = hero.group.userData.top * HERO_SCALE;
    const camDir = new T.Vector3(camera.position.x, 0, camera.position.z).normalize();
    const nozzle = new T.Vector3(0, HERO_Y + top - 0.04, 0).addScaledVector(camDir, 0.08);
    mist.emit(nozzle, camDir, hero.item.family);
    const g = hero.group; const y0 = HERO_Y;
    tween(0.35, (k) => { g.position.y = y0 - Math.sin(k * Math.PI) * 0.04; });
    return true;
  }

  /* ---------- tour ---------- */
  function startTour(ids, onCard, onEnd) {
    const list = ids.filter((id) => byId[id]);
    if (!list.length) return false;
    tour = { ids: list, i: -1, t: 0, onCard, onEnd };
    nextTour(); return true;
  }
  function nextTour() {
    tour.i++;
    if (tour.i >= tour.ids.length) { const end = tour.onEnd; tour = null; if (end) end(); return; }
    const rec = byId[tour.ids[tour.i]];
    focus(rec.item.id, true);
    orbit.dist = tour.i % 2 ? 2.1 : 2.8; orbit.pitch = tour.i % 2 ? 0.16 : 0.02;
    tour.t = 0;
    if (tour.onCard) tour.onCard(rec.item, tour.i, tour.ids.length);
  }
  function stopTour() { if (!tour) return; const end = tour.onEnd; tour = null; if (end) end(); }

  /* ---------- input ---------- */
  const pointers = new Map(); let downAt = null, dragging = false, pinch0 = 0, hoverReq = null;
  const ray = { rc: null, v: null };

  function pickAt(x, y) {
    if (!ray.rc) { ray.rc = new T.Raycaster(); ray.v = new T.Vector2(); }
    const r = canvas.getBoundingClientRect();
    ray.v.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.rc.setFromCamera(ray.v, camera);
    const hit = ray.rc.intersectObjects(pickables, false)[0];
    return hit ? hit.object.userData.rec : null;
  }

  function bindInput() {
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) { downAt = { x: e.clientX, y: e.clientY }; dragging = false; }
      if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); }
      lastInput = performance.now();
    });
    canvas.addEventListener('pointermove', (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) { if (e.pointerType === 'mouse') hoverReq = { x: e.clientX, y: e.clientY }; return; }
      const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch0) orbit.dist = clampDist(orbit.dist * (pinch0 / d)); pinch0 = d; dragging = true; return;
      }
      if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 5) dragging = true;
      if (dragging) {
        if (tour) stopTour();
        orbit.yaw -= dx * 0.0055; orbit.pitch = Math.max(-0.25, Math.min(0.85, orbit.pitch + dy * 0.004));
        lastInput = performance.now();
      }
    });
    const up = (e) => {
      const wasDrag = dragging; pointers.delete(e.pointerId);
      if (pointers.size === 0 && !wasDrag && downAt) {
        const rec = pickAt(e.clientX, e.clientY);
        if (rec) { if (rec === hero) { if (cb.onHeroClick) cb.onHeroClick(rec.item); } else { focus(rec.item.id); if (cb.onPick) cb.onPick(rec.item); } }
      }
      if (pointers.size === 0) { downAt = null; dragging = false; }
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', () => { hoverReq = null; setHover(null); });
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); orbit.dist = clampDist(orbit.dist * (1 + e.deltaY * 0.0012)); lastInput = performance.now(); }, { passive: false });
  }
  function clampDist(d) { return Math.max(1.5, Math.min(R - 0.9, d)); }

  function setHover(rec, x, y) {
    if (hovered && hovered !== rec) hovered.lift = 0;
    hovered = rec;
    if (rec && rec !== hero) rec.lift = 0.05;
    canvas.style.cursor = rec ? 'pointer' : 'grab';
    if (cb.onHover) cb.onHover(rec && rec !== hero ? rec.item : null, x, y);
  }

  /* ---------- loop ---------- */
  function frame(now) {
    if (!active) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;

    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i]; tw.t += dt; const k = Math.min(1, tw.t / tw.dur); tw.fn(k);
      if (k >= 1) { tweens.splice(i, 1); if (tw.done) tw.done(); }
    }

    if (tour) {
      tour.t += dt; orbit.yaw += dt * 0.32;
      if (tour.t > 4.6) nextTour();
    } else if (now - lastInput > 7000) {
      orbit.yaw += dt * 0.06;
    }

    if (hoverReq && !downAt) { const h = pickAt(hoverReq.x, hoverReq.y); if (h !== hovered) setHover(h, hoverReq.x, hoverReq.y); else if (h && cb.onHover && h !== hero) cb.onHover(h.item, hoverReq.x, hoverReq.y); hoverReq = null; }
    for (const r of records) {
      if (r.flying || r === hero) continue;
      const ty = r.home.y + r.lift; r.group.position.y += (ty - r.group.position.y) * Math.min(1, dt * 10);
    }
    if (hero && !hero.flying) hero.group.rotation.y += dt * 0.55;
    if (hero) {
      heroHalo.position.set(0, HERO_Y + hero.group.userData.top * HERO_SCALE * 0.55, 0);
      const s = 1.5 + Math.sin(now * 0.0015) * 0.08; heroHalo.scale.set(s, s, 1);
    }

    // Smooth camera.
    const k = Math.min(1, dt * 4);
    cur.yaw += (orbit.yaw - cur.yaw) * k; cur.pitch += (orbit.pitch - cur.pitch) * k; cur.dist += (orbit.dist - cur.dist) * k;
    cur.tx += (orbit.tx - cur.tx) * k; cur.ty += (orbit.ty - cur.ty) * k; cur.tz += (orbit.tz - cur.tz) * k;
    const cp = Math.cos(cur.pitch);
    camera.position.set(cur.tx + Math.sin(cur.yaw) * cp * cur.dist, cur.ty + Math.sin(cur.pitch) * cur.dist, cur.tz + Math.cos(cur.yaw) * cp * cur.dist);
    camera.lookAt(cur.tx, cur.ty, cur.tz);

    // Dust drift.
    const dp = dust.geometry.attributes.position.array;
    for (let i = 1; i < dp.length; i += 3) { dp[i] += dt * 0.03; if (dp[i] > 4.6) dp[i] = 0; }
    dust.geometry.attributes.position.needsUpdate = true;
    dust.rotation.y += dt * 0.01;

    mist.update(dt);

    pointLight.intensity = 1.3 + Math.sin(now * 0.0007) * 0.08;
    renderer.render(scene, camera);
  }

  return {
    // Building blocks for the unboxing scene.
    lib: { makeBottle, buildEnvironment, radialTexture, labelMat, beamMaterial, createMist, col, get fontsReady() { return fontsReady; } },
    init,
    get ok() { return ok; },
    setItems,
    show() { if (!ok || active) return; active = true; last = performance.now(); resize(); raf = requestAnimationFrame(frame); },
    hide() { active = false; cancelAnimationFrame(raf); stopTour(); },
    focus, spray, startTour, stopTour,
    get touring() { return !!tour; },
    heroItem() { return hero ? hero.item : null; },
    resetView() { stopTour(); orbit.yaw = 0; orbit.pitch = 0.1; orbit.dist = Math.min(3.6, R - 0.9); orbit.ty = 1.25; lastInput = performance.now(); },
    wide() { stopTour(); orbit.pitch = 0.42; orbit.dist = R - 0.9; orbit.ty = 1.9; lastInput = performance.now(); },
  };
})();
