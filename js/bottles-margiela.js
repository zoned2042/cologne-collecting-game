/* Sillage — Maison Margiela Replica, modelled from reference photos.
 * One round apothecary bottle with a cotton-wrapped collar under a silver sprayer;
 * each scent has its own juice and a typed museum-style label.
 */
(() => {
  const B = BottleCraft.tools;
  const { kit, cyl, lathe, gradient, glass, solid, fin, paint } = B;
  const T = () => B.T;

  const PTS = [[0, 0], [0.225, 0], [0.246, 0.016], [0.252, 0.05], [0.252, 0.5], [0.24, 0.565], [0.2, 0.615], [0.13, 0.648], [0.085, 0.662], [0.078, 0.672], [0.078, 0.69], [0, 0.69]];
  const R = 0.252;

  function label(P, o) {
    const ink = '#111111', type = '#2a2a2a', mono = { font: 'helv', weight: 500 };
    P.rect(0, 0, 1, 1, '#f7f6f2'); P.frame(0.035, 0.03, 0.93, 0.94, '#bdbdbd', 0.004);
    P.text('REPLICA', 0.5, 0.1, 0.11, ink, { font: 'helv', weight: 700, track: 0.04, maxW: 0.7 });
    ['REPRODUCTION OF FAMILIAR', 'SCENTS AND MOMENTS OF VARYING', 'LOCATIONS AND PERIODS'].forEach((s, i) => P.text(s, 0.5, 0.185 + i * 0.038, 0.036, ink, { font: 'helv', weight: 700, maxW: 0.82 }));
    const rows = [['Originally:', o.name], ['Provenance and Period:', o.place], ['Fragrance Description:', o.desc], ['Style Description:', o.style]];
    rows.forEach(([k, v], i) => {
      const y = 0.335 + i * 0.12;
      P.text(k, 0.08, y, 0.056, ink, { font: 'helv', weight: 700, align: 'left' });
      P.text(v, 0.5, y + 0.056, 0.05, type, Object.assign({ maxW: 0.8 }, mono));
      for (let x = 0.12; x < 0.88; x += 0.018) P.line(x, y + 0.075, x + 0.008, y + 0.075, '#9a9a9a', 0.002);
    });
    P.text(o.old ? 'Maison Martin Margiela' : 'Maison Margiela', 0.5, 0.86, o.old ? 0.05 : 0.065, ink, { font: 'serif', weight: 500, maxW: 0.84 });
    P.text('PARIS', 0.5, 0.92, 0.025, ink, { font: 'helv', weight: 700, track: 0.25 });
  }

  const replica = (o) => (item) => {
    const k = kit(), t = T();
    k.glassBody(lathe(PTS, 0, 1, 64), glass({ op: 0.14, env: 2.6 }), null);
    // Juice fading a touch paler towards the shoulder, over a thick frosted base.
    const jg = gradient(lathe(PTS.slice(0, 9).concat([[0, 0.662]]), 0, 1, 64), o.juice, o.top || o.juice, 1.6);
    jg.scale(0.95, 0.955, 0.95); jg.translate(0, 0.03, 0);
    k.part(jg, new t.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: o.op || 1, depthWrite: false }), 1);
    k.part(cyl(R * 0.93, R * 0.97, 0.035, 0.003, 64), glass({ tint: '#f4f4f4', op: 0.55, rough: 0.5 }), 2);
    k.wrap(R + 0.004, 0.4, 0.29, 1.6, paint(1.6 * (R + 0.004), 0.4, (P) => label(P, Object.assign({ name: item.name.replace('Replica ', '') }, o))));
    // Cotton-wrapped collar, then the silver sprayer.
    const cotton = paint(0.6, 0.08, (P) => { P.rect(0, 0, 1, 1, '#f4f2ee'); for (let i = 0; i < 26; i++) P.line(0, i / 26, 1, i / 26 + 0.02, 'rgba(150,145,138,0.35)', 0.012); });
    k.part(lathe([[0, 0], [0.1, 0], [0.104, 0.01], [0.104, 0.06], [0.118, 0.075], [0.118, 0.085], [0, 0.085]], 0.685, 1, 40), solid({ color: '#ffffff', rough: 0.85, coat: 0, map: cotton }));
    k.part(cyl(0.058, 0.062, 0.05, 0.77, 32), fin('chrome'));
    k.part(cyl(0.042, 0.042, 0.035, 0.82, 32), fin('silver'));
    k.part(cyl(0.012, 0.012, 0.012, 0.84, 12, 0, 0.042), solid({ color: '#1a1a1a' }));
    k.top(0.69);
    return k.done();
  };

  BottleCraft.add({
    'margiela|Replica Jazz Club': replica({ juice: '#cf5414', top: '#e88c3e', place: 'Brooklyn, 2013', desc: 'Boozy cocktails and cigars', style: 'Male fragrance', old: true }),
    'margiela|Replica By the Fireplace': replica({ juice: '#b0581a', top: '#d68a40', place: 'Chamonix, 1971', desc: 'Burning wood and chestnuts', style: 'Female and Male fragrance' }),
    'margiela|Replica Lazy Sunday Morning': replica({ juice: '#cfdde6', top: '#eef3f6', op: 0.7, place: 'Florence, 2003', desc: 'Soft skin and bed linen', style: 'Female fragrance', old: true }),
    'margiela|Replica Beach Walk': replica({ juice: '#efd29a', top: '#f6e6c4', op: 0.8, place: 'Calvi, 1972', desc: 'Sunkissed salty skin', style: 'Female fragrance', old: true }),
    'margiela|Replica Coffee Break': replica({ juice: '#b98668', top: '#d8b49c', place: 'Stockholm, 2007', desc: 'Creamy and cozy coffee', style: 'Memory in a fragrance' }),
    'margiela|Replica Bubble Bath': replica({ juice: '#a9d6d0', top: '#d4ece8', op: 0.8, place: 'Beverly Hills, 2005', desc: 'Comforting clean accords', style: 'Female and Male fragrance' }),
    'margiela|Replica Sailing Day': replica({ juice: '#2a7ed0', top: '#7ab6ea', place: 'Pesaro, 2002', desc: 'Aquatic deep sea', style: 'Female and Male fragrance' }),
    'margiela|Replica Whispers in the Library': replica({ juice: '#d8cbbd', top: '#ece4da', op: 0.8, place: 'Oxford, 1987', desc: 'Paper and waxed wood', style: 'Female and Male fragrance' }),
    'margiela|Replica Autumn Vibes': replica({ juice: '#d8641c', top: '#ee9c52', place: 'Montreal, 2018', desc: 'Woody trail and red leaves', style: 'Memory in a fragrance' }),
    'margiela|Replica Under the Lemon Trees': replica({ juice: '#bcd486', top: '#dfeab8', op: 0.82, place: 'Palermo, 1987', desc: 'Relaxing and bright lemon', style: 'Female and Male fragrance' }),
    'margiela|Replica Matcha Meditation': replica({ juice: '#cddcae', top: '#e6eed4', op: 0.8, place: 'Tokyo, 2020', desc: 'Zen moments of matcha tea', style: 'Memory in a fragrance' }),
    'margiela|Replica On a Date': replica({ juice: '#ec7a62', top: '#f6b0a0', place: 'Provence, 2014', desc: 'Grapes and roses', style: 'Memory in a fragrance' }),
  });
})();
