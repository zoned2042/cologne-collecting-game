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
    // top, added
    ['ginger', 'Ginger', 'spicy', 'top', 1.5, 3], ['lime', 'Lime', 'citrus', 'top', 0.8, 2], ['yuzu', 'Yuzu', 'citrus', 'top', 2, 2], ['bitterorange', 'Bitter Orange', 'citrus', 'top', 1, 2],
    ['blackpepper', 'Black Pepper', 'spicy', 'top', 1.5, 3], ['elemi', 'Elemi', 'spicy', 'top', 2.5, 2], ['pear', 'Pear', 'sweet', 'top', 1.5, 2], ['peach', 'Peach', 'sweet', 'top', 1.8, 3],
    ['raspberry', 'Raspberry', 'sweet', 'top', 1.8, 3], ['cherry', 'Black Cherry', 'sweet', 'top', 2.5, 4], ['plum', 'Plum', 'sweet', 'top', 2, 3], ['aldehydes', 'Aldehydes', 'fresh', 'top', 1.5, 3],
    ['ozonic', 'Rain Accord', 'aquatic', 'top', 1.5, 2], ['basil', 'Basil', 'aromatic', 'top', 1.2, 2], ['rum', 'Rum', 'gourmand', 'top', 3, 4], ['cognac', 'Cognac', 'gourmand', 'top', 4, 4],
    // heart, added
    ['blacktea', 'Black Tea', 'aromatic', 'heart', 3, 3], ['greentea', 'Green Tea', 'fresh', 'heart', 2.5, 2], ['matcha', 'Matcha', 'fresh', 'heart', 3, 2], ['whitetea', 'White Tea', 'fresh', 'heart', 3, 2],
    ['mate', 'Maté', 'aromatic', 'heart', 2, 2], ['clove', 'Clove', 'spicy', 'heart', 1.5, 4], ['staranise', 'Star Anise', 'spicy', 'heart', 1.8, 3], ['cumin', 'Cumin', 'spicy', 'heart', 1.5, 4],
    ['violet', 'Violet', 'floral', 'heart', 3, 2], ['magnolia', 'Magnolia', 'floral', 'heart', 4, 3], ['muguet', 'Lily of the Valley', 'floral', 'heart', 4, 2], ['ylang', 'Ylang-Ylang', 'floral', 'heart', 4, 4],
    ['osmanthus', 'Osmanthus', 'floral', 'heart', 7, 3], ['peony', 'Peony', 'floral', 'heart', 3, 2], ['mimosa', 'Mimosa', 'floral', 'heart', 4, 3], ['lotus', 'Lotus', 'floral', 'heart', 3, 2],
    ['caramel', 'Caramel', 'gourmand', 'heart', 1.8, 4], ['almond', 'Bitter Almond', 'gourmand', 'heart', 2, 4], ['pistachio', 'Pistachio', 'gourmand', 'heart', 3, 3], ['coconut', 'Coconut', 'sweet', 'heart', 1.8, 3],
    ['hay', 'Hay', 'aromatic', 'heart', 2, 3], ['cypress', 'Cypress', 'woody', 'heart', 1.5, 2],
    // base, added
    ['guaiac', 'Guaiac Wood', 'woody', 'base', 3, 3], ['cashmeran', 'Cashmere Wood', 'woody', 'base', 2.5, 3], ['cypriol', 'Cypriol', 'woody', 'base', 4, 4], ['suede', 'Suede', 'leather', 'base', 3.5, 3],
    ['myrrh', 'Myrrh', 'amber', 'base', 4, 4], ['styrax', 'Styrax', 'amber', 'base', 3, 4], ['praline', 'Praline', 'gourmand', 'base', 2.5, 4], ['seaweed', 'Seaweed', 'aquatic', 'base', 2.5, 3],
    ['cedarmoss', 'Cedar Moss', 'woody', 'base', 2.5, 3], ['vanillabourbon', 'Bourbon Vanilla', 'gourmand', 'base', 4, 5],
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
    [['blacktea', 'bergamot'], 10, 'Earl Grey'], [['blacktea', 'birch'], 10, 'Lapsang smoke'], [['blacktea', 'honey'], 6, 'Honeyed tea'], [['greentea', 'jasmine'], 8, 'Jasmine tea'],
    [['matcha', 'vanilla'], 6, 'Matcha latte'], [['whitetea', 'musk'], 7, 'Clean tea'], [['mate', 'cedar'], 5, 'Green maté'], [['ginger', 'neroli'], 9, 'Sparkling neroli'],
    [['ginger', 'bergamot'], 7, 'Ginger zest'], [['ginger', 'blacktea'], 6, 'Spiced chai'], [['ginger', 'vetiver'], 5, 'Rooted ginger'], [['neroli', 'orangeblossom'], 6, 'Bigarade'],
    [['neroli', 'greentea'], 6, 'Morning cologne'], [['lime', 'basil'], 6, 'Garden citrus'], [['yuzu', 'ozonic'], 6, 'Rain on citrus'], [['bitterorange', 'neroli'], 6, 'Eau de Cologne'],
    [['cherry', 'almond'], 12, 'Cherry liqueur'], [['plum', 'oud'], 8, 'Plum oud'], [['plum', 'rose'], 6, 'Dark rose'], [['peach', 'osmanthus'], 8, 'Apricot blossom'],
    [['raspberry', 'saffron'], 7, 'Saffron berry'], [['rum', 'vanilla'], 9, 'Spiced rum'], [['cognac', 'tobacco'], 10, 'Cigar lounge'], [['cognac', 'cinnamon'], 6, 'Warm brandy'],
    [['coconut', 'vanilla'], 7, 'Beach vanilla'], [['caramel', 'praline'], 6, 'Salted caramel'], [['pistachio', 'praline'], 6, 'Pistachio cream'], [['clove', 'rose'], 6, 'Spiced rose'],
    [['cumin', 'leather'], 6, 'Animalic leather'], [['violet', 'leather'], 7, 'Violet suede'], [['iris', 'suede'], 8, 'Powdered suede'], [['myrrh', 'incense'], 8, 'Church incense'],
    [['styrax', 'leather'], 6, 'Smoked leather'], [['guaiac', 'oud'], 6, 'Dark woods'], [['cashmeran', 'musk'], 6, 'Cashmere skin'], [['seaweed', 'seasalt'], 7, 'Rock pools'],
    [['aldehydes', 'rose'], 7, 'Aldehydic floral'], [['ylang', 'coconut'], 6, 'Tropical floral'], [['magnolia', 'lemon'], 5, 'Citrus magnolia'], [['hay', 'tobacco'], 7, 'Sun-dried leaf'],
    [['blackpepper', 'vetiver'], 6, 'Peppered vetiver'], [['elemi', 'incense'], 5, 'Resinous citrus'], [['pear', 'ginger'], 6, 'Pear and ginger'], [['cypress', 'incense'], 5, 'Cypress smoke'],
    [['vanillabourbon', 'tobacco'], 10, 'Bourbon tobacco'], [['cypriol', 'oud'], 6, 'Earth oud'],
  ];
  const CLASHES = [
    [['marine', 'oud'], 12], [['marine', 'leather'], 8], [['mint', 'oud'], 8], [['seasalt', 'cacao'], 10], [['coffee', 'marine'], 10], [['lemon', 'leather'], 5],
    [['birch', 'jasmine'], 6], [['pineapple', 'oud'], 6], [['iris', 'marine'], 4], [['mint', 'tuberose'], 6], [['cacao', 'vetiver'], 4], [['seasalt', 'tobacco'], 6], [['cumin', 'seaweed'], 8], [['matcha', 'leather'], 5], [['coconut', 'oud'], 6], [['ozonic', 'praline'], 6], [['cherry', 'seaweed'], 8],
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
  const circle = (r, cy, n = 28) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const HEART = Array.from({ length: 36 }, (_, i) => { const t = (i / 36) * Math.PI * 2; return [0.017 * 16 * Math.pow(Math.sin(t), 3), 0.33 + 0.017 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]; });
  const STAR = Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 0.14 : 0.32; return [Math.cos(a) * r, 0.31 + Math.sin(a) * r]; });
  const ARCH = [[-0.24, 0], [0.24, 0]].concat(Array.from({ length: 13 }, (_, i) => { const a = (i / 12) * Math.PI; return [Math.cos(a) * 0.24, 0.44 + Math.sin(a) * 0.24]; }));
  const VIOLIN = (() => { const r = [[0.21, 0], [0.235, 0.03], [0.238, 0.11], [0.205, 0.26], [0.18, 0.36], [0.19, 0.46], [0.225, 0.56], [0.236, 0.62], [0.21, 0.67], [0.13, 0.7], [0.075, 0.71]]; return r.concat(r.slice().reverse().map(([x, y]) => [-x, y])); })();
  // Louis Vuitton's round bottle: a flat-shouldered cylinder with a short neck.
  const VOYAGER = [[0, 0], [0.17, 0], [0.19, 0.015], [0.196, 0.05], [0.196, 0.45], [0.188, 0.51], [0.16, 0.55], [0.11, 0.575], [0.085, 0.585], [0.08, 0.6], [0, 0.6]];
  const SHAPES = {
    block: { label: 'Classic block', cost: 4, body: { w: 0.5, h: 0.6, d: 0.26, r: 0.02 } },
    tall: { label: 'Tall column', cost: 4, body: { w: 0.34, h: 0.8, d: 0.22, r: 0.02 } },
    slim: { label: 'Slim pillar', cost: 4, body: { w: 0.28, h: 0.84, d: 0.2, r: 0.015 } },
    cube: { label: 'Cube', cost: 5, body: { w: 0.48, h: 0.48, d: 0.48, r: 0.03 } },
    round: { label: 'Apothecary', cost: 5, body: { body: 'lathe', w: 0.5, d: 0.5, h: 0.69, pts: [[0, 0], [0.225, 0], [0.246, 0.016], [0.252, 0.05], [0.252, 0.5], [0.24, 0.565], [0.2, 0.615], [0.13, 0.648], [0.085, 0.662], [0.078, 0.672], [0.078, 0.69], [0, 0.69]] } },
    flask: { label: 'Pebble flask', cost: 6, body: { body: 'pillow', w: 0.58, h: 0.6, d: 0.26, ex: 0.3, ey: 0.3 } },
    hipflask: { label: 'Hip flask', cost: 5, body: { body: 'pillow', w: 0.5, h: 0.64, d: 0.15, ex: 0.22, ey: 0.28 } },
    orb: { label: 'Orb', cost: 7, body: { body: 'sphere', w: 0.58, h: 0.58, d: 0.5 } },
    gem: { label: 'Faceted gem', cost: 9, body: { body: 'cyl', seg: 8, w: 0.56, h: 0.6, d: 0.4 } },
    hexagon: { label: 'Hexagon', cost: 6, body: { body: 'cyl', seg: 6, w: 0.54, h: 0.6, d: 0.54 } },
    triangle: { label: 'Triangle prism', cost: 6, body: { body: 'cyl', seg: 3, w: 0.62, h: 0.6, d: 0.62 } },
    pyramid: { label: 'Pyramid', cost: 8, body: { body: 'cyl', seg: 4, w: 0.18, wb: 0.66, h: 0.56, d: 0.18 } },
    tower: { label: 'Skyline tower', cost: 8, body: { body: 'profile', pts: [[-0.2, 0], [0.2, 0], [0.2, 0.62], [0.12, 0.74], [-0.12, 0.74], [-0.2, 0.62]], round: 0.02, w: 0.4, h: 0.74, d: 0.24 } },
    ingot: { label: 'Gold ingot', cost: 6, body: { body: 'profile', pts: [[-0.3, 0], [0.3, 0], [0.22, 0.56], [-0.22, 0.56]], round: 0.03, w: 0.6, h: 0.56, d: 0.26 } },
    arch: { label: 'Arch', cost: 6, body: { body: 'profile', pts: ARCH, round: 0.01, w: 0.48, h: 0.68, d: 0.22 } },
    disc: { label: 'Disc', cost: 7, body: { body: 'profile', pts: circle(0.3, 0.3), round: 0.01, w: 0.6, h: 0.6, d: 0.15 } },
    heart: { label: 'Heart', cost: 9, body: { body: 'profile', pts: HEART, round: 0.01, w: 0.56, h: 0.58, d: 0.22 } },
    star: { label: 'Star', cost: 10, body: { body: 'profile', pts: STAR, round: 0.03, w: 0.62, h: 0.6, d: 0.2 } },
    violin: { label: 'Violin', cost: 9, body: { body: 'profile', pts: VIOLIN, round: 0.025, w: 0.48, h: 0.71, d: 0.22 } },
    bell: { label: 'Bell jar', cost: 7, body: { body: 'lathe', w: 0.56, d: 0.56, h: 0.64, pts: [[0, 0], [0.27, 0], [0.282, 0.04], [0.262, 0.2], [0.205, 0.42], [0.14, 0.55], [0.09, 0.6], [0.08, 0.64], [0, 0.64]] } },
    decanter: { label: 'Decanter', cost: 8, body: { body: 'lathe', w: 0.64, d: 0.64, h: 0.66, pts: [[0, 0], [0.3, 0], [0.32, 0.03], [0.31, 0.18], [0.22, 0.32], [0.1, 0.42], [0.07, 0.62], [0.08, 0.66], [0, 0.66]] } },
    teardrop: { label: 'Teardrop', cost: 7, body: { body: 'lathe', w: 0.54, d: 0.4, h: 0.62, pts: [[0, 0], [0.12, 0], [0.24, 0.08], [0.27, 0.22], [0.22, 0.4], [0.12, 0.56], [0.07, 0.62], [0, 0.62]] } },
    amphora: { label: 'Amphora', cost: 8, body: { body: 'lathe', w: 0.54, d: 0.54, h: 0.64, pts: [[0, 0], [0.14, 0], [0.2, 0.05], [0.27, 0.25], [0.25, 0.42], [0.14, 0.55], [0.1, 0.6], [0.12, 0.64], [0, 0.64]] } },
    trophy: { label: 'Trophy', cost: 9, body: { body: 'lathe', w: 0.6, d: 0.42, h: 0.62, pts: [[0, 0], [0.18, 0], [0.18, 0.04], [0.07, 0.08], [0.07, 0.16], [0.2, 0.2], [0.29, 0.36], [0.3, 0.56], [0.26, 0.62], [0, 0.62]] } },
    voyager: { label: 'Voyager (Louis Vuitton)', cost: 8, body: { body: 'lathe', w: 0.392, d: 0.392, h: 0.6, pts: VOYAGER, seg: 56 } },
    torso: { label: 'Sculpted torso', cost: 12, body: { body: 'geo', torso: true, w: 0.5, h: 0.77, d: 0.28 } },
  };
  const GLASS = {
    clear: { label: 'Clear glass, juice shows', cost: 0 }, crystal: { label: 'Heavy crystal', cost: 3 },
    tinted: { label: 'Tinted glass', cost: 1 }, smoked: { label: 'Smoked glass', cost: 1 },
    fade: { label: 'Colour fade', cost: 2 }, lacquer: { label: 'Lacquered', cost: 3 },
    frosted: { label: 'Frosted', cost: 2 }, pearl: { label: 'Pearlescent', cost: 4 },
    iridescent: { label: 'Iridescent', cost: 5 }, metal: { label: 'Metallised', cost: 5 }, mirror: { label: 'Mirror chrome', cost: 7 },
    juicefade: { label: 'Clear, juice fades (Louis Vuitton)', cost: 3 },
  };
  const CAPS = {
    cylinder: { label: 'Column', cost: 2 }, cube: { label: 'Cube', cost: 2 }, sphere: { label: 'Ball', cost: 3 }, facetball: { label: 'Faceted ball', cost: 4 },
    faceted: { label: 'Faceted', cost: 4 }, dome: { label: 'Dome', cost: 3 }, mushroom: { label: 'Mushroom', cost: 3 }, crown: { label: 'Crown', cost: 8 },
    tall: { label: 'Obelisk', cost: 4 }, pyramid: { label: 'Pyramid', cost: 4 }, spire: { label: 'Spire', cost: 5 }, flame: { label: 'Flame', cost: 5 },
    teardrop: { label: 'Teardrop', cost: 4 }, rings: { label: 'Stacked rings', cost: 5 }, ring: { label: 'Ring', cost: 4 }, cork: { label: 'Cork', cost: 1 },
    voyager: { label: 'Stacked, flower top (Louis Vuitton)', cost: 6 },
  };
  const FINISH = { gold: 'Gold', rosegold: 'Rose gold', silver: 'Silver', chrome: 'Chrome', gunmetal: 'Gunmetal', bronze: 'Bronze', black: 'Black lacquer', white: 'White', wood: 'Wood', crystal: 'Crystal', colour: 'Bottle colour' };
  const LABELS = { plate: 'Metal plate', paper: 'Paper label', print: 'Printed on glass', tag: 'Hanging tag', voyager: 'Wrap lettering (Louis Vuitton)', none: 'No label' };
  const DECOR = { none: 'None', stripes: 'Sailor stripes', ribs: 'Fine ribs', lattice: 'Lattice', chevron: 'Chevrons', dots: 'Dots', waves: 'Waves', deco: 'Art deco fans', studs: 'Pyramid studs', crest: 'Raised crest', band: 'Metal band' };
  const EXTRAS = { none: 'None', tassel: 'Tassel', pendant: 'Chain pendant', bow: 'Ribbon bow', neckring: 'Neck ring', gem: 'Jewel on the cap', chain: 'Neck chain' };
  // Ready-made looks the designer can start from.
  const PRESETS = {
    lv: {
      label: 'Louis Vuitton',
      design: { shape: 'voyager', glass: 'juicefade', color: '#f6e4b8', juice: '#e2a048', cap: 'voyager', capFin: 'black', label: 'voyager', decor: 'none', extra: 'none', ink: '#141414' },
      box: { style: 'voyager', paper: '#f6f5f1', ink: '#141414', pattern: 'plain', emblem: 'none', foil: false },
    },
  };
  const designCost = (d) => SHAPES[d.shape].cost + GLASS[d.glass].cost + CAPS[d.cap].cost + (['gold', 'rosegold', 'crystal'].includes(d.capFin) ? 2 : 0) + (d.label === 'plate' ? 2 : 0) + ({ none: 0, studs: 4, crest: 3, band: 2 }[d.decor || 'none'] ?? 1) + ({ none: 0, gem: 4, pendant: 3 }[d.extra || 'none'] ?? 2);

  function finishMat(f, d) {
    if (f === 'wood') return { color: '#7a5230', rough: 0.75, coat: 0.1 };
    if (f === 'crystal') return { glass: '#eaf4ff', op: 0.6 };
    if (f === 'white') return { color: '#f2efe8', rough: 0.3 };
    if (f === 'black') return { color: '#0c0c0d', rough: 0.15 };
    if (f === 'rosegold') return { color: '#e3a98c', metal: 1, rough: 0.28, coat: 0 };
    if (f === 'colour') return { color: d.color, rough: 0.2 };
    return { fin: f };
  }
  function capParts(d) {
    const m = finishMat(d.capFin, d);
    const neck = Object.assign({ s: 'cyl', r: 0.055, h: 0.03 }, d.capFin === 'gold' || d.capFin === 'rosegold' ? finishMat(d.capFin, d) : { fin: 'silver' });
    const L = (pts, seg) => ({ s: 'lathe', pts, seg });
    const top = {
      cylinder: [{ s: 'cyl', r: 0.12, h: 0.2 }], cube: [{ s: 'box', w: 0.26, d: 0.2, h: 0.2 }], sphere: [{ s: 'sphere', r: 0.12 }],
      facetball: [L([[0, 0], [0.08, 0.02], [0.13, 0.08], [0.14, 0.14], [0.12, 0.2], [0.07, 0.25], [0, 0.26]], 8)],
      faceted: [{ s: 'cyl', r: 0.15, rb: 0.13, h: 0.18, seg: 6 }], dome: [L([[0, 0], [0.15, 0], [0.15, 0.06], [0.12, 0.13], [0.06, 0.17], [0, 0.18]])],
      mushroom: [{ s: 'cyl', r: 0.05, h: 0.06 }, L([[0, 0], [0.2, 0], [0.2, 0.02], [0.16, 0.08], [0.08, 0.12], [0, 0.13]])],
      crown: [L([[0, 0], [0.13, 0], [0.15, 0.06], [0.11, 0.12], [0.14, 0.2], [0.09, 0.2], [0.06, 0.14], [0, 0.26]], 8)],
      tall: [{ s: 'cyl', r: 0.06, rb: 0.09, h: 0.32, seg: 4 }], pyramid: [{ s: 'cyl', r: 0.005, rb: 0.15, h: 0.22, seg: 4 }],
      spire: [L([[0, 0], [0.09, 0], [0.1, 0.04], [0.05, 0.12], [0.035, 0.3], [0, 0.42]], 24)],
      flame: [L([[0, 0], [0.07, 0], [0.11, 0.06], [0.1, 0.14], [0.06, 0.22], [0.02, 0.3], [0, 0.34]], 24)],
      teardrop: [L([[0, 0], [0.04, 0], [0.1, 0.06], [0.12, 0.12], [0.08, 0.2], [0.03, 0.26], [0, 0.28]], 32)],
      rings: [0, 1, 2, 3].map((i) => ({ s: 'cyl', r: i % 2 ? 0.1 : 0.13, h: 0.045 })),
      ring: [{ s: 'cyl', r: 0.05, h: 0.04 }, { s: 'ring', r: 0.1, tube: 0.026 }],
      cork: [{ s: 'cyl', r: 0.085, rb: 0.075, h: 0.16 }],
      voyager: [{ s: 'cyl', r: 0.085, h: 0.05 }, { s: 'cyl', r: 0.1, rb: 0.085, h: 0.025 }, { s: 'cyl', r: 0.075, h: 0.035 }, L([[0, 0], [0.11, 0], [0.135, 0.02], [0.14, 0.07], [0.13, 0.08], [0, 0.08]], 48)],
    }[d.cap];
    const corkMat = { color: '#c49a6c', rough: 0.85, coat: 0 };
    if (d.cap === 'voyager') return top.map((t) => Object.assign(t, m));
    return [neck].concat(top.map((t) => Object.assign(t, d.cap === 'cork' ? corkMat : m)));
  }

  // Painted surface patterns, drawn over the whole front.
  function decorArt(P, kind, ink) {
    const { g, W, H } = P;
    const line = (x1, y1, x2, y2, w = 0.008) => P.line(x1, y1, x2, y2, ink, w);
    if (kind === 'stripes') for (let i = 0; i < 7; i++) P.rect(0, 0.12 + i * 0.1, 1, 0.045, ink);
    if (kind === 'ribs') for (let i = 0; i < 46; i++) line(0, i / 46, 1, i / 46, 0.004);
    if (kind === 'lattice') for (let i = -6; i < 12; i++) { line(i * 0.12, 0, i * 0.12 + 0.6, 1, 0.006); line(i * 0.12 + 0.6, 0, i * 0.12, 1, 0.006); }
    if (kind === 'chevron') for (let i = 0; i < 12; i++) P.path([[0, 0.05 + i * 0.09], [0.5, 0.1 + i * 0.09], [1, 0.05 + i * 0.09]], ink, false, 0.012);
    if (kind === 'dots') for (let y = 0.05; y < 1; y += 0.08) for (let x = 0.06; x < 1; x += 0.1) P.circle(x + ((Math.round(y / 0.08) % 2) * 0.05), y, 0.012, ink);
    if (kind === 'waves') for (let i = 0; i < 14; i++) P.path(Array.from({ length: 17 }, (_, j) => [j / 16, 0.04 + i * 0.07 + Math.sin(j * 0.9 + i) * 0.015]), ink, false, 0.006);
    if (kind === 'deco') for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const cx = 0.125 + c * 0.25, cy = 0.2 + r * 0.25; for (let k = 1; k < 5; k++) { g.beginPath(); g.arc(cx * W, cy * H, k * 0.03 * H, Math.PI, 0); g.strokeStyle = ink; g.lineWidth = 0.004 * H; g.stroke(); } }
  }
  // Raised or attached details as geometry (studs, crest, band and the accessories).
  function extras(d, sh) {
    const fns = [], fm = finishMat(d.capFin, d);
    const H = sh.h, W = sh.w, D = sh.d;
    fns.push((k) => {
      const B = BottleCraft.tools, T = B.T, mat = B.matOf(fm);
      const z = D / 2;
      if (d.decor === 'studs') { const gs = []; for (let y = 0.1; y < H - 0.06; y += 0.07) for (let x = -W / 2 + 0.06; x < W / 2 - 0.04; x += 0.07) { const c = new T.ConeGeometry(0.022, 0.03, 4); c.rotateX(Math.PI / 2); c.rotateZ(Math.PI / 4); c.translate(x, y, z + 0.012); gs.push(c); } if (gs.length) k.part(B.merge(gs), mat); }
      if (d.decor === 'crest') { const cy = H * 0.78, cr = Math.min(0.07, H * 0.11); const c = new T.CylinderGeometry(cr, cr, 0.02, 40); c.rotateX(Math.PI / 2); c.translate(0, cy, z + 0.008); k.part(c, mat); const r = new T.TorusGeometry(cr, 0.007, 8, 40); r.translate(0, cy, z + 0.016); k.part(r, mat); }
      if (d.decor === 'band') { const b = sh.body === 'lathe' || sh.body === 'sphere' || (sh.body === 'cyl' && !sh.seg) ? new T.CylinderGeometry(W / 2 + 0.008, W / 2 + 0.008, 0.06, 48) : new T.BoxGeometry(W + 0.016, 0.06, D + 0.016); if (b.type === 'CylinderGeometry') b.scale(1, 1, D / W); b.translate(0, H * 0.3, 0); k.part(b, mat); }
      const neckY = H + 0.015;
      if (d.extra === 'tassel') { const tc = B.solid({ color: d.ink, rough: 0.8, coat: 0 }), tz = z + 0.03, tx = Math.min(0.12, W * 0.3); k.part(B.cyl(0.006, 0.006, 0.2, neckY - 0.2, 6, tx, tz), tc); k.part(B.sphere(0.024, neckY - 0.2).translate(tx, 0, tz), tc); k.part(B.cyl(0.014, 0.05, 0.2, neckY - 0.44, 14, tx, tz), tc); }
      if (d.extra === 'pendant') { const tz = z + 0.025, tx = Math.min(0.1, W * 0.25); k.part(B.cyl(0.004, 0.004, 0.22, neckY - 0.22, 6, tx, tz), mat); const c = new T.CylinderGeometry(0.065, 0.065, 0.014, 32); c.rotateX(Math.PI / 2); c.translate(tx, neckY - 0.28, tz + 0.01); k.part(c, mat); }
      if (d.extra === 'bow') { const bc = B.solid({ color: d.ink, rough: 0.5, coat: 0.3 }); for (const s of [-1, 1]) k.part(B.sphere(0.06, neckY - 0.03, 1.1, 0.6, 0.35).translate(s * 0.06, 0, z * 0.3 + 0.06), bc); k.part(B.sphere(0.025, neckY - 0.03).translate(0, 0, z * 0.3 + 0.07), bc); }
      if (d.extra === 'neckring') { const r = new T.TorusGeometry(0.082, 0.022, 10, 40); r.rotateX(Math.PI / 2); r.translate(0, neckY, 0); k.part(r, mat); }
      if (d.extra === 'chain') { for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = new T.TorusGeometry(0.018, 0.005, 6, 12); r.rotateY(a + (i % 2) * Math.PI / 2); r.translate(Math.cos(a) * 0.085, neckY - 0.01, Math.sin(a) * 0.085); k.part(r, mat); } }
      if (d.cap === 'voyager') {
        // The monogram flower inlaid in the cap top.
        const dark = ['black', 'gunmetal', 'wood'].includes(d.capFin) || (d.capFin === 'colour' && new T.Color(d.color).getHSL({}).l < 0.4);
        const lid = new T.PlaneGeometry(0.2, 0.2); lid.rotateX(-Math.PI / 2); lid.translate(0, H + 0.192, 0);
        const flower = B.paint(0.2, 0.2, (P) => { for (let i = 0; i < 4; i++) P.ellipse(0.5, 0.5, 0.4, 0.12, i * Math.PI / 4, dark ? 'rgba(190,190,195,0.85)' : 'rgba(40,40,44,0.55)'); P.circle(0.5, 0.5, 0.08, dark ? '#0c0c0c' : 'rgba(255,255,255,0.5)'); });
        k.part(lid, new T.MeshStandardMaterial({ map: flower, transparent: true, metalness: 0.6, roughness: 0.3, depthWrite: false }), 4);
      }
      if (d.extra === 'gem') { const capTop = H + 0.03 + ({ cylinder: 0.2, cube: 0.2, sphere: 0.24, facetball: 0.26, faceted: 0.18, dome: 0.18, mushroom: 0.19, crown: 0.26, tall: 0.32, pyramid: 0.22, spire: 0.42, flame: 0.34, teardrop: 0.28, rings: 0.18, ring: 0.24, cork: 0.16, voyager: 0.16 }[d.cap] || 0.2); k.part(B.sphere(0.035, capTop + 0.02, 1, 1, 1), B.glass({ tint: d.juice, op: 0.85 })); }
    });
    return fns;
  }

  // A BottleCraft spec from a design (uses the generic builder from bottles-designer.js).
  function bottleSpec(d, info) {
    return () => {
      const B = BottleCraft.tools, sh = SHAPES[d.shape].body;
      const o = Object.assign({}, sh);
      if (sh.torso) o.geo = () => B.torsoGeo(B.TORSO_MALE, { sculpt: 1.2 });
      const H = sh.h, W = sh.w;
      const darker = (hex, k) => { const c = new B.T.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
      if (d.glass === 'clear') { o.juice = d.juice; o.level = 0.9; o.inset = 0.93; }
      else if (d.glass === 'crystal') { o.glass = '#f4f8ff'; o.op = 0.32; o.juice = d.juice; o.level = 0.86; o.inset = 0.84; }
      else if (d.glass === 'tinted') { o.glass = d.color; o.op = 0.82; o.juice = d.juice; o.level = 0.88; o.jop = 0.5; }
      else if (d.glass === 'smoked') { o.glass = darker(d.color, 0.45); o.op = 0.9; o.juice = darker(d.juice, 0.6); o.level = 0.88; o.jop = 0.5; }
      else if (d.glass === 'fade') { o.solid = '#ffffff'; o.grad = [d.juice, d.color]; o.gc = 0.9; o.rough = 0.15; o.coat = 0.5; o.env = 1; }
      else if (d.glass === 'iridescent') { o.solid = '#ffffff'; o.grad = [d.juice, d.color]; o.metal = 0.55; o.rough = 0.18; }
      else if (d.glass === 'lacquer') { o.solid = d.color; o.rough = 0.18; o.coat = 0.7; }
      else if (d.glass === 'frosted') { o.solid = d.color; o.rough = 0.65; o.coat = 0.1; o.env = 1; }
      else if (d.glass === 'pearl') { o.solid = d.color; o.metal = 0.35; o.rough = 0.3; o.coat = 0.9; }
      else if (d.glass === 'metal') { o.solid = d.color; o.metal = 0.9; o.rough = 0.25; }
      else if (d.glass === 'mirror') { o.solid = d.color; o.metal = 1; o.rough = 0.06; o.env = 2.6; }
      else if (d.glass === 'juicefade') { o.juice = d.juice; o.jgrad = [d.juice, d.color]; o.level = 0.93; o.inset = 0.965; o.jop = 0.88; o.env = 2.6; }
      o.cap = capParts(d);
      const wrap = sh.body === 'lathe' || sh.body === 'sphere' || (sh.body === 'cyl' && !sh.seg);
      const art = [];
      if (d.decor && !['none', 'studs', 'crest', 'band'].includes(d.decor)) art.push({ w: W * 0.96, h: H * 0.94, y: H / 2, wrap, arc: 2.4, draw: (P) => decorArt(P, d.decor, d.ink + '66') });
      if (d.label === 'voyager') {
        // Louis Vuitton's lettering: the name in bold tracked capitals, the house in light capitals beneath.
        art.push({
          h: Math.min(0.1, H * 0.17), y: H / 2, wrap, arc: 1.4, w: wrap ? undefined : W * 0.86,
          t: [[info.name.toUpperCase(), 0.3, 0.36, d.ink, { font: 'helv', weight: 700, track: 0.04, maxW: 0.86 }],
            [info.house.toUpperCase(), 0.74, 0.26, d.ink + 'b0', { font: 'helv', weight: 400, track: 0.12, maxW: 0.76 }]],
        });
      } else if (d.label !== 'none' && d.label !== 'tag') {
        const plate = d.label === 'plate', paper = d.label === 'paper';
        const lw = Math.min(W * 0.78, 0.42), lh = Math.min(H * (d.decor === 'crest' ? 0.34 : 0.42), 0.28);
        const bg = plate ? (d.capFin === 'gold' || d.capFin === 'rosegold' ? '#d8b462' : '#cfd3d8') : paper ? info.lbg : 'rgba(0,0,0,0)';
        const ink = plate ? '#1a1a1a' : paper ? info.lfg : (d.ink || info.lfg);
        art.push({
          w: lw, h: lh, y: H * (d.decor === 'crest' ? 0.36 : 0.45), wrap, arc: 1.3, foil: plate, bg, round: plate ? 0.04 : 0.01, frame: paper ? info.lfg : null,
          t: [[info.house.toUpperCase(), 0.2, 0.11, ink, { font: 'roman', weight: 600, track: 0.14, maxW: 0.86 }],
            [info.name, 0.52, 0.22, ink, { font: 'serif', italic: true, maxW: 0.88 }],
            [CONC[info.conc].label.toUpperCase(), 0.82, 0.07, ink, { font: 'helv', track: 0.2, maxW: 0.86 }]],
        });
      }
      if (art.length) o.art = art;
      o.extra = extras(d, sh);
      if (d.label === 'tag') o.extra.push((k) => { const B2 = BottleCraft.tools; k.part(B2.cyl(0.004, 0.004, 0.16, H - 0.14, 6, -0.1, sh.d / 2 + 0.02), B2.solid({ color: '#c8b48a', rough: 0.8 })); k.flat(0.16, 0.1, -0.1, H - 0.2, sh.d / 2 + 0.03, B2.paint(0.16, 0.1, (P) => { P.rect(0, 0, 1, 1, info.lbg, 0.05); P.text(info.name, 0.5, 0.42, 0.28, info.lfg, { font: 'serif', italic: true, maxW: 0.9 }); P.text(info.house.toUpperCase(), 0.5, 0.78, 0.14, info.lfg, { font: 'roman', track: 0.1, maxW: 0.9 }); })); });
      return B.Q(o);
    };
  }

  /* ---------- box designs ---------- */
  const BOX_STYLES = { carton: 'Tuck carton', lid: 'Lift-off lid', sleeve: 'Slide-off sleeve', book: 'Book box (opens like a cover)', chest: 'Chest with clasp', tube: 'Round tube', hexagon: 'Hexagonal tube', octagon: 'Octagonal tube', tin: 'Metal tin', voyager: 'White drum, gold collar (Louis Vuitton)' };
  const PATTERNS = { plain: 'Plain', border: 'Fine border', double: 'Double frame', stripes: 'Pinstripes', band: 'Centre band', monogram: 'Monogram', damask: 'Damask', lattice: 'Lattice', greekkey: 'Greek key', chevron: 'Chevrons', dots: 'Polka dots', deco: 'Art deco', stars: 'Starry night', waves: 'Waves', marble: 'Marble', leather: 'Leather grain', croc: 'Croc embossed', wood: 'Wood grain', gradient: 'Gradient wash' };
  const EMBLEMS = { none: 'None', seal: 'Wax seal', crest: 'Crest', medallion: 'Monogram medallion' };
  const rnd = (i) => { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); };
  function boxPattern(P, kind, ink, paper, mono) {
    const { g, W, H } = P, faint = ink + '30', mid = ink + '55';
    if (kind === 'stripes') for (let i = 0; i < 60; i++) P.line(i / 60, 0, i / 60, 1, faint, 0.0012);
    if (kind === 'border') P.frame(0.06, 0.04, 0.88, 0.92, ink, 0.004);
    if (kind === 'double') { P.frame(0.05, 0.035, 0.9, 0.93, ink, 0.005); P.frame(0.075, 0.05, 0.85, 0.9, ink, 0.002); }
    if (kind === 'band') P.rect(0, 0.4, 1, 0.14, ink);
    if (kind === 'monogram') for (let y = 0.04; y < 1; y += 0.07) for (let x = 0.08; x < 1; x += 0.16) P.text(mono, x + ((Math.round(y / 0.07) % 2) * 0.08), y, 0.03, faint, { font: 'serif', weight: 600 });
    if (kind === 'damask') for (let y = 0; y < 1.1; y += 0.12) for (let x = 0; x < 1.1; x += 0.25) { const cx = x + ((Math.round(y / 0.12) % 2) * 0.125); P.ellipse(cx, y, 0.05, 0.045, 0, faint); P.ellipse(cx, y - 0.04, 0.02, 0.03, 0, faint); P.ellipse(cx - 0.05, y + 0.02, 0.025, 0.012, 0.6, faint); P.ellipse(cx + 0.05, y + 0.02, 0.025, 0.012, -0.6, faint); }
    if (kind === 'lattice') for (let i = -8; i < 16; i++) { P.line(i * 0.1, 0, i * 0.1 + 0.6, 1, faint, 0.003); P.line(i * 0.1 + 0.6, 0, i * 0.1, 1, faint, 0.003); }
    if (kind === 'greekkey') for (const y of [0.05, 0.93]) for (let x = 0; x < 1; x += 0.1) P.path([[x, y + 0.02], [x, y - 0.02], [x + 0.07, y - 0.02], [x + 0.07, y + 0.01], [x + 0.03, y + 0.01], [x + 0.03, y], [x + 0.05, y]], ink, false, 0.003);
    if (kind === 'chevron') for (let i = 0; i < 20; i++) P.path([[0, 0.02 + i * 0.05], [0.5, 0.045 + i * 0.05], [1, 0.02 + i * 0.05]], faint, false, 0.004);
    if (kind === 'dots') for (let y = 0.03; y < 1; y += 0.05) for (let x = 0.04; x < 1; x += 0.09) P.circle(x + ((Math.round(y / 0.05) % 2) * 0.045), y, 0.006, mid);
    if (kind === 'deco') for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) { const cx = 0.1 + c * 0.2, cy = 0.1 + r * 0.14; for (let k = 1; k < 4; k++) { g.beginPath(); g.arc(cx * W, cy * H, k * 0.022 * H, Math.PI, 0); g.strokeStyle = faint; g.lineWidth = 0.002 * H; g.stroke(); } }
    if (kind === 'stars') for (let i = 0; i < 160; i++) P.circle(rnd(i), rnd(i + 500), 0.001 + rnd(i + 9) * 0.003, i % 9 ? mid : ink);
    if (kind === 'waves') for (let i = 0; i < 26; i++) P.path(Array.from({ length: 17 }, (_, j) => [j / 16, 0.02 + i * 0.04 + Math.sin(j * 0.9 + i) * 0.008]), faint, false, 0.002);
    if (kind === 'marble') for (let i = 0; i < 12; i++) P.path(Array.from({ length: 10 }, (_, j) => [j / 9, rnd(i) + (j / 9) * (rnd(i + 5) - 0.5) * 0.6 + Math.sin(j * 1.7 + i) * 0.02]), ink + (i % 3 ? '22' : '44'), false, 0.002 + rnd(i + 2) * 0.004);
    if (kind === 'leather') for (let i = 0; i < 1600; i++) P.circle(rnd(i), rnd(i + 999), 0.0015 + rnd(i + 3) * 0.003, 'rgba(0,0,0,0.12)');
    if (kind === 'croc') for (let y = 0; y < 1.05; y += 0.04) for (let x = 0; x < 1.05; x += 0.07) P.frame(x + ((Math.round(y / 0.04) % 2) * 0.035) + 0.004, y + 0.004, 0.062, 0.032, 'rgba(0,0,0,0.25)', 0.0015);
    if (kind === 'wood') for (let i = 0; i < 70; i++) P.path(Array.from({ length: 9 }, (_, j) => [i / 70 + Math.sin(j * 0.8 + i * 0.3) * 0.006, j / 8]), 'rgba(0,0,0,' + (0.08 + rnd(i) * 0.12) + ')', false, 0.0015);
    if (kind === 'gradient') { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0.35)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  }
  function emblem(P, kind, ink, paper, mono, y = 0.3) {
    const ax = P.H / P.W;
    if (kind === 'seal') { P.circle(0.5, y, 0.05, '#8a1a1a'); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; P.circle(0.5 + Math.cos(a) * 0.048 * ax, y + Math.sin(a) * 0.048, 0.012, '#8a1a1a'); } P.circle(0.5, y, 0.034, '#a42424'); P.text(mono, 0.5, y, 0.035, '#5a0e0e', { font: 'serif', weight: 700 }); }
    if (kind === 'crest') { P.path([[0.5 - 0.05 * ax, y - 0.05], [0.5 + 0.05 * ax, y - 0.05], [0.5 + 0.05 * ax, y], [0.5, y + 0.05], [0.5 - 0.05 * ax, y]], ink); P.text(mono, 0.5, y - 0.012, 0.03, paper, { font: 'serif', weight: 700 }); for (const s of [-1, 1]) P.ellipse(0.5 + s * 0.085 * ax, y - 0.01, 0.025, 0.045, s * 0.4, ink + '99'); }
    if (kind === 'medallion') { P.circle(0.5, y, 0.055, ink); P.circle(0.5, y, 0.047, paper); P.circle(0.5, y, 0.043, ink, 0.002); P.text(mono, 0.5, y, 0.04, ink, { font: 'serif', weight: 600 }); }
  }
  function boxSpec(b, info) {
    return (item, fit) => {
      const L = BoxCraft.lib, mono = info.house.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
      const em = b.emblem || 'none', hasEm = em !== 'none';
      const front = (P) => {
        L.fullBg(P, b.paper);
        boxPattern(P, b.pattern, b.ink, b.paper, mono);
        const onBand = b.pattern === 'band';
        if (hasEm) emblem(P, em, b.ink, b.paper, mono, 0.14);
        L.tx(P, info.house.toUpperCase(), hasEm ? 0.26 : 0.18, 0.03, b.ink, 'roman', { weight: 600, track: 0.18, maxW: 0.8 });
        L.tx(P, info.name, 0.47, 0.045, onBand ? b.paper : b.ink, 'serif', { italic: true, maxW: 0.84 });
        L.tx(P, CONC[info.conc].label.toUpperCase(), 0.62, 0.012, b.ink, 'sans', { track: 0.3 });
        L.tx(P, info.city.toUpperCase(), 0.86, 0.012, b.ink, 'sans', { track: 0.4 });
        L.tx(P, '100 ml ℮ 3.4 FL.OZ.', 0.92, 0.01, b.ink, 'sans', { track: 0.1 });
      };
      const roundFront = (P) => {
        L.fullBg(P, 'rgba(0,0,0,0)');
        if (hasEm) emblem(P, em, b.ink, b.paper, mono, 0.2);
        L.tx(P, info.house.toUpperCase(), 0.32, 0.025, b.ink, 'roman', { weight: 600, track: 0.18, maxW: 0.8 });
        L.tx(P, info.name, 0.5, 0.04, b.ink, 'serif', { italic: true, maxW: 0.84 });
        L.tx(P, CONC[info.conc].label.toUpperCase(), 0.6, 0.012, b.ink, 'sans', { track: 0.3 });
      };
      const top = (P) => { L.fullBg(P, b.paper); boxPattern(P, b.pattern === 'band' ? 'plain' : b.pattern, b.ink, b.paper, mono); if (hasEm) emblem(P, em === 'none' ? 'medallion' : em, b.ink, b.paper, mono, 0.5); else P.text(mono, 0.5, 0.5, 0.4, b.ink, { font: 'serif', weight: 600 }); };
      const foil = !!b.foil;
      const paperMat = { color: b.paper, rough: b.pattern === 'leather' || b.pattern === 'croc' ? 0.7 : 0.55 };
      const tubeR = Math.max(0.24, Math.hypot(fit.w, fit.d) / 2 + 0.04), tubeH = fit.h + 0.14;
      if (b.style === 'voyager') {
        // Louis Vuitton's white drum: a tall sleeve that lifts off a gold collar.
        const dh = Math.max(1.3, fit.h + 0.3);
        return {
          shape: 'round', r: Math.max(0.29, Math.hypot(fit.w, fit.d) / 2 + 0.05), h: dh, lid: dh * 0.83, sleeve: true, arc: 2.0,
          paper: { color: b.paper, rough: 0.7 }, lining: { color: '#ffffff', rough: 0.8 }, collar: { fin: 'gold', h: 0.14 }, foil,
          front: (P) => {
            P.text(info.name.toUpperCase(), 0.5, 0.405, 0.03, 'rgba(160,160,160,0.9)', { font: 'helv', weight: 500, track: 0.04, maxW: 0.66 });
            P.text(info.house.toUpperCase(), 0.5, 0.45, 0.032, b.ink, { font: 'helv', weight: 700, track: 0.03, maxW: 0.66 });
          },
        };
      }
      if (b.style === 'tube' || b.style === 'hexagon' || b.style === 'octagon') {
        const seg = { tube: 0, hexagon: 6, octagon: 8 }[b.style];
        return { shape: 'round', seg: seg || undefined, r: tubeR, h: tubeH, lid: tubeH * 0.32, arc: seg ? 1.45 : 1.7, paper: paperMat, lining: b.ink, foil, front: roundFront, top };
      }
      // A tin: metal can with ribs at the foot and a printed label band in the house colours.
      if (b.style === 'tin') return { shape: 'round', r: tubeR, h: tubeH, lid: tubeH * 0.16, arc: 2.6, ribs: 3, paper: { color: '#c9ced4', metal: 0.9, rough: 0.28 }, ribColor: { color: '#d8dce0', metal: 1, rough: 0.22 }, lining: '#a8a8a8', foil, front: (P) => { P.rect(0, 0.3, 1, 0.42, b.paper); boxPattern(P, b.pattern, b.ink, b.paper, mono); P.rect(0, 0, 1, 0.3, 'rgba(0,0,0,0)'); roundFront(P); }, top };
      const dims = L.prop(fit, b.style === 'chest' ? 0.78 : 0.62, b.style === 'chest' ? 0.6 : 0.38);
      const shared = { paper: paperMat, lining: b.ink, front, top, foil };
      if (b.style === 'lid') return Object.assign(dims, { lid: 0.3 }, shared);
      if (b.style === 'sleeve') return Object.assign(dims, { lid: 0.86, sleeve: true }, shared);
      if (b.style === 'book') return Object.assign(dims, { open: 'flap', book: true, clasp: 'gold' }, shared);
      if (b.style === 'chest') return Object.assign(dims, { open: 'flap', chest: true, clasp: 'gold' }, shared);
      return Object.assign(dims, { open: 'flap' }, shared);
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

  /* ---------- product photos for the house website ---------- */
  // Renders a creation's bottle (or boxed bottle) once to a transparent PNG and caches it.
  const Snap = (() => {
    let r = null, scene, cam; const cache = {};
    function init() {
      const T = window.THREE, L = typeof Showroom !== 'undefined' && Showroom.lib;
      if (!T || !L) return false;
      if (r) return true;
      try { r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch (e) { return false; }
      r.setSize(320, 400); r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
      scene = new T.Scene(); scene.environment = L.buildEnvironment(r);
      scene.add(new T.HemisphereLight('#fff6ec', '#3a2c22', 0.8));
      const d = new T.DirectionalLight('#ffffff', 1.15); d.position.set(2, 4, 5); scene.add(d);
      cam = new T.PerspectiveCamera(28, 320 / 400, 0.05, 30);
      return true;
    }
    function shot(item, mode = 'bottle') {
      const key = item.id + ':' + mode;
      if (cache[key]) return cache[key];
      if (!init()) return '';
      const T = window.THREE, L = Showroom.lib;
      let g = L.makeBottle(item).group, own = false;
      if (mode === 'box') {
        g.scale.setScalar(0.8); g.updateMatrixWorld(true);
        const s = new T.Box3().setFromObject(g).getSize(new T.Vector3());
        const bx = BoxCraft.build(item, { w: s.x, d: s.z, h: s.y + 0.04 });
        if (bx) { g = bx.group; own = true; g.rotation.y = -0.45; }
      } else g.rotation.y = -0.22;
      scene.add(g); g.updateMatrixWorld(true);
      const bb = new T.Box3().setFromObject(g), c = bb.getCenter(new T.Vector3()), s = bb.getSize(new T.Vector3());
      const dist = Math.max(s.y / 0.84, s.x * 1.2) / (2 * Math.tan(14 * Math.PI / 180)) * 1.08;
      cam.position.set(c.x, c.y + s.y * (mode === 'box' ? 0.3 : 0.06), dist); cam.lookAt(c.x, c.y, 0);
      r.render(scene, cam);
      const url = r.domElement.toDataURL('image/png');
      scene.remove(g);
      if (own) g.traverse((o) => { if (o.geometry && !o.userData.item) o.geometry.dispose(); });
      return (cache[key] = url);
    }
    return { shot };
  })();

  return { Snap, NOTES, NOTE, ACCORDS, CLASHES, CONC, CITIES, PALETTES, SHAPES, GLASS, CAPS, FINISH, LABELS, DECOR, EXTRAS, BOX_STYLES, PATTERNS, EMBLEMS, PRESETS, analyse, longevity, designCost, register, tierFor, bottleSpec, boxSpec, Preview };
})();
