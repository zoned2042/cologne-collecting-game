#!/usr/bin/env node
/* Sillage regression check. Plays the built single file (sillage.html) in a headless browser and
 * verifies that money, bottles, stock, orders, deliveries and saves stay consistent.
 *
 *   python3 tools/build_single.py && node tools/regression.js
 *
 * Needs Playwright (npm i -D playwright, or set PLAYWRIGHT_PATH to an install).
 */
const path = require('path');
const fs = require('fs');
const vm = require('vm');
let chromium;
try { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')); } catch (e) { ({ chromium } = require('/opt/node-tools/node_modules/playwright')); }

const FILE = 'file://' + path.join(__dirname, '..', 'sillage.html');
const KEY = 'sillage-save-v1';
const cat = {}; vm.createContext(cat); vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'catalog.js'), 'utf8').replace(/^const /gm, 'var '), cat);
let failures = 0;
const check = (ok, msg) => { console.log(`${ok ? '  ok  ' : '  FAIL'} ${msg}`); if (!ok) failures++; };

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const fresh = async (save, backup) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
    if (save) await ctx.addInitScript(([k, s, b]) => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem(k, s); if (b) localStorage.setItem(k + '-backup', b); } }, [KEY, typeof save === 'string' ? save : JSON.stringify(save), backup ? JSON.stringify(backup) : null]);
    const p = await ctx.newPage(); p.errors = [];
    p.on('pageerror', (e) => p.errors.push(e.message));
    await p.goto(FILE); await p.waitForTimeout(900);
    return p;
  };
  const state = (p) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
  const shift = async (p) => {
    await p.click('[data-action=start-shift],[data-action=next-shift]'); await p.waitForTimeout(250);
    const sp = await p.$('#btn-spritz'); if (sp) await sp.click(); else { const o = await p.$('[data-action=answer]'); if (o) await o.click(); }
    await p.waitForTimeout(250);
  };

  console.log('New game, ambition and Journey');
  let p = await fresh(null);
  check(await p.isVisible('#dlg .dlg-welcome'), 'welcome dialog opens on a new game');
  await p.click('#dlg [data-action=journey-pick][data-id=collector]'); await p.waitForTimeout(300);
  let s = await state(p);
  check(s.ambition === 'collector' && s.v === 2, 'ambition saved with save version 2');
  check(await p.isVisible('#tab-journey .stages'), 'Journey shows the ambition stages');
  check((await p.textContent('#goal')).startsWith('Next:'), 'header shows a recommended next step');

  console.log('Shifts, tax and the daily books');
  await p.click('.tabs [data-tab=work]');
  const cash0 = (await state(p)).cash;
  for (let i = 0; i < 3; i++) await shift(p);
  s = await state(p);
  check(s.cash > cash0 && s.day === 2 && s.stats.shifts === 3, `three shifts paid and rolled the day (cash ${cash0} → ${Math.round(s.cash)})`);
  check(Array.isArray(s.ledger) && s.ledger.length === 1 && s.ledger[0].day === 1, 'yesterday is in the ledger');

  console.log('Buying and selling');
  await p.click('.tabs [data-tab=boutique]'); await p.waitForTimeout(400);
  const before = await state(p);
  await p.click('#shop-grid [data-action=buy]:not([disabled])'); await p.waitForTimeout(500);
  const sk = await p.$('[data-action=unbox-skip]'); if (sk && await sk.isVisible()) { await sk.click(); await p.waitForTimeout(300); const dn = await p.$('[data-action=unbox-done]'); if (dn && await dn.isVisible()) await dn.click(); }
  s = await state(p);
  const bought = Object.keys(s.owned).find((id) => !before.owned[id]);
  check(!!bought && s.stats.spent > before.stats.spent, `bought a bottle (${bought})`);
  await p.click('.tabs [data-tab=collection]'); await p.waitForTimeout(300);
  await p.click(`[data-action=sell][data-id="${bought}"]`); await p.waitForTimeout(200);
  check(await p.isVisible('#dlg .dlg-confirm'), 'selling asks for confirmation');
  const cashBeforeSell = (await state(p)).cash;
  await p.click('#dlg [data-action=dlg-answer][data-v="1"]'); await p.waitForTimeout(300);
  s = await state(p);
  check(!s.owned[bought] && s.cash > cashBeforeSell, 'sold it and got paid');

  console.log('Settings, export and import');
  await p.click('[data-action=open-settings]'); await p.waitForTimeout(200);
  await p.check('[data-setting=big]'); await p.waitForTimeout(100);
  check(await p.evaluate(() => document.documentElement.classList.contains('big-text')), 'larger text applies');
  await p.click('[data-action=settings][data-p=export]'); await p.waitForTimeout(200);
  const code = await p.inputValue('#save-code');
  check(code.startsWith('SILLAGE1:'), 'export produces a save code');
  const exported = await state(p);
  await p.click('[data-action=settings][data-p=main]'); await p.click('[data-action=save-reset]'); await p.waitForTimeout(200);
  await p.click('#dlg [data-action=dlg-answer][data-v="1"]'); await p.waitForTimeout(700);
  s = await state(p);
  check(s.day === 1 && Object.keys(s.owned).length === 0, 'new game wipes progress');
  await p.click('#dlg [data-action=journey-later]').catch(() => {});
  await p.click('[data-action=open-settings]'); await p.click('[data-action=settings][data-p=import]');
  await p.fill('#save-in', code); await p.click('[data-action=save-import]'); await p.waitForTimeout(200);
  await p.click('#dlg [data-action=dlg-answer][data-v="1"]'); await p.waitForTimeout(600);
  s = await state(p);
  check(s.day === exported.day && Math.abs(s.cash - exported.cash) < 1 && s.ambition === 'collector', 'importing the code restores the game');
  check(p.errors.length === 0, 'no page errors' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
  await p.context().close();

  console.log('Damaged saves');
  const good = Object.assign({}, exported, { cash: 4321 });
  p = await fresh('{"cash": 12, "owned": {broken', good);
  s = await state(p);
  check(s && Math.round(s.cash) >= 4321 - 1, 'a damaged save falls back to the backup');
  check(await p.evaluate((k) => !!localStorage.getItem(k + '-damaged'), KEY), 'the damaged save is kept aside');
  await p.context().close();
  p = await fresh(Object.assign({}, good, { cash: 'lots', day: -3, desk: 99, owned: { x: 5 } }));
  s = await state(p);
  check(typeof s.cash === 'number' && isFinite(s.cash) && s.day === 1 && s.desk === 8 && !s.owned.x, 'bad values are repaired on load');
  await p.context().close();

  console.log('Living market');
  const shelf = cat.CATALOG.filter((c) => !c.disc && !c.limited && c.tier === 'designer').sort((a, b) => a.base - b.base);
  const [hyped, theirs] = [shelf[5], shelf[6]];
  const live = { rolled: 5, events: [{ id: 'evt', type: 'viral', item: hyped.id, mult: 1.5, start: 5, end: 8, text: 'Test hype' }], offers: [{ id: 'oft', rival: '@OudBaron', kind: 'sell', item: theirs.id, price: Math.round(theirs.base * 1.3), expires: 6 }], feed: [], wish: [], drops: [], buys: { day: 0, n: 0 }, rivals: {}, notes: {} };
  p = await fresh({ cash: 20000, day: 5, seed: 'live', ambition: 'collector', owned: { [hyped.id]: { day: 2, paid: 50, batch: 'A1', from: 'test' } }, live, settings: { sfx: false, music: false, unbox: false } });
  await p.click('.tabs [data-tab=collection]'); await p.waitForTimeout(300);
  await p.click(`[data-action=sell][data-id="${hyped.id}"]`); await p.waitForTimeout(200);
  const quoted = Number(((await p.textContent('#dlg .dlg-confirm')).match(/value of \$([\d,]+)/) || [])[1].replace(/,/g, ''));
  check(quoted >= hyped.base * 1.35, `a viral event lifts the bottle's value (${quoted} against a base of ${hyped.base})`);
  await p.click('#dlg [data-action=dlg-answer][data-v="0"]'); await p.waitForTimeout(200);
  await p.click('.tabs [data-tab=boutique]'); await p.waitForTimeout(400);
  const heart = await p.$('#shop-grid [data-action=wish]'); const wid = await heart.getAttribute('data-id'); await heart.click(); await p.waitForTimeout(200);
  check((await state(p)).live.wish.includes(wid), 'the heart adds a bottle to the wishlist');
  for (let i = 0; i < 5; i++) { const b = await p.$('#shop-grid [data-action=buy]:not([disabled])'); if (!b) break; await b.click(); await p.waitForTimeout(300); }
  s = await state(p);
  check(s.live.buys.n === 3 && !(await p.$('#shop-grid [data-action=buy]:not([disabled])')), `the boutique allowance stops buying after 3 bottles (${s.live.buys.n})`);
  await p.click('.tabs [data-tab=vault]'); await p.waitForTimeout(400);
  const cashBeforeOffer = s.cash;
  await p.click('[data-action=offer-accept][data-id=oft]'); await p.waitForTimeout(300);
  s = await state(p);
  check(!!s.owned[theirs.id] && Math.round(cashBeforeOffer - s.cash) === live.offers[0].price && !s.live.offers.length, 'a rival’s private offer can be accepted');
  check(s.live.feed.some((f) => /OudBaron/.test(f.text)), 'the newsfeed records the deal');
  check(p.errors.length === 0, 'no page errors' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
  await p.context().close();

  console.log('House stock, checkout and delivery');
  const creation = { id: 'mine-1-t', name: 'Test Accord', conc: 'edp', notes: { top: ['bergamot'], heart: ['lavender'], base: ['tonka'] }, family: 'aromatic', harmony: 80, oilCost: 10, accords: ['Fougère'], design: { shape: 'block', glass: 'clear', color: '#1a1a1a', juice: '#e8c27a', cap: 'cylinder', capFin: 'gold', label: 'paper', ink: '#d8b56a', decor: 'none', extra: 'none' }, box: { style: 'carton', paper: '#111111', ink: '#d8b56a', pattern: 'border', emblem: 'none', foil: false }, longevity: 9, price: 120, stock: 50, sold: 0, revenue: 0, launched: 1, today: 0, yesterday: 0, reviews: [] };
  p = await fresh({ cash: 50000, day: 3, seed: 'reg', owned: {}, ambition: 'perfumer', maison: { name: 'Maison Test', city: 'Paris', lbg: '#111111', lfg: '#d8b56a', day: 1, rep: 30, creations: [creation], site: { domain: 'maisontest', template: 'modern' } }, settings: { sfx: false, music: false, unbox: false } });
  await p.click('.tabs [data-tab=atelier]'); await p.click('[data-action=mview][data-v=site]'); await p.waitForTimeout(600);
  await p.click('.w-nav [data-p=shop]'); await p.waitForTimeout(500);
  await p.click('[data-action=w-add][data-id="mine-1-t"]'); await p.click('[data-action=w-go][data-p=cart]'); await p.waitForTimeout(300);
  await p.click('.w-summary [data-p=checkout]'); await p.waitForTimeout(400);
  for (const [k, v] of [['name', 'Reg Test'], ['email', 'reg@example.com'], ['address', '1 Test St'], ['city', 'Paris'], ['zip', '75001'], ['card', '4242424242424242'], ['exp', '1229'], ['cvc', '123']]) await p.fill('#w-' + k, v);
  const stock0 = (await state(p)).maison.creations[0].stock;
  await p.click('.w-paybtn'); await p.waitForTimeout(5000);
  s = await state(p);
  const ord = s.maison.site.myOrders[0];
  check(!!ord && s.maison.creations[0].stock === stock0 - 1, 'a paid order takes one bottle from stock');
  await p.click('.tabs [data-tab=work]');
  for (let i = 0; i < 2; i++) { await p.click('[data-action=end-day]'); await p.waitForTimeout(300); }
  s = await state(p);
  check(!!s.owned['mine-1-t'] && s.maison.site.myOrders[0].delivered, 'the order is delivered onto your shelf');
  check(p.errors.length === 0, 'no page errors' + (p.errors.length ? ': ' + p.errors.join(' | ') : ''));
  await browser.close();
  console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
})();
