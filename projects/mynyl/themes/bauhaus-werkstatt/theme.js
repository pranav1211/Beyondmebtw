(function () {
  "use strict";

  window.MYNYL_THEME_MODULES = window.MYNYL_THEME_MODULES || {};

  // ── Bauhaus primary palette (flat, hard-edged, zero gloss) ──
  const RED    = "#d6332a";
  const BLUE   = "#1f4ea1";
  const YELLOW = "#f0b81e";
  const INK    = "#1a1815";
  const PALETTE = [RED, BLUE, YELLOW, INK];

  // ─────────────────────────────────────────────────────────────
  //  GOAL A — Richer vinyl: more shapes spinning WITH the grooves
  // ─────────────────────────────────────────────────────────────
  // Persistent closure state for the smooth audio scale-pop.
  let popDisc = 0;
  let lastDisc = performance.now();

  function drawRecord({ angle, record, ctx, state, defaults }) {
    // 1) Paint the base disc + (now clearly visible) classic grooves + label.
    defaults.drawRecord(angle);

    const { cx, cy, radius } = record;
    const R = radius;
    const labelEdge = R * 0.24; // shapes must stay outside the centre label

    // ── Smooth the audio pulse into a 0..1 "pop" value ──
    const now = performance.now();
    let dt = (now - lastDisc) / 1000;
    lastDisc = now;
    if (!(dt > 0) || dt > 0.1) dt = 1 / 60; // clamp pauses / first frame
    const target = Math.max(0, Math.min(1,
      state && typeof state.groovePulse === "number" ? state.groovePulse : 0));
    const k = 1 - Math.exp(-12 * dt);       // ~12/s response
    popDisc += (target - popDisc) * k;
    const scale = 1 + popDisc * 0.04;       // 1.00 → ~1.04

    ctx.save();
    ctx.translate(cx, cy);
    // The on-disc shapes are now a PRINTED PATTERN: rotate them WITH the disc
    // so they spin together with the visible grooves as one composition.
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Flat hard-edged fills only: no shadows, no gradients, no glow.
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    ctx.lineJoin = "miter";

    // ── (a) Large RED quarter-circle pie slice, upper-left band ──
    {
      const pieR  = R * 0.36;
      const pieCx = -R * 0.10;
      const pieCy = -R * 0.06;
      const a0 = Math.PI * 0.62;
      const a1 = a0 + Math.PI / 2;          // exact quarter circle
      ctx.fillStyle = RED;
      ctx.beginPath();
      ctx.moveTo(pieCx, pieCy);
      ctx.arc(pieCx, pieCy, pieR, a0, a1, false);
      ctx.closePath();
      ctx.fill();
    }

    // ── (b) BLUE triangle, lower-right, hard flat fill ──
    {
      const tx = R * 0.30, ty = R * 0.18, tS = R * 0.30;
      ctx.fillStyle = BLUE;
      ctx.beginPath();
      ctx.moveTo(tx,             ty - tS * 0.55);
      ctx.lineTo(tx + tS * 0.62, ty + tS * 0.50);
      ctx.lineTo(tx - tS * 0.58, ty + tS * 0.42);
      ctx.closePath();
      ctx.fill();
    }

    // ── (c) YELLOW bar at a constructivist tilt, upper-right band ──
    {
      ctx.save();
      ctx.rotate(-Math.PI / 5);             // local tilt within the disc frame
      const barW = R * 0.50, barH = R * 0.085;
      const barX = R * 0.02,  barY = -R * 0.30;
      ctx.fillStyle = YELLOW;
      ctx.fillRect(barX, barY - barH / 2, barW, barH);
      ctx.restore();
    }

    // ── (d) NEW: solid BLUE dot, lower-left, printed on the groove field ──
    {
      const dotR = R * 0.085;
      const dotX = -R * 0.40;
      const dotY = R * 0.34;
      ctx.fillStyle = BLUE;
      ctx.beginPath();
      ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }

    // ── (e) NEW: small RED bar, upper area, hard rectangle ──
    {
      ctx.save();
      ctx.rotate(Math.PI / 8);
      const sbW = R * 0.26, sbH = R * 0.055;
      ctx.fillStyle = RED;
      ctx.fillRect(-R * 0.46, -R * 0.30, sbW, sbH);
      ctx.restore();
    }

    // ── (f) NEW: small YELLOW triangle, left band ──
    {
      const yx = -R * 0.40, yy = -R * 0.02, yS = R * 0.18;
      ctx.fillStyle = YELLOW;
      ctx.beginPath();
      ctx.moveTo(yx,             yy - yS * 0.55);
      ctx.lineTo(yx + yS * 0.55, yy + yS * 0.45);
      ctx.lineTo(yx - yS * 0.55, yy + yS * 0.45);
      ctx.closePath();
      ctx.fill();
    }

    // ── (g) NEW: INK quarter-ring / arc sweeping the lower band ──
    {
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(2, R * 0.022);
      ctx.lineCap = "butt";
      ctx.beginPath();
      ctx.arc(0, 0, R * 0.52, Math.PI * 0.18, Math.PI * 0.62, false);
      ctx.stroke();
    }

    // ── (h) Thin INK accent rule for structure ──
    {
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(1.5, R * 0.008);
      ctx.beginPath();
      ctx.moveTo(-R * 0.42, R * 0.40);
      ctx.lineTo( R * 0.30, R * 0.40);
      ctx.stroke();
    }

    // ── Crisp ink ring at the label boundary to frame the centre. ──
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, R * 0.006);
    ctx.beginPath();
    ctx.arc(0, 0, labelEdge, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Hygiene: never leak state to the next frame / next theme.
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
  }

  // ─────────────────────────────────────────────────────────────
  //  GOAL B — Floating Bauhaus background + click multiply / reflow
  // ─────────────────────────────────────────────────────────────
  // Shape kinds drawn flat with hard edges.
  const KINDS = ["circle", "triangle", "bar", "quarter"];

  const BASE_COUNT = 14;   // starting number of floating shapes
  const MAX_COUNT  = 48;   // hard cap before the next click loops/resets

  // Arrangement modes cycled on each click.
  const MODES = ["scatter", "grid", "ring", "stripes"];
  let modeIndex = 0;

  let shapes = [];         // closure-scoped pool of floating shapes
  let lastBg = performance.now();
  let lastBgTs = 0;        // last time drawBackground actually ran (active guard)
  let seededViewport = { w: 0, h: 0 };

  // Deterministic pseudo-random helper for stable per-shape traits.
  function rand() { return Math.random(); }
  function pick(arr) { return arr[(rand() * arr.length) | 0]; }

  function makeShape(w, h) {
    return {
      kind: pick(KINDS),
      color: pick(PALETTE),
      size: 24 + rand() * 70,
      // current position
      x: rand() * w,
      y: rand() * h,
      // target position (eased toward)
      tx: rand() * w,
      ty: rand() * h,
      // rotation + slow spin
      rot: rand() * Math.PI * 2,
      spin: (rand() - 0.5) * 0.5,         // rad/s
      // slow drift velocity (px/s)
      vx: (rand() - 0.5) * 16,
      vy: (rand() - 0.5) * 16,
    };
  }

  function ensureCount(n, w, h) {
    while (shapes.length < n) shapes.push(makeShape(w, h));
    if (shapes.length > n) shapes.length = n;
  }

  // Assign new target positions for the whole pool based on an arrangement.
  function reassignTargets(mode, w, h) {
    const n = shapes.length;
    const m = Math.max(1, n);
    const cols = Math.ceil(Math.sqrt(m));
    const rows = Math.ceil(m / cols);
    const cx = w / 2, cy = h / 2;
    const ringR = Math.min(w, h) * 0.36;

    for (let i = 0; i < n; i++) {
      const s = shapes[i];
      if (mode === "grid") {
        const r = (i / cols) | 0;
        const c = i % cols;
        s.tx = ((c + 0.5) / cols) * w;
        s.ty = ((r + 0.5) / rows) * h;
      } else if (mode === "ring") {
        const a = (i / m) * Math.PI * 2;
        s.tx = cx + Math.cos(a) * ringR;
        s.ty = cy + Math.sin(a) * ringR;
      } else if (mode === "stripes") {
        // Diagonal stripes: lanes across the viewport.
        const lanes = 5;
        const lane = i % lanes;
        const t = (i / m);
        s.tx = (t * 1.4 - 0.2) * w;
        s.ty = ((lane + 0.5) / lanes) * h + (rand() - 0.5) * 40;
      } else {
        // scatter
        s.tx = rand() * w;
        s.ty = rand() * h;
      }
      // Fresh slow motion so the new pattern keeps drifting.
      s.vx = (rand() - 0.5) * 16;
      s.vy = (rand() - 0.5) * 16;
      s.spin = (rand() - 0.5) * 0.5;
    }
  }

  // Draw one flat, hard-edged Bauhaus shape at the origin (pre-translated).
  function paintShape(ctx, s) {
    const z = s.size;
    ctx.fillStyle = s.color;
    if (s.kind === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, z * 0.5, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    } else if (s.kind === "triangle") {
      ctx.beginPath();
      ctx.moveTo(0, -z * 0.58);
      ctx.lineTo(z * 0.55, z * 0.46);
      ctx.lineTo(-z * 0.55, z * 0.46);
      ctx.closePath();
      ctx.fill();
    } else if (s.kind === "bar") {
      ctx.fillRect(-z * 0.6, -z * 0.16, z * 1.2, z * 0.32);
    } else { // quarter-circle
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, z * 0.62, 0, Math.PI / 2, false);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawBackground({ ts, ctx, width, height, defaults }) {
    // 1) Clear + paint the warm-paper gradient FIRST.
    defaults.drawBackground(ts);

    // Mark that Bauhaus drew this frame (active-theme guard for clicks).
    lastBgTs = ts;

    // Real-time delta, clamped so a backgrounded tab doesn't jump.
    let dt = (ts - lastBg) / 1000;
    lastBg = ts;
    if (!(dt > 0)) dt = 0;
    if (dt > 0.1) dt = 0.1;

    // (Re)seed the pool on first run or viewport resize.
    if (shapes.length === 0 ||
        seededViewport.w !== width || seededViewport.h !== height) {
      seededViewport = { w: width, h: height };
      if (shapes.length === 0) {
        ensureCount(BASE_COUNT, width, height);
        reassignTargets(MODES[modeIndex], width, height);
      } else {
        // Keep shapes but rebase targets into the new viewport.
        reassignTargets(MODES[modeIndex], width, height);
      }
    }

    // Easing factor toward target positions (smooth "snap to pattern").
    const ease = 1 - Math.exp(-3.5 * dt);

    ctx.save();
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
    ctx.lineJoin = "miter";
    ctx.globalAlpha = 0.9;

    for (let i = 0; i < shapes.length; i++) {
      const s = shapes[i];

      // Slow drift, then ease toward the arrangement target.
      s.tx += s.vx * dt;
      s.ty += s.vy * dt;

      // Wrap drifting targets so shapes stay roughly on-screen.
      const pad = s.size;
      if (s.tx < -pad) { s.tx = width + pad; s.x = s.tx; }
      else if (s.tx > width + pad) { s.tx = -pad; s.x = s.tx; }
      if (s.ty < -pad) { s.ty = height + pad; s.y = s.ty; }
      else if (s.ty > height + pad) { s.ty = -pad; s.y = s.ty; }

      s.x += (s.tx - s.x) * ease;
      s.y += (s.ty - s.y) * ease;
      s.rot += s.spin * dt;

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      paintShape(ctx, s);
      ctx.restore();
    }

    ctx.restore();

    // Hygiene before returning.
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";
  }

  // ── Click interaction: multiply shapes + reorganize into a new pattern ──
  // Bind ONCE; act only when Bauhaus actually drew the background recently.
  if (!window.__bauhausBgClickBound) {
    window.__bauhausBgClickBound = true;
    window.addEventListener("click", function () {
      // Active-theme guard: ignore clicks unless Bauhaus drew very recently.
      if (performance.now() - lastBgTs > 250) return;

      const w = seededViewport.w || window.innerWidth;
      const h = seededViewport.h || window.innerHeight;

      // Advance the arrangement and multiply the count.
      modeIndex = (modeIndex + 1) % MODES.length;

      let next = Math.min(MAX_COUNT, Math.round(shapes.length * 1.6) + 2);
      if (shapes.length >= MAX_COUNT) {
        // Loop: reset to base count with a fresh pattern (never unbounded).
        next = BASE_COUNT;
      }
      ensureCount(next, w, h);

      // Re-assign target positions/velocities to the NEW arrangement; the
      // per-frame easing in drawBackground animates the smooth snap.
      reassignTargets(MODES[modeIndex], w, h);
    });
  }

  window.MYNYL_THEME_MODULES["bauhaus-werkstatt"] = {
    drawRecord: drawRecord,
    drawBackground: drawBackground,
  };
})();
