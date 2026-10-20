/* Sillage — game state, economy, careers, minigames and UI. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const short = (n) => {
    const a = Math.abs(n);
    if (a >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (a >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (a >= 1e4) return '$' + (n / 1e3).toFixed(1) + 'K';
    return money(n);
  };

  /* ---------- deterministic randomness ---------- */
  function hash01(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  }
  function rng(seed) {
    let a = Math.floor(hash01(seed) * 4294967296);
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];

  /* ---------- careers ---------- */
  const JOBS = [
    { id: 'packer', title: 'Decant Packer', employer: 'Your kitchen table', wage: 60, vibe: 'fresh', game: 'timing', verb: 'Seal the decant', req: {} },
    { id: 'associate', title: 'Fragrance Counter Associate', employer: 'Department store', wage: 140, vibe: 'sweet', game: 'match', req: { xp: { packer: 4 } } },
    { id: 'reviewer', title: 'Fragrance Reviewer', employer: 'Your YouTube channel', wage: 180, perBottle: 4, vibe: 'amber', game: 'timing', verb: 'Nail the take', req: { owned: 12 } },
    { id: 'manager', title: 'Boutique Manager', employer: 'Niche perfume boutique', wage: 450, vibe: 'woody', game: 'match', req: { xp: { associate: 12 }, course: 'retail' } },
    { id: 'engineer', title: 'Software Engineer', employer: 'Tech company', wage: 900, vibe: 'citrus', game: 'timing', verb: 'Ship the release', req: { course: 'bootcamp' } },
    { id: 'perfumer', title: 'Junior Perfumer', employer: 'Fragrance lab in Grasse', wage: 1400, vibe: 'floral', game: 'match', req: { course: 'grasse', owned: 40 } },
    { id: 'banker', title: 'Investment Banker', employer: 'Wall Street bank', wage: 3200, vibe: 'leather', game: 'timing', verb: 'Close the deal', req: { course: 'mba', anyXp: { engineer: 20, manager: 20 } } },
    { id: 'surgeon', title: 'Surgeon', employer: 'University hospital', wage: 5500, vibe: 'musk', game: 'timing', verb: 'Steady hands', req: { course: 'med' } },
    { id: 'influencer', title: 'Celebrity Influencer', employer: 'Brand deals', wage: 8000, perBottle: 25, vibe: 'sweet', game: 'timing', verb: 'Hit the pose', req: { xp: { reviewer: 40 }, owned: 150 } },
    { id: 'director', title: 'Creative Director', employer: 'Luxury fragrance house', wage: 14000, vibe: 'oud', game: 'match', req: { xp: { perfumer: 30 }, owned: 120 } },
    { id: 'founder', title: 'Tech Founder', employer: 'Your own startup', wage: 26000, volatile: true, vibe: 'citrus', game: 'timing', verb: 'Pitch the investors', req: { xp: { engineer: 40 }, course: 'seed' } },
    { id: 'ceo', title: 'Group CEO', employer: 'Luxury conglomerate', wage: 90000, vibe: 'oud', game: 'timing', verb: 'Run the board meeting', req: { xp: { director: 30 }, course: 'board' } },
  ];
  const JOB = Object.fromEntries(JOBS.map((j) => [j.id, j]));
  const COURSES = [
    { id: 'retail', name: 'Retail Management Certificate', cost: 2500, note: 'Needed for Boutique Manager' },
    { id: 'bootcamp', name: 'Coding Bootcamp', cost: 9000, note: 'Needed for Software Engineer' },
    { id: 'grasse', name: 'Perfumery Diploma, Grasse', cost: 30000, note: 'Needed for Junior Perfumer' },
    { id: 'mba', name: 'MBA', cost: 95000, note: 'Needed for Investment Banker' },
    { id: 'med', name: 'Medical School', cost: 260000, note: 'Needed for Surgeon' },
    { id: 'seed', name: 'Seed Round (your own money)', cost: 600000, note: 'Needed for Tech Founder' },
    { id: 'board', name: 'Board Seat Buy-in', cost: 6000000, note: 'Needed for Group CEO' },
  ];
  const COURSE = Object.fromEntries(COURSES.map((c) => [c.id, c]));
  const SHIFT_NAMES = ['Morning', 'Afternoon', 'Evening'];

  const RANKS = [
    [0, 'Sample Sniffer'], [10, 'Blind Buyer'], [40, 'Decant Dabbler'], [100, 'Shelf Builder'], [250, 'Niche Hunter'],
    [500, 'Connoisseur'], [900, 'Grand Collector'], [1400, 'Living Legend'], [2200, 'Scent Emperor'],
  ];

  const RIVALS = ['@OudBaron', '@BatchCodeBetty', '@NicheNinja', '@SillageSultan', '@DecantDave', '@VintageVera', '@AventusAndy', '@ProjectionPaul'];

  /* ---------- state ---------- */
  const SAVE_KEY = 'sillage-save-v1';
  function freshState() {
    return {
      v: 1, cash: 250, day: 1, shift: 0, job: 'packer', xp: {}, courses: {}, owned: {}, signature: null, desk: 0,
      stats: { shifts: 0, earned: 0, spent: 0, perfect: 0, sold: 0, matches: 0, auctions: 0 },
      ach: {}, notified: {}, market: null, last: Date.now(), seed: Math.random().toString(36).slice(2, 8),
      settings: { sfx: true, music: true, unbox: true },
    };
  }
  let S = freshState();

  function save() {
    S.last = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage may be blocked */ }
  }
  function loadSaved() {
    try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return JSON.parse(raw); } catch (e) { /* ignore */ }
    return null;
  }
  function adopt(data) {
    const base = freshState();
    S = Object.assign(base, data || {});
    S.stats = Object.assign(freshState().stats, S.stats || {});
    S.settings = Object.assign(freshState().settings, S.settings || {});
    // Drop items that no longer exist in the catalog.
    for (const id of Object.keys(S.owned)) if (!ITEM_BY_ID[id]) delete S.owned[id];
    if (S.signature && !S.owned[S.signature]) S.signature = null;
    if (!JOB[S.job]) S.job = 'packer';
  }

  /* ---------- economy ---------- */
  const ownedCount = () => Object.keys(S.owned).length;
  const owns = (id) => !!S.owned[id];
  function value(item) {
    if (item.limited) return item.base * (1 + 0.003 * (S.day - 1));
    if (item.disc) return item.base * 1.35 * (1 + 0.008 * (S.day - 1));
    return item.base * (0.9 + 0.2 * hash01(S.seed + item.id + ':' + S.day));
  }
  const dealFor = (id) => (S.market && S.market.deals.find((d) => d.id === id)) || null;
  function shopPrice(item) { const d = dealFor(item.id); return Math.round(value(item) * (d ? 1 - d.off : 1)); }
  const vaultPrice = (item) => Math.round(value(item) * 1.25);
  const sellPrice = (item) => Math.round(value(item) * (item.disc || item.limited ? 0.95 : 0.7));
  function collectionValue() { let v = 0; for (const id in S.owned) v += value(ITEM_BY_ID[id]); return v; }
  function prestige() { let p = 0; for (const id in S.owned) p += TIERS[ITEM_BY_ID[id].tier].pts; return p; }
  function rankInfo() {
    const p = prestige(); let i = 0;
    while (i + 1 < RANKS.length && p >= RANKS[i + 1][0]) i++;
    const next = RANKS[i + 1];
    return { name: RANKS[i][1], p, next: next ? next[1] : null, pct: next ? (p - RANKS[i][0]) / (next[0] - RANKS[i][0]) : 1, need: next ? next[0] - p : 0 };
  }
  function houseProgress(hid) { const items = CATALOG.filter((c) => c.house === hid); return { own: items.filter((c) => owns(c.id)).length, total: items.length }; }
  const housesComplete = () => HOUSES.filter((h) => { const p = houseProgress(h.id); return p.own === p.total; }).length;

  function batchCode(seed) {
    const r = rng(seed); const L = 'ABCDEFGHJKLMNPRSTUVWXYZ';
    return L[Math.floor(r() * L.length)] + String(Math.floor(r() * 9000) + 1000) + L[Math.floor(r() * L.length)] + '0' + Math.floor(r() * 9 + 1);
  }

  function genMarket() {
    const r = rng(S.seed + ':market:' + S.day);
    const shop = CATALOG.filter((c) => !c.disc && !c.limited);
    const deals = []; const seen = new Set();
    while (deals.length < 8) {
      const c = pick(shop, r); if (seen.has(c.id)) continue; seen.add(c.id);
      deals.push({ id: c.id, off: Math.round((0.2 + r() * 0.25) * 100) / 100 });
    }
    const vault = CATALOG.filter((c) => c.disc || c.limited);
    const lots = []; const seenL = new Set();
    let guard = 0;
    while (lots.length < 3 && guard++ < 100) {
      // Legendary lots are rarer than vintage ones.
      let c = pick(vault, r);
      if (c.limited && r() < 0.55) continue;
      if (seenL.has(c.id)) continue; seenL.add(c.id);
      lots.push({ id: c.id, sold: false });
    }
    S.market = { day: S.day, deals, lots };
  }
  function ensureMarket() { if (!S.market || S.market.day !== S.day) genMarket(); }

  /* ---------- signature scent bonus ---------- */
  function sigBonus(job) {
    if (!S.signature) return { total: 0, parts: [] };
    const it = ITEM_BY_ID[S.signature]; const parts = [['Wearing a scent', 0.05]];
    if (it.family === job.vibe) parts.push([FAMILIES[job.vibe].label + ' suits this job', 0.3]);
    const tierB = { niche: 0.05, luxury: 0.1, haute: 0.2, legendary: 0.2 }[it.tier];
    if (tierB) parts.push([TIERS[it.tier].label + ' bottle', tierB]);
    return { total: parts.reduce((a, p) => a + p[1], 0), parts };
  }
  function baseWage(job) { return job.wage + (job.perBottle || 0) * ownedCount(); }

  /* ---------- requirements ---------- */
  function reqList(job) {
    const out = []; const q = job.req;
    if (q.xp) for (const [j, n] of Object.entries(q.xp)) out.push({ text: `${n} shifts as ${JOB[j].title}`, ok: (S.xp[j] || 0) >= n, have: Math.min(n, S.xp[j] || 0), n });
    if (q.anyXp) {
      const ents = Object.entries(q.anyXp);
      out.push({ text: ents.map(([j, n]) => `${n} shifts as ${JOB[j].title}`).join(' or '), ok: ents.some(([j, n]) => (S.xp[j] || 0) >= n) });
    }
    if (q.owned) out.push({ text: `Own ${q.owned} bottles`, ok: ownedCount() >= q.owned, have: Math.min(q.owned, ownedCount()), n: q.owned });
    if (q.course) out.push({ text: COURSE[q.course].name, ok: !!S.courses[q.course] });
    return out;
  }
  const jobOpen = (job) => reqList(job).every((r) => r.ok);

  /* ---------- achievements ---------- */
  const countFam = (f) => Object.keys(S.owned).filter((id) => ITEM_BY_ID[id].family === f).length;
  const pairOwned = (p) => p.every((k) => ITEM_BY_KEY[k] && owns(ITEM_BY_KEY[k].id));
  const ACH = [
    { id: 'first', name: 'First Spritz', desc: 'Own your first bottle', reward: 100, test: () => ownedCount() >= 1 },
    { id: 'sig', name: 'Signature Scent', desc: 'Wear a bottle as your signature', reward: 50, test: () => !!S.signature },
    { id: 'ten', name: 'Shelf Starter', desc: 'Own 10 bottles', reward: 500, test: () => ownedCount() >= 10 },
    { id: 'clone', name: 'Clone Wars', desc: 'Own an original and its well-known inspired-by twin', reward: 750, test: () => CLONE_PAIRS.some(pairOwned) },
    { id: 'house1', name: 'House Patron', desc: 'Complete every bottle from one house', reward: 1000, test: () => housesComplete() >= 1 },
    { id: 'perfect', name: 'Perfect Spritz', desc: 'Land 10 perfect shifts', reward: 1500, test: () => S.stats.perfect >= 10 },
    { id: 'auction', name: 'Hammer Down', desc: 'Win a vault auction', reward: 2000, test: () => S.stats.auctions >= 1 },
    { id: 'trinity', name: 'Holy Trinity', desc: 'Own Aventus, Baccarat Rouge 540 and Oud Wood', reward: 3000, test: () => ['creed|Aventus', 'mfk|Baccarat Rouge 540', 'tomford|Oud Wood'].every((k) => owns(ITEM_BY_KEY[k].id)) },
    { id: 'seller', name: 'Top Seller', desc: 'Match 25 customers to the right bottle', reward: 3000, test: () => S.stats.matches >= 25 },
    { id: 'arab', name: 'Middle East Masters', desc: 'Own 20 bottles from Afnan, Rayhaan, Lattafa, Armaf and Rasasi', reward: 4000, test: () => Object.keys(S.owned).filter((id) => ['afnan', 'rayhaan', 'lattafa', 'armaf', 'rasasi'].includes(ITEM_BY_ID[id].house)).length >= 20 },
    { id: 'fifty', name: 'Wall of Scent', desc: 'Own 50 bottles', reward: 5000, test: () => ownedCount() >= 50 },
    { id: 'vintage', name: 'Vintage Hunter', desc: 'Own 5 discontinued bottles', reward: 8000, test: () => Object.keys(S.owned).filter((id) => ITEM_BY_ID[id].disc).length >= 5 },
    { id: 'banker', name: 'Corner Office', desc: 'Become an Investment Banker', reward: 10000, test: () => ['banker', 'surgeon', 'influencer', 'director', 'founder', 'ceo'].includes(S.job) || (S.xp.banker || 0) > 0 },
    { id: 'oud', name: 'Oud Baron', desc: 'Own 15 oud fragrances', reward: 10000, test: () => countFam('oud') >= 15 },
    { id: 'clones', name: 'Dupe Detective', desc: 'Own every inspired-by pair', reward: 15000, test: () => CLONE_PAIRS.every(pairOwned) },
    { id: 'house5', name: 'Grand Patron', desc: 'Complete 5 houses', reward: 20000, test: () => housesComplete() >= 5 },
    { id: 'lib', name: 'Fragrance Library', desc: 'Own 150 bottles', reward: 25000, test: () => ownedCount() >= 150 },
    { id: 'grail', name: 'Holy Grail', desc: 'Own a Legendary bottle', reward: 50000, test: () => Object.keys(S.owned).some((id) => ITEM_BY_ID[id].limited) },
    { id: 'million', name: 'Million-Dollar Shelf', desc: 'Reach a collection value of $1,000,000', reward: 100000, test: () => collectionValue() >= 1e6 },
    { id: 'museum', name: 'Private Museum', desc: 'Own 300 bottles', reward: 150000, test: () => ownedCount() >= 300 },
    { id: 'house20', name: 'Maison Collector', desc: 'Complete 20 houses', reward: 250000, test: () => housesComplete() >= 20 },
    { id: 'ceo', name: 'Scent Empire', desc: 'Become Group CEO', reward: 500000, test: () => S.job === 'ceo' },
    { id: 'all', name: 'Every Bottle on Earth', desc: 'Own every fragrance in the catalog', reward: 1000000, test: () => ownedCount() >= CATALOG.length },
  ];

  function checkProgress() {
    for (const a of ACH) {
      if (!S.ach[a.id] && a.test()) {
        S.ach[a.id] = S.day; S.cash += a.reward;
        toast(`<b>Trophy: ${esc(a.name)}</b><span>${esc(a.desc)}. Reward ${money(a.reward)}</span>`, 'gold');
        SFX.play('unlock');
      }
    }
    for (const j of JOBS) {
      if (j.id !== S.job && !S.notified[j.id] && jobOpen(j) && JOBS.indexOf(j) > JOBS.indexOf(JOB[S.job])) {
        S.notified[j.id] = true;
        toast(`<b>New job open: ${esc(j.title)}</b><span>${money(baseWage(j))} per shift. Apply in Career.</span>`, 'job');
      }
    }
  }

  /* ---------- toasts ---------- */
  function toast(html, kind = '') {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.innerHTML = html;
    $('#toasts').appendChild(t);
    setTimeout(() => t.classList.add('out'), 4200);
    setTimeout(() => t.remove(), 4800);
  }
  function floatText(text, el) {
    const r = el.getBoundingClientRect(); const f = document.createElement('div');
    f.className = 'float-num'; f.textContent = text;
    f.style.left = r.left + r.width / 2 + 'px'; f.style.top = r.top + 'px';
    document.body.appendChild(f); setTimeout(() => f.remove(), 1300);
  }

  /* ---------- bottle thumbnails (SVG) ---------- */
  const CAPC = { gold: '#d8ae54', silver: '#cfd4da', black: '#1b1b1f', white: '#eeeae2', wood: '#6b4426', blue: '#2459a8', animal: '#c9a050', crystal: '#e6f0ff' };
  function bottleSVG(item, size = 64) {
    const h = HOUSE_BY_ID[item.house]; const liq = FAMILIES[item.family].color; const cap = CAPC[h.cap] || '#222';
    const gid = 'g' + Math.random().toString(36).slice(2, 7);
    const glass = `fill="url(#${gid})" stroke="rgba(255,255,255,.55)" stroke-width="1"`;
    const L = `<rect x="22" y="56" width="16" height="8" rx="1" fill="${h.lbg}" opacity=".9"/>`;
    let body = '', capS = '';
    const rect = (w, ht, rx, cw, ch, crx = 1) => {
      const x = 30 - w / 2, y = 78 - ht;
      body = `<rect x="${x}" y="${y}" width="${w}" height="${ht}" rx="${rx}" ${glass}/>` + `<rect x="${x + 3}" y="${y + ht * 0.25}" width="${w - 6}" height="${ht * 0.72}" rx="${Math.max(0, rx - 2)}" fill="${liq}" opacity=".85"/>`;
      capS = `<rect x="${30 - cw / 2}" y="${y - ch - 2}" width="${cw}" height="${ch}" rx="${crx}" fill="${cap}"/><rect x="27" y="${y - 3}" width="6" height="3" fill="${cap}" opacity=".7"/>`;
    };
    switch (h.shape) {
      case 'cyl': rect(26, 42, 3, 18, 16, 2); break;
      case 'tall': rect(24, 48, 4, 12, 13, 5); break;
      case 'flask': rect(36, 36, 6, 16, 10); break;
      case 'square': rect(32, 32, 3, 20, 14); break;
      case 'pdm': rect(30, 44, 3, 16, 12, 6); body += `<circle cx="30" cy="48" r="5" fill="${cap}"/>`; break;
      case 'lv': rect(32, 30, 9, 18, 10, 4); break;
      case 'apoth': rect(26, 36, 2, 13, 9, 3); break;
      case 'studs': rect(28, 42, 2, 14, 11); body += [0, 1, 2, 3, 4].map((i) => `<circle cx="${19 + i * 5.5}" cy="${41}" r="1.2" fill="${cap === '#1b1b1f' ? '#d8ae54' : cap}"/>`).join(''); break;
      case 'hex': body = `<polygon points="30,34 44,42 44,70 30,78 16,70 16,42" ${glass}/><polygon points="30,44 41,49 41,68 30,74 19,68 19,49" fill="${liq}" opacity=".85"/>`; capS = `<polygon points="30,18 38,22 38,30 30,34 22,30 22,22" fill="${cap}"/>`; break;
      case 'faceted': body = `<polygon points="20,38 40,38 46,52 42,78 18,78 14,52" ${glass}/><polygon points="22,46 38,46 42,54 39,75 21,75 18,54" fill="${liq}" opacity=".85"/>`; capS = `<polygon points="30,14 40,24 30,36 20,24" fill="${cap}" stroke="rgba(255,255,255,.6)"/>`; break;
      case 'crown': rect(26, 40, 4, 14, 8, 2); capS += `<path d="M22 28 L24 20 L27 25 L30 18 L33 25 L36 20 L38 28 Z" fill="${cap}"/>`; break;
      case 'arab': body = `<path d="M30 78 C10 78 10 62 13 52 C16 44 24 42 27 38 L33 38 C36 42 44 44 47 52 C50 62 50 78 30 78 Z" ${glass}/><path d="M30 75 C14 75 14 63 16 56 C18 51 23 49 30 49 C37 49 42 51 44 56 C46 63 46 75 30 75 Z" fill="${liq}" opacity=".85"/>`; capS = `<path d="M30 6 C27 14 23 18 25 24 C22 27 24 32 26 37 L34 37 C36 32 38 27 35 24 C37 18 33 14 30 6 Z" fill="${cap}"/>`; break;
      case 'orb': body = `<circle cx="30" cy="58" r="19" ${glass}/><circle cx="30" cy="60" r="15" fill="${liq}" opacity=".85"/>`; capS = `<rect x="24" y="28" width="12" height="11" rx="2" fill="${cap}"/>`; break;
      case 'apple': body = `<circle cx="30" cy="60" r="18" ${glass}/><circle cx="30" cy="61" r="14" fill="${liq}" opacity=".85"/>`; capS = `<rect x="29" y="32" width="2.5" height="11" fill="${cap}"/><ellipse cx="35" cy="37" rx="5" ry="2.5" fill="${cap}" transform="rotate(-25 35 37)"/>`; break;
      case 'grenade': body = `<ellipse cx="30" cy="60" rx="17" ry="19" ${glass}/><ellipse cx="30" cy="62" rx="13" ry="14" fill="${liq}" opacity=".85"/><rect x="13" y="52" width="34" height="2" fill="#111"/><rect x="13" y="64" width="34" height="2" fill="#111"/>`; capS = `<rect x="26" y="34" width="8" height="8" fill="${cap}"/><circle cx="37" cy="37" r="3.5" fill="none" stroke="${cap}" stroke-width="1.5"/>`; break;
      case 'oval': body = `<ellipse cx="30" cy="58" rx="18" ry="20" ${glass}/><ellipse cx="30" cy="61" rx="14" ry="15" fill="${liq}" opacity=".85"/>`; capS = `<rect x="25" y="22" width="10" height="16" rx="2" fill="${cap}"/>`; break;
      case 'disc': body = `<circle cx="30" cy="58" r="20" ${glass}/><circle cx="30" cy="58" r="15" fill="${liq}" opacity=".85"/>`; capS = `<rect x="24" y="26" width="12" height="11" rx="2" fill="${cap}"/>`; break;
      case 'star': body = `<polygon points="30,30 35,46 52,46 38,56 43,74 30,63 17,74 22,56 8,46 25,46" ${glass}/><polygon points="30,40 33,49 43,49 35,55 38,66 30,60 22,66 25,55 17,49 27,49" fill="${liq}" opacity=".85"/>`; capS = `<rect x="26" y="18" width="8" height="12" rx="2" fill="${cap}"/>`; break;
      case 'bolt': body = `<polygon points="26,30 44,30 34,50 46,50 20,78 28,56 16,56" ${glass}/><polygon points="28,34 39,34 31,52 41,52 25,71 30,54 21,54" fill="${liq}" opacity=".85"/>`; capS = `<rect x="31" y="20" width="9" height="10" rx="2" fill="${cap}"/>`; break;
      case 'ingot': body = `<polygon points="18,50 42,50 48,78 12,78" fill="${cap}" stroke="rgba(255,255,255,.6)"/><polygon points="20,52 30,52 26,76 15,76" fill="rgba(255,255,255,.25)"/>`; capS = `<rect x="26" y="40" width="8" height="10" fill="#1b1b1f"/>`; break;
      case 'torso': body = `<path d="M30 78 C20 78 21 70 22 62 C18 56 17 50 21 44 C24 40 27 38 30 38 C33 38 36 40 39 44 C43 50 42 56 38 62 C39 70 40 78 30 78 Z" ${glass}/><path d="M30 75 C23 75 24 69 25 63 C21 58 21 53 24 49 C26 47 28 46 30 46 C32 46 34 47 36 49 C39 53 39 58 35 63 C36 69 37 75 30 75 Z" fill="${liq}" opacity=".85"/>`; capS = `<rect x="26" y="28" width="8" height="10" rx="1" fill="${cap}"/>`; break;
      default: rect(28, 40, 3, 14, 12);
    }
    const label = ['ingot', 'torso', 'grenade', 'apple', 'bolt', 'star', 'arab', 'orb', 'disc', 'oval', 'hex', 'faceted'].includes(h.shape) ? '' : L;
    return `<svg class="bottle-svg" viewBox="0 0 60 82" width="${size}" height="${size * 1.37}" aria-hidden="true"><defs><linearGradient id="${gid}" x1="0" x2="1"><stop offset="0" stop-color="rgba(255,255,255,.35)"/><stop offset=".35" stop-color="rgba(255,255,255,.08)"/><stop offset="1" stop-color="rgba(255,255,255,.22)"/></linearGradient></defs>${capS}${body}${label}<rect x="${18}" y="${40}" width="2" height="30" rx="1" fill="rgba(255,255,255,.45)"/></svg>`;
  }

  /* ---------- UI state ---------- */
  const ui = {
    tab: 'work',
    shop: { q: '', house: '', family: '', tier: '', sort: 'value', hideOwned: false, limit: 48 },
    coll: { house: '', sort: 'value', limit: 60 },
    sellConfirm: null,
    work: { phase: 'idle' },
    showroomDirty: true,
  };
  const TABS = ['work', 'boutique', 'vault', 'collection', 'showroom', 'career', 'trophies'];

  /* ---------- header ---------- */
  function renderHeader() {
    const rk = rankInfo();
    $('#stat-cash').textContent = money(S.cash);
    $('#stat-day').textContent = `Day ${S.day} · ${SHIFT_NAMES[S.shift]}`;
    $('#stat-bottles').textContent = `${ownedCount()} / ${CATALOG.length}`;
    $('#stat-value').textContent = short(collectionValue());
    $('#stat-rank').textContent = rk.name;
    $('#goal').innerHTML = nextGoal();
    $('#btn-sfx').setAttribute('aria-pressed', S.settings.sfx);
    $('#btn-music').setAttribute('aria-pressed', S.settings.music);
    $('#btn-unbox').setAttribute('aria-pressed', S.settings.unbox);
  }

  function nextGoal() {
    const n = ownedCount(); const job = JOB[S.job];
    const nextJob = JOBS.slice(JOBS.indexOf(job) + 1).find((j) => jobOpen(j));
    if (n === 0) return 'Next: buy your first bottle in the <a href="#boutique" data-tab="boutique">Boutique</a>. Afnan, Rayhaan and Lattafa start under $50.';
    if (!S.signature) return 'Next: pick a signature scent in your <a href="#collection" data-tab="collection">Collection</a>. Matching it to your job raises your pay.';
    if (nextJob) return `Next: a better job is open. Apply as <a href="#career" data-tab="career">${esc(nextJob.title)}</a>.`;
    if (n >= 8 && S.desk === 0) return 'Next: open a decant desk on the <a href="#work" data-tab="work">Work</a> tab for passive income.';
    const upcoming = JOBS.slice(JOBS.indexOf(job) + 1)[0];
    if (upcoming) {
      const missing = reqList(upcoming).filter((r) => !r.ok).map((r) => r.text).join(', ');
      return `Working toward <b>${esc(upcoming.title)}</b>: ${esc(missing)}.`;
    }
    return `Collect them all: ${CATALOG.length - n} bottles left on Earth.`;
  }

  /* ---------- WORK tab ---------- */
  function renderWork() {
    const job = JOB[S.job]; const sb = sigBonus(job); const w = ui.work;
    const sig = S.signature ? ITEM_BY_ID[S.signature] : null;
    const wage = baseWage(job);
    const deskUnlocked = ownedCount() >= 8;
    let stage = '';
    if (w.phase === 'idle') {
      stage = `<div class="shift-idle">
        <p class="shift-time">${SHIFT_NAMES[S.shift]} shift · Day ${S.day}</p>
        <button class="btn btn-primary btn-big" data-action="start-shift" id="btn-start-shift">Start shift</button>
        <p class="hint">${job.game === 'match' ? 'A customer will describe what they want. Hand them the right bottle for a tip.' : 'Stop the atomizer in the bright zone to boost your pay.'}</p>
      </div>`;
    } else if (w.phase === 'timing') {
      stage = `<div class="mg-timing">
        <p class="mg-title">${esc(job.verb)}</p>
        <div class="meter" id="meter"><div class="zone" style="left:${w.zone - w.good / 2}%;width:${w.good}%"></div><div class="zone perfect" style="left:${w.zone - w.perfect / 2}%;width:${w.perfect}%"></div><div class="needle" id="needle"></div></div>
        <button class="btn btn-primary btn-big" data-action="spritz" id="btn-spritz">Spritz</button>
        <p class="hint">Space or tap. Perfect pays ×1.6, good ×1.25.</p>
      </div>`;
    } else if (w.phase === 'match') {
      stage = `<div class="mg-match">
        <p class="customer"><span class="who">${esc(w.who)}</span> “I’m looking for something ${esc(FAMILIES[w.family].ask)}.”</p>
        <div class="options">${w.options.map((id, i) => { const it = ITEM_BY_ID[id]; return `<button class="opt" data-action="answer" data-i="${i}">${bottleSVG(it, 34)}<span><small>${esc(HOUSE_BY_ID[it.house].name)}</small>${esc(it.name)}</span></button>`; }).join('')}</div>
        <p class="hint">Hand over the bottle that fits. Each bottle shows its scent family when you hover in the Boutique.</p>
      </div>`;
    } else if (w.phase === 'result') {
      stage = `<div class="shift-result ${w.grade}">
        <p class="grade">${esc(w.headline)}</p>
        <p class="pay">+${money(w.pay)}</p>
        <p class="hint">${esc(w.detail)}</p>
        <button class="btn btn-primary" data-action="next-shift" id="btn-next-shift">${S.shift === 0 && w.dayRolled ? 'Start the new day' : 'Next shift'}</button>
      </div>`;
    }

    $('#tab-work').innerHTML = `
      <div class="work-grid">
        <article class="panel job-card">
          <p class="eyebrow">Current job</p>
          <h2>${esc(job.title)}</h2>
          <p class="muted">${esc(job.employer)} · ${S.xp[job.id] || 0} shifts worked</p>
          <dl class="kv">
            <div><dt>Base pay</dt><dd>${money(wage)}${job.volatile ? ' <small>(volatile)</small>' : ''}${job.perBottle ? ` <small>incl. ${money(job.perBottle)} per bottle owned</small>` : ''}</dd></div>
            <div><dt>Scent this job rewards</dt><dd><span class="fam fam-${job.vibe}">${FAMILIES[job.vibe].label}</span></dd></div>
            <div><dt>Signature bonus</dt><dd>${sb.total ? '+' + Math.round(sb.total * 100) + '%' : 'None'}</dd></div>
          </dl>
          <div class="stage">${stage}</div>
          <div class="row-actions"><button class="btn btn-ghost" data-action="end-day">Call it a day</button><a class="btn btn-ghost" href="#career" data-tab="career">Change job</a></div>
        </article>

        <aside class="side-stack">
          <article class="panel sig-card">
            <p class="eyebrow">Signature scent</p>
            ${sig ? `<div class="sig-row">${bottleSVG(sig, 44)}<div><small>${esc(HOUSE_BY_ID[sig.house].name)}</small><h3>${esc(sig.name)}</h3><span class="fam fam-${sig.family}">${FAMILIES[sig.family].label}</span></div></div>
              <ul class="bonus-list">${sb.parts.map(([t, v]) => `<li><span>${esc(t)}</span><b>+${Math.round(v * 100)}%</b></li>`).join('')}</ul>`
              : `<p class="muted">You aren’t wearing anything. Choose a signature from your collection; a ${FAMILIES[job.vibe].label.toLowerCase()} scent earns the biggest bonus in this job.</p>`}
            <a class="btn btn-ghost" href="#collection" data-tab="collection">Choose from collection</a>
          </article>

          <article class="panel desk-card">
            <p class="eyebrow">Decant desk</p>
            ${S.desk > 0 ? `<h3>Level ${S.desk}</h3><p class="muted">Selling 5 ml decants from your shelf earns <b>${money(deskRate() * 12)}</b> a minute while you play.</p>`
              : `<p class="muted">Split your bottles into 5 ml samples and sell them online. Unlocks at 8 bottles.</p>`}
            ${S.desk < 8 ? `<button class="btn" data-action="desk" ${!deskUnlocked || S.cash < deskCost() ? 'disabled' : ''}>${S.desk ? 'Upgrade' : 'Open desk'} · ${money(deskCost())}</button>` : '<p class="muted">Fully upgraded.</p>'}
          </article>

          <article class="panel">
            <p class="eyebrow">Career record</p>
            <dl class="kv compact">
              <div><dt>Shifts worked</dt><dd>${S.stats.shifts}</dd></div>
              <div><dt>Total earned</dt><dd>${money(S.stats.earned)}</dd></div>
              <div><dt>Perfect shifts</dt><dd>${S.stats.perfect}</dd></div>
              <div><dt>Customers matched</dt><dd>${S.stats.matches}</dd></div>
            </dl>
          </article>
        </aside>
      </div>`;
    if (w.phase === 'timing') runNeedle();
  }

  function deskCost() { return S.desk === 0 ? 500 : Math.round(2000 * Math.pow(3.2, S.desk - 1)); }
  function deskRate() {
    if (!S.desk) return 0;
    let v = 0; for (const id in S.owned) { const it = ITEM_BY_ID[id]; if (!it.limited) v += value(it); }
    return S.desk * (3 + Math.min(v, 400000) * 0.00025);
  }

  let needleRaf = 0;
  function runNeedle() {
    cancelAnimationFrame(needleRaf);
    const w = ui.work; const t0 = performance.now();
    const step = (now) => {
      if (ui.work !== w || w.phase !== 'timing') return;
      const t = (now - t0) / 1000;
      const x = (Math.sin(t * Math.PI * w.speed - Math.PI / 2) + 1) / 2 * 100;
      w.pos = x; const n = $('#needle'); if (n) n.style.left = x + '%';
      needleRaf = requestAnimationFrame(step);
    };
    needleRaf = requestAnimationFrame(step);
  }

  function startShift() {
    const job = JOB[S.job]; const tierIdx = JOBS.indexOf(job);
    if (job.game === 'match') {
      const fams = Object.keys(FAMILIES);
      const family = pick(fams);
      const pool = CATALOG.filter((c) => !c.limited);
      const right = pick(pool.filter((c) => c.family === family));
      const others = [];
      while (others.length < 2) { const c = pick(pool); if (c.family !== family && !others.some((o) => ITEM_BY_ID[o].family === c.family)) others.push(c.id); }
      const options = [right.id, ...others].sort(() => Math.random() - 0.5);
      ui.work = { phase: 'match', family, options, answer: right.id, who: pick(['A regular', 'A tourist', 'A bride-to-be', 'A college student', 'A collector', 'A stylist', 'A dad on a budget', 'A diplomat']) };
    } else {
      const good = Math.max(10, 18 - tierIdx * 0.6), perfect = Math.max(3.5, 6 - tierIdx * 0.2);
      ui.work = { phase: 'timing', zone: 15 + Math.random() * 70, good, perfect, speed: 0.55 + tierIdx * 0.07 + Math.random() * 0.1, pos: 0 };
    }
    SFX.play('click');
    renderWork();
  }

  function finishShift(mult, grade, headline) {
    const job = JOB[S.job]; const sb = sigBonus(job);
    let base = baseWage(job);
    let vol = '';
    if (job.volatile) { const m = 0.35 + Math.random() * 2.2; base *= m; vol = m > 1.4 ? ' Investors loved it.' : m < 0.7 ? ' A rough quarter.' : ''; }
    const pay = Math.round(base * mult * (1 + sb.total));
    S.cash += pay; S.stats.earned += pay; S.stats.shifts++; S.xp[job.id] = (S.xp[job.id] || 0) + 1;
    if (grade === 'perfect') S.stats.perfect++;
    const parts = [`Base ${money(base)}`];
    if (mult !== 1) parts.push(`×${mult} performance`);
    if (sb.total) parts.push(`+${Math.round(sb.total * 100)}% signature`);
    S.shift++;
    let dayRolled = false;
    if (S.shift >= 3) { newDay(); dayRolled = true; }
    ui.work = { phase: 'result', pay, grade, headline, detail: parts.join(' · ') + '.' + vol, dayRolled };
    SFX.play('coins');
    checkProgress(); save(); renderHeader(); renderWork();
    const btn = $('#btn-next-shift'); if (btn) floatText('+' + short(pay), btn);
  }

  function spritz() {
    const w = ui.work; if (w.phase !== 'timing') return;
    cancelAnimationFrame(needleRaf);
    const d = Math.abs(w.pos - w.zone);
    SFX.play('spray');
    if (d <= w.perfect / 2) { SFX.play('perfect'); finishShift(1.6, 'perfect', 'Perfect'); }
    else if (d <= w.good / 2) { SFX.play('good'); finishShift(1.25, 'good', 'Good'); }
    else { SFX.play('miss'); finishShift(1, 'miss', 'Missed the zone'); }
  }

  function answer(i) {
    const w = ui.work; if (w.phase !== 'match') return;
    const chosen = w.options[i];
    if (chosen === w.answer) { S.stats.matches++; SFX.play('good'); finishShift(1.5, 'good', 'Sold, with a tip'); }
    else {
      SFX.play('miss');
      const it = ITEM_BY_ID[w.answer];
      finishShift(1, 'miss', `They wanted ${it.name}`);
    }
  }

  function newDay() {
    S.day++; S.shift = 0; genMarket();
    const d = S.market.deals[0]; const it = ITEM_BY_ID[d.id];
    toast(`<b>Day ${S.day}</b><span>New deals in the Boutique. ${esc(HOUSE_BY_ID[it.house].name)} ${esc(it.name)} is ${Math.round(d.off * 100)}% off.</span>`);
  }

  /* ---------- BOUTIQUE tab ---------- */
  function initBoutiqueControls() {
    const hs = $('#f-house'); hs.innerHTML = '<option value="">All houses</option>' + HOUSES.filter((h) => CATALOG.some((c) => c.house === h.id && !c.disc && !c.limited)).map((h) => `<option value="${h.id}">${esc(h.name)}</option>`).join('');
    const fs = $('#f-family'); fs.innerHTML = '<option value="">All families</option>' + Object.entries(FAMILIES).map(([k, f]) => `<option value="${k}">${f.label}</option>`).join('');
    const ts = $('#f-tier'); ts.innerHTML = '<option value="">All tiers</option>' + ['value', 'designer', 'niche', 'luxury'].map((t) => `<option value="${t}">${TIERS[t].label}</option>`).join('');
    const sync = () => {
      ui.shop.q = $('#f-q').value.trim().toLowerCase(); ui.shop.house = hs.value; ui.shop.family = fs.value; ui.shop.tier = ts.value;
      ui.shop.sort = $('#f-sort').value; ui.shop.hideOwned = $('#f-hide').checked; ui.shop.limit = 48; renderBoutiqueGrid();
    };
    ['#f-q', '#f-house', '#f-family', '#f-tier', '#f-sort', '#f-hide'].forEach((s) => $(s).addEventListener('input', sync));
  }

  function itemCard(it, mode) {
    const h = HOUSE_BY_ID[it.house]; const own = owns(it.id);
    let priceHtml = '', btn = '';
    if (mode === 'shop') {
      const p = shopPrice(it); const d = dealFor(it.id); const v = value(it);
      const trend = v > it.base * 1.03 ? '<span class="trend up" title="Above usual price">▲</span>' : v < it.base * 0.97 ? '<span class="trend down" title="Below usual price">▼</span>' : '';
      priceHtml = `<span class="price">${d ? `<s>${money(v)}</s> ` : ''}${money(p)} ${trend}</span>${d ? `<span class="deal">−${Math.round(d.off * 100)}% today</span>` : ''}`;
      btn = own ? '<span class="owned-tag">In your collection</span>' : `<button class="btn btn-buy" data-action="buy" data-id="${it.id}" ${S.cash < p ? 'disabled' : ''}>Buy</button>`;
    } else if (mode === 'vault') {
      const p = vaultPrice(it);
      priceHtml = `<span class="price">${money(p)}</span><span class="muted tiny">Grey-market ask</span>`;
      btn = own ? '<span class="owned-tag">In your collection</span>' : `<button class="btn btn-buy" data-action="vault-buy" data-id="${it.id}" ${S.cash < p ? 'disabled' : ''}>Buy now</button>`;
    }
    return `<article class="card tier-${it.tier} ${own ? 'is-owned' : ''}">
      <div class="card-art">${bottleSVG(it, 52)}</div>
      <div class="card-body">
        <p class="house">${esc(h.name)}</p>
        <h3>${esc(it.name)}</h3>
        <p class="tags"><span class="fam fam-${it.family}">${FAMILIES[it.family].label}</span><span class="tier">${TIERS[it.tier].label}</span>${it.disc ? '<span class="tier vint">Discontinued</span>' : ''}</p>
        <div class="card-foot">${priceHtml}${btn}</div>
      </div>
    </article>`;
  }

  function renderBoutique() {
    ensureMarket();
    const deals = S.market.deals.map((d) => ITEM_BY_ID[d.id]);
    $('#deals').innerHTML = deals.map((it) => itemCard(it, 'shop')).join('');
    $('#deals-day').textContent = `Day ${S.day}`;
    renderBoutiqueGrid();
  }

  function renderBoutiqueGrid() {
    const f = ui.shop;
    let list = CATALOG.filter((c) => !c.disc && !c.limited);
    if (f.q) list = list.filter((c) => (c.name + ' ' + HOUSE_BY_ID[c.house].name).toLowerCase().includes(f.q));
    if (f.house) list = list.filter((c) => c.house === f.house);
    if (f.family) list = list.filter((c) => c.family === f.family);
    if (f.tier) list = list.filter((c) => c.tier === f.tier);
    if (f.hideOwned) list = list.filter((c) => !owns(c.id));
    const sorters = { value: (a, b) => shopPrice(a) - shopPrice(b), dear: (a, b) => shopPrice(b) - shopPrice(a), name: (a, b) => a.name.localeCompare(b.name), house: (a, b) => HOUSE_BY_ID[a.house].name.localeCompare(HOUSE_BY_ID[b.house].name) || a.base - b.base };
    list.sort(sorters[f.sort] || sorters.value);
    $('#shop-count').textContent = `${list.length} fragrances`;
    $('#shop-grid').innerHTML = list.slice(0, f.limit).map((it) => itemCard(it, 'shop')).join('') || '<p class="empty">No fragrances match these filters. Clear the search or pick another house.</p>';
    $('#shop-more').hidden = list.length <= f.limit;
  }

  function buy(id, price, from) {
    const it = ITEM_BY_ID[id];
    if (owns(id)) return;
    if (S.cash < price) { SFX.play('error'); toast(`<b>Not enough cash</b><span>You need ${money(price - S.cash)} more for ${esc(it.name)}. Work a few shifts.</span>`, 'bad'); return; }
    S.cash -= price; S.stats.spent += price;
    S.owned[id] = { day: S.day, paid: price, batch: batchCode(S.seed + id + S.day), from };
    ui.showroomDirty = true;
    SFX.play('buy');
    if (!unbox(it)) toast(`<b>Added to your shelf</b><span>${esc(HOUSE_BY_ID[it.house].name)} ${esc(it.name)} for ${money(price)}.</span>`, 'good');
    checkProgress(); save(); renderHeader(); renderCurrent();
  }

  /* ---------- unboxing ---------- */
  // Plays the unboxing scene for a new bottle; returns false when it is off or WebGL is unavailable.
  function unbox(it) {
    if (!S.settings.unbox || typeof Unbox === 'undefined') return false;
    const o = S.owned[it.id];
    return Unbox.play(it, { paid: o && o.paid, batch: o && o.batch }, { onWearState: syncUnboxWear });
  }
  function syncUnboxWear(it) {
    const b = $('#ub-wear'); if (!b) return;
    const on = S.signature === it.id; b.textContent = on ? 'Wearing' : 'Wear it'; b.classList.toggle('on', on);
  }

  /* ---------- VAULT tab ---------- */
  let auction = null;
  function renderVault() {
    ensureMarket();
    $('#lots').innerHTML = S.market.lots.map((lot, i) => {
      const it = ITEM_BY_ID[lot.id]; const h = HOUSE_BY_ID[it.house]; const est = value(it);
      return `<article class="lot tier-${it.tier}">
        <div class="lot-art">${bottleSVG(it, 70)}</div>
        <div class="lot-body">
          <p class="eyebrow">Lot ${i + 1} · ${it.limited ? 'Legendary' : 'Discontinued'}</p>
          <p class="house">${esc(h.name)}</p>
          <h3>${esc(it.name)}</h3>
          <p class="muted">Estimate ${money(est * 0.8)} to ${money(est * 1.3)} · Opening bid ${money(est * 0.6)}</p>
          ${owns(it.id) ? '<span class="owned-tag">In your collection</span>' : lot.sold ? '<span class="owned-tag sold">Hammer down</span>' : `<button class="btn btn-primary" data-action="auction" data-i="${i}">Enter the auction</button>`}
        </div>
      </article>`;
    }).join('');
    const list = CATALOG.filter((c) => c.disc || c.limited).sort((a, b) => a.base - b.base);
    $('#vault-grid').innerHTML = list.map((it) => itemCard(it, 'vault')).join('');
  }

  function openAuction(i) {
    const lot = S.market.lots[i]; if (!lot || lot.sold) return;
    const it = ITEM_BY_ID[lot.id]; const v = value(it);
    const rivals = RIVALS.slice().sort(() => Math.random() - 0.5).slice(0, 3).map((name) => ({ name, max: v * (0.75 + Math.random() * 0.6) }));
    auction = { i, it, price: Math.round(v * 0.6), leader: null, end: performance.now() + 9000, rivals, log: [], nextRival: performance.now() + 900 + Math.random() * 600, done: false };
    $('#modal').hidden = false;
    renderAuction(); tickAuction();
    SFX.play('gavel');
  }
  const bidStep = () => Math.max(5, Math.round(auction.price * 0.06));
  function renderAuction() {
    const a = auction; const h = HOUSE_BY_ID[a.it.house];
    $('#modal').innerHTML = `<div class="modal-card auction" role="dialog" aria-modal="true" aria-labelledby="auc-title">
      <p class="eyebrow">Live auction · Lot ${a.i + 1}</p>
      <div class="auc-head">${bottleSVG(a.it, 60)}<div><p class="house">${esc(h.name)}</p><h2 id="auc-title">${esc(a.it.name)}</h2></div></div>
      <div class="auc-price"><span class="muted">Current bid</span><b id="auc-price"></b><span id="auc-leader" class="leader"></span></div>
      <div class="auc-timer"><div id="auc-bar"></div></div>
      <ul class="auc-log" id="auc-log"></ul>
      <div id="auc-controls">${a.done ? `<p class="auc-result">${esc(a.result)}</p><button class="btn btn-primary" data-action="close-modal">Close</button>`
        : `<div class="row-actions"><button class="btn btn-primary btn-big" data-action="bid" id="btn-bid"></button><button class="btn btn-ghost" data-action="close-modal">Walk away</button></div>
           <p class="hint">Cash on hand <span id="auc-cash"></span>. A bid in the final 3 seconds extends the clock.</p>`}</div>
    </div>`;
    updateAuction();
  }
  // Update the live numbers in place so the bid button is never replaced mid-click.
  function updateAuction() {
    const a = auction; if (!a) return;
    const left = Math.max(0, a.end - performance.now()) / 1000;
    const myBid = a.price + bidStep();
    $('#auc-price').textContent = money(a.price);
    const ld = $('#auc-leader'); ld.className = 'leader' + (a.leader === 'you' ? ' you' : '');
    ld.textContent = a.done ? '' : a.leader ? (a.leader === 'you' ? 'You lead' : a.leader + ' leads') : 'No bids yet';
    $('#auc-bar').style.width = (a.done ? 0 : Math.min(100, (left / 9) * 100)) + '%';
    $('#auc-log').innerHTML = a.log.slice(-5).reverse().map((l) => `<li class="${l.who === 'You' ? 'you' : ''}"><span>${esc(l.who)}</span><b>${money(l.amt)}</b></li>`).join('');
    const b = $('#btn-bid');
    if (b) { b.textContent = 'Bid ' + money(myBid); b.disabled = S.cash < myBid || a.leader === 'you'; $('#auc-cash').textContent = money(S.cash); }
  }
  function placeBid(who) {
    const a = auction; const amt = a.price + bidStep();
    a.price = amt; a.leader = who === 'You' ? 'you' : who; a.log.push({ who, amt });
    const left = a.end - performance.now(); if (left < 3000) a.end = performance.now() + 3000;
    SFX.play(who === 'You' ? 'click' : 'tick');
  }
  function tickAuction() {
    const a = auction; if (!a || a.done) return;
    const now = performance.now();
    if (now >= a.end) {
      a.done = true;
      const lot = S.market.lots[a.i]; lot.sold = true;
      if (a.leader === 'you') {
        S.cash -= a.price; S.stats.spent += a.price; S.stats.auctions++;
        S.owned[a.it.id] = { day: S.day, paid: a.price, batch: batchCode(S.seed + a.it.id + S.day), from: 'auction' };
        ui.showroomDirty = true;
        a.result = `Hammer down. ${a.it.name} is yours for ${money(a.price)}.`;
        a.won = a.it;
        SFX.play('gavel'); setTimeout(() => SFX.play('unlock'), 200);
        checkProgress();
      } else {
        a.result = a.leader ? `Sold to ${a.leader} for ${money(a.price)}.` : 'No bids. The lot was withdrawn.';
        SFX.play('gavel');
      }
      save(); renderHeader(); renderAuction(); if (ui.tab === 'vault') renderVault();
      return;
    }
    if (now >= a.nextRival) {
      const step = bidStep();
      const keen = a.rivals.filter((r) => r.name !== a.leader && r.max >= a.price + step);
      if (keen.length && Math.random() < 0.85) placeBid(pick(keen).name);
      a.nextRival = now + 500 + Math.random() * 1300;
    }
    updateAuction();
    setTimeout(tickAuction, 120);
  }
  function closeModal() {
    if (auction && !auction.done) {
      // Walking away forfeits your position; the lot goes to the room.
      auction.end = 0; if (auction.leader === 'you') auction.leader = null; tickAuction();
    }
    const won = auction && auction.won;
    auction = null; $('#modal').hidden = true; $('#modal').innerHTML = '';
    if (won) unbox(won);
  }

  /* ---------- COLLECTION tab ---------- */
  function sortedOwned() {
    const order = Object.fromEntries(HOUSES.map((h, i) => [h.id, i]));
    return Object.keys(S.owned).map((id) => ITEM_BY_ID[id]).sort((a, b) => order[a.house] - order[b.house] || a.base - b.base);
  }

  function renderCollection() {
    const rk = rankInfo(); const n = ownedCount(); const v = collectionValue();
    let paid = 0; for (const id in S.owned) paid += S.owned[id].paid;
    $('#coll-summary').innerHTML = `
      <div class="sum-item"><span class="muted">Bottles</span><b>${n}</b><small>of ${CATALOG.length} on Earth</small></div>
      <div class="sum-item"><span class="muted">Shelf value</span><b>${short(v)}</b><small>${v >= paid ? '+' : ''}${short(v - paid)} vs. what you paid</small></div>
      <div class="sum-item"><span class="muted">Houses complete</span><b>${housesComplete()}</b><small>of ${HOUSES.length}</small></div>
      <div class="sum-item rank"><span class="muted">Collector rank</span><b>${esc(rk.name)}</b><div class="bar"><i style="width:${Math.round(rk.pct * 100)}%"></i></div><small>${rk.next ? `${rk.need} prestige to ${esc(rk.next)}` : 'Top rank'}</small></div>`;

    $('#houses').innerHTML = HOUSES.map((h) => {
      const p = houseProgress(h.id); const pct = p.own / p.total;
      return `<button class="house-chip ${ui.coll.house === h.id ? 'on' : ''} ${pct === 1 ? 'done' : ''}" data-action="coll-house" data-id="${h.id}"><span>${esc(h.name)}</span><small>${p.own}/${p.total}</small><i style="width:${pct * 100}%"></i></button>`;
    }).join('');

    $('#clones').innerHTML = CLONE_PAIRS.map(([a, b]) => {
      const A = ITEM_BY_KEY[a], B = ITEM_BY_KEY[b];
      const cell = (x) => `<span class="${owns(x.id) ? 'got' : ''}">${esc(HOUSE_BY_ID[x.house].name)} ${esc(x.name)}</span>`;
      return `<li class="${owns(A.id) && owns(B.id) ? 'paired' : ''}">${cell(A)}<i>inspired by</i>${cell(B)}</li>`;
    }).join('');

    let list = sortedOwned();
    if (ui.coll.house) list = list.filter((c) => c.house === ui.coll.house);
    if (ui.coll.sort === 'value') list.sort((a, b) => value(b) - value(a));
    if (ui.coll.sort === 'recent') list.sort((a, b) => S.owned[b.id].day - S.owned[a.id].day);
    $('#coll-filter-note').innerHTML = ui.coll.house ? `Showing ${esc(HOUSE_BY_ID[ui.coll.house].name)} · <a href="#collection" data-action="coll-house" data-id="">show all</a>` : '';
    $('#coll-grid').innerHTML = list.length ? list.slice(0, ui.coll.limit).map((it) => {
      const o = S.owned[it.id]; const h = HOUSE_BY_ID[it.house]; const sp = sellPrice(it); const isSig = S.signature === it.id;
      return `<article class="card owned tier-${it.tier} ${isSig ? 'is-sig' : ''}">
        <div class="card-art">${bottleSVG(it, 52)}</div>
        <div class="card-body">
          <p class="house">${esc(h.name)}</p>
          <h3>${esc(it.name)}</h3>
          <p class="tags"><span class="fam fam-${it.family}">${FAMILIES[it.family].label}</span><span class="tier">${TIERS[it.tier].label}</span></p>
          <p class="batch">Batch ${o.batch} · Day ${o.day} · Paid ${money(o.paid)}</p>
          <div class="card-foot">
            <span class="price">${money(value(it))}</span>
            <div class="mini-actions">
              <button class="btn btn-small ${isSig ? 'on' : ''}" data-action="wear" data-id="${it.id}">${isSig ? 'Wearing' : 'Wear'}</button>
              <button class="btn btn-small" data-action="view3d" data-id="${it.id}">View in 3D</button>
              <button class="btn btn-small btn-sell ${ui.sellConfirm === it.id ? 'confirm' : ''}" data-action="sell" data-id="${it.id}">${ui.sellConfirm === it.id ? 'Confirm ' + short(sp) : 'Sell'}</button>
            </div>
          </div>
        </div>
      </article>`;
    }).join('') : `<p class="empty">${ui.coll.house ? 'You don’t own anything from this house yet.' : 'Your shelves are empty. Head to the Boutique and buy your first bottle.'}</p>`;
    $('#coll-more').hidden = list.length <= ui.coll.limit;
  }

  function sell(id) {
    const it = ITEM_BY_ID[id];
    if (ui.sellConfirm !== id) { ui.sellConfirm = id; renderCollection(); setTimeout(() => { if (ui.sellConfirm === id) { ui.sellConfirm = null; if (ui.tab === 'collection') renderCollection(); } }, 3500); return; }
    const p = sellPrice(it);
    delete S.owned[id]; if (S.signature === id) S.signature = null;
    S.cash += p; S.stats.sold++; ui.sellConfirm = null; ui.showroomDirty = true;
    SFX.play('sell');
    toast(`<b>Sold</b><span>${esc(it.name)} went for ${money(p)}.</span>`);
    save(); renderHeader(); renderCollection();
  }

  /* ---------- CAREER tab ---------- */
  function renderCareer() {
    $('#jobs').innerHTML = JOBS.map((j) => {
      const reqs = reqList(j); const open = reqs.every((r) => r.ok); const current = S.job === j.id;
      return `<article class="job ${current ? 'current' : ''} ${open ? 'open' : 'locked'}">
        <div class="job-head"><div><h3>${esc(j.title)}</h3><p class="muted">${esc(j.employer)}</p></div><b class="wage">${money(baseWage(j))}<small>/shift</small></b></div>
        <p class="tags"><span class="fam fam-${j.vibe}">Rewards ${FAMILIES[j.vibe].label}</span><span class="tier">${j.game === 'match' ? 'Customer matching' : 'Timing'}</span>${j.volatile ? '<span class="tier vint">Volatile pay</span>' : ''}</p>
        ${reqs.length ? `<ul class="reqs">${reqs.map((r) => `<li class="${r.ok ? 'ok' : ''}">${r.ok ? '✓' : '○'} ${esc(r.text)}${r.n && !r.ok ? ` <small>(${r.have}/${r.n})</small>` : ''}</li>`).join('')}</ul>` : '<p class="muted">No requirements.</p>'}
        ${current ? '<span class="owned-tag">Your current job</span>' : `<button class="btn ${open ? 'btn-primary' : ''}" data-action="take-job" data-id="${j.id}" ${open ? '' : 'disabled'}>${open ? 'Take this job' : 'Locked'}</button>`}
      </article>`;
    }).join('');
    $('#courses').innerHTML = COURSES.map((c) => `<li class="${S.courses[c.id] ? 'done' : ''}"><div><b>${esc(c.name)}</b><small>${esc(c.note)}</small></div>${S.courses[c.id] ? '<span class="owned-tag">Completed</span>' : `<button class="btn" data-action="course" data-id="${c.id}" ${S.cash < c.cost ? 'disabled' : ''}>Enroll · ${short(c.cost)}</button>`}</li>`).join('');
  }

  /* ---------- TROPHIES tab ---------- */
  function renderTrophies() {
    const got = ACH.filter((a) => S.ach[a.id]).length;
    $('#trophy-count').textContent = `${got} of ${ACH.length} earned`;
    $('#trophies').innerHTML = ACH.map((a) => `<li class="${S.ach[a.id] ? 'got' : ''}"><span class="medal" aria-hidden="true"></span><div><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></div><em>${S.ach[a.id] ? 'Day ' + S.ach[a.id] : short(a.reward)}</em></li>`).join('');
  }

  /* ---------- SHOWROOM tab ---------- */
  let showroomInit = false, tourTimer = 0;
  function enterShowroom() {
    const stage = $('#stage3d');
    if (!showroomInit) {
      showroomInit = true;
      const ok = Showroom.init(stage, {
        onFocus: (it) => renderHeroCard(it),
        onHeroClick: () => doSpray(),
        onPick: () => SFX.play('whoosh'),
        onHover: (it, x, y) => {
          const tip = $('#tip'); if (!it) { tip.hidden = true; return; }
          const r = stage.getBoundingClientRect();
          tip.hidden = false; tip.innerHTML = `<small>${esc(HOUSE_BY_ID[it.house].name)}</small>${esc(it.name)}<em>${short(value(it))}</em>`;
          tip.style.left = Math.min(r.width - 180, x - r.left + 14) + 'px'; tip.style.top = (y - r.top + 14) + 'px';
        },
      });
      if (!ok) { $('#fallback').hidden = false; $('#hud').hidden = true; return; }
    }
    if (!Showroom.ok) return;
    const n = ownedCount();
    $('#empty-note').hidden = n > 0;
    if (ui.showroomDirty) {
      ui.showroomDirty = false;
      const p = Showroom.setItems(sortedOwned(), ui.pendingFocus);
      if (p) p.then(() => { const h = Showroom.heroItem(); renderHeroCard(h); if (ui.pendingFocus) { Showroom.focus(ui.pendingFocus); ui.pendingFocus = null; } });
    } else if (ui.pendingFocus) { Showroom.focus(ui.pendingFocus); ui.pendingFocus = null; }
    Showroom.show();
    if (S.settings.music) SFX.startMusic();
  }
  function leaveShowroom() {
    if (!showroomInit || !Showroom.ok) return;
    Showroom.hide(); SFX.stopMusic(); endTourUI();
  }
  function renderHeroCard(it) {
    const c = $('#hero-card');
    if (!it) { c.hidden = true; return; }
    c.hidden = false; const o = S.owned[it.id];
    c.innerHTML = `<p class="house">${esc(HOUSE_BY_ID[it.house].name)} · ${esc(HOUSE_BY_ID[it.house].origin)}</p>
      <h2>${esc(it.name)}</h2>
      <p class="tags"><span class="fam fam-${it.family}">${FAMILIES[it.family].label}</span><span class="tier">${TIERS[it.tier].label}</span></p>
      <dl class="kv compact"><div><dt>Value</dt><dd>${money(value(it))}</dd></div>${o ? `<div><dt>Batch</dt><dd class="mono">${o.batch}</dd></div><div><dt>Acquired</dt><dd>Day ${o.day}</dd></div>` : ''}</dl>
      <div class="row-actions"><button class="btn btn-primary btn-small" data-action="spray">Spray</button><button class="btn btn-small ${S.signature === it.id ? 'on' : ''}" data-action="wear" data-id="${it.id}">${S.signature === it.id ? 'Wearing' : 'Wear'}</button></div>`;
  }
  function doSpray() { if (Showroom.spray()) SFX.play('spray'); }
  function startTour() {
    const ids = sortedOwned().sort((a, b) => value(b) - value(a)).slice(0, 10).map((c) => c.id);
    if (!ids.length) { toast('<b>Nothing to show yet</b><span>Buy a bottle first.</span>'); return; }
    $('#stage').classList.add('touring');
    $('#btn-tour').textContent = 'Stop tour';
    Showroom.startTour(ids, (it, i, n) => {
      SFX.play('whoosh'); setTimeout(() => SFX.play('reveal'), 500);
      setTimeout(() => { if (Showroom.touring) doSpray(); }, 2300);
      const t = $('#tour-card');
      t.classList.remove('show'); void t.offsetWidth;
      t.innerHTML = `<p class="eyebrow">${i + 1} of ${n} · the crown jewels</p><p class="house">${esc(HOUSE_BY_ID[it.house].name)}</p><h2>${esc(it.name)}</h2><p class="tour-val">${money(value(it))}</p>`;
      t.hidden = false; t.classList.add('show');
    }, endTourUI);
  }
  function endTourUI() {
    $('#stage').classList.remove('touring');
    $('#btn-tour').textContent = 'Show-off tour';
    const t = $('#tour-card'); t.classList.remove('show'); t.hidden = true;
  }

  /* ---------- routing ---------- */
  function setTab(tab, push = true) {
    if (!TABS.includes(tab)) tab = 'work';
    if (ui.tab === 'showroom' && tab !== 'showroom') leaveShowroom();
    ui.tab = tab;
    $$('.tab').forEach((s) => { s.hidden = s.id !== 'tab-' + tab; });
    $$('.tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === tab));
    document.body.dataset.view = tab;
    if (push) { try { history.replaceState(null, '', '#' + tab); } catch (e) { /* sandboxed */ } }
    renderCurrent();
  }
  function renderCurrent() {
    renderHeader();
    switch (ui.tab) {
      case 'work': renderWork(); break;
      case 'boutique': renderBoutique(); break;
      case 'vault': renderVault(); break;
      case 'collection': renderCollection(); break;
      case 'career': renderCareer(); break;
      case 'trophies': renderTrophies(); break;
      case 'showroom': enterShowroom(); break;
    }
  }

  /* ---------- actions ---------- */
  const actions = {
    'start-shift': startShift,
    'next-shift': startShift,
    spritz,
    answer: (el) => answer(Number(el.dataset.i)),
    'end-day': () => { cancelAnimationFrame(needleRaf); newDay(); ui.work = { phase: 'idle' }; save(); SFX.play('tab'); renderHeader(); renderWork(); },
    buy: (el) => buy(el.dataset.id, shopPrice(ITEM_BY_ID[el.dataset.id]), 'boutique'),
    'vault-buy': (el) => buy(el.dataset.id, vaultPrice(ITEM_BY_ID[el.dataset.id]), 'grey market'),
    'shop-more': () => { ui.shop.limit += 48; renderBoutiqueGrid(); },
    'coll-more': () => { ui.coll.limit += 60; renderCollection(); },
    auction: (el) => openAuction(Number(el.dataset.i)),
    bid: () => { if (!auction || auction.done) return; const amt = auction.price + bidStep(); if (S.cash < amt) { SFX.play('error'); return; } placeBid('You'); updateAuction(); },
    'close-modal': closeModal,
    wear: (el) => {
      const id = el.dataset.id; S.signature = S.signature === id ? null : id;
      SFX.play(S.signature ? 'spray' : 'click');
      if (S.signature) toast(`<b>Signature scent</b><span>You’re wearing ${esc(ITEM_BY_ID[id].name)}.</span>`);
      checkProgress(); save(); renderHeader();
      if (ui.tab === 'showroom') renderHeroCard(ITEM_BY_ID[id]); else renderCurrent();
    },
    view3d: (el) => { ui.pendingFocus = el.dataset.id; setTab('showroom'); },
    sell: (el) => sell(el.dataset.id),
    'coll-house': (el) => { ui.coll.house = ui.coll.house === el.dataset.id ? '' : el.dataset.id; ui.coll.limit = 60; renderCollection(); },
    'take-job': (el) => {
      const j = JOB[el.dataset.id]; if (!jobOpen(j)) return;
      S.job = j.id; ui.work = { phase: 'idle' }; SFX.play('unlock');
      toast(`<b>New job: ${esc(j.title)}</b><span>${money(baseWage(j))} per shift. This job rewards ${FAMILIES[j.vibe].label.toLowerCase()} scents.</span>`, 'job');
      checkProgress(); save(); renderCurrent();
    },
    course: (el) => {
      const c = COURSE[el.dataset.id]; if (S.cash < c.cost || S.courses[c.id]) return;
      S.cash -= c.cost; S.courses[c.id] = S.day; SFX.play('good');
      toast(`<b>Enrolled and graduated</b><span>${esc(c.name)} complete.</span>`, 'good');
      checkProgress(); save(); renderCurrent();
    },
    desk: () => {
      const cost = deskCost(); if (S.cash < cost || ownedCount() < 8) return;
      S.cash -= cost; S.desk++; SFX.play('buy');
      toast(`<b>Decant desk level ${S.desk}</b><span>Now earning ${money(deskRate() * 12)} a minute.</span>`, 'good');
      save(); renderHeader(); renderWork();
    },
    spray: doSpray,
    tour: () => { SFX.unlock(); if (Showroom.touring) Showroom.stopTour(); else startTour(); },
    wide: () => { Showroom.wide(); SFX.play('whoosh'); },
    reset: () => { Showroom.resetView(); SFX.play('click'); },
    photo: () => { $('#stage').classList.toggle('photo'); SFX.play('click'); },
    'toggle-sfx': () => { S.settings.sfx = !S.settings.sfx; SFX.setSfx(S.settings.sfx); save(); renderHeader(); },
    'toggle-unbox': () => { S.settings.unbox = !S.settings.unbox; SFX.play('click'); save(); renderHeader(); },
    'unbox-spray': () => { if (Unbox.spray()) SFX.play('spray'); },
    'unbox-wear': () => {
      const it = Unbox.item; if (!it || !owns(it.id)) return;
      S.signature = S.signature === it.id ? null : it.id; SFX.play(S.signature ? 'spray' : 'click');
      syncUnboxWear(it); checkProgress(); save(); renderHeader(); if (ui.tab === 'work') renderWork();
    },
    'unbox-done': () => { SFX.play('clink'); Unbox.close(); },
    'unbox-skip': () => { Unbox.skip(); },
    'toggle-music': () => {
      S.settings.music = !S.settings.music; SFX.setMusic(S.settings.music);
      if (S.settings.music && ui.tab === 'showroom') SFX.startMusic();
      save(); renderHeader();
    },
    'reset-game': (el) => {
      if (el.dataset.armed !== '1') { el.dataset.armed = '1'; el.textContent = 'Tap again to erase your save'; setTimeout(() => { el.dataset.armed = ''; el.textContent = 'Start over'; }, 3500); return; }
      adopt(null); ui.work = { phase: 'idle' }; ui.showroomDirty = true; genMarket(); save(); toast('<b>New game</b><span>$250 and a kitchen table. Good luck.</span>'); setTab('work');
    },
  };

  document.addEventListener('click', (e) => {
    SFX.unlock();
    const tabEl = e.target.closest('[data-tab]');
    if (tabEl) { e.preventDefault(); SFX.play('tab'); setTab(tabEl.dataset.tab); return; }
    const el = e.target.closest('[data-action]');
    if (el && !el.disabled && actions[el.dataset.action]) { e.preventDefault(); actions[el.dataset.action](el); }
  });
  document.addEventListener('keydown', (e) => {
    if (typeof Unbox !== 'undefined' && Unbox.busy) {
      if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); Unbox.open(); }
      if (e.key === 'Escape') Unbox.skip();
      return;
    }
    if (e.code === 'Space' && ui.tab === 'work' && ui.work.phase === 'timing' && !e.target.closest('input,select,textarea')) { e.preventDefault(); spritz(); }
    if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
  });

  /* ---------- passive income + boot ---------- */
  function passiveTick() {
    if (S.desk > 0) {
      const amt = deskRate(); S.cash += amt; S.stats.earned += amt;
      renderHeader();
      if (ui.tab === 'boutique' || ui.tab === 'vault') {
        // Re-enable buy buttons the player can now afford without re-rendering the grid.
        $$('[data-action="buy"],[data-action="vault-buy"]').forEach((b) => { const it = ITEM_BY_ID[b.dataset.id]; const p = b.dataset.action === 'buy' ? shopPrice(it) : vaultPrice(it); b.disabled = S.cash < p; });
      }
    }
    save();
  }

  function start(hotData) {
    const saved = hotData && hotData.cash != null ? hotData : loadSaved();
    adopt(saved);
    ensureMarket();
    if (saved && S.desk > 0 && saved.last) {
      const secs = Math.min(7200, (Date.now() - saved.last) / 1000);
      if (secs > 60) {
        const amt = Math.round(deskRate() * (secs / 5) * 0.5);
        S.cash += amt; S.stats.earned += amt;
        setTimeout(() => toast(`<b>Welcome back</b><span>Your decant desk earned ${money(amt)} while you were away.</span>`, 'good'), 600);
      }
    }
    SFX.setSfx(S.settings.sfx); SFX.setMusic(S.settings.music);
    $('#catalog-count').textContent = `${CATALOG.length} real fragrances from ${HOUSES.length} houses`;
    initBoutiqueControls();
    $('#c-sort').addEventListener('input', (e) => { ui.coll.sort = e.target.value; renderCollection(); });
    const tab = (location.hash || '').slice(1);
    setTab(TABS.includes(tab) ? tab : 'work', false);
    setInterval(passiveTick, 5000);
    window.addEventListener('beforeunload', save);
    if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => S);
  }

  const hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();
