window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

/**
 * Frutiger Aqua — beach-vibe theme.
 *
 *  • drawBackground: a living seaside scene — sky-to-turquoise-sea gradient,
 *    a drifting sun with a shimmering glitter column, and layered animated
 *    wave lines with foam that brighten with the audio level.
 *  • drawRecord: translucent bubbles drift UP the disc face; CLICK a bubble
 *    to pop it (expanding ring + flying droplets), then a fresh one rises
 *    from the bottom. A soft specular gloss-bar arcs across the top.
 *
 * All drawing is in CSS px (ctx is already DPR-scaled — never multiply by
 * devicePixelRatio). The record canvas never rotates, so bubbles float in
 * screen space over the spinning disc.
 *
 * Degrades gracefully: if this module is absent the CSS tokens still render a
 * complete static theme (and the engine falls back to its default gradient
 * background). Bubbles, popping, and waves are pure enhancement.
 */
(function () {
  const BUBBLE_COUNT = 10;
  const POP_DUR = 0.45;          // seconds a pop burst lasts
  const DROPLETS = 7;            // droplets flung out per pop

  // ── shared state (closure scope, survives across frames) ──
  let smoothedPulse = 0;
  let lastT = performance.now();
  let lastDrawTs = 0;            // when drawRecord last ran → "am I active?"
  let bubbles = null;            // lazily built once we know the disc exists
  const geo = { pageCx: 0, pageCy: 0, radius: 0 };

  function rand(a, b) { return a + Math.random() * (b - a); }

  // A bubble's traits are stored as fractions of the disc radius so they stay
  // correct across window resizes. yFrac runs roughly +1.1 (below the disc) up
  // to -1.1 (above it); the bubble rises as yFrac decreases.
  function spawnBubble(fromBottom) {
    return {
      xFrac: rand(-1, 1),
      sizeFrac: rand(0.03, 0.09),
      speedFrac: rand(0.06, 0.16),
      yFrac: fromBottom ? rand(1.05, 1.7) : rand(-1.05, 1.05),
      wobAmp: rand(0, 0.05),
      wobFreq: rand(0.5, 1.7),
      wobPhase: rand(0, Math.PI * 2),
      popping: false,
      popT: 0,
      popSeed: 0,
      // last drawn local position (relative to disc centre) for hit-testing
      lx: 0, ly: 0, lr: 0
    };
  }

  function ensureBubbles() {
    if (bubbles) return;
    bubbles = [];
    for (let i = 0; i < BUBBLE_COUNT; i++) bubbles.push(spawnBubble(false));
  }

  // ── pop a bubble when the user clicks on (or very near) it ──
  function onPointerDown(e) {
    // Only react while this theme is actively drawing.
    if (performance.now() - lastDrawTs > 300 || !bubbles || geo.radius <= 0) return;
    const mx = e.clientX - geo.pageCx;
    const my = e.clientY - geo.pageCy;
    let hit = null;
    let hitDist = Infinity;
    for (const b of bubbles) {
      if (b.popping) continue;
      const dx = mx - b.lx;
      const dy = my - b.ly;
      const d = Math.hypot(dx, dy);
      // generous tap target: bubble radius + a small slack
      const reach = b.lr + geo.radius * 0.02;
      if (d <= reach && d < hitDist) { hit = b; hitDist = d; }
    }
    if (hit) {
      hit.popping = true;
      hit.popT = 0;
      hit.popSeed = Math.random();
      // capture pop origin so the burst stays put even as time advances
      hit.popX = hit.lx;
      hit.popY = hit.ly;
      hit.popR = hit.lr;
    }
  }
  window.addEventListener('mousedown', onPointerDown);

  // ════════════════════════════════════════════════════════════
  //  BACKGROUND — animated beach: sky, sea, sun, waves, glitter
  // ════════════════════════════════════════════════════════════
  function drawBackground({ ts, ctx, width, height, state }) {
    const w = width, h = height;
    const t = ts / 1000;
    const pulse = Math.max(0, Math.min(1,
      state && typeof state.groovePulse === 'number' ? state.groovePulse : 0));

    const horizon = h * 0.46;

    // 1) sky → sea vertical gradient
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0.00, '#bfeaff');   // upper sky
    g.addColorStop(0.30, '#e6f8ff');   // pale haze near the horizon
    g.addColorStop(0.46, '#8fe3ff');   // bright waterline
    g.addColorStop(0.60, '#34c0f5');   // shallow turquoise
    g.addColorStop(0.82, '#1273c2');   //
    g.addColorStop(1.00, '#06335a');   // deep water
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // 2) drifting sun glow high in the sky
    const sunX = w * (0.5 + 0.14 * Math.sin(t * 0.06));
    const sunY = h * 0.19;
    const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, h * 0.55);
    sun.addColorStop(0, 'rgba(255,255,255,0.65)');
    sun.addColorStop(0.18, 'rgba(223,246,255,0.40)');
    sun.addColorStop(0.5, 'rgba(159,255,180,0.06)'); // faint lime-aqua bloom
    sun.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, horizon * 1.5);
    ctx.globalCompositeOperation = 'source-over';

    // 3) bright foam line glowing along the horizon
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(w, horizon);
    ctx.strokeStyle = `rgba(255,255,255,${0.35 + pulse * 0.25})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 18;
    ctx.shadowColor = 'rgba(220,248,255,0.9)';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 4) sun-glitter column shimmering on the water below the sun
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 22; i++) {
      const f = i / 21;                       // 0 at horizon → 1 at bottom
      const y = horizon + (h - horizon) * (f * f);
      const spread = w * (0.015 + f * 0.10);
      const sx = sunX + Math.sin(t * 1.6 + i * 1.7) * spread;
      const len = w * (0.01 + f * 0.05);
      const a = (0.18 * (1 - f)) + pulse * 0.05;
      if (a <= 0.01) continue;
      ctx.beginPath();
      ctx.moveTo(sx - len, y);
      ctx.lineTo(sx + len, y);
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = 1 + f * 2;
      ctx.stroke();
    }
    ctx.restore();

    // 5) layered swells — each wave is a FILLED band drawn from its crest down
    //    to the bottom, back-to-front, so nearer waves overlap (occlude) the
    //    farther ones. That layering reads as real ocean depth. Crests are
    //    sharpened (pointier peaks, flatter troughs) and capped with foam.
    ctx.save();
    ctx.lineCap = 'round';
    const WAVES = 7;
    const step = Math.max(5, Math.floor(w / 260));
    for (let i = 0; i < WAVES; i++) {
      const f = i / (WAVES - 1);                       // 0 back/horizon → 1 front
      const baseY = horizon + (h - horizon) * (0.12 + f * f * 0.95);
      if (baseY > h + 60) continue;
      const amp = 3 + f * 22;
      const wl = 90 + f * 240;
      const phase = t * (0.35 + f * 0.8) + i * 1.7;

      // crest height = sum of three octaves, then sharpened
      const crest = (x) => {
        const s1 = Math.sin((x / wl) * Math.PI * 2 + phase);
        const s2 = Math.sin((x / (wl * 0.45)) * Math.PI * 2 + phase * 1.6 + 1.3);
        const s3 = Math.sin((x / (wl * 2.1)) * Math.PI * 2 - phase * 0.5);
        let s = s1 * 0.6 + s2 * 0.22 + s3 * 0.45;
        s = Math.sign(s) * Math.pow(Math.abs(s), 1.4); // pointier crests
        return baseY + s * amp;
      };

      // filled water band (occludes farther waves); deeper/greener up front
      ctx.beginPath();
      ctx.moveTo(0, crest(0));
      for (let x = step; x <= w; x += step) ctx.lineTo(x, crest(x));
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const cr = Math.round(20 + (1 - f) * 90);
      const cg = Math.round(150 + (1 - f) * 80);
      const cb = Math.round(200 + (1 - f) * 40);
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.16 + f * 0.16})`;
      ctx.fill();

      // glowing foam crest along the top of the band
      ctx.beginPath();
      ctx.moveTo(0, crest(0));
      for (let x = step; x <= w; x += step) ctx.lineTo(x, crest(x));
      ctx.strokeStyle = `rgba(255,255,255,${0.16 + f * 0.34 + pulse * 0.1})`;
      ctx.lineWidth = 1 + f * 1.8;
      if (f > 0.45) {                                   // wet glow on near waves only
        ctx.shadowBlur = 4 + f * 8;
        ctx.shadowColor = 'rgba(235,250,255,0.85)';
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // safety: leave global canvas state clean
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // ════════════════════════════════════════════════════════════
  //  RECORD — drifting + poppable bubbles, plus a gloss-bar
  // ════════════════════════════════════════════════════════════
  function drawRecord({ angle, record, ctx, state, defaults }) {
    // 1) base disc + grooves + label
    defaults.drawRecord(angle);

    const { cx, cy, radius } = record;
    lastDrawTs = performance.now();
    geo.pageCx = (typeof record.pageCx === 'number') ? record.pageCx : cx;
    geo.pageCy = (typeof record.pageCy === 'number') ? record.pageCy : cy;
    geo.radius = radius;
    ensureBubbles();

    // time + frame-rate-independent dt
    const nowMs = performance.now();
    let dt = (nowMs - lastT) / 1000;
    lastT = nowMs;
    if (!(dt > 0) || dt > 0.1) dt = 0.016;
    const now = nowMs / 1000;

    const rawPulse = Math.max(0, Math.min(1,
      state && typeof state.groovePulse === 'number' ? state.groovePulse : 0));
    smoothedPulse += (rawPulse - smoothedPulse) * Math.min(1, dt * 12);
    const pulse = smoothedPulse;

    ctx.save();
    ctx.translate(cx, cy);

    // clip to the disc so nothing bleeds past the edge
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.985, 0, Math.PI * 2);
    ctx.clip();

    // ── bubbles (float in screen space — do NOT rotate) ──
    const riseBoost = 1 + pulse * 0.9;

    for (const b of bubbles) {
      if (b.popping) {
        // advance + draw the pop burst, then respawn from the bottom
        b.popT += dt;
        const p = b.popT / POP_DUR;          // 0..1
        if (p >= 1) { Object.assign(b, spawnBubble(true)); continue; }
        drawPop(ctx, b, p, radius);
        continue;
      }

      // rise; wrap to the bottom once fully above the disc
      b.yFrac -= b.speedFrac * dt * riseBoost;
      if (b.yFrac < -1.12) { Object.assign(b, spawnBubble(true)); continue; }

      const drift = Math.sin(now * b.wobFreq + b.wobPhase) * b.wobAmp;
      const x = (b.xFrac + drift) * radius * 0.86;
      const y = b.yFrac * radius;
      const size = b.sizeFrac * radius * (1 + pulse * 0.35);

      // remember where we drew it for click hit-testing
      b.lx = x; b.ly = y; b.lr = size;

      // soft radial fill: bright translucent core → transparent
      const fill = ctx.createRadialGradient(x, y, 0, x, y, size);
      fill.addColorStop(0, 'rgba(255,255,255,0.10)');
      fill.addColorStop(0.55, 'rgba(180,235,255,0.05)');
      fill.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      // bright top-left rim arc — light catching the upper edge
      ctx.beginPath();
      ctx.arc(x, y, size * 0.92, Math.PI * 1.05, Math.PI * 1.75);
      ctx.strokeStyle = `rgba(255,255,255,${0.30 + pulse * 0.25})`;
      ctx.lineWidth = Math.max(1, radius * 0.004);
      ctx.lineCap = 'round';
      ctx.stroke();

      // tiny inner specular dot for a "wet" sparkle
      ctx.beginPath();
      ctx.arc(x - size * 0.30, y - size * 0.32, Math.max(0.8, size * 0.10), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();
    }

    // ── moving specular gloss-bar arcing across the TOP of the disc ──
    const sweep = now * 0.18;
    const glossAngle = -Math.PI / 2 + Math.sin(sweep) * 0.7;
    const glossR = radius * 0.50;
    const gx = Math.cos(glossAngle) * glossR;
    const gy = Math.sin(glossAngle) * glossR;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(gx, gy);
    ctx.rotate(glossAngle + Math.PI / 2);
    ctx.scale(1, 0.32);
    const gloss = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.62);
    gloss.addColorStop(0, `rgba(255,255,255,${0.16 + pulse * 0.06})`);
    gloss.addColorStop(0.5, 'rgba(210,240,255,0.05)');
    gloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = gloss;
    ctx.fill();
    ctx.restore();

    ctx.restore(); // undo clip + translate

    // safety: clean global state for the next drawer
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // expanding ring + flying droplets for a popped bubble
  function drawPop(ctx, b, p, radius) {
    const ease = 1 - (1 - p) * (1 - p);    // ease-out
    const x = b.popX, y = b.popY, base = b.popR || radius * 0.05;
    const fade = 1 - p;

    // expanding splash ring
    ctx.beginPath();
    ctx.arc(x, y, base * (0.6 + ease * 2.4), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.55 * fade})`;
    ctx.lineWidth = Math.max(1, radius * 0.006 * (1 - p));
    ctx.stroke();

    // a brief central flash
    const flash = ctx.createRadialGradient(x, y, 0, x, y, base * 1.2);
    flash.addColorStop(0, `rgba(220,250,255,${0.4 * fade})`);
    flash.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(x, y, base * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = flash;
    ctx.fill();

    // droplets flung outward
    for (let k = 0; k < DROPLETS; k++) {
      const a = (k / DROPLETS) * Math.PI * 2 + b.popSeed * Math.PI * 2;
      const dist = base * (0.5 + ease * 3.2);
      const dx = x + Math.cos(a) * dist;
      const dy = y + Math.sin(a) * dist;
      const dr = Math.max(0.8, base * 0.18 * (1 - p));
      ctx.beginPath();
      ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.7 * fade})`;
      ctx.fill();
    }
  }

  window.MYNYL_THEME_MODULES['frutiger-aqua'] = { drawBackground, drawRecord };
})();
