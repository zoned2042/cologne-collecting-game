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

  // Taxes and running costs keep money meaningful once you're rich. Tuned with tools/economy_sim.js.
  const ECON = {
    taxBrackets: [[0, 1000, 0], [1000, 10000, 0.25], [10000, 1e12, 0.4]], // per shift: [from, to, rate]
    perBottleCap: 200, // reviewer and influencer pay counts at most this many bottles
    freeShelf: 60, storagePerBottle: 4, // a day, for each bottle beyond the free shelf
    insureVintage: 0.002, insureLegendary: 0.003, // share of value a day
    shopRent: 0.002, factoryUpkeep: 0.003, // share of what you paid, a day
    noseSalary: [0, 300, 3000],
    deskBase: 2, deskPerValue: 0.0001, deskValueCap: 400000,
    rangeCompetition: 0.25, // your fragrances compete: demand × (fragrances on sale)^−0.25
    shopDemand: [30, 40, 55, 75, 100, 130], // bottles a day each boutique adds; prestige addresses draw more
  };
  const shopDemand = (n) => ECON.shopDemand.slice(0, n).reduce((a, x) => a + x, 0);
  const incomeTax = (pay) => ECON.taxBrackets.reduce((t, [from, to, rate]) => t + Math.max(0, Math.min(pay, to) - from) * rate, 0) * (S.ambition === 'mogul' ? 0.9 : 1);
  const RIVALS = ['@OudBaron', '@BatchCodeBetty', '@NicheNinja', '@SillageSultan', '@DecantDave', '@VintageVera', '@AventusAndy', '@ProjectionPaul'];

  /* ---------- state ---------- */
  const SAVE_KEY = 'sillage-save-v1';
  function freshState() {
    return {
      v: 2, cash: 250, day: 1, shift: 0, job: 'packer', xp: {}, courses: {}, owned: {}, signature: null, desk: 0,
      stats: { shifts: 0, earned: 0, spent: 0, perfect: 0, sold: 0, matches: 0, auctions: 0 },
      ach: {}, notified: {}, market: null, maison: null, last: Date.now(), seed: Math.random().toString(36).slice(2, 8),
      settings: { sfx: true, music: true, unbox: true },
    };
  }
  let S = freshState();

  function save() {
    S.last = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); ui.saveFail = false; }
    catch (e) { if (!ui.saveFail) { ui.saveFail = true; toast('<b>Couldn’t save</b><span>This browser blocked storage or it’s full. Export your save from Settings to keep your progress.</span>', 'bad'); } }
  }
  function adopt(data) {
    const base = freshState();
    S = Object.assign(base, data || {});
    S.stats = Object.assign(freshState().stats, S.stats || {});
    S.settings = Object.assign(freshState().settings, S.settings || {});
    // Your own house: put its fragrances back into the catalog before checking the shelf.
    if (S.maison && typeof Maison !== 'undefined') {
      S.maison = Object.assign({ rep: 10, lab: 1, nose: 0, factory: 0, shops: 0, ads: [], creations: [], ledger: [], stats: { sold: 0, revenue: 0 } }, S.maison);
      for (const c of S.maison.creations) Maison.register(S.maison, c);
      if (S.maison.site) S.maison.site = Object.assign(SITE_DEFAULT(), S.maison.site);
    }
    // Drop items that no longer exist in the catalog.
    for (const id of Object.keys(S.owned)) if (!ITEM_BY_ID[id]) delete S.owned[id];
    if (S.signature && !S.owned[S.signature]) S.signature = null;
    if (!JOB[S.job]) S.job = 'packer';
  }


  /* ---------- saves: checked on load, backed up daily, exported and imported ---------- */
  const BACKUP_KEY = SAVE_KEY + '-backup', SAVE_VERSION = 2;
  const num = (v, d, lo = -Infinity, hi = Infinity) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  // Repairs anything out of shape so one bad value can't break a game; throws if it isn't a save at all.
  function validate(d) {
    if (!isObj(d) || !('cash' in d) || !('owned' in d)) throw new Error('This isn’t a Sillage save.');
    const fixes = [];
    const n = (k, def, lo, hi, int) => { const v = num(d[k], null, lo, hi); if (v === null) { fixes.push(k); d[k] = def; } else d[k] = int ? Math.floor(v) : v; };
    n('cash', 250); n('day', 1, 1, 1e6, true); n('shift', 0, 0, 2, true); n('desk', 0, 0, 8, true);
    if (!isObj(d.owned)) { d.owned = {}; fixes.push('collection'); }
    for (const [id, o] of Object.entries(d.owned)) if (!isObj(o)) { d.owned[id] = { day: d.day, paid: 0, batch: 'REPAIRED', from: 'repaired' }; fixes.push('bottle'); }
    for (const k of ['xp', 'courses', 'ach', 'notified', 'stats', 'settings']) if (d[k] != null && !isObj(d[k])) { d[k] = {}; fixes.push(k); }
    for (const k of Object.keys(d.xp || {})) d.xp[k] = Math.floor(num(d.xp[k], 0, 0));
    if (d.ledger != null && !Array.isArray(d.ledger)) { d.ledger = []; fixes.push('ledger'); }
    if (d.live != null) {
      if (!isObj(d.live)) { d.live = null; fixes.push('market'); }
      else for (const k of ['events', 'offers', 'feed', 'wish', 'drops']) if (!Array.isArray(d.live[k])) { d.live[k] = []; fixes.push('market ' + k); }
      if (d.live && !isObj(d.live.rivals)) d.live.rivals = {};
      if (d.live && !isObj(d.live.notes)) d.live.notes = {};
      if (d.live && !isObj(d.live.buys)) d.live.buys = { day: 0, n: 0 };
    }
    if (d.maison != null) {
      const m = d.maison;
      if (!isObj(m) || (m.creations != null && !Array.isArray(m.creations))) { d.maison = null; fixes.push('house'); }
      else {
        m.rep = num(m.rep, 10, 0, 100); m.lab = Math.floor(num(m.lab, 1, 1, 5)); m.nose = Math.floor(num(m.nose, 0, 0, 2)); m.factory = Math.floor(num(m.factory, 0, 0, 5)); m.shops = Math.floor(num(m.shops, 0, 0, 6));
        const before = (m.creations || []).length;
        m.creations = (m.creations || []).filter((x) => isObj(x) && x.id && x.name && isObj(x.design) && isObj(x.box) && isObj(x.notes));
        if (m.creations.length < before) fixes.push('fragrance');
        for (const x of m.creations) { x.stock = Math.floor(num(x.stock, 0, 0)); x.price = num(x.price, 100, 1); x.sold = num(x.sold, 0, 0); x.revenue = num(x.revenue, 0); x.harmony = num(x.harmony, 50, 5, 99); x.launched = Math.floor(num(x.launched, d.day, 1)); if (!Array.isArray(x.reviews)) x.reviews = []; if (!Array.isArray(x.accords)) x.accords = []; }
        if (m.site != null && !isObj(m.site)) { m.site = null; fixes.push('website'); }
      }
    }
    d.v = SAVE_VERSION;
    return fixes;
  }
  // Reads a save; falls back to the daily backup if the main save is damaged.
  function readKey(k) {
    let raw = null;
    try { raw = localStorage.getItem(k); } catch (e) { return null; }
    if (!raw) return null;
    try { const d = JSON.parse(raw); validate(d); return d; } catch (e) { return { bad: true, raw }; }
  }
  function loadSaved() {
    const main = readKey(SAVE_KEY);
    if (main && !main.bad) return main;
    const bak = readKey(BACKUP_KEY);
    if (main && main.bad) { try { localStorage.setItem(SAVE_KEY + '-damaged', main.raw); } catch (e) { /* keep going */ } }
    if (bak && !bak.bad) { if (main && main.bad) ui.notice = `Your save was damaged, so the game restored your backup from day ${bak.day}.`; return bak; }
    if (main && main.bad) ui.notice = 'Your save couldn’t be read and there was no backup, so a new game has started. The damaged save was kept aside.';
    return null;
  }
  function backupNow() { try { localStorage.setItem(BACKUP_KEY, JSON.stringify(S)); } catch (e) { /* storage may be blocked */ } }
  const backupInfo = () => { const b = readKey(BACKUP_KEY); return b && !b.bad ? b : null; };
  // Export codes are the save as base64 JSON with a short prefix, safe to paste anywhere.
  function exportCode() { const bytes = new TextEncoder().encode(JSON.stringify(S)); let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); }); return 'SILLAGE1:' + btoa(bin); }
  function parseCode(text) {
    const t = String(text || '').trim(); if (!t) throw new Error('Paste a save code or choose a save file first.');
    let json = t;
    if (/^SILLAGE1:/.test(t)) { const bin = atob(t.slice(9).replace(/\s+/g, '')); json = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))); }
    let d; try { d = JSON.parse(json); } catch (e) { throw new Error('That code is incomplete or damaged. Copy the whole code and try again.'); }
    const fixes = validate(d);
    return { d, fixes };
  }
  // Swap in another game state and redraw everything.
  function loadState(data) {
    if (auction) closeModal();
    adopt(data); ensureMarket(); applyAccess();
    ui.showroomDirty = true; ui.work = { phase: 'idle' }; ui.atelier.draft = null; ui.atelier.view = 'range';
    SFX.setSfx(S.settings.sfx); SFX.setMusic(S.settings.music);
    save(); renderHeader(); setTab(ui.tab === 'showroom' ? 'journey' : ui.tab, false);
  }

  /* ---------- dialogs: one layer for settings, confirmations, the welcome and chapter endings ---------- */
  let dlgResolve = null, dlgReturn = null;
  function openDlg(html, cls = '') {
    const d = $('#dlg'); dlgReturn = document.activeElement;
    d.innerHTML = `<div class="modal-card ${cls}" role="dialog" aria-modal="true">${html}</div>`; d.hidden = false;
    const f = d.querySelector('[autofocus], .dlg-primary, button, input, textarea'); if (f) f.focus();
  }
  function closeDlg(result) {
    const d = $('#dlg'); if (d.hidden) return;
    d.hidden = true; d.innerHTML = '';
    if (dlgResolve) { const r = dlgResolve; dlgResolve = null; r(result); }
    if (dlgReturn && dlgReturn.isConnected) dlgReturn.focus();
  }
  // Every confirmation in the game goes through here: a title, what will happen, and two clear buttons.
  function confirmBox({ title, body, ok = 'Confirm', cancel = 'Cancel', danger = false }) {
    return new Promise((res) => {
      openDlg(`<h2 class="dlg-title">${title}</h2><p class="muted">${body}</p><div class="row-actions dlg-actions"><button class="btn" data-action="dlg-answer" data-v="0">${cancel}</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'} dlg-primary" data-action="dlg-answer" data-v="1">${ok}</button></div>`, 'dlg-confirm');
      dlgResolve = res;
    });
  }
  // Accessibility options live on <html> so they reach every tab, the showroom and the website.
  function applyAccess() {
    const r = document.documentElement, st = S.settings;
    r.classList.toggle('calm', !!st.calm); r.classList.toggle('big-text', !!st.big); r.classList.toggle('contrast', !!st.contrast);
  }
  const reducedMotion = () => !!S.settings.calm || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function openSettings(panel = 'main') {
    const st = S.settings, bak = backupInfo();
    const sw = (k, label, hint) => `<label class="switch"><input type="checkbox" data-setting="${k}" ${st[k] ? 'checked' : ''}><span><b>${label}</b><small>${hint}</small></span></label>`;
    let body;
    if (panel === 'export') body = `<h2 class="dlg-title">Export your save</h2><p class="muted">Copy this code somewhere safe, or download it as a file. Paste it into Import on any device to carry on from here.</p>
      <textarea id="save-code" class="save-code" rows="5" readonly>${esc(exportCode())}</textarea>
      <div class="row-actions"><button class="btn btn-primary dlg-primary" data-action="save-copy">Copy code</button><button class="btn" data-action="save-download">Download file</button><button class="btn" data-action="settings" data-p="main">Back</button></div><p class="hint" id="save-msg" aria-live="polite"></p>`;
    else if (panel === 'import') body = `<h2 class="dlg-title">Import a save</h2><p class="muted">Paste an export code, or choose a save file. Your current game is backed up first, so you can restore it from Settings if you change your mind.</p>
      <textarea id="save-in" class="save-code" rows="5" placeholder="SILLAGE1:…"></textarea><label class="field"><span>Or choose a file</span><input type="file" id="save-file" accept=".txt,.json,text/plain,application/json"></label>
      <div class="row-actions"><button class="btn btn-primary dlg-primary" data-action="save-import">Check and import</button><button class="btn" data-action="settings" data-p="main">Back</button></div><p class="hint" id="save-msg" aria-live="polite"></p>`;
    else body = `<h2 class="dlg-title">Settings</h2>
      <section class="set-sec"><p class="eyebrow">Sound and scenes</p>${sw('sfx', 'Sound effects', 'Glass clinks, sprays, the till and the gavel')}${sw('music', 'Showroom music', 'An ambient score in the showroom')}${sw('unbox', 'Unboxing scenes', 'Open every new bottle’s box in 3D')}</section>
      <section class="set-sec"><p class="eyebrow">Accessibility</p>${sw('calm', 'Reduce motion', 'Stops animations, auto-rotating covers and camera sweeps')}${sw('big', 'Larger text', 'Everything about 12% bigger')}${sw('contrast', 'High contrast', 'Brighter text and stronger outlines')}</section>
      <section class="set-sec"><p class="eyebrow">Your save</p><p class="small muted">Saved automatically in this browser · day ${S.day}. A backup is kept each day${bak ? `, the latest from day ${bak.day}` : ''}.</p>
        <div class="row-actions"><button class="btn" data-action="settings" data-p="export">Export save</button><button class="btn" data-action="settings" data-p="import">Import save</button>${bak ? '<button class="btn" data-action="save-restore">Restore backup</button>' : ''}<button class="btn btn-danger" data-action="save-reset">Start a new game</button></div></section>
      <div class="row-actions dlg-actions"><button class="btn btn-primary dlg-primary" data-action="dlg-close">Done</button></div>`;
    openDlg(body, 'dlg-settings');
  }

  /* ---------- economy ---------- */
  const ownedCount = () => Object.keys(S.owned).length;
  const owns = (id) => !!S.owned[id];
  function value(item) { return baseValue(item) * marketMult(item); }
  function baseValue(item) {
    if (item.limited) return item.base * (1 + 0.003 * (S.day - 1));
    if (item.disc) return item.base * 1.35 * (1 + 0.008 * (S.day - 1));
    return item.base * (0.9 + 0.2 * hash01(S.seed + item.id + ':' + S.day));
  }
  const dealFor = (id) => (S.market && S.market.deals.find((d) => d.id === id)) || null;
  function shopPrice(item) { const d = dealFor(item.id); return Math.round(value(item) * (d ? 1 - d.off : 1) * (eventOf('sale') ? 0.85 : 1)); }
  const vaultPrice = (item) => Math.round(value(item) * 1.25 * (S.ambition === 'collector' ? 0.95 : 1));
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
    const shop = CATALOG.filter((c) => !c.disc && !c.limited && !stockInfo(c).out);
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
    genWants();
  }
  function ensureMarket() { if (!S.market || S.market.day !== S.day) genMarket(); else if (!S.market.wants) genWants(); }

  /* ---------- signature scent bonus ---------- */
  function sigBonus(job) {
    if (!S.signature) return { total: 0, parts: [] };
    const it = ITEM_BY_ID[S.signature]; const parts = [['Wearing a scent', 0.05]];
    if (it.family === job.vibe) parts.push([FAMILIES[job.vibe].label + ' suits this job', 0.3]);
    const tierB = { niche: 0.05, luxury: 0.1, haute: 0.2, legendary: 0.2 }[it.tier];
    if (tierB) parts.push([TIERS[it.tier].label + ' bottle', tierB]);
    return { total: parts.reduce((a, p) => a + p[1], 0), parts };
  }
  function baseWage(job) { return job.wage + (job.perBottle || 0) * Math.min(ECON.perBottleCap, ownedCount()); }

  /* ---------- the day's books ---------- */
  // Money in and out today, by kind; closed into S.ledger at the end of each day.
  function flow() { if (!S.flow) S.flow = { start: S.cash, wages: 0, tax: 0, house: 0, desk: 0, upkeep: 0 }; return S.flow; }
  // Daily running costs: storage beyond the free shelf, insurance on rare bottles, and your house's rent, staff, factories and hosting.
  function upkeep() {
    const n = ownedCount(), m = S.maison;
    let insurance = 0; for (const id in S.owned) { const it = ITEM_BY_ID[id]; if (it.limited) insurance += value(it) * ECON.insureLegendary; else if (it.disc) insurance += value(it) * ECON.insureVintage; }
    const c = {
      storage: Math.max(0, n - ECON.freeShelf) * ECON.storagePerBottle,
      insurance: Math.round(insurance),
      rent: m ? Math.round(Array.from({ length: m.shops }, (_, i) => shopCost(i)).reduce((a, x) => a + x, 0) * ECON.shopRent) : 0,
      staff: m ? ECON.noseSalary[m.nose] : 0,
      factory: m ? Math.round(Array.from({ length: m.factory }, (_, i) => factoryCost(i)).reduce((a, x) => a + x, 0) * ECON.factoryUpkeep) : 0,
      hosting: m && m.site ? HOSTING : 0,
    };
    c.total = Object.values(c).reduce((a, x) => a + x, 0);
    return c;
  }

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
    { id: 'all', name: 'Every Bottle on Earth', desc: 'Own every fragrance in the catalog', reward: 1000000, test: () => CATALOG.every((c) => owns(c.id)) },
    { id: 'maison', name: 'Maison Founded', desc: 'Found your own fragrance house', reward: 2500, test: () => !!S.maison },
    { id: 'launch', name: 'Launch Day', desc: 'Launch your first fragrance', reward: 5000, test: () => !!(S.maison && S.maison.creations.length) },
    { id: 'master', name: 'Masterpiece', desc: 'Launch a fragrance with harmony 90 or more', reward: 25000, test: () => !!(S.maison && S.maison.creations.some((c) => c.harmony >= 90)) },
    { id: 'range', name: 'Full Range', desc: 'Have 5 fragrances in your house', reward: 40000, test: () => !!(S.maison && S.maison.creations.length >= 5) },
    { id: 'kbottles', name: 'Ten Thousand Sold', desc: 'Sell 10,000 bottles of your own', reward: 100000, test: () => !!(S.maison && S.maison.stats.sold >= 10000) },
    { id: 'online', name: 'Open for Business', desc: 'Launch your house website', reward: 5000, test: () => !!(S.maison && S.maison.site) },
    { id: 'eshop', name: 'E-commerce Empire', desc: 'Take 1,000 online orders', reward: 75000, test: () => !!(S.maison && S.maison.site && S.maison.site.days.reduce((a, d) => a + d.o, 0) + S.maison.site.today.o >= 1000) },
    { id: 'cult', name: 'Cult House', desc: 'Reach reputation 80', reward: 250000, test: () => !!(S.maison && S.maison.rep >= 80) },
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
    journeyCheck();
  }

  /* ---------- toasts ---------- */
  // Buttons you can't afford say so: disabled with a tooltip, and "$X to go" where there's room.
  const lack = (cost) => (S.cash < cost ? ` disabled title="You need ${money(cost - S.cash)} more"` : '');
  const togo = (cost) => (S.cash < cost ? `<small class="need">${money(cost - S.cash)} to go</small>` : '');
  function toast(html, kind = '') {
    const t = document.createElement('div'); t.className = 'toast ' + kind; t.innerHTML = html;
    const box = $('#toasts'); box.appendChild(t);
    // At most five at once: a burst of rewards shouldn't bury the screen.
    while (box.children.length > 5) box.firstElementChild.remove();
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
    atelier: { view: 'range', step: 0, draft: null, found: { name: '', city: 'Paris', pal: 0 }, aiText: '', ai: { busy: false, msg: '' } },
  };
  const TABS = ['journey', 'work', 'boutique', 'vault', 'collection', 'atelier', 'showroom', 'career', 'trophies'];

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
    const jt = $('.tabs [data-tab=journey]'), u = ui.tab === 'journey' ? 0 : unread();
    if (jt) jt.innerHTML = `Journey${u ? ` <span class="pill" aria-label="${u} new">${u}</span>` : ''}`;
  }

  function nextGoal() {
    const x = nextSteps()[0];
    if (!x) return `Collect them all: ${CATALOG.length - ownedCount()} bottles left on Earth. <a href="#journey" data-tab="journey">Your journey</a>`;
    return `Next: <a href="#${x.tab}" data-tab="${x.tab}">${esc(x.text)}</a>. <span class="goal-why">${esc(x.why)}</span> <a class="goal-more" href="#journey" data-tab="journey">Your journey ›</a>`;
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
            ${S.desk < 8 ? `<button class="btn" data-action="desk" ${!deskUnlocked ? 'disabled title="Own 8 bottles first"' : lack(deskCost())}>${S.desk ? 'Upgrade' : 'Open desk'} · ${money(deskCost())}</button>${deskUnlocked ? togo(deskCost()) : `<small class="need">Own 8 bottles to open it (${ownedCount()} so far)</small>`}` : '<p class="muted">Fully upgraded.</p>'}
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
    return S.desk * (ECON.deskBase + Math.min(v, ECON.deskValueCap) * ECON.deskPerValue);
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
    const gross = Math.round(base * mult * (1 + sb.total)), tax = Math.round(incomeTax(gross)), pay = gross - tax;
    S.cash += pay; S.stats.earned += pay; S.stats.shifts++; S.xp[job.id] = (S.xp[job.id] || 0) + 1;
    flow().wages += gross; flow().tax += tax;
    if (grade === 'perfect') S.stats.perfect++;
    const parts = [`Base ${money(base)}`];
    if (mult !== 1) parts.push(`×${mult} performance`);
    if (sb.total) parts.push(`+${Math.round(sb.total * 100)}% signature`);
    if (tax) parts.push(`−${money(tax)} income tax`);
    const ms = maisonTick(1 / 3);
    if (ms.units) parts.push(`your house sold ${ms.units} bottles for ${money(ms.revenue)}`);
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
    // Close the day's books: running costs come out, then the day goes into the ledger.
    const up = upkeep(), due = up.total, paid = Math.min(Math.max(0, S.cash), due);
    S.cash -= paid; S.stats.spent += paid;
    const f = flow(); f.upkeep = paid;
    S.ledger = (S.ledger || []).concat([Object.assign({ day: S.day, net: Math.round(S.cash - f.start), costs: up }, f)]).slice(-14);
    S.flow = null; flow();
    backupNow();
    S.day++; S.shift = 0; genMarket(); maisonNewDay(); liveDaily(); checkProgress();
    const d = S.market.deals[0]; const it = ITEM_BY_ID[d.id], last = S.ledger[S.ledger.length - 1];
    toast(`<b>Day ${S.day}</b><span>Yesterday ${last.net >= 0 ? '+' : '−'}${money(Math.abs(last.net))}${due ? ` after ${money(paid)} of running costs` : ''}${paid < due ? ` (${money(due - paid)} unpaid)` : ''}. ${esc(HOUSE_BY_ID[it.house].name)} ${esc(it.name)} is ${Math.round(d.off * 100)}% off today.</span>`, paid < due ? 'bad' : '');
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
      const st = stockInfo(it);
      btn = own ? '<span class="owned-tag">In your collection</span>' : st.out ? `<button class="btn btn-buy" disabled title="${st.why === 'viral' ? 'Sold out after going viral' : 'Sold out'}">Back day ${st.back}</button>` : !allowanceLeft() ? '<button class="btn btn-buy" disabled title="Your boutique allowance is used up today">Tomorrow</button>' : `<button class="btn btn-buy" data-action="buy" data-id="${it.id}"${lack(p)}>Buy</button>`;
    } else if (mode === 'vault') {
      const p = vaultPrice(it);
      priceHtml = `<span class="price">${money(p)}</span><span class="muted tiny">Grey-market ask</span>`;
      btn = own ? '<span class="owned-tag">In your collection</span>' : `<button class="btn btn-buy" data-action="vault-buy" data-id="${it.id}"${lack(p)}>Buy now</button>`;
    }
    return `<article class="card tier-${it.tier} ${own ? 'is-owned' : ''}">
      <div class="card-art">${bottleSVG(it, 52)}${mode ? wishBtn(it) : ''}</div>
      <div class="card-body">
        <p class="house">${esc(h.name)}</p>
        <h3>${esc(it.name)}</h3>
        <p class="tags"><span class="fam fam-${it.family}">${FAMILIES[it.family].label}</span><span class="tier">${TIERS[it.tier].label}</span>${it.disc ? '<span class="tier vint">Discontinued</span>' : ''}${eventTags(it)}</p>
        <div class="card-foot">${priceHtml}${btn}</div>
      </div>
    </article>`;
  }

  function renderBoutique() {
    ensureMarket();
    const deals = S.market.deals.map((d) => ITEM_BY_ID[d.id]);
    renderMarketStrip();
    $('#deals').innerHTML = deals.map((it) => itemCard(it, 'shop')).join('');
    $('#deals-day').textContent = `Day ${S.day}`;
    renderMystery();
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
    const shop = from === 'boutique' || from === 'mystery box';
    if (shop && from === 'boutique' && stockInfo(it).out) { SFX.play('error'); toast(`<b>Sold out</b><span>${esc(it.name)} is back on day ${stockInfo(it).back}. Add it to your wishlist to hear when it returns.</span>`, 'bad'); return; }
    if (shop && !allowanceLeft()) { SFX.play('error'); toast(`<b>Today’s allowance is used</b><span>Boutiques sell ${RANKS[rankIndex()][1]} clients ${allowance()} bottles a day. It resets tomorrow; higher ranks get more. The Vault has no limit.</span>`, 'bad'); return; }
    if (S.cash < price) { SFX.play('error'); toast(`<b>Not enough cash</b><span>You need ${money(price - S.cash)} more for ${esc(it.name)}. Work a few shifts.</span>`, 'bad'); return; }
    S.cash -= price; S.stats.spent += price;
    if (shop) { const l = L(); if (l.buys.day !== S.day) l.buys = { day: S.day, n: 0 }; l.buys.n++; }
    L().wish = L().wish.filter((x) => x !== id);
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
    $('#wants').innerHTML = S.market.wants.map((w, i) => {
      const it = ITEM_BY_ID[w.id]; const offer = Math.round(value(it) * w.mult); const own = owns(it.id);
      return `<li class="${w.done ? 'done' : ''}"><div>${bottleSVG(it, 30)}<div><small>${esc(w.who)} wants</small><b>${esc(HOUSE_BY_ID[it.house].name)} ${esc(it.name)}</b><small>Offer ${money(offer)} · ${Math.round((w.mult - 1) * 100)}% over value</small></div></div>${w.done ? '<span class="owned-tag">Sold</span>' : own ? `<button class="btn btn-primary btn-small" data-action="want-sell" data-i="${i}">Sell for ${short(offer)}</button>` : '<span class="muted small">Not on your shelf</span>'}</li>`;
    }).join('');
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
    renderRivals();
    const list = CATALOG.filter((c) => c.disc || c.limited).sort((a, b) => a.base - b.base);
    $('#vault-grid').innerHTML = list.map((it) => itemCard(it, 'vault')).join('');
  }

  function openAuction(i) {
    const lot = S.market.lots[i]; if (!lot || lot.sold) return;
    const it = ITEM_BY_ID[lot.id]; const v = value(it);
    const rivals = auctionRivals(it, v);
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
      auctionMemory(a);
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
    const order = Object.fromEntries(HOUSES.map((h, i) => [h.id, i])); order.mine = -1;
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
          <p class="batch">Batch ${o.batch} · Day ${o.day} · Paid ${money(o.paid)}${o.edition ? ` · <b class="edition">No. ${o.edition.no} of ${o.edition.of}</b>` : ''}${o.extra ? ` · +${o.extra} in your stash` : ''}</p>${eventTags(it) ? `<p class="tags">${eventTags(it)}</p>` : ''}
          <div class="card-foot">
            <span class="price">${money(value(it))}</span>
            <div class="mini-actions">
              <button class="btn btn-small ${isSig ? 'on' : ''}" data-action="wear" data-id="${it.id}">${isSig ? 'Wearing' : 'Wear'}</button>
              <button class="btn btn-small" data-action="view3d" data-id="${it.id}">View in 3D</button>
              <button class="btn btn-small btn-sell" data-action="sell" data-id="${it.id}" aria-label="Sell ${esc(it.name)} for ${short(sp)}">Sell</button>
            </div>
          </div>
        </div>
      </article>`;
    }).join('') : `<p class="empty">${ui.coll.house ? 'You don’t own anything from this house yet.' : 'Your shelves are empty. Head to the Boutique and buy your first bottle.'}</p>`;
    $('#coll-more').hidden = list.length <= ui.coll.limit;
  }

  async function sell(id) {
    const it = ITEM_BY_ID[id];
    const ok = await confirmBox({ title: `Sell ${esc(it.name)}?`, body: `You’ll get ${money(sellPrice(it))} (${it.disc || it.limited ? '95%' : '70%'} of today’s value of ${money(value(it))}).${S.signature === id ? ' It’s your signature scent, so you’ll stop wearing it.' : ''}`, ok: `Sell for ${money(sellPrice(it))}` });
    if (!ok || !S.owned[id]) return;
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
    $('#courses').innerHTML = COURSES.map((c) => `<li class="${S.courses[c.id] ? 'done' : ''}"><div><b>${esc(c.name)}</b><small>${esc(c.note)}</small></div>${S.courses[c.id] ? '<span class="owned-tag">Completed</span>' : `<button class="btn" data-action="course" data-id="${c.id}" ${S.cash < c.cost ? `disabled title="You need ${money(c.cost - S.cash)} more"` : ''}>Enroll · ${short(c.cost)}</button>${S.cash < c.cost ? `<small class="need">${money(c.cost - S.cash)} to go</small>` : ''}`}</li>`).join('');
  }



  /* ================= THE LIVING MARKET =================
   * Market events that move prices and demand, boutique stock and allowances, numbered drops,
   * rival collectors who remember you, your house's customers, and a newsfeed written only
   * from things that actually happened in your game. */
  const L = () => (S.live = S.live || { events: [], rivals: {}, offers: [], feed: [], seen: 0, feedN: 0, wish: [], drops: [], challenge: null, buys: { day: 0, n: 0 }, notes: {}, retail: null, rolled: 0 });
  function news(kind, text, tab) {
    const l = L(); l.feedN = (l.feedN || 0) + 1;
    l.feed.unshift({ n: l.feedN, day: S.day, kind, text, tab: tab || null });
    if (l.feed.length > 80) l.feed.length = 80;
  }
  const unread = () => L().feed.filter((f) => f.n > (L().seen || 0)).length;
  const itemName = (it) => `${HOUSE_BY_ID[it.house].name} ${it.name}`;
  const once = (key) => { const n = L().notes; if (n[key]) return false; n[key] = S.day; return true; };

  /* ---------- market events ---------- */
  const activeEvents = () => L().events.filter((e) => e.start <= S.day && e.end >= S.day);
  const eventOf = (type) => activeEvents().find((e) => e.type === type) || null;
  // Price effect of events (and numbered editions) on one bottle. Older batches gain during a reformulation rumour.
  function marketMult(it) {
    let m = 1; const o = S.owned[it.id];
    for (const e of activeEvents()) {
      if ((e.type === 'viral' || e.type === 'vintage') && e.item === it.id) m *= e.mult;
      else if (e.type === 'celebrity' && it.family === e.family) m *= 1.15;
      else if (e.type === 'rumor' && it.house === e.house) m *= o && o.day < e.start ? 1.3 : 0.9;
    }
    if (o && o.edition) m *= 1.6 * (1 + 0.005 * Math.max(0, S.day - o.edition.day));
    return m;
  }
  const SALES = ['Midseason sale', 'Collector’s weekend', 'Black Friday', 'Summer sale', 'Founders’ sale', 'Winter sale'];
  function newEvent(r) {
    const l = L(), m = S.maison, live = m ? m.creations.filter((c) => ITEM_BY_ID[c.id]) : [];
    const types = [['viral', 3], ['rumor', 2], ['vintage', 2], ['celebrity', 2], ['sale', 1]].concat(live.length ? [['competitor', 2], ['shortage', 1]] : []);
    const busy = (t) => l.events.some((e) => e.type === t && e.end >= S.day);
    const open = types.filter(([t]) => !busy(t) || t === 'viral'); if (!open.length) return;
    let x = r() * open.reduce((a, [, w]) => a + w, 0), type = open[0][0];
    for (const [t, w] of open) { x -= w; if (x <= 0) { type = t; break; } }
    const e = { id: 'ev' + S.day + type, type, start: S.day };
    if (type === 'viral') {
      const it = pick(CATALOG.filter((c) => !c.disc && !c.limited && (c.tier === 'designer' || c.tier === 'niche')), r);
      Object.assign(e, { item: it.id, mult: Math.round((1.3 + r() * 0.4) * 100) / 100, end: S.day + 3 + Math.floor(r() * 4) });
      e.text = `${itemName(it)} goes viral: prices up ${Math.round((e.mult - 1) * 100)}% and boutiques are sold out until day ${S.day + 2}.`;
    } else if (type === 'rumor') {
      const hs = HOUSES.filter((h) => CATALOG.filter((c) => c.house === h.id && !c.disc && !c.limited).length >= 6);
      const h = pick(hs, r); Object.assign(e, { house: h.id, end: S.day + 7 + Math.floor(r() * 5) });
      e.text = `Reformulation rumours hit ${h.name}: collectors want older batches. Bottles you bought before today are worth 30% more; new stock is 10% cheaper.`;
    } else if (type === 'vintage') {
      const it = pick(CATALOG.filter((c) => c.disc), r);
      Object.assign(e, { item: it.id, mult: Math.round((1.4 + r() * 0.4) * 100) / 100, end: S.day + 5 + Math.floor(r() * 5) });
      e.text = `${itemName(it)} is suddenly the most wanted discontinued bottle: vault prices up ${Math.round((e.mult - 1) * 100)}%.`;
      if (S.market && S.market.wants) S.market.wants.unshift({ id: it.id, who: pick(BUYERS, r), mult: 1.6, done: false });
    } else if (type === 'celebrity') {
      const fam = pick(Object.keys(FAMILIES), r); Object.assign(e, { family: fam, end: S.day + 3 + Math.floor(r() * 3) });
      e.text = `A celebrity is wearing ${FAMILIES[fam].label.toLowerCase()} scents everywhere: ${FAMILIES[fam].label.toLowerCase()} bottles are up 15%${m ? ` and demand for your ${FAMILIES[fam].label.toLowerCase()} fragrances is up 60%` : ''}.`;
    } else if (type === 'sale') {
      Object.assign(e, { end: S.day + 1, name: pick(SALES, r) }); e.text = `${e.name}: 15% off everything in the Boutique today and tomorrow.`;
    } else if (type === 'competitor') {
      const c = live.slice().sort((a, b) => (b.hist || []).slice(-7).reduce((s, v) => s + v, 0) - (a.hist || []).slice(-7).reduce((s, v) => s + v, 0))[0];
      const rivalHouse = pick(HOUSES.filter((h) => CATALOG.some((x) => x.house === h.id && x.family === c.family)), r) || pick(HOUSES, r);
      Object.assign(e, { cid: c.id, end: S.day + 4 + Math.floor(r() * 4) });
      e.text = `${rivalHouse.name} launches a new ${FAMILIES[c.family].label.toLowerCase()} scent aimed at your ${c.name}: its sales fall 30% while the buzz lasts.`;
    } else if (type === 'shortage') {
      Object.assign(e, { end: S.day + 3 }); e.text = 'A glass shortage hits the industry: producing new batches costs 30% more for four days.';
    }
    l.events.push(e); news('market', e.text, type === 'competitor' || type === 'shortage' ? 'atelier' : type === 'vintage' ? 'vault' : 'boutique');
  }

  /* ---------- boutique stock, allowance, drops and wishlist ---------- */
  const OUT_P = { value: 0.04, designer: 0.08, niche: 0.18, luxury: 0.3, haute: 0.4 };
  // Each bottle restocks in its own cycle of 3 to 5 days; some cycles it sells out. A viral bottle sells out for two days.
  function stockInfo(it, day = S.day) {
    if (it.disc || it.limited || it.mine) return { out: false };
    const v = L().events.find((e) => e.type === 'viral' && e.item === it.id && day >= e.start && day <= e.start + 1);
    if (v) return { out: true, back: v.start + 2, why: 'viral' };
    const len = 3 + Math.floor(hash01(it.id + ':len') * 3), ph = Math.floor(hash01(it.id + ':ph') * len), cyc = Math.floor((day + ph) / len);
    if (hash01(S.seed + it.id + ':cyc' + cyc) < (OUT_P[it.tier] || 0.08)) return { out: true, back: (cyc + 1) * len - ph };
    return { out: false };
  }
  const ALLOWANCE = [3, 4, 5, 6, 8, 10, 12, 15, 20];
  const rankIndex = () => { const p = prestige(); let i = 0; while (i + 1 < RANKS.length && p >= RANKS[i + 1][0]) i++; return i; };
  const allowance = () => ALLOWANCE[rankIndex()];
  const boughtToday = () => (L().buys.day === S.day ? L().buys.n : 0);
  const allowanceLeft = () => Math.max(0, allowance() - boughtToday());
  const wished = (id) => L().wish.includes(id);
  const activeDrop = () => L().drops.find((d) => d.start <= S.day && d.end >= S.day && !d.gone) || null;
  function newDrop(r) {
    const pool = CATALOG.filter((c) => !c.disc && !c.limited && (c.tier === 'designer' || c.tier === 'niche' || c.tier === 'luxury'));
    const it = wishPick(pool, r), of = it.tier === 'designer' ? 1000 : it.tier === 'niche' ? 500 : 250;
    const d = { id: it.id, of, no: 1 + Math.floor(r() * (of * 0.6)), price: Math.round(it.base * 1.5), start: S.day, end: S.day + 1 };
    L().drops = L().drops.filter((x) => x.end >= S.day - 10).concat(d);
    news('shop', `Limited drop: a numbered edition of ${itemName(it)}, ${of} made. In the Boutique until day ${d.end}.`, 'boutique');
  }
  // Wishlisted bottles turn up a little more often in drops and offers.
  const wishPick = (pool, r) => { const w = pool.filter((c) => wished(c.id) && !owns(c.id)); return w.length && r() < 0.4 ? pick(w, r) : pick(pool, r); };
  function wishAlerts() {
    const l = L(), deals = S.market ? S.market.deals : [];
    for (const id of l.wish) {
      const it = ITEM_BY_ID[id]; if (!it || owns(id)) continue;
      const d = deals.find((x) => x.id === id);
      if (d) news('wish', `${itemName(it)} from your wishlist is ${Math.round(d.off * 100)}% off today.`, 'boutique');
      if (stockInfo(it, S.day - 1).out && !stockInfo(it).out) news('wish', `${itemName(it)} from your wishlist is back in stock.`, 'boutique');
      if (S.market && S.market.lots.some((x) => x.id === id)) news('wish', `${itemName(it)} from your wishlist is up for auction today.`, 'vault');
    }
  }

  /* ---------- rival collectors ---------- */
  const ME_HOUSES = ['afnan', 'rayhaan', 'lattafa', 'armaf', 'rasasi', 'spiritdubai'];
  const RIVAL_INFO = {
    '@OudBaron': { name: 'Faisal Al-Mansour', bio: 'Middle Eastern houses and anything with real oud.', likes: (it) => it.family === 'oud' || ME_HOUSES.includes(it.house), budget: 1.1, beat: 'Enjoy it while it lasts.', won: 'Patience always wins.', offer: 'I pay well for the right bottle.' },
    '@VintageVera': { name: 'Vera Lindqvist', bio: 'Hunts discontinued designer bottles and original formulas.', likes: (it) => it.disc || ['dior', 'chanel', 'ysl', 'armani', 'guerlain', 'hermes', 'givenchy'].includes(it.house), budget: 1.2, beat: 'You have no idea what that bottle means.', won: 'Some things belong in the right hands.', offer: 'For the archive, darling.' },
    '@NicheNinja': { name: 'Kenji Mori', bio: 'Rare niche releases only. Never designer.', likes: (it) => !it.disc && ['niche', 'luxury', 'haute'].includes(it.tier), budget: 1.15, beat: 'Noted.', won: 'Too slow.', offer: 'Name your price. Within reason.' },
    '@AventusAndy': { name: 'Andy Price', bio: 'Owns every Creed batch since 2010 and wants yours.', likes: (it) => it.house === 'creed' || it.family === 'fresh' || it.family === 'citrus', budget: 1.0, beat: 'That was MY batch.', won: 'Another one for the wall.', offer: 'Is that a good batch? I’ll take it.' },
    '@BatchCodeBetty': { name: 'Betty Okafor', bio: 'Reads batch codes like tea leaves; lives for pre-reformulation bottles.', likes: (it) => it.disc || activeEvents().some((e) => e.type === 'rumor' && e.house === it.house), budget: 1.05, beat: 'Check the batch before you gloat.', won: 'Older batch. Better juice.', offer: 'I’ll pay for the batch, not the bottle.' },
    '@SillageSultan': { name: 'Omar Haddad', bio: 'A whale. Legendary and haute bottles, at any price.', likes: (it) => it.limited || it.tier === 'haute' || it.tier === 'luxury', budget: 1.35, beat: 'Remarkable. I will remember you.', won: 'Money is a language. I speak it fluently.', offer: 'Everything has a price.' },
    '@DecantDave': { name: 'Dave Collins', bio: 'Buys cheap, splits everything into decants.', likes: (it) => it.tier === 'value' || it.tier === 'designer', budget: 0.85, beat: 'Fair play, mate.', won: 'Five-mil decants for everyone!', offer: 'Quick flip? Cash today.' },
    '@ProjectionPaul': { name: 'Paul Reyes', bio: 'Beast mode only: sweet, amber and gourmand bombs.', likes: (it) => ['sweet', 'amber', 'gourmand', 'tobacco'].includes(it.family), budget: 1.0, beat: 'I’ll out-project you anyway.', won: 'Twelve sprays, minimum.', offer: 'That one’s a beast. I want it.' },
  };
  const R = (h) => { const l = L(); return (l.rivals[h] = l.rivals[h] || { grudge: 0, beat: 0, lost: 0, owned: [], met: false }); };
  const rivalry = (g) => (g >= 6 ? 'Nemesis' : g >= 3 ? 'Bitter' : g >= 1 ? 'Competitive' : 'Friendly');
  const rivalOwns = (h, id) => R(h).owned.some((x) => x.id === id);
  function rivalAcquire(h, id, quiet) {
    const st = R(h); if (rivalOwns(h, id)) return;
    st.owned.push({ id, day: S.day }); if (st.owned.length > 200) st.owned.shift();
    const it = ITEM_BY_ID[id];
    if (!quiet && (wished(id) || it.disc || it.limited)) news('rival', `${h} adds ${itemName(it)} to their collection.${wished(id) ? ' It was on your wishlist.' : ''}`, 'vault');
  }
  // Who sits in an auction: collectors who love the lot, then the room. Grudges make them bid harder against you.
  function auctionRivals(it, v) {
    const likers = RIVALS.filter((h) => RIVAL_INFO[h].likes(it)).sort(() => Math.random() - 0.5).slice(0, 2);
    const rest = RIVALS.filter((h) => !likers.includes(h)).sort(() => Math.random() - 0.5).slice(0, 3 - likers.length);
    return likers.concat(rest).map((h) => { const inf = RIVAL_INFO[h], st = R(h); st.met = true; return { name: h, max: v * (0.75 + Math.random() * 0.6) * (inf.likes(it) ? 1.15 : 0.9) * inf.budget * (1 + 0.07 * Math.min(5, st.grudge)) }; });
  }
  function auctionMemory(a) {
    const bidders = new Set(a.log.filter((x) => x.who !== 'You').map((x) => x.who)), youBid = a.log.some((x) => x.who === 'You');
    if (a.leader === 'you') {
      for (const h of bidders) { const st = R(h); st.grudge++; st.lost++; }
      const loudest = [...bidders].sort((p, q) => R(q).grudge - R(p).grudge)[0];
      if (loudest) news('rival', `${loudest} lost ${itemName(a.it)} to you at auction. “${RIVAL_INFO[loudest].beat}”`, 'vault');
    } else if (a.leader && RIVAL_INFO[a.leader]) {
      rivalAcquire(a.leader, a.it.id, true);
      if (youBid) { R(a.leader).beat++; news('rival', `${a.leader} beat you to ${itemName(a.it)} for ${money(a.price)}. “${RIVAL_INFO[a.leader].won}”`, 'vault'); }
    }
  }
  function rivalsDaily(r) {
    const l = L(), ch = l.challenge && !l.challenge.done ? l.challenge : null;
    for (const h of RIVALS) {
      const inf = RIVAL_INFO[h], keen = ch && ch.rival === h ? 0.6 : 0.25;
      if (r() < keen) { const pool = CATALOG.filter((c) => inf.likes(c) && !rivalOwns(h, c.id)); if (pool.length) rivalAcquire(h, wishPick(pool, r).id); }
    }
    // Private offers: a rival wants something on your shelf, or will part with something from theirs.
    l.offers = l.offers.filter((o) => o.expires >= S.day);
    if (l.offers.length < 3 && r() < 0.5) {
      const h = pick(RIVALS, r), inf = RIVAL_INFO[h], st = R(h);
      if (r() < 0.5) {
        const mine = Object.keys(S.owned).map((id) => ITEM_BY_ID[id]).filter((it) => it && !it.mine && inf.likes(it) && !l.offers.some((o) => o.item === it.id));
        if (mine.length) { const it = pick(mine, r), price = Math.round(value(it) * (1.2 + 0.05 * Math.min(4, st.grudge) + r() * 0.3)); l.offers.push({ id: 'of' + S.day + h, rival: h, kind: 'buy', item: it.id, price, expires: S.day + 2 }); st.met = true; news('rival', `${h} offers ${money(price)} for your ${itemName(it)}. “${inf.offer}”`, 'vault'); }
      } else {
        const theirs = st.owned.map((x) => ITEM_BY_ID[x.id]).filter((it) => it && !owns(it.id));
        if (theirs.length && st.grudge < 6) { const it = wishPick(theirs, r), price = Math.round(value(it) * (1.15 + 0.08 * Math.min(5, st.grudge) + r() * 0.25)); l.offers.push({ id: 'of' + S.day + h, rival: h, kind: 'sell', item: it.id, price, expires: S.day + 2 }); st.met = true; news('rival', `${h} will sell you ${itemName(it)} for ${money(price)}.${wished(it.id) ? ' It’s on your wishlist.' : ''}`, 'vault'); }
      }
    }
    challengeDaily(r);
  }
  // A race against one rival: add more bottles of their speciality than they do within a week.
  function challengeDaily(r) {
    const l = L(), c = l.challenge;
    if (c && !c.done) {
      c.theirs = R(c.rival).owned.filter((x) => x.day >= c.start && x.day <= c.end).length;
      const mine = challengeMine(c);
      if (mine >= c.target || c.theirs >= c.target || S.day > c.end) {
        c.done = true; const won = mine >= c.target && (c.theirs < c.target || mine > c.theirs);
        if (won) { S.cash += c.reward; R(c.rival).grudge++; news('rival', `You won the race against ${c.rival}: ${mine} new ${c.theme} bottles to their ${c.theirs}. Prize ${money(c.reward)}.`, 'vault'); toast(`<b>Race won</b><span>${money(c.reward)} from the collectors’ circle.</span>`, 'gold'); }
        else news('rival', `${c.rival} won the race for ${c.theme} bottles, ${c.theirs} to your ${mine}. “${RIVAL_INFO[c.rival].won}”`, 'vault');
      }
      return;
    }
    if (ownedCount() < 5 || (c && S.day - c.end < 2) || r() > 0.35) return;
    const h = pick(RIVALS, r), target = 3 + Math.floor(r() * 3);
    const theme = { '@OudBaron': 'oud or Middle Eastern', '@VintageVera': 'discontinued or classic designer', '@NicheNinja': 'niche', '@AventusAndy': 'Creed or fresh', '@BatchCodeBetty': 'discontinued or rumoured', '@SillageSultan': 'luxury or legendary', '@DecantDave': 'value or designer', '@ProjectionPaul': 'sweet, amber or gourmand' }[h];
    l.challenge = { rival: h, theme, target, start: S.day, end: S.day + 6, theirs: 0, reward: Math.round(2500 * target * (1 + rankIndex())), done: false };
    news('rival', `${h} challenges you: who adds ${target} ${theme} bottles first, by day ${S.day + 6}? Prize ${money(l.challenge.reward)}.`, 'vault');
  }
  const challengeMine = (c) => Object.entries(S.owned).filter(([id, o]) => o.day >= c.start && ITEM_BY_ID[id] && !ITEM_BY_ID[id].mine && RIVAL_INFO[c.rival].likes(ITEM_BY_ID[id])).length;

  /* ---------- your house's customers ---------- */
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  // Four kinds of buyer: bargain hunters weigh price, enthusiasts weigh quality, collectors want limited editions, the rest just buy.
  function segments(c) {
    const f = fairPrice(c) / Math.max(1, c.price);
    const s = { budget: 0.35 * Math.min(3, Math.pow(f, 3)), enthusiast: 0.35 * Math.pow(c.harmony / 70, 3), collector: 0.15 * (c.limited ? 3 : 0.5), casual: 0.15 };
    s.total = s.budget + s.enthusiast + s.collector + s.casual;
    return s;
  }
  function satisfaction(c) {
    const f = fairPrice(c) / Math.max(1, c.price), ca = critAvg(c) || 3;
    return Math.round(clamp(30 + c.harmony * 0.45 + (Math.min(f, 1.6) - 1) * 40 + (ca - 3) * 8, 5, 98));
  }
  function customersDaily() {
    const m = S.maison; if (!m) return;
    const best = m.creations.slice().sort((a, b) => (b.yesterday || 0) - (a.yesterday || 0))[0];
    for (const c of m.creations) {
      c.sat = satisfaction(c);
      const sold = c.yesterday || 0;
      c.fans = Math.max(0, (c.fans || 0) * (c.sat < 50 ? 0.9 : 0.995) + sold * Math.pow(c.sat / 100, 2) * 0.15);
      // Disappointed customers send bottles back.
      if (c.sat < 55 && sold > 0) {
        const n = Math.floor(sold * (55 - c.sat) / 300 + Math.random());
        if (n > 0) { const back = n * c.price; S.cash -= back; c.revenue -= back; m.stats.revenue -= back; flow().house -= back; m.rep = Math.max(0, m.rep - n * 0.05); if (n >= 3 || once('refund' + c.id)) news('house', `${n} customer${n === 1 ? '' : 's'} returned ${c.name} for a refund (${money(back)}). Satisfaction is ${c.sat}: ${c.price > fairPrice(c) * 1.15 ? 'they feel it’s overpriced' : 'they expected more from it'}.`, 'atelier'); }
      }
      const h = c.hist || [], wk = h.slice(-7).reduce((a, x) => a + x, 0), prev = h.slice(-14, -7).reduce((a, x) => a + x, 0);
      if (S.day - c.launched <= 14 && wk >= 40 && (prev === 0 || wk / prev >= 1.5) && once('fast' + c.id)) news('house', `${c.name} is the week’s fastest-growing ${FAMILIES[c.family].label.toLowerCase()} fragrance: ${wk} sold in seven days.`, 'atelier');
      if (prev >= 60 && wk <= prev * 0.6 && c.stock > wk && once('fade' + c.id + ':' + Math.floor(S.day / 7))) news('house', `${c.name} is falling out of fashion: ${wk} sold this week against ${prev} the week before.`, 'atelier');
      if (c === best && (c.fans || 0) >= 100 && once('fans' + c.id)) news('house', `${c.name} has a hundred loyal fans who buy it again and again.`, 'atelier');
    }
    // A retailer may offer to stock your whole range.
    const l = L();
    if (l.retail && l.retail.expires < S.day) l.retail = null;
    const stocked = m.creations.filter((c) => c.stock > 0 && ITEM_BY_ID[c.id]);
    if (!l.retail && m.rep >= 35 && stocked.length >= 2 && Math.random() < 0.12) {
      const who = pick(['Harrods', 'Galeries Lafayette', 'Bergdorf Goodman', 'Saks Fifth Avenue', 'Selfridges', 'Dubai Duty Free', 'Shinsegae', 'Le Bon Marché']);
      const items = stocked.map((c) => ({ id: c.id, q: Math.min(c.stock, 50 + Math.floor(Math.random() * 150)) }));
      const total = items.reduce((a, x) => a + x.q * Math.round(m.creations.find((c) => c.id === x.id).price * 0.55), 0);
      l.retail = { who, items, total, expires: S.day + 2 };
      news('house', `${who} offers to stock your entire range: ${items.reduce((a, x) => a + x.q, 0)} bottles at wholesale for ${money(total)}. Decide by day ${S.day + 2}.`, 'atelier');
    }
  }

  /* ---------- the day's market roll ---------- */
  function liveDaily() {
    const l = L(); if (l.rolled === S.day) return; l.rolled = S.day;
    for (const e of l.events) if (e.end === S.day - 1) news('market', { viral: 'The hype has passed: prices are back to normal.', rumor: 'The reformulation rumour has been put to rest.', vintage: 'The vintage frenzy has cooled.', celebrity: 'The celebrity moment is over.', sale: 'The sale has ended.', competitor: 'The rival launch has lost its buzz; your sales recover.', shortage: 'The glass shortage is over.' }[e.type], null);
    l.events = l.events.filter((e) => e.end >= S.day - 1);
    const r = rng(S.seed + ':live:' + S.day);
    if (activeEvents().length < 4 && r() < 0.6) newEvent(r);
    if (!activeDrop() && r() < 0.3) newDrop(r);
    rivalsDaily(r);
    customersDaily();
    wishAlerts();
  }

  /* ---------- Living Market screens ---------- */
  const EV_LABEL = { viral: 'Viral', rumor: 'Reformulation rumour', vintage: 'Vintage frenzy', celebrity: 'Celebrity moment', sale: 'Sale', competitor: 'Rival launch', shortage: 'Glass shortage' };
  function eventTags(it) {
    const out = [];
    for (const e of activeEvents()) {
      if (e.type === 'viral' && e.item === it.id) out.push(`<span class="ev-tag hot">Viral +${Math.round((e.mult - 1) * 100)}%</span>`);
      if (e.type === 'vintage' && e.item === it.id) out.push(`<span class="ev-tag hot">In demand +${Math.round((e.mult - 1) * 100)}%</span>`);
      if (e.type === 'rumor' && e.house === it.house) out.push(`<span class="ev-tag">${owns(it.id) && S.owned[it.id].day < e.start ? 'Older batch +30%' : 'Rumoured reformulation'}</span>`);
      if (e.type === 'celebrity' && e.family === it.family) out.push('<span class="ev-tag">Celebrity pick</span>');
    }
    return out.join('');
  }
  const wishBtn = (it) => (owns(it.id) ? '' : `<button class="wish ${wished(it.id) ? 'on' : ''}" data-action="wish" data-id="${it.id}" aria-pressed="${wished(it.id)}" aria-label="${wished(it.id) ? 'Remove from' : 'Add to'} wishlist: ${esc(it.name)}" title="${wished(it.id) ? 'On your wishlist' : 'Add to wishlist'}">♥</button>`);
  function renderMarketStrip() {
    const rk = RANKS[rankIndex()][1], left = allowanceLeft(), ev = activeEvents(), d = activeDrop();
    const next = ALLOWANCE[rankIndex() + 1];
    const dropHtml = d ? (() => { const it = ITEM_BY_ID[d.id], up = owns(d.id); const price = up ? Math.max(0, d.price - sellPrice(it)) : d.price; return `<article class="panel drop"><div class="drop-art">${bottleSVG(it, 56)}</div><div><p class="eyebrow">Limited drop · until day ${d.end}</p><h3>${esc(itemName(it))}</h3><p class="muted small">Numbered collector’s edition, ${d.of} made: yours would be <b>No. ${d.no}</b>. Worth about 60% more than the standard bottle and climbing.${up ? ' You own the standard bottle: it’s traded in against the price and kept in your stash.' : ''}</p></div><div class="drop-buy"><b>${money(price)}</b><button class="btn btn-primary" data-action="drop-buy"${lack(price)}${!left ? ' disabled title="Your boutique allowance is used up today"' : ''}>${up ? 'Upgrade' : 'Buy'} the edition</button>${togo(price)}</div></article>`; })() : '';
    $('#market').innerHTML = `<div class="market-row"><p class="allow"><b>${left} of ${allowance()}</b> boutique bottles left today · ${esc(rk)} clients${next ? `; the next rank gets ${next} a day` : ''}.</p>${ev.length ? `<ul class="ev-chips">${ev.map((e) => `<li class="ev-${e.type}" title="${esc(e.text)}"><b>${EV_LABEL[e.type]}</b> ${esc(e.type === 'viral' || e.type === 'vintage' ? ITEM_BY_ID[e.item].name : e.type === 'rumor' ? HOUSE_BY_ID[e.house].name : e.type === 'celebrity' ? FAMILIES[e.family].label : e.type === 'sale' ? e.name : e.type === 'competitor' ? ((S.maison && S.maison.creations.find((c) => c.id === e.cid)) || {}).name || '' : '')}<small>${e.end > S.day ? `${e.end - S.day + 1} days` : 'last day'}</small></li>`).join('')}</ul>` : ''}</div>${dropHtml}`;
  }
  function renderRivals() {
    const l = L(), c = l.challenge;
    const chal = c ? `<article class="panel challenge ${c.done ? 'done' : ''}"><p class="eyebrow">${c.done ? 'Race finished' : `Race · ends day ${c.end}`}</p><h3>${esc(c.rival)}: ${c.target} ${esc(c.theme)} bottles</h3>
      <div class="race"><span>You</span>${barX(challengeMine(c), c.target)}<b>${Math.min(challengeMine(c), c.target)}</b><span>${esc(c.rival)}</span>${barX(c.theirs, c.target)}<b>${c.theirs}</b></div><p class="small muted">Bottles bought since day ${c.start} count, from any source. Prize ${money(c.reward)}.</p></article>` : '';
    const offers = l.offers.filter((o) => o.expires >= S.day);
    const offersHtml = offers.length ? `<ul class="wants offers">${offers.map((o) => { const it = ITEM_BY_ID[o.item]; return `<li><div>${bottleSVG(it, 30)}<div><small>${esc(o.rival)} ${o.kind === 'buy' ? 'wants to buy' : 'will sell you'}</small><b>${esc(itemName(it))}</b><small>${money(o.price)} · ${o.kind === 'buy' ? `${Math.round((o.price / value(it) - 1) * 100)}% over value` : `${Math.round((o.price / value(it) - 1) * 100)}% over value`} · until day ${o.expires}</small></div></div><div class="row-actions"><button class="btn btn-primary btn-small" data-action="offer-accept" data-id="${o.id}" ${o.kind === 'buy' ? (owns(o.item) ? '' : 'disabled') : lack(o.price)}>${o.kind === 'buy' ? 'Sell' : 'Buy'}</button><button class="btn btn-small" data-action="offer-decline" data-id="${o.id}">Decline</button></div></li>`; }).join('')}</ul>` : '<p class="muted small">No private offers right now. Rivals reach out every few days.</p>';
    const cards = RIVALS.map((h) => { const inf = RIVAL_INFO[h], st = R(h); const top = st.owned.map((x) => ITEM_BY_ID[x.id]).filter(Boolean).sort((a, b) => value(b) - value(a)).slice(0, 3);
      return `<article class="rival ${st.met ? '' : 'unmet'}"><div class="rv-head"><b>${esc(h)}</b><span class="rv-level lv-${rivalry(st.grudge).toLowerCase()}">${rivalry(st.grudge)}</span></div><p class="small">${esc(inf.name)} · ${esc(inf.bio)}</p>
        <p class="tiny muted">${st.owned.length} bottles${st.lost || st.beat ? ` · you’ve beaten them ${st.lost}×, they’ve beaten you ${st.beat}×` : ''}</p>${top.length ? `<p class="tiny">Prizes: ${top.map((it) => esc(it.name)).join(', ')}</p>` : ''}</article>`; }).join('');
    $('#rivals').innerHTML = `${chal}<h3 class="sub-sm">Private offers</h3>${offersHtml}<h3 class="sub-sm">The collectors</h3><div class="rival-grid">${cards}</div>`;
  }
  const barX = (h, n) => `<div class="bar"><i style="width:${Math.min(100, (h / Math.max(1, n)) * 100)}%"></i></div>`;
  function retailBanner() {
    const r = L().retail, m = S.maison; if (!r || r.expires < S.day || !m) return '';
    return `<article class="panel retail"><p class="eyebrow">Wholesale offer · until day ${r.expires}</p><h3>${esc(r.who)} wants to stock your range</h3><p class="muted small">${r.items.map((x) => { const c = m.creations.find((k) => k.id === x.id); return `${x.q} × ${esc(c ? c.name : '?')}`; }).join(', ')} at 55% of retail. More people discover you (+2 reputation), but those bottles leave your own shelves.</p><div class="row-actions"><button class="btn btn-primary" data-action="retail-accept">Accept · ${money(r.total)}</button><button class="btn" data-action="retail-decline">Decline</button></div></article>`;
  }
  function newsPanel(limit = 12) {
    const l = L(), items = l.feed.slice(0, limit);
    const icon = { market: '◈', rival: '⚔', house: '✦', shop: '★', wish: '♥', you: '●' };
    return `<article class="panel news"><p class="eyebrow">News${unread() ? ` · ${unread()} new` : ''}</p>${items.length ? `<ul class="feed">${items.map((f) => `<li class="${f.n > (l.seen || 0) ? 'new' : ''} k-${f.kind}"><span class="fi" aria-hidden="true">${icon[f.kind] || '•'}</span><div><small>Day ${f.day}</small><p>${esc(f.text)}</p></div>${f.tab ? `<button class="btn btn-small" data-tab="${f.tab}">View</button>` : ''}</li>`).join('')}</ul>` : '<p class="muted small">Your story starts here. Market events, rival moves and your house’s news appear as they happen.</p>'}</article>`;
  }

  /* ---------- JOURNEY: ambitions, next steps, unlocks, finances ---------- */
  const webOrders = () => { const w = S.maison && S.maison.site; return w ? w.days.reduce((a, d) => a + d.o, 0) + w.today.o : 0; };
  const discOwned = () => Object.keys(S.owned).filter((id) => ITEM_BY_ID[id].disc).length;
  const critAvg = (c) => (c.reviews.length ? c.reviews.reduce((a, r) => a + r.stars, 0) / c.reviews.length : 0);
  const sumN = (fn, n) => Array.from({ length: n }, (_, i) => fn(i)).reduce((a, x) => a + x, 0);
  // What your house would fetch: 60% of what you sank into it, stock at cost and a month of recent profit (sales at a ~45% margin).
  function houseValue() {
    const m = S.maison; if (!m) return 0;
    const invested = FOUND_COST + sumN(shopCost, m.shops) + sumN(factoryCost, m.factory) + [0, 30000, 380000][m.nose];
    const recent = (S.ledger || []).slice(-7), daily = recent.length ? recent.reduce((a, d) => a + (d.house || 0), 0) / recent.length : 0;
    return Math.round(invested * 0.6 + m.creations.reduce((a, c) => a + Math.max(0, c.stock) * unitCost(c), 0) + daily * 0.45 * 30);
  }
  const netWorth = () => S.cash + collectionValue() + houseValue();
  const jobAtLeast = (id) => JOBS.indexOf(JOB[S.job]) >= JOBS.indexOf(JOB[id]);
  const AMBITIONS = {
    collector: {
      name: 'The Collector', pitch: 'Own the rarest and most complete collection on Earth.', perk: 'Vault prices 5% lower', icon: '◆',
      stages: [
        { id: 'c1', name: 'A shelf of your own', goal: 'Own 25 bottles', prog: () => [ownedCount(), 25], reward: 2000, tab: 'boutique' },
        { id: 'c2', name: 'House patron', goal: 'Complete every bottle from one house', prog: () => [housesComplete(), 1], reward: 10000, tab: 'collection' },
        { id: 'c3', name: 'Vintage eye', goal: 'Own 5 discontinued bottles', prog: () => [discOwned(), 5], reward: 25000, tab: 'vault' },
        { id: 'c4', name: 'Grail hunter', goal: 'Own a legendary bottle', prog: () => [Object.keys(S.owned).filter((id) => ITEM_BY_ID[id].limited).length, 1], reward: 75000, tab: 'vault' },
        { id: 'c5', name: 'The library', goal: 'Own 300 bottles and complete 10 houses', prog: () => [Math.min(ownedCount(), 300) + Math.min(housesComplete(), 10) * 30, 600], reward: 250000, tab: 'collection' },
        { id: 'c6', name: 'Every bottle on Earth', goal: `Own all ${CATALOG.length} fragrances`, prog: () => [ownedCount(), CATALOG.length], ending: 'The world’s most complete fragrance collection is yours.', tab: 'collection' },
      ],
    },
    perfumer: {
      name: 'The Perfumer', pitch: 'Create the most respected fragrance house.', perk: '+3 harmony on every formula', icon: '✦',
      stages: [
        { id: 'p1', name: 'A house of your own', goal: 'Found your fragrance house', prog: () => [S.maison ? 1 : 0, 1], reward: 3000, tab: 'atelier' },
        { id: 'p2', name: 'First launch', goal: 'Launch a fragrance', prog: () => [S.maison ? Math.min(1, S.maison.creations.length) : 0, 1], reward: 8000, tab: 'atelier' },
        { id: 'p3', name: 'Critics take notice', goal: 'Launch a fragrance with harmony 85 or more', prog: () => [S.maison ? Math.max(0, ...S.maison.creations.map((c) => c.harmony)) : 0, 85], reward: 20000, tab: 'atelier' },
        { id: 'p4', name: 'A known name', goal: 'Reach house reputation 50', prog: () => [S.maison ? Math.floor(S.maison.rep) : 0, 50], reward: 60000, tab: 'atelier' },
        { id: 'p5', name: 'Signature range', goal: 'Five fragrances averaging 4 stars or more with critics', prog: () => { const cs = S.maison ? S.maison.creations.filter((c) => critAvg(c) >= 4) : []; return [cs.length, 5]; }, reward: 150000, tab: 'atelier' },
        { id: 'p6', name: 'A house for the ages', goal: 'A harmony 92 fragrance and reputation 80', prog: () => (S.maison ? [Math.min(92, Math.max(0, ...S.maison.creations.map((c) => c.harmony))) + Math.min(80, Math.floor(S.maison.rep)), 172] : [0, 172]), ending: 'Your house is spoken of with the great names of perfumery.', tab: 'atelier' },
      ],
    },
    mogul: {
      name: 'The Mogul', pitch: 'Build a global luxury empire.', perk: 'Income tax 10% lower', icon: '▲',
      stages: [
        { id: 'm1', name: 'First fortune', goal: 'Earn $100,000 in total', prog: () => [Math.floor(S.stats.earned), 100000], reward: 5000, tab: 'work' },
        { id: 'm2', name: 'Corner office', goal: 'Become an Investment Banker or higher', prog: () => [jobAtLeast('banker') ? 1 : 0, 1], reward: 20000, tab: 'career' },
        { id: 'm3', name: 'Retail footprint', goal: 'Open 2 boutiques for your house', prog: () => [S.maison ? S.maison.shops : 0, 2], reward: 60000, tab: 'atelier' },
        { id: 'm4', name: 'Online empire', goal: 'Take 250 website orders', prog: () => [webOrders(), 250], reward: 120000, tab: 'atelier' },
        { id: 'm5', name: 'Eight figures', goal: 'Reach a net worth of $10,000,000', prog: () => [Math.floor(netWorth()), 1e7], reward: 400000, tab: 'atelier' },
        { id: 'm6', name: 'Scent empire', goal: 'Group CEO, 6 boutiques and $50,000,000 net worth', prog: () => [(S.job === 'ceo' ? 1 : 0) + (S.maison ? S.maison.shops / 6 : 0) + Math.min(1, netWorth() / 5e7), 3], ending: 'From a kitchen-table decant business to a global luxury group.', tab: 'career' },
      ],
    },
  };
  const J = () => (S.journey = S.journey || { done: {}, ended: {} });
  const stageDone = (st) => { const [have, need] = st.prog(); return have >= need; };
  function journeyCheck() {
    const a = AMBITIONS[S.ambition]; if (!a) return;
    for (const st of a.stages) {
      if (J().done[st.id]) continue;
      if (!stageDone(st)) break; // stages unlock in order
      J().done[st.id] = S.day;
      if (st.reward) { S.cash += st.reward; toast(`<b>${esc(a.name)}: ${esc(st.name)}</b><span>${esc(st.goal)}. Reward ${money(st.reward)}.</span>`, 'gold'); SFX.play('unlock'); }
      if (st.ending && !J().ended[S.ambition]) { J().ended[S.ambition] = S.day; setTimeout(() => openEnding(S.ambition), 900); }
    }
  }
  function openEnding(id) {
    const a = AMBITIONS[id], m = S.maison;
    const best = m && m.creations.length ? m.creations.slice().sort((x, y) => y.harmony - x.harmony)[0] : null;
    SFX.play('unlock');
    openDlg(`<p class="eyebrow">Chapter complete · day ${S.day}</p><h2 class="dlg-title">${esc(a.name)}</h2><p class="lede">${esc(a.stages[a.stages.length - 1].ending)}</p>
      <dl class="kv compact ending-stats"><div><dt>Bottles</dt><dd>${ownedCount()} of ${CATALOG.length}</dd></div><div><dt>Collection value</dt><dd>${short(collectionValue())}</dd></div><div><dt>Net worth</dt><dd>${short(netWorth())}</dd></div><div><dt>Earned in total</dt><dd>${short(S.stats.earned)}</dd></div><div><dt>Career</dt><dd>${esc(JOB[S.job].title)}</dd></div><div><dt>Trophies</dt><dd>${ACH.filter((x) => S.ach[x.id]).length} of ${ACH.length}</dd></div>${m ? `<div><dt>Your house</dt><dd>${esc(m.name)}, ${m.creations.length} ${m.creations.length === 1 ? 'fragrance' : 'fragrances'}</dd></div>` : ''}${best ? `<div><dt>Finest creation</dt><dd>${esc(best.name)} · harmony ${best.harmony}</dd></div>` : ''}</dl>
      <p class="muted small">Your game carries on. Take on another ambition from the Journey tab any time; the stages you’ve finished stay finished.</p>
      <div class="row-actions dlg-actions"><button class="btn" data-action="dlg-close">Keep playing</button><button class="btn btn-primary dlg-primary" data-action="journey-pick-open">Choose another ambition</button></div>`, 'dlg-ending');
  }
  function ambitionCards(cur) {
    return `<div class="amb-cards">${Object.entries(AMBITIONS).map(([id, a]) => `<button class="amb-card ${cur === id ? 'on' : ''}" data-action="journey-pick" data-id="${id}" aria-pressed="${cur === id}"><span class="amb-icon" aria-hidden="true">${a.icon}</span><b>${esc(a.name)}</b><span>${esc(a.pitch)}</span><small>Perk: ${esc(a.perk)}</small>${J().ended[id] ? '<small class="good">Completed</small>' : ''}</button>`).join('')}</div>`;
  }
  function openWelcome() {
    openDlg(`<p class="eyebrow">Welcome to Sillage</p><h2 class="dlg-title">From decant packer to fragrance legend</h2>
      <ol class="welcome-steps"><li><b>Work shifts</b> on the Work tab to earn money. Better jobs unlock as you gain experience and bottles.</li><li><b>Collect real fragrances</b> in the Boutique and Vault. Your collection unlocks jobs, trophies and your own house.</li><li><b>Found your house</b> at 10 bottles: compose, design and sell your own fragrances, then open a website.</li></ol>
      <p class="muted">Choose an ambition. It sets your goals, rewards and ending, and gives you a perk. You can change it later in the Journey tab.</p>${ambitionCards(null)}
      <div class="row-actions dlg-actions"><button class="btn" data-action="journey-later">Decide later</button></div>`, 'dlg-welcome');
  }
  // The most useful things to do now, each with the reason it matters.
  function nextSteps() {
    const out = [], n = ownedCount(), job = JOB[S.job], m = S.maison;
    const add = (text, why, tab, cta) => out.push({ text, why, tab, cta });
    const nextJob = JOBS.slice(JOBS.indexOf(job) + 1).filter((j) => jobOpen(j) && baseWage(j) > baseWage(job)).pop();
    const an = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
    if (n === 0) add('Buy your first bottle', 'Bottles unlock better jobs, trophies, the decant desk and your own house. Afnan, Rayhaan and Lattafa start under $50.', 'boutique', 'Go to the Boutique');
    if (n && !S.signature) add('Wear a signature scent', 'Wearing one adds 5%; if its family matches your job’s, you earn 30% more every shift.', 'collection', 'Open your Collection');
    else if (S.signature && ITEM_BY_ID[S.signature].family !== job.vibe && n) add(`Switch to ${an(FAMILIES[job.vibe].label.toLowerCase())} signature`, `Your job rewards ${FAMILIES[job.vibe].label.toLowerCase()} scents: +30% pay per shift.`, 'collection', 'Choose a scent');
    if (nextJob) add(`Take the ${nextJob.title} job`, `It pays ${money(baseWage(nextJob))} a shift against ${money(baseWage(job))} now.`, 'career', 'Open Career');
    const upcoming = JOBS.slice(JOBS.indexOf(job) + 1).find((j) => !jobOpen(j));
    const course = upcoming && upcoming.req.course && !S.courses[upcoming.req.course] ? COURSE[upcoming.req.course] : null;
    if (course && S.cash >= course.cost) add(`Enroll in the ${course.name}`, `${course.note}. You can afford it now.`, 'career', 'Open Career');
    if (n >= 8 && !S.desk && S.cash >= deskCost()) add('Open a decant desk', 'Passive income every minute you play, growing with the value of your shelf.', 'work', 'Go to Work');
    if (n >= FOUND_BOTTLES && !m) add('Found your own fragrance house', S.cash >= FOUND_COST ? 'Compose, design and sell your own fragrances. It becomes your biggest earner.' : `You have the bottles; it costs ${money(FOUND_COST)} (${money(FOUND_COST - S.cash)} to go).`, 'atelier', 'Open Your House');
    if (m && !m.creations.length) add('Launch your first fragrance', 'Critics review it, it sells every shift and the first bottle unboxes onto your shelf.', 'atelier', 'Create a fragrance');
    if (m) { const out0 = m.creations.find((c) => c.stock <= 0 && ITEM_BY_ID[c.id]); if (out0) add(`Restock ${out0.name}`, 'It’s sold out, so it earns nothing until you produce another batch.', 'atelier', 'Open your range'); }
    if (m && m.creations.length && !m.site && S.cash >= SITE_COST * 0.6) add('Open your website', 'Online customers buy around the clock, with reviews, a What’s hot chart and your own checkout.', 'atelier', 'Open Your House');
    const l = L(), offers = l.offers.filter((o) => o.expires >= S.day);
    if (l.retail && l.retail.expires >= S.day && m) add(`Answer ${l.retail.who}`, `They want ${l.retail.items.reduce((s2, x) => s2 + x.q, 0)} bottles for ${money(l.retail.total)} at wholesale. The offer ends day ${l.retail.expires}.`, 'atelier', 'See the offer');
    if (offers.length) add(`${offers.length} private offer${offers.length === 1 ? '' : 's'} from rival collectors`, offers.map((o) => `${o.rival} ${o.kind === 'buy' ? 'wants your' : 'is selling'} ${ITEM_BY_ID[o.item].name}`).join('; ') + '.', 'vault', 'Open the Vault');
    if (l.challenge && !l.challenge.done) add(`Race ${l.challenge.rival}: ${l.challenge.target} ${l.challenge.theme} bottles by day ${l.challenge.end}`, `You have ${challengeMine(l.challenge)}, they have ${l.challenge.theirs}. Prize ${money(l.challenge.reward)}.`, 'vault', 'See the race');
    const dr = activeDrop(); if (dr && !(owns(dr.id) && S.owned[dr.id].edition)) add(`Limited drop: ${ITEM_BY_ID[dr.id].name}`, `A numbered edition worth about 60% more than the standard bottle, until day ${dr.end}.`, 'boutique', 'See the drop');
    const a = AMBITIONS[S.ambition];
    if (a) { const st = a.stages.find((x) => !J().done[x.id]); if (st) { const [h, need] = st.prog(); add(`${a.name}: ${st.goal}`, `Next stage of your ambition${st.reward ? `, worth ${money(st.reward)}` : ''}. ${progressText(h, need)}.`, st.tab, 'Go'); } }
    else add('Choose an ambition', 'It gives you goals, rewards, a perk and an ending to play toward.', 'journey', 'Choose below');
    return out;
  }
  const progressText = (h, need) => (need >= 1e5 ? `${short(Math.min(h, need))} of ${short(need)}` : `${Math.min(h, need).toLocaleString('en-US')} of ${need.toLocaleString('en-US')}`);
  const bar = (h, need) => `<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(Math.min(1, h / need) * 100)}"><i style="width:${Math.min(100, (h / need) * 100)}%"></i></div>`;
  // Progress for trophies that count something, so the closest ones can be shown.
  const ACH_PROG = {
    first: () => [ownedCount(), 1], ten: () => [ownedCount(), 10], fifty: () => [ownedCount(), 50], lib: () => [ownedCount(), 150], museum: () => [ownedCount(), 300], all: () => [ownedCount(), CATALOG.length],
    perfect: () => [S.stats.perfect, 10], seller: () => [S.stats.matches, 25], vintage: () => [discOwned(), 5], oud: () => [countFam('oud'), 15],
    house5: () => [housesComplete(), 5], house20: () => [housesComplete(), 20], million: () => [Math.floor(collectionValue()), 1e6],
    range: () => [S.maison ? S.maison.creations.length : 0, 5], kbottles: () => [S.maison ? S.maison.stats.sold : 0, 10000], eshop: () => [webOrders(), 1000], cult: () => [S.maison ? Math.floor(S.maison.rep) : 0, 80],
  };
  function renderJourney() {
    const a = AMBITIONS[S.ambition], steps = nextSteps().slice(0, 4), job = JOB[S.job], m = S.maison;
    const amb = a ? `<article class="panel journey-amb"><div class="ja-head"><div><p class="eyebrow">Your ambition</p><h2>${a.icon} ${esc(a.name)}</h2><p class="muted">${esc(a.pitch)} · Perk: ${esc(a.perk)}</p></div><button class="btn" data-action="journey-pick-open">Change</button></div>
        <ol class="stages">${a.stages.map((st, i) => { const done = J().done[st.id], cur = !done && a.stages.slice(0, i).every((x) => J().done[x.id]); const [h, need] = st.prog();
          return `<li class="${done ? 'done' : cur ? 'now' : ''}"><span class="st-dot" aria-hidden="true">${done ? '✓' : i + 1}</span><div><b>${esc(st.name)}</b><small>${esc(st.goal)}</small>${cur ? bar(h, need) + `<small>${progressText(h, need)}</small>` : ''}${done ? `<small class="good">Day ${done}</small>` : ''}</div><em>${st.ending ? 'Ending' : short(st.reward)}</em></li>`; }).join('')}</ol></article>`
      : `<article class="panel journey-amb"><p class="eyebrow">Choose your ambition</p><h2>What kind of legend will you be?</h2><p class="muted">Each ambition sets goals with rewards, gives a perk and ends with its own finale. You can switch any time.</p>${ambitionCards(null)}</article>`;
    const next = `<article class="panel"><p class="eyebrow">Recommended next</p><ul class="next-steps">${steps.map((x) => `<li><div><b>${esc(x.text)}</b><small>${esc(x.why)}</small></div><button class="btn btn-small" data-tab="${x.tab}">${esc(x.cta)}</button></li>`).join('') || '<li class="muted">You’re on top of everything. Keep collecting.</li>'}</ul></article>`;
    // Unlocks coming up, with what's still missing.
    const ups = [];
    const lockedJob = JOBS.slice(JOBS.indexOf(job) + 1).find((j) => !jobOpen(j));
    if (lockedJob) ups.push({ name: lockedJob.title, why: `${money(baseWage(lockedJob))} a shift`, reqs: reqList(lockedJob).map((r) => ({ label: r.text, ok: r.ok, h: r.n ? r.have : r.ok ? 1 : 0, n: r.n || 1 })), tab: 'career' });
    if (!S.desk) ups.push({ name: 'Decant desk', why: 'Passive income while you play', reqs: [{ label: 'Own 8 bottles', ok: ownedCount() >= 8, h: ownedCount(), n: 8 }, { label: `${money(deskCost())} to open`, ok: S.cash >= deskCost(), h: Math.min(S.cash, deskCost()), n: deskCost() }], tab: 'work' });
    if (!m) ups.push({ name: 'Your own house', why: 'Make and sell your own fragrances', reqs: [{ label: `Own ${FOUND_BOTTLES} bottles`, ok: ownedCount() >= FOUND_BOTTLES, h: ownedCount(), n: FOUND_BOTTLES }, { label: `${money(FOUND_COST)} to found`, ok: S.cash >= FOUND_COST, h: Math.min(S.cash, FOUND_COST), n: FOUND_COST }], tab: 'atelier' });
    else if (!m.site) ups.push({ name: 'House website', why: 'Sell online around the clock', reqs: [{ label: 'Launch a fragrance', ok: m.creations.length > 0, h: Math.min(1, m.creations.length), n: 1 }, { label: `${money(SITE_COST)} to launch`, ok: S.cash >= SITE_COST, h: Math.min(S.cash, SITE_COST), n: SITE_COST }], tab: 'atelier' });
    const rk = RANKS.find(([t]) => t > ownedCount()); if (rk) ups.push({ name: `Rank: ${rk[1]}`, why: 'Your standing among collectors', reqs: [{ label: `Own ${rk[0]} bottles`, ok: false, h: ownedCount(), n: rk[0] }], tab: 'boutique' });
    const unlocks = `<article class="panel"><p class="eyebrow">Coming up</p><ul class="unlocks">${ups.map((u) => `<li><div class="ul-head"><b>${esc(u.name)}</b><small class="muted">${esc(u.why)}</small><button class="btn btn-small" data-tab="${u.tab}">Go</button></div>${u.reqs.map((r) => `<div class="ul-req ${r.ok ? 'ok' : ''}"><span>${r.ok ? '✓' : '○'} ${esc(r.label)}</span>${r.ok ? '' : bar(r.h, r.n)}</div>`).join('')}</li>`).join('') || '<li class="muted">Everything is unlocked.</li>'}</ul></article>`;
    // The closest trophies.
    const near = ACH.filter((x) => !S.ach[x.id] && ACH_PROG[x.id]).map((x) => { const [h, n] = ACH_PROG[x.id](); return { x, h, n, r: h / n }; }).filter((t) => t.r < 1).sort((p, q) => q.r - p.r).slice(0, 3);
    const trophies = `<article class="panel"><p class="eyebrow">Nearly there</p><ul class="unlocks">${near.map((t) => `<li><div class="ul-head"><b>${esc(t.x.name)}</b><small class="muted">${esc(t.x.desc)} · ${short(t.x.reward)}</small></div><div class="ul-req">${bar(t.h, t.n)}<span class="small muted">${progressText(t.h, t.n)}</span></div></li>`).join('') || '<li class="muted">Every countable trophy is done.</li>'}</ul></article>`;
    // The books: the last week and today's running costs.
    const up = upkeep(), led = (S.ledger || []).slice(-7).reverse(), z = (v, sign = '') => (v ? sign + short(v) : '—');
    const COST_WHY = { storage: `$${ECON.storagePerBottle} a day for each bottle beyond your free shelf of ${ECON.freeShelf}`, insurance: 'Discontinued bottles 0.2% and legendary bottles 0.3% of their value a day', rent: 'Your house’s boutiques, 0.2% of what you paid a day', staff: 'Your perfumer’s salary', factory: 'Factory upkeep, 0.3% of what you paid a day', hosting: 'Website hosting' };
    const fin = `<article class="panel journey-fin"><p class="eyebrow">Your finances</p>
      <dl class="kv compact"><div><dt>Net worth</dt><dd>${short(netWorth())}</dd></div><div><dt>Cash</dt><dd>${money(S.cash)}</dd></div><div><dt>Collection</dt><dd>${short(collectionValue())}</dd></div>${m ? `<div><dt>Your house</dt><dd>${short(houseValue())}</dd></div>` : ''}<div><dt>Running costs</dt><dd>${money(up.total)} a day</dd></div></dl>
      ${up.total ? `<ul class="costs">${Object.entries(up).filter(([k, v]) => k !== 'total' && v).map(([k, v]) => `<li><span>${k[0].toUpperCase() + k.slice(1)}<small>${COST_WHY[k]}</small></span><b>${money(v)}</b></li>`).join('')}</ul>` : '<p class="small muted">No running costs yet. Storage starts beyond 60 bottles; rare bottles and your house’s premises cost upkeep.</p>'}
      <p class="small muted">Shift pay is taxed: nothing on the first ${money(ECON.taxBrackets[1][0])}, 25% up to ${money(ECON.taxBrackets[2][0])}, 40% above${S.ambition === 'mogul' ? ' (10% less as a Mogul)' : ''}.</p>
      ${led.length ? `<div class="ledger-wrap"><table class="ledger"><thead><tr><th>Day</th><th>Pay</th><th>Tax</th><th>House</th><th>Desk</th><th>Costs</th><th>Net</th></tr></thead><tbody>${led.map((d) => `<tr><td>${d.day}</td><td>${z(d.wages)}</td><td>${z(d.tax, '−')}</td><td>${z(d.house)}</td><td>${z(d.desk)}</td><td>${z(d.upkeep, '−')}</td><td class="${d.net >= 0 ? 'good' : 'bad'}">${d.net >= 0 ? '+' : '−'}${short(Math.abs(d.net))}</td></tr>`).join('')}</tbody></table></div><p class="tiny muted">Net includes everything else you bought and sold that day.</p>` : '<p class="small muted">Your daily books appear here after your first full day.</p>'}</article>`;
    const how = `<details class="panel how"><summary><span class="eyebrow">How it all connects</span></summary>
      <ol class="welcome-steps"><li><b>Work</b> earns cash. Each job rewards one scent family; wearing a matching signature adds 30%.</li><li><b>Bottles</b> are the key to everything: they unlock jobs (Reviewer at 12, Perfumer at 40, Influencer at 150), the decant desk at 8, your house at 10 and ranks along the way.</li><li><b>Courses</b> cost money but open the high-paying careers.</li><li><b>Your house</b> turns harmony, price and reputation into daily sales; boutiques, factories and perfumers grow it but cost upkeep, and your fragrances compete with each other.</li><li><b>The website</b> adds online customers, reviews and your own checkout.</li><li><b>Running costs</b> come out at the end of each day. Rare bottles gain value but cost insurance; a bigger shelf costs storage.</li></ol></details>`;
    $('#tab-journey').innerHTML = `<div class="journey">${amb}<div class="journey-grid">${next}${newsPanel()}${unlocks}${trophies}</div>${fin}${how}</div>`;
    L().seen = L().feedN || 0;
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

  /* ---------- YOUR HOUSE: found a maison, compose, design, launch, sell ---------- */
  const M = () => S.maison;
  const FOUND_COST = 15000, FOUND_BOTTLES = 10, DRAFT_KEY = 'mine|__draft';
  const LAB_COST = [0, 0, 12000, 45000, 160000, 600000];
  const NOSES = [null, { name: 'Junior nose from Grasse', cost: 30000, bonus: 4 }, { name: 'Master perfumer', cost: 350000, bonus: 10 }];
  const SHOP_NAMES = ['Pop-up counter', 'Flagship boutique', 'Paris, rue Saint-Honoré', 'Dubai Mall', 'Fifth Avenue', 'Ginza, Tokyo'];
  const ADS = [
    { id: 'social', name: 'Social campaign', cost: 5000, days: 5, mult: 1.3 }, { id: 'mag', name: 'Magazine spread', cost: 40000, days: 7, mult: 1.7 },
    { id: 'board', name: 'Billboards', cost: 150000, days: 7, mult: 2.2 }, { id: 'celeb', name: 'Celebrity face', cost: 600000, days: 10, mult: 3 },
  ];
  const CLIENTS = ['A boutique hotel in Lisbon', 'A yacht charter in Monaco', 'A department store in Seoul', 'A members’ club in London', 'A fashion week show in Milan', 'A luxury car launch', 'A wedding planner in Dubai', 'An airline first-class lounge', 'A five-star spa in Bali', 'A gallery opening in New York'];
  const REVIEW = {
    5: ['A masterpiece. The {acc} is done better than the big houses manage.', 'Instant blind buy. Compliment monster.', 'Straight into my top ten. Bravo.'],
    4: ['Really well made {fam}. The {note} is gorgeous.', 'Strong performer, lasted all day on me.', 'Would happily wear this over most designer releases.'],
    3: ['Decent, a little safe.', 'Lovely opening, the drydown is generic.', 'Good, not great. Worth a sample.'],
    2: ['Something clashes in the heart.', 'Muddled after an hour.', 'Overpriced for what it is.'],
    1: ['Scrubber. Sorry.', 'All I get is alcohol.', 'Who signed off on this?'],
  };
  const factoryCost = (n) => Math.round(20000 * Math.pow(3, n));
  const shopCost = (n) => Math.round(50000 * Math.pow(2.6, n));
  const maxNotes = () => 5 + M().lab;
  const harmonyBonus = () => (M().lab - 1) * 2 + (M().nose ? NOSES[M().nose].bonus : 0) + (S.ambition === 'perfumer' ? 3 : 0);
  const devFee = () => Math.min(50000, 2000 + 1500 * M().creations.length);
  function unitCost(c) { return Math.round(((c.oilCost * Maison.CONC[c.conc].oil + Maison.designCost(c.design) + 3) * (1 - 0.08 * M().factory) + 3) * (eventOf('shortage') ? 1.3 : 1) * 100) / 100; }
  function fairPrice(c) { return Math.max(10, Math.round((25 + unitCost(c) * 2.2) * Maison.CONC[c.conc].mult * (0.55 + c.harmony / 100) * (0.6 + M().rep / 60) * (1 + Maison.designCost(c.design) / 60) * (c.limited ? 1.4 : 1))); }
  const adMult = () => M().ads.filter((a) => a.until >= S.day).reduce((m, a) => m * a.mult, 1);
  const trendFam = () => { ensureMarket(); const c = eventOf('celebrity'); return c ? c.family : S.market.trend; };
  function demand(c) {
    const m = M(); let d = (4 + m.rep * 1.4 + shopDemand(m.shops)) * 1.2 * segments(c).total;
    if (c.family === trendFam()) d *= 1.5;
    d *= adMult();
    if (S.day - c.launched < 7) d *= 1.6;
    d *= Math.pow(Math.max(1, m.creations.filter((x) => x.stock > 0).length), -ECON.rangeCompetition);
    for (const e of activeEvents()) { if (e.type === 'celebrity' && e.family === c.family) d *= 1.6; if (e.type === 'competitor' && e.cid === c.id) d *= 0.7; }
    // Loyal fans buy again; a new release gets pre-orders from fans of the rest of the range.
    d += (c.fans || 0) * 0.05;
    if (S.day - c.launched < 7) d += m.creations.filter((x) => x !== c).reduce((a, x) => a + (x.fans || 0), 0) * 0.03;
    return d;
  }
  // Sales for a fraction of a day; returns { units, revenue }.
  function maisonTick(frac) {
    const m = M(); if (!m) return { units: 0, revenue: 0 };
    let revenue = 0, units = 0, rep = 0;
    for (const c of m.creations) {
      if (!c.stock) continue;
      const n = Math.min(c.stock, Math.round(demand(c) * frac * (0.75 + Math.random() * 0.5)));
      if (n <= 0) continue;
      c.stock -= n; c.sold += n; c.today = (c.today || 0) + n;
      const rv = n * c.price; c.revenue += rv; revenue += rv; units += n; rep += n * (c.harmony - 35) / 4000;
      if (!c.stock) {
        toast(`<b>${esc(c.name)} sold out</b><span>${c.limited ? 'Every numbered bottle has found a home.' : 'Produce another batch in Your House.'}</span>`);
        const best = m.creations.slice().sort((a, b) => b.sold - a.sold)[0];
        if (c.limited) news('house', `Your limited edition ${c.name} has sold out: all ${c.sold.toLocaleString('en-US')} numbered bottles.`, 'atelier');
        else if (c === best && m.shops > 0) news('house', `Your ${SHOP_NAMES[m.shops - 1]} has sold out of ${c.name}, your signature scent.`, 'atelier');
      }
    }
    if (units) {
      S.cash += revenue; S.stats.earned += revenue; m.stats.sold += units; m.stats.revenue += revenue; flow().house += revenue;
      m.todayUnits = (m.todayUnits || 0) + units; m.todayRev = (m.todayRev || 0) + revenue;
      m.rep = Math.max(0, Math.min(100, m.rep + Math.min(3 * frac, rep)));
    }
    const wt = webTick(frac);
    return { units: units + wt.units, revenue: revenue + wt.revenue };
  }
  function maisonNewDay() {
    const m = M(); if (!m) return;
    m.ledger.push({ day: S.day - 1, units: m.todayUnits || 0, revenue: m.todayRev || 0 }); m.ledger = m.ledger.slice(-14);
    m.todayUnits = 0; m.todayRev = 0;
    for (const c of m.creations) { c.hist = (c.hist || []).concat(c.today || 0).slice(-14); c.yesterday = c.today || 0; c.today = 0; }
    webNewDay();
  }
  function ensureComms() {
    const m = M(); if (m.comms && m.comms.day === S.day) return;
    const r = rng(S.seed + ':comm:' + S.day); const fams = Object.keys(FAMILIES);
    m.comms = { day: S.day, list: [0, 1].map(() => ({ who: pick(CLIENTS, r), family: pick(fams, r), min: 55 + Math.floor(r() * 30), qty: [50, 100, 200, 400][Math.floor(r() * 4)], ppb: Math.round(60 + r() * 190), done: false })) };
  }
  function makeReviews(c) {
    const fair = fairPrice(c);
    return RIVALS.slice().sort(() => Math.random() - 0.5).slice(0, 3).map((who) => {
      let st = Math.round((c.harmony - 25) / 15 + (Math.random() - 0.5) * 1.2);
      if (c.price > fair * 1.6) st--;
      st = Math.max(1, Math.min(5, st));
      const acc = c.accords[0] || 'blend', note = Maison.NOTE[c.notes.heart[0] || c.notes.top[0] || c.notes.base[0]].name.toLowerCase();
      return { who, stars: st, text: pick(REVIEW[st]).replace('{acc}', acc.toLowerCase()).replace('{fam}', FAMILIES[c.family].label.toLowerCase()).replace('{note}', note) };
    });
  }
  const houseInfo = () => ({ house: M().name, city: M().city, lbg: M().lbg, lfg: M().lfg });
  function newDraft() {
    const m = M();
    return { sel: { top: [], heart: [], base: [] }, conc: 'edp', name: '',
      design: { shape: 'block', glass: 'clear', color: '#1a1a1a', juice: '#e8c27a', cap: 'cylinder', capFin: 'gold', label: 'paper', ink: m.lfg, decor: 'none', pfin: 'ink', extra: 'none' },
      box: { style: 'carton', paper: m.lbg, ink: m.lfg, pattern: 'border', emblem: 'none', foil: false }, price: 0, qty: 100 };
  }
  // The draft as an item, with its bottle and box specs registered for the 3D preview.
  function draftItem() {
    const d = ui.atelier.draft, an = Maison.analyse(d.sel, { maxNotes: maxNotes(), bonus: harmonyBonus() });
    HOUSE_BY_ID.mine = HOUSE_BY_ID.mine || { id: 'mine', name: M().name, origin: M().city, shape: 'square', cap: 'gold', lbg: M().lbg, lfg: M().lfg, items: '' };
    const info = Object.assign(houseInfo(), { name: d.name || 'Untitled', conc: d.conc });
    BottleCraft.add({ [DRAFT_KEY]: Maison.bottleSpec(d.design, info) }); BottleCraft.forget(DRAFT_KEY);
    BoxCraft.add({ [DRAFT_KEY]: Maison.boxSpec(d.box, info) });
    return { id: 'mine-draft', key: DRAFT_KEY, name: info.name, house: 'mine', family: an.family, tier: 'niche', base: 100 };
  }
  function showDraft() {
    const host = $('#mp-view'); if (!host || typeof Maison === 'undefined') return;
    if (!Maison.Preview.mount(host)) { host.innerHTML = '<p class="muted">3D preview needs WebGL.</p>'; return; }
    Maison.Preview.show(draftItem(), ui.atelier.step === 2 ? 'box' : 'bottle');
  }
  function draftAnalysis() { return Maison.analyse(ui.atelier.draft.sel, { maxNotes: maxNotes(), bonus: harmonyBonus() }); }
  function draftCreation() {
    const d = ui.atelier.draft, an = draftAnalysis();
    return { limited: !!d.limited, name: d.name.trim(), conc: d.conc, notes: d.sel, family: an.family, harmony: an.harmony, oilCost: an.oilCost, accords: an.accords.map((a) => a.name), design: d.design, box: d.box, longevity: Maison.longevity(an, d.conc) };
  }

  function stars(n) { return '<span class="stars" aria-label="' + n + ' of 5">' + '★'.repeat(n) + '<i>' + '★'.repeat(5 - n) + '</i></span>'; }
  function opt(obj, cur) { return Object.entries(obj).map(([k, v]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${esc(typeof v === 'string' ? v : v.label)}</option>`).join(''); }

  function renderAtelier() {
    const el = $('#tab-atelier'); const m = M();
    if (!m) {
      const ok = ownedCount() >= FOUND_BOTTLES, f = ui.atelier.found;
      el.innerHTML = `<div class="section-head"><div><p class="eyebrow">Your own house</p><h1>Found a maison</h1></div><p class="muted">Every great house started with a collector who knew what was missing. Name your house, pick its city and colours, then compose fragrances, design their bottles and boxes, and sell them to the world.</p></div>
        <div class="found-grid">
          <article class="panel">
            <label class="field"><span>House name</span><input id="mf-name" maxlength="28" value="${esc(f.name)}" placeholder="Maison …"></label>
            <label class="field"><span>Home city</span><select id="mf-city">${Maison.CITIES.map((c) => `<option ${c === f.city ? 'selected' : ''}>${c}</option>`).join('')}</select></label>
            <div class="field"><span>House colours</span><div class="palettes">${Maison.PALETTES.map(([bg, fg, nm], i) => `<button class="pal ${f.pal === i ? 'on' : ''}" data-action="pal" data-i="${i}" title="${nm}" style="--bg:${bg};--fg:${fg}"><b>Aa</b><small>${nm}</small></button>`).join('')}</div></div>
            <div class="row-actions"><button class="btn btn-primary btn-big" data-action="found" ${!ok ? 'disabled' : lack(FOUND_COST)}>Found the house · ${money(FOUND_COST)}</button>${ok ? togo(FOUND_COST) : ''}</div>
            <p class="hint">${ok ? (S.cash >= FOUND_COST ? 'Registering the name, a small lab and your first raw materials.' : `You need ${money(FOUND_COST - S.cash)} more.`) : `Own ${FOUND_BOTTLES} bottles first so you know what the market smells like (${ownedCount()}/${FOUND_BOTTLES}).`}</p>
          </article>
          <article class="panel found-preview" style="--bg:${Maison.PALETTES[f.pal][0]};--fg:${Maison.PALETTES[f.pal][1]}"><p class="fp-name">${esc((f.name || 'Your house').toUpperCase())}</p><p class="fp-city">${esc(f.city.toUpperCase())}</p></article>
        </div>`;
      return;
    }
    ensureComms();
    const a = ui.atelier; const trend = trendFam();
    const head = `<div class="section-head"><div><p class="eyebrow">${esc(m.city)} · founded day ${m.day}</p><h1>${esc(m.name)}</h1></div>
      <div class="maison-stats"><div><span class="muted">Reputation</span><b>${Math.round(m.rep)}</b><div class="bar"><i style="width:${m.rep}%"></i></div></div><div><span class="muted">Bottles sold</span><b>${m.stats.sold.toLocaleString('en-US')}</b></div><div><span class="muted">Revenue</span><b>${short(m.stats.revenue)}</b></div><div><span class="muted">Trending today</span><b><span class="fam fam-${trend}">${FAMILIES[trend].label}</span></b></div></div></div>
      <div class="subnav">${[['range', 'Your range'], ['lab', 'Create a fragrance'], ['biz', 'Business'], ['site', 'Website']].map(([k, l]) => `<button class="${a.view === k ? 'on' : ''}" data-action="mview" data-v="${k}">${l}</button>`).join('')}</div>`;
    let body = '';
    if (a.view === 'range') body = renderRange();
    else if (a.view === 'lab') body = renderLab();
    else if (a.view === 'site') body = renderWebsite();
    else body = renderBiz();
    // Keep the website's scroll position across re-renders unless the page changed.
    const sv = $('#site-view'); if (sv && !site.jump) site.scrollTop = sv.scrollTop; site.jump = false;
    el.innerHTML = head + body;
    if (a.view === 'lab' && (a.step === 1 || a.step === 2 || a.step === 3)) showDraft();
    if (a.view === 'site') { const nv = $('#site-view'); if (nv) nv.scrollTop = site.scrollTop; fillSnaps(); }
    heroTimer();
  }

  function renderRange() {
    const m = M();
    if (!m.creations.length) return `<div class="panel empty-house"><h2>Your shelves are bare</h2><p class="muted">Compose your first fragrance: pick top, heart and base notes, design the bottle and box, then launch it.</p><button class="btn btn-primary" data-action="mview" data-v="lab">Create a fragrance</button></div>`;
    return `${retailBanner()}<div class="range">${m.creations.map((c, i) => {
      const it = ITEM_BY_ID[c.id], u = unitCost(c), fair = fairPrice(c), avg = c.reviews.length ? Math.round(c.reviews.reduce((x, r) => x + r.stars, 0) / c.reviews.length) : 0;
      return `<article class="panel creation">
        <div class="cr-head">${bottleSVG(it, 40)}<div><p class="house">${esc(Maison.CONC[c.conc].label)} · launched day ${c.launched}</p><h3>${esc(c.name)}</h3><p class="tags"><span class="fam fam-${c.family}">${FAMILIES[c.family].label}</span><span class="tier">Harmony ${c.harmony}</span>${stars(avg)}</p></div></div>
        <p class="muted small">${c.notes.top.concat(c.notes.heart, c.notes.base).map((n) => Maison.NOTE[n].name).join(' · ')}${c.accords.length ? ` — <i>${esc(c.accords.join(', '))}</i>` : ''}</p>
        <dl class="kv compact"><div><dt>In stock</dt><dd>${c.stock.toLocaleString('en-US')}</dd></div><div><dt>Sold yesterday / total</dt><dd>${c.yesterday || 0} / ${c.sold.toLocaleString('en-US')}</dd></div><div><dt>Price · fair · unit cost</dt><dd>${money(c.price)} · ${money(fair)} · ${money(u)}</dd></div><div><dt>Revenue</dt><dd>${short(c.revenue)}</dd></div></dl>
        <div class="row-actions"><button class="btn btn-small" data-action="mprice" data-i="${i}" data-d="-0.1">Price −10%</button><button class="btn btn-small" data-action="mprice" data-i="${i}" data-d="0.1">+10%</button><button class="btn btn-small" data-action="mprice" data-i="${i}" data-d="fair">Set to fair</button></div>
        ${(() => { const sg = segments(c), pc = (k) => Math.round((sg[k] / sg.total) * 100); return `<dl class="kv compact"><div><dt>Loyal fans</dt><dd>${Math.round(c.fans || 0).toLocaleString('en-US')}</dd></div><div><dt>Satisfaction</dt><dd class="${(c.sat || satisfaction(c)) < 55 ? 'bad' : ''}">${c.sat || satisfaction(c)} / 100</dd></div><div><dt>Who buys it</dt><dd class="small">${pc('enthusiast')}% enthusiasts · ${pc('budget')}% bargain hunters · ${pc('collector')}% collectors · ${pc('casual')}% casual</dd></div></dl>`; })()}
        <div class="row-actions">${c.limited ? `<p class="small muted">Limited edition: numbered and never restocked.</p>` : [100, 500, 2000, 10000].map((q) => `<button class="btn btn-small" data-action="mproduce" data-i="${i}" data-q="${q}" ${S.cash < q * u ? 'disabled' : ''}>Make ${q.toLocaleString('en-US')} · ${short(q * u)}</button>`).join('')}</div>
        <ul class="reviews">${c.reviews.map((r) => `<li>${stars(r.stars)} <b>${esc(r.who)}</b> “${esc(r.text)}”</li>`).join('')}</ul>
        ${owns(c.id) ? `<button class="btn btn-small" data-action="view3d" data-id="${c.id}">View in the showroom</button>` : ''}
      </article>`;
    }).join('')}</div>`;
  }

  function renderLab() {
    const a = ui.atelier, d = a.draft, an = draftAnalysis(), steps = ['Formula', 'Bottle', 'Box', 'Launch'];
    const nav = `<ol class="steps">${steps.map((s, i) => `<li class="${i === a.step ? 'on' : i < a.step ? 'done' : ''}"><button data-action="mstep" data-s="${i}">${i + 1}. ${s}</button></li>`).join('')}</ol>`;
    const meter = `<div class="harmony"><span class="muted">Harmony</span><b>${an.harmony}</b><div class="bar"><i style="width:${an.harmony}%"></i></div></div>`;
    const summary = `<article class="panel lab-summary">${meter}
      <dl class="kv compact"><div><dt>Family</dt><dd><span class="fam fam-${an.family}">${FAMILIES[an.family].label}</span></dd></div><div><dt>Longevity</dt><dd>${Maison.longevity(an, d.conc)} h</dd></div><div><dt>Oils per bottle</dt><dd>${money(an.oilCost * Maison.CONC[d.conc].oil)}</dd></div><div><dt>Notes</dt><dd>${an.ids.length} / ${maxNotes()}</dd></div></dl>
      ${an.accords.length ? `<p class="small"><b>Accords</b> ${an.accords.map((x) => `<span class="acc">${esc(x.name)} +${x.pts}</span>`).join(' ')}</p>` : '<p class="hint">Pair notes that work together to form accords: lavender with tonka, rose with oud, tobacco with vanilla…</p>'}
      ${an.clashes.length ? `<p class="small bad">Clash: ${an.clashes.map((x) => x.notes.map((n) => Maison.NOTE[n].name).join(' + ')).join(', ')}</p>` : ''}
      ${an.missing.length ? `<p class="small bad">Missing a ${an.missing.join(' and ')} note.</p>` : ''}
    </article>`;
    let body = '';
    if (a.step === 0) {
      body = `<div class="lab-grid"><div class="notes-cols">${aiPanel()}${['top', 'heart', 'base'].map((layer) => `<article class="panel"><p class="eyebrow">${layer} notes</p><div class="notes">${Maison.NOTES.filter((n) => n.layer === layer).map((n) => `<button class="note ${d.sel[layer].includes(n.id) ? 'on' : ''}" data-action="note" data-l="${layer}" data-id="${n.id}" style="--c:${FAMILIES[n.family].color}"><span>${esc(n.name)}</span><small>$${n.cost}</small></button>`).join('')}</div></article>`).join('')}
        <label class="field"><span>Concentration</span><select data-field="conc">${opt(Maison.CONC, d.conc)}</select></label></div>${summary}</div>`;
    } else if (a.step === 1 || a.step === 2) {
      const ds = d.design, bx = d.box;
      const ctrls = a.step === 1
        ? `<label class="field"><span>Bottle shape</span><select data-field="shape">${opt(Maison.SHAPES, ds.shape)}</select></label>
           <label class="field"><span>Glass</span><select data-field="glass">${opt(Maison.GLASS, ds.glass)}</select></label>
           <label class="field color"><span>Glass colour</span><input type="color" data-field="color" value="${ds.color}"></label>
           <label class="field color"><span>Juice colour</span><input type="color" data-field="juice" value="${ds.juice}"></label>
           <label class="field"><span>Cap</span><select data-field="cap">${opt(Maison.CAPS, ds.cap)}</select></label>
           <label class="field"><span>Cap finish</span><select data-field="capFin">${opt(Maison.FINISH, ds.capFin)}</select></label>
           <label class="field"><span>Label</span><select data-field="label">${opt(Maison.LABELS, ds.label)}</select></label>
           <label class="field"><span>Surface detail</span><select data-field="decor">${opt(Maison.DECOR, ds.decor || 'none')}</select></label>
           <label class="field"><span>Pattern finish</span><select data-field="pfin">${opt(Maison.PFIN, ds.pfin || 'ink')}</select></label>
           <label class="field"><span>Accessory</span><select data-field="extra">${opt(Maison.EXTRAS, ds.extra || 'none')}</select></label>
           <label class="field color"><span>Print colour</span><input type="color" data-field="ink" value="${ds.ink}"></label>
           <p class="hint">${Object.keys(Maison.SHAPES).length} shapes, ${Object.keys(Maison.GLASS).length} glass and materials, ${Object.keys(Maison.CAPS).length} caps, ${Object.keys(Maison.DECOR).length - 1} surface details. This design adds ${money(Maison.designCost(ds))} to each bottle; a striking design lifts the price people will pay.</p>`
        : `<label class="field"><span>Box style</span><select data-field="boxStyle">${opt(Maison.BOX_STYLES, bx.style)}</select></label>
           <label class="field color"><span>Board colour</span><input type="color" data-field="paper" value="${bx.paper}"></label>
           <label class="field color"><span>Ink</span><input type="color" data-field="boxInk" value="${bx.ink}"></label>
           <label class="field"><span>Pattern</span><select data-field="pattern">${opt(Maison.PATTERNS, bx.pattern)}</select></label>
           <label class="field"><span>Emblem</span><select data-field="emblem">${opt(Maison.EMBLEMS, bx.emblem || 'none')}</select></label>
           <label class="field"><span>Printing</span><select data-field="foil"><option value="matte" ${bx.foil ? '' : 'selected'}>Matte ink</option><option value="foil" ${bx.foil ? 'selected' : ''}>Foil stamped</option></select></label>
           <p class="hint">${Object.keys(Maison.BOX_STYLES).length} box styles and ${Object.keys(Maison.PATTERNS).length} patterns. Book boxes swing open like a cover; sleeves slide up off the tray.</p>`;
      const presets = `<div class="presets"><span class="muted small">Start from a house look</span>${Object.entries(Maison.PRESETS).map(([id, p]) => `<button class="btn btn-small" data-action="mpreset" data-id="${id}">${esc(p.label)}</button>`).join('')}</div>`;
      body = `<div class="studio"><div class="mp-wrap"><div class="mp-view" id="mp-view"></div><p class="hint">${a.step === 1 ? 'Your bottle' : 'Your box, closed'} · ${esc(d.name || 'name it on the next step')}</p></div><article class="panel studio-ctrls">${aiPanel()}${presets}${ctrls}</article>${summary}</div>`;
    } else {
      const c = draftCreation(); c.price = d.price || 0;
      const tmp = Object.assign({}, c); const u = unitCost(tmp); const fair = fairPrice(tmp); if (!d.price) d.price = fair;
      const total = devFee() + u * d.qty, ok = c.name && !M().creations.some((x) => x.name.toLowerCase() === c.name.toLowerCase()) && an.ids.length && !an.missing.length;
      body = `<div class="studio"><div class="mp-wrap"><div class="mp-view" id="mp-view"></div></div><article class="panel studio-ctrls">
        <label class="field"><span>Fragrance name</span><input id="ml-name" maxlength="30" value="${esc(d.name)}" placeholder="e.g. Midnight Saffron"></label>
        <label class="field"><span>Retail price (100 ml)</span><input id="ml-price" type="number" min="5" step="5" value="${d.price}"></label>
        <p class="hint">Fair price at today’s reputation: <b>${money(fair)}</b>. Priced above it you sell fewer; far above it and critics take a star.</p>
        <label class="switch"><input type="checkbox" data-field="limited" ${d.limited ? 'checked' : ''}><span><b>Limited edition</b><small>Numbered and never restocked. Collectors pay about 40% more and seek it out; when it’s gone, it’s gone.</small></span></label>
        <label class="field"><span>${d.limited ? 'Numbered run' : 'First batch'}</span><select data-field="qty">${[100, 500, 2000].map((q) => `<option value="${q}" ${q === d.qty ? 'selected' : ''}>${q} bottles · ${money(q * u)}</option>`).join('')}</select></label>
        <dl class="kv compact"><div><dt>Lab fee</dt><dd>${money(devFee())}</dd></div><div><dt>Unit cost</dt><dd>${money(u)}</dd></div><div><dt>Total</dt><dd>${money(total)}</dd></div></dl>
        <button class="btn btn-primary btn-big" data-action="mlaunch" ${ok && S.cash >= total ? '' : 'disabled'}>Launch ${esc(c.name || 'it')}</button>
        <p class="hint">${!c.name ? 'Give it a name.' : !ok ? 'Fix the formula first (it needs top, heart and base notes) or pick a new name.' : S.cash < total ? `You need ${money(total - S.cash)} more.` : 'The first bottle off the line goes on your own shelf.'}</p>
      </article>${summary}</div>`;
    }
    return nav + body + `<div class="row-actions lab-nav">${a.step > 0 ? '<button class="btn" data-action="mstep" data-s="-">Back</button>' : ''}${a.step < 3 ? '<button class="btn btn-primary" data-action="mstep" data-s="+">Next</button>' : ''}<button class="btn btn-ghost" data-action="mreset">Start over</button></div>`;
  }

  function renderBiz() {
    const m = M(); ensureComms();
    const up = (name, desc, lvl, max, cost, act) => `<li><div><b>${esc(name)}</b><small>${esc(desc)}</small></div>${lvl >= max ? '<span class="owned-tag">Maxed</span>' : `<span class="buy-col"><button class="btn" data-action="${act}"${lack(cost)}>Upgrade · ${short(cost)}</button>${togo(cost)}</span>`}</li>`;
    const active = m.ads.filter((x) => x.until >= S.day);
    return `<div class="biz-grid">
      <article class="panel"><p class="eyebrow">Upgrades</p><ul class="courses">
        ${up(`Laboratory · level ${m.lab}`, `Up to ${maxNotes()} notes per formula, +${(m.lab - 1) * 2} harmony`, m.lab, 5, LAB_COST[m.lab + 1] || 0, 'mlab')}
        ${up(`Perfumer · ${m.nose ? NOSES[m.nose].name : 'just you'}`, m.nose < 2 ? `Hire: ${NOSES[m.nose + 1].name} for +${NOSES[m.nose + 1].bonus} harmony (salary ${money(ECON.noseSalary[m.nose + 1])} a day)` : 'The best nose money can buy', m.nose, 2, m.nose < 2 ? NOSES[m.nose + 1].cost : 0, 'mnose')}
        ${up(`Factory · level ${m.factory}`, `Unit costs −${m.factory * 8}%${m.factory < 5 ? `; next level −${(m.factory + 1) * 8}%, upkeep ${money(Math.round(factoryCost(m.factory) * ECON.factoryUpkeep))} a day` : ''}`, m.factory, 5, factoryCost(m.factory), 'mfactory')}
        ${up(`Boutiques · ${m.shops}`, m.shops < 6 ? `Open: ${SHOP_NAMES[m.shops]} (+${ECON.shopDemand[m.shops]} bottles a day of demand, rent ${money(Math.round(shopCost(m.shops) * ECON.shopRent))} a day)` : 'Stores on every continent', m.shops, 6, shopCost(m.shops), 'mshop')}
      </ul></article>
      <article class="panel"><p class="eyebrow">Marketing</p><ul class="courses">${ADS.map((x) => `<li><div><b>${esc(x.name)}</b><small>Demand ×${x.mult} for ${x.days} days</small></div><button class="btn" data-action="mad" data-id="${x.id}" ${S.cash < x.cost ? 'disabled' : ''}>Run · ${short(x.cost)}</button></li>`).join('')}</ul>
        <p class="hint">${active.length ? 'Running: ' + active.map((x) => `${esc(x.name)} until day ${x.until}`).join(', ') : 'No campaign running.'}</p></article>
      <article class="panel"><p class="eyebrow">Commissions · day ${S.day}</p><ul class="courses">${m.comms.list.map((q, i) => {
        const fit = m.creations.find((c) => c.family === q.family && c.harmony >= q.min && c.stock >= q.qty);
        return `<li class="${q.done ? 'done' : ''}"><div><b>${esc(q.who)}</b><small>${q.qty} bottles of a <span class="fam fam-${q.family}">${FAMILIES[q.family].label}</span> scent, harmony ${q.min}+ · ${money(q.ppb)} each</small></div>${q.done ? '<span class="owned-tag">Delivered</span>' : `<button class="btn ${fit ? 'btn-primary' : ''}" data-action="mcomm" data-i="${i}" ${fit ? '' : 'disabled'}>${fit ? 'Deliver ' + esc(fit.name) : 'No match in stock'} · ${short(q.qty * q.ppb)}</button>`}</li>`;
      }).join('')}</ul></article>
      <article class="panel"><p class="eyebrow">Sales ledger</p><ul class="ledger">${m.ledger.slice().reverse().map((l) => `<li><span>Day ${l.day}</span><span>${l.units} sold</span><b>${short(l.revenue)}</b></li>`).join('') || '<li class="muted">Sales show here after your first day on the market.</li>'}</ul></article>
    </div>`;
  }

  function launchDraft() {
    const m = M(), d = ui.atelier.draft, c = draftCreation();
    if (!c.name || m.creations.some((x) => x.name.toLowerCase() === c.name.toLowerCase())) return;
    c.price = Math.max(5, Math.round(d.price)); const u = unitCost(c), total = devFee() + u * d.qty;
    if (S.cash < total) { SFX.play('error'); return; }
    S.cash -= total; S.stats.spent += total;
    Object.assign(c, { id: 'mine-' + (m.creations.length + 1) + '-' + Date.now().toString(36).slice(-4), stock: d.qty, sold: 0, revenue: 0, launched: S.day, today: 0, yesterday: 0 });
    c.reviews = makeReviews(c);
    const avg = c.reviews.reduce((x, r) => x + r.stars, 0) / 3; m.rep = Math.max(0, Math.min(100, m.rep + (avg - 3) * 3));
    m.creations.push(c);
    const fansWaiting = m.creations.filter((x) => x !== c).reduce((a, x) => a + (x.fans || 0), 0);
    news('house', `You launched ${c.name}${c.limited ? `, a limited edition of ${c.stock.toLocaleString('en-US')} numbered bottles` : ''}. Critics give it ${(c.reviews.reduce((x, r) => x + r.stars, 0) / c.reviews.length).toFixed(1)} stars${fansWaiting >= 20 ? `, and about ${Math.round(fansWaiting * 0.03 * 7)} of your fans are expected to pre-order` : ''}.`, 'atelier');
    const it = Maison.register(m, c);
    S.owned[c.id] = { day: S.day, paid: u, batch: batchCode(S.seed + c.id), from: 'your house' };
    ui.showroomDirty = true; ui.atelier = { view: 'range', step: 0, draft: newDraft(), found: ui.atelier.found };
    SFX.play('unlock');
    toast(`<b>${esc(c.name)} is on sale</b><span>Critics gave it ${avg.toFixed(1)} stars. ${d.qty} bottles in stock at ${money(c.price)}.</span>`, 'gold');
    checkProgress(); save(); renderHeader(); renderAtelier();
    unbox(it);
  }

  /* ---------- collector requests and mystery boxes ---------- */
  const BUYERS = ['@GrailHunter', '@OudCollector', '@BlindBuyBen', '@ScentSommelier', '@DecantQueen', '@BottleShelfie', '@MarlyMaven', '@VaultViolet'];
  function genWants() {
    const r = rng(S.seed + ':wants:' + S.day), ownedIds = Object.keys(S.owned).filter((id) => !ITEM_BY_ID[id].mine);
    const pool = CATALOG.filter((c) => !c.limited); const wants = []; const seen = new Set();
    let guard = 0;
    while (wants.length < 4 && guard++ < 60) {
      const id = ownedIds.length && r() < 0.55 ? pick(ownedIds, r) : pick(pool, r).id;
      if (seen.has(id)) continue; seen.add(id);
      wants.push({ id, who: pick(BUYERS, r), mult: Math.round((1.25 + r() * 0.65) * 100) / 100, done: false });
    }
    S.market.wants = wants;
    S.market.trend = pick(Object.keys(FAMILIES), r);
  }
  const MYSTERY = [
    { id: 'sampler', name: 'Discovery box', price: 120, lo: 0.3, hi: 1.9, blurb: 'A value or designer bottle you don’t own yet.' },
    { id: 'niche', name: 'Niche box', price: 900, lo: 0.45, hi: 1.9, blurb: 'Something from the niche shelves.' },
    { id: 'haute', name: 'Haute box', price: 8000, lo: 0.4, hi: 2.2, blurb: 'A luxury or haute bottle. Big swings.' },
  ];
  function mysteryPool(b) { return CATALOG.filter((c) => !c.disc && !c.limited && !owns(c.id) && !stockInfo(c).out && c.base >= b.price * b.lo && c.base <= b.price * b.hi); }
  function renderMystery() {
    const el = $('#mystery'); if (!el) return;
    el.innerHTML = MYSTERY.map((b) => { const n = mysteryPool(b).length; return `<article class="panel mystery-box"><div class="mb-art" aria-hidden="true"><span>?</span></div><div><h3>${esc(b.name)}</h3><p class="muted small">${esc(b.blurb)} ${n} possible bottles.</p></div><button class="btn btn-primary" data-action="mystery" data-id="${b.id}" ${!n ? 'disabled title="You own every bottle this box can hold"' : lack(b.price)}>Open · ${money(b.price)}</button></article>`; }).join('');
  }

  /* ---------- AI designer: describe a bottle or box and Claude fills in the designer ---------- */
  // Available only where the page can ask Claude (the published artifact); hidden elsewhere.
  let aiSample = null, aiCtl = null;
  function aiPanel() {
    if (!aiSample) return '';
    const a = ui.atelier, box = a.step === 2;
    if (a.step === 0) return `<div class="ai-box ai-perfumer"><p class="eyebrow">AI perfumer</p>
      <label class="field"><span>Describe the scent you want</span><textarea id="ai-prompt" rows="3" maxlength="400" placeholder="e.g. a fresh black tea and ginger cologne with neroli, for spring mornings">${esc(a.aiText)}</textarea></label>
      <div class="row-actions">${a.ai.busy ? '<button class="btn" data-action="ai-stop">Stop</button>' : '<button class="btn btn-primary" data-action="ai-design">Compose it</button><button class="btn" data-action="ai-all">Create everything</button><button class="btn" data-action="ai-surprise">Surprise me</button>'}</div>
      <p class="hint" aria-live="polite">${a.ai.busy ? (a.ai.all ? 'Composing the formula and designing the bottle and box…' : 'Composing…') : esc(a.ai.msg || `Claude picks up to ${maxNotes()} notes from your palette, aiming for accords that work and avoiding clashes, plus the concentration. Create everything also names it and designs the bottle and box.`)}</p></div>`;
    return `<div class="ai-box"><p class="eyebrow">AI designer</p>
      <label class="field"><span>${box ? 'Describe the box you want' : 'Describe the bottle you want'}</span><textarea id="ai-prompt" rows="3" maxlength="400" placeholder="${box ? 'e.g. a black book box with gold art deco fans and a wax seal' : 'e.g. a smoky black faceted bottle with a rose-gold flame cap and a tassel'}">${esc(a.aiText)}</textarea></label>
      <div class="row-actions">${a.ai.busy ? '<button class="btn" data-action="ai-stop">Stop</button>' : `<button class="btn btn-primary" data-action="ai-design">Design it</button><button class="btn" data-action="ai-surprise">Surprise me</button>`}</div>
      <p class="hint" aria-live="polite">${a.ai.busy ? 'Designing…' : esc(a.ai.msg || (box ? 'Claude picks the style, colours, pattern and emblem; you can tweak anything after.' : 'Claude designs the bottle and a matching box; you can tweak anything after.'))}</p></div>`;
  }
  const optList = (obj) => Object.entries(obj).map(([k, v]) => `${k} (${typeof v === 'string' ? v : v.label})`).join(', ');
  function aiPrompt(request, scope) {
    const d = ui.atelier.draft, m = M(), an = draftAnalysis();
    const notes = an.ids.map((id) => Maison.NOTE[id].name).join(', ') || 'not chosen yet';
    const want = scope === 'box' ? '"box"' : '"design" and a matching "box"';
    return `You are the packaging designer for a perfume house in a fragrance-collecting game. Design ${scope === 'box' ? 'the retail box' : 'the bottle and its retail box'} for this fragrance.

House: ${m.name} (${m.city}), house colours ${m.lbg} and ${m.lfg}.
Fragrance: ${d.name || '(unnamed)'}, ${Maison.CONC[d.conc].label}, ${FAMILIES[an.family].label} family. Notes: ${notes}.
Current bottle: ${JSON.stringify(d.design)}. Current box: ${JSON.stringify(d.box)}.

The player asks: "${request}"

Choose ONLY from these option keys (use the key, not the label):
${designOptions()}

Follow the player's request closely; where it says nothing, make tasteful choices that suit the notes and house colours, with good contrast between ink and the colour behind it.
Reply with only a JSON object with keys ${want}${d.name ? '' : ', "name" (a fragrance name, at most 3 words)'} and "note" (one short sentence describing your design). Example: {"design":{"shape":"gem","glass":"smoked","color":"#202024","juice":"#c9822e","cap":"flame","capFin":"rosegold","label":"plate","ink":"#e8c48a","decor":"none","extra":"tassel"},"box":{"style":"book","paper":"#151515","ink":"#d8b56a","pattern":"deco","emblem":"seal","foil":true},"note":"Smoky glass under a rose-gold flame, boxed in black and gold deco."}`;
  }
  // The perfumer's brief: every note by layer, the accords to aim for and the clashes to avoid.
  function aiFormulaPrompt(request, all) {
    const d = ui.atelier.draft, m = M(), max = maxNotes();
    const layer = (l) => Maison.NOTES.filter((x) => x.layer === l).map((x) => `${x.id} (${x.name}, ${x.family})`).join('; ');
    const acc = Maison.ACCORDS.map(([ids, pts, name]) => `${name}: ${ids.join(' + ')} (+${pts})`).join('; ');
    const cl = Maison.CLASHES.map(([ids]) => ids.join(' + ')).join('; ');
    const design = all ? `
Also design the bottle ("design") and its retail box ("box"), choosing ONLY from these option keys:
${designOptions()}
Make the colours suit the scent (juice colour from its notes) and keep good contrast between ink and what is behind it.` : '';
    return `You are the master perfumer of ${m.name}, a perfume house in ${m.city} in a fragrance-collecting game. Compose a fragrance formula.

The player asks: "${request}"
Current formula: ${JSON.stringify(d.sel)}, ${d.conc}. Today's trending family is ${FAMILIES[trendFam()].label}.

Rules: use note ids ONLY from these lists, each in its own layer. Use between 4 and ${max} notes in total (the lab holds ${max}), with at least one top, one heart and one base note.
top: ${layer('top')}
heart: ${layer('heart')}
base: ${layer('base')}
Pairs that form accords and raise harmony (aim for two or more that fit the request): ${acc}
Pairs that clash and lower harmony (never use both): ${cl}
"conc" is one of: edt (Eau de Toilette, lighter), edp (Eau de Parfum), extrait (Extrait, richest and longest).${design}

Reply with only a JSON object: {"notes":{"top":[ids],"heart":[ids],"base":[ids]},"conc":"edp","name":"a fragrance name, at most 3 words",${all ? '"design":{...},"box":{...},' : ''}"note":"one short sentence describing the scent"}`;
  }
  // Takes the perfumer's notes, routing any note to its real layer and keeping within the lab's limit.
  function applyFormula(d, out) {
    const f = out && out.notes; if (!f || typeof f !== 'object') return 0;
    const max = maxNotes(), sel = { top: [], heart: [], base: [] }, seen = new Set(), queue = { top: [], heart: [], base: [] };
    for (const l of ['top', 'heart', 'base']) for (const id of Array.isArray(f[l]) ? f[l] : []) { const n = typeof id === 'string' && Maison.NOTE[id]; if (n && !seen.has(id)) { seen.add(id); queue[n.layer].push(id); } }
    let total = 0;
    for (let i = 0; i < 12 && total < max; i++) for (const l of ['top', 'heart', 'base']) if (queue[l][i] && total < max) { sel[l].push(queue[l][i]); total++; }
    if (!total) return 0;
    d.sel = sel; if (typeof out.conc === 'string' && Maison.CONC[out.conc]) d.conc = out.conc; d.price = 0;
    if (!d.name && typeof out.name === 'string' && out.name.trim()) d.name = out.name.trim().slice(0, 30);
    return total;
  }
  function designOptions() {
    return `bottle "shape": ${optList(Maison.SHAPES)}
bottle "glass": ${optList(Maison.GLASS)}
bottle "cap": ${optList(Maison.CAPS)}
bottle "capFin": ${optList(Maison.FINISH)}
bottle "label": ${optList(Maison.LABELS)}
bottle "decor" (surface pattern, printed right round the bottle): ${optList(Maison.DECOR)}
bottle "pfin" (pattern finish): ${optList(Maison.PFIN)}
bottle "extra": ${optList(Maison.EXTRAS)}
bottle "color" (glass or lacquer colour), "juice" (liquid colour), "ink" (label print colour): hex like "#1a2b3c"
box "style": ${optList(Maison.BOX_STYLES)}
box "pattern": ${optList(Maison.PATTERNS)}
box "emblem": ${optList(Maison.EMBLEMS)}
box "paper" (board colour), "ink" (print colour): hex; box "foil": true or false`;
  }
  function applyAi(d, out, scope) {
    let n = 0;
    const key = (v, obj, cur) => (typeof v === 'string' && Object.prototype.hasOwnProperty.call(obj, v) ? (v !== cur && n++, v) : cur);
    const hex = (v, cur) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? (v.toLowerCase() !== String(cur).toLowerCase() && n++, v.toLowerCase()) : cur);
    const ds = out && out.design, bx = out && out.box;
    if (scope !== 'box' && ds && typeof ds === 'object') {
      const t = d.design;
      t.shape = key(ds.shape, Maison.SHAPES, t.shape); t.glass = key(ds.glass, Maison.GLASS, t.glass); t.cap = key(ds.cap, Maison.CAPS, t.cap);
      t.capFin = key(ds.capFin, Maison.FINISH, t.capFin); t.label = key(ds.label, Maison.LABELS, t.label); t.decor = key(ds.decor, Maison.DECOR, t.decor || 'none');
      t.extra = key(ds.extra, Maison.EXTRAS, t.extra || 'none'); t.pfin = key(ds.pfin, Maison.PFIN, t.pfin || 'ink'); t.color = hex(ds.color, t.color); t.juice = hex(ds.juice, t.juice); t.ink = hex(ds.ink, t.ink);
    }
    if (bx && typeof bx === 'object') {
      const t = d.box;
      t.style = key(bx.style, Maison.BOX_STYLES, t.style); t.pattern = key(bx.pattern, Maison.PATTERNS, t.pattern); t.emblem = key(bx.emblem, Maison.EMBLEMS, t.emblem || 'none');
      t.paper = hex(bx.paper, t.paper); t.ink = hex(bx.ink, t.ink);
      if (typeof bx.foil === 'boolean') { if (bx.foil !== !!t.foil) n++; t.foil = bx.foil; }
    }
    if (!d.name && out && typeof out.name === 'string' && out.name.trim()) d.name = out.name.trim().slice(0, 30);
    return n;
  }
  const AI_ERR = {
    rate_limited: 'Too many requests for now. Try again in a moment.',
    refused: 'Claude declined that request. Try describing the design differently.',
    invalid_json: 'That answer didn’t come back as a design. Try again.',
    empty_completion: 'No design came back. Try a shorter description.',
    session_expired: 'Your Claude session expired. Sign in again to use the AI designer.',
    prompt_too_large: 'That description is too long.',
  };
  async function aiDesign(surprise, all) {
    const a = ui.atelier, d = a.draft; if (!aiSample || a.ai.busy || !d) return;
    const formula = a.step === 0, scope = formula ? 'formula' : a.step === 2 ? 'box' : 'both';
    const request = surprise ? (formula ? 'Surprise me: an original, harmonious fragrance built around at least two accords.' : 'Surprise me: something striking and original that tells the story of these notes.') : (a.aiText || '').trim();
    if (!request) { a.ai.msg = 'Describe what you want first, or press Surprise me.'; renderAtelier(); return; }
    aiCtl = new AbortController(); a.ai = { busy: true, msg: '', all: !!all }; SFX.play('click'); renderAtelier();
    try {
      const out = await aiSample.json(formula ? aiFormulaPrompt(request, !!all) : aiPrompt(request, scope), { modelTier: 'quick', signal: aiCtl.signal, cache: false });
      const n = formula ? applyFormula(d, out) + (all ? applyAi(d, out, 'both') : 0) : applyAi(d, out, scope);
      const note = out && typeof out.note === 'string' ? out.note.slice(0, 200) : '';
      if (formula && n) { const an = draftAnalysis(); a.ai = { busy: false, msg: `${note ? note + ' ' : ''}Harmony ${an.harmony}${an.accords.length ? ', accords: ' + an.accords.map((x) => x.name).join(', ') : ''}.` }; }
      else a.ai = { busy: false, msg: n ? (note || 'Done. Tweak anything you like.') : formula ? 'Claude didn’t return a usable formula. Try again or describe it differently.' : 'That design matches what you already have. Try asking for something different.' };
      if (n) { SFX.play('shimmer'); if (formula && all) toast(`<b>${esc(d.name || 'Your fragrance')} is ready</b><span>Formula, bottle and box are done. Check each step, then launch.</span>`, 'good'); else if (a.step === 1 && scope === 'both') toast('<b>Bottle and box designed</b><span>Press Next to see the matching box.</span>', 'good'); }
    } catch (e) {
      const code = e && e.code;
      if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(code)) { aiSample = null; a.ai = { busy: false, msg: '' }; toast('<b>AI designer unavailable</b><span>Claude isn’t enabled for this page, so design by hand below.</span>'); }
      else a.ai = { busy: false, msg: code === 'cancelled' ? 'Stopped.' : AI_ERR[code] || 'Something went wrong. Try again.' };
    }
    aiCtl = null;
    if (ui.tab === 'atelier') renderAtelier();
  }

  /* ---------- YOUR HOUSE WEBSITE: a storefront in a browser window, plus its dashboard ---------- */
  const SITE_COST = 25000, HOSTING = 40;
  const SEO_COST = [8000, 25000, 70000, 200000, 600000];
  const TEMPLATES = { luxe: 'Luxe (house colours, dark)', atelier: 'Atelier (cream, editorial)', modern: 'Modern (white, bold grid)', grand: 'Grand maison (white and serif, campaign scenes, like Parfums de Marly)', noir: 'Noir privé (black, minimal, smoke, like Initio)' };
  const FIRST = ['Emma', 'Liam', 'Sofia', 'Noah', 'Aisha', 'Mateo', 'Yuki', 'Omar', 'Chloé', 'Lucas', 'Amara', 'Leo', 'Mei', 'Hugo', 'Zara', 'Ethan', 'Nadia', 'Kai', 'Lina', 'Marco', 'Fatima', 'Jonas', 'Isla', 'Ravi'];
  const CITIES_W = ['Lyon', 'London', 'New York', 'Dubai', 'Milan', 'Toronto', 'Sydney', 'Berlin', 'Riyadh', 'Seoul', 'Madrid', 'Austin', 'Lagos', 'Mumbai', 'Stockholm', 'Mexico City', 'Doha', 'Paris', 'Tokyo', 'Cape Town'];
  const INBOX_T = [
    { s: 'Do you ship to Canada?', b: 'Hi! I loved the reviews of {c}. Do you ship to Toronto, and how long does it take?', kind: 'q' },
    { s: 'Is {c} good for summer?', b: 'Thinking about a blind buy of {c}. Will it work in hot weather or is it more of a winter scent?', kind: 'q' },
    { s: 'My bottle arrived leaking', b: 'My {c} arrived today but the cap was loose and some leaked into the box. Can you help?', kind: 'issue' },
    { s: 'Collaboration request', b: 'Hey! I run a fragrance channel with 240k subscribers and would love to feature {h}. Would you sponsor a video?', kind: 'collab' },
    { s: 'Wholesale enquiry', b: 'We own a concept store and would like to stock {h}. Could you send a price list?', kind: 'q' },
    { s: 'Compliment!', b: 'Just wanted to say {c} is the best thing I have smelled this year. Bravo.', kind: 'q' },
  ];
  const SITE_DEFAULT = () => ({ domain: '', template: 'luxe', headline: '', tagline: '', story: '', announce: '', featured: null, launched: 0, seo: 0, freeShip: false, ads: [], posts: [], codes: [], orders: [], days: [], today: { v: 0, o: 0, r: 0 }, subs: 0, inbox: [], seq: 1001, reviews: {}, payMode: 'live', myOrders: [] });
  const W = () => (S.maison && S.maison.site) || null;
  const slug = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };
  function siteTheme() {
    const m = M(), w = W(), dark = lum(m.lbg) < lum(m.lfg) ? m.lbg : m.lfg, light = dark === m.lbg ? m.lfg : m.lbg;
    if (w.template === 'luxe') return { bg: m.lbg, fg: m.lfg, accent: m.lfg, card: 'color-mix(in srgb, ' + m.lfg + ' 6%, ' + m.lbg + ')', font: 'serif' };
    if (w.template === 'grand') return { bg: '#ffffff', fg: '#141414', accent: '#141414', card: '#f4f1ec', font: 'serif' };
    if (w.template === 'noir') return { bg: '#070707', fg: '#ededed', accent: '#ededed', card: '#141414', font: 'sans' };
    if (w.template === 'atelier') return { bg: '#f6f1e9', fg: '#1d1712', accent: lum(dark) < 0.5 ? dark : '#1d1712', card: '#efe7da', font: 'serif' };
    return { bg: '#ffffff', fg: '#111111', accent: lum(dark) < 0.6 ? dark : '#111111', card: '#f3f3f3', font: 'sans' };
  }
  const liveCreations = () => M().creations.filter((c) => ITEM_BY_ID[c.id]);
  const avgStars = (c) => { const r = c.reviews.concat((W() && W().reviews[c.id]) || []); return r.length ? r.reduce((a, x) => a + x.stars, 0) / r.length : 0; };
  const webActiveMult = (list) => list.filter((a) => a.until >= S.day).reduce((x, a) => x * a.mult, 1);
  function webVisitors() {
    const m = M(), w = W(); if (!w) return 0;
    const posts = Math.min(2, webActiveMult(w.posts.map((p) => ({ until: p.day + 5, mult: 1.15 }))));
    return (40 + m.rep * 6 + w.subs * 0.03 + liveCreations().length * 15) * (1 + 0.35 * w.seo) * webActiveMult(w.ads) * posts;
  }
  function webConversion() {
    const w = W(), cs = liveCreations().filter((c) => c.stock > 0); if (!cs.length) return 0;
    const h = cs.reduce((a, c) => a + c.harmony, 0) / cs.length;
    const price = cs.reduce((a, c) => a + Math.min(1.6, fairPrice(c) / Math.max(1, c.price)), 0) / cs.length;
    const code = w.codes.filter((x) => x.active).reduce((a, x) => Math.max(a, x.pct), 0);
    return 0.022 * Math.pow(h / 70, 1.5) * Math.pow(price, 1.5) * (w.freeShip ? 1.25 : 1) * (1 + code / 80);
  }
  function newOrder(items, o = {}) {
    const w = W(); const sub = items.reduce((a, x) => a + x.q * x.price, 0);
    const code = o.code || null, disc = code ? Math.round(sub * code.pct / 100) : 0;
    const ship = o.ship != null ? o.ship : 0;
    const ord = { n: w.seq++, day: S.day, who: o.who || pick(FIRST) + ' ' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + '.', city: o.city || pick(CITIES_W), items, sub, disc, ship, total: sub - disc + ship, code: code ? code.code : '', test: !!o.test, mine: !!o.mine };
    w.orders.unshift(ord); w.orders = w.orders.slice(0, 40);
    return ord;
  }
  // Online orders for a fraction of a day: visitors arrive, some buy from what's in stock.
  function webTick(frac) {
    const w = W(); if (!w) return { units: 0, revenue: 0 };
    const v = webVisitors() * frac * (0.8 + Math.random() * 0.4);
    w.today.v += v;
    let orders = Math.floor(v * webConversion() + Math.random()), units = 0, revenue = 0;
    const cs = liveCreations();
    while (orders-- > 0) {
      const pool = cs.filter((c) => c.stock > 0); if (!pool.length) break;
      const wts = pool.map((c) => Math.max(0.1, demand(c))), tot = wts.reduce((a, b) => a + b, 0);
      let x = Math.random() * tot, c = pool[0]; for (let i = 0; i < pool.length; i++) { x -= wts[i]; if (x <= 0) { c = pool[i]; break; } }
      const q = Math.min(c.stock, Math.random() < 0.2 ? 2 : 1);
      const active = w.codes.filter((k) => k.active);
      const code = active.length && Math.random() < 0.35 ? pick(active) : null; if (code) code.uses++;
      const ord = newOrder([{ id: c.id, name: c.name, q, price: c.price, size: '100 ml' }], { code });
      const cost = w.freeShip ? 6 : 0;
      c.stock -= q; c.sold += q; c.today = (c.today || 0) + q; c.revenue += ord.total; units += q; revenue += ord.total - cost;
      w.today.o++; w.today.r += ord.total - cost;
      if (Math.random() < 0.08) addReview(c, Math.random, { who: ord.who, city: ord.city, size: ord.items[0].size });
      if (Math.random() < 0.3) w.subs++;
    }
    if (units) { const m = M(); S.cash += revenue; S.stats.earned += revenue; m.stats.sold += units; m.stats.revenue += revenue; flow().house += revenue; }
    return { units, revenue };
  }
  function webNewDay() {
    const w = W(); if (!w) return;
    deliverMyOrders();
    w.days.push({ day: S.day - 1, v: Math.round(w.today.v), o: w.today.o, r: Math.round(w.today.r) }); w.days = w.days.slice(-14);
    w.today = { v: 0, o: 0, r: 0 };
    const r = rng(S.seed + ':inbox:' + S.day), cs = liveCreations();
    const n = r() < 0.6 ? 1 : r() < 0.85 ? 2 : 0;
    for (let i = 0; i < n && cs.length; i++) {
      const t = pick(INBOX_T, r), c = pick(cs, r);
      w.inbox.unshift({ id: S.day + '-' + i, day: S.day, from: pick(FIRST, r) + ' · ' + pick(CITIES_W, r), subject: t.s.replace('{c}', c.name).replace('{h}', M().name), body: t.b.replace('{c}', c.name).replace('{h}', M().name), kind: t.kind, done: false });
    }
    w.inbox = w.inbox.slice(0, 20);
    // Reviews pile up every day: more for what sold yesterday, a burst after a launch.
    const rr = rng(S.seed + ':reviews:' + S.day);
    for (const c of cs) {
      const lambda = Math.min(8, 0.35 + (c.yesterday || 0) * 0.05 + (S.day - c.launched <= 3 ? 1.2 : 0));
      let n2 = Math.floor(lambda); if (rr() < lambda - n2) n2++;
      for (let i = 0; i < n2; i++) addReview(c, rr, { day: S.day - 1 });
    }
  }

  /* ---------- customer reviews ---------- */
  const RV = {
    title: { 5: ['Masterpiece', 'Instant favourite', 'Compliment magnet', 'Worth every penny', 'My new signature', 'Blind buy, no regrets', 'Stunning', 'Obsessed'], 4: ['Really lovely', 'Great everyday scent', 'Very well made', 'Almost perfect', 'Impressive', 'A keeper', 'Pleasantly surprised'], 3: ['Nice but safe', 'Good, not great', 'Pleasant enough', 'Mixed feelings', 'Fine for the price'], 2: ['Not for me', 'Disappointing', 'Falls flat', 'Expected more'], 1: ['Scrubber', 'Big miss', 'Sent it back', 'Avoid'] },
    open: { 5: ['I have tried hundreds of fragrances and {name} is something special.', 'Blind bought {name} after the reviews and wow.', 'This is the one I reach for every morning now.', 'Smelled it once in a friend’s car and had to order it.'], 4: ['Really enjoying {name}.', 'A very well made {fam} fragrance.', '{name} surprised me, in a good way.', 'Bought the 50 ml to test and I’m upgrading.'], 3: ['{name} is nice, but I expected more.', 'It’s a pleasant {fam}, nothing groundbreaking.', 'Some days I love it, some days it’s just okay.'], 2: ['I wanted to love {name}.', 'Not sure what happened here.', 'The notes list sounded perfect, the result isn’t.'], 1: ['Honestly one of the worst blind buys I’ve made.', 'I couldn’t wear this past lunch.'] },
    pos: ['The {note} comes through beautifully after an hour.', 'That {acc} accord is the star here.', 'Lasts about {hours} hours on my skin, longer on clothes.', 'Perfect for {season}.', 'Wore it to {occ} and got three compliments.', 'The opening of {top} is bright and juicy.', 'Dries down to a soft {base} I could smell all night.', 'Smells far more expensive than it is.', 'The bottle looks incredible on my shelf.', 'The box alone feels like a gift.', 'My partner keeps stealing it.', 'Projection is strong for the first two hours, then a lovely skin scent.'],
    mid: ['The {note} is nice but fades quickly.', 'Lasts around {hours} hours, which is okay.', 'Smells good, but I already own similar {fam} scents.', 'The opening is better than the drydown.', 'Projection is softer than I hoped.', 'Works for {occ}, not much else.'],
    neg: ['The {note} turns sour on my skin.', 'Gone in under {low} hours.', 'Too much {acc}, it gets loud and muddled.', 'Smells cheaper than the price suggests.', 'Gave me a headache by lunch.', 'The bottle is lovely, the juice is not.'],
    close: { 5: ['Already ordered a backup.', 'Ten out of ten.', '{house} is one to watch.', 'Buying the 100 ml next.'], 4: ['Would buy again.', 'Recommended, especially for {season}.', 'A solid addition to any collection.'], 3: ['Try a sample first.', 'Wait for a sale.', 'Okay, but not a must-have.'], 2: ['Not repurchasing.', 'Maybe it works on someone else.'], 1: ['Save your money.', 'Hard pass.'] },
    occ: ['the office', 'a wedding', 'date night', 'a dinner party', 'a night out', 'a long flight', 'Sunday brunch', 'a job interview'],
  };
  const SEASON = { fresh: 'hot summer days', citrus: 'summer mornings', aquatic: 'the beach', aromatic: 'spring', woody: 'autumn', spicy: 'cold evenings', sweet: 'date nights', gourmand: 'winter', amber: 'winter nights', oud: 'evenings out', leather: 'autumn', floral: 'spring' };
  function addReview(c, r, o = {}) {
    const w = W(); if (!w) return;
    const fair = fairPrice(c), noise = (r() + r() + r() - 1.5) * 1.15;
    const st = Math.max(1, Math.min(5, Math.round((c.harmony - 20) / 15 - (c.price > fair * 1.6 ? 0.8 : 0) + noise)));
    const pk = (a) => a[Math.floor(r() * a.length) % a.length];
    // Only a seed is saved; the words are written from it when shown, so hundreds of reviews stay small.
    const rev = { id: (w.rseq = (w.rseq || 0) + 1), who: o.who || pk(FIRST) + ' ' + String.fromCharCode(65 + Math.floor(r() * 26)) + '.', city: o.city || pk(CITIES_W), day: o.day != null ? o.day : S.day, stars: st, seed: Math.floor(r() * 1e9), size: o.size || (r() < 0.7 ? '100 ml' : '50 ml'), helpful: Math.floor(r() * r() * (st === 5 || st === 1 ? 40 : 18)) };
    (w.reviews[c.id] = w.reviews[c.id] || []).unshift(rev);
    if (w.reviews[c.id].length > 500) w.reviews[c.id].length = 500;
  }
  const revCache = {};
  function revText(c, rev) {
    if (rev.text || rev.seed == null) return { title: rev.title || '', text: rev.text || '' };
    const key = c.id + ':' + rev.id; if (revCache[key]) return revCache[key];
    const r = rng('rv' + rev.seed), st = rev.stars, pk = (a) => a[Math.floor(r() * a.length) % a.length];
    const N = (id) => (id && Maison.NOTE[id] ? Maison.NOTE[id].name : 'heart');
    const hours = Math.round(c.longevity || 6);
    const fill = (t) => t.replace('{name}', c.name).replace('{house}', M().name).replace('{fam}', FAMILIES[c.family].label.toLowerCase()).replace('{acc}', (c.accords[0] || 'main').toLowerCase())
      .replace('{note}', N(c.notes.heart[0] || c.notes.top[0])).replace('{top}', N(c.notes.top[0] || c.notes.heart[0])).replace('{base}', N(c.notes.base[0] || c.notes.heart[0]).toLowerCase())
      .replace('{hours}', hours).replace('{low}', Math.max(1, Math.round(hours / 3))).replace('{season}', SEASON[c.family] || 'any season').replace('{occ}', pk(RV.occ));
    const pool = st >= 4 ? RV.pos : st === 3 ? RV.mid : RV.neg;
    const a = pk(pool); let b = pk(pool); if (b === a) b = pool[(pool.indexOf(a) + 1) % pool.length];
    const title = pk(RV.title[st]), text = [pk(RV.open[st]), a, st >= 4 || r() < 0.5 ? b : '', pk(RV.close[st])].filter(Boolean).map(fill).join(' ');
    return (revCache[key] = { title, text });
  }
  const siteReviews = (c) => c.reviews.map((r, i) => Object.assign({ critic: true, day: c.launched, cid: i }, r)).concat((W() && W().reviews[c.id]) || []);
  const reviewCount = (c) => c.reviews.length + ((W() && W().reviews[c.id]) || []).length;

  /* ---------- what's hot: sales over the last week, momentum and badges ---------- */
  function hotStats(c) {
    const h = c.hist || [], wk = h.slice(-6).reduce((a, x) => a + x, 0) + (c.today || 0), prev = h.slice(-13, -6).reduce((a, x) => a + x, 0);
    const fresh = S.day - c.launched <= 3, avg = avgStars(c);
    return { wk, prev, fresh, avg, trend: prev ? (wk - prev) / prev : null, score: wk * (c.family === trendFam() ? 1.08 : 1) + (fresh ? Math.max(30, wk * 0.15) : 0) + avg * 3 };
  }
  function hotList() {
    const cs = liveCreations(), st = cs.map((c) => ({ c, h: hotStats(c) })).sort((a, b) => b.h.score - a.h.score);
    const best = st.filter((x) => x.h.wk > 0).sort((a, b) => b.h.wk - a.h.wk)[0];
    const loved = st.filter((x) => reviewCount(x.c) >= 5 && x.h.avg >= 4).sort((a, b) => b.h.avg - a.h.avg)[0];
    for (const x of st) {
      x.badges = [];
      if (best && x === best) x.badges.push('Best seller');
      if (x.h.fresh) x.badges.push('Just dropped');
      if (x.h.trend != null && x.h.trend >= 0.25 && x.h.wk >= 5) x.badges.push('Rising');
      if (x.c.family === trendFam()) x.badges.push('Trending ' + FAMILIES[x.c.family].label.toLowerCase());
      if (loved && x === loved) x.badges.push('Most loved');
      if (x.c.stock <= 0) x.badges.unshift('Sold out');
      else if (x.c.stock < 50) x.badges.push('Almost gone');
    }
    return st;
  }

  // Browser state: history stack for back/forward, the bag and the checkout form.
  const site = { hist: [{ p: 'home' }], hi: 0, bag: [], code: null, codeMsg: '', q: '', fam: '', sort: 'featured', shot: 'bottle', size: '100', qty: 1, err: {}, form: {}, msg: '', lastOrder: null, scrollTop: 0, mode: 'visit', newsletter: '', slide: 0, coverTop: null, revShow: 6, revStar: 0, revSort: 'recent', ann: 0, annPaused: false, annClosed: false, cur: 'USD', searchOpen: false, ship: 'standard', pay: 'card', paying: false };
  // Region picker on the Grand maison look: prices are shown converted, orders are still taken in dollars.
  const REGIONS = { USD: ['United States [EN]', '$', 1], GBP: ['United Kingdom [EN]', '£', 0.79], EUR: ['France [FR]', '€', 0.92], AED: ['United Arab Emirates [EN]', 'AED ', 3.67] };
  const wm = (v) => { const [, sym, rate] = REGIONS[site.cur] || REGIONS.USD; return sym + Math.round(v * rate).toLocaleString('en-US'); };
  const ICON = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
    bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  };
  const cur = () => site.hist[site.hi];
  function go(p, extra = {}) { site.hist = site.hist.slice(0, site.hi + 1); site.hist.push(Object.assign({ p }, extra)); site.hi = site.hist.length - 1; site.shot = 'bottle'; site.qty = 1; site.err = {}; site.revShow = 6; site.revStar = 0; site.revSort = 'recent'; site.scrollTop = 0; site.jump = true; site.flash = ''; site.msg = ''; site.newsMsg = ''; SFX.play('click'); renderAtelier(); }
  function sitePath(pg) {
    const c = pg.id && M().creations.find((x) => x.id === pg.id), post = pg.post != null && W().posts[pg.post];
    return { home: '/', shop: '/shop' + (site.fam ? '?family=' + site.fam : ''), product: '/products/' + (c ? slug(c.name) : ''), journal: '/journal', post: '/journal/' + (post ? slug(post.title) : ''), story: '/our-story', contact: '/contact', hot: '/whats-hot', orders: '/account/orders', receipt: '/account/orders/' + (pg.n || '') + '/receipt', cart: '/cart', checkout: '/checkout', done: '/checkout/thank-you', search: '/search?q=' + encodeURIComponent(site.q) }[pg.p] || '/';
  }
  const bagCount = () => site.bag.reduce((a, x) => a + x.q, 0);
  const sizePrice = (c, size) => (size === '50' ? Math.round(c.price * 0.68) : c.price);
  const img = (c, mode = 'bottle', cls = '') => `<img class="w-img ${cls}" data-snap="${c.id}" data-mode="${mode}" alt="${esc(c.name)} ${mode === 'box' ? 'in its box' : 'bottle'}">`;
  function stars5(v) { const n = Math.round(v); return `<span class="w-stars" aria-label="${v.toFixed(1)} of 5">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>`; }
  function productCard(c) {
    const out = c.stock <= 0;
    return `<article class="w-card"><button class="w-card-img" data-action="w-go" data-p="product" data-id="${c.id}">${img(c)}</button>
      <div class="w-card-body"><p class="w-kicker">${esc(FAMILIES[c.family].label)} · ${esc(Maison.CONC[c.conc].label)}</p><h3><button data-action="w-go" data-p="product" data-id="${c.id}">${esc(c.name)}</button></h3>
      <p class="w-price">${wm(c.price)} ${avgStars(c) ? stars5(avgStars(c)) + ` <small class="w-muted">(${reviewCount(c)})</small>` : ''}</p>
      ${out ? '<p class="w-muted">Sold out</p>' : `<button class="w-btn w-btn-line" data-action="w-add" data-id="${c.id}">Add to bag</button>`}</div></article>`;
  }

  function sitePage() {
    const m = M(), w = W(), pg = cur(), cs = liveCreations();
    if (pg.p === 'home') return `${cover(cs, w, m)}
      ${cs.length ? `<section class="w-sec"><div class="w-sec-head"><h2>What’s hot</h2><button class="w-link" data-action="w-go" data-p="hot">See the chart</button></div><div class="w-grid">${hotList().slice(0, 4).map((x, i) => hotCard(x, i)).join('')}</div>${ticker(w)}</section>` : ''}
      <section class="w-sec"><div class="w-sec-head"><h2>The collection</h2><button class="w-link" data-action="w-go" data-p="shop">View all</button></div><div class="w-grid">${cs.slice(0, 4).map(productCard).join('') || '<p class="w-muted">New fragrances coming soon.</p>'}</div></section>
      <section class="w-band"><div><p class="w-kicker">Our story</p><h2>${esc(m.name)}</h2><p>${esc((w.story || `${m.name} was founded in ${m.city} on day ${m.day} by a collector who knew what was missing from their shelf.`).slice(0, 260))}</p><button class="w-link" data-action="w-go" data-p="story">Read more</button></div></section>
      ${w.posts.length ? `<section class="w-sec"><div class="w-sec-head"><h2>From the journal</h2><button class="w-link" data-action="w-go" data-p="journal">All stories</button></div><div class="w-posts">${w.posts.slice(-3).reverse().map((p, i) => postCard(p, w.posts.indexOf(p))).join('')}</div></section>` : ''}
      ${newsletter()}`;
    if (pg.p === 'shop' || pg.p === 'search') {
      let list = cs.slice();
      if (pg.p === 'search') { const q = site.q.toLowerCase(); list = list.filter((c) => (c.name + ' ' + FAMILIES[c.family].label + ' ' + c.notes.top.concat(c.notes.heart, c.notes.base).map((n) => Maison.NOTE[n].name).join(' ')).toLowerCase().includes(q)); }
      if (site.fam) list = list.filter((c) => c.family === site.fam);
      if (site.sort === 'hot') { const sc = Object.fromEntries(hotList().map((x) => [x.c.id, x.h.score])); list.sort((a, b) => sc[b.id] - sc[a.id]); }
      else if (site.sort === 'low') list.sort((a, b) => a.price - b.price); else if (site.sort === 'high') list.sort((a, b) => b.price - a.price); else if (site.sort === 'rated') list.sort((a, b) => avgStars(b) - avgStars(a)); else if (site.sort === 'new') list.sort((a, b) => b.launched - a.launched);
      const fams = [...new Set(cs.map((c) => c.family))];
      return `<section class="w-sec"><h1 class="w-title">${pg.p === 'search' ? `Results for “${esc(site.q)}”` : 'Shop all fragrances'}</h1>
        <div class="w-filters"><div class="w-chips"><button class="${site.fam ? '' : 'on'}" data-action="w-fam" data-f="">All</button>${fams.map((f) => `<button class="${site.fam === f ? 'on' : ''}" data-action="w-fam" data-f="${f}">${FAMILIES[f].label}</button>`).join('')}</div>
        <label class="w-select">Sort <select id="w-sort">${[['featured', 'Featured'], ['hot', 'Trending'], ['new', 'Newest'], ['low', 'Price: low to high'], ['high', 'Price: high to low'], ['rated', 'Top rated']].map(([k, l]) => `<option value="${k}" ${site.sort === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
        <p class="w-muted">${list.length} ${list.length === 1 ? 'fragrance' : 'fragrances'}</p><div class="w-grid">${list.map(productCard).join('') || '<p class="w-muted">Nothing matches. Try another note or family.</p>'}</div></section>`;
    }
    if (pg.p === 'product') {
      const c = cs.find((x) => x.id === pg.id); if (!c) return '<section class="w-sec"><h1 class="w-title">Not found</h1><p class="w-muted">This fragrance is no longer available.</p></section>';
      const nrev = reviewCount(c), avg = avgStars(c), n = Maison.NOTE;
      const p50 = sizePrice(c, '50'), lng = c.longevity || Maison.longevity({ basePot: c.notes.base.reduce((a, id) => a + n[id].pot, 0) }, c.conc);
      return `<section class="w-sec w-product">
        <div class="w-gallery"><div class="w-main-img">${img(c, site.shot)}</div><div class="w-thumbs">${['bottle', 'box'].map((mo) => `<button class="${site.shot === mo ? 'on' : ''}" data-action="w-shot" data-m="${mo}">${img(c, mo)}</button>`).join('')}</div></div>
        <div class="w-buy"><p class="w-kicker">${esc(m.name)} · ${esc(Maison.CONC[c.conc].label)}</p><h1>${esc(c.name)}</h1>
          <p class="w-rating">${avg ? stars5(avg) + ` <button class="w-link" data-action="w-jump" data-t="w-reviews">${nrev} ${nrev === 1 ? 'review' : 'reviews'}</button>` : 'No reviews yet'}</p>
          <p class="w-big-price">${wm(sizePrice(c, site.size))}</p>
          <div class="w-opts"><span class="w-label">Size</span>${[['50', '50 ml', p50], ['100', '100 ml', c.price]].map(([k, l, pr]) => `<button class="${site.size === k ? 'on' : ''}" data-action="w-size" data-s="${k}">${l}<small>${wm(pr)}</small></button>`).join('')}</div>
          <div class="w-row"><div class="w-qty"><button data-action="w-qty" data-d="-1" aria-label="Fewer">−</button><span>${site.qty}</span><button data-action="w-qty" data-d="1" aria-label="More">+</button></div>
            ${c.stock > 0 ? `<button class="w-btn w-grow" data-action="w-add" data-id="${c.id}" data-q="${site.qty}">Add to bag · ${wm(sizePrice(c, site.size) * site.qty)}</button>` : `<button class="w-btn w-grow" data-action="w-notify">Notify me when it’s back</button>`}</div>
          <p class="w-stock">${c.stock <= 0 ? 'Sold out' : c.stock < 50 ? `Only ${c.stock} left` : 'In stock · ships in 1–2 days'}</p>
          <details open><summary>Notes</summary><dl class="w-pyramid"><div><dt>Top</dt><dd>${c.notes.top.map((x) => n[x].name).join(', ') || '—'}</dd></div><div><dt>Heart</dt><dd>${c.notes.heart.map((x) => n[x].name).join(', ') || '—'}</dd></div><div><dt>Base</dt><dd>${c.notes.base.map((x) => n[x].name).join(', ') || '—'}</dd></div></dl></details>
          <details><summary>The perfumer’s note</summary><p>${c.accords.length ? `Built on ${c.accords.join(', ').toLowerCase()}. ` : ''}A ${FAMILIES[c.family].label.toLowerCase()} fragrance that lasts around ${lng} hours on skin.</p></details>
          <details><summary>Shipping &amp; returns</summary><p>${w.freeShip ? 'Free shipping on every order.' : 'Free shipping over $150, otherwise $12.'} Returns accepted within 30 days on unopened bottles.</p></details>
        </div></section>
        ${reviewsBlock(c)}
        ${cs.length > 1 ? `<section class="w-sec"><h2>You may also like</h2><div class="w-grid">${cs.filter((x) => x.id !== c.id).slice(0, 4).map(productCard).join('')}</div></section>` : ''}`;
    }
    if (pg.p === 'cart') {
      const t = bagTotals();
      return `<section class="w-sec w-cart"><h1 class="w-title">Your bag</h1>${site.bag.length ? `<div class="w-cart-grid"><ul class="w-lines">${site.bag.map((x, i) => { const c = M().creations.find((k) => k.id === x.id); return `<li>${c ? img(c, 'bottle', 'w-line-img') : ''}<div><b>${esc(x.name)}</b><p class="w-muted">${x.size} ml · ${wm(x.price)}</p><div class="w-qty"><button data-action="w-line" data-i="${i}" data-d="-1" aria-label="Fewer">−</button><span>${x.q}</span><button data-action="w-line" data-i="${i}" data-d="1" aria-label="More">+</button></div></div><div class="w-line-end"><b>${wm(x.q * x.price)}</b><button class="w-link" data-action="w-remove" data-i="${i}">Remove</button></div></li>`; }).join('')}</ul>
        <aside class="w-summary"><form data-form="w-code" class="w-code"><label class="w-label" for="w-code">Discount code</label><div class="w-row"><input id="w-code" autocomplete="off" value="${esc(site.code ? site.code.code : '')}" placeholder="Enter code"><button class="w-btn w-btn-line">Apply</button></div>${site.codeMsg ? `<p class="w-small ${site.code ? '' : 'w-bad'}">${esc(site.codeMsg)}</p>` : ''}</form>
          <dl class="w-totals"><div><dt>Subtotal</dt><dd>${wm(t.sub)}</dd></div>${t.disc ? `<div><dt>Discount (${esc(site.code.code)})</dt><dd>−${wm(t.disc)}</dd></div>` : ''}<div><dt>Shipping</dt><dd>${t.ship ? wm(t.ship) : 'Free'}</dd></div><div class="w-total"><dt>Total</dt><dd>${wm(t.total)}</dd></div></dl>
          <button class="w-btn w-wide" data-action="w-go" data-p="checkout">Checkout</button></aside></div>` : '<p class="w-muted">Your bag is empty.</p><button class="w-btn" data-action="w-go" data-p="shop">Continue shopping</button>'}</section>`;
    }
    if (pg.p === 'checkout') {
      if (!site.bag.length) return '<section class="w-sec"><h1 class="w-title">Checkout</h1><p class="w-muted">Your bag is empty.</p></section>';
      const t = bagTotals(), f = site.form, e = site.err, live = w.payMode !== 'test', brand = cardBrand(f.card || '');
      const fld = (id, label, attrs = '') => `<label class="w-field ${e[id] ? 'err' : ''}"><span>${label}</span><input id="w-${id}" value="${esc(f[id] || '')}" ${attrs}>${e[id] ? `<small>${esc(e[id])}</small>` : ''}</label>`;
      const std = w.freeShip || t.sub - t.disc >= 150 ? 'Free' : wm(12);
      return `<section class="w-sec w-checkout"><ol class="w-crumbs"><li class="done">Bag</li><li class="on">Details &amp; payment</li><li>Confirmation</li></ol><h1 class="w-title">Checkout</h1><div class="w-cart-grid"><form data-form="w-checkout" class="w-form" novalidate>
        ${live ? '' : '<p class="w-test">Test mode is on in your dashboard: no money moves and nothing ships. Use card 4242 4242 4242 4242.</p>'}${e.stock ? `<p class="w-bad">${esc(e.stock)}</p>` : ''}
        <h3>Contact</h3>${fld('name', 'Full name', 'autocomplete="name"')}${fld('email', 'Email', 'type="email" autocomplete="email"')}
        <h3>Shipping address</h3>${fld('address', 'Address', 'autocomplete="street-address"')}<div class="w-two">${fld('city', 'City', 'autocomplete="address-level2"')}${fld('zip', 'Postcode', 'autocomplete="postal-code"')}</div>
        <h3>Delivery</h3><div class="w-choices" role="radiogroup" aria-label="Delivery">
          ${[['standard', 'Standard', std, `Arrives day ${S.day + 2}`], ['express', 'Express', wm(25), `Arrives day ${S.day + 1}`]].map(([k, l, pr, eta]) => `<label class="w-choice ${site.ship === k ? 'on' : ''}"><input type="radio" name="w-ship" value="${k}" ${site.ship === k ? 'checked' : ''}><span><b>${l}</b><small>${eta}</small></span><em>${pr}</em></label>`).join('')}</div>
        <h3>Payment</h3><div class="w-paytabs" role="tablist" aria-label="Payment method"><button type="button" role="tab" class="${site.pay === 'card' ? 'on' : ''}" aria-selected="${site.pay === 'card'}" data-action="w-paytab" data-m="card">Card</button><button type="button" role="tab" class="${site.pay === 'wallet' ? 'on' : ''}" aria-selected="${site.pay === 'wallet'}" data-action="w-paytab" data-m="wallet">Sillage wallet</button></div>
        ${site.pay === 'card' ? `<div class="w-cardbox"><label class="w-field ${e.card ? 'err' : ''}"><span>Card number</span><span class="w-cardrow"><input id="w-card" value="${esc(f.card || '')}" inputmode="numeric" autocomplete="cc-number" placeholder="1234 1234 1234 1234"><b id="w-brand" class="w-brand">${brand ? brand.name : ''}</b></span>${e.card ? `<small>${esc(e.card)}</small>` : ''}</label>
          <div class="w-two">${fld('exp', 'Expiry (MM/YY)', 'inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY"')}${fld('cvc', 'Security code', 'inputmode="numeric" autocomplete="cc-csc" placeholder="CVC"')}</div>
          <p class="w-small w-muted">${live ? `Charged to your in-game account (balance ${wm(S.cash)}). Any valid card number works; 4000 0000 0000 3220 asks your bank to confirm and 4000 0000 0000 0002 is declined.` : 'Test mode: the card is checked but not charged.'}</p></div>`
        : `<div class="w-cardbox w-wallet"><p><b>Pay from your Sillage wallet</b></p><p class="w-muted">Balance ${wm(S.cash)}${live && S.cash < t.total ? ' · <span class="w-bad">not enough for this order</span>' : ' · approved instantly'}</p>${e.wallet ? `<p class="w-bad w-small">${esc(e.wallet)}</p>` : ''}</div>`}
        <button class="w-btn w-wide w-paybtn"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>${live ? 'Pay' : 'Place test order'} · ${wm(t.total)}</button>
        <p class="w-secure">Secure checkout · encrypted · ${esc(m.name)} never stores your card</p></form>
        <aside class="w-summary"><h3>Order summary</h3><ul class="w-mini">${site.bag.map((x) => { const c = M().creations.find((k) => k.id === x.id); return `<li>${c ? img(c, 'bottle', 'w-mini-img') : ''}<span>${x.q} × ${esc(x.name)} <small>${x.size} ml</small></span><b>${wm(x.q * x.price)}</b></li>`; }).join('')}</ul><dl class="w-totals"><div><dt>Subtotal</dt><dd>${wm(t.sub)}</dd></div>${t.disc ? `<div><dt>Discount</dt><dd>−${wm(t.disc)}</dd></div>` : ''}<div><dt>Shipping (${site.ship})</dt><dd>${t.ship ? wm(t.ship) : 'Free'}</dd></div><div class="w-total"><dt>Total</dt><dd>${wm(t.total)}</dd></div></dl></aside></div></section>
        <div class="w-pay" id="w-pay" hidden></div>`;
    }
    if (pg.p === 'done') {
      const o = (w.myOrders || []).find((x) => x.n === pg.n) || site.lastOrder;
      if (!o) return '<section class="w-sec"><h1 class="w-title">Order not found</h1></section>';
      return `<section class="w-sec w-done"><ol class="w-crumbs"><li class="done">Bag</li><li class="done">Details &amp; payment</li><li class="on">Confirmation</li></ol>
        <div class="w-done-head"><svg class="w-tick" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg>
          <div><p class="w-kicker">${o.test ? 'Test order placed' : 'Payment received · order confirmed'}</p><h1 class="w-title">Thank you, ${esc(o.who.split(' ')[0])}!</h1><p>Your order <b>#${o.n}</b> is confirmed. A confirmation is on its way to <b>${esc(o.email || 'your inbox')}</b>.</p></div></div>
        ${o.test ? '<p class="w-test">This was a test order: no money moved, no stock was used and nothing will ship.</p>' : tracker(o)}
        <div class="w-done-grid">
          <div class="w-done-box"><p class="w-label">Shipping to</p><p>${esc(o.who)}<br>${esc(o.address || '')}<br>${esc(o.city)} ${esc(o.zip || '')}</p></div>
          <div class="w-done-box"><p class="w-label">Delivery</p><p>${o.method === 'express' ? 'Express' : 'Standard'} · ${o.delivered ? 'delivered day ' + o.delivered : 'arrives day ' + o.eta}<br><span class="w-muted">Tracking ${esc(o.track || '—')}</span></p></div>
          <div class="w-done-box"><p class="w-label">Payment</p><p>${esc(o.payLabel || 'Card')}<br><span class="w-muted">${o.test ? 'Not charged (test)' : 'Charged ' + wm(o.total)} · auth ${esc(o.auth || '—')}</span></p></div>
        </div>
        <ul class="w-mini w-done-items">${o.items.map((x) => { const c = M().creations.find((k) => k.id === x.id); return `<li>${c ? img(c, 'bottle', 'w-mini-img') : ''}<span>${x.q} × ${esc(x.name)} <small>${esc(x.size)}</small></span><b>${wm(x.q * x.price)}</b></li>`; }).join('')}</ul>
        <dl class="w-totals w-done-totals"><div><dt>Subtotal</dt><dd>${wm(o.sub)}</dd></div>${o.disc ? `<div><dt>Discount${o.code ? ' (' + esc(o.code) + ')' : ''}</dt><dd>−${wm(o.disc)}</dd></div>` : ''}<div><dt>Shipping</dt><dd>${o.ship ? wm(o.ship) : 'Free'}</dd></div><div class="w-total"><dt>${o.test ? 'Total' : 'Total paid'}</dt><dd>${wm(o.total)}</dd></div></dl>
        ${o.test ? '' : `<p class="w-small w-muted">It’s your own house, so ${esc(M().name)} booked this ${wm(o.total)} as a sale too. Your bottle arrives on day ${o.eta}, straight onto your shelf.</p>`}
        <div class="w-row"><button class="w-btn" data-action="w-go" data-p="receipt" data-n="${o.n}">View receipt</button><button class="w-btn w-btn-line" data-action="w-go" data-p="orders">Your orders</button><button class="w-link" data-action="w-go" data-p="shop">Keep shopping</button></div></section>`;
    }
    if (pg.p === 'orders') {
      const mine = (w.myOrders || []).slice().reverse(), items = (o) => o.items.reduce((a, x) => a + x.q, 0);
      return `<section class="w-sec"><h1 class="w-title">Your orders</h1>${mine.length ? `<ul class="w-orders">${mine.map((o) => `<li><div class="w-orders-head"><div><b>Order #${o.n}</b><p class="w-muted w-small">Placed day ${o.day} · ${items(o)} ${items(o) === 1 ? 'item' : 'items'} · ${wm(o.total)}</p></div><span class="w-status s-${orderStatus(o).key}">${orderStatus(o).label}</span></div>
        <p class="w-small">${o.items.map((x) => `${x.q} × ${esc(x.name)}`).join(', ')}</p>${o.test ? '' : tracker(o, true)}<div class="w-row"><button class="w-link" data-action="w-go" data-p="done" data-n="${o.n}">Order details</button><button class="w-link" data-action="w-go" data-p="receipt" data-n="${o.n}">Receipt</button></div></li>`).join('')}</ul>` : '<p class="w-muted">You haven’t ordered anything yet.</p><button class="w-btn" data-action="w-go" data-p="shop">Start shopping</button>'}</section>`;
    }
    if (pg.p === 'receipt') {
      const o = (w.myOrders || []).find((x) => x.n === pg.n); if (!o) return '<section class="w-sec"><h1 class="w-title">Receipt not found</h1></section>';
      return `<section class="w-sec"><article class="w-receipt" id="w-receipt"><header><div><p class="w-receipt-logo">${esc(m.name.toUpperCase())}</p><p class="w-muted w-small">${esc(m.city)} · www.${esc(w.domain)}.com</p></div><div class="w-receipt-meta"><p><b>${o.test ? 'TEST RECEIPT' : 'RECEIPT'}</b></p><p>Order #${o.n}</p><p>Day ${o.day}</p></div></header>
        <div class="w-two"><div><p class="w-label">Billed to</p><p>${esc(o.who)}<br>${esc(o.email || '')}</p></div><div><p class="w-label">Ship to</p><p>${esc(o.address || '')}<br>${esc(o.city)} ${esc(o.zip || '')}</p></div></div>
        <table class="w-receipt-table"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>${o.items.map((x) => `<tr><td>${esc(x.name)} <small>${esc(x.size)}</small></td><td>${x.q}</td><td>${wm(x.price)}</td><td>${wm(x.q * x.price)}</td></tr>`).join('')}</tbody></table>
        <dl class="w-totals"><div><dt>Subtotal</dt><dd>${wm(o.sub)}</dd></div>${o.disc ? `<div><dt>Discount</dt><dd>−${wm(o.disc)}</dd></div>` : ''}<div><dt>Shipping (${o.method || 'standard'})</dt><dd>${o.ship ? wm(o.ship) : 'Free'}</dd></div><div><dt>Tax included</dt><dd>${wm(Math.round(o.total / 6))}</dd></div><div class="w-total"><dt>Total</dt><dd>${wm(o.total)}</dd></div></dl>
        <p class="w-small w-muted">Paid with ${esc(o.payLabel || 'card')} · authorisation ${esc(o.auth || '—')} · ${o.test ? 'test mode, not charged' : 'payment captured'}</p></article>
        <div class="w-row"><button class="w-btn" data-action="w-print">Print receipt</button><button class="w-btn w-btn-line" data-action="w-go" data-p="orders">Your orders</button></div></section>`;
    }
    if (pg.p === 'hot') return cs.length ? hotPage() : '<section class="w-sec"><h1 class="w-title">What’s hot</h1><p class="w-muted">Nothing on sale yet.</p></section>';
    if (pg.p === 'journal') return `<section class="w-sec"><h1 class="w-title">Journal</h1>${w.posts.length ? `<div class="w-posts">${w.posts.slice().reverse().map((p) => postCard(p, w.posts.indexOf(p))).join('')}</div>` : '<p class="w-muted">No stories yet. Write the first one in your dashboard.</p>'}</section>`;
    if (pg.p === 'post') { const p = w.posts[pg.post]; return p ? `<article class="w-sec w-article"><p class="w-kicker">Journal · Day ${p.day}</p><h1 class="w-title">${esc(p.title)}</h1>${p.body.split(/\n+/).map((t) => `<p>${esc(t)}</p>`).join('')}<button class="w-link" data-action="w-go" data-p="journal">← All stories</button></article>` : ''; }
    if (pg.p === 'story') return `<article class="w-sec w-article"><p class="w-kicker">Since day ${m.day} · ${esc(m.city)}</p><h1 class="w-title">Our story</h1>${(w.story || `${m.name} was founded in ${m.city} by a collector who had smelled everything and still found something missing.\nEvery fragrance is composed in our own lab, bottled in glass we design ourselves and boxed by hand.`).split(/\n+/).map((t) => `<p>${esc(t)}</p>`).join('')}
      <dl class="w-facts"><div><dt>Fragrances</dt><dd>${cs.length}</dd></div><div><dt>Bottles sold</dt><dd>${m.stats.sold.toLocaleString('en-US')}</dd></div><div><dt>Boutiques</dt><dd>${m.shops}</dd></div></dl></article>`;
    if (pg.p === 'contact') return `<section class="w-sec w-article"><h1 class="w-title">Contact us</h1><p>Questions about an order, a fragrance or a collaboration? We reply within a day.</p>${site.msg ? `<p class="w-ok">${esc(site.msg)}</p>` : ''}
      <form data-form="w-contact" class="w-form" novalidate><label class="w-field ${site.err.cname ? 'err' : ''}"><span>Name</span><input id="w-cname">${site.err.cname ? `<small>${esc(site.err.cname)}</small>` : ''}</label><label class="w-field ${site.err.cmail ? 'err' : ''}"><span>Email</span><input id="w-cmail" type="email">${site.err.cmail ? `<small>${esc(site.err.cmail)}</small>` : ''}</label><label class="w-field ${site.err.cmsg ? 'err' : ''}"><span>Message</span><textarea id="w-cmsg" rows="4"></textarea>${site.err.cmsg ? `<small>${esc(site.err.cmsg)}</small>` : ''}</label><button class="w-btn">Send message</button></form></section>`;
    return '';
  }
  // The cover: one slide per release, newest first, each in its own bottle and box colours.
  function cover(cs, w, m) {
    if (!cs.length) return `<section class="w-hero"><div class="w-hero-copy"><p class="w-kicker">${esc(m.city)}</p><h1>${esc(w.headline || m.name)}</h1><p class="w-lede">${esc(w.tagline || `Fragrances composed in ${m.city}.`)}</p></div></section>`;
    const order = cs.slice().sort((a, b) => b.launched - a.launched || cs.indexOf(b) - cs.indexOf(a));
    const f = cs.find((c) => c.id === w.featured); if (f && order[0] !== f) { order.splice(order.indexOf(f), 1); order.splice(1, 0, f); }
    if (site.coverTop !== order[0].id) { site.coverTop = order[0].id; site.slide = 0; }
    const k = site.slide % order.length, N = Maison.NOTE;
    const slides = order.map((c, i) => {
      if (w.template === 'grand' || w.template === 'noir') return campaignSlide(c, i, k, order.length, w);
      // Body text needs strong contrast; the box ink stays for the name and buttons when it reads well enough.
      const paper = c.box.paper, ink = c.box.ink, gap = Math.abs(lum(paper) - lum(ink)), base = lum(paper) > 0.5 ? '#141414' : '#f6f2ea';
      const fg = gap > 0.5 ? ink : base, acc = gap > 0.3 ? ink : fg;
      const age = S.day - c.launched, kicker = age <= 0 ? 'Out today' : age <= 7 ? `New release · day ${c.launched}` : `${FAMILIES[c.family].label} · ${Maison.CONC[c.conc].label}`;
      const notes = [c.notes.top[0], c.notes.heart[0], c.notes.base[0]].filter(Boolean).map((x) => N[x].name);
      const lede = c.id === w.featured && w.tagline ? w.tagline : `${Maison.CONC[c.conc].label} · a ${FAMILIES[c.family].label.toLowerCase()} fragrance of ${notes.join(', ').replace(/, ([^,]*)$/, ' and $1').toLowerCase()}.`;
      return `<div class="w-hero w-slide ${i === k ? 'on' : ''}" data-fg="${fg}" aria-hidden="${i === k ? 'false' : 'true'}" ${i === k ? '' : 'inert'} role="group" aria-roledescription="slide" aria-label="${i + 1} of ${order.length}: ${esc(c.name)}"
        style="--c-paper:${paper};--c-glass:${c.design.color};--c-juice:${c.design.juice};--s-bg:${paper};--s-fg:${fg};--s-accent:${acc};--s-muted:color-mix(in srgb, ${fg} 72%, ${paper});--s-line:color-mix(in srgb, ${fg} 25%, ${paper})">
        <div class="w-hero-copy"><p class="w-kicker">${kicker}</p><h1>${esc(c.id === w.featured && w.headline ? w.headline : c.name)}</h1><p class="w-lede">${esc(lede)}</p>
          ${c.accords.length ? `<p class="w-accords">${c.accords.slice(0, 3).map((a) => `<span>${esc(a)}</span>`).join('')}</p>` : ''}
          <div class="w-row"><button class="w-btn" data-action="w-go" data-p="product" data-id="${c.id}">Discover ${esc(c.name)}</button><button class="w-btn w-btn-line" data-action="w-go" data-p="shop">Shop all</button></div></div>
        <div class="w-hero-art">${img(c, 'box', 'w-hero-box')}${img(c, 'bottle', 'w-hero-bottle')}</div></div>`;
    }).join('');
    const many = order.length > 1;
    return `<section class="w-cover" aria-roledescription="carousel" aria-label="New releases">
      <div class="w-slides">${slides}</div>
      ${many ? `<button class="w-cover-nav prev" data-action="w-slide" data-d="-1" aria-label="Previous release">‹</button><button class="w-cover-nav next" data-action="w-slide" data-d="1" aria-label="Next release">›</button>
      <div class="w-dots">${order.map((c, i) => `<button class="${i === k ? 'on' : ''}" data-action="w-slide" data-i="${i}" aria-label="Show ${esc(c.name)}"></button>`).join('')}</div>` : ''}</section>`;
  }
  /* Campaign covers for the Grand maison and Noir looks. Grand paints a scene for the fragrance's family
     (starry night, desert dusk, seaside, garden or forest) tinted with its juice; Noir is black with smoke. */
  const SCENE_OF = { fresh: 'sea', citrus: 'sea', aquatic: 'sea', oud: 'desert', amber: 'desert', spicy: 'desert', leather: 'desert', sweet: 'garden', gourmand: 'garden', floral: 'garden', woody: 'forest', aromatic: 'forest' };
  const CAMPAIGN = { night: 'A night written in the stars', desert: 'A legend of the desert', sea: 'Where the tide begins', garden: 'A garden in full bloom', forest: 'Into the ancient forest' };
  function scene(kind, c, i) {
    const R = (k) => { const x = Math.sin((i * 97 + k) * 12.9898) * 43758.5453; return x - Math.floor(x); };
    const id = 'sc' + i + kind, J = c.design.juice, I = c.box.ink;
    const grad = (stops) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, col]) => `<stop offset="${o}" stop-color="${col}"/>`).join('')}</linearGradient>`;
    const stars = (n, h) => Array.from({ length: n }, (_, k) => `<circle cx="${(R(k) * 1600).toFixed(0)}" cy="${(R(k + 300) * h).toFixed(0)}" r="${(0.6 + R(k + 600) * 1.6).toFixed(1)}" fill="#fff" opacity="${(0.4 + R(k + 900) * 0.6).toFixed(2)}"/>`).join('');
    const bumps = (y, amp, step, fill, seed) => { let d = `M0 760 L0 ${y}`; for (let x = 0; x < 1600; x += step) d += ` Q${x + step / 2} ${(y - amp * (0.5 + R(seed + x))).toFixed(0)} ${x + step} ${y}`; return `<path d="${d} L1600 760 Z" fill="${fill}"/>`; };
    const pines = (y, h, step, fill, seed) => { let d = `M0 760 L0 ${y}`; for (let x = 0; x < 1600; x += step) { const t = h * (0.6 + R(seed + x) * 0.6); d += ` L${x + step / 2} ${(y - t).toFixed(0)} L${x + step} ${y}`; } return `<path d="${d} L1600 760 Z" fill="${fill}"/>`; };
    const dune = (y, amp, fill, ph) => { let d = `M0 760 L0 ${y}`; for (let x = 0; x <= 1600; x += 40) d += ` L${x} ${(y + Math.sin(x / 260 + ph) * amp + Math.sin(x / 90 + ph * 2) * amp * 0.2).toFixed(0)}`; return `<path d="${d} L1600 760 Z" fill="${fill}"/>`; };
    let body = '';
    if (kind === 'night') body = `<defs>${grad([[0, '#060b1e'], [0.55, '#17264d'], [1, '#3a4f86']])}</defs><rect width="1600" height="760" fill="url(#${id})"/>${stars(120, 430)}<circle cx="1260" cy="140" r="36" fill="#f4f1e6" opacity="0.9"/><circle cx="1260" cy="140" r="80" fill="#f4f1e6" opacity="0.06"/>
      <g transform="translate(760 200)"><ellipse rx="66" ry="80" fill="${J}"/><path d="M-66 0 Q0 30 66 0" stroke="${I}" stroke-width="7" fill="none"/><path d="M-60 -30 Q0 -6 60 -30" stroke="#ffffff" stroke-opacity=".5" stroke-width="4" fill="none"/><path d="M-30 70 L-14 110 M30 70 L14 110" stroke="#2a2a2a" stroke-width="2"/><rect x="-16" y="108" width="32" height="20" rx="3" fill="#6b4a2a"/></g>
      ${bumps(500, 70, 44, '#8ea0c6', 1)}${bumps(560, 60, 36, '#c9d4ea', 2)}<rect y="610" width="1600" height="150" fill="#e8eef8"/>${bumps(640, 22, 70, '#f6f9ff', 3)}`;
    if (kind === 'desert') body = `<defs>${grad([[0, '#1d0b16'], [0.45, '#7a2e2a'], [0.75, '#d9733e'], [1, '#f5b46a']])}</defs><rect width="1600" height="760" fill="url(#${id})"/>${stars(50, 220)}<circle cx="820" cy="440" r="96" fill="#ffd6a0" opacity="0.92"/>
      ${dune(470, 30, '#c58450', 0.5)}${dune(540, 40, '#9b5530', 2.1)}${dune(630, 34, '#6a3120', 4)}`;
    if (kind === 'sea') body = `<defs>${grad([[0, '#0c2340'], [0.4, '#3b6f9e'], [0.58, '#f1cfa4'], [0.581, '#1f6390'], [1, '#08243d']])}</defs><rect width="1600" height="760" fill="url(#${id})"/>${stars(30, 160)}<circle cx="860" cy="420" r="70" fill="#ffe2b8" opacity="0.95"/>
      ${Array.from({ length: 14 }, (_, k) => `<rect x="${860 - 90 + R(k) * 40 - k * 6}" y="${452 + k * 18}" width="${150 - k * 6 + R(k + 5) * 60}" height="3" fill="#ffe2b8" opacity="${(0.7 - k * 0.04).toFixed(2)}"/>`).join('')}
      ${Array.from({ length: 22 }, (_, k) => `<path d="M${(R(k + 40) * 1500).toFixed(0)} ${470 + k * 13} q20 -6 40 0" stroke="#bfe0f2" stroke-opacity=".35" fill="none"/>`).join('')}${bumps(700, 30, 120, '#0a1d30', 4)}`;
    if (kind === 'garden') body = `<defs>${grad([[0, '#22152a'], [0.5, '#8a4f6c'], [1, '#f0bfae']])}</defs><rect width="1600" height="760" fill="url(#${id})"/>${stars(40, 200)}
      <path d="M560 760 L560 420 A120 120 0 0 1 800 420 L800 760" fill="none" stroke="#1d3326" stroke-width="22"/>${bumps(560, 50, 90, '#2b4a36', 5)}<rect y="600" width="1600" height="160" fill="#1d3326"/>
      ${Array.from({ length: 70 }, (_, k) => `<circle cx="${(R(k + 70) * 1600).toFixed(0)}" cy="${(560 + R(k + 140) * 160).toFixed(0)}" r="${(3 + R(k + 210) * 5).toFixed(1)}" fill="${k % 3 ? J : '#f6e6ef'}" opacity=".9"/>`).join('')}
      ${[220, 380, 1300, 1460].map((x) => `<circle cx="${x}" cy="540" r="54" fill="#22402e"/><rect x="${x - 6}" y="580" width="12" height="40" fill="#3a2a1a"/>`).join('')}`;
    if (kind === 'forest') body = `<defs>${grad([[0, '#0b1612'], [0.5, '#2d5243'], [1, '#a9c9b4']])}</defs><rect width="1600" height="760" fill="url(#${id})"/>${stars(30, 180)}
      ${pines(470, 150, 50, '#5d826f', 6)}<rect y="440" width="1600" height="120" fill="#e8f2ec" opacity=".14"/>${pines(560, 190, 64, '#2f4c3e', 7)}${pines(680, 240, 90, '#14241d', 8)}`;
    return `<svg class="w-scene" viewBox="0 0 1600 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}<rect width="1600" height="760" fill="${J}" opacity=".1"/><defs><linearGradient id="${id}s" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".55" stop-color="#000" stop-opacity="0"/></linearGradient></defs><rect width="1600" height="760" fill="url(#${id}s)"/></svg>`;
  }
  function campaignSlide(c, i, k, total, w) {
    const on = i === k, attrs = `data-fg="#ffffff" aria-hidden="${on ? 'false' : 'true'}" ${on ? '' : 'inert'} role="group" aria-roledescription="slide" aria-label="${i + 1} of ${total}: ${esc(c.name)}"`;
    const head = c.id === w.featured && w.headline ? w.headline : null, age = S.day - c.launched;
    if (w.template === 'noir') {
      const kicker = age <= 0 ? 'Out today' : age <= 7 ? 'The new creation' : FAMILIES[c.family].label + ' · ' + Maison.CONC[c.conc].label;
      return `<div class="w-slide w-noir-slide ${on ? 'on' : ''}" ${attrs} style="--c-juice:${c.design.juice}"><div class="w-smoke" aria-hidden="true"><i></i><i></i><i></i></div>${img(c, 'bottle', 'w-noir-bottle')}
        <div class="w-noir-copy"><p class="w-kicker">${kicker}</p><h1>${esc(head || c.name)}</h1><p>${esc(w.tagline && c.id === w.featured ? w.tagline : (c.accords[0] ? c.accords.slice(0, 2).join(' · ') : FAMILIES[c.family].label))}</p><button class="w-noir-cta" data-action="w-go" data-p="product" data-id="${c.id}">Discover</button></div></div>`;
    }
    const kind = SCENE_OF[c.family] || 'night';
    return `<div class="w-slide w-scene-slide ${on ? 'on' : ''}" ${attrs}>${scene(kind, c, i)}
      <div class="w-scene-copy"><h1>${esc(head || CAMPAIGN[kind])}</h1><button class="w-scene-cta" data-action="w-go" data-p="product" data-id="${c.id}">Embark on the journey</button><p class="w-scene-sub">${esc(c.name)} · ${esc(Maison.CONC[c.conc].label)}${age <= 7 ? ' · new' : ''}</p></div>
      ${img(c, 'bottle', 'w-scene-bottle')}</div>`;
  }
  function hotCard(x, i) {
    const c = x.c, h = x.h, tr = h.trend == null ? '' : h.trend >= 0.05 ? `<span class="w-up">▲ ${Math.round(h.trend * 100)}%</span>` : h.trend <= -0.05 ? `<span class="w-down">▼ ${Math.round(-h.trend * 100)}%</span>` : '';
    return `<article class="w-card w-hot"><span class="w-rank">${i + 1}</span><button class="w-card-img" data-action="w-go" data-p="product" data-id="${c.id}">${img(c)}</button>
      <div class="w-card-body">${x.badges.length ? `<p class="w-badges">${x.badges.slice(0, 2).map((b) => `<span>${esc(b)}</span>`).join('')}</p>` : ''}<h3><button data-action="w-go" data-p="product" data-id="${c.id}">${esc(c.name)}</button></h3>
      <p class="w-muted w-small">${h.wk.toLocaleString('en-US')} sold this week ${tr}</p>
      <p class="w-price">${wm(c.price)} ${h.avg ? stars5(h.avg) + ` <small class="w-muted">(${reviewCount(c)})</small>` : ''}</p></div></article>`;
  }
  function ticker(w) {
    const o = w.orders.filter((x) => !x.test).slice(0, 5); if (!o.length) return '';
    return `<ul class="w-ticker" aria-label="Recent orders">${o.map((x) => `<li><b>${esc(x.who)}</b> in ${esc(x.city)} bought ${esc(x.items[0].name)} <span class="w-muted">· ${x.day === S.day ? 'today' : x.day === S.day - 1 ? 'yesterday' : 'day ' + x.day}</span></li>`).join('')}</ul>`;
  }
  function hotPage() {
    const list = hotList(), N = Maison.NOTE, w = W();
    const noteW = {}; for (const x of list) for (const id of x.c.notes.top.concat(x.c.notes.heart, x.c.notes.base)) noteW[id] = (noteW[id] || 0) + x.h.wk + 1;
    const topNotes = Object.entries(noteW).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const latest = list.flatMap((x) => ((w.reviews[x.c.id]) || []).slice(0, 6).map((r) => ({ r, c: x.c }))).sort((a, b) => (b.r.day || 0) - (a.r.day || 0) || (b.r.id || 0) - (a.r.id || 0)).slice(0, 6);
    return `<section class="w-sec"><p class="w-kicker">Updated daily · trending family: ${FAMILIES[trendFam()].label}</p><h1 class="w-title">What’s hot</h1>
      <ol class="w-chart">${list.map((x, i) => { const c = x.c, h = x.h, tr = h.trend == null ? '<span class="w-muted">new</span>' : h.trend >= 0.05 ? `<span class="w-up">▲ ${Math.round(h.trend * 100)}%</span>` : h.trend <= -0.05 ? `<span class="w-down">▼ ${Math.round(-h.trend * 100)}%</span>` : '<span class="w-muted">steady</span>';
        return `<li><span class="w-rank">${i + 1}</span><button class="w-chart-img" data-action="w-go" data-p="product" data-id="${c.id}">${img(c)}</button><div><button class="w-chart-name" data-action="w-go" data-p="product" data-id="${c.id}">${esc(c.name)}</button><p class="w-badges">${x.badges.map((b) => `<span>${esc(b)}</span>`).join('')}</p><p class="w-muted w-small">${FAMILIES[c.family].label} · ${h.avg ? h.avg.toFixed(1) + '★ from ' + reviewCount(c) + (reviewCount(c) === 1 ? ' review' : ' reviews') : 'no reviews yet'}</p></div><div class="w-chart-end"><b>${h.wk.toLocaleString('en-US')}</b><small class="w-muted">sold this week</small>${tr}</div></li>`; }).join('')}</ol></section>
      <section class="w-sec"><h2>Notes everyone’s wearing</h2><p class="w-accords w-notes-hot">${topNotes.map(([id]) => `<span>${esc(N[id].name)}</span>`).join('')}</p></section>
      ${latest.length ? `<section class="w-sec"><h2>Just reviewed</h2><ul class="w-reviews">${latest.map(({ r, c }) => { const tx = revText(c, r); return `<li><div class="w-rev-top">${stars5(r.stars)} <b>${esc(tx.title)}</b></div><p>${esc(tx.text)}</p><p class="w-rev-meta">${esc(r.who)} on <button class="w-link" data-action="w-go" data-p="product" data-id="${c.id}">${esc(c.name)}</button>${r.day ? ' · day ' + r.day : ''}</p></li>`; }).join('')}</ul></section>` : ''}`;
  }
  function reviewsBlock(c) {
    const all = siteReviews(c), n = all.length, avg = avgStars(c);
    if (!n) return '<section class="w-sec" id="w-reviews"><h2>Reviews</h2><p class="w-muted">No reviews yet. They arrive as people buy and wear it.</p></section>';
    const hist = [5, 4, 3, 2, 1].map((s) => all.filter((r) => r.stars === s).length), rec = Math.round((all.filter((r) => r.stars >= 4).length / n) * 100);
    const list = (site.revStar ? all.filter((r) => r.stars === site.revStar) : all.slice()).sort({
      recent: (a, b) => (b.day || 0) - (a.day || 0) || (b.id || 0) - (a.id || 0), helpful: (a, b) => (b.helpful || 0) - (a.helpful || 0),
      high: (a, b) => b.stars - a.stars || (b.day || 0) - (a.day || 0), low: (a, b) => a.stars - b.stars || (b.day || 0) - (a.day || 0),
    }[site.revSort] || (() => 0));
    const shown = list.slice(0, site.revShow), recent = all.filter((r) => r.day != null && r.day >= S.day - 1 && !r.critic).length;
    return `<section class="w-sec" id="w-reviews"><div class="w-sec-head"><h2>Reviews <span class="w-muted">(${n.toLocaleString('en-US')})</span></h2>${recent ? `<p class="w-muted w-small">${recent} new since yesterday</p>` : ''}</div>
      <div class="w-rev-grid"><aside class="w-rev-sum"><p class="w-rev-avg">${avg.toFixed(1)}</p>${stars5(avg)}<p class="w-muted w-small">${n.toLocaleString('en-US')} ${n === 1 ? 'review' : 'reviews'} · ${rec}% recommend</p>
        <ul class="w-hist">${hist.map((k, i) => { const s = 5 - i; return `<li><button class="${site.revStar === s ? 'on' : ''}" data-action="w-rstar" data-s="${s}" aria-label="Show ${s}-star reviews (${k})"><span>${s} ★</span><i><b style="width:${(k / n) * 100}%"></b></i><span>${k}</span></button></li>`; }).join('')}</ul>
        ${site.revStar ? '<button class="w-link" data-action="w-rstar" data-s="0">Show all ratings</button>' : ''}</aside>
        <div><div class="w-rev-bar"><p class="w-muted w-small">${site.revStar ? `${list.length} with ${site.revStar} ${site.revStar === 1 ? 'star' : 'stars'}` : `Showing ${shown.length} of ${n}`}</p>
          <label class="w-select">Sort <select id="w-rsort">${[['recent', 'Most recent'], ['helpful', 'Most helpful'], ['high', 'Highest rated'], ['low', 'Lowest rated']].map(([k, l]) => `<option value="${k}" ${site.revSort === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
          <ul class="w-reviews">${shown.map((r) => { const tx = revText(c, r); return `<li><div class="w-rev-top">${stars5(r.stars)} ${tx.title ? `<b>${esc(tx.title)}</b>` : ''}</div><p>${esc(tx.text)}</p>
            <p class="w-rev-meta">${esc(r.who)}${r.city ? ' · ' + esc(r.city) : ''}${r.day != null ? ' · day ' + r.day : ''} · <span class="w-badge">${r.critic ? 'Critic' : 'Verified buyer'}</span>${r.size ? ' · ' + esc(r.size) : ''}</p>
            ${r.id && !r.critic ? `<button class="w-helpful ${r.voted ? 'on' : ''}" data-action="w-helpful" data-c="${c.id}" data-r="${r.id}" ${r.voted ? 'aria-pressed="true"' : ''}>Helpful · ${r.helpful || 0}</button>` : ''}</li>`; }).join('') || '<li class="w-muted">No reviews with that rating yet.</li>'}</ul>
          ${list.length > shown.length ? `<button class="w-btn w-btn-line" data-action="w-rmore">Show more reviews (${(list.length - shown.length).toLocaleString('en-US')} more)</button>` : ''}</div></div></section>`;
  }
  function postCard(p, i) { return `<article class="w-post"><p class="w-kicker">Day ${p.day}</p><h3><button data-action="w-go" data-p="post" data-post="${i}">${esc(p.title)}</button></h3><p class="w-muted">${esc(p.body.slice(0, 120))}${p.body.length > 120 ? '…' : ''}</p></article>`; }
  function newsletter() { return `<section class="w-news"><h2>Join the list</h2><p>New launches, journal stories and private sales, first.</p><form data-form="w-news" class="w-row"><input id="w-news" type="email" placeholder="Your email" aria-label="Email" value="${esc(site.newsletter)}"><button class="w-btn">Subscribe</button></form>${site.newsMsg ? `<p class="w-small">${esc(site.newsMsg)}</p>` : ''}</section>`; }
  function cardBrand(num) {
    const d = String(num).replace(/\D/g, '');
    if (/^3[47]/.test(d)) return { name: 'AMEX', len: 15, cvc: 4 };
    if (/^4/.test(d)) return { name: 'VISA', len: 16, cvc: 3 };
    if (/^(5[1-5]|2[2-7])/.test(d)) return { name: 'MASTERCARD', len: 16, cvc: 3 };
    if (/^6/.test(d)) return { name: 'DISCOVER', len: 16, cvc: 3 };
    return null;
  }
  const luhn = (d) => { let sum = 0; for (let i = 0; i < d.length; i++) { let x = +d[d.length - 1 - i]; if (i % 2) { x *= 2; if (x > 9) x -= 9; } sum += x; } return d.length > 0 && sum % 10 === 0; };
  // Where a website order is: packed the day it's placed, shipped, out for delivery, delivered on its due day.
  function orderStatus(o) {
    if (o.test) return { key: 'test', label: 'Test', step: 0 };
    if (o.delivered || S.day >= o.eta) return { key: 'delivered', label: 'Delivered', step: 3 };
    if (S.day > o.day || o.method === 'express') return { key: 'shipped', label: S.day >= o.eta - 1 && S.day > o.day ? 'Out for delivery' : 'Shipped', step: 2 };
    return { key: 'packed', label: 'Being packed', step: 1 };
  }
  function tracker(o, small) {
    const st = orderStatus(o).step, steps = [['Ordered', 'day ' + o.day], ['Packed', 'day ' + o.day], ['Shipped', 'day ' + (o.method === 'express' ? o.day : o.day + 1)], ['Delivered', (st >= 3 ? 'day ' : 'due day ') + o.eta]];
    return `<ol class="w-track ${small ? 'small' : ''}" aria-label="Delivery progress: ${orderStatus(o).label}">${steps.map(([l, d], i) => `<li class="${i <= st ? 'done' : ''} ${i === st ? 'now' : ''}"><i aria-hidden="true"></i><b>${l}</b><small>${d}</small></li>`).join('')}</ol>`;
  }
  function bagTotals() {
    const sub = site.bag.reduce((a, x) => a + x.q * x.price, 0), disc = site.code ? Math.round(sub * site.code.pct / 100) : 0;
    const ship = !sub ? 0 : site.ship === 'express' ? 25 : W().freeShip || sub - disc >= 150 ? 0 : 12;
    return { sub, disc, ship, total: sub - disc + ship };
  }

  // Announcement messages for the Grand maison bar: rotate, step through, pause or close.
  function annMessages(w, m, announce) {
    const cs = liveCreations().slice().sort((a, b) => b.launched - a.launched), c = cs[0];
    return [w.announce || 'Discover the world of ' + m.name, c ? `New: ${c.name}, our ${Maison.CONC[c.conc].label.toLowerCase()}` : '', announce, `Join the ${m.name.split(/\s+/).pop()} circle for private sales and first access`].filter(Boolean);
  }
  function siteTop(w, m, pg, n, announce) {
    const search = site.searchOpen ? `<form data-form="w-search" class="w-search w-search-row" role="search"><input id="w-q" type="search" placeholder="Search fragrances, notes or families" aria-label="Search the shop" value="${esc(site.q)}"><button class="w-link" type="button" data-action="w-search-toggle">Close</button></form>` : '';
    const bag = `<button class="w-icon w-bag-ic" data-action="w-go" data-p="cart" aria-label="Bag, ${n} items">${ICON.bag}${n ? `<span>${n}</span>` : ''}</button>`;
    if (w.template === 'noir') {
      const nav = [['shop', 'Fragrances'], ['hot', 'What’s hot'], ['journal', 'Journal'], ['story', 'The house']];
      return `<p class="w-announce w-ann-noir">${esc(announce)}</p>
        <header class="w-header w-header-noir"><nav class="w-nav w-nav-noir">${nav.map(([k, l]) => `<button class="${pg.p === k ? 'on' : ''}" data-action="w-go" data-p="${k}">${l}</button>`).join('')}</nav>
          <button class="w-logo w-logo-noir" data-action="w-go" data-p="home"><span>${esc(m.name.toUpperCase())}</span><small>Parfums · ${esc(m.city)}</small></button>
          <div class="w-hr"><button class="w-icon" data-action="w-search-toggle" aria-label="Search">${ICON.search}</button><button class="w-icon" data-action="w-go" data-p="orders" aria-label="Your account and orders">${ICON.user}</button>${bag}</div>${search}</header>`;
    }
    const msgs = annMessages(w, m, announce), k = site.ann % msgs.length;
    const nav = [['new', 'New in'], ['shop', 'Fragrances'], ['hot', 'What’s hot'], ['journal', 'Journal'], ['story', 'La maison'], ['contact', 'Contact']];
    return `${site.annClosed ? '' : `<div class="w-ann-bar" role="region" aria-label="Announcements"><span class="w-ann-count">${msgs.map((_, i) => `<button class="${i === k ? 'on' : ''}" data-action="w-ann" data-i="${i}" aria-label="Message ${i + 1}">${String(i + 1).padStart(2, '0')}</button>`).join('')}</span>
        <span class="w-ann-msg"><button data-action="w-ann" data-d="-1" aria-label="Previous message">‹</button><span id="w-ann-text" aria-live="polite">${esc(msgs[k])}</span><button data-action="w-ann" data-d="1" aria-label="Next message">›</button></span>
        <span class="w-ann-ctl"><button data-action="w-ann-pause" aria-label="${site.annPaused ? 'Play' : 'Pause'} messages">${site.annPaused ? '▶' : '❚❚'}</button><button data-action="w-ann-close" aria-label="Close announcements">✕</button></span></div>`}
      <header class="w-header w-header-grand"><div class="w-hl"><label class="w-region"><span class="sr-only">Region</span><select id="w-region">${Object.entries(REGIONS).map(([k2, [l]]) => `<option value="${k2}" ${site.cur === k2 ? 'selected' : ''}>${l}</option>`).join('')}</select></label><button class="w-search-btn" data-action="w-search-toggle">${ICON.search}<span>Search</span></button></div>
        <button class="w-logo w-logo-grand" data-action="w-go" data-p="home"><span>${esc(m.name.toUpperCase())}</span><small>${esc(m.city.toUpperCase())}</small></button>
        <div class="w-hr"><button class="w-join" data-action="w-join">Join the ${esc(m.name.split(/\s+/).pop())} circle</button><span class="w-sep" aria-hidden="true"></span><button class="w-icon" data-action="w-go" data-p="orders" aria-label="Your account and orders">${ICON.user}</button><button class="w-icon" data-action="w-go" data-p="story" aria-label="Our boutiques">${ICON.pin}</button>${bag}</div>
        <nav class="w-nav w-nav-grand">${nav.map(([k2, l]) => `<button class="${(k2 === 'new' ? pg.p === 'shop' && site.sort === 'new' : k2 === 'shop' ? pg.p === 'shop' && site.sort !== 'new' : pg.p === k2) ? 'on' : ''}" ${k2 === 'new' ? 'data-action="w-new"' : `data-action="w-go" data-p="${k2}"`}>${l}</button>`).join('')}</nav>${search}</header>`;
  }
  function renderWebsite() {
    const w = W(), m = M();
    if (!w) {
      const ok = liveCreations().length > 0, dom = (site.domain != null ? site.domain : slug(m.name).replace(/-/g, '')) || 'mymaison';
      return `<article class="panel launch-site"><p class="eyebrow">Your website</p><h2>Take ${esc(m.name)} online</h2>
        <p class="muted">A real storefront for your house: a home page, a shop, product pages with your bottles and boxes, a bag and checkout, a journal and a contact page. Online customers buy from the same stock as your boutiques, around the clock.</p>
        <label class="field"><span>Domain</span><div class="domain"><span>www.</span><input id="ws-domain" maxlength="24" value="${esc(dom)}"><span>.com</span></div></label>
        <label class="field"><span>Look</span><select id="ws-template">${opt(TEMPLATES, site.template || 'luxe')}</select></label>
        <button class="btn btn-primary btn-big" data-action="ws-launch" ${!ok ? 'disabled title="Launch a fragrance first"' : lack(SITE_COST)}>Launch the website · ${money(SITE_COST)}</button>
        <p class="hint">${ok ? (S.cash >= SITE_COST ? `Hosting costs ${money(HOSTING)} a day.` : `You need ${money(SITE_COST - S.cash)} more.`) : 'Launch your first fragrance before opening a shop.'}</p></article>`;
    }
    const sw = `<div class="subnav site-switch"><button class="${site.mode === 'visit' ? 'on' : ''}" data-action="ws-mode" data-m="visit">Visit your site</button><button class="${site.mode === 'admin' ? 'on' : ''}" data-action="ws-mode" data-m="admin">Dashboard${w.inbox.some((x) => !x.done) ? ` <span class="pill">${w.inbox.filter((x) => !x.done).length}</span>` : ''}</button></div>`;
    if (site.mode === 'admin') return sw + renderSiteAdmin();
    const th = siteTheme(), pg = cur(), n = bagCount();
    const nav = [['home', 'Home'], ['shop', 'Shop'], ['hot', 'What’s hot'], ['journal', 'Journal'], ['story', 'Our story'], ['contact', 'Contact']];
    const announce = w.announce || (w.freeShip ? 'Free shipping on every order' : 'Free shipping on orders over $150');
    const top = w.template === 'grand' || w.template === 'noir' ? siteTop(w, m, pg, n, announce) : null;
    return sw + `<div class="browser">
      <div class="b-chrome"><span class="b-dots" aria-hidden="true"><i></i><i></i><i></i></span>
        <button class="b-nav" data-action="w-back" ${site.hi > 0 ? '' : 'disabled'} aria-label="Back">‹</button><button class="b-nav" data-action="w-fwd" ${site.hi < site.hist.length - 1 ? '' : 'disabled'} aria-label="Forward">›</button><button class="b-nav" data-action="w-reload" aria-label="Reload">↻</button>
        <div class="b-url"><span class="b-lock" aria-hidden="true">🔒</span><span>https://www.${esc(w.domain)}.com</span><span class="b-path">${esc(sitePath(pg))}</span></div></div>
      <div class="site-view" id="site-view" style="--s-bg:${th.bg};--s-fg:${th.fg};--s-accent:${th.accent};--s-card:${th.card}" data-font="${th.font}" data-tpl="${w.template}">
        ${top || `<p class="w-announce">${esc(announce)}</p>
        <header class="w-header"><button class="w-logo" data-action="w-go" data-p="home">${esc(m.name.toUpperCase())}</button>
          <nav class="w-nav">${nav.map(([k, l]) => `<button class="${pg.p === k ? 'on' : ''}" data-action="w-go" data-p="${k}">${l}</button>`).join('')}</nav>
          <form data-form="w-search" class="w-search" role="search"><input id="w-q" type="search" placeholder="Search" aria-label="Search the shop" value="${esc(site.q)}"></form>
          <button class="w-bag" data-action="w-go" data-p="cart" aria-label="Bag, ${n} items">Bag <span>${n}</span></button></header>`}
        <main class="w-main">${site.flash ? `<p class="w-flash" role="status">${esc(site.flash)} <button class="w-link" data-action="w-go" data-p="cart">View bag</button></p>` : ''}${sitePage()}</main>
        <footer class="w-footer"><div><p class="w-logo-f">${esc(m.name.toUpperCase())}</p><p class="w-muted">${esc(m.city)} · since day ${m.day}</p></div>
          <div><p class="w-label">Shop</p><button class="w-link" data-action="w-go" data-p="shop">All fragrances</button><button class="w-link" data-action="w-go" data-p="journal">Journal</button></div>
          <div><p class="w-label">Help</p><button class="w-link" data-action="w-go" data-p="orders">Your orders</button><button class="w-link" data-action="w-go" data-p="contact">Contact</button><button class="w-link" data-action="w-go" data-p="story">Our story</button></div>
          <p class="w-muted w-copy">© ${m.name} · www.${esc(w.domain)}.com</p></footer>
      </div></div>`;
  }

  function renderSiteAdmin() {
    const w = W(), m = M(), cs = liveCreations();
    const days = w.days.concat([{ day: S.day, v: Math.round(w.today.v), o: w.today.o, r: Math.round(w.today.r), live: true }]).slice(-14);
    const max = Math.max(1, ...days.map((d) => d.r));
    const tot = w.days.reduce((a, d) => a + d.r, 0) + w.today.r, ords = w.days.reduce((a, d) => a + d.o, 0) + w.today.o, vis = w.days.reduce((a, d) => a + d.v, 0) + w.today.v;
    const ads = w.ads.filter((a) => a.until >= S.day);
    return `<div class="site-admin">
      <div class="kpis"><div><span class="muted">Visitors today</span><b>${Math.round(w.today.v).toLocaleString('en-US')}</b><small>~${Math.round(webVisitors()).toLocaleString('en-US')} a day</small></div><div><span class="muted">Orders today</span><b>${w.today.o}</b><small>${(webConversion() * 100).toFixed(1)}% conversion</small></div><div><span class="muted">Online revenue</span><b>${short(tot)}</b><small>${ords.toLocaleString('en-US')} orders · ${Math.round(vis).toLocaleString('en-US')} visits</small></div><div><span class="muted">Subscribers</span><b>${w.subs.toLocaleString('en-US')}</b><small>newsletter list</small></div></div>
      <div class="admin-grid">
        <article class="panel"><p class="eyebrow">Online revenue · last ${days.length} days</p>
          <div class="rev-chart" role="img" aria-label="Online revenue per day">${days.map((d) => `<div class="rev-bar ${d.live ? 'live' : ''}" tabindex="0"><i style="height:${Math.max(2, (d.r / max) * 100)}%"></i><span class="rev-tip">Day ${d.day}${d.live ? ' (so far)' : ''}<br>${money(d.r)} · ${d.o} orders · ${d.v} visits</span><em>${d.day}</em></div>`).join('')}</div>
          <p class="hint">Hover a bar for the day’s numbers. Orders come in every shift while you play.</p></article>
        <article class="panel"><p class="eyebrow">Recent orders</p><div class="orders"><table><thead><tr><th>#</th><th>Customer</th><th>Items</th><th>Code</th><th>Total</th><th>Status</th></tr></thead><tbody>${w.orders.slice(0, 12).map((o) => `<tr class="${o.test ? 'test' : ''}"><td>${o.n}</td><td>${esc(o.who)}<small>${esc(o.city)}</small></td><td>${o.items.map((x) => `${x.q}× ${esc(x.name)}`).join(', ')}</td><td>${esc(o.code || '—')}</td><td>${money(o.total)}</td><td>${o.test ? 'TEST' : o.mine ? orderStatus(o).label + ' · you' : S.day - o.day >= 3 ? 'Delivered' : S.day - o.day >= 1 ? 'Shipped' : 'Processing'}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">No orders yet. Work a shift and they’ll start coming in.</td></tr>'}</tbody></table></div></article>
        <article class="panel"><p class="eyebrow">Inbox</p><ul class="inbox">${w.inbox.map((x, i) => `<li class="${x.done ? 'done' : ''}"><p><b>${esc(x.subject)}</b> <small class="muted">${esc(x.from)} · day ${x.day}</small></p><p class="muted small">${esc(x.body)}</p>${x.done ? `<p class="small good">${esc(x.done)}</p>` : `<div class="row-actions">${x.kind === 'collab' ? `<button class="btn btn-small btn-primary" data-action="ws-mail" data-i="${i}" data-r="collab" ${S.cash < 2000 ? 'disabled' : ''}>Sponsor it · $2,000</button>` : ''}${x.kind === 'issue' ? `<button class="btn btn-small btn-primary" data-action="ws-mail" data-i="${i}" data-r="replace">Send a replacement · $${Math.round(cs[0] ? unitCost(cs[0]) : 40)}</button>` : ''}<button class="btn btn-small" data-action="ws-mail" data-i="${i}" data-r="reply">Reply</button><button class="btn btn-small btn-ghost" data-action="ws-mail" data-i="${i}" data-r="archive">Archive</button></div>`}</li>`).join('') || '<li class="muted">No messages. Customers write in as your site gets busier.</li>'}</ul></article>
        <article class="panel"><p class="eyebrow">Discount codes</p>
          <form data-form="ws-code" class="row-actions code-form"><input id="ws-code" maxlength="14" placeholder="CODE" aria-label="Code"><select id="ws-pct" aria-label="Discount">${[5, 10, 15, 20, 25, 30, 40, 50].map((p) => `<option value="${p}" ${p === 10 ? 'selected' : ''}>${p}% off</option>`).join('')}</select><button class="btn">Create</button></form>
          <ul class="courses">${w.codes.map((k, i) => `<li><div><b class="mono">${esc(k.code)}</b><small>${k.pct}% off · used ${k.uses} times</small></div><div class="row-actions"><button class="btn btn-small" data-action="ws-code-toggle" data-i="${i}">${k.active ? 'Pause' : 'Resume'}</button><button class="btn btn-small btn-ghost" data-action="ws-code-del" data-i="${i}">Delete</button></div></li>`).join('') || '<li class="muted">Active codes lift conversion; about a third of orders use one.</li>'}</ul></article>
        <article class="panel"><p class="eyebrow">Growth</p><ul class="courses">
          <li><div><b>SEO · level ${w.seo}</b><small>+35% visitors per level</small></div>${w.seo >= 5 ? '<span class="owned-tag">Maxed</span>' : `<button class="btn" data-action="ws-seo" ${S.cash < SEO_COST[w.seo] ? 'disabled' : ''}>Improve · ${short(SEO_COST[w.seo])}</button>`}</li>
          <li><div><b>Search ads</b><small>Visitors ×1.6 for 5 days${ads.length ? ' · running until day ' + Math.max(...ads.map((a) => a.until)) : ''}</small></div><button class="btn" data-action="ws-ads" ${S.cash < 6000 ? 'disabled' : ''}>Run · $6,000</button></li>
          <li><div><b>Free shipping</b><small>+25% conversion; costs you $6 an order</small></div><button class="btn ${w.freeShip ? 'on' : ''}" data-action="ws-ship">${w.freeShip ? 'On' : 'Off'}</button></li>
        </ul><p class="hint">Hosting ${money(HOSTING)} a day.</p></article>
        <article class="panel"><p class="eyebrow">Journal</p>
          <form data-form="ws-post" class="studio-ctrls"><label class="field"><span>Title</span><input id="ws-ptitle" maxlength="80" value="${esc(site.ptitle || '')}"></label><label class="field"><span>Story</span><textarea id="ws-pbody" rows="5" maxlength="2000">${esc(site.pbody || '')}</textarea></label>
          <div class="row-actions"><button class="btn btn-primary">Publish post</button>${aiSample ? `<button type="button" class="btn" data-action="ws-ai" data-k="post" ${site.aiBusy ? 'disabled' : ''}>${site.aiBusy === 'post' ? 'Writing…' : 'Write it with AI'}</button>` : ''}</div></form>
          <p class="hint">${site.aiMsg ? esc(site.aiMsg) : 'Each post lifts visitors 15% for five days.'} ${w.posts.length} published.</p></article>
        <article class="panel"><p class="eyebrow">Site settings</p><form data-form="ws-settings" class="studio-ctrls">
          <label class="field"><span>Look</span><select id="ws-tpl">${opt(TEMPLATES, w.template)}</select></label>
          <label class="field"><span>Payments</span><select id="ws-pay"><option value="live" ${w.payMode !== 'test' ? 'selected' : ''}>Live: orders charge your account and ship</option><option value="test" ${w.payMode === 'test' ? 'selected' : ''}>Test mode: nothing is charged or shipped</option></select></label>
          <label class="field"><span>Homepage headline</span><input id="ws-head" maxlength="60" value="${esc(w.headline)}" placeholder="${esc((cs[0] && cs[0].name) || m.name)}"></label>
          <label class="field"><span>Tagline</span><input id="ws-tag" maxlength="120" value="${esc(w.tagline)}" placeholder="Fragrances composed in ${esc(m.city)}."></label>
          <label class="field"><span>Featured fragrance</span><select id="ws-feat">${cs.map((c) => `<option value="${c.id}" ${c.id === w.featured ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></label>
          <label class="field"><span>Announcement bar</span><input id="ws-ann" maxlength="80" value="${esc(w.announce)}" placeholder="Free shipping on orders over $150"></label>
          <label class="field"><span>Our story</span><textarea id="ws-story" rows="4" maxlength="1500">${esc(w.story)}</textarea></label>
          <div class="row-actions"><button class="btn btn-primary">Save changes</button>${aiSample ? `<button type="button" class="btn" data-action="ws-ai" data-k="story" ${site.aiBusy ? 'disabled' : ''}>${site.aiBusy === 'story' ? 'Writing…' : 'Write the story with AI'}</button>` : ''}</div></form></article>
      </div></div>`;
  }

  // Product photos are rendered one per frame after the page draws, then cached.
  // Cover slides cross-fade without re-rendering the page (the product shots stay put).
  let heroT = null;
  function showSlide(i) {
    const sl = $$('.w-slide'); if (!sl.length) return;
    site.slide = (i + sl.length) % sl.length;
    sl.forEach((s, k) => { const on = k === site.slide; s.classList.toggle('on', on); s.setAttribute('aria-hidden', on ? 'false' : 'true'); s.inert = !on; });
    $$('.w-dots button').forEach((d, k) => d.classList.toggle('on', k === site.slide));
    const cv = $('.w-cover'); if (cv) cv.style.setProperty('--cover-fg', sl[site.slide].dataset.fg);
  }
  // Rotates every 6.5 s, pausing while pointed at or keyboard-focused.
  let annT = null;
  function showAnn(i) {
    const w = W(), m = M(), txt = $('#w-ann-text'); if (!w || !txt) return;
    const msgs = annMessages(w, m, w.announce || (w.freeShip ? 'Free shipping on every order' : 'Free shipping on orders over $150'));
    site.ann = (i + msgs.length) % msgs.length; txt.textContent = msgs[site.ann];
    $$('.w-ann-count button').forEach((b, k) => b.classList.toggle('on', k === site.ann));
  }
  function heroTimer() {
    clearInterval(annT); annT = null;
    if ($('#w-ann-text') && !site.annPaused && !reducedMotion()) annT = setInterval(() => { const b = $('.w-ann-bar'); if (!b || !b.isConnected) { clearInterval(annT); annT = null; return; } if (!b.matches(':hover')) showAnn(site.ann + 1); }, 5000);
    clearInterval(heroT); heroT = null;
    const cv = $('.w-cover'); if (!cv) return;
    cv.style.setProperty('--cover-fg', ($('.w-slide.on') || {}).dataset ? $('.w-slide.on').dataset.fg : '');
    if ($$('.w-slide').length < 2 || reducedMotion()) return;
    heroT = setInterval(() => { const c = $('.w-cover'); if (!c || !c.isConnected) { clearInterval(heroT); heroT = null; return; } if (c.matches(':hover') || c.querySelector(':focus-visible')) return; showSlide(site.slide + 1); }, 6500);
  }
  function fillSnaps() {
    const el = $('#site-view') || $('.site-admin'); if (!el || typeof Maison === 'undefined') return;
    const todo = $$('img[data-snap]:not([src])', el);
    const step = () => { const im = todo.shift(); if (!im || !im.isConnected) return; const it = ITEM_BY_ID[im.dataset.snap]; if (it) { const url = Maison.Snap.shot(it, im.dataset.mode); if (url) im.src = url; } if (todo.length) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  async function siteAi(kind) {
    if (!aiSample || site.aiBusy) return;
    const m = M(), w = W(), cs = liveCreations();
    const facts = `House: ${m.name}, founded in ${m.city}. Fragrances: ${cs.map((c) => `${c.name} (${FAMILIES[c.family].label}; ${c.notes.top.concat(c.notes.heart, c.notes.base).map((n) => Maison.NOTE[n].name).join(', ')})`).join('; ')}.`;
    const ask = kind === 'post'
      ? `Write a short journal post for the website of a perfume house in a fragrance-collecting game. ${facts} Previous post titles: ${w.posts.map((p) => p.title).join(' | ') || 'none'}. Pick a fresh angle (a note, an ingredient's origin, how a fragrance was made, wearing tips). Reply with only JSON: {"title": string (max 70 chars), "body": string (2-4 short paragraphs separated by \\n\\n, max 900 chars)}.`
      : `Write the "Our story" page for a perfume house in a fragrance-collecting game. ${facts} Warm, specific, under 600 characters, 2-3 short paragraphs separated by \\n\\n. Reply with only JSON: {"story": string}.`;
    site.aiBusy = kind; site.aiMsg = ''; renderAtelier();
    try {
      const out = await aiSample.json(ask, { modelTier: 'quick', cache: false });
      if (kind === 'post' && out && typeof out.title === 'string' && typeof out.body === 'string') { site.ptitle = out.title.slice(0, 80); site.pbody = out.body.slice(0, 2000); site.aiMsg = 'Draft ready. Edit it, then publish.'; }
      else if (kind === 'story' && out && typeof out.story === 'string') { w.story = out.story.slice(0, 1500); save(); site.aiMsg = 'Story written and saved.'; }
      else site.aiMsg = 'That didn’t come back as text. Try again.';
    } catch (e) {
      const code = e && e.code;
      if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(code)) aiSample = null;
      site.aiMsg = AI_ERR[code] || (code === 'not_granted' ? 'Claude isn’t enabled for this page.' : 'Something went wrong. Try again.');
    }
    site.aiBusy = null; if (ui.tab === 'atelier') renderAtelier();
  }
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function checkout() {
    if (site.paying) return;
    const f = site.form, e = {}, w = W(), live = w.payMode !== 'test';
    for (const k of ['name', 'email', 'address', 'city', 'zip', 'card', 'exp', 'cvc']) { const el = $('#w-' + k); if (el) f[k] = (el.value || '').trim(); }
    if (!f.name) e.name = 'Enter your name';
    if (!EMAIL.test(f.email || '')) e.email = 'Enter a valid email';
    if (!f.address) e.address = 'Enter your address';
    if (!f.city) e.city = 'Enter your city';
    if (!f.zip) e.zip = 'Enter your postcode';
    const t = bagTotals(), d = (f.card || '').replace(/\D/g, ''), br = cardBrand(d);
    if (site.pay === 'card') {
      if (!br || d.length !== br.len) e.card = br ? `${br.name} cards have ${br.len} digits` : 'Enter a Visa, Mastercard, Amex or Discover number';
      else if (!luhn(d)) e.card = 'That card number isn’t valid. Check for a typo';
      const mm = /^(\d{2})\/(\d{2})$/.exec(f.exp || '');
      if (!mm || +mm[1] < 1 || +mm[1] > 12) e.exp = 'Use MM/YY';
      else if (2000 + +mm[2] < 2026 || (2000 + +mm[2] === 2026 && +mm[1] < 10)) e.exp = 'This card has expired';
      const cvc = br ? br.cvc : 3;
      if (!new RegExp(`^\\d{${cvc}}$`).test(f.cvc || '')) e.cvc = `${cvc} digits`;
    } else if (live && S.cash < t.total) e.wallet = `Your wallet has ${wm(S.cash)}; this order is ${wm(t.total)}.`;
    if (live) for (const x of site.bag) {
      const c = M().creations.find((k) => k.id === x.id), want = site.bag.filter((y) => y.id === x.id).reduce((a, y) => a + y.q, 0);
      if (!c || c.stock < want) { e.stock = `Only ${c ? Math.max(0, c.stock) : 0} of ${x.name} left. Adjust your bag.`; break; }
    }
    site.err = e;
    if (Object.keys(e).length) { SFX.play('error'); renderAtelier(); const first = $('.w-field.err input, .w-checkout .w-bad'); if (first) first.scrollIntoView({ block: 'center' }); return; }
    const pay = site.pay === 'card' ? { label: `${br.name} •••• ${d.slice(-4)}`, brand: br.name, decline: d === '4000000000000002', challenge: d === '4000000000003220', funds: live && S.cash < t.total } : { label: 'Sillage wallet', brand: 'Wallet' };
    runPayment(t, pay, live);
  }
  // The payment sheet: a spinner through the bank's steps, a bank check for some cards, then approved or declined.
  function runPayment(t, pay, live) {
    const box = $('#w-pay'); if (!box) return;
    const frame = $('.browser'); if (frame && box.parentElement !== frame) frame.appendChild(box); // covers the whole browser window, not just the scrolled page
    site.paying = true; box.hidden = false; SFX.play('click');
    const amount = wm(t.total), steps = live ? ['Contacting your bank…', `Authorising ${amount}…`, 'Securing the payment…'] : ['Placing a test order…'];
    const spinner = (msg) => `<div class="w-pay-card" role="dialog" aria-modal="true" aria-label="Processing payment"><p class="w-pay-brand">${esc(pay.label)}</p><p class="w-pay-amt">${amount}</p><div class="w-spin" aria-hidden="true"></div><p class="w-pay-step" id="w-pay-step" aria-live="polite">${msg}</p><p class="w-small w-muted">Please don’t close this window.</p></div>`;
    box.innerHTML = spinner(steps[0]);
    let i = 0;
    const fail = (msg) => {
      box.innerHTML = `<div class="w-pay-card w-pay-fail" role="alertdialog" aria-modal="true" aria-label="Payment declined"><svg class="w-cross" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M18 18l16 16M34 18L18 34"/></svg><h3>Payment declined</h3><p>${esc(msg)}</p><button class="w-btn" data-action="w-pay-close">Try again</button></div>`;
      site.paying = false; SFX.play('error');
    };
    const success = () => {
      const ord = placeOrder(t, pay, live);
      box.innerHTML = `<div class="w-pay-card w-pay-ok" role="dialog" aria-modal="true" aria-label="Payment approved"><svg class="w-tick" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg><h3>${live ? 'Payment approved' : 'Test order placed'}</h3><p class="w-muted">Order #${ord.n} · ${amount}</p></div>`;
      SFX.play('coins');
      setTimeout(() => { site.paying = false; go('done', { n: ord.n }); }, 1500);
    };
    const challenge = () => {
      box.innerHTML = `<div class="w-pay-card" role="dialog" aria-modal="true" aria-label="Confirm with your bank"><p class="w-pay-brand">${esc(pay.brand)} secure check</p><h3>Confirm it’s you</h3><p class="w-muted">Your bank sent a request to your phone to approve ${amount} at ${esc(M().name)}.</p><div class="w-phone" aria-hidden="true"><span>Approve ${amount}?</span></div><div class="w-row w-pay-actions"><button class="w-btn" data-action="w-3ds" data-ok="1">Approve</button><button class="w-btn w-btn-line" data-action="w-3ds" data-ok="0">Cancel</button></div></div>`;
      site.on3ds = (ok) => { if (!ok) return fail('You cancelled the payment. Nothing was charged.'); box.innerHTML = spinner('Approved by your bank. Finishing up…'); setTimeout(success, 1100); };
      SFX.play('notify');
    };
    const next = () => {
      if (!site.paying || !box.isConnected) { site.paying = false; return; }
      if (++i < steps.length) { const el = $('#w-pay-step'); if (el) el.textContent = steps[i]; setTimeout(next, 900); return; }
      if (live && pay.challenge) return challenge();
      if (live && (pay.decline || pay.funds)) return fail(pay.funds ? `Insufficient funds. Your balance is ${wm(S.cash)}.` : 'Your bank declined this card. Try another card.');
      success();
    };
    setTimeout(next, 900);
  }
  function placeOrder(t, pay, live) {
    const f = site.form, w = W(), m = M();
    const ord = newOrder(site.bag.map((x) => ({ id: x.id, name: x.name, q: x.q, price: x.price, size: x.size + ' ml' })), { who: f.name, city: f.city, code: site.code, ship: t.ship, test: !live, mine: true });
    const auth = Math.random().toString(36).slice(2, 8).toUpperCase();
    Object.assign(ord, { email: f.email, address: f.address, zip: f.zip, method: site.ship, eta: S.day + (site.ship === 'express' ? 1 : 2), payLabel: pay.label, auth, track: 'SL' + ord.n + auth.slice(0, 4) });
    if (live) {
      // You pay as the customer, and your house books the sale.
      S.cash -= ord.total; S.stats.spent += ord.total;
      let units = 0;
      for (const x of ord.items) { const c = m.creations.find((k) => k.id === x.id); if (!c) continue; c.stock -= x.q; c.sold += x.q; c.today = (c.today || 0) + x.q; c.revenue += x.q * x.price; units += x.q; }
      S.cash += ord.total; S.stats.earned += ord.total; m.stats.sold += units; m.stats.revenue += ord.total;
      w.today.o++; w.today.r += ord.total;
    }
    if (site.code) site.code.uses++;
    w.myOrders = (w.myOrders || []).concat(ord).slice(-30);
    site.lastOrder = ord; site.bag = []; site.code = null; site.codeMsg = '';
    save(); renderHeader();
    return ord;
  }
  // Your own website orders arrive on their delivery day; new bottles go on your shelf.
  function deliverMyOrders() {
    const w = W(); if (!w || !w.myOrders) return;
    for (const o of w.myOrders) {
      if (o.test || o.delivered || S.day < o.eta) continue;
      o.delivered = S.day; let first = null; const extra = [];
      for (const x of o.items) {
        if (!ITEM_BY_ID[x.id]) continue;
        if (!S.owned[x.id]) { S.owned[x.id] = { day: S.day, paid: x.price, batch: batchCode(S.seed + x.id + S.day), from: 'website' }; first = first || ITEM_BY_ID[x.id]; }
        else { S.owned[x.id].extra = (S.owned[x.id].extra || 0) + x.q; extra.push(x.name); }
      }
      ui.showroomDirty = true;
      toast(`<b>Order #${o.n} delivered</b><span>${first ? esc(first.name) + ' is on your shelf.' : 'Extra bottles of ' + esc(extra.join(', ')) + ' added to your stash.'}</span>`, 'good');
      if (first) setTimeout(() => unbox(first), 600);
    }
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
      case 'journey': renderJourney(); break;
      case 'work': renderWork(); break;
      case 'boutique': renderBoutique(); break;
      case 'vault': renderVault(); break;
      case 'collection': renderCollection(); break;
      case 'career': renderCareer(); break;
      case 'trophies': renderTrophies(); break;
      case 'atelier': if (S.maison && !ui.atelier.draft) ui.atelier.draft = newDraft(); renderAtelier(); break;
      case 'showroom': enterShowroom(); break;
    }
  }

  /* ---------- actions ---------- */
  const actions = {
    'start-shift': startShift,
    'next-shift': startShift,
    spritz,
    answer: (el) => answer(Number(el.dataset.i)),
    'end-day': () => { cancelAnimationFrame(needleRaf); const ms = maisonTick((3 - S.shift) / 3); if (ms.units) toast(`<b>${esc(S.maison.name)}</b><span>Sold ${ms.units} bottles for ${money(ms.revenue)} today.</span>`, 'good'); newDay(); ui.work = { phase: 'idle' }; save(); SFX.play('tab'); renderHeader(); renderWork(); },
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
    'open-settings': () => { SFX.play('click'); openSettings(); },
    settings: (el) => openSettings(el.dataset.p),
    'dlg-close': () => closeDlg(false),
    'dlg-answer': (el) => closeDlg(el.dataset.v === '1'),
    'save-copy': () => {
      const t = $('#save-code'), msg = $('#save-msg'); if (!t) return;
      const done = () => { if (msg) msg.textContent = 'Copied. Keep it somewhere safe.'; };
      try { navigator.clipboard.writeText(t.value).then(done, () => { t.select(); document.execCommand('copy'); done(); }); } catch (e) { t.select(); try { document.execCommand('copy'); done(); } catch (e2) { if (msg) msg.textContent = 'Select the code and copy it by hand.'; } }
    },
    'save-download': () => {
      const msg = $('#save-msg');
      try {
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([exportCode()], { type: 'text/plain' })); a.download = `sillage-save-day-${S.day}.txt`;
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        if (msg) msg.textContent = 'Download started. If nothing appears, use Copy code instead.';
      } catch (e) { if (msg) msg.textContent = 'Downloads are blocked here. Use Copy code instead.'; }
    },
    'save-import': async () => {
      const msg = $('#save-msg'), text = ($('#save-in') || {}).value;
      let parsed; try { parsed = parseCode(text); } catch (e) { if (msg) msg.textContent = e.message; SFX.play('error'); return; }
      const d = parsed.d;
      const ok = await confirmBox({ title: 'Replace your current game?', body: `This save is on day ${d.day} with ${Object.keys(d.owned).length} bottles and ${money(d.cash)}.${parsed.fixes.length ? ` ${parsed.fixes.length} damaged value${parsed.fixes.length === 1 ? ' was' : 's were'} repaired.` : ''} Your current game is backed up first, so you can restore it from Settings.`, ok: 'Import and play' });
      if (!ok) return openSettings('import');
      backupNow(); loadState(d); toast(`<b>Save imported</b><span>Welcome back to day ${S.day}.</span>`, 'good');
    },
    'save-restore': async () => {
      const b = backupInfo(); if (!b) return;
      if (!(await confirmBox({ title: 'Restore your backup?', body: `Go back to your backup from day ${b.day} (${Object.keys(b.owned).length} bottles, ${money(b.cash)}). Anything since then is lost.`, ok: 'Restore backup', danger: true }))) return openSettings();
      loadState(b); toast(`<b>Backup restored</b><span>You’re back on day ${S.day}.</span>`, 'good');
    },
    'save-reset': async () => {
      if (!(await confirmBox({ title: 'Start a new game?', body: 'Your whole collection, career and house will be wiped. Your current game is kept as the backup, so you can still restore it from Settings until the next day ends.', ok: 'Start over', danger: true }))) return openSettings();
      backupNow(); loadState(null); setTab('journey'); setTimeout(openWelcome, 300);
    },
    'journey-pick': (el) => {
      const first = !S.ambition; S.ambition = el.dataset.id; closeDlg(true); SFX.play('unlock');
      toast(`<b>${esc(AMBITIONS[S.ambition].name)}</b><span>${esc(AMBITIONS[S.ambition].pitch)} Perk: ${esc(AMBITIONS[S.ambition].perk)}.</span>`, 'gold');
      checkProgress(); save(); if (first || ui.tab === 'journey') setTab('journey'); else renderCurrent();
    },
    'journey-pick-open': () => openDlg(`<h2 class="dlg-title">Choose your ambition</h2><p class="muted">Finished stages stay finished if you switch. Perks follow your current ambition.</p>${ambitionCards(S.ambition)}<div class="row-actions dlg-actions"><button class="btn" data-action="dlg-close">Cancel</button></div>`, 'dlg-welcome'),
    'journey-later': () => { closeDlg(false); setTab('journey'); },
    course: async (el) => {
      const c = COURSE[el.dataset.id]; if (S.cash < c.cost || S.courses[c.id]) return;
      if (c.cost >= 50000 && !(await confirmBox({ title: `Enroll in the ${esc(c.name)}?`, body: `It costs ${money(c.cost)}, leaving ${money(S.cash - c.cost)}. ${esc(c.note)}.`, ok: `Enroll · ${short(c.cost)}` }))) return;
      if (S.cash < c.cost || S.courses[c.id]) return;
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
    pal: (el) => { ui.atelier.found.pal = Number(el.dataset.i); renderAtelier(); },
    'w-go': (el) => go(el.dataset.p, el.dataset.id ? { id: el.dataset.id } : el.dataset.post != null ? { post: Number(el.dataset.post) } : el.dataset.n ? { n: Number(el.dataset.n) } : {}),
    'w-back': () => { if (site.hi > 0) { site.hi--; site.jump = true; site.scrollTop = 0; renderAtelier(); } },
    'w-fwd': () => { if (site.hi < site.hist.length - 1) { site.hi++; site.jump = true; site.scrollTop = 0; renderAtelier(); } },
    'w-reload': () => { const sv = $('#site-view'); if (sv) sv.style.opacity = '0.2'; setTimeout(() => { site.jump = true; site.scrollTop = 0; renderAtelier(); }, 220); },
    'w-add': (el) => {
      const c = M().creations.find((x) => x.id === el.dataset.id); if (!c) return;
      const onProduct = cur().p === 'product', size = onProduct ? site.size : '100', q = Number(el.dataset.q) || 1;
      const line = site.bag.find((x) => x.id === c.id && x.size === size);
      if (line) line.q = Math.min(10, line.q + q); else site.bag.push({ id: c.id, name: c.name, size, price: sizePrice(c, size), q });
      site.flash = `Added ${q} × ${c.name} (${size} ml) to your bag.`; SFX.play('clink'); renderAtelier();
    },
    'w-fam': (el) => { site.fam = el.dataset.f; if (cur().p !== 'shop' && cur().p !== 'search') go('shop'); else renderAtelier(); },
    'w-shot': (el) => { site.shot = el.dataset.m; renderAtelier(); },
    'w-size': (el) => { site.size = el.dataset.s; renderAtelier(); },
    'w-slide': (el) => { showSlide(el.dataset.i != null ? Number(el.dataset.i) : site.slide + Number(el.dataset.d)); heroTimer(); },
    'w-ann': (el) => { showAnn(el.dataset.i != null ? Number(el.dataset.i) : site.ann + Number(el.dataset.d)); heroTimer(); },
    'w-ann-pause': () => { site.annPaused = !site.annPaused; renderAtelier(); },
    'w-ann-close': () => { site.annClosed = true; renderAtelier(); },
    'w-search-toggle': () => { site.searchOpen = !site.searchOpen; renderAtelier(); if (site.searchOpen) { const q = $('#w-q'); if (q) q.focus(); } },
    'w-new': () => { site.sort = 'new'; site.fam = ''; go('shop'); },
    'w-join': () => { go('home'); requestAnimationFrame(() => { const sv = $('#site-view'), nw = $('.w-news'); if (sv && nw) { sv.scrollTo({ top: nw.offsetTop - 80, behavior: 'smooth' }); const inp = $('#w-news'); if (inp) inp.focus({ preventScroll: true }); } }); },
    'w-paytab': (el) => { for (const k of ['name', 'email', 'address', 'city', 'zip', 'card', 'exp', 'cvc']) { const f = $('#w-' + k); if (f) site.form[k] = f.value; } site.pay = el.dataset.m; site.err = {}; renderAtelier(); },
    'w-3ds': (el) => { if (site.on3ds) { const f = site.on3ds; site.on3ds = null; f(el.dataset.ok === '1'); } },
    'w-pay-close': () => { const b = $('#w-pay'); if (b) { b.hidden = true; b.innerHTML = ''; } site.paying = false; },
    'w-print': () => { document.body.classList.add('print-receipt'); try { window.print(); } catch (e) { /* printing can be blocked in a sandboxed page */ } setTimeout(() => document.body.classList.remove('print-receipt'), 500); },
    'w-rmore': () => { site.revShow += 8; renderAtelier(); },
    'w-rstar': (el) => { const s = Number(el.dataset.s); site.revStar = site.revStar === s ? 0 : s; site.revShow = 6; renderAtelier(); },
    'w-helpful': (el) => { const r = ((W().reviews[el.dataset.c]) || []).find((x) => String(x.id) === el.dataset.r); if (!r) return; r.voted = !r.voted; r.helpful = (r.helpful || 0) + (r.voted ? 1 : -1); save(); renderAtelier(); },
    'w-qty': (el) => { site.qty = Math.max(1, Math.min(10, site.qty + Number(el.dataset.d))); renderAtelier(); },
    'w-line': (el) => { const x = site.bag[Number(el.dataset.i)]; if (!x) return; x.q += Number(el.dataset.d); if (x.q <= 0) site.bag.splice(Number(el.dataset.i), 1); else x.q = Math.min(10, x.q); renderAtelier(); },
    'w-remove': (el) => { site.bag.splice(Number(el.dataset.i), 1); renderAtelier(); },
    'w-notify': () => { W().subs++; site.flash = 'We’ll email you the moment it’s back in stock.'; save(); renderAtelier(); },
    'w-jump': (el) => { const sv = $('#site-view'), t = document.getElementById(el.dataset.t), hd = $('.w-header'); if (sv && t) sv.scrollTo({ top: t.offsetTop - (hd ? hd.offsetHeight : 0) - 12, behavior: 'smooth' }); },
    'ws-mode': (el) => { site.mode = el.dataset.m; SFX.play('tab'); renderAtelier(); },
    'ws-launch': () => {
      const m = M(); if (m.site) return;
      const dom = (($('#ws-domain') || {}).value || '').toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');
      if (dom.length < 3) { toast('<b>Pick a domain</b><span>At least 3 letters or numbers.</span>', 'bad'); return; }
      if (S.cash < SITE_COST || !liveCreations().length) return;
      S.cash -= SITE_COST; S.stats.spent += SITE_COST;
      m.site = Object.assign(SITE_DEFAULT(), { domain: dom, template: ($('#ws-template') || {}).value || 'luxe', launched: S.day, featured: liveCreations()[0].id });
      site.hist = [{ p: 'home' }]; site.hi = 0; site.mode = 'visit'; site.jump = true;
      SFX.play('unlock'); toast(`<b>www.${esc(dom)}.com is live</b><span>Online orders start coming in as you play.</span>`, 'gold');
      checkProgress(); save(); renderHeader(); renderAtelier();
    },
    'ws-mail': (el) => {
      const w = W(), x = w.inbox[Number(el.dataset.i)]; if (!x || x.done) return; const r = el.dataset.r, m = M();
      if (r === 'collab') { if (S.cash < 2000) return; S.cash -= 2000; w.ads.push({ until: S.day + 2, mult: 1.8 }); m.rep = Math.min(100, m.rep + 1); x.done = 'Sponsored. Traffic is up for 3 days.'; }
      else if (r === 'replace') { const cost = Math.round(liveCreations()[0] ? unitCost(liveCreations()[0]) : 40); S.cash -= cost; m.rep = Math.min(100, m.rep + 1); x.done = 'Replacement sent. They left a glowing review.'; }
      else if (r === 'reply') { m.rep = Math.min(100, m.rep + 0.3); x.done = 'Replied.'; }
      else x.done = 'Archived.';
      SFX.play('click'); save(); renderHeader(); renderAtelier();
    },
    'ws-code-toggle': (el) => { const k = W().codes[Number(el.dataset.i)]; if (k) { k.active = !k.active; save(); renderAtelier(); } },
    'ws-code-del': (el) => { W().codes.splice(Number(el.dataset.i), 1); save(); renderAtelier(); },
    'ws-seo': () => { const w = W(); if (w.seo >= 5 || S.cash < SEO_COST[w.seo]) return; S.cash -= SEO_COST[w.seo]; S.stats.spent += SEO_COST[w.seo]; w.seo++; SFX.play('unlock'); save(); renderHeader(); renderAtelier(); },
    'ws-ads': () => { const w = W(); if (S.cash < 6000) return; S.cash -= 6000; S.stats.spent += 6000; w.ads.push({ until: S.day + 4, mult: 1.6 }); SFX.play('coins'); save(); renderHeader(); renderAtelier(); },
    'ws-ship': () => { const w = W(); w.freeShip = !w.freeShip; SFX.play('click'); save(); renderAtelier(); },
    'ws-ai': (el) => siteAi(el.dataset.k),
    'ai-design': () => aiDesign(false),
    'ai-surprise': () => aiDesign(true),
    'ai-all': () => aiDesign(false, true),
    'ai-stop': () => { if (aiCtl) aiCtl.abort(); },
    mpreset: (el) => {
      const p = Maison.PRESETS[el.dataset.id]; if (!p) return;
      const d = ui.atelier.draft;
      Object.assign(d.design, p.design); Object.assign(d.box, p.box);
      SFX.play('click'); renderAtelier();
      toast(`<b>${esc(p.label)} look</b><span>Bottle, cap, lettering and box set. Your names go on in the same letters.</span>`);
    },
    found: () => {
      const f = ui.atelier.found, name = ($('#mf-name').value || '').trim();
      if (!name) { toast('<b>Name your house</b><span>Every maison needs a name on the door.</span>', 'bad'); return; }
      if (S.cash < FOUND_COST || ownedCount() < FOUND_BOTTLES || S.maison) return;
      const [lbg, lfg] = Maison.PALETTES[f.pal];
      S.cash -= FOUND_COST; S.stats.spent += FOUND_COST;
      S.maison = { name, city: $('#mf-city').value, lbg, lfg, day: S.day, rep: 10, lab: 1, nose: 0, factory: 0, shops: 0, ads: [], creations: [], ledger: [], stats: { sold: 0, revenue: 0 } };
      ui.atelier.draft = newDraft(); ui.atelier.view = 'lab'; ui.atelier.step = 0;
      SFX.play('unlock'); toast(`<b>${esc(name)} is open</b><span>Compose your first fragrance in the lab.</span>`, 'gold');
      checkProgress(); save(); renderHeader(); renderAtelier();
    },
    mview: (el) => { ui.atelier.view = el.dataset.v; if (!ui.atelier.draft) ui.atelier.draft = newDraft(); SFX.play('tab'); renderAtelier(); },
    mstep: (el) => { const a = ui.atelier; a.step = el.dataset.s === '+' ? Math.min(3, a.step + 1) : el.dataset.s === '-' ? Math.max(0, a.step - 1) : Number(el.dataset.s); SFX.play('click'); renderAtelier(); },
    mreset: () => { ui.atelier.draft = newDraft(); ui.atelier.step = 0; renderAtelier(); },
    note: (el) => {
      const sel = ui.atelier.draft.sel, l = el.dataset.l, id = el.dataset.id, list = sel[l];
      const total = sel.top.length + sel.heart.length + sel.base.length;
      if (list.includes(id)) list.splice(list.indexOf(id), 1);
      else if (total >= maxNotes()) { toast(`<b>Your lab holds ${maxNotes()} notes</b><span>Upgrade the laboratory in Business for more.</span>`, 'bad'); return; }
      else list.push(id);
      ui.atelier.draft.price = 0; SFX.play('clink'); renderAtelier();
    },
    mlaunch: launchDraft,
    mprice: (el) => { const c = M().creations[Number(el.dataset.i)]; c.price = el.dataset.d === 'fair' ? fairPrice(c) : Math.max(5, Math.round(c.price * (1 + Number(el.dataset.d)))); SFX.play('click'); save(); renderAtelier(); },
    mproduce: (el) => { const c = M().creations[Number(el.dataset.i)], q = Number(el.dataset.q), cost = Math.round(q * unitCost(c)); if (S.cash < cost || c.limited) return; S.cash -= cost; S.stats.spent += cost; c.stock += q; SFX.play('buy'); toast(`<b>${q.toLocaleString('en-US')} bottles of ${esc(c.name)}</b><span>Off the line for ${money(cost)}.</span>`, 'good'); save(); renderHeader(); renderAtelier(); },
    mlab: () => { const m = M(), cost = LAB_COST[m.lab + 1]; if (m.lab >= 5 || S.cash < cost) return; S.cash -= cost; m.lab++; SFX.play('unlock'); save(); renderHeader(); renderAtelier(); },
    mnose: () => { const m = M(); if (m.nose >= 2) return; const n = NOSES[m.nose + 1]; if (S.cash < n.cost) return; S.cash -= n.cost; m.nose++; SFX.play('unlock'); toast(`<b>Hired: ${esc(n.name)}</b><span>+${n.bonus} harmony on new formulas.</span>`, 'good'); save(); renderHeader(); renderAtelier(); },
    mfactory: () => { const m = M(), cost = factoryCost(m.factory); if (m.factory >= 5 || S.cash < cost) return; S.cash -= cost; m.factory++; SFX.play('unlock'); save(); renderHeader(); renderAtelier(); },
    mshop: () => { const m = M(), cost = shopCost(m.shops); if (m.shops >= 6 || S.cash < cost) return; S.cash -= cost; toast(`<b>Opened: ${esc(SHOP_NAMES[m.shops])}</b><span>More customers through the door every day.</span>`, 'gold'); m.shops++; SFX.play('unlock'); save(); renderHeader(); renderAtelier(); },
    mad: (el) => { const m = M(), x = ADS.find((a) => a.id === el.dataset.id); if (S.cash < x.cost) return; S.cash -= x.cost; S.stats.spent += x.cost; m.ads.push({ id: x.id, name: x.name, mult: x.mult, until: S.day + x.days - 1 }); m.rep = Math.min(100, m.rep + 1); SFX.play('coins'); save(); renderHeader(); renderAtelier(); },
    mcomm: (el) => {
      const m = M(), q = m.comms.list[Number(el.dataset.i)]; if (q.done) return;
      const c = m.creations.find((x) => x.family === q.family && x.harmony >= q.min && x.stock >= q.qty); if (!c) return;
      const pay = q.qty * q.ppb; c.stock -= q.qty; c.sold += q.qty; c.revenue += pay; S.cash += pay; S.stats.earned += pay; m.stats.sold += q.qty; m.stats.revenue += pay; m.rep = Math.min(100, m.rep + 2); q.done = true;
      SFX.play('coins'); toast(`<b>Commission delivered</b><span>${esc(q.who)} paid ${money(pay)} for ${q.qty} bottles of ${esc(c.name)}.</span>`, 'gold');
      checkProgress(); save(); renderHeader(); renderAtelier();
    },
    wish: (el) => { const l = L(), id = el.dataset.id; l.wish = wished(id) ? l.wish.filter((x) => x !== id) : l.wish.concat(id); SFX.play('click'); save(); renderCurrent(); },
    'drop-buy': () => {
      const d = activeDrop(); if (!d || !allowanceLeft()) return; const it = ITEM_BY_ID[d.id], up = owns(d.id), price = up ? Math.max(0, d.price - sellPrice(it)) : d.price;
      if (S.cash < price) return;
      S.cash -= price; S.stats.spent += price; const l = L(); if (l.buys.day !== S.day) l.buys = { day: S.day, n: 0 }; l.buys.n++;
      const prev = S.owned[d.id];
      S.owned[d.id] = { day: S.day, paid: price, batch: batchCode(S.seed + d.id + 'ED'), from: 'limited drop', edition: { no: d.no, of: d.of, day: S.day }, extra: prev ? (prev.extra || 0) + 1 : 0 };
      d.gone = true; l.wish = l.wish.filter((x) => x !== d.id); ui.showroomDirty = true; SFX.play('buy');
      news('you', `You secured No. ${d.no} of ${d.of}: the numbered edition of ${itemName(it)}.`, 'collection');
      if (!unbox(it)) toast(`<b>No. ${d.no} of ${d.of}</b><span>${esc(itemName(it))} is on your shelf.</span>`, 'gold');
      checkProgress(); save(); renderHeader(); renderCurrent();
    },
    'offer-accept': async (el) => {
      const l = L(), o = l.offers.find((x) => x.id === el.dataset.id); if (!o) return; const it = ITEM_BY_ID[o.item], st = R(o.rival);
      if (o.kind === 'buy') {
        if (!owns(o.item)) return;
        if (!(await confirmBox({ title: `Sell ${esc(it.name)} to ${esc(o.rival)}?`, body: `They pay ${money(o.price)}, ${Math.round((o.price / value(it) - 1) * 100)}% over today’s value.${S.signature === o.item ? ' It’s your signature scent.' : ''}`, ok: `Sell for ${money(o.price)}` }))) return;
        delete S.owned[o.item]; if (S.signature === o.item) S.signature = null; S.cash += o.price; S.stats.sold++; rivalAcquire(o.rival, o.item, true); ui.showroomDirty = true;
        news('rival', `You sold ${itemName(it)} to ${o.rival} for ${money(o.price)}.`, 'vault');
      } else {
        if (S.cash < o.price) return;
        S.cash -= o.price; S.stats.spent += o.price; st.owned = st.owned.filter((x) => x.id !== o.item);
        S.owned[o.item] = { day: S.day, paid: o.price, batch: batchCode(S.seed + o.item + o.rival), from: 'private sale, ' + o.rival }; ui.showroomDirty = true;
        news('rival', `You bought ${itemName(it)} from ${o.rival}'s collection for ${money(o.price)}.`, 'collection');
        l.wish = l.wish.filter((x) => x !== o.item);
      }
      st.grudge = Math.max(0, st.grudge - 1); l.offers = l.offers.filter((x) => x !== o); SFX.play('coins');
      checkProgress(); save(); renderHeader(); renderCurrent();
    },
    'offer-decline': (el) => { const l = L(); l.offers = l.offers.filter((x) => x.id !== el.dataset.id); SFX.play('click'); save(); renderCurrent(); },
    'retail-accept': () => {
      const l = L(), r = l.retail, m = S.maison; if (!r || !m) return;
      let total = 0, units = 0;
      for (const x of r.items) { const c = m.creations.find((k) => k.id === x.id); if (!c) continue; const q = Math.min(x.q, c.stock), amt = q * Math.round(c.price * 0.55); c.stock -= q; c.sold += q; c.today = (c.today || 0) + q; c.revenue += amt; total += amt; units += q; }
      S.cash += total; S.stats.earned += total; m.stats.sold += units; m.stats.revenue += total; flow().house += total; m.rep = Math.min(100, m.rep + 2);
      news('house', `${r.who} now stocks your range: ${units} bottles sold wholesale for ${money(total)}.`, 'atelier'); l.retail = null; SFX.play('coins');
      checkProgress(); save(); renderHeader(); renderCurrent();
    },
    'retail-decline': () => { const l = L(); news('house', `You turned down ${l.retail.who}. Your range stays exclusive.`, 'atelier'); l.retail = null; save(); renderCurrent(); },
    'want-sell': (el) => {
      const w = S.market.wants[Number(el.dataset.i)]; if (!w || w.done || !owns(w.id)) return;
      const it = ITEM_BY_ID[w.id], offer = Math.round(value(it) * w.mult);
      delete S.owned[w.id]; if (S.signature === w.id) S.signature = null;
      S.cash += offer; S.stats.sold++; w.done = true; ui.showroomDirty = true;
      SFX.play('sell'); toast(`<b>Sold to ${esc(w.who)}</b><span>${esc(it.name)} went for ${money(offer)}.</span>`, 'good');
      save(); renderHeader(); renderVault();
    },
    mystery: (el) => {
      const b = MYSTERY.find((x) => x.id === el.dataset.id), pool = mysteryPool(b);
      if (!pool.length || S.cash < b.price) return;
      buy(pick(pool).id, b.price, 'mystery box');
    },
    'reset-game': () => actions['save-reset'](),
  };

  document.addEventListener('click', (e) => {
    SFX.unlock();
    const tabEl = e.target.closest('[data-tab]');
    if (tabEl) { e.preventDefault(); SFX.play('tab'); setTab(tabEl.dataset.tab); return; }
    const el = e.target.closest('[data-action]');
    if (el && !el.disabled && actions[el.dataset.action]) { e.preventDefault(); actions[el.dataset.action](el); }
  });
  // Atelier form fields: colours refresh only the 3D preview so the picker keeps focus.
  const FIELD = { shape: ['design', 'shape'], glass: ['design', 'glass'], color: ['design', 'color'], juice: ['design', 'juice'], cap: ['design', 'cap'], capFin: ['design', 'capFin'], label: ['design', 'label'], ink: ['design', 'ink'], decor: ['design', 'decor'], pfin: ['design', 'pfin'], extra: ['design', 'extra'], boxStyle: ['box', 'style'], paper: ['box', 'paper'], boxInk: ['box', 'ink'], pattern: ['box', 'pattern'], emblem: ['box', 'emblem'], foil: ['box', 'foil'] };
  document.addEventListener('input', (e) => {
    const t = e.target; if (!t.closest || !t.closest('#tab-atelier')) return;
    const d = ui.atelier.draft;
    if (t.id === 'mf-name') { ui.atelier.found.name = t.value; const p = $('.fp-name'); if (p) p.textContent = (t.value || 'Your house').toUpperCase(); return; }
    if (t.id === 'mf-city') { ui.atelier.found.city = t.value; return; }
    if (!d) return;
    // Editing a field clears its error straight away.
    if (t.id && t.id.startsWith('w-') && site.err && site.err[t.id.slice(2)]) { delete site.err[t.id.slice(2)]; const fl = t.closest('.w-field'); if (fl) { fl.classList.remove('err'); const sm = fl.querySelector('small'); if (sm) sm.remove(); } }
    if (t.id === 'w-card') { const v = t.value.replace(/\D/g, '').slice(0, 16); t.value = v.replace(/(.{4})(?=.)/g, '$1 '); site.form.card = t.value; const br = cardBrand(v), b = $('#w-brand'); if (b) b.textContent = br ? br.name : ''; return; }
    if (t.name === 'w-ship') { for (const k of ['name', 'email', 'address', 'city', 'zip', 'card', 'exp', 'cvc']) { const el = $('#w-' + k); if (el) site.form[k] = el.value; } site.ship = t.value; renderAtelier(); return; }
    if (t.id === 'w-exp') { const v = t.value.replace(/\D/g, '').slice(0, 4); t.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v; return; }
    if (t.id === 'w-cvc') { t.value = t.value.replace(/\D/g, '').slice(0, 4); return; }
    if (t.id === 'w-sort') { site.sort = t.value; renderAtelier(); return; }
    if (t.id === 'w-region') { site.cur = t.value; renderAtelier(); return; }
    if (t.id === 'w-rsort') { site.revSort = t.value; site.revShow = 6; renderAtelier(); return; }
    if (t.id === 'ws-domain') { site.domain = t.value; return; }
    if (t.id === 'ws-template') { site.template = t.value; return; }
    if (t.id === 'ws-ptitle') { site.ptitle = t.value; return; }
    if (t.id === 'ws-pbody') { site.pbody = t.value; return; }
    if (t.id === 'w-news') { site.newsletter = t.value; return; }
    if (t.id && t.id.startsWith('w-')) { if (site.form) site.form[t.id.slice(2)] = t.value; return; }
    if (t.id === 'ai-prompt') { ui.atelier.aiText = t.value; return; }
    if (t.id === 'ml-name') { d.name = t.value; return; }
    if (t.id === 'ml-price') { d.price = Number(t.value) || 0; return; }
    const f = t.dataset.field; if (!f) return;
    if (f === 'limited') { d.limited = t.checked; d.price = 0; renderAtelier(); return; }
    if (f === 'conc' || f === 'qty') { d[f] = f === 'qty' ? Number(t.value) : t.value; if (f === 'conc') d.price = 0; renderAtelier(); return; }
    const [grp, k] = FIELD[f]; d[grp][k] = f === 'foil' ? t.value === 'foil' : t.value;
    if (t.type === 'color') showDraft(); else renderAtelier();
  });
  // Settings switches and the import file picker live in the dialog layer.
  document.addEventListener('change', (e) => {
    const t = e.target; if (!t.closest || !t.closest('#dlg')) return;
    if (t.dataset.setting) {
      const k = t.dataset.setting; S.settings[k] = t.checked;
      if (k === 'sfx') SFX.setSfx(t.checked);
      if (k === 'music') { SFX.setMusic(t.checked); if (t.checked && ui.tab === 'showroom') SFX.startMusic(); }
      applyAccess(); heroTimer(); save(); renderHeader(); return;
    }
    if (t.id === 'save-file' && t.files && t.files[0]) t.files[0].text().then((txt) => { const box = $('#save-in'); if (box) box.value = txt.trim(); const msg = $('#save-msg'); if (msg) msg.textContent = 'File loaded. Press Check and import.'; });
  });
  document.addEventListener('change', (e) => { if (e.target.id === 'ml-name' || e.target.id === 'ml-price') renderAtelier(); });

  // Website and dashboard forms (Enter submits, like a real site).
  const FORMS = {
    'w-search': () => { site.q = ($('#w-q').value || '').trim(); if (site.q) go('search'); },
    'w-news': () => { const v = ($('#w-news').value || '').trim(); if (!EMAIL.test(v)) { site.newsMsg = 'Please enter a valid email.'; renderAtelier(); return; } W().subs++; site.newsletter = ''; site.newsMsg = 'You’re on the list. Welcome.'; SFX.play('good'); save(); renderAtelier(); },
    'w-code': () => { const v = ($('#w-code').value || '').trim().toUpperCase(); const k = W().codes.find((x) => x.active && x.code === v); site.code = k || null; site.codeMsg = k ? `${k.code}: ${k.pct}% off applied.` : v ? 'That code isn’t valid.' : ''; SFX.play(k ? 'good' : 'error'); renderAtelier(); },
    'w-checkout': checkout,
    'w-contact': () => {
      const n = $('#w-cname').value.trim(), em = $('#w-cmail').value.trim(), msg = $('#w-cmsg').value.trim(), e = {};
      if (!n) e.cname = 'Enter your name'; if (!EMAIL.test(em)) e.cmail = 'Enter a valid email'; if (msg.length < 5) e.cmsg = 'Write a short message';
      site.err = e; if (Object.keys(e).length) { renderAtelier(); return; }
      W().inbox.unshift({ id: 'me-' + Date.now(), day: S.day, from: n + ' · ' + em, subject: 'Website contact form', body: msg, kind: 'q', done: false });
      site.msg = 'Thanks, your message was sent. It’s waiting in your dashboard inbox.'; SFX.play('good'); save(); renderAtelier();
    },
    'ws-code': () => {
      const w = W(), v = ($('#ws-code').value || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), pct = Number($('#ws-pct').value);
      if (v.length < 3) { toast('<b>Code too short</b><span>Use 3 to 14 letters or numbers.</span>', 'bad'); return; }
      if (w.codes.some((k) => k.code === v)) { toast('<b>Code exists</b><span>Pick another name.</span>', 'bad'); return; }
      w.codes.push({ code: v, pct, active: true, uses: 0 }); SFX.play('good'); save(); renderAtelier();
    },
    'ws-post': () => {
      const t = ($('#ws-ptitle').value || '').trim(), b = ($('#ws-pbody').value || '').trim();
      if (!t || b.length < 20) { toast('<b>Almost there</b><span>A post needs a title and a few sentences.</span>', 'bad'); return; }
      const w = W(); w.posts.push({ day: S.day, title: t.slice(0, 80), body: b.slice(0, 2000) }); M().rep = Math.min(100, M().rep + 0.5);
      site.ptitle = ''; site.pbody = ''; site.aiMsg = ''; SFX.play('unlock'); toast('<b>Post published</b><span>Visitors up 15% for five days.</span>', 'good'); save(); renderAtelier();
    },
    'ws-settings': () => {
      const w = W(); w.template = $('#ws-tpl').value; w.payMode = ($('#ws-pay') || {}).value || w.payMode; w.headline = $('#ws-head').value.trim(); w.tagline = $('#ws-tag').value.trim(); w.featured = $('#ws-feat').value || w.featured; w.announce = $('#ws-ann').value.trim(); w.story = $('#ws-story').value.trim();
      SFX.play('good'); toast('<b>Site updated</b><span>Changes are live on your website.</span>', 'good'); save(); renderAtelier();
    },
  };
  document.addEventListener('submit', (e) => { const f = e.target.closest && e.target.closest('form[data-form]'); if (!f || !FORMS[f.dataset.form]) return; e.preventDefault(); FORMS[f.dataset.form](); });

  document.addEventListener('keydown', (e) => {
    if (!$('#dlg').hidden) {
      if (e.key === 'Escape') closeDlg(false);
      if (e.key === 'Tab') { // keep focus inside the dialog
        const f = $$('#dlg button:not([disabled]), #dlg input, #dlg textarea, #dlg select'); if (!f.length) return;
        const i = f.indexOf(document.activeElement), n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1);
        e.preventDefault(); f[n].focus();
      }
      return;
    }
    if (typeof Unbox !== 'undefined' && Unbox.busy) {
      if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); Unbox.open(); }
      if (e.key === 'Escape') Unbox.skip();
      return;
    }
    if (e.code === 'Space' && ui.tab === 'work' && ui.work.phase === 'timing' && !e.target.closest('input,select,textarea')) { e.preventDefault(); spritz(); }
    if (e.key === 'Escape' && !$('#dlg').hidden) { closeDlg(false); return; }
    if (e.key === 'Escape' && !$('#modal').hidden) closeModal();
  });

  /* ---------- passive income + boot ---------- */
  function passiveTick() {
    if (S.desk > 0) {
      const amt = deskRate(); S.cash += amt; S.stats.earned += amt; flow().desk += amt;
      renderHeader();
      if (ui.tab === 'boutique' || ui.tab === 'vault') {
        // Re-enable buy buttons the player can now afford without re-rendering the grid.
        $$('[data-action="buy"],[data-action="vault-buy"]').forEach((b) => { const it = ITEM_BY_ID[b.dataset.id]; const p = b.dataset.action === 'buy' ? shopPrice(it) : vaultPrice(it); b.disabled = S.cash < p; b.title = S.cash < p ? `You need ${money(p - S.cash)} more` : ''; });
      }
    }
    save();
  }

  function start(hotData) {
    // The AI designer lights up only where the page may ask Claude.
    if (window.claude && typeof window.claude.use === 'function') {
      window.claude.use('sample').then((fn) => { aiSample = fn || null; if (aiSample && ui.tab === 'atelier') renderAtelier(); }).catch(() => {});
    }
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
    applyAccess(); flow(); liveDaily(); checkProgress();
    if (ui.notice) setTimeout(() => toast(`<b>Save recovered</b><span>${esc(ui.notice)}</span>`, 'bad'), 700);
    if (!saved) setTimeout(openWelcome, 500);
    save(); // writes back a repaired or recovered save straight away
    if (saved && !ui.notice) backupNow();
    $('#catalog-count').textContent = `${CATALOG.length} real fragrances from ${HOUSES.length} houses`;
    initBoutiqueControls();
    $('#c-sort').addEventListener('input', (e) => { ui.coll.sort = e.target.value; renderCollection(); });
    const tab = (location.hash || '').slice(1);
    setTab(TABS.includes(tab) ? tab : saved ? 'work' : 'journey', false);
    setInterval(passiveTick, 5000);
    window.addEventListener('beforeunload', save);
    if (window.claude && window.claude.hot && window.claude.hot.snapshot) window.claude.hot.snapshot(() => S);
  }

  const hot = window.claude && window.claude.hot;
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
})();
