#!/usr/bin/env node
/* Sillage economy simulator.
 * Plays a sensible "greedy collector" for many in-game days using the game's own job, course
 * and catalog tables, and reports when milestones arrive and where money comes from and goes.
 * It is a model, not the game: shift results, signature bonuses and house sales use averages.
 *
 *   node tools/economy_sim.js            # current rules
 *   node tools/economy_sim.js --old      # rules before the Refined update (no tax or upkeep)
 *   node tools/economy_sim.js --days 200
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const args = process.argv.slice(2);
const OLD = args.includes('--old');
const DAYS = Number((args[args.indexOf('--days') + 1]) || 160) || 160;

// Live tables from the game source.
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/catalog.js'), 'utf8').replace(/^const /gm, 'var '), ctx);
const game = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8');
const grab = (name) => { const m = new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n  \\]);`).exec(game); return vm.runInContext('(' + m[1] + ')', ctx); };
const JOBS = grab('JOBS'), COURSES = grab('COURSES');
const ECON = OLD ? null : vm.runInContext('(' + /const ECON = (\{[\s\S]*?\n  \});/.exec(game)[1] + ')', ctx);
const shopCost = (n) => Math.round(50000 * Math.pow(2.6, n)), factoryCost = (n) => Math.round(20000 * Math.pow(3, n));
const sumCosts = (fn, n) => Array.from({ length: n }, (_, i) => fn(i)).reduce((a, x) => a + x, 0);
const CATALOG = ctx.CATALOG;

// Average shift: performance x1.3, signature +20% (matching family about half the time).
const SHIFT_MULT = 1.3 * 1.2;
const tax = (pay) => (OLD ? 0 : ECON.taxBrackets.reduce((t, [from, to, rate]) => t + Math.max(0, Math.min(pay, to) - from) * rate, 0));

const S = { day: 1, cash: 250, job: 'packer', xp: {}, courses: {}, owned: new Set(), desk: 0, house: null, log: [], milestones: {} };
const book = { wages: 0, tax: 0, house: 0, upkeep: 0, bottles: 0, courses: 0, houseInvest: 0, desk: 0 };
const value = (c) => (c.limited ? c.base * (1 + 0.003 * (S.day - 1)) : c.disc ? c.base * 1.35 * (1 + 0.008 * (S.day - 1)) : c.base);
const collValue = () => [...S.owned].reduce((a, id) => a + value(ctx.ITEM_BY_ID[id]), 0);
const mark = (k) => { if (!S.milestones[k]) S.milestones[k] = S.day; };

function reqOk(j) {
  const q = j.req;
  if (q.xp && !Object.entries(q.xp).every(([k, n]) => (S.xp[k] || 0) >= n)) return false;
  if (q.anyXp && !Object.entries(q.anyXp).some(([k, n]) => (S.xp[k] || 0) >= n)) return false;
  if (q.owned && S.owned.size < q.owned) return false;
  if (q.course && !S.courses[q.course]) return false;
  return true;
}
const wage = (j) => (j.volatile ? j.wage * 1.45 : j.wage) + (j.perBottle || 0) * (OLD ? S.owned.size : Math.min(ECON.perBottleCap, S.owned.size));

function upkeep() {
  if (OLD) return 0;
  const E = ECON, n = S.owned.size;
  let u = Math.max(0, n - E.freeShelf) * E.storagePerBottle;
  for (const id of S.owned) { const c = ctx.ITEM_BY_ID[id]; u += value(c) * (c.limited ? E.insureLegendary : c.disc ? E.insureVintage : 0); }
  if (S.house) u += sumCosts(shopCost, S.house.shops) * E.shopRent + E.noseSalary[S.house.nose] + sumCosts(factoryCost, S.house.factory) * E.factoryUpkeep + 40;
  return u;
}

for (; S.day <= DAYS; S.day++) {
  // Three shifts at the best open job.
  for (let s = 0; s < 3; s++) {
    const j = JOBS.find((x) => x.id === S.job);
    const pay = wage(j) * SHIFT_MULT, t = tax(pay);
    S.cash += pay - t; book.wages += pay; book.tax += t; S.xp[j.id] = (S.xp[j.id] || 0) + 1;
    const best = [...JOBS].reverse().find(reqOk); if (best && best.wage > j.wage) { S.job = best.id; mark('job:' + best.id); }
  }
  // Your house: a launch every 12 days once founded; sales from the game's demand formula, averaged.
  if (!S.house && S.owned.size >= 10 && S.cash > 30000) { S.house = { rep: 10, shops: 0, nose: 0, factory: 0, range: 0, lastLaunch: -99 }; mark('house'); }
  if (S.house) {
    const H = S.house;
    if (S.day - H.lastLaunch >= 12 && H.range < 8 && S.cash > 40000) { const fee = Math.min(50000, 2000 + 1500 * H.range) + 6000; S.cash -= fee; book.houseInvest += fee; H.range++; H.lastLaunch = S.day; }
    const perFrag = (4 + H.rep * 1.4 + (OLD ? H.shops * 30 : ECON.shopDemand.slice(0, H.shops).reduce((x, y) => x + y, 0))) * Math.pow(80 / 70, 2) * 1.08;
    const units = perFrag * H.range * (OLD ? 1 : Math.pow(Math.max(1, H.range), -ECON.rangeCompetition)), margin = 95; // fair-priced EDP at harmony 80 sells near $150 against ~$55 cost
    const profit = units * margin * Math.pow(1 - 0.08 * H.factory, -1);
    S.cash += profit; book.house += profit; H.rep = Math.min(85, H.rep + Math.min(1, units * 0.011));
    const sc = shopCost(H.shops), facCost = factoryCost(H.factory);
    if (H.shops < 6 && S.cash > sc * 3) { S.cash -= sc; book.houseInvest += sc; H.shops++; }
    if (H.factory < 5 && S.cash > facCost * 3) { S.cash -= facCost; book.houseInvest += facCost; H.factory++; }
    if (H.nose < 2 && S.cash > [30000, 350000][H.nose] * 3) { S.cash -= [30000, 350000][H.nose]; book.houseInvest += [30000, 350000][H.nose]; H.nose++; }
  }
  // Courses toward the next job.
  for (const c of COURSES) if (!S.courses[c.id] && S.cash > c.cost * 1.15) { const needed = JOBS.some((j) => j.req.course === c.id && j.wage > JOBS.find((x) => x.id === S.job).wage); if (needed) { S.cash -= c.cost; book.courses += c.cost; S.courses[c.id] = S.day; } }
  // Decant desk (paid per real minute; assume about 1 minute of play per in-game day).
  const deskCost = S.desk === 0 ? 500 : Math.round(2000 * Math.pow(3.2, S.desk - 1));
  if (S.desk < 8 && S.owned.size >= 8 && S.cash > deskCost * 4) { S.cash -= deskCost; S.desk++; }
  const v = collValue(), deskPerMin = S.desk ? S.desk * (OLD ? 3 + Math.min(v, 400000) * 0.00025 : ECON.deskBase + Math.min(v, ECON.deskValueCap) * ECON.deskPerValue) * 12 : 0;
  S.cash += deskPerMin; book.desk += deskPerMin;
  // Upkeep.
  const u = Math.min(S.cash, upkeep()); S.cash -= u; book.upkeep += u;
  // Buy bottles: cheapest missing ones with up to 60% of cash; legendaries once cash is 3x their price.
  const missing = CATALOG.filter((c) => !S.owned.has(c.id) && !c.limited).sort((a, b) => a.base - b.base);
  let budget = S.cash * 0.6;
  for (const c of missing) { const p = value(c); if (p > budget) break; budget -= p; S.cash -= p; book.bottles += p; S.owned.add(c.id); }
  for (const c of CATALOG.filter((x) => x.limited && !S.owned.has(x.id)).sort((a, b) => a.base - b.base)) { const p = value(c); if (S.cash > p * 3) { S.cash -= p; book.bottles += p; S.owned.add(c.id); mark('legendary:' + c.name); } }
  for (const n of [10, 50, 150, 300, 538]) if (S.owned.size >= n) mark('owned ' + n);
  if (S.owned.size === CATALOG.length) mark('every bottle');
  if (S.day % 20 === 0 || S.day === DAYS) S.log.push({ day: S.day, job: S.job, cash: Math.round(S.cash), owned: S.owned.size, value: Math.round(collValue()), rep: S.house ? Math.round(S.house.rep) : '-', upkeepPerDay: Math.round(upkeep()) });
}

console.log(`Sillage economy model · ${OLD ? 'old rules (no tax or upkeep)' : 'current rules'} · ${DAYS} days\n`);
console.table(S.log);
console.log('Milestones (day reached):');
for (const [k, d] of Object.entries(S.milestones)) console.log(`  day ${String(d).padStart(3)}  ${k}`);
console.log('\nMoney in and out over the run:');
for (const [k, v] of Object.entries(book)) console.log(`  ${k.padEnd(12)} ${Math.round(v).toLocaleString('en-US').padStart(16)}`);
