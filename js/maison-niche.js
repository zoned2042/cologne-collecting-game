/* Sillage — niche bottle designs for the house designer: patterns printed right
 * round the bottle, exotic materials, sculpted caps, plaques and looks drawn from
 * ultra-niche houses (Kilian, Xerjoff, Kajal, Memo, Atelier des Ors, Mind Games...).
 * Pattern functions draw onto a strip that wraps the whole bottle: x runs once
 * round the body (front centre at 0.5), y from top to bottom. Counts across are
 * rounded so every pattern meets itself at the back seam.
 */
(() => {
  if (typeof Maison === 'undefined') return;
  const { ART, SHAPES, CAPS, GLASS, LABELS, DECOR, PRESETS, PATTERNS } = Maison;
  const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const asp = (P) => P.W / P.H;
  const cols = (P, rows, k = 1) => Math.max(1, Math.round(rows * asp(P) / k));
  const even = (n) => Math.max(2, n + (n % 2));
  const pick = (o, i) => o.pal[Math.floor(rnd(i) * o.pal.length) % o.pal.length];
  // Draw fn at x, and again one strip-width away when it hangs over either edge.
  const wrapX = (x, w, fn) => { fn(x); if (x - w < 0) fn(x + 1); if (x + w > 1) fn(x - 1); };
  const poly = (P, cx, cy, pts, color, fill = true, lw = 0.004) => P.path(pts.map(([dx, dy]) => [cx + dx / asp(P), cy + dy]), color, fill, lw);
  const star = (n, ro, ri, rot = -Math.PI / 2) => Array.from({ length: n * 2 }, (_, i) => { const a = rot + (i / (n * 2)) * Math.PI * 2, r = i % 2 ? ri : ro; return [Math.cos(a) * r, Math.sin(a) * r]; });
  const stroke = (P, c, lw) => { P.g.strokeStyle = c; P.g.lineWidth = lw * P.H; P.g.stroke(); };

  /* ---------- the original surface details, now wrapping all the way round ---------- */
  ART.stripes = (P, c) => { for (let i = 0; i < 7; i++) P.rect(0, 0.12 + i * 0.1, 1, 0.045, c); };
  ART.ribs = (P, c) => { for (let i = 0; i < 46; i++) P.line(0, i / 46, 1, i / 46, c, 0.004); };
  ART.lattice = (P, c) => { const n = cols(P, 7), a = asp(P); for (let i = -n; i <= 2 * n; i++) { P.line(i / n, 0, i / n + 1 / a, 1, c, 0.006); P.line(i / n, 0, i / n - 1 / a, 1, c, 0.006); } };
  ART.chevron = (P, c) => { const n = cols(P, 6); for (let r = 0; r < 12; r++) P.path(Array.from({ length: 2 * n + 1 }, (_, j) => [j / (2 * n), 0.04 + r * 0.085 + (j % 2) * 0.045]), c, false, 0.012); };
  ART.dots = (P, c) => { const n = cols(P, 12); for (let r = 0; r < 12; r++) for (let i = 0; i < n; i++) wrapX((i + (r % 2) * 0.5) / n, 0.02, (x) => P.circle(x, (r + 0.5) / 12, 0.012, c)); };
  ART.waves = (P, c) => { const k = Math.max(1, Math.round(asp(P) * 2)); for (let r = 0; r < 14; r++) P.path(Array.from({ length: 160 }, (_, j) => [j / 159, 0.04 + r * 0.07 + 0.015 * Math.sin(2 * Math.PI * k * j / 159 + r)]), c, false, 0.006); };
  ART.deco = (P, c) => { const n = cols(P, 4), g = P.g; for (let r = 0; r < 5; r++) for (let i = 0; i < n; i++) for (let k = 1; k < 5; k++) { g.beginPath(); g.arc(((i + 0.5) / n) * P.W, ((r + 0.7) / 4.4) * P.H, k * 0.03 * P.H, Math.PI, 0); stroke(P, c, 0.004); } };

  /* ---------- niche patterns ---------- */
  // Kilian: engraved art deco pinstripes with stepped chevrons top and bottom.
  ART.artdeco = (P, c) => {
    const n = cols(P, 2.6), a = asp(P);
    for (const y of [0.05, 0.075, 0.925, 0.95]) P.line(0, y, 1, y, c, 0.004);
    for (let i = 0; i < n; i++) {
      const cx = (i + 0.5) / n, mx = i / n;
      for (const dx of [-0.018, 0, 0.018]) P.line(cx + dx / a, 0.14, cx + dx / a, 0.86, c, 0.003);
      for (let k = 0; k < 5; k++) {
        const w = (0.1 - k * 0.016) / a;
        P.path([[mx - w, 0.11 + k * 0.03 + 0.04], [mx, 0.11 + k * 0.03], [mx + w, 0.11 + k * 0.03 + 0.04]], c, false, 0.004);
        P.path([[mx - w, 0.89 - k * 0.03 - 0.04], [mx, 0.89 - k * 0.03], [mx + w, 0.89 - k * 0.03 - 0.04]], c, false, 0.004);
      }
    }
  };
  ART.sunburst = (P, c) => {
    const a = asp(P);
    for (const ox of [0, 0.5, 1]) for (let d = -84; d <= 84; d += 6) {
      const t = (d * Math.PI) / 180, L = 1.05;
      P.line(ox, 1.03, ox + (Math.sin(t) * L) / a, 1.03 - Math.cos(t) * L, c, (d / 6) % 2 ? 0.004 : 0.011);
    }
  };
  // Kajal / Amouage: arabesque scrolls round a quatrefoil.
  ART.filigree = (P, c) => {
    const n = cols(P, 3), g = P.g, a = asp(P);
    const curl = (x, y, r, dir, rot) => { g.beginPath(); for (let k = 0; k <= 40; k++) { const t = k / 40, ang = rot + dir * t * 2.6 * Math.PI, rad = r * (1 - t * 0.85); const px = x * P.W + Math.cos(ang) * rad * P.H, py = y * P.H + Math.sin(ang) * rad * P.H; k ? g.lineTo(px, py) : g.moveTo(px, py); } stroke(P, c, 0.006); };
    for (let r = 0; r < 4; r++) for (let i = 0; i < n; i++) {
      const cx = (i + 0.5 * (r % 2)) / n, cy = (r + 0.5) / 3.3 - 0.05;
      wrapX(cx, 0.1, (x) => {
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) curl(x + (sx * 0.07) / a, cy + sy * 0.07, 0.05, sx * sy, sy > 0 ? -Math.PI / 2 : Math.PI / 2);
        for (let k = 0; k < 4; k++) P.circle(x + (Math.cos(k * Math.PI / 2) * 0.03) / a, cy + Math.sin(k * Math.PI / 2) * 0.03, 0.022, c, 0.004);
        P.circle(x, cy, 0.008, c);
        poly(P, x, cy - 0.16, [[0, -0.02], [0.012, 0], [0, 0.02], [-0.012, 0]], c);
      });
    }
  };
  // Atelier des Ors: torn gold leaf.
  ART.goldleaf = (P, c) => {
    for (let i = 0; i < 150; i++) {
      const s = 0.008 + Math.pow(rnd(i + 7), 3) * 0.06, x = rnd(i), y = rnd(i + 400);
      const pts = Array.from({ length: 7 }, (_, k) => { const ang = (k / 7) * Math.PI * 2 + rnd(i * 7 + k) * 0.7, r = s * (0.45 + rnd(i * 11 + k)); return [Math.cos(ang) * r, Math.sin(ang) * r]; });
      wrapX(x, s / asp(P), (xx) => poly(P, xx, y, pts, c));
    }
  };
  ART.marble = (P, c) => {
    const a = asp(P);
    for (let i = 0; i < Math.round(9 * asp(P)); i++) {
      let x = rnd(i), y = -0.05; const pts = [], drift = (rnd(i + 50) - 0.5) * 0.06;
      for (let k = 0; k < 26; k++) { pts.push([x, y]); x += (drift + (rnd(i * 31 + k) - 0.5) * 0.06) / a; y += 0.045; }
      P.g.globalAlpha = 0.35 + rnd(i + 90) * 0.55;
      P.path(pts, c, false, 0.002 + rnd(i + 3) * 0.006);
      P.path(pts.map(([px, py], k) => [px + (0.02 * Math.sin(k)) / a, py + 0.01]), c, false, 0.0012);
    }
    P.g.globalAlpha = 1;
  };
  ART.terrazzo = (P, c, o) => {
    for (let i = 0; i < 300; i++) {
      const s = 0.006 + rnd(i + 3) * 0.026, x = rnd(i), y = rnd(i + 900), n = 4 + Math.floor(rnd(i + 5) * 3);
      const pts = Array.from({ length: n }, (_, k) => { const ang = (k / n) * Math.PI * 2 + rnd(i * 5 + k), r = s * (0.6 + rnd(i * 9 + k) * 0.6); return [Math.cos(ang) * r, Math.sin(ang) * r]; });
      wrapX(x, s / asp(P), (xx) => poly(P, xx, y, pts, pick(o, i + 13)));
    }
  };
  // Xerjoff Murano: ribbons of coloured glass swirled through the body.
  ART.murano = (P, c, o) => {
    const k = Math.max(1, Math.round(asp(P)));
    for (let r = 0; r < 10; r++) {
      const y0 = 0.06 + r * 0.095, ph = rnd(r) * 6;
      P.g.globalAlpha = 0.55;
      P.path(Array.from({ length: 200 }, (_, j) => { const x = j / 199; return [x, y0 + 0.07 * Math.sin(2 * Math.PI * k * x + ph) + 0.025 * Math.sin(2 * Math.PI * 3 * k * x + ph * 2)]; }), pick(o, r + 2), false, 0.018 + rnd(r + 9) * 0.03);
    }
    P.g.globalAlpha = 1;
  };
  // Memo Paris: the graphic blocks of their leather sleeves.
  ART.memo = (P, c, o) => {
    const rows = 4, n = cols(P, rows), w = 1 / n, h = 1 / rows, g = P.g;
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
      const x = i * w, y = r * h, t = Math.floor(rnd(r * 31 + i) * 5), col = pick(o, r * 7 + i * 3), col2 = pick(o, r * 5 + i * 11 + 1);
      if (t === 0) P.path([[x, y], [x + w, y], [x, y + h]], col);
      if (t === 1) { g.beginPath(); g.moveTo(x * P.W, (y + h) * P.H); g.arc(x * P.W, (y + h) * P.H, Math.min(w * P.W, h * P.H), -Math.PI / 2, 0); g.closePath(); g.fillStyle = col; g.fill(); }
      if (t === 2) for (let k = 0; k < 3; k++) P.rect(x + (k * w) / 3, y, w / 6, h, col);
      if (t === 3) { P.rect(x, y, w, h, col); P.circle(x + w / 2, y + h / 2, h * 0.28, col2); }
      if (t === 4) { g.beginPath(); g.arc((x + w / 2) * P.W, (y + h) * P.H, (h * P.H) * 0.5, Math.PI, 0); g.closePath(); g.fillStyle = col; g.fill(); }
    }
  };
  ART.harlequin = (P, c) => {
    const rows = 7, n = cols(P, rows, 1.6), hw = 0.5 / n, hh = 1 / rows;
    for (let r = 0; r <= rows; r += 2) for (let i = 0; i <= n; i++) { const cx = (i + 0.5 * (r % 4 ? 1 : 0)) / n, cy = r / rows; P.path([[cx - hw, cy], [cx, cy - hh], [cx + hw, cy], [cx, cy + hh]], c); }
  };
  ART.quilted = (P, c) => {
    const n = cols(P, 6), a = asp(P), g = P.g;
    g.setLineDash([0.012 * P.H, 0.008 * P.H]);
    for (let i = -n; i <= 2 * n; i++) { P.line(i / n, 0, i / n + 1 / a, 1, c, 0.004); P.line(i / n, 0, i / n - 1 / a, 1, c, 0.004); }
    g.setLineDash([]);
    for (let r = 0; r <= 12; r++) for (let i = 0; i <= 2 * n; i++) if ((r + i) % 2 === 0) P.circle(i / (2 * n), r / 12, 0.007, c);
  };
  ART.snake = (P, c) => {
    const rows = 26, n = cols(P, rows, 1.3), g = P.g, R = (0.5 / n) * P.W;
    for (let r = 0; r <= rows; r++) for (let i = 0; i <= n; i++) {
      g.beginPath(); g.arc(((i + 0.5 * (r % 2)) / n) * P.W, (r / rows) * P.H, R, 0, Math.PI); g.fillStyle = c; g.globalAlpha = 0.18 + 0.2 * rnd(r * 61 + i); g.fill(); g.globalAlpha = 1; stroke(P, c, 0.003);
    }
  };
  ART.croc = (P, c) => {
    let y = 0;
    for (let r = 0; y < 1; r++) {
      const h = 0.05 + rnd(r + 5) * 0.05, ws = Array.from({ length: 8 + Math.floor(rnd(r) * 6) }, (_, k) => 0.6 + rnd(r * 13 + k) * 0.8), sum = ws.reduce((s, v) => s + v, 0);
      let x = rnd(r + 77) * 0.05;
      for (const w0 of ws) { const w = w0 / sum; P.g.beginPath(); if (P.g.roundRect) P.g.roundRect((x + 0.002) * P.W, (y + 0.004) * P.H, (w - 0.004) * P.W, (h - 0.008) * P.H, 0.012 * P.H); else P.g.rect((x + 0.002) * P.W, (y + 0.004) * P.H, (w - 0.004) * P.W, (h - 0.008) * P.H); stroke(P, c, 0.004); x += w; }
      y += h;
    }
  };
  ART.leopard = (P, c) => {
    const a = asp(P);
    for (let i = 0; i < Math.round(70 * a); i++) {
      const x = rnd(i), y = rnd(i + 300), r = 0.026 + rnd(i + 600) * 0.024, nb = 4 + Math.floor(rnd(i + 9) * 3);
      wrapX(x, (r * 2) / a, (xx) => { for (let k = 0; k < nb; k++) { const ang = (k / nb) * Math.PI * 2 + rnd(i + k), bx = xx + (Math.cos(ang) * r) / a, by = y + Math.sin(ang) * r; P.ellipse(bx, by, (r * 0.45) / a, r * 0.3, ang + Math.PI / 2, c); } });
    }
  };
  ART.zebra = (P, c) => {
    const n = cols(P, 9);
    for (let i = 0; i < n; i++) {
      const x0 = (i + 0.5) / n, w = 0.32 / n, ph = rnd(i) * 6, L = [], R = [];
      for (let k = 0; k <= 30; k++) { const y = k / 30, off = 0.6 * w * Math.sin(y * 9 + ph), tw = w * (0.35 + 0.65 * Math.abs(Math.sin(y * 4 + ph))); L.push([x0 + off - tw, y]); R.push([x0 + off + tw, y]); }
      P.path(L.concat(R.reverse()), c);
    }
  };
  // Japanese seigaiha: overlapping fans of concentric arcs.
  ART.seigaiha = (P, c, o) => {
    const g = P.g, n = cols(P, 12, 2), R = asp(P) / (2 * n);
    for (let r = 0; r < 1 / (R * 0.5) + 2; r++) for (let i = -1; i <= n; i++) {
      const cx = ((i + 0.5 * (r % 2)) / n) * P.W, cy = r * R * 0.5 * P.H;
      // Each fan hides the arcs behind it (on a box there is board to keep, so it just overdraws).
      if (!o.box) { g.save(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(cx, cy, R * P.H, Math.PI, 0); g.fill(); g.restore(); }
      for (let k = 1; k <= 4; k++) { g.beginPath(); g.arc(cx, cy, (k / 4) * R * P.H * 0.96, Math.PI, 0); stroke(P, c, 0.0035); }
    }
  };
  ART.honeycomb = (P, c) => {
    const n = even(cols(P, 9, 1.5)), a = asp(P), R = a / (1.5 * n), hgt = Math.sqrt(3) * R;
    const hex = Array.from({ length: 6 }, (_, k) => [Math.cos((k * Math.PI) / 3) * R * 0.92, Math.sin((k * Math.PI) / 3) * R * 0.92]);
    for (let i = 0; i <= n; i++) for (let r = -1; r < 1 / hgt + 1; r++) poly(P, (i * 1.5 * R) / a, r * hgt + (i % 2) * hgt / 2, hex, c, false, 0.004);
  };
  // Engine-turned guilloché, like engraved watch dials.
  ART.guilloche = (P, c) => {
    const k = Math.max(1, Math.round(asp(P) * 1.5)), k2 = k * 3;
    for (let band = 0; band < 2; band++) for (let s = 0; s < 22; s++) P.path(Array.from({ length: 260 }, (_, j) => { const x = j / 259; return [x, 0.27 + band * 0.46 + 0.17 * Math.sin(2 * Math.PI * k * x + s * 0.28) * (0.6 + 0.4 * Math.cos(2 * Math.PI * k2 * x + s * 0.12))]; }), c, false, 0.0022);
  };
  ART.damask = (P, c) => {
    const n = cols(P, 3, 0.75);
    for (let r = 0; r < 4; r++) for (let i = 0; i < n; i++) {
      const y = (r + 0.5) / 3.4 - 0.05;
      wrapX((i + 0.5 * (r % 2)) / n, 0.12, (x) => {
        const a = asp(P), e = (dx, dy, rx, ry, rot) => P.ellipse(x + dx / a, y + dy, rx / a, ry, rot, c);
        e(0, 0, 0.035, 0.07, 0); e(0, -0.1, 0.014, 0.03, 0); e(-0.025, -0.085, 0.01, 0.025, -0.6); e(0.025, -0.085, 0.01, 0.025, 0.6);
        for (const s of [-1, 1]) { e(s * 0.07, 0.02, 0.06, 0.018, s * 0.5); e(s * 0.06, -0.04, 0.04, 0.012, -s * 0.6); e(s * 0.04, 0.09, 0.03, 0.01, -s * 0.4); }
        P.circle(x, y + 0.13, 0.01, c);
      });
    }
  };
  ART.constellation = (P, c) => {
    const a = asp(P), pts = Array.from({ length: Math.round(90 * a) }, (_, i) => [rnd(i), rnd(i + 500), 0.004 + rnd(i + 900) * 0.014]);
    P.g.globalAlpha = 0.5;
    pts.forEach(([x, y], i) => { const j = (i * 7 + 3) % pts.length; const [x2, y2] = pts[j]; if (Math.hypot((x2 - x) * a, y2 - y) < 0.3) P.line(x, y, x2, y2, c, 0.0015); });
    P.g.globalAlpha = 1;
    pts.forEach(([x, y, s]) => wrapX(x, s / a, (xx) => poly(P, xx, y, star(4, s, s * 0.3), c)));
  };
  // Bond No. 9: city graffiti, splats and drips.
  ART.graffiti = (P, c, o) => {
    const a = asp(P), g = P.g;
    for (let i = 0; i < Math.round(18 * a); i++) {
      const x = rnd(i), y = 0.1 + rnd(i + 40) * 0.8, r = 0.025 + rnd(i + 80) * 0.05, col = pick(o, i + 3);
      wrapX(x, (r * 3) / a, (xx) => {
        P.circle(xx, y, r, col);
        for (let k = 0; k < 9; k++) { const ang = rnd(i * 9 + k) * Math.PI * 2, d = r * (1.2 + rnd(i * 3 + k) * 0.9); P.circle(xx + (Math.cos(ang) * d) / a, y + Math.sin(ang) * d, r * 0.12 * (0.5 + rnd(k + i)), col); }
        for (let k = 0; k < 3; k++) { const dx = ((rnd(i * 5 + k) - 0.5) * r * 1.4) / a, len = 0.05 + rnd(i * 7 + k) * 0.2; P.line(xx + dx, y, xx + dx, y + len, col, 0.008); P.circle(xx + dx, y + len, 0.007, col); }
      });
    }
    for (let i = 0; i < Math.round(14 * a); i++) {
      const col = pick(o, i + 50), x = rnd(i + 200), y = rnd(i + 250) * 0.9 + 0.05;
      g.beginPath(); g.moveTo(x * P.W, y * P.H);
      for (let k = 0; k < 5; k++) g.quadraticCurveTo((x + (rnd(i * 4 + k) - 0.3) * 0.12 / a) * P.W, (y + (rnd(i * 6 + k) - 0.5) * 0.15) * P.H, (x + ((k + 1) * 0.03) / a) * P.W, (y + (rnd(i + k * 3) - 0.5) * 0.08) * P.H);
      stroke(P, col, 0.009);
    }
  };
  // Orto Parisi: crackle glaze.
  ART.crackle = (P, c) => {
    const a = asp(P);
    for (let i = 0; i < Math.round(30 * a); i++) {
      let x = rnd(i), y = rnd(i + 700), ang = rnd(i + 1400) * Math.PI * 2; const pts = [[x, y]];
      for (let k = 0; k < 10; k++) { ang += (rnd(i * 17 + k) - 0.5) * 1.4; const L = 0.02 + rnd(i * 13 + k) * 0.035; x += (Math.cos(ang) * L) / a; y += Math.sin(ang) * L; pts.push([x, y]); }
      P.path(pts, c, false, 0.0015 + rnd(i + 2) * 0.0025);
    }
  };
  ART.moroccan = (P, c) => {
    const n = cols(P, 5), R = asp(P) / (2 * n);
    for (let r = -1; r <= 1 / (2 * R) + 1; r++) for (let i = 0; i <= n; i++) {
      P.circle(i / n, r * 2 * R, R * 1.0, c, 0.005);
      P.circle((i + 0.5) / n, (r + 0.5) * 2 * R, R * 1.0, c, 0.005);
      P.circle((i + 0.5) / n, r * 2 * R, R * 0.12, c);
    }
  };
  ART.herringbone = (P, c) => {
    const n = even(cols(P, 7)), w = 1 / n, h = 0.04, gap = 0.012, rise = (w * asp(P)) * 0.9;
    for (let i = 0; i < n; i++) for (let y = -0.2; y < 1.1; y += h + gap) {
      const x = i * w, dy = i % 2 ? rise : -rise, inset = 0.06 * w;
      P.path([[x + inset, y], [x + w - inset, y + dy], [x + w - inset, y + dy + h], [x + inset, y + h]], c);
    }
  };
  ART.houndstooth = (P, c) => {
    const n = cols(P, 12), s = 1 / n, t = 1 / 12;
    for (let r = 0; r < 12; r++) for (let i = 0; i < n; i++) {
      const x = i * s, y = r * t;
      P.rect(x, y + t / 2, s / 2, t / 2, c);
      P.path([[x, y + t / 2], [x + s / 2, y], [x + s, y], [x + s / 2, y + t / 2]], c);
      P.path([[x + s / 2, y + t / 2], [x + s, y + t / 2], [x + s, y + t * 0.75], [x + s * 0.75, y + t]], c);
    }
  };
  ART.tartan = (P, c, o) => {
    const n = Math.max(1, Math.round(asp(P) * 3)), ph = 1 / 3, pw = 1 / n;
    P.g.globalAlpha = 0.45;
    for (let k = 0; k < 3; k++) { const y = k * ph; P.rect(0, y, 1, ph * 0.3, pick(o, 1)); P.rect(0, y + ph * 0.45, 1, ph * 0.08, pick(o, 2)); P.rect(0, y + ph * 0.6, 1, ph * 0.2, pick(o, 3)); }
    for (let k = 0; k < n; k++) { const x = k * pw; P.rect(x, 0, pw * 0.3, 1, pick(o, 1)); P.rect(x + pw * 0.45, 0, pw * 0.08, 1, pick(o, 2)); P.rect(x + pw * 0.6, 0, pw * 0.2, 1, pick(o, 3)); }
    P.g.globalAlpha = 1;
    for (let k = 0; k < 3; k++) P.line(0, k * ph + ph * 0.9, 1, k * ph + ph * 0.9, c, 0.002);
    for (let k = 0; k < n; k++) P.line(k * pw + pw * 0.9, 0, k * pw + pw * 0.9, 1, c, 0.002);
  };
  ART.checker = (P, c) => { const n = even(cols(P, 8)); for (let r = 0; r < 8; r++) for (let i = 0; i < n; i++) if ((r + i) % 2 === 0) P.rect(i / n, r / 8, 1 / n, 1 / 8, c); };
  // Tiziana Terenzi: gilded flowers on lacquer.
  ART.florals = (P, c, o) => {
    const a = asp(P), g = P.g;
    for (let i = 0; i < Math.round(24 * a); i++) {
      const x = rnd(i), y = 0.08 + rnd(i + 70) * 0.84, r = 0.03 + rnd(i + 140) * 0.03, rot = rnd(i + 3) * 6;
      wrapX(x, (r * 4) / a, (xx) => {
        g.beginPath(); g.moveTo(xx * P.W, y * P.H); g.quadraticCurveTo((xx + 0.06 / a) * P.W, (y + 0.08) * P.H, (xx + (rnd(i) - 0.5) * 0.1 / a) * P.W, (y + 0.17) * P.H); stroke(P, c, 0.004);
        for (const s of [-1, 1]) P.ellipse(xx + (s * 0.035) / a, y + 0.09, 0.03 / a, 0.011, s * 0.6, c);
        for (let k = 0; k < 5; k++) { const ang = rot + (k / 5) * Math.PI * 2; P.ellipse(xx + (Math.cos(ang) * r * 0.6) / a, y + Math.sin(ang) * r * 0.6, (r * 0.5) / a, r * 0.28, ang, c); }
        P.circle(xx, y, r * 0.22, o.box ? c : pick(o, i + 2));
      });
    }
  };
  ART.mosaic = (P, c, o) => {
    const n = cols(P, 22), s = 1 / n, t = 1 / 22;
    for (let r = 0; r < 22; r++) for (let i = 0; i < n; i++) if (rnd(r * 97 + i) > 0.12) P.rect(i * s + s * 0.08, r * t + t * 0.08, s * 0.84, t * 0.84, pick(o, r * 13 + i * 7), 0.003);
  };
  ART.bondstars = (P, c) => {
    const a = asp(P);
    for (let i = 0; i < Math.round(34 * a); i++) { const r = 0.02 + rnd(i + 30) * 0.05; wrapX(rnd(i), r / a, (x) => poly(P, x, rnd(i + 60), star(5, r, r * 0.42), c, rnd(i + 90) > 0.4, 0.004)); }
  };
  ART.paisley = (P, c) => {
    const a = asp(P), g = P.g;
    for (let i = 0; i < Math.round(22 * a); i++) {
      const x = rnd(i), y = 0.08 + rnd(i + 20) * 0.84, s = 0.05 + rnd(i + 40) * 0.035, rot = rnd(i + 60) * 6;
      wrapX(x, (s * 2) / a, (xx) => {
        const tear = (sc) => { g.save(); g.translate(xx * P.W, y * P.H); g.rotate(rot); g.scale(1, 1); g.beginPath(); const S = s * sc * P.H; g.moveTo(0, -S * 1.2); g.bezierCurveTo(S * 1.1, -S * 0.6, S * 0.9, S * 0.9, 0, S * 0.8); g.bezierCurveTo(-S * 0.9, S * 0.7, -S * 0.7, -S * 0.1, S * 0.2, -S * 0.3); g.restore(); };
        tear(1); stroke(P, c, 0.004); tear(0.65); stroke(P, c, 0.0025);
        P.circle(xx, y + s * 0.25, s * 0.15, c);
      });
    }
  };

  /* ---------- materials painted all over (opaque) ---------- */
  ART.mat_stone = (P, base) => { P.rect(0, 0, 1, 1, base); ART.marble(P, 'rgba(0,0,0,0.28)'); ART.marble(P, 'rgba(255,255,255,0.35)'); };
  ART.mat_leather = (P, base) => {
    P.rect(0, 0, 1, 1, base);
    for (let i = 0; i < 5000; i++) P.circle(rnd(i), rnd(i + 9999), 0.0015 + rnd(i + 3) * 0.003, i % 3 ? 'rgba(0,0,0,0.13)' : 'rgba(255,255,255,0.06)');
    P.g.setLineDash([0.012 * P.H, 0.008 * P.H]); for (const y of [0.04, 0.96]) P.line(0, y, 1, y, 'rgba(255,240,215,0.55)', 0.004); P.g.setLineDash([]);
  };
  ART.mat_croc = (P, base) => { P.rect(0, 0, 1, 1, base); ART.croc(P, 'rgba(0,0,0,0.35)'); };
  ART.mat_wood = (P, base) => {
    P.rect(0, 0, 1, 1, base);
    for (let i = 0; i < 120; i++) { const x0 = i / 120, ph = rnd(i) * 6; P.g.globalAlpha = 0.12 + rnd(i + 1) * 0.2; P.path(Array.from({ length: 20 }, (_, k) => [x0 + 0.004 * Math.sin(k * 0.8 + ph), k / 19]), '#000000', false, 0.002); }
    P.g.globalAlpha = 1;
    for (let i = 0; i < 4; i++) P.ellipse(rnd(i + 70), rnd(i + 90), 0.006, 0.03, 0, 'rgba(40,20,5,0.35)');
  };
  ART.mat_carbon = (P, base) => {
    P.rect(0, 0, 1, 1, '#121315');
    const rows = 40, n = even(cols(P, rows));
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
      const v = (r + i) % 2, gr = P.g.createLinearGradient((i / n) * P.W, (r / rows) * P.H, ((i + (v ? 1 : 0)) / n) * P.W, ((r + (v ? 0 : 1)) / rows) * P.H);
      gr.addColorStop(0, '#2a2c30'); gr.addColorStop(0.5, '#4a4d54'); gr.addColorStop(1, '#1a1b1e');
      P.g.fillStyle = gr; P.g.fillRect((i / n) * P.W + 1, (r / rows) * P.H + 1, P.W / n - 2, P.H / rows - 2);
    }
    void base;
  };

  /* ---------- the menus ---------- */
  Object.assign(DECOR, {
    artdeco: { label: 'Art deco engraving (Kilian)', cost: 2 }, sunburst: { label: 'Sunburst rays', cost: 2 }, filigree: { label: 'Arabesque filigree (Kajal)', cost: 3 },
    goldleaf: { label: 'Gold leaf flakes', cost: 3 }, marble: { label: 'Marble veins', cost: 2 }, terrazzo: { label: 'Terrazzo chips', cost: 2 }, murano: { label: 'Murano swirl (Xerjoff)', cost: 3 },
    memo: { label: 'Graphic blocks (Memo Paris)', cost: 3 }, harlequin: { label: 'Harlequin diamonds', cost: 2 }, quilted: { label: 'Quilted stitching', cost: 2 }, snake: { label: 'Snakeskin scales', cost: 3 },
    croc: { label: 'Croc scales', cost: 3 }, leopard: { label: 'Leopard print', cost: 2 }, zebra: { label: 'Zebra stripes', cost: 2 }, seigaiha: { label: 'Seigaiha waves', cost: 2 }, honeycomb: { label: 'Honeycomb', cost: 2 },
    guilloche: { label: 'Guilloché engraving', cost: 3 }, damask: { label: 'Damask', cost: 2 }, constellation: { label: 'Constellations', cost: 2 }, graffiti: { label: 'Graffiti splatter (Bond No. 9)', cost: 2 },
    crackle: { label: 'Crackle glaze', cost: 2 }, moroccan: { label: 'Moroccan circles', cost: 2 }, herringbone: { label: 'Herringbone', cost: 2 }, houndstooth: { label: 'Houndstooth', cost: 2 },
    tartan: { label: 'Tartan', cost: 2 }, checker: { label: 'Chessboard', cost: 2 }, florals: { label: 'Gilded flowers (Tiziana Terenzi)', cost: 3 }, mosaic: { label: 'Mosaic tiles', cost: 3 },
    bondstars: { label: 'Scattered stars', cost: 2 }, paisley: { label: 'Paisley', cost: 2 },
  });
  for (const k of ['artdeco', 'sunburst', 'filigree', 'goldleaf', 'terrazzo', 'murano', 'memo', 'harlequin', 'quilted', 'snake', 'leopard', 'zebra', 'seigaiha', 'honeycomb', 'guilloche', 'constellation', 'graffiti', 'crackle', 'moroccan', 'herringbone', 'houndstooth', 'tartan', 'checker', 'florals', 'mosaic', 'paisley']) PATTERNS[k] = DECOR[k].label.replace(/ \(.*\)$/, '');
  PATTERNS.bondstars = 'Scattered stars';

  // Gold flakes suspended in the juice (Atelier des Ors).
  function flakes(k, d, sh, B) {
    const T = B.T, W = sh.w, H = sh.h, D = sh.d, gs = [];
    const rAt = sh.body === 'lathe' ? (y) => { const p = sh.pts; for (let i = 1; i < p.length; i++) if (p[i][1] >= y) { const [r0, y0] = p[i - 1], [r1, y1] = p[i]; return r0 + ((r1 - r0) * (y - y0)) / Math.max(1e-6, y1 - y0); } return 0; } : null;
    const boxy = !sh.body || sh.body === 'box';
    for (let i = 0; i < 220; i++) {
      const y = 0.04 + rnd(i) * H * 0.8; let x = rnd(i + 300) - 0.5, z = rnd(i + 600) - 0.5;
      if (rAt) { if (Math.hypot(x, z) > 0.5) continue; const r = rAt(y) * 0.8; x *= 2 * r; z *= 2 * r * (D / W); }
      else { if (!boxy && (x * x * 4 + ((y - H / 2) / (H / 2)) ** 2 > 0.7)) continue; x *= W * 0.8; z *= D * 0.7; }
      const s = 0.008 + rnd(i + 900) * 0.02, p = new T.PlaneGeometry(s, s * (0.5 + rnd(i + 1200) * 0.8));
      p.rotateX(rnd(i + 1500) * 3); p.rotateY(rnd(i + 1800) * 3); p.rotateZ(rnd(i + 2100) * 3); p.translate(x, y, z); gs.push(p);
    }
    if (gs.length) k.part(B.merge(gs), new T.MeshStandardMaterial({ color: B.C('#e8c060'), metalness: 1, roughness: 0.3, side: T.DoubleSide }), 2);
  }
  Object.assign(GLASS, {
    goldflakes: { label: 'Clear, gold flakes in the juice', cost: 5, apply: (o, d) => { o.juice = d.juice; o.level = 0.9; o.inset = 0.93; o.jop = 0.75; }, extra: flakes },
    ceramic: { label: 'Glazed ceramic', cost: 4, apply: (o, d) => { o.solid = d.color; o.rough = 0.45; o.coat = 0.9; o.env = 1.2; } },
    matteceramic: { label: 'Matte ceramic', cost: 4, apply: (o, d) => { o.solid = d.color; o.rough = 0.9; o.coat = 0; o.env = 0.8; } },
    velvet: { label: 'Velvet flocked', cost: 5, apply: (o, d) => { o.solid = d.color; o.rough = 1; o.coat = 0; o.env = 0.5; } },
    stone: { label: 'Marble stone', cost: 6, apply: (o, d) => { o.solid = d.color; o.rough = 0.35; }, skin: 'mat_stone', rough: 0.3 },
    leather: { label: 'Leather wrapped', cost: 6, apply: (o, d) => { o.solid = d.color; o.rough = 0.8; o.coat = 0; }, skin: 'mat_leather', rough: 0.75 },
    exotic: { label: 'Croc leather', cost: 7, apply: (o, d) => { o.solid = d.color; o.rough = 0.6; o.coat = 0; }, skin: 'mat_croc', rough: 0.5 },
    wood: { label: 'Carved wood', cost: 5, apply: (o, d) => { o.solid = d.color; o.rough = 0.7; o.coat = 0.1; }, skin: 'mat_wood', rough: 0.65 },
    carbon: { label: 'Carbon fibre', cost: 6, apply: (o) => { o.solid = '#151618'; o.rough = 0.3; }, skin: 'mat_carbon', rough: 0.28 },
    opal: { label: 'Opal', cost: 5, apply: (o, d) => { o.solid = '#ffffff'; o.grad = [d.color, '#f8d8ec']; o.metal = 0.45; o.rough = 0.22; o.coat = 1; } },
  });

  /* ---------- shapes ---------- */
  function crescent(R, cy, a0, c) {
    const E = [R * Math.cos(a0), R * Math.sin(a0)], rho = Math.hypot(E[0] - c, E[1]), b0 = Math.atan2(E[1], E[0] - c), pts = [];
    for (let k = 0; k <= 28; k++) { const a = a0 + (k / 28) * (2 * Math.PI - 2 * a0); pts.push([R * Math.cos(a), cy + R * Math.sin(a)]); }
    for (let k = 1; k < 20; k++) { const a = 2 * Math.PI - b0 - (k / 20) * (2 * Math.PI - 2 * b0); pts.push([c + rho * Math.cos(a), cy + rho * Math.sin(a)]); }
    return pts;
  }
  const heart = (s) => Array.from({ length: 36 }, (_, i) => { const t = (i / 36) * Math.PI * 2; return [s * 16 * Math.pow(Math.sin(t), 3), s * 17 + s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]; });
  Object.assign(SHAPES, {
    barrel: { label: 'Barrel (Xerjoff)', cost: 7, body: { body: 'lathe', w: 0.52, d: 0.52, h: 0.6, pts: [[0, 0], [0.2, 0], [0.235, 0.04], [0.26, 0.2], [0.26, 0.36], [0.235, 0.52], [0.2, 0.56], [0.1, 0.58], [0.08, 0.6], [0, 0.6]] } },
    lantern: { label: 'Lantern (Kajal)', cost: 8, body: { body: 'lathe', seg: 8, w: 0.52, d: 0.52, h: 0.64, pts: [[0, 0], [0.2, 0], [0.24, 0.04], [0.26, 0.1], [0.26, 0.5], [0.22, 0.58], [0.12, 0.62], [0.08, 0.64], [0, 0.64]] } },
    inkwell: { label: 'Inkwell', cost: 6, body: { w: 0.5, h: 0.42, d: 0.5, r: 0.05 } },
    tablet: { label: 'Tablet', cost: 5, body: { w: 0.6, h: 0.5, d: 0.13, r: 0.03 } },
    capsule: { label: 'Capsule', cost: 6, body: { body: 'lathe', w: 0.38, d: 0.38, h: 0.62, pts: [[0, 0], [0.08, 0], [0.16, 0.03], [0.19, 0.1], [0.19, 0.5], [0.16, 0.57], [0.09, 0.6], [0.08, 0.62], [0, 0.62]] } },
    hourglass: { label: 'Hourglass', cost: 8, body: { body: 'lathe', w: 0.48, d: 0.48, h: 0.65, pts: [[0, 0], [0.22, 0], [0.24, 0.03], [0.2, 0.15], [0.12, 0.3], [0.2, 0.45], [0.24, 0.57], [0.2, 0.6], [0.08, 0.62], [0.075, 0.65], [0, 0.65]], label: { y: 0.5, h: 0.12, w: 0.3 } } },
    fluted: { label: 'Fluted column', cost: 9, body: { w: 0.44, d: 0.44, h: 0.65, skinRound: true, make: (B) => {
      const g = B.lathe([[0, 0], [0.2, 0], [0.212, 0.02], [0.212, 0.5], [0.19, 0.56], [0.12, 0.6], [0.085, 0.615], [0.08, 0.65], [0, 0.65]], 0, 1, 96), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (y > 0.51 || y < 0.015) continue; const f = 1 - 0.035 + 0.05 * Math.pow(Math.abs(Math.cos(Math.atan2(z, x) * 12)), 0.5); p.setXYZ(i, x * f, y, z * f); }
      g.computeVertexNormals(); return g;
    } } },
    twisted: { label: 'Twisted tower', cost: 9, body: { w: 0.36, d: 0.36, h: 0.66, skinRound: false, make: (B) => {
      const T = B.T, H = 0.66, g = new T.BoxGeometry(0.36, H, 0.36, 4, 40, 4); g.translate(0, H / 2, 0); const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = (y / H - 0.45) * (Math.PI / 2); p.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a)); }
      g.computeVertexNormals(); return g;
    } } },
    shield: { label: 'Shield', cost: 7, body: { body: 'profile', pts: [[0, 0], [0.15, 0.1], [0.25, 0.3], [0.25, 0.62], [-0.25, 0.62], [-0.25, 0.3], [-0.15, 0.1]], round: 0.03, w: 0.5, h: 0.62, d: 0.2 } },
    diamond: { label: 'Diamond', cost: 7, body: { body: 'profile', pts: [[0, 0], [0.27, 0.32], [0.07, 0.62], [-0.07, 0.62], [-0.27, 0.32]], round: 0.03, w: 0.54, h: 0.62, d: 0.22, label: { y: 0.31, w: 0.3, h: 0.16 } } },
    crescent: { label: 'Crescent moon', cost: 9, body: { body: 'profile', pts: crescent(0.3, 0.3, 0.9, 0.14), round: 0.01, w: 0.6, h: 0.6, d: 0.18, label: { x: -0.2, y: 0.3, w: 0.15, h: 0.2 } } },
    ziggurat: { label: 'Ziggurat', cost: 7, body: { body: 'profile', pts: [[-0.28, 0], [0.28, 0], [0.28, 0.2], [0.2, 0.2], [0.2, 0.4], [0.12, 0.4], [0.12, 0.6], [-0.12, 0.6], [-0.12, 0.4], [-0.2, 0.4], [-0.2, 0.2], [-0.28, 0.2]], round: 0.015, w: 0.56, h: 0.6, d: 0.26, label: { y: 0.1, w: 0.46, h: 0.15 } } },
  });

  /* ---------- caps ---------- */
  const B = () => BottleCraft.tools;
  const base = (L) => L([[0, 0], [0.11, 0], [0.11, 0.025], [0.085, 0.04], [0.07, 0.06], [0, 0.06]]);
  const stem = (L) => L([[0, 0], [0.07, 0], [0.05, 0.1], [0.045, 0.13], [0.075, 0.14], [0.075, 0.155], [0, 0.155]]);
  const crown = (L) => L([[0, 0], [0.05, 0], [0.095, 0.09], [0.08, 0.095], [0, 0.095]]);
  const ringOf = (n, r, size, shape) => ({ s: 'geo', stay: true, make: (y) => { const T = B().T, gs = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, g = shape === 'box' ? new T.BoxGeometry(size, size, size) : new T.SphereGeometry(size, 10, 8); g.translate(Math.cos(a) * r, y + size * 0.6, Math.sin(a) * r); gs.push(g); } return { g: B().merge(gs), h: size }; } });
  Object.assign(CAPS, {
    pawn: { label: 'Chess pawn (Mind Games)', cost: 5, h: 0.35, parts: (L) => [base(L), stem(L), { s: 'sphere', r: 0.065 }] },
    rook: { label: 'Chess rook', cost: 5, h: 0.32, parts: (L) => [base(L), L([[0, 0], [0.075, 0], [0.065, 0.15], [0.095, 0.165], [0.095, 0.21], [0, 0.21]]), ringOf(6, 0.075, 0.045, 'box')] },
    bishop: { label: 'Chess bishop', cost: 6, h: 0.41, parts: (L) => [base(L), stem(L), L([[0, 0], [0.055, 0.01], [0.07, 0.06], [0.06, 0.1], [0.035, 0.135], [0, 0.15]]), { s: 'sphere', r: 0.022 }] },
    knight: { label: 'Chess knight', cost: 7, h: 0.33, parts: (L) => [base(L), L([[0, 0], [0.08, 0], [0.07, 0.03], [0, 0.03]]), { s: 'prof', d: 0.08, round: 0.012, pts: [[-0.07, 0], [0.07, 0], [0.05, 0.05], [0.02, 0.09], [0.075, 0.11], [0.095, 0.14], [0.085, 0.165], [0.04, 0.19], [0.02, 0.235], [-0.01, 0.21], [-0.05, 0.19], [-0.075, 0.13], [-0.08, 0.06]] }] },
    queen: { label: 'Chess queen', cost: 7, h: 0.38, parts: (L) => [base(L), stem(L), crown(L), ringOf(9, 0.085, 0.016), { s: 'sphere', r: 0.035 }] },
    king: { label: 'Chess king', cost: 7, h: 0.48, parts: (L) => [base(L), stem(L), crown(L), L([[0, 0], [0.07, 0], [0.05, 0.05], [0, 0.06]]), { s: 'geo', make: (y) => { const T = B().T, v = new T.BoxGeometry(0.03, 0.11, 0.03), h = new T.BoxGeometry(0.085, 0.03, 0.03); v.translate(0, y + 0.055, 0); h.translate(0, y + 0.07, 0); return { g: B().merge([v, h]), h: 0.11 }; } }] },
    gemstone: { label: 'Gemstone (Electimuss)', cost: 7, h: 0.19, parts: (L) => [L([[0, 0], [0.06, 0], [0.16, 0.07], [0.175, 0.095], [0.12, 0.16], [0, 0.18]], 8)] },
    boulder: { label: 'Rough stone (Tiziana Terenzi)', cost: 6, h: 0.22, parts: () => [{ s: 'geo', seg: 6, make: (y) => {
      const T = B().T, g = new T.IcosahedronGeometry(0.13, 1), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), yy = p.getY(i), z = p.getZ(i), f = 1 + 0.16 * Math.sin(x * 31 + yy * 17) * Math.cos(z * 23 + x * 11); p.setXYZ(i, x * f, yy * f * 0.85, z * f * 0.9); }
      g.computeVertexNormals(); g.computeBoundingBox(); g.translate(0, y - g.boundingBox.min.y, 0); return { g, h: g.boundingBox.max.y - g.boundingBox.min.y };
    } }] },
    carved: { label: 'Carved sculpture', cost: 6, h: 0.4, parts: (L) => [L([[0, 0], [0.06, 0], [0.12, 0.07], [0.135, 0.18], [0.11, 0.3], [0.05, 0.38], [0, 0.4]], 9)] },
    lotus: { label: 'Lotus flower', cost: 7, h: 0.2, parts: () => [{ s: 'geo', make: (y) => {
      const T = B().T, gs = [];
      for (const [n, sc, tilt] of [[8, 1, 0.75], [6, 0.8, 0.35]]) for (let i = 0; i < n; i++) { const g = new T.SphereGeometry(1, 14, 10); g.scale(0.045 * sc, 0.11 * sc, 0.022 * sc); g.translate(0, 0.1 * sc, 0); g.rotateX(tilt); g.rotateY((i / n) * Math.PI * 2 + (sc < 1 ? 0.4 : 0)); g.translate(0, y, 0); gs.push(g); }
      const c = new T.SphereGeometry(0.035, 12, 10); c.translate(0, y + 0.06, 0); gs.push(c); return { g: B().merge(gs), h: 0.2 };
    } }] },
    slab: { label: 'Heavy slab (Nishane)', cost: 4, h: 0.16, parts: () => [{ s: 'box', w: 0.34, d: 0.2, h: 0.16, rr: 0.01 }] },
    ribbed: { label: 'Ribbed metal (Initio)', cost: 5, h: 0.17, parts: (L) => [L([[0, 0]].concat(Array.from({ length: 13 }, (_, i) => [i % 2 ? 0.115 : 0.125, i * 0.014]), [[0, 0.168]]), 48)] },
    drum: { label: 'Gilded drum (Xerjoff)', cost: 6, h: 0.19, parts: (L) => [{ s: 'cyl', r: 0.15, h: 0.035 }, { s: 'cyl', r: 0.13, h: 0.08 }, { s: 'cyl', r: 0.15, h: 0.03 }, L([[0, 0], [0.1, 0], [0.08, 0.035], [0, 0.045]])] },
    fluted: { label: 'Fluted column', cost: 4, h: 0.22, parts: () => [{ s: 'cyl', r: 0.12, h: 0.22, seg: 14 }] },
    starcap: { label: 'Star', cost: 5, h: 0.26, parts: () => [{ s: 'prof', d: 0.07, round: 0.01, pts: star(5, 0.13, 0.055).map(([x, y]) => [x, -y + 0.13]) }] },
    heartcap: { label: 'Heart', cost: 5, h: 0.2, parts: () => [{ s: 'prof', d: 0.07, round: 0.01, pts: heart(0.0068) }] },
    moon: { label: 'Crescent moon', cost: 6, h: 0.27, parts: () => [{ s: 'prof', d: 0.06, round: 0.008, pts: crescent(0.135, 0.135, 0.9, 0.065) }] },
  });

  /* ---------- labels ---------- */
  const metal = (d) => (d.capFin === 'gold' || d.capFin === 'rosegold' ? '#d8b462' : '#cfd3d8');
  const across = (sh, w) => ({ w, arc: w / (sh.w / 2 + 0.004) });
  Object.assign(LABELS, {
    cartouche: { label: 'Oval cartouche (Initio)', cost: 2, art: (info, d, sh, wrap) => Object.assign(across(sh, Math.min(sh.w * 0.62, 0.3)), {
      h: Math.min(sh.h * 0.26, 0.16), y: sh.h * 0.55, wrap, foil: true,
      draw: (P) => { P.ellipse(0.5, 0.5, 0.48, 0.46, 0, metal(d)); P.g.beginPath(); P.g.ellipse(P.W / 2, P.H / 2, P.W * 0.43, P.H * 0.4, 0, 0, Math.PI * 2); stroke(P, '#1a1a1a', 0.012); P.text(info.house.toUpperCase(), 0.5, 0.36, 0.12, '#1a1a1a', { font: 'roman', weight: 600, track: 0.15, maxW: 0.66 }); P.text(info.name, 0.5, 0.62, 0.2, '#1a1a1a', { font: 'serif', italic: true, maxW: 0.7 }); },
    }) },
    medallion: { label: 'Round medallion (Xerjoff)', cost: 2, art: (info, d, sh, wrap) => { const s = Math.min(0.2, sh.h * 0.32, sh.w * 0.5); return Object.assign(across(sh, s), {
      h: s, y: sh.h * 0.5, wrap, foil: true,
      draw: (P) => { P.circle(0.5, 0.5, 0.48, metal(d)); P.circle(0.5, 0.5, 0.42, '#1a1a1a', 0.012); P.circle(0.5, 0.5, 0.38, '#1a1a1a', 0.004); P.text(info.name, 0.5, 0.47, 0.13, '#1a1a1a', { font: 'serif', italic: true, maxW: 0.66 }); P.text(info.house.toUpperCase(), 0.5, 0.66, 0.06, '#1a1a1a', { font: 'roman', weight: 600, track: 0.15, maxW: 0.56 }); },
    }); } },
    vertical: { label: 'Vertical lettering (Atelier des Ors)', cost: 0, art: (info, d, sh, wrap) => Object.assign(across(sh, Math.min(0.1, sh.w * 0.25)), {
      h: sh.h * 0.72, y: sh.h * 0.46, wrap,
      draw: (P) => { const g = P.g; g.save(); g.translate(P.W / 2, P.H / 2); g.rotate(-Math.PI / 2); g.translate(-P.H / 2, -P.W / 2); P.text(info.name.toUpperCase(), (P.H * 0.5) / P.W, (P.W * 0.38) / P.H, (P.W * 0.42) / P.H, d.ink, { font: 'roman', weight: 600, track: 0.2, maxW: (P.H * 0.9) / P.W }); P.text(info.house.toUpperCase(), (P.H * 0.5) / P.W, (P.W * 0.8) / P.H, (P.W * 0.18) / P.H, d.ink, { font: 'helv', track: 0.3, maxW: (P.H * 0.6) / P.W }); g.restore(); },
    }) },
    band: { label: 'Leather band (Memo Paris)', cost: 3, art: (info, d, sh, wrap) => Object.assign(wrap ? { arc: 2 * Math.PI - 0.02, w: (2 * Math.PI - 0.02) * (sh.w / 2 + 0.004) } : { w: sh.w * 0.995 }, {
      h: Math.min(0.15, sh.h * 0.25), y: sh.h * 0.42, wrap,
      draw: (P) => { P.rect(0, 0, 1, 1, d.ink); for (let i = 0; i < 2500; i++) P.circle(rnd(i), rnd(i + 5000), 0.004, 'rgba(0,0,0,0.12)'); P.g.setLineDash([0.04 * P.H, 0.03 * P.H]); for (const y of [0.1, 0.9]) P.line(0, y, 1, y, '#f1e2bf', 0.02); P.g.setLineDash([]); const a = asp(P), cx = wrap ? 0.5 : 0.5, nw = wrap ? 0.9 / a : 0.9; P.text(info.name.toUpperCase(), cx, 0.44, 0.3, '#f1e2bf', { font: 'roman', weight: 600, track: 0.12, maxW: nw }); P.text(info.house.toUpperCase(), cx, 0.72, 0.13, '#f1e2bf', { font: 'helv', track: 0.3, maxW: nw }); },
    }) },
    emboss: { label: 'Etched lettering', cost: 1, art: (info, d, sh, wrap) => Object.assign(across(sh, Math.min(sh.w * 0.78, 0.4)), {
      h: Math.min(sh.h * 0.36, 0.24), y: sh.h * 0.5, wrap,
      draw: (P) => { const c = d.ink; P.line(0.2, 0.12, 0.8, 0.12, c, 0.006); P.line(0.2, 0.88, 0.8, 0.88, c, 0.006); P.text(info.house.toUpperCase(), 0.5, 0.3, 0.1, c, { font: 'roman', weight: 600, track: 0.25, maxW: 0.86, shadow: 'rgba(0,0,0,0.35)' }); P.text(info.name, 0.5, 0.55, 0.2, c, { font: 'serif', italic: true, maxW: 0.9, shadow: 'rgba(0,0,0,0.35)' }); P.text(Maison.CONC[info.conc].label.toUpperCase(), 0.5, 0.76, 0.06, c, { font: 'helv', track: 0.25, maxW: 0.8 }); },
    }) },
  });

  /* ---------- niche house looks ---------- */
  const look = (label, design, box) => ({ label, design: Object.assign({ decor: 'none', pfin: 'ink', extra: 'none' }, design), box: Object.assign({ emblem: 'none', foil: false }, box) });
  Object.assign(PRESETS, {
    kilian: look('Kilian', { shape: 'tall', glass: 'lacquer', color: '#0c0c0e', juice: '#8a5a2a', cap: 'slab', capFin: 'black', label: 'emboss', decor: 'artdeco', pfin: 'silver', extra: 'neckring', ink: '#d8d8dc' }, { style: 'chest', paper: '#111111', ink: '#c8c8cc', pattern: 'artdeco', foil: true }),
    xerjoff: look('Xerjoff', { shape: 'barrel', glass: 'clear', color: '#f2e6c8', juice: '#d9a441', cap: 'drum', capFin: 'gold', label: 'medallion', decor: 'guilloche', pfin: 'gold', ink: '#2a2016' }, { style: 'book', paper: '#f3ede0', ink: '#b08a3e', pattern: 'damask', emblem: 'crest', foil: true }),
    kajal: look('Kajal', { shape: 'lantern', glass: 'crystal', color: '#f8eef4', juice: '#f2a6c4', cap: 'gemstone', capFin: 'crystal', label: 'cartouche', decor: 'filigree', pfin: 'gold', ink: '#3a2a30' }, { style: 'chest', paper: '#f4ece6', ink: '#b8935a', pattern: 'filigree', emblem: 'medallion', foil: true }),
    memo: look('Memo Paris', { shape: 'block', glass: 'clear', color: '#f4f4f4', juice: '#f0d9a6', cap: 'cylinder', capFin: 'gold', label: 'band', ink: '#1d4a6e' }, { style: 'lid', paper: '#1d4a6e', ink: '#e9c46a', pattern: 'memo', foil: true }),
    atelierdesors: look('Atelier des Ors', { shape: 'tall', glass: 'goldflakes', color: '#ffffff', juice: '#f0c86a', cap: 'slab', capFin: 'gold', label: 'vertical', ink: '#1a1a1a' }, { style: 'book', paper: '#121212', ink: '#d6b25e', pattern: 'goldleaf', foil: true }),
    mindgames: look('Mind Games', { shape: 'block', glass: 'clear', color: '#111111', juice: '#7a1f2b', cap: 'knight', capFin: 'gold', label: 'print', ink: '#f2f2f2' }, { style: 'lid', paper: '#0d0d0d', ink: '#e8e8e8', pattern: 'checker' }),
    bond: look('Bond No. 9', { shape: 'star', glass: 'lacquer', color: '#1b3d8f', juice: '#c0d8f0', cap: 'cylinder', capFin: 'silver', label: 'print', decor: 'graffiti', ink: '#f04a8a' }, { style: 'carton', paper: '#1b3d8f', ink: '#f4f4f4', pattern: 'bondstars' }),
    tizianaterenzi: look('Tiziana Terenzi', { shape: 'flask', glass: 'lacquer', color: '#5a1838', juice: '#c0607a', cap: 'boulder', capFin: 'gold', label: 'emboss', decor: 'florals', pfin: 'gold', ink: '#f0d8a0' }, { style: 'book', paper: '#3a0f22', ink: '#d8b268', pattern: 'florals', foil: true }),
    initio: look('Initio', { shape: 'block', glass: 'lacquer', color: '#0b0b0b', juice: '#6a1a1a', cap: 'ribbed', capFin: 'silver', label: 'cartouche', ink: '#111111' }, { style: 'lid', paper: '#0b0b0b', ink: '#cfcfcf', pattern: 'guilloche', foil: true }),
    electimuss: look('Electimuss', { shape: 'cube', glass: 'tinted', color: '#1d6b5a', juice: '#3aa58c', cap: 'gemstone', capFin: 'gold', label: 'plate', ink: '#1a1a1a' }, { style: 'lid', paper: '#0e3a30', ink: '#d9b15c', pattern: 'marble', emblem: 'crest', foil: true }),
    nishane: look('Nishane', { shape: 'block', glass: 'clear', color: '#ffffff', juice: '#e9c27a', cap: 'slab', capFin: 'wood', label: 'emboss', ink: '#1e1e1e' }, { style: 'sleeve', paper: '#e9e2d4', ink: '#2a2a2a', pattern: 'plain' }),
    ortoparisi: look('Orto Parisi', { shape: 'flask', glass: 'ceramic', color: '#141414', juice: '#3a2a1a', cap: 'boulder', capFin: 'black', label: 'print', decor: 'crackle', ink: '#e8e8e8' }, { style: 'sleeve', paper: '#141414', ink: '#e8e8e8', pattern: 'crackle' }),
    amouage: look('Amouage', { shape: 'bell', glass: 'crystal', color: '#fbf4e4', juice: '#c98a2e', cap: 'dome', capFin: 'gold', label: 'medallion', decor: 'moroccan', pfin: 'gold', ink: '#2a1e0e' }, { style: 'book', paper: '#f4ead2', ink: '#b8913e', pattern: 'moroccan', emblem: 'medallion', foil: true }),
  });
})();
