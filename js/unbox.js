/* Sillage — unboxing. Every new bottle arrives in its house's retail box:
 * the box drops onto a velvet plinth, you tap it, the lid flies off and the
 * bottle rises out on a column of light. Rarer bottles get a bigger reveal.
 */
const Unbox = (() => {
  const W = 0.95, D = 0.72, HB = 1.05, HL = 0.34, IN_SCALE = 0.8, OUT_SCALE = 1.0;
  const RAYS = { value: 6, designer: 9, niche: 12, luxury: 16, haute: 22, legendary: 28 };
  const SPARKS = { value: 40, designer: 70, niche: 110, luxury: 160, haute: 240, legendary: 320 };
  let T, L, renderer, scene, camera, root, host, canvas;
  let ok = false, tried = false, active = false, raf = 0, last = 0;
  let cur = null; const queue = [];
  let rays, halo, sparks, mist, spot, rim, plinthRing;
  let cb = {};
  const esc = (v) => String(v).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const bounce = (k) => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375; return n * (k -= 2.625 / d) * k + 0.984375; };

  function init() {
    tried = true;
    T = window.THREE; L = typeof Showroom !== 'undefined' && Showroom.lib;
    root = document.getElementById('unbox'); host = root.querySelector('.unbox-stage');
    if (!T || !L) return false;
    try { renderer = new T.WebGLRenderer({ antialias: true }); } catch (e) { return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    canvas = renderer.domElement; canvas.className = 'unbox-canvas';
    host.appendChild(canvas);

    scene = new T.Scene();
    scene.background = L.col('#080605');
    scene.environment = L.buildEnvironment(renderer);
    camera = new T.PerspectiveCamera(40, 1, 0.05, 40);

    scene.add(new T.HemisphereLight('#ffe8cc', '#100a07', 0.45));
    spot = new T.SpotLight('#ffe2bb', 3.4, 12, 0.5, 0.7, 1.2); spot.position.set(0.6, 5, 2.2); spot.target.position.set(0, 0.8, 0); scene.add(spot, spot.target);
    rim = new T.PointLight('#ffd08a', 0, 6, 1.4); rim.position.set(0, 1.6, -1.2); scene.add(rim);
    const fill = new T.PointLight('#9fc2ff', 0.35, 8, 1.5); fill.position.set(-2.2, 1.4, 1.5); scene.add(fill);

    // Velvet plinth with a brass rim.
    const velvet = new T.MeshStandardMaterial({ color: L.col('#3a0f18'), roughness: 0.92, metalness: 0 });
    const plinth = new T.Mesh(new T.CylinderGeometry(1.75, 1.85, 0.32, 96), velvet); plinth.position.y = -0.16; scene.add(plinth);
    plinthRing = new T.Mesh(new T.TorusGeometry(1.75, 0.018, 8, 160), new T.MeshStandardMaterial({ color: L.col('#c79a55'), metalness: 1, roughness: 0.25 }));
    plinthRing.rotation.x = Math.PI / 2; scene.add(plinthRing);
    const pool = new T.Mesh(new T.PlaneGeometry(5, 5), new T.MeshBasicMaterial({ map: L.radialTexture([[0, 'rgba(255,214,160,0.3)'], [0.5, 'rgba(255,190,120,0.06)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.003; scene.add(pool);

    // Light rays fanning out behind the bottle.
    rays = new T.Group(); rays.position.set(0, 1.75, -0.7); scene.add(rays);
    halo = new T.Sprite(new T.SpriteMaterial({ map: L.radialTexture([[0, 'rgba(255,255,255,0.9)'], [0.3, 'rgba(255,255,255,0.22)'], [1, 'rgba(255,255,255,0)']]), transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0 }));
    halo.scale.set(2.6, 2.6, 1); halo.position.set(0, 1.75, -0.4); scene.add(halo);

    // Sparkle burst out of the box.
    const N = 340, pos = new Float32Array(N * 3);
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    sparks = new T.Points(g, new T.PointsMaterial({ size: 0.06, map: L.radialTexture([[0, 'rgba(255,250,235,1)'], [0.25, 'rgba(255,220,150,0.8)'], [1, 'rgba(255,200,120,0)']]), transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: L.col('#ffd98f'), opacity: 0 }));
    sparks.frustumCulled = false; sparks.userData.v = new Float32Array(N * 3); sparks.userData.n = 0; scene.add(sparks);

    mist = L.createMist(360); scene.add(mist.points);

    canvas.addEventListener('click', () => { if (cur && (cur.phase === 'wait' || cur.phase === 'drop')) open(); });
    new ResizeObserver(resize).observe(host);
    ok = true;
    return true;
  }

  function resize() {
    if (!renderer) return;
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.fov = w / h < 1 ? 58 : 40; camera.updateProjectionMatrix();
    mist.setPixelRatio(renderer.getPixelRatio() * (h / 900));
  }

  /* ---------- the box ---------- */
  function lum(hex) { const c = new T.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; }

  function boxFace(item, kind) {
    const h = HOUSE_BY_ID[item.house];
    const c = document.createElement('canvas'); c.width = 512; c.height = kind === 'top' ? 390 : 512;
    const g = c.getContext('2d');
    g.fillStyle = h.lbg; g.fillRect(0, 0, c.width, c.height);
    const gold = item.tier === 'legendary' || item.tier === 'haute';
    g.strokeStyle = gold ? '#d8ae54' : h.lfg; g.globalAlpha = gold ? 0.95 : 0.5; g.lineWidth = gold ? 6 : 3;
    g.strokeRect(22, 22, c.width - 44, c.height - 44); g.globalAlpha = 1;
    g.fillStyle = h.lfg; g.textAlign = 'center'; g.textBaseline = 'middle';
    const fit = (text, weight, size, maxW, family) => {
      let s = size; g.font = `${weight} ${s}px ${family}`;
      while (g.measureText(text).width > maxW && s > 14) { s -= 2; g.font = `${weight} ${s}px ${family}`; }
      return s;
    };
    const serif = '"Bodoni Moda", Didot, "Bodoni 72", Georgia, serif';
    const sans = 'Jost, Futura, "Century Gothic", sans-serif';
    if (kind === 'top') {
      fit(h.name.toUpperCase(), 600, 64, 420, serif); g.fillText(h.name.toUpperCase(), 256, 170);
      g.font = `500 20px ${sans}`; g.globalAlpha = 0.75; g.fillText(h.origin.toUpperCase(), 256, 240); g.globalAlpha = 1;
    } else {
      g.font = `500 22px ${sans}`; g.globalAlpha = 0.8; g.fillText(h.name.toUpperCase(), 256, 120); g.globalAlpha = 1;
      // Wrap long fragrance names onto two lines.
      const words = item.name.split(' '); let l1 = item.name, l2 = '';
      g.font = `italic 500 52px ${serif}`;
      if (g.measureText(item.name).width > 420 && words.length > 1) {
        let best = 1, bestW = Infinity;
        for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '); const w = Math.max(g.measureText(a).width, g.measureText(b).width); if (w < bestW) { bestW = w; best = i; } }
        l1 = words.slice(0, best).join(' '); l2 = words.slice(best).join(' ');
      }
      if (l2) { const s = Math.min(fit(l1, 'italic 500', 52, 420, serif), fit(l2, 'italic 500', 52, 420, serif)); g.font = `italic 500 ${s}px ${serif}`; g.fillText(l1, 256, 236); g.fillText(l2, 256, 236 + s * 1.1); }
      else { fit(l1, 'italic 500', 56, 420, serif); g.fillText(l1, 256, 260); }
      g.font = `500 18px ${sans}`; g.globalAlpha = 0.7;
      g.fillText('100 ml ℮ 3.4 FL. OZ.', 256, 430); g.globalAlpha = 1;
    }
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8;
    return t;
  }

  function buildBox(item) {
    const h = HOUSE_BY_ID[item.house];
    const gold = item.tier === 'legendary' || item.tier === 'haute';
    const plain = new T.MeshStandardMaterial({ color: L.col(h.lbg), roughness: gold ? 0.35 : 0.6, metalness: gold ? 0.35 : 0.05, side: T.DoubleSide });
    const hide = new T.MeshBasicMaterial({ visible: false });
    const front = new T.MeshStandardMaterial({ map: boxFace(item, 'front'), roughness: 0.5 });
    const top = new T.MeshStandardMaterial({ map: boxFace(item, 'top'), roughness: 0.45 });
    const satin = new T.MeshStandardMaterial({ color: L.col(lum(h.lbg) > 0.35 ? '#141012' : '#efe2cc'), roughness: 0.32, metalness: 0.25, side: T.BackSide });
    const group = new T.Group();
    // BoxGeometry faces: +x, -x, +y, -y, +z, -z.
    const base = new T.Mesh(new T.BoxGeometry(W, HB, D), [plain, plain, hide, plain, front, plain]); base.position.y = HB / 2;
    const lining = new T.Mesh(new T.BoxGeometry(W - 0.04, HB - 0.02, D - 0.04), satin); lining.position.y = HB / 2 + 0.01;
    const lid = new T.Mesh(new T.BoxGeometry(W + 0.04, HL, D + 0.04), [plain, plain, top, hide, plain, plain]);
    const lidRest = HB + 0.1 - HL / 2; lid.position.y = lidRest;
    group.add(base, lining, lid);
    return { group, lid, lidRest, mats: [plain, hide, front, top, satin] };
  }

  function buildRays(item) {
    rays.children.slice().forEach((r) => { rays.remove(r); r.geometry.dispose(); r.material.dispose(); });
    const n = RAYS[item.tier] || 8;
    const color = item.tier === 'legendary' || item.tier === 'haute' ? '#fff0c8' : FAMILIES[item.family].color;
    for (let i = 0; i < n; i++) {
      const len = 2.4 + Math.random() * 1.6, wid = 0.08 + Math.random() * 0.16;
      const geo = new T.PlaneGeometry(wid, len); geo.translate(0, len / 2, 0);
      const mat = new T.ShaderMaterial({
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
        uniforms: { color: { value: L.col(color) }, opacity: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: 'uniform vec3 color; uniform float opacity; varying vec2 vUv; void main(){ float a=pow(1.0-vUv.y,1.6)*sin(vUv.x*3.14159)*opacity; gl_FragColor=vec4(color,a); }',
      });
      const m = new T.Mesh(geo, mat); m.rotation.z = (i / n) * Math.PI * 2 + Math.random() * 0.2; m.userData.base = 0.25 + Math.random() * 0.35;
      rays.add(m);
    }
  }

  function burst(item) {
    const n = SPARKS[item.tier] || 60;
    const p = sparks.geometry.attributes.position.array, v = sparks.userData.v;
    for (let i = 0; i < p.length / 3; i++) {
      if (i < n) {
        p[i * 3] = (Math.random() - 0.5) * W * 0.8; p[i * 3 + 1] = HB; p[i * 3 + 2] = (Math.random() - 0.5) * D * 0.8;
        const a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 1.6;
        v[i * 3] = Math.cos(a) * sp * 0.6; v[i * 3 + 1] = 2 + Math.random() * 2.6; v[i * 3 + 2] = Math.sin(a) * sp * 0.6;
      } else { p[i * 3 + 1] = -50; v[i * 3] = v[i * 3 + 1] = v[i * 3 + 2] = 0; }
    }
    sparks.geometry.attributes.position.needsUpdate = true;
    sparks.userData.t = 0; sparks.material.opacity = 1;
    sparks.material.color.copy(L.col(item.tier === 'legendary' || item.tier === 'haute' ? '#ffe2a0' : FAMILIES[item.family].color).lerp(new T.Color('#ffffff'), 0.4));
  }

  /* ---------- sequence ---------- */
  function play(item, info, callbacks) {
    if (!tried && !init()) return false;
    if (!ok) return false;
    queue.push({ item, info: info || {}, cb: callbacks || {} });
    // Box art is drawn on canvas with the web fonts, so wait for them on the first delivery.
    Promise.resolve(L.fontsReady).then(() => { if (!cur && queue.length) next(); });
    return true;
  }

  function next() {
    const job = queue.shift();
    if (!job) { stop(); return; }
    const { item, info } = job; cb = job.cb;
    if (cur) teardown();
    const box = buildBox(item);
    const bottle = L.makeBottle(item).group;
    bottle.scale.setScalar(IN_SCALE); bottle.position.y = 0.04; bottle.visible = false;
    box.group.add(bottle);
    scene.add(box.group);
    box.group.position.y = 3.4; box.group.rotation.y = -1.8;
    buildRays(item);
    halo.material.color.copy(L.col(FAMILIES[item.family].color)).lerp(new T.Color('#ffffff'), 0.4); halo.material.opacity = 0;
    rim.color.copy(L.col(FAMILIES[item.family].color)); rim.intensity = 0;
    cur = { item, info, box, bottle, phase: 'drop', t: 0, ty: 0.75 };
    renderCard(item, info);
    root.hidden = false; root.classList.remove('leaving');
    document.body.classList.add('unboxing');
    resize();
    if (!active) { active = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    SFX.play('whoosh');
  }

  function renderCard(item, info) {
    const h = HOUSE_BY_ID[item.house];
    root.querySelector('#ub-eyebrow').textContent = `A delivery from ${h.name}`;
    root.querySelector('#ub-prompt').hidden = true;
    root.querySelector('#ub-actions').hidden = true;
    const card = root.querySelector('#ub-card'); card.hidden = true; card.classList.remove('show');
    card.innerHTML = `<p class="eyebrow">${item.tier === 'legendary' ? 'Legendary acquisition' : 'New on your shelf'}</p>
      <p class="house">${esc(h.name)} · ${esc(h.origin)}</p>
      <h2>${esc(item.name)}</h2>
      <p class="tags"><span class="fam fam-${item.family}">${FAMILIES[item.family].label}</span><span class="tier">${TIERS[item.tier].label}</span>${item.disc ? '<span class="tier vint">Discontinued</span>' : ''}</p>
      ${info.batch ? `<p class="batch">Batch ${info.batch}${info.paid != null ? ' · Paid $' + Math.round(info.paid).toLocaleString('en-US') : ''}</p>` : ''}`;
    if (cb.onWearState) cb.onWearState(item);
  }

  function open() {
    if (!cur || cur.phase === 'open' || cur.phase === 'rise' || cur.phase === 'show') return;
    if (cur.phase === 'drop') { cur.box.group.position.y = 0; cur.box.group.rotation.y = -0.4; }
    cur.phase = 'open'; cur.t = 0;
    root.querySelector('#ub-prompt').hidden = true;
    SFX.play('lidpop'); setTimeout(() => SFX.play('rustle'), 120);
  }

  function spray() {
    if (!cur || cur.phase !== 'show') return false;
    const top = cur.bottle.userData.top * OUT_SCALE;
    const origin = new T.Vector3(0, cur.bottle.position.y + cur.box.group.position.y + top - 0.04, 0.12);
    const dir = new T.Vector3(camera.position.x, 0, camera.position.z).normalize();
    mist.emit(origin, dir, cur.item.family, 200);
    cur.kick = 0.35;
    return true;
  }

  function close() {
    if (!cur) return;
    root.classList.add('leaving');
    const done = cur.cb && cur.cb.onClose;
    setTimeout(() => { teardown(); if (queue.length) next(); else stop(); }, 380);
    if (done) done();
  }

  function teardown() {
    if (!cur) return;
    scene.remove(cur.box.group);
    // Box geometry and box materials are per-delivery; bottle geometry/materials are shared caches.
    cur.box.group.children.forEach((m) => { if (m !== cur.bottle && m.geometry) m.geometry.dispose(); });
    cur.box.mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
    cur = null;
  }

  function stop() {
    active = false; cancelAnimationFrame(raf);
    root.hidden = true; root.classList.remove('leaving');
    document.body.classList.remove('unboxing');
  }

  /* ---------- loop ---------- */
  function frame(now) {
    if (!active) return;
    raf = requestAnimationFrame(frame);
    // A looser clamp than the showroom so the sequence still finishes on slow devices.
    const dt = Math.min(0.1, (now - last) / 1000 || 0.016); last = now;
    const c = cur;
    if (c) {
      c.t += dt;
      const g = c.box.group;
      if (c.phase === 'drop') {
        const k = Math.min(1, c.t / 1.15);
        g.position.y = 3.4 * (1 - bounce(k)); g.rotation.y = -1.8 + 1.4 * easeOut(k);
        if (!c.landed && k > 0.36) { c.landed = true; SFX.play('thud'); }
        if (k >= 1) { c.phase = 'wait'; c.t = 0; root.querySelector('#ub-prompt').hidden = false; }
      } else if (c.phase === 'wait') {
        // Anticipation: the lid twitches now and then.
        const w = c.t % 1.6;
        c.box.lid.position.y = c.box.lidRest + (w < 0.25 ? Math.sin(w / 0.25 * Math.PI) * 0.03 : 0);
        c.box.lid.rotation.z = w < 0.25 ? Math.sin(w / 0.25 * Math.PI * 2) * 0.02 : 0;
        if (c.t > 6) open();
      } else if (c.phase === 'open') {
        const k = Math.min(1, c.t / 1.1);
        g.rotation.y += (0 - g.rotation.y) * Math.min(1, dt * 5);
        const lid = c.box.lid;
        if (k < 0.28) {
          const q = k / 0.28; lid.position.y = c.box.lidRest + easeOut(q) * 0.22; lid.rotation.z = Math.sin(q * Math.PI * 3) * 0.04;
        } else {
          const q = ease((k - 0.28) / 0.72);
          lid.position.set(q * 1.5, c.box.lidRest + 0.22 + Math.sin(q * Math.PI) * 0.9 - q * (c.box.lidRest + 0.22 - 0.12), q * 0.5);
          lid.rotation.set(q * 0.3, 0, -q * 2.9);
          if (!c.burst) { c.burst = true; c.bottle.visible = true; burst(c.item); SFX.play('shimmer'); SFX.play('whoosh'); }
        }
        rim.intensity = k * 2.2;
        if (k >= 1) {
          c.phase = 'rise'; c.t = 0;
          SFX.play('reveal');
          if (['luxury', 'haute', 'legendary'].includes(c.item.tier)) setTimeout(() => SFX.play('unlock'), 350);
        }
      } else if (c.phase === 'rise') {
        const k = Math.min(1, c.t / 1.7); const e = ease(k);
        c.bottle.position.y = 0.04 + e * (HB + 0.2);
        c.bottle.scale.setScalar(IN_SCALE + (OUT_SCALE - IN_SCALE) * e);
        c.bottle.rotation.y = e * Math.PI * 2;
        c.ty = 0.75 + e * 0.75;
        halo.material.opacity = e * 0.85;
        rays.children.forEach((r) => { r.material.uniforms.opacity.value = r.userData.base * e; });
        if (k >= 1) {
          c.phase = 'show'; c.t = 0;
          const card = root.querySelector('#ub-card'); card.hidden = false; void card.offsetWidth; card.classList.add('show');
          root.querySelector('#ub-actions').hidden = false;
        }
      } else if (c.phase === 'show') {
        c.bottle.rotation.y += dt * 0.6;
        c.bottle.position.y = HB + 0.24 + Math.sin(c.t * 1.6) * 0.03 - (c.kick ? Math.sin((0.35 - c.kick) / 0.35 * Math.PI) * 0.04 : 0);
        if (c.kick) c.kick = Math.max(0, c.kick - dt);
        rays.children.forEach((r) => { r.material.uniforms.opacity.value = r.userData.base * (0.85 + Math.sin(c.t * 2 + r.rotation.z * 3) * 0.15); });
      }
      halo.position.y = c.bottle.position.y + 0.55;
      rays.position.y = c.bottle.position.y + 0.55;
    }
    rays.rotation.z += dt * 0.12;

    // Sparkles fall under gravity and fade.
    if (sparks.material.opacity > 0) {
      const p = sparks.geometry.attributes.position.array, v = sparks.userData.v;
      sparks.userData.t += dt;
      for (let i = 0; i < p.length; i += 3) {
        v[i + 1] -= dt * 2.6; v[i] *= Math.pow(0.6, dt); v[i + 2] *= Math.pow(0.6, dt);
        p[i] += v[i] * dt; p[i + 1] += v[i + 1] * dt; p[i + 2] += v[i + 2] * dt;
      }
      sparks.geometry.attributes.position.needsUpdate = true;
      sparks.material.opacity = Math.max(0, 1 - sparks.userData.t / 2.6);
      sparks.material.size = 0.05 + Math.sin(sparks.userData.t * 30) * 0.012;
    }
    mist.update(dt);

    // Camera: slow drift around the plinth.
    const ty = c ? c.ty : 0.75;
    const portrait = camera.aspect < 1;
    const dist = portrait ? 5.6 : 4.3;
    const yaw = Math.sin(now * 0.00018) * 0.22;
    camera.position.set(Math.sin(yaw) * dist, ty + 0.75, Math.cos(yaw) * dist);
    camera.lookAt(0, ty, 0);
    renderer.render(scene, camera);
  }

  return {
    play, open, spray, close,
    get item() { return cur ? cur.item : null; },
    get busy() { return !!cur; },
    skip() { if (cur) { queue.length = 0; close(); } },
  };
})();
