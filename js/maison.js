/* Sillage — your own fragrance house: the perfumer's palette, accords, scoring,
 * and the bottle and box designs that become real 3D models in the game.
 */
const Maison = (() => {
  /* ---------- the palette ---------- */
  // cost: dollars of material per 100 ml bottle; pot: how much the note carries.
  const NOTES = [
    // top
    ['bergamot', 'Bergamot', 'citrus', 'top', 1.2, 2], ['lemon', 'Sicilian Lemon', 'citrus', 'top', 0.8, 2], ['grapefruit', 'Grapefruit', 'citrus', 'top', 1, 2],
    ['mandarin', 'Mandarin', 'citrus', 'top', 1, 2], ['pepper', 'Pink Pepper', 'spicy', 'top', 2, 3], ['cardamom', 'Cardamom', 'spicy', 'top', 2.5, 3],
    ['lavender', 'Lavender', 'aromatic', 'top', 1.2, 3], ['mint', 'Mint', 'aromatic', 'top', 0.8, 2], ['apple', 'Green Apple', 'sweet', 'top', 1, 2],
    ['pineapple', 'Pineapple', 'sweet', 'top', 1.5, 3], ['seasalt', 'Sea Salt', 'aquatic', 'top', 1.5, 2], ['marine', 'Marine Accord', 'aquatic', 'top', 1.2, 3],
    ['neroli', 'Neroli', 'floral', 'top', 3, 2], ['saffron', 'Saffron', 'spicy', 'top', 6, 4], ['blackcurrant', 'Blackcurrant', 'sweet', 'top', 1.8, 3],
    // heart
    ['rose', 'Turkish Rose', 'floral', 'heart', 4, 4], ['jasmine', 'Jasmine', 'floral', 'heart', 5, 4], ['iris', 'Orris', 'floral', 'heart', 9, 3],
    ['orangeblossom', 'Orange Blossom', 'floral', 'heart', 3, 3], ['geranium', 'Geranium', 'aromatic', 'heart', 1.5, 3], ['sage', 'Clary Sage', 'aromatic', 'heart', 1.2, 2],
    ['cinnamon', 'Cinnamon', 'spicy', 'heart', 1.5, 4], ['nutmeg', 'Nutmeg', 'spicy', 'heart', 1.5, 3], ['coffee', 'Coffee', 'gourmand', 'heart', 2.5, 4],
    ['honey', 'Honey', 'sweet', 'heart', 2, 4], ['tobacco', 'Tobacco Leaf', 'tobacco', 'heart', 3, 4], ['violetleaf', 'Violet Leaf', 'fresh', 'heart', 2.5, 2],
    ['juniper', 'Juniper', 'aromatic', 'heart', 1.5, 2], ['fig', 'Fig', 'fresh', 'heart', 2.5, 3], ['tuberose', 'Tuberose', 'floral', 'heart', 6, 5],
    // base
    ['vanilla', 'Madagascar Vanilla', 'gourmand', 'base', 2, 4], ['tonka', 'Tonka Bean', 'gourmand', 'base', 2, 4], ['amber', 'Amber', 'amber', 'base', 2.5, 4],
    ['ambroxan', 'Ambroxan', 'amber', 'base', 3, 4], ['sandalwood', 'Mysore Sandalwood', 'woody', 'base', 6, 3], ['cedar', 'Cedarwood', 'woody', 'base', 1.5, 3],
    ['vetiver', 'Vetiver', 'woody', 'base', 3, 3], ['patchouli', 'Patchouli', 'woody', 'base', 2, 4], ['oud', 'Agarwood (Oud)', 'oud', 'base', 25, 5],
    ['leather', 'Leather', 'leather', 'base', 4, 4], ['musk', 'White Musk', 'musk', 'base', 1.5, 3], ['oakmoss', 'Oakmoss', 'aromatic', 'base', 3, 3],
    ['benzoin', 'Benzoin', 'amber', 'base', 2, 3], ['incense', 'Frankincense', 'amber', 'base', 4, 4], ['cacao', 'Cacao', 'gourmand', 'base', 3, 4],
    ['labdanum', 'Labdanum', 'amber', 'base', 3.5, 4], ['birch', 'Birch Tar', 'leather', 'base', 3, 4], ['ambergris', 'Ambergris', 'aquatic', 'base', 12, 4],
  ].map(([id, name, family, layer, cost, pot]) => ({ id, name, family, layer, cost, pot }));
  const NOTE = Object.fromEntries(NOTES.map((n) => [n.id, n]));

  // Pairs that sing together, and what perfumers call them.
  const ACCORDS = [
    [['lavender', 'tonka'], 10, 'Fougère'], [['bergamot', 'lavender'], 5, 'Barbershop'], [['oakmoss', 'bergamot'], 8, 'Chypre'], [['patchouli', 'oakmoss'], 5, 'Chypre base'],
    [['rose', 'oud'], 14, 'Rose oud'], [['saffron', 'oud'], 9, 'Royal oud'], [['incense', 'oud'], 6, 'Smoky oud'], [['vanilla', 'tonka'], 8, 'Gourmand base'],
    [['tobacco', 'vanilla'], 12, 'Tobacco vanille'], [['coffee', 'vanilla'], 8, 'Café crème'], [['cacao', 'coffee'], 6, 'Mocha'], [['honey', 'tobacco'], 10, 'Pipe tobacco'],
    [['ambroxan', 'marine'], 8, 'Blue accord'], [['pepper', 'ambroxan'], 9, 'Fresh spicy'], [['grapefruit', 'ambroxan'], 6, 'Sport'], [['pineapple', 'birch'], 14, 'Smoky pineapple'],
    [['iris', 'leather'], 10, 'Suede'], [['iris', 'vetiver'], 6, 'Earthy iris'], [['saffron', 'ambroxan'], 10, 'Saffron amberwood'], [['jasmine', 'saffron'], 5, 'Golden floral'],
    [['orangeblossom', 'musk'], 6, 'Clean blossom'], [['neroli', 'musk'], 6, 'Cologne'], [['seasalt', 'sage'], 8, 'Sea and sage'], [['incense', 'labdanum'], 6, 'Resinous'],
    [['benzoin', 'vanilla'], 5, 'Balsamic'], [['cinnamon', 'vanilla'], 5, 'Spiced vanilla'], [['cardamom', 'lavender'], 5, 'Aromatic spice'], [['cardamom', 'coffee'], 5, 'Arabic coffee'],
    [['lemon', 'mint'], 4, 'Mojito'], [['apple', 'cinnamon'], 5, 'Apple pie'], [['fig', 'cedar'], 6, 'Fig tree'], [['vetiver', 'grapefruit'], 6, 'Green vetiver'],
    [['cedar', 'vetiver'], 4, 'Dry woods'], [['sandalwood', 'musk'], 6, 'Skin scent'], [['sandalwood', 'rose'], 5, 'Rose woods'], [['blackcurrant', 'rose'], 6, 'Fruity rose'],
    [['tuberose', 'jasmine'], 6, 'White floral'], [['leather', 'birch'], 6, 'Russian leather'], [['ambergris', 'seasalt'], 8, 'Ambergris shore'], [['mandarin', 'neroli'], 5, 'Orange grove'],
  ];
  const CLASHES = [
    [['marine', 'oud'], 12], [['marine', 'leather'], 8], [['mint', 'oud'], 8], [['seasalt', 'cacao'], 10], [['coffee', 'marine'], 10], [['lemon', 'leather'], 5],
    [['birch', 'jasmine'], 6], [['pineapple', 'oud'], 6], [['iris', 'marine'], 4], [['mint', 'tuberose'], 6], [['cacao', 'vetiver'], 4], [['seasalt', 'tobacco'], 6],
  ];

  const CONC = {
    edt: { label: 'Eau de Toilette', mult: 1, oil: 1, hours: 5 },
    edp: { label: 'Eau de Parfum', mult: 1.3, oil: 1.6, hours: 8 },
    extrait: { label: 'Extrait de Parfum', mult: 1.75, oil: 2.6, hours: 11 },
  };
  const CITIES = ['Paris', 'Grasse', 'London', 'New York', 'Dubai', 'Milan', 'Florence', 'Tokyo', 'Istanbul', 'Los Angeles', 'Marrakesh', 'Stockholm'];
  const PALETTES = [
    ['#111111', '#d8b56a', 'Noir & gold'], ['#f4f1ea', '#1a1a1a', 'Ivory & ink'], ['#0f2a44', '#e8e4d8', 'Navy & bone'], ['#3a0f18', '#e6c37a', 'Bordeaux & gold'],
    ['#1d3a2c', '#e8dcb8', 'Forest & cream'], ['#e9d6c6', '#5a3a2a', 'Blush & cocoa'], ['#2a2a30', '#c8ccd2', 'Graphite & silver'], ['#5a2a6a', '#f0d890', 'Amethyst & gold'],
  ];

  /* ---------- scoring ---------- */
  function analyse(sel, o = {}) {
    const ids = [...(sel.top || []), ...(sel.heart || []), ...(sel.base || [])];
    const has = new Set(ids);
    const found = ACCORDS.filter(([p]) => p.every((n) => has.has(n))).map(([p, pts, name]) => ({ pts, name, notes: p }));
    const clashes = CLASHES.filter(([p]) => p.every((n) => has.has(n))).map(([p, pts]) => ({ pts, notes: p }));
    let score = 50 + Math.min(40, found.reduce((a, f) => a + f.pts, 0)) - clashes.reduce((a, c) => a + c.pts, 0);
    const missing = ['top', 'heart', 'base'].filter((l) => !(sel[l] || []).length);
    score -= missing.length * 15;
    const extra = Math.max(0, ids.length - (o.maxNotes || 7)); score -= extra * 5;
    if (ids.length >= 4 && ids.length <= 7) score += 4;
    score += o.bonus || 0;
    // Family: heart and base carry more weight than the opening.
    const w = {};
    for (const l of ['top', 'heart', 'base']) for (const id of sel[l] || []) { const n = NOTE[id]; w[n.family] = (w[n.family] || 0) + n.pot * (l === 'top' ? 0.6 : l === 'heart' ? 1 : 1.2); }
    const family = Object.entries(w).sort((a, b) => b[1] - a[1])[0];
    const cost = ids.reduce((a, id) => a + NOTE[id].cost, 0);
    const basePot = (sel.base || []).reduce((a, id) => a + NOTE[id].pot, 0);
    return {
      ids, accords: found, clashes, missing, harmony: Math.max(5, Math.min(99, Math.round(score))),
      family: family ? family[0] : 'fresh', oilCost: cost, basePot,
    };
  }
  function longevity(an, conc) { return Math.round((CONC[conc].hours + Math.min(4, an.basePot / 4)) * 10) / 10; }

  /* ---------- bottle designs ---------- */
  const SHAPES = {
    block: { label: 'Classic block', cost: 4, body: { w: 0.5, h: 0.6, d: 0.26, r: 0.02 } },
    tall: { label: 'Tall column', cost: 4, body: { w: 0.34, h: 0.8, d: 0.22, r: 0.02 } },
    round: { label: 'Apothecary', cost: 5, body: { body: 'lathe', w: 0.5, d: 0.5, h: 0.66, pts: [[0, 0], [0.225, 0], [0.246, 0.016], [0.252, 0.05], [0.252, 0.5], [0.24, 0.565], [0.2, 0.615], [0.13, 0.648], [0.085, 0.662], [0.078, 0.672], [0.078, 0.69], [0, 0.69]] } },
    flask: { label: 'Pebble flask', cost: 6, body: { body: 'pillow', w: 0.58, h: 0.6, d: 0.26, ex: 0.3, ey: 0.3 } },
    orb: { label: 'Orb', cost: 7, body: { body: 'sphere', w: 0.58, h: 0.58, d: 0.5 } },
    gem: { label: 'Faceted gem', cost: 9, body: { body: 'cyl', seg: 8, w: 0.56, h: 0.6, d: 0.4 } },
    tower: { label: 'Skyline tower', cost: 8, body: { body: 'profile', pts: [[-0.2, 0], [0.2, 0], [0.2, 0.62], [0.12, 0.74], [-0.12, 0.74], [-0.2, 0.62]], round: 0.02, w: 0.4, h: 0.74, d: 0.24 } },
  };
  const GLASS = {
    clear: { label: 'Clear glass, juice shows', cost: 0 },
    tinted: { label: 'Tinted glass', cost: 1 },
    lacquer: { label: 'Lacquered', cost: 3 },
    frosted: { label: 'Frosted', cost: 2 },
    metal: { label: 'Metallised', cost: 5 },
  };
  const CAPS = {
    cylinder: { label: 'Column', cost: 2 }, cube: { label: 'Cube', cost: 2 }, sphere: { label: 'Ball', cost: 3 },
    faceted: { label: 'Faceted', cost: 4 }, dome: { label: 'Dome', cost: 3 }, crown: { label: 'Crown', cost: 8 }, tall: { label: 'Obelisk', cost: 4 },
  };
  const FINISH = { gold: 'Gold', silver: 'Silver', chrome: 'Chrome', black: 'Black lacquer', white: 'White', wood: 'Wood', crystal: 'Crystal' };
  const LABELS = { plate: 'Metal plate', paper: 'Paper label', print: 'Printed on glass', none: 'No label' };
  const designCost = (d) => SHAPES[d.shape].cost + GLASS[d.glass].cost + CAPS[d.cap].cost + (d.capFin === 'gold' || d.capFin === 'crystal' ? 2 : 0) + (d.label === 'plate' ? 2 : 0);

  function capParts(d, H) {
    const f = d.capFin;
    const m = f === 'wood' ? { color: '#7a5230', rough: 0.75, coat: 0.1 } : f === 'crystal' ? { glass: '#eaf4ff', op: 0.6 } : f === 'white' ? { color: '#f2efe8', rough: 0.3 } : f === 'black' ? { color: '#0c0c0d', rough: 0.15 } : { fin: f };
    const neck = { s: 'cyl', r: 0.055, h: 0.03, fin: f === 'gold' ? 'gold' : 'silver' };
    const top = {
      cylinder: { s: 'cyl', r: 0.12, h: 0.2 }, cube: { s: 'box', w: 0.26, d: 0.2, h: 0.2 }, sphere: { s: 'sphere', r: 0.12 },
      faceted: { s: 'cyl', r: 0.15, rb: 0.13, h: 0.18, seg: 6 }, dome: { s: 'lathe', pts: [[0, 0], [0.15, 0], [0.15, 0.06], [0.12, 0.13], [0.06, 0.17], [0, 0.18]] },
      crown: { s: 'lathe', pts: [[0, 0], [0.13, 0], [0.15, 0.06], [0.11, 0.12], [0.14, 0.2], [0.09, 0.2], [0.06, 0.14], [0, 0.26]], seg: 8 },
      tall: { s: 'cyl', r: 0.06, rb: 0.09, h: 0.32, seg: 4 },
    }[d.cap];
    return [neck, Object.assign(top, m)];
  }

  // A BottleCraft spec from a design (uses the generic builder from bottles-designer.js).
  function bottleSpec(d, info) {
    return () => {
      const B = BottleCraft.tools, sh = SHAPES[d.shape].body;
      const o = Object.assign({}, sh);
      const H = sh.h, W = sh.w;
      if (d.glass === 'clear') { o.juice = d.juice; o.level = 0.9; o.inset = 0.93; }
      else if (d.glass === 'tinted') { o.glass = d.color; o.op = 0.82; o.juice = d.juice; o.level = 0.88; o.jop = 0.5; }
      else if (d.glass === 'lacquer') { o.solid = d.color; o.rough = 0.18; o.coat = 0.7; }
      else if (d.glass === 'frosted') { o.solid = d.color; o.rough = 0.65; o.coat = 0.1; o.env = 1; }
      else if (d.glass === 'metal') { o.solid = d.color; o.metal = 0.9; o.rough = 0.25; }
      o.cap = capParts(d, H);
      if (d.label !== 'none') {
        const plate = d.label === 'plate', paper = d.label === 'paper';
        const lw = Math.min(W * 0.78, 0.42), lh = Math.min(H * 0.42, 0.28);
        const bg = plate ? (d.capFin === 'gold' ? '#d8b462' : '#cfd3d8') : paper ? info.lbg : 'rgba(0,0,0,0)';
        const ink = plate ? '#1a1a1a' : paper ? info.lfg : (d.ink || info.lfg);
        o.art = {
          w: lw, h: lh, y: H * 0.45, wrap: sh.body === 'lathe' || sh.body === 'sphere' || (sh.body === 'cyl' && !sh.seg), arc: 1.3, foil: plate,
          bg, round: plate ? 0.04 : 0.01, frame: paper ? info.lfg : null,
          t: [[info.house.toUpperCase(), 0.2, 0.11, ink, { font: 'roman', weight: 600, track: 0.14, maxW: 0.86 }],
            [info.name, 0.52, 0.22, ink, { font: 'serif', italic: true, maxW: 0.88 }],
            [CONC[info.conc].label.toUpperCase(), 0.82, 0.07, ink, { font: 'helv', track: 0.2, maxW: 0.86 }]],
        };
      }
      return B.Q(o);
    };
  }

  /* ---------- box designs ---------- */
  const BOX_STYLES = { carton: 'Tuck carton', lid: 'Lift-off lid', tube: 'Round tube' };
  const PATTERNS = { plain: 'Plain', border: 'Fine border', stripes: 'Pinstripes', monogram: 'Monogram', band: 'Centre band' };
  function boxSpec(b, info) {
    return (item, fit) => {
      const L = BoxCraft.lib, mono = info.house.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
      const front = (P) => {
        L.fullBg(P, b.paper);
        if (b.pattern === 'stripes') L.pinstripe(P, b.ink + '33', 60);
        if (b.pattern === 'monogram') for (let y = 0.04; y < 1; y += 0.07) for (let x = 0.08; x < 1; x += 0.16) P.text(mono, x + ((Math.round(y / 0.07) % 2) * 0.08), y, 0.03, b.ink + '30', { font: 'serif', weight: 600 });
        if (b.pattern === 'border') P.frame(0.06, 0.04, 0.88, 0.92, b.ink, 0.004);
        if (b.pattern === 'band') P.rect(0, 0.4, 1, 0.14, b.ink);
        const onBand = b.pattern === 'band';
        L.tx(P, info.house.toUpperCase(), 0.18, 0.03, b.ink, 'roman', { weight: 600, track: 0.18, maxW: 0.8 });
        L.tx(P, info.name, 0.47, 0.045, onBand ? b.paper : b.ink, 'serif', { italic: true, maxW: 0.84 });
        L.tx(P, CONC[info.conc].label.toUpperCase(), 0.62, 0.012, b.ink, 'sans', { track: 0.3 });
        L.tx(P, info.city.toUpperCase(), 0.86, 0.012, b.ink, 'sans', { track: 0.4 });
        L.tx(P, '100 ml ℮ 3.4 FL.OZ.', 0.92, 0.01, b.ink, 'sans', { track: 0.1 });
      };
      if (b.style === 'tube') return { shape: 'round', r: Math.max(0.24, Math.hypot(fit.w, fit.d) / 2 + 0.04), h: fit.h + 0.14, lid: (fit.h + 0.14) * 0.32, arc: 1.7, paper: { color: b.paper, rough: 0.6 }, lining: b.ink, front: (P) => { L.fullBg(P, 'rgba(0,0,0,0)'); L.tx(P, info.house.toUpperCase(), 0.3, 0.025, b.ink, 'roman', { weight: 600, track: 0.18, maxW: 0.8 }); L.tx(P, info.name, 0.5, 0.04, b.ink, 'serif', { italic: true, maxW: 0.84 }); L.tx(P, CONC[info.conc].label.toUpperCase(), 0.6, 0.012, b.ink, 'sans', { track: 0.3 }); } };
      const dims = L.prop(fit, 0.62, 0.38);
      const top = (P) => { L.fullBg(P, b.paper); P.text(mono, 0.5, 0.5, 0.4, b.ink, { font: 'serif', weight: 600 }); };
      return Object.assign(dims, b.style === 'lid' ? { lid: 0.3 } : { open: 'flap' }, { paper: { color: b.paper, rough: 0.55 }, lining: b.ink, front, top });
    };
  }

  /* ---------- items ---------- */
  function tierFor(price) { return price >= 1000 ? 'haute' : price >= 450 ? 'luxury' : price >= 200 ? 'niche' : price >= 80 ? 'designer' : 'value'; }
  // Register the player's house and one creation as a real item with its bottle and box.
  function register(m, c) {
    HOUSE_BY_ID.mine = { id: 'mine', name: m.name, origin: m.city, shape: 'square', cap: 'gold', lbg: m.lbg, lfg: m.lfg, items: '' };
    const key = 'mine|' + c.name;
    const item = { id: c.id, key, name: c.name, house: 'mine', base: c.price, family: c.family, disc: false, limited: false, tier: tierFor(c.price), mine: true };
    ITEM_BY_ID[c.id] = item; ITEM_BY_KEY[key] = item;
    const info = { house: m.name, name: c.name, conc: c.conc, city: m.city, lbg: m.lbg, lfg: m.lfg };
    if (typeof BottleCraft !== 'undefined') { BottleCraft.add({ [key]: bottleSpec(c.design, info) }); BottleCraft.forget(key); }
    if (typeof BoxCraft !== 'undefined') BoxCraft.add({ [key]: boxSpec(c.box, info) });
    return item;
  }

  /* ---------- 3D preview ---------- */
  const Preview = (() => {
    let r = null, scene, cam, cur = null, host = null, raf = 0, mode = 'bottle', spin = 0;
    function mount(el) {
      const T = window.THREE, L = typeof Showroom !== 'undefined' && Showroom.lib;
      if (!T || !L) return false;
      host = el;
      if (!r) {
        try { r = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return false; }
        r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
        r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
        scene = new T.Scene(); scene.environment = L.buildEnvironment(r);
        scene.add(new T.HemisphereLight('#ffeedd', '#221a14', 0.7));
        const d = new T.DirectionalLight('#ffffff', 1.1); d.position.set(2, 4, 5); scene.add(d);
        cam = new T.PerspectiveCamera(30, 1, 0.05, 30);
      }
      el.appendChild(r.domElement); resize();
      if (!raf) loop();
      return true;
    }
    function resize() { if (!r || !host) return; const w = host.clientWidth || 300, h = host.clientHeight || 360; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    function show(item, m) {
      if (!r) return;
      const T = window.THREE, L = Showroom.lib;
      if (cur) { scene.remove(cur); cur.traverse((o) => { if (o.geometry && o.userData.own) o.geometry.dispose(); }); }
      mode = m || mode;
      const bottle = L.makeBottle(item).group;
      let g = bottle;
      if (mode === 'box') {
        bottle.scale.setScalar(0.8); bottle.updateMatrixWorld(true);
        const s = new T.Box3().setFromObject(bottle).getSize(new T.Vector3());
        const bx = BoxCraft.build(item, { w: s.x, d: s.z, h: s.y + 0.04 });
        if (bx) { g = bx.group; g.traverse((o) => { o.userData.own = true; }); }
      }
      cur = g; scene.add(g);
      const bb = new T.Box3().setFromObject(g), c = bb.getCenter(new T.Vector3()), s = bb.getSize(new T.Vector3());
      const dist = Math.max(s.y, s.x * 1.2) / (2 * Math.tan(15 * Math.PI / 180)) * 1.25;
      cam.position.set(0, c.y + s.y * 0.12, dist); cam.lookAt(0, c.y, 0);
    }
    function loop() {
      raf = requestAnimationFrame(loop);
      if (!host || !host.isConnected) { cancelAnimationFrame(raf); raf = 0; return; }
      if (host.clientWidth && r.domElement.width !== Math.round(host.clientWidth * r.getPixelRatio())) resize();
      spin += 0.008; if (cur) cur.rotation.y = Math.sin(spin) * 0.7;
      r.render(scene, cam);
    }
    return { mount, show, get mode() { return mode; } };
  })();

  return { NOTES, NOTE, ACCORDS, CLASHES, CONC, CITIES, PALETTES, SHAPES, GLASS, CAPS, FINISH, LABELS, BOX_STYLES, PATTERNS, analyse, longevity, designCost, register, tierFor, bottleSpec, boxSpec, Preview };
})();
