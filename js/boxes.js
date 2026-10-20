/* Sillage — retail boxes for the unboxing, modelled from photos of the real packaging.
 * A spec describes the closed box: its shape (rect or round), total height, the lid
 * (how far it telescopes down), paper and trim, and artwork painted across the
 * whole front so the seam between lid and base falls where it does on the real box.
 * Specs are looked up by fragrance key first, then by house.
 */
const BoxCraft = (() => {
  const SPECS = {};
  let T;
  const C = (hex) => new T.Color(hex).convertSRGBToLinear();
  const paint = (w, h, draw) => BottleCraft.tools.paint(w, h, draw);

  function mat(o) {
    if (o === 'gold') return new T.MeshStandardMaterial({ color: C('#e8c47c'), metalness: 1, roughness: 0.36, envMapIntensity: 1.6 });
    if (o === 'silver') return new T.MeshStandardMaterial({ color: C('#d6dade'), metalness: 1, roughness: 0.3 });
    if (typeof o === 'string') return new T.MeshStandardMaterial({ color: C(o), roughness: 0.6, metalness: 0.02 });
    return new T.MeshStandardMaterial({ color: C(o.color), roughness: o.rough != null ? o.rough : 0.6, metalness: o.metal || 0 });
  }
  const decal = (tex) => new T.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false });
  // Keep only the [v0, v1] slice of a texture on a plane or wrap, so lid and base share one drawing.
  function slice(geo, v0, v1) {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setY(i, v0 + uv.getY(i) * (v1 - v0));
    return geo;
  }

  // fit: the bottle's size inside the box; a spec's own w/d/h/r are minimums, pad is the slack around the bottle.
  function build(item, fit = { w: 0.5, d: 0.3, h: 0.8 }) {
    T = window.THREE;
    const fn = SPECS[item.key] || SPECS[item.house] || SPECS['*'];
    if (!T || !fn) return null;
    const s = Object.assign({}, fn(item, fit)), pad = s.pad != null ? s.pad : 0.07;
    if (s.shape === 'round') {
      s.r = Math.max(s.r || 0, Math.hypot(fit.w, fit.d) / 2 + pad * 0.5);
      const h = Math.max(s.h || 0, fit.h + pad); s.lid = s.lid ? s.lid * h / s.h : h * 0.8; s.h = h;
      return round(s, item);
    }
    s.w = Math.max(s.w || 0, fit.w + pad); s.d = Math.max(s.d || 0, fit.d + pad);
    const h = Math.max(s.h || 0, fit.h + pad); s.lid = s.lid != null ? (s.lid <= 1 ? s.lid * h : s.lid) : h * 0.25; s.h = h;
    return rect(s, item);
  }

  /* Round: a base cup and a cylindrical lid or sleeve that slides off upward. */
  function round(s) {
    const H = s.h, R = s.r, LH = s.lid, HB = H - LH, mats = [];
    const m = (o) => { const x = mat(o); mats.push(x); return x; };
    const paper = m(s.paper), lining = m(s.lining || s.paper);
    lining.side = T.BackSide;
    const group = new T.Group(), lid = new T.Group();
    const arc = s.arc || 2.2, ART = s.front ? paint(arc * R, H, s.front) : null;
    if (ART) mats.push(ART);
    // Base cup.
    const base = new T.Mesh(new T.CylinderGeometry(R, R, HB, 64, 1, true), paper); base.position.y = HB / 2;
    const floor = new T.Mesh(new T.CircleGeometry(R, 64), lining); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.01;
    const inner = new T.Mesh(new T.CylinderGeometry(R - 0.012, R - 0.012, HB, 64, 1, true), lining); inner.position.y = HB / 2;
    group.add(base, floor, inner);
    if (s.collar) {
      // The inner collar the lid slides over (gold on Louis Vuitton boxes).
      const ch = s.collar.h || 0.12, cm = m(s.collar.fin || s.collar.color);
      cm.side = T.DoubleSide;
      const col = new T.Mesh(new T.CylinderGeometry(R - 0.008, R - 0.008, ch, 64, 1, true), cm); col.position.y = HB + ch / 2 - 0.02;
      group.add(col);
    }
    if (ART) {
      const g = slice(new T.CylinderGeometry(R + 0.002, R + 0.002, HB, 48, 1, true, -arc / 2, arc), 0, HB / H);
      const d = new T.Mesh(g, decal(ART)); d.position.y = HB / 2; d.renderOrder = 2; group.add(d); mats.push(d.material);
    }
    // Lid: a closed-top tube centred on its own origin so the opening animation can throw it.
    const LR = R + 0.01;
    const tube = new T.Mesh(new T.CylinderGeometry(LR, LR, LH, 64, 1, true), paper);
    const cap = new T.Mesh(new T.CircleGeometry(LR, 64), s.top ? m({ color: '#ffffff', rough: 0.55 }) : paper); cap.rotation.x = -Math.PI / 2; cap.position.y = LH / 2;
    if (s.top) { cap.material.map = paint(2 * LR, 2 * LR, s.top); mats.push(cap.material.map); }
    const lidIn = new T.Mesh(new T.CylinderGeometry(LR - 0.01, LR - 0.01, LH, 64, 1, true), lining);
    lid.add(tube, cap, lidIn);
    if (s.topRim) { const rim = new T.Mesh(new T.TorusGeometry(LR, 0.006, 8, 64), m(s.topRim)); rim.rotation.x = Math.PI / 2; rim.position.y = LH / 2; lid.add(rim); }
    if (ART) {
      const g = slice(new T.CylinderGeometry(LR + 0.002, LR + 0.002, LH, 48, 1, true, -arc / 2, arc), HB / H, 1);
      const d = new T.Mesh(g, decal(ART)); d.renderOrder = 2; lid.add(d); mats.push(d.material);
    }
    const lidRest = HB + LH / 2; lid.position.y = lidRest;
    group.add(lid);
    return {
      group, lid, lidRest, mats, hb: H, w: 2 * R, d: 2 * R,
      // A tall sleeve lifts clear of the bottle before it is set down on its side.
      lift: s.sleeve ? LH * 0.9 + 0.1 : 0.22, openTime: s.sleeve ? 1.7 : 1.1, split: s.sleeve ? 0.42 : 0.28,
      landY: s.sleeve ? LR : 0.12, landRot: s.sleeve ? -Math.PI / 2 : -2.9, landX: s.sleeve ? 1.25 : 1.5,
    };
  }

  /* Rect: a carton base with a telescoping lid. */
  function rect(s) {
    if (s.open === 'flap') return carton(s);
    const W = s.w, D = s.d, H = s.h, LH = s.lid, HB = H - LH, mats = [];
    const m = (o) => { const x = mat(o); mats.push(x); return x; };
    const paper = m(s.paper), side = s.side ? m(s.side) : paper, lining = m(s.lining || '#efe2cc');
    lining.side = T.BackSide;
    const hide = new T.MeshBasicMaterial({ visible: false }); mats.push(hide);
    const group = new T.Group(), lid = new T.Group();
    const FRONT = s.front ? paint(W, H, s.front) : null, TOP = s.top ? paint(W, D, s.top) : null;
    if (FRONT) mats.push(FRONT); if (TOP) mats.push(TOP);
    const base = new T.Mesh(new T.BoxGeometry(W, HB, D), [side, side, hide, paper, paper, paper]); base.position.y = HB / 2;
    const inner = new T.Mesh(new T.BoxGeometry(W - 0.03, HB - 0.01, D - 0.03), lining); inner.position.y = HB / 2 + 0.005;
    group.add(base, inner);
    const LW = W + 0.03, LD = D + 0.03;
    const shell = new T.Mesh(new T.BoxGeometry(LW, LH, LD), [side, side, paper, hide, paper, paper]);
    const lidIn = new T.Mesh(new T.BoxGeometry(LW - 0.02, LH - 0.01, LD - 0.02), lining); lidIn.position.y = -0.005;
    lid.add(shell, lidIn);
    const face = (geo, z, parent, y, back) => { const p = new T.Mesh(geo, decal(FRONT)); if (back) p.rotation.y = Math.PI; p.position.set(0, y, back ? -z : z); p.renderOrder = 2; parent.add(p); mats.push(p.material); };
    if (FRONT) {
      face(slice(new T.PlaneGeometry(W, HB), 0, HB / H), D / 2 + 0.002, group, HB / 2);
      face(slice(new T.PlaneGeometry(LW, LH), HB / H, 1), LD / 2 + 0.002, lid, 0);
      if (s.back) { face(slice(new T.PlaneGeometry(W, HB), 0, HB / H), D / 2 + 0.002, group, HB / 2, true); face(slice(new T.PlaneGeometry(LW, LH), HB / H, 1), LD / 2 + 0.002, lid, 0, true); }
    }
    if (TOP) { const p = new T.Mesh(new T.PlaneGeometry(LW, LD), decal(TOP)); p.rotation.x = -Math.PI / 2; p.position.y = LH / 2 + 0.002; lid.add(p); mats.push(p.material); }
    const lidRest = HB + LH / 2; lid.position.y = lidRest;
    group.add(lid);
    return { group, lid, lidRest, mats, hb: H, w: W, d: D, lift: 0.22, openTime: 1.1, split: 0.28, landY: 0.12, landRot: -2.9, landX: 1.5 };
  }

  /* Carton: one tall box with a tuck flap hinged at the back of the top. */
  function carton(s) {
    const W = s.w, D = s.d, H = s.h, mats = [];
    const m = (o) => { const x = mat(o); mats.push(x); return x; };
    const paper = m(s.paper), side = s.side ? m(s.side) : paper, lining = m(s.lining || s.paper);
    lining.side = T.BackSide;
    const hide = new T.MeshBasicMaterial({ visible: false }); mats.push(hide);
    const group = new T.Group();
    const FRONT = s.front ? paint(W, H, s.front) : null, TOP = s.top ? paint(W, D, s.top) : null, SIDE = s.sideArt ? paint(D, H, s.sideArt) : null;
    [FRONT, TOP, SIDE].forEach((t) => t && mats.push(t));
    const base = new T.Mesh(new T.BoxGeometry(W, H, D), [side, side, hide, paper, paper, paper]); base.position.y = H / 2;
    const inner = new T.Mesh(new T.BoxGeometry(W - 0.012, H - 0.006, D - 0.012), lining); inner.position.y = H / 2 + 0.003;
    group.add(base, inner);
    const face = (tex, w, h, x, y, z, ry) => { const p = new T.Mesh(new T.PlaneGeometry(w, h), decal(tex)); p.rotation.y = ry; p.position.set(x, y, z); p.renderOrder = 2; group.add(p); mats.push(p.material); };
    if (FRONT) { face(FRONT, W, H, 0, H / 2, D / 2 + 0.002, 0); if (s.back !== false) face(FRONT, W, H, 0, H / 2, -D / 2 - 0.002, Math.PI); }
    if (SIDE) { face(SIDE, D, H, W / 2 + 0.002, H / 2, 0, Math.PI / 2); face(SIDE, D, H, -W / 2 - 0.002, H / 2, 0, -Math.PI / 2); }
    // The flap pivots on the back top edge; its tongue tucks down inside the front wall.
    const lid = new T.Group(); lid.position.set(0, H, -D / 2);
    const plate = new T.Mesh(new T.BoxGeometry(W, 0.008, D), [side, side, paper, lining, paper, paper]); plate.position.set(0, 0.004, D / 2);
    const tongue = new T.Mesh(new T.PlaneGeometry(W - 0.02, Math.min(0.12, H * 0.12)), lining); tongue.material.side = T.DoubleSide;
    tongue.position.set(0, -Math.min(0.06, H * 0.06), D - 0.008);
    lid.add(plate, tongue);
    if (TOP) { const p = new T.Mesh(new T.PlaneGeometry(W, D), decal(TOP)); p.rotation.x = -Math.PI / 2; p.position.set(0, 0.0085, D / 2); lid.add(p); mats.push(p.material); }
    group.add(lid);
    return { group, lid, lidRest: H, flap: true, mats, hb: H, w: W, d: D, lift: 0, openTime: 1.2, split: 0.3, landY: 0, landRot: 0, landX: 0 };
  }

  /* ---------- Louis Vuitton: the white cylinder with a gold collar ---------- */
  SPECS.lv = (item) => {
    const extrait = /Symphony|Cosmic Cloud|Dancing Blossom|Rhapsody|Stellar Times/.test(item.name);
    return {
      shape: 'round', r: 0.29, h: 1.3, lid: 1.08, sleeve: true, arc: 2.0,
      paper: { color: '#f6f5f1', rough: 0.7 }, lining: { color: '#ffffff', rough: 0.8 },
      collar: { fin: 'gold', h: 0.14 }, topRim: extrait ? 'gold' : null,
      front: (P) => {
        P.text(item.name.toUpperCase(), 0.5, 0.405, 0.03, 'rgba(160,160,160,0.9)', { font: 'helv', weight: 500, track: 0.04, maxW: 0.66 });
        P.text('LOUIS VUITTON', 0.5, 0.45, 0.032, '#141414', { font: 'helv', weight: 700, track: 0.03, maxW: 0.66 });
      },
      top: extrait ? (P) => { P.rect(0, 0, 1, 1, '#f6f5f1'); P.circle(0.5, 0.5, 0.2, 'rgba(200,160,80,0.6)', 0.01); P.text('LV', 0.5, 0.5, 0.16, 'rgba(190,150,70,0.8)', { font: 'helv', weight: 600 }); } : null,
    };
  };

  return {
    build,
    add(specs) { Object.assign(SPECS, specs); },
    has(item) { return !!(SPECS[item.key] || SPECS[item.house]); },
    get specs() { return SPECS; },
  };
})();
